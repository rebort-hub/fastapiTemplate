#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from sqlmodel import Field, SQLModel

from app.common.constants import MenuType


class SysMenu(SQLModel, table=True):
    __tablename__ = "system_menu"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=64)
    type: MenuType = Field(default=MenuType.PAGE)
    icon: str = Field(default="", max_length=64)
    order: int = Field(default=1)
    permission: str = Field(default="", max_length=128, index=True)
    route_name: str | None = Field(default=None, max_length=128)
    route_path: str | None = Field(default=None, max_length=255)
    component_path: str | None = Field(default=None, max_length=255)
    redirect: str | None = Field(default=None, max_length=255)
    link: str | None = Field(default=None, max_length=500)
    is_iframe: bool = Field(default=False)
    show_badge: bool = Field(default=False)
    show_text_badge: str | None = Field(default=None, max_length=20)
    parent_id: int | None = Field(default=None, foreign_key="system_menu.id")
    available: bool = Field(default=True)
    hidden: bool = Field(default=False)
