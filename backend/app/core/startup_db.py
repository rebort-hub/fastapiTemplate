#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
"""启动阶段数据库连通性、自动建表与检查。

表结构演进请用 Alembic（`python main.py revision` / `python main.py upgrade`），
不要在此处手写 ALTER / 补列。
"""

from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel

from app.config.config import settings
from app.core.db import engine
from app.core.models_registry import get_registered_table_names, load_all_models
from app.utils.logging import get_logger

log = get_logger(__name__)


def init_database() -> None:
    if settings.DATABASE_URI:
        log.info("检查数据库连接: %s", _mask_database_url(settings.DATABASE_URI))
    else:
        log.info(
            "检查数据库连接 | %s @ %s:%s/%s",
            settings.DATABASE_TYPE,
            settings.DATABASE_HOST,
            settings.DATABASE_PORT,
            settings.DATABASE_NAME,
        )
    with Session(engine) as session:
        session.execute(text("SELECT 1"))
        session.commit()
    log.info("数据库连接正常")

    log.info("扫描 ORM 模型模块")
    model_modules = load_all_models()
    log.info("ORM 模型加载完成 | 模块=%d", len(model_modules))

    registered = get_registered_table_names()
    log.info("ORM 已注册 %d 张表: %s", len(registered), ", ".join(registered))

    if settings.AUTO_CREATE_TABLES:
        _create_all_tables(registered)
    else:
        log.info("AUTO_CREATE_TABLES=false，跳过自动建表")

    _verify_tables(registered)


def _create_all_tables(registered: list[str]) -> None:
    """仅创建尚不存在的表；不会 ALTER 已有表。"""
    inspector = inspect(engine)
    existing_before = set(inspector.get_table_names())
    missing_before = [t for t in registered if t not in existing_before]

    if not missing_before:
        log.info("自动建表 | 全部 %d 张表已存在", len(registered))
    else:
        log.info(
            "自动建表 | 缺失 %d 张表，执行 SQLModel.metadata.create_all",
            len(missing_before),
        )
        for table in missing_before:
            log.info("  + 待创建: %s", table)

        SQLModel.metadata.create_all(engine)

        existing_after = set(inspect(engine).get_table_names())
        created = [
            t for t in registered if t in existing_after and t not in existing_before
        ]
        failed = [t for t in missing_before if t not in existing_after]

        for table in created:
            log.info("  [OK] 表 %s 创建成功", table)
        for table in failed:
            log.error("  [FAIL] 表 %s 创建失败", table)

        if failed:
            raise RuntimeError(f"自动建表失败: {', '.join(failed)}")
        log.info("自动建表完成 | 新建 %d 张", len(created))


def _verify_tables(registered: list[str]) -> None:
    existing = set(inspect(engine).get_table_names())
    missing = [t for t in registered if t not in existing]

    if missing:
        log.warning("数据表检查未通过 | 仍缺少: %s", ", ".join(missing))
        log.warning("可开启 AUTO_CREATE_TABLES 或执行: python main.py upgrade")
        return

    log.info("数据表检查通过（%d/%d）", len(registered), len(registered))
    for table in registered:
        log.info("  [OK] %s", table)


def _mask_database_url(url: str) -> str:
    if "@" not in url:
        return url
    scheme, rest = url.split("://", 1)
    creds, host_part = rest.split("@", 1)
    if ":" in creds:
        user = creds.split(":", 1)[0]
        return f"{scheme}://{user}:***@{host_part}"
    return f"{scheme}://***@{host_part}"
