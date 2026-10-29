#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from sqlmodel import Field, SQLModel


class SysDept(SQLModel, table=True):
    __tablename__ = "system_dept"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=64)
    order: int = Field(default=1)
    parent_id: int | None = Field(default=None, foreign_key="system_dept.id")
    available: bool = Field(default=True)
    description: str | None = Field(default=None, max_length=255)
