#!/usr/bin/env python
# -*- coding: utf-8 -*-
#author：罗伯特
"""后端 CLI 入口：启动服务"""

from __future__ import annotations
from typing import Annotated
import typer
import uvicorn
from app.config.config import BACKEND_DIR, settings
from app.utils.logging import setup_logging

shell_app = typer.Typer(help="FastAPI Template 后端 CLI")


def _alembic():
    from alembic import command
    from alembic.config import Config

    return command, Config("alembic.ini")


@shell_app.command()
def run(
    host: Annotated[str | None, typer.Option(help="监听地址，默认读 SERVER_HOST")] = None,
    port: Annotated[int | None, typer.Option(help="监听端口，默认读 SERVER_PORT")] = None,
    reload: Annotated[
        bool | None,
        typer.Option(help="开发热重载，默认 DEBUG=true 时开启"),
    ] = None,
) -> None:
    """启动 API 服务（ASGI 工厂：app.main:create_app）。"""
    bind_host = host if host is not None else settings.SERVER_HOST
    bind_port = port if port is not None else settings.SERVER_PORT
    use_reload = reload if reload is not None else settings.DEBUG
    if not settings.DEBUG:
        use_reload = False
    setup_logging()
    typer.echo(
        f"启动 {settings.PROJECT_NAME} @ {bind_host}:{bind_port} (reload={use_reload})"
    )
    # 业务 DEBUG 由 Loguru 控制；uvicorn/watchfiles 固定 info，避免热重载刷屏
    reload_dirs = [str(BACKEND_DIR / "app")] if use_reload else None
    reload_excludes = (
        ["**/__pycache__/**", "**/*.pyc", "**/*.log"] if use_reload else None
    )
    uvicorn.run(
        "app.main:create_app",
        host=bind_host,
        port=bind_port,
        reload=use_reload,
        reload_dirs=reload_dirs,
        reload_excludes=reload_excludes,
        factory=True,
        log_level="info",
    )


@shell_app.command()
def seed() -> None:
    """写入种子数据（超级管理员、菜单、角色等）。"""
    setup_logging()
    from app.seed import run_seed

    run_seed()


@shell_app.command(name="upgrade")
def alembic_upgrade(
    revision: Annotated[str, typer.Option("-r", "--revision", help="目标版本")] = "head",
) -> None:
    """执行 Alembic 迁移。"""
    command, cfg = _alembic()
    command.upgrade(cfg, revision)
    typer.echo(f"迁移已应用至 {revision}")


@shell_app.command(name="revision")
def alembic_revision(
    message: Annotated[str, typer.Option("-m", "--message", help="迁移描述")] = "迁移脚本",
) -> None:
    """生成 Alembic 迁移脚本。"""
    command, cfg = _alembic()
    command.revision(cfg, autogenerate=True, message=message)
    typer.echo("迁移脚本已生成，请检查 app/alembic/versions/")


if __name__ == "__main__":
    shell_app()
