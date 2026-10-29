#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from typing import Annotated

from fastapi import APIRouter, Body, Depends, Path

from app.api.v1.system.menu.schema import (
    MenuBatchStatusIn,
    MenuCreate,
    MenuOptionOut,
    MenuOut,
    MenuUpdate,
    Message,
)
from app.api.v1.system.menu.service import MenuService
from app.core.crud import AuthContext
from app.core.deps import AuthPermission, CurrentUser, SessionDep

router = APIRouter()


@router.get("/list", summary="查询菜单列表", response_model=list[MenuOut])
def list_menus(
    session: SessionDep,
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:menu:query"], check_data_scope=False)),
    ],
) -> list[MenuOut]:
    return MenuService.list_menus(session)


@router.get("/options", summary="查询菜单选项", response_model=list[MenuOptionOut])
def list_menu_options(
    session: SessionDep,
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:menu:query"], check_data_scope=False)),
    ],
) -> list[MenuOptionOut]:
    return MenuService.list_options(session)


@router.get("/routes", summary="查询当前用户路由菜单", response_model=list[MenuOut])
def list_my_route_menus(
    session: SessionDep,
    current_user: CurrentUser,
) -> list[MenuOut]:
    """返回当前用户可访问的路由菜单树。"""
    return MenuService.get_user_route_menus(session, current_user)


@router.post("/", summary="创建菜单", response_model=MenuOut)
def create_menu(
    session: SessionDep,
    body: Annotated[MenuCreate, Body(description="菜单创建参数")],
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:menu:create"], check_data_scope=False)),
    ],
) -> MenuOut:
    return MenuService.create_menu(session, body)


@router.patch("/batch/status", summary="批量修改菜单状态", response_model=Message)
def batch_update_menu_status(
    session: SessionDep,
    body: Annotated[MenuBatchStatusIn, Body(description="菜单状态设置")],
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:menu:update"], check_data_scope=False)),
    ],
) -> Message:
    count = MenuService.batch_update_status(session, body)
    action = "启用" if body.available else "停用"
    return Message(message=f"已{action} {count} 项")


@router.patch("/{menu_id}", summary="修改菜单", response_model=MenuOut)
def update_menu(
    session: SessionDep,
    menu_id: Annotated[int, Path(description="菜单ID", ge=1)],
    body: Annotated[MenuUpdate, Body(description="菜单修改参数")],
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:menu:update"], check_data_scope=False)),
    ],
) -> MenuOut:
    return MenuService.update_menu(session, menu_id, body)


@router.delete("/{menu_id}", summary="删除菜单", response_model=Message)
def delete_menu(
    session: SessionDep,
    menu_id: Annotated[int, Path(description="菜单ID", ge=1)],
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:menu:delete"], check_data_scope=False)),
    ],
) -> Message:
    MenuService.delete_menu(session, menu_id)
    return Message(message="删除成功")
