#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from pydantic import BaseModel, Field


class PositionOut(BaseModel):
    id: int
    name: str
    order: int
    available: bool
    description: str | None = None

    model_config = {"from_attributes": True}


class PositionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)
    order: int = 1
    available: bool = True
    description: str | None = None


class PositionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=64)
    order: int | None = None
    available: bool | None = None
    description: str | None = None


class PositionBatchStatusIn(BaseModel):
    ids: list[int] = Field(min_length=1)
    available: bool


class PositionOptionOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class Message(BaseModel):
    message: str
