#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
import uuid
from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


def _utc_now() -> datetime:
    return datetime.now(UTC)


class SysLog(SQLModel, table=True):
    __tablename__ = "system_log"

    id: int | None = Field(default=None, primary_key=True)
    request_path: str = Field(max_length=512, index=True)
    request_method: str = Field(max_length=16)
    request_ip: str | None = Field(default=None, max_length=64)
    request_browser: str | None = Field(default=None, max_length=255)
    request_os: str | None = Field(default=None, max_length=128)
    request_payload: str | None = Field(default=None, max_length=4000)
    response_code: int = Field(default=200, index=True)
    response_json: str | None = Field(default=None, max_length=4000)
    process_time: float = Field(default=0)  # seconds
    creator_id: uuid.UUID | None = Field(default=None, foreign_key="system_user.id")
    creator_name: str | None = Field(default=None, max_length=128)
    created_at: datetime = Field(default_factory=_utc_now, index=True)
