#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
"""ORM 通用混入字段。"""

from __future__ import annotations

import uuid

from sqlmodel import Field


class CreatedByMixin:
    """行级数据权限依赖的创建人字段。

    业务模型按需多重继承本 Mixin（须放在 SQLModel table 类继承链中），
    配合角色 data_scope 做行过滤。
    """

    created_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="system_user.id",
        index=True,
    )
