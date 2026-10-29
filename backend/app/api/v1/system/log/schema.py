#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
import uuid
from datetime import datetime

from pydantic import BaseModel


class LogOut(BaseModel):
    id: int
    request_path: str
    request_method: str
    request_ip: str | None
    request_browser: str | None
    request_os: str | None
    request_payload: str | None
    response_code: int
    response_json: str | None
    process_time: float
    creator_id: uuid.UUID | None
    creator_name: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class LogsPublic(BaseModel):
    data: list[LogOut]
    count: int
