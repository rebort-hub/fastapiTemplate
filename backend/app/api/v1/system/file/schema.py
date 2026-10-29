#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class FileOut(BaseModel):
    id: int
    name: str
    original_name: str
    file_url: str
    file_size: int
    content_type: str
    storage_type: str
    uploader_id: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}


class FilesPublic(BaseModel):
    data: list[FileOut]
    count: int


class FileStatistics(BaseModel):
    total_count: int
    total_size: int
    storage_type: str = "local"
    max_size_mb: int = 50


class FileBatchDeleteIn(BaseModel):
    ids: list[int] = Field(min_length=1)


class Message(BaseModel):
    message: str
