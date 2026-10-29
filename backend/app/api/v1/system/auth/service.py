#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from datetime import timedelta
from fastapi import HTTPException
from sqlmodel import Session
from app.api.v1.system.user.model import UserRepository
from app.api.v1.system.user.schema import UserUpdate
from app.config.config import settings
from app.core import security
from app.utils.email import (
    generate_password_reset_token,
    generate_reset_password_email,
    send_email,
    verify_password_reset_token,
)


class AuthService:
    @staticmethod
    def login(*, session: Session, email: str, password: str) -> str:
        user = UserRepository.authenticate(session=session, email=email, password=password)
        if not user:
            raise HTTPException(status_code=400, detail="邮箱或密码错误")
        if not user.is_active:
            raise HTTPException(status_code=400, detail="用户未激活")
        expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return security.create_access_token(user.id, expires_delta=expires)

    @staticmethod
    def recover_password(*, session: Session, email: str) -> None:
        if not settings.emails_enabled:
            raise HTTPException(
                status_code=400,
                detail="邮件服务未配置完整，请在 env/.env 填写 SMTP_HOST/SMTP_USER/SMTP_PASSWORD/EMAILS_FROM_EMAIL",
            )
        user = UserRepository.get_by_email(session=session, email=email)
        if not user:
            raise HTTPException(status_code=404, detail="该邮箱未注册")
        password_reset_token = generate_password_reset_token(email=email)
        email_data = generate_reset_password_email(
            email_to=user.email,
            email=email,
            token=password_reset_token,
        )
        try:
            send_email(
                email_to=user.email,
                subject=email_data.subject,
                html_content=email_data.html_content,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"邮件发送失败：{exc}",
            ) from exc

    @staticmethod
    def reset_password(*, session: Session, token: str, new_password: str) -> None:
        email = verify_password_reset_token(token=token)
        if not email:
            raise HTTPException(status_code=400, detail="无效或已过期的令牌")
        user = UserRepository.get_by_email(session=session, email=email)
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        if not user.is_active:
            raise HTTPException(status_code=400, detail="用户未激活")
        UserRepository.update(
            session=session,
            db_user=user,
            user_in=UserUpdate(password=new_password),
        )
