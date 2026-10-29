#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    message: str | None = None


class TokenPayload(BaseModel):
    sub: str | None = None


class PasswordRecoveryIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class PermissionsOut(BaseModel):
    permissions: list[str]
