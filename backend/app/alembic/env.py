"""Alembic 运行环境（同步引擎，与业务 SQLModel 一致）。

日常请用 CLI：
  python main.py revision -m "描述"
  python main.py upgrade
"""

from __future__ import annotations

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlmodel import SQLModel

from app.config.config import settings
from app.core.models_registry import load_all_models

# 确保全部模型已注册到 metadata
load_all_models()

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata
config.set_main_option("sqlalchemy.url", str(settings.DATABASE_URL))


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
            render_as_batch=True,
            include_name=_include_name,
        )
        with context.begin_transaction():
            context.run_migrations()


def _include_name(name: str | None, type_: str, parent_names: dict) -> bool:
    """只对比 metadata 中的表，忽略库里其它表。"""
    if type_ == "table":
        return name in target_metadata.tables
    return True


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
