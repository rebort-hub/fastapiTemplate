#!/usr/bin/env python
# -*- coding: utf-8 -*-
#author：罗伯特
"""ASGI 入口：支持 ``app.main:app`` 与 ``app.main:create_app``（factory）。

注意：不要在模块顶层调用 ``create_app()``。uvicorn ``factory=True`` 导入本模块后再调
工厂函数；若导入时已建应用，路由注册日志会打印两遍。
"""

from __future__ import annotations

from typing import Any

from app.core.init_app import create_app

__all__ = ["app", "create_app"]

_app: Any = None


def __getattr__(name: str) -> Any:
    global _app
    if name == "app":
        if _app is None:
            _app = create_app()
        return _app
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
