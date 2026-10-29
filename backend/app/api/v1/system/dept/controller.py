#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from typing import Annotated

from fastapi import APIRouter, Body, Depends, Path

from app.api.v1.system.dept.schema import (
    DeptBatchStatusIn,
    DeptCreate,
    DeptOptionOut,
    DeptOut,
    DeptUpdate,
    Message,
)
from app.api.v1.system.dept.service import DeptService
from app.core.crud import AuthContext
from app.core.deps import AuthPermission, SessionDep

router = APIRouter()


@router.get("/list", summary="查询部门列表", response_model=list[DeptOut])
def list_depts(
    session: SessionDep,
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:dept:query"], check_data_scope=False)),
    ],
) -> list[DeptOut]:
    return DeptService.list_depts(session)


@router.get("/options", summary="查询部门选项", response_model=list[DeptOptionOut])
def list_dept_options(
    session: SessionDep,
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:dept:query"], check_data_scope=False)),
    ],
) -> list[DeptOptionOut]:
    return DeptService.list_options(session)


@router.post("/", summary="创建部门", response_model=DeptOut)
def create_dept(
    session: SessionDep,
    body: Annotated[DeptCreate, Body(description="部门创建参数")],
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:dept:create"], check_data_scope=False)),
    ],
) -> DeptOut:
    return DeptService.create_dept(session, body)


@router.patch("/batch/status", summary="批量修改部门状态", response_model=Message)
def batch_update_dept_status(
    session: SessionDep,
    body: Annotated[DeptBatchStatusIn, Body(description="部门状态设置")],
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:dept:update"], check_data_scope=False)),
    ],
) -> Message:
    count = DeptService.batch_update_status(session, body)
    action = "启用" if body.available else "停用"
    return Message(message=f"已{action} {count} 项")


@router.patch("/{dept_id}", summary="修改部门", response_model=DeptOut)
def update_dept(
    session: SessionDep,
    dept_id: Annotated[int, Path(description="部门ID", ge=1)],
    body: Annotated[DeptUpdate, Body(description="部门修改参数")],
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:dept:update"], check_data_scope=False)),
    ],
) -> DeptOut:
    return DeptService.update_dept(session, dept_id, body)


@router.delete("/{dept_id}", summary="删除部门", response_model=Message)
def delete_dept(
    session: SessionDep,
    dept_id: Annotated[int, Path(description="部门ID", ge=1)],
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:dept:delete"], check_data_scope=False)),
    ],
) -> Message:
    DeptService.delete_dept(session, dept_id)
    return Message(message="删除成功")
