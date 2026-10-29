#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from sqlmodel import Field, SQLModel


class SysPosition(SQLModel, table=True):
    __tablename__ = "system_position"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=64, unique=True, index=True)
    order: int = Field(default=1)
    available: bool = Field(default=True)
    description: str | None = Field(default=None, max_length=255)
