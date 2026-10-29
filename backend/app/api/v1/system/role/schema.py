#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from pydantic import BaseModel, Field


class RoleOut(BaseModel):
    id: int
    code: str
    name: str
    available: bool
    description: str | None = None
    data_scope: int = 1

    model_config = {"from_attributes": True}


class RoleCreate(BaseModel):
    code: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=128)
    available: bool = True
    description: str | None = None
    data_scope: int = Field(default=1, ge=1, le=5)


class RoleUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=64)
    name: str | None = Field(default=None, min_length=1, max_length=128)
    available: bool | None = None
    description: str | None = None
    data_scope: int | None = Field(default=None, ge=1, le=5)


class RoleBatchStatusIn(BaseModel):
    ids: list[int] = Field(min_length=1)
    available: bool


class RoleOptionOut(BaseModel):
    id: int
    code: str
    name: str

    model_config = {"from_attributes": True}


class RolePermissionOut(BaseModel):
    role_id: int
    menu_ids: list[int]
    data_scope: int
    dept_ids: list[int] = Field(default_factory=list)


class RolePermissionIn(BaseModel):
    menu_ids: list[int] = Field(default_factory=list)
    data_scope: int = Field(default=1, ge=1, le=5)
    dept_ids: list[int] = Field(default_factory=list)


class Message(BaseModel):
    message: str
