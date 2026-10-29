#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from sqlmodel import Field, SQLModel


class SysRole(SQLModel, table=True):
    __tablename__ = "system_role"

    id: int | None = Field(default=None, primary_key=True)
    code: str = Field(max_length=64, unique=True, index=True)
    name: str = Field(max_length=128)
    available: bool = Field(default=True)
    description: str | None = Field(default=None, max_length=255)
    # 1本人 2本部门 3本部门及以下 4全部 5自定义
    data_scope: int = Field(default=1)
