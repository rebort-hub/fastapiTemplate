#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
"""记录系统操作日志的中间件（失败不影响主请求）。"""

from __future__ import annotations

import time
from collections.abc import Callable
from uuid import UUID

import jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config.config import settings
from app.core.db import engine
from app.core.security import ALGORITHM
from app.utils.logging import get_logger

log = get_logger(__name__)

_SKIP_PREFIXES = (
    "/docs",
    "/redoc",
    "/openapi.json",
    "/favicon.ico",
    f"{settings.API_V1_STR}/utils/health-check",
    f"{settings.API_V1_STR}/system/log",
    f"{settings.API_V1_STR}/system/menu/routes",
    f"{settings.API_V1_STR}/system/auth/login",
)


def _should_skip(path: str) -> bool:
    if not path.startswith(settings.API_V1_STR):
        return True
    return any(path.startswith(p) for p in _SKIP_PREFIXES)


def _truncate(text: str | None, limit: int = 3500) -> str | None:
    if text is None:
        return None
    return text if len(text) <= limit else text[:limit] + "…"


def _guess_browser(ua: str) -> str | None:
    if not ua:
        return None
    for name in ("Edg", "Chrome", "Firefox", "Safari", "Opera"):
        if name in ua:
            return name
    return ua[:64]


def _guess_os(ua: str) -> str | None:
    if not ua:
        return None
    for name in ("Windows", "Mac OS", "Android", "iPhone", "Linux"):
        if name in ua:
            return name
    return None


class OperationLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.method == "OPTIONS" or _should_skip(request.url.path):
            return await call_next(request)

        started = time.perf_counter()
        body_preview = ""
        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            try:
                raw = await request.body()
                body_preview = raw.decode("utf-8", errors="ignore")[:3500]

                async def receive() -> dict:
                    return {"type": "http.request", "body": raw, "more_body": False}

                request = Request(request.scope, receive)
            except Exception:
                body_preview = ""

        response = await call_next(request)
        elapsed = time.perf_counter() - started

        # GET 成功不记，减少噪音
        if request.method == "GET" and 200 <= response.status_code < 400:
            return response

        try:
            self._persist(request, response, body_preview, elapsed)
        except Exception:
            log.exception("写入操作日志失败")
        return response

    def _persist(
        self,
        request: Request,
        response: Response,
        body_preview: str,
        elapsed: float,
    ) -> None:
        from sqlmodel import Session

        from app.api.v1.system.log.model import SysLog
        from app.api.v1.system.user.model import User

        ua_raw = request.headers.get("user-agent", "")
        creator_id = None
        creator_name = None
        auth = request.headers.get("authorization") or ""
        if auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1]
            try:
                payload = jwt.decode(
                    token, settings.SECRET_KEY, algorithms=[ALGORITHM]
                )
                sub = payload.get("sub")
                if sub:
                    with Session(engine) as session:
                        user = session.get(User, UUID(str(sub)))
                        if user:
                            creator_id = user.id
                            creator_name = user.full_name or user.email
            except Exception:
                pass

        client = request.client.host if request.client else None
        with Session(engine) as session:
            session.add(
                SysLog(
                    request_path=str(request.url.path),
                    request_method=request.method,
                    request_ip=client,
                    request_browser=_guess_browser(ua_raw),
                    request_os=_guess_os(ua_raw),
                    request_payload=_truncate(body_preview or None),
                    response_code=response.status_code,
                    response_json=None,
                    process_time=round(elapsed, 4),
                    creator_id=creator_id,
                    creator_name=creator_name,
                )
            )
            session.commit()
