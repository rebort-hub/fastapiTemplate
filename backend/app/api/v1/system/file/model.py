#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
import uuid
from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


def _utc_now() -> datetime:
    return datetime.now(UTC)


class SysFile(SQLModel, table=True):
    __tablename__ = "system_file"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, index=True)
    original_name: str = Field(max_length=255)
    file_path: str = Field(max_length=512)
    file_url: str = Field(max_length=512)
    file_size: int = Field(default=0)  # bytes
    content_type: str = Field(default="", max_length=128)
    storage_type: str = Field(default="local", max_length=32)
    uploader_id: uuid.UUID | None = Field(default=None, foreign_key="system_user.id")
    created_at: datetime = Field(default_factory=_utc_now)
