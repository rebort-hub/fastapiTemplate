#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from typing import Annotated

from fastapi import APIRouter, Body, Depends, Path, Query

from app.api.v1.system.position.schema import (
    Message,
    PositionBatchStatusIn,
    PositionCreate,
    PositionOptionOut,
    PositionOut,
    PositionUpdate,
)
from app.api.v1.system.position.service import PositionService
from app.core.crud import AuthContext
from app.core.deps import AuthPermission, SessionDep

router = APIRouter()


@router.get("/list", summary="查询岗位列表", response_model=list[PositionOut])
def list_positions(
    session: SessionDep,
    _auth: Annotated[
        AuthContext,
        Depends(
            AuthPermission(permissions=["system:position:query"], check_data_scope=False)
        ),
    ],
    name: Annotated[str | None, Query(description="岗位名称")] = None,
    available: Annotated[bool | None, Query(description="是否启用")] = None,
) -> list[PositionOut]:
    return PositionService.list_positions(
        session, name=name, available=available
    )


@router.get("/options", summary="查询岗位选项", response_model=list[PositionOptionOut])
def list_position_options(
    session: SessionDep,
    _auth: Annotated[
        AuthContext,
        Depends(
            AuthPermission(permissions=["system:position:query"], check_data_scope=False)
        ),
    ],
) -> list[PositionOptionOut]:
    return PositionService.list_options(session)


@router.post("/", summary="创建岗位", response_model=PositionOut)
def create_position(
    session: SessionDep,
    body: Annotated[PositionCreate, Body(description="岗位创建参数")],
    _auth: Annotated[
        AuthContext,
        Depends(
            AuthPermission(permissions=["system:position:create"], check_data_scope=False)
        ),
    ],
) -> PositionOut:
    return PositionService.create_position(session, body)


@router.patch("/batch/status", summary="批量修改岗位状态", response_model=Message)
def batch_update_position_status(
    session: SessionDep,
    body: Annotated[PositionBatchStatusIn, Body(description="岗位状态设置")],
    _auth: Annotated[
        AuthContext,
        Depends(
            AuthPermission(permissions=["system:position:update"], check_data_scope=False)
        ),
    ],
) -> Message:
    count = PositionService.batch_update_status(session, body)
    action = "启用" if body.available else "停用"
    return Message(message=f"已{action} {count} 项")


@router.patch("/{position_id}", summary="修改岗位", response_model=PositionOut)
def update_position(
    session: SessionDep,
    position_id: Annotated[int, Path(description="岗位ID", ge=1)],
    body: Annotated[PositionUpdate, Body(description="岗位修改参数")],
    _auth: Annotated[
        AuthContext,
        Depends(
            AuthPermission(permissions=["system:position:update"], check_data_scope=False)
        ),
    ],
) -> PositionOut:
    return PositionService.update_position(session, position_id, body)


@router.delete("/{position_id}", summary="删除岗位", response_model=Message)
def delete_position(
    session: SessionDep,
    position_id: Annotated[int, Path(description="岗位ID", ge=1)],
    _auth: Annotated[
        AuthContext,
        Depends(
            AuthPermission(permissions=["system:position:delete"], check_data_scope=False)
        ),
    ],
) -> Message:
    PositionService.delete_position(session, position_id)
    return Message(message="删除成功")
