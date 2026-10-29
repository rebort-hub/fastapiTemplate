#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
"""扫描并导入全部 ORM 模型，供 create_all 与 Alembic 使用。"""

from __future__ import annotations

import importlib
from functools import lru_cache
from pathlib import Path

from sqlmodel import SQLModel

from app.config.config import settings
from app.utils.logging import get_logger

log = get_logger(__name__)

# 系统基座模型（固定注册）
from app.api.v1.system.association.model import (  # noqa: E402, F401
    RoleDeptLink,
    RoleMenuLink,
    UserRoleLink,
)
from app.api.v1.system.dept.model import SysDept  # noqa: E402, F401
from app.api.v1.system.file.model import SysFile  # noqa: E402, F401
from app.api.v1.system.log.model import SysLog  # noqa: E402, F401
from app.api.v1.system.menu.model import SysMenu  # noqa: E402, F401
from app.api.v1.system.position.model import SysPosition  # noqa: E402, F401
from app.api.v1.system.role.model import SysRole  # noqa: E402, F401
from app.api.v1.system.user.model import User  # noqa: E402, F401


def _scan_plugin_model_modules() -> list[str]:
    modules: list[str] = []
    plugin_prefix = settings.PLUGIN_PREFIX
    try:
        base_package = importlib.import_module("app.plugin")
        base_dir = Path(next(iter(base_package.__path__)))
        for model_file in sorted(base_dir.rglob("model.py")):
            rel_path = model_file.relative_to(base_dir)
            if not rel_path.parts[0].startswith(plugin_prefix):
                continue
            module_path = f"app.plugin.{'.'.join(rel_path.parts[:-1])}.model"
            modules.append(module_path)
    except Exception:
        log.exception("扫描插件 model.py 失败")
    return modules


@lru_cache
def load_all_models() -> list[str]:
    """导入全部 ORM 模型，返回已加载的模块路径。"""
    loaded = [
        "app.api.v1.system.user.model",
        "app.api.v1.system.menu.model",
        "app.api.v1.system.role.model",
        "app.api.v1.system.dept.model",
        "app.api.v1.system.position.model",
        "app.api.v1.system.file.model",
        "app.api.v1.system.log.model",
        "app.api.v1.system.association.model",
    ]
    for module_path in _scan_plugin_model_modules():
        try:
            importlib.import_module(module_path)
            loaded.append(module_path)
            log.info("  -> 加载 ORM 模型 %s", module_path)
        except Exception:
            log.exception("加载 ORM 模型失败: %s", module_path)
    return loaded


def get_registered_table_names() -> list[str]:
    load_all_models()
    return sorted(SQLModel.metadata.tables.keys())
