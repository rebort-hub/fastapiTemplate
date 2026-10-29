#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query

from app.api.v1.system.user.schema import (
    Message,
    UpdatePassword,
    UserCreate,
    UserPublic,
    UserRegister,
    UserRegisterOut,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)
from app.api.v1.system.user.service import UserService
from app.core.crud import AuthContext
from app.core.deps import AuthPermission, CurrentUser, SessionDep

router = APIRouter()


@router.get("/", summary="查询用户列表", response_model=UsersPublic)
def list_users(
    session: SessionDep,
    auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:user:query"], check_data_scope=True)),
    ],
    skip: Annotated[int, Query(description="跳过条数", ge=0)] = 0,
    limit: Annotated[int, Query(description="每页条数", ge=1, le=200)] = 100,
    email: Annotated[str | None, Query(description="邮箱")] = None,
    full_name: Annotated[str | None, Query(description="姓名")] = None,
    is_active: Annotated[bool | None, Query(description="是否启用")] = None,
) -> Any:
    return UserService.list_users(
        session=session,
        auth=auth,
        skip=skip,
        limit=limit,
        email=email,
        full_name=full_name,
        is_active=is_active,
    )


@router.post("/", summary="创建用户", response_model=UserPublic)
def create_user(
    session: SessionDep,
    user_in: Annotated[UserCreate, Body(description="用户创建参数")],
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:user:create"], check_data_scope=False)),
    ],
) -> Any:
    return UserService.create_user(session=session, user_in=user_in)


@router.post("/register", summary="用户注册", response_model=UserRegisterOut)
def register_user(
    session: SessionDep,
    user_in: Annotated[UserRegister, Body(description="用户注册参数")],
) -> Any:
    user = UserService.register(session=session, user_in=user_in)
    public = UserService.to_public(session, user)
    return UserRegisterOut(**public.model_dump(), message="注册成功")


@router.get("/me", summary="获取当前用户信息", response_model=UserPublic)
def read_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    return UserService.to_public(session, current_user)


@router.patch("/me", summary="修改当前用户信息", response_model=UserPublic)
def update_user_me(
    session: SessionDep,
    user_in: Annotated[UserUpdateMe, Body(description="当前用户修改参数")],
    current_user: CurrentUser,
) -> Any:
    return UserService.update_me(
        session=session, current_user=current_user, user_in=user_in
    )


@router.patch("/me/password", summary="修改当前用户密码", response_model=Message)
def update_password_me(
    session: SessionDep,
    body: Annotated[UpdatePassword, Body(description="密码修改参数")],
    current_user: CurrentUser,
) -> Any:
    UserService.update_password_me(
        session=session, current_user=current_user, body=body
    )
    return Message(message="密码已更新")


@router.delete("/me", summary="删除当前用户账号", response_model=Message)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    UserService.delete_me(session=session, current_user=current_user)
    return Message(message="账号已删除")


@router.get("/{user_id}", summary="查询用户详情", response_model=UserPublic)
def read_user_by_id(
    user_id: Annotated[uuid.UUID, Path(description="用户ID")],
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    if user_id == current_user.id:
        return UserService.to_public(session, current_user)
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="权限不足")
    return UserService.get_user(session=session, user_id=user_id)


@router.patch("/{user_id}", summary="修改用户", response_model=UserPublic)
def update_user(
    session: SessionDep,
    user_id: Annotated[uuid.UUID, Path(description="用户ID")],
    user_in: Annotated[UserUpdate, Body(description="用户修改参数")],
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:user:update"], check_data_scope=False)),
    ],
) -> Any:
    return UserService.update_user(session=session, user_id=user_id, user_in=user_in)


@router.delete("/{user_id}", summary="删除用户", response_model=Message)
def delete_user(
    session: SessionDep,
    current_user: CurrentUser,
    user_id: Annotated[uuid.UUID, Path(description="用户ID")],
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:user:delete"], check_data_scope=False)),
    ],
) -> Any:
    UserService.delete_user(
        session=session, user_id=user_id, current_user=current_user
    )
    return Message(message="用户已删除")
