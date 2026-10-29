#!/usr/bin/env python
# -*- coding: utf-8 -*-
#author：罗伯特
"""日志配置：标准库 logging 经 InterceptHandler 转发到 Loguru"""

from __future__ import annotations

import logging
import sys
from contextvars import ContextVar, Token
from typing import Any

from loguru import logger

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")

_configured = False


def set_request_id(request_id: str) -> Token[str]:
    return request_id_ctx.set(request_id)


def get_request_id() -> str:
    return request_id_ctx.get()


def reset_request_id(token: Token[str]) -> None:
    request_id_ctx.reset(token)


def _context_patcher(record: dict[str, Any]) -> None:
    rid = get_request_id()
    record["extra"]["ctx"] = f" | rid={rid[:8]}" if rid else ""


# uvicorn reload 父进程可能把级别重置为 DEBUG，在转发层直接丢弃更稳妥
_DROP_LOGGER_PREFIXES = ("watchfiles",)


class InterceptHandler(logging.Handler):
    """将标准库 logging 重定向到 Loguru。"""

    def emit(self, record: logging.LogRecord) -> None:
        if record.name.startswith(_DROP_LOGGER_PREFIXES):
            return
        try:
            level: str | int = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = logging.currentframe(), 0
        while frame and (depth == 0 or frame.f_code.co_filename == logging.__file__):
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, "{}", record.getMessage()
        )


def _resolve_level(level: int | str | None) -> str:
    from app.config.config import settings

    if level is None:
        return settings.LOGGER_LEVEL.upper()
    if isinstance(level, str):
        return level.upper()
    name = logging.getLevelName(level)
    return name if isinstance(name, str) else settings.LOGGER_LEVEL.upper()


def setup_logging(level: int | str | None = None, *, force: bool = False) -> None:
    """配置 Loguru，并把 uvicorn / 标准库日志接入同一套输出。"""
    global _configured
    from app.config.config import settings

    if _configured and not force:
        return

    log_level = _resolve_level(level)
    is_prod = settings.ENVIRONMENT == "production"
    log_fmt = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>{extra[ctx]}"
    )

    logger.remove()
    logger.configure(patcher=_context_patcher)
    logger.add(
        sys.stdout,
        format=log_fmt,
        level=log_level,
        backtrace=not is_prod,
        diagnose=not is_prod,
        catch=True,
        enqueue=True,
    )

    if settings.LOG_FILE_ENABLE:
        log_dir = settings.LOG_DIR
        log_dir.mkdir(parents=True, exist_ok=True)
        logger.add(
            sink=str(log_dir / "app.log"),
            format=log_fmt,
            level=log_level,
            backtrace=not is_prod,
            diagnose=not is_prod,
            catch=True,
            enqueue=True,
            rotation="00:00",
            retention=f"{settings.LOG_FILE_RETENTION_DAYS} days",
            compression="gz",
            encoding="utf-8",
        )

    logging.basicConfig(handlers=[InterceptHandler()], level=log_level, force=True)
    for name in (
        *[k for k in logging.root.manager.loggerDict if isinstance(k, str)],
        "uvicorn",
        "uvicorn.error",
        "uvicorn.access",
    ):
        std = logging.getLogger(name)
        std.handlers = [InterceptHandler()]
        std.propagate = False

    # 热重载 / 驱动类第三方日志噪音大，DEBUG 下只保留 WARNING+
    for name in (
        "asyncio",
        "websockets",
        "watchfiles",
        "watchfiles.main",
        "sqlalchemy",
        "sqlalchemy.engine",
        "httpx",
        "httpcore",
    ):
        logging.getLogger(name).setLevel(logging.WARNING)

    _configured = True


def get_logger(name: str) -> logging.Logger:
    """返回标准库 Logger（经 InterceptHandler 写入 Loguru）。"""
    return logging.getLogger(name)
