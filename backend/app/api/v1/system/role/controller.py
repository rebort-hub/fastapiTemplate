#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from typing import Annotated

from fastapi import APIRouter, Body, Depends, Path, Query

from app.api.v1.system.role.schema import (
    Message,
    RoleBatchStatusIn,
    RoleCreate,
    RoleOptionOut,
    RoleOut,
    RolePermissionIn,
    RolePermissionOut,
    RoleUpdate,
)
from app.api.v1.system.role.service import RoleService
from app.core.crud import AuthContext
from app.core.deps import AuthPermission, SessionDep

router = APIRouter()


@router.get("/list", summary="查询角色列表", response_model=list[RoleOut])
def list_roles(
    session: SessionDep,
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:role:query"], check_data_scope=False)),
    ],
    name: Annotated[str | None, Query(description="角色名称")] = None,
    available: Annotated[bool | None, Query(description="是否启用")] = None,
) -> list[RoleOut]:
    return RoleService.list_roles(session, name=name, available=available)


@router.get("/options", summary="查询角色选项", response_model=list[RoleOptionOut])
def list_role_options(
    session: SessionDep,
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:role:query"], check_data_scope=False)),
    ],
) -> list[RoleOptionOut]:
    return RoleService.list_options(session)


@router.post("/", summary="创建角色", response_model=RoleOut)
def create_role(
    session: SessionDep,
    body: Annotated[RoleCreate, Body(description="角色创建参数")],
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:role:create"], check_data_scope=False)),
    ],
) -> RoleOut:
    return RoleService.create_role(session, body)


@router.patch("/batch/status", summary="批量修改角色状态", response_model=Message)
def batch_update_role_status(
    session: SessionDep,
    body: Annotated[RoleBatchStatusIn, Body(description="角色状态设置")],
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:role:update"], check_data_scope=False)),
    ],
) -> Message:
    count = RoleService.batch_update_status(session, body)
    action = "启用" if body.available else "停用"
    return Message(message=f"已{action} {count} 项")


@router.get("/{role_id}/permissions", summary="查询角色权限", response_model=RolePermissionOut)
def get_role_permissions(
    session: SessionDep,
    role_id: Annotated[int, Path(description="角色ID", ge=1)],
    _auth: Annotated[
        AuthContext,
        Depends(
            AuthPermission(permissions=["system:role:permission"], check_data_scope=False)
        ),
    ],
) -> RolePermissionOut:
    return RoleService.get_permissions(session, role_id)


@router.put("/{role_id}/permissions", summary="设置角色权限", response_model=RolePermissionOut)
def set_role_permissions(
    session: SessionDep,
    role_id: Annotated[int, Path(description="角色ID", ge=1)],
    body: Annotated[RolePermissionIn, Body(description="角色权限设置")],
    _auth: Annotated[
        AuthContext,
        Depends(
            AuthPermission(permissions=["system:role:permission"], check_data_scope=False)
        ),
    ],
) -> RolePermissionOut:
    return RoleService.set_permissions(session, role_id, body)


@router.patch("/{role_id}", summary="修改角色", response_model=RoleOut)
def update_role(
    session: SessionDep,
    role_id: Annotated[int, Path(description="角色ID", ge=1)],
    body: Annotated[RoleUpdate, Body(description="角色修改参数")],
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:role:update"], check_data_scope=False)),
    ],
) -> RoleOut:
    return RoleService.update_role(session, role_id, body)


@router.delete("/{role_id}", summary="删除角色", response_model=Message)
def delete_role(
    session: SessionDep,
    role_id: Annotated[int, Path(description="角色ID", ge=1)],
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:role:delete"], check_data_scope=False)),
    ],
) -> Message:
    RoleService.delete_role(session, role_id)
    return Message(message="删除成功")
