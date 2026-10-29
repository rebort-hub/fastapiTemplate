#!/usr/bin/env python
# -*- coding: utf-8 -*-
#author：罗伯特
"""种子数据写入（启动时与 CLI 共用）。"""

from __future__ import annotations

import json
from pathlib import Path

from sqlmodel import Session, func, select

from app.api.v1.system.association.model import RoleMenuLink, UserRoleLink
from app.api.v1.system.menu.model import SysMenu
from app.api.v1.system.role.model import SysRole
from app.api.v1.system.user.model import UserRepository
from app.config.config import settings
from app.core.db import engine, init_db
from app.utils.logging import get_logger

log = get_logger(__name__)

MENU_FIELDS = frozenset(
    {
        "id",
        "name",
        "type",
        "icon",
        "order",
        "permission",
        "route_name",
        "route_path",
        "component_path",
        "redirect",
        "parent_id",
        "available",
        "hidden",
    }
)


def _data_dir() -> Path:
    return settings.SEED_DATA_DIR


def _load_json(name: str) -> list[dict]:
    path = _data_dir() / name
    if not path.is_file():
        log.warning("种子文件不存在，跳过: %s", path)
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def _table_is_empty(session: Session, model: type) -> bool:
    return session.exec(select(func.count()).select_from(model)).one() == 0


def seed_superuser(session: Session) -> str:
    log.info("检查超级管理员账号")
    init_db(session)
    return settings.FIRST_SUPERUSER


def seed_roles(session: Session) -> int:
    if not _table_is_empty(session, SysRole):
        count = session.exec(select(func.count()).select_from(SysRole)).one()
        log.info("system_role 已有 %d 条，跳过", count)
        return 0
    rows = _load_json("system_role.json")
    if not rows:
        return 0
    for row in rows:
        session.add(SysRole(**row))
    session.commit()
    log.info("已写入 system_role（%d 条）", len(rows))
    return len(rows)


def seed_menus(session: Session) -> int:
    if not _table_is_empty(session, SysMenu):
        count = session.exec(select(func.count()).select_from(SysMenu)).one()
        log.info("system_menu 已有 %d 条，跳过", count)
        return 0
    rows = _load_json("system_menu.json")
    if not rows:
        return 0
    for row in rows:
        session.add(SysMenu(**{k: v for k, v in row.items() if k in MENU_FIELDS}))
    session.commit()
    log.info("已写入 system_menu（%d 条）", len(rows))
    return len(rows)


def seed_role_menus(session: Session) -> int:
    if not _table_is_empty(session, RoleMenuLink):
        count = session.exec(select(func.count()).select_from(RoleMenuLink)).one()
        log.info("system_role_menu 已有 %d 条，跳过", count)
        return 0
    rows = _load_json("system_role_menus.json")
    if not rows:
        return 0
    for row in rows:
        session.add(RoleMenuLink(**row))
    session.commit()
    log.info("已写入 system_role_menu（%d 条）", len(rows))
    return len(rows)


def seed_superuser_role(session: Session) -> bool:
    user = UserRepository.get_by_email(session=session, email=settings.FIRST_SUPERUSER)
    if not user:
        log.warning("未找到超级管理员，跳过用户角色关联")
        return False
    exists = session.exec(
        select(UserRoleLink).where(
            UserRoleLink.user_id == user.id,
            UserRoleLink.role_id == 1,
        )
    ).first()
    if exists:
        log.info("超级管理员已绑定 admin 角色，跳过")
        return False
    session.add(UserRoleLink(user_id=user.id, role_id=1))
    session.commit()
    log.info("已为超级管理员绑定 admin 角色")
    return True


def run_seed() -> None:
    log.info("开始种子数据初始化")
    with Session(engine) as session:
        email = seed_superuser(session)
        roles = seed_roles(session)
        menus = seed_menus(session)
        role_menus = seed_role_menus(session)
        linked = seed_superuser_role(session)
    log.info(
        "种子数据完成 | 超管=%s | 新增角色=%d | 新增菜单=%d | 新增角色菜单=%d | 绑定超管角色=%s",
        email,
        roles,
        menus,
        role_menus,
        "是" if linked else "否",
    )
