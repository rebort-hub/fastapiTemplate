#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from pydantic import BaseModel, Field, field_validator, model_validator

from app.common.constants import MenuType


class MenuOut(BaseModel):
    id: int
    name: str
    type: MenuType
    icon: str
    order: int
    permission: str
    route_name: str | None
    route_path: str | None
    component_path: str | None
    redirect: str | None
    link: str | None = None
    is_iframe: bool = False
    show_badge: bool = False
    show_text_badge: str | None = None
    parent_id: int | None
    available: bool
    hidden: bool

    model_config = {"from_attributes": True}


class MenuCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)
    type: MenuType = MenuType.PAGE
    icon: str = ""
    order: int = 1
    permission: str = ""
    route_name: str | None = None
    route_path: str | None = None
    component_path: str | None = None
    redirect: str | None = None
    link: str | None = None
    is_iframe: bool = False
    show_badge: bool = False
    show_text_badge: str | None = None
    parent_id: int | None = None
    available: bool = True
    hidden: bool = False

    @field_validator("show_text_badge")
    @classmethod
    def _trim_show_text_badge(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return v.strip() or None

    @model_validator(mode="after")
    def _validate_link_type(self):
        if self.type == MenuType.LINK and not (self.link or "").strip():
            raise ValueError("外链类型必须填写外链地址")
        if self.type != MenuType.LINK:
            self.link = None
            self.is_iframe = False
        if self.type == MenuType.BUTTON:
            self.show_badge = False
            self.show_text_badge = None
        elif not self.show_badge:
            self.show_text_badge = None
        return self


class MenuUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=64)
    type: MenuType | None = None
    icon: str | None = None
    order: int | None = None
    permission: str | None = None
    route_name: str | None = None
    route_path: str | None = None
    component_path: str | None = None
    redirect: str | None = None
    link: str | None = None
    is_iframe: bool | None = None
    show_badge: bool | None = None
    show_text_badge: str | None = None
    parent_id: int | None = None
    available: bool | None = None
    hidden: bool | None = None

    @field_validator("show_text_badge")
    @classmethod
    def _trim_show_text_badge(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return v.strip()


class MenuBatchStatusIn(BaseModel):
    ids: list[int] = Field(min_length=1)
    available: bool


class MenuOptionOut(BaseModel):
    id: int
    name: str
    parent_id: int | None
    type: MenuType

    model_config = {"from_attributes": True}


class Message(BaseModel):
    message: str
