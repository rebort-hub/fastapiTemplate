#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from collections.abc import Generator
from typing import Annotated
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel import Session
from app.api.v1.system.auth.schema import TokenPayload
from app.api.v1.system.user.model import User
from app.common.constants import BizCode
from app.common.exceptions import AppException
from app.config.config import settings
from app.core.crud import AuthContext
from app.core.db import engine
from app.core.permission import PermissionService
from app.core.security import ALGORITHM

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/system/auth/login"
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无法验证凭据",
        )
    user = session.get(User, token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="用户未激活")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_active_superuser(current_user: CurrentUser) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="需要超级管理员权限"
        )
    return current_user


class AuthPermission:
    """接口级菜单权限校验；可开关数据范围过滤（供 CRUDBase / Permission 使用）。"""

    def __init__(
        self,
        permissions: list[str] | None = None,
        *,
        check_data_scope: bool = True,
    ) -> None:
        self.permissions = set(permissions) if permissions else None
        self.check_data_scope = check_data_scope

    def __call__(self, session: SessionDep, current_user: CurrentUser) -> AuthContext:
        if not current_user.is_superuser and self.permissions:
            owned = PermissionService.get_user_permissions(session, current_user.id)
            if not self.permissions <= owned:
                raise AppException(
                    "无权限操作",
                    code=BizCode.FORBIDDEN,
                    status_code=status.HTTP_403_FORBIDDEN,
                )
        return AuthContext(
            user=current_user,
            session=session,
            check_data_scope=self.check_data_scope,
        )
