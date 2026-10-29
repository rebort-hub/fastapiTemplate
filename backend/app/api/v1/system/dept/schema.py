#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from pydantic import BaseModel, Field


class DeptOut(BaseModel):
    id: int
    name: str
    order: int
    parent_id: int | None
    available: bool
    description: str | None = None

    model_config = {"from_attributes": True}


class DeptCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)
    order: int = 1
    parent_id: int | None = None
    available: bool = True
    description: str | None = None


class DeptUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=64)
    order: int | None = None
    parent_id: int | None = None
    available: bool | None = None
    description: str | None = None


class DeptBatchStatusIn(BaseModel):
    ids: list[int] = Field(min_length=1)
    available: bool


class DeptOptionOut(BaseModel):
    id: int
    name: str
    parent_id: int | None

    model_config = {"from_attributes": True}


class Message(BaseModel):
    message: str
