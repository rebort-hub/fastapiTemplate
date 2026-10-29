#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
"""应用初始化：生命周期、路由注册、启动日志。"""

from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.routing import APIRoute

from app.api.v1.system.router import system_router
from app.common.exceptions import register_exception_handlers
from app.config.config import settings
from app.core.discover import _build_router, _scan_plugin_controllers
from app.core.startup_db import init_database
from app.utils.logging import get_logger
from app.utils.routes import router as utils_router

log = get_logger(__name__)
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


def _count_http_routes(app: FastAPI) -> int:
    def walk(routes: list) -> int:
        total = 0
        for route in routes:
            if isinstance(route, APIRoute):
                total += 1
            elif original_router := getattr(route, "original_router", None):
                # FastAPI >=0.115 wraps include_router() as _IncludedRouter
                total += walk(original_router.routes)
            elif hasattr(route, "routes"):
                total += walk(route.routes)
        return total

    return walk(app.routes)


def custom_generate_unique_id(route: APIRoute) -> str:
    tag = route.tags[0] if route.tags else "default"
    return f"{tag}-{route.name}"


def _log_banner() -> None:
    log.info("=" * 60)
    log.info("应用启动 | %s", settings.PROJECT_NAME)
    log.info("环境     | %s", settings.ENVIRONMENT)
    log.info("API 前缀 | %s", settings.API_V1_STR)
    log.info("=" * 60)


def _register_routes(app: FastAPI) -> None:
    from fastapi import APIRouter

    api_router = APIRouter()
    prefix = settings.API_V1_STR

    api_router.include_router(system_router, prefix="/system")
    log.info("已注册系统路由 | %s/system", prefix)

    api_router.include_router(utils_router, prefix="/utils")
    log.info("已注册工具路由 | %s/utils", prefix)

    plugin_routes = _scan_plugin_controllers()
    api_router.include_router(_build_router(plugin_routes))
    mount_prefixes = sorted({r.mount_prefix for r in plugin_routes})
    log.info(
        "已注册业务插件 | 模块=%d | 路由=%d | 挂载=%s",
        len(mount_prefixes),
        len(plugin_routes),
        ", ".join(mount_prefixes) or "无",
    )

    app.include_router(api_router, prefix=prefix)
    log.info("路由注册完成 | 总 HTTP 路由=%d", _count_http_routes(app))


@asynccontextmanager
async def lifespan(app: FastAPI):
    _log_banner()
    try:
        init_database()
        if settings.AUTO_SEED_ON_STARTUP:
            from app.seed import run_seed

            run_seed()
        else:
            log.info("AUTO_SEED_ON_STARTUP=false，跳过种子数据")
    except Exception as exc:
        log.exception("启动初始化失败: %s", exc)
        if settings.ENVIRONMENT != "development":
            raise
        log.warning("开发环境将继续启动，请检查数据库与种子配置")
    log.info("应用就绪，开始接收请求")
    yield
    log.info("应用关闭")


def create_app() -> FastAPI:
    import sentry_sdk
    from starlette.middleware.cors import CORSMiddleware

    from app.utils.logging import setup_logging

    setup_logging()

    if settings.ENVIRONMENT != "development":
        sentry_dsn = getattr(settings, "SENTRY_DSN", None)
        if sentry_dsn:
            sentry_sdk.init(dsn=str(sentry_dsn), enable_tracing=True)

    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        debug=settings.DEBUG,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        generate_unique_id_function=custom_generate_unique_id,
        lifespan=lifespan,
    )

    register_exception_handlers(app)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_HOST],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    from app.core.operation_log import OperationLogMiddleware

    # 操作审计：写操作 / 失败请求
    app.add_middleware(OperationLogMiddleware)

    _register_routes(app)

    if FRONTEND_DIR.is_dir() and any(FRONTEND_DIR.iterdir()):
        app.frontend("/", directory=FRONTEND_DIR)
        log.info("已挂载前端静态资源 | %s", FRONTEND_DIR)

    return app
