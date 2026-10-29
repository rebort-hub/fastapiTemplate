#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query

from app.api.v1.system.log.schema import LogOut, LogsPublic
from app.api.v1.system.log.service import LogService
from app.core.crud import AuthContext
from app.core.deps import AuthPermission, SessionDep

router = APIRouter()


@router.get("/list", summary="查询操作日志列表", response_model=LogsPublic)
def list_logs(
    session: SessionDep,
    auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:log:query"], check_data_scope=True)),
    ],
    skip: Annotated[int, Query(description="跳过条数", ge=0)] = 0,
    limit: Annotated[int, Query(description="每页条数", ge=1, le=200)] = 20,
    request_path: Annotated[str | None, Query(description="请求路径")] = None,
    creator_name: Annotated[str | None, Query(description="操作人")] = None,
    start_date: Annotated[datetime | None, Query(description="开始时间")] = None,
    end_date: Annotated[datetime | None, Query(description="结束时间")] = None,
) -> LogsPublic:
    return LogService.list_logs(
        session,
        auth=auth,
        skip=skip,
        limit=limit,
        request_path=request_path,
        creator_name=creator_name,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/{log_id}", summary="查询操作日志详情", response_model=LogOut)
def get_log(
    log_id: Annotated[int, Path(description="日志ID", ge=1)],
    session: SessionDep,
    auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:log:query"], check_data_scope=True)),
    ],
) -> LogOut:
    row = LogService.get_log(session, log_id, auth=auth)
    if not row:
        raise HTTPException(status_code=404, detail="日志不存在")
    return row
