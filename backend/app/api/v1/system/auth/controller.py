#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from typing import Annotated
from fastapi import APIRouter, Body, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.api.v1.system.auth.schema import (
    PasswordRecoveryIn,
    PermissionsOut,
    ResetPasswordIn,
    Token,
)
from app.api.v1.system.auth.service import AuthService
from app.api.v1.system.user.schema import Message
from app.core.deps import CurrentUser, SessionDep
from app.core.permission import PermissionService

router = APIRouter()


@router.post("/login", summary="用户登录", response_model=Token)
def login(
    session: SessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    access_token = AuthService.login(
        session=session,
        email=form_data.username,
        password=form_data.password,
    )
    return Token(access_token=access_token, message="登录成功")


@router.get("/permissions", summary="获取当前用户权限", response_model=PermissionsOut)
def get_my_permissions(session: SessionDep, current_user: CurrentUser) -> PermissionsOut:
    if current_user.is_superuser:
        return PermissionsOut(permissions=["*"])
    perms = sorted(PermissionService.get_user_permissions(session, current_user.id))
    return PermissionsOut(permissions=perms)


@router.post("/password-recovery", summary="发送密码找回邮件", response_model=Message)
def recover_password(
    session: SessionDep,
    body: Annotated[PasswordRecoveryIn, Body(description="密码找回参数")],
) -> Message:
    AuthService.recover_password(session=session, email=body.email)
    return Message(message="若该邮箱已注册，我们已发送密码找回邮件")


@router.post("/reset-password", summary="重置密码", response_model=Message)
def reset_password(
    session: SessionDep,
    body: Annotated[ResetPasswordIn, Body(description="重置密码参数")],
) -> Message:
    AuthService.reset_password(
        session=session,
        token=body.token,
        new_password=body.new_password,
    )
    return Message(message="密码已更新")
