#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
"""业务路由发现。"""

from __future__ import annotations

import importlib
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from fastapi import APIRouter
from app.config.config import settings
from app.utils.logging import get_logger

log = get_logger(__name__)


@dataclass(frozen=True)
class PluginRouteInfo:
    module_path: str
    router_name: str
    mount_prefix: str


@dataclass
class PluginDiscoveryResult:
    routes: list[PluginRouteInfo] = field(default_factory=list)
    mount_prefixes: list[str] = field(default_factory=list)
    failed_modules: list[str] = field(default_factory=list)

    @property
    def module_count(self) -> int:
        return len(self.mount_prefixes)

    @property
    def route_count(self) -> int:
        return len(self.routes)


@lru_cache
def _scan_plugin_controllers() -> tuple[PluginRouteInfo, ...]:
    routes: list[PluginRouteInfo] = []
    plugin_prefix = settings.PLUGIN_PREFIX
    prefix_len = len(plugin_prefix)
    failed: list[str] = []

    base_package = importlib.import_module("app.plugin")
    base_dir = Path(next(iter(base_package.__path__)))
    controller_files = sorted(
        p
        for p in base_dir.rglob("controller.py")
        if p.is_file()
        and p.relative_to(base_dir).parts[0].startswith(plugin_prefix)
    )
    log.info(
        "扫描业务插件 | 目录=%s | 前缀=%s | controller 文件=%d",
        base_dir,
        plugin_prefix,
        len(controller_files),
    )

    seen_router_ids: set[int] = set()
    mount_prefixes: set[str] = set()

    for file in controller_files:
        rel_path = file.relative_to(base_dir)
        top_module = rel_path.parts[0]
        suffix = top_module[prefix_len:]
        if not suffix:
            log.error("跳过无效业务模块目录: %s", top_module)
            continue
        mount_prefix = f"/{suffix}"
        mount_prefixes.add(mount_prefix)
        module_path = f"app.plugin.{'.'.join(rel_path.parts[:-1])}.controller"
        try:
            module = importlib.import_module(module_path)
            for attr_name in dir(module):
                attr_value = getattr(module, attr_name, None)
                if not isinstance(attr_value, APIRouter):
                    continue
                router_id = id(attr_value)
                if router_id in seen_router_ids:
                    continue
                seen_router_ids.add(router_id)
                routes.append(
                    PluginRouteInfo(
                        module_path=module_path,
                        router_name=attr_name,
                        mount_prefix=mount_prefix,
                    )
                )
                log.info(
                    "  -> 注册 %s.%s @ %s",
                    module_path,
                    attr_name,
                    mount_prefix,
                )
        except Exception:
            log.exception("加载业务模块失败: %s", module_path)
            failed.append(module_path)

    return tuple(routes)


def _build_router(routes: tuple[PluginRouteInfo, ...]) -> APIRouter:
    root_router = APIRouter()
    container_routers: dict[str, APIRouter] = {}
    for info in routes:
        if info.mount_prefix not in container_routers:
            container_routers[info.mount_prefix] = APIRouter(prefix=info.mount_prefix)
        module = importlib.import_module(info.module_path)
        router = getattr(module, info.router_name)
        container_routers[info.mount_prefix].include_router(router)
    for mount_prefix in sorted(container_routers):
        root_router.include_router(container_routers[mount_prefix])
    return root_router


def discover_plugins() -> PluginDiscoveryResult:
    routes = _scan_plugin_controllers()
    mount_prefixes = sorted({r.mount_prefix for r in routes})
    result = PluginDiscoveryResult(
        routes=list(routes),
        mount_prefixes=mount_prefixes,
    )
    log.info(
        "业务插件扫描完成 | 模块=%d | 路由=%d | 挂载=%s",
        result.module_count,
        result.route_count,
        ", ".join(mount_prefixes) or "无",
    )
    return result
