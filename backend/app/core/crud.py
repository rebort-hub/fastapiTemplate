#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
"""同步 CRUD 基类：自动注入数据权限过滤。"""

from __future__ import annotations
from typing import Any, Generic, TypeVar
from pydantic import BaseModel
from sqlmodel import Session, SQLModel, col, select
from app.core.permission import Permission

ModelT = TypeVar("ModelT", bound=SQLModel)
CreateT = TypeVar("CreateT", bound=BaseModel)
UpdateT = TypeVar("UpdateT", bound=BaseModel)


class AuthContext:
    """请求级鉴权上下文（接口权限 + 数据范围开关）。"""

    def __init__(
        self,
        *,
        user: Any,
        session: Session,
        check_data_scope: bool = True,
    ) -> None:
        self.user = user
        self.session = session
        self.check_data_scope = check_data_scope


class CRUDBase(Generic[ModelT, CreateT, UpdateT]):
    """通用 CRUD：list/get/update/delete 自动按 data_scope 过滤。"""

    def __init__(self, model: type[ModelT], auth: AuthContext) -> None:
        self.model = model
        self.auth = auth
        self.session = auth.session

    def _apply_scope(self, stmt: Any) -> Any:
        return Permission(
            session=self.session,
            user=self.auth.user,
            model=self.model,
            check_data_scope=self.auth.check_data_scope,
        ).filter_statement(stmt)

    def get(self, **kwargs: Any) -> ModelT | None:
        conditions = [
            getattr(self.model, key) == value for key, value in kwargs.items()
        ]
        stmt = select(self.model).where(*conditions)
        stmt = self._apply_scope(stmt)
        return self.session.exec(stmt).first()

    def list(
        self,
        *,
        where: list[Any] | None = None,
        order_by: list[Any] | None = None,
        offset: int = 0,
        limit: int | None = None,
    ) -> list[ModelT]:
        stmt = select(self.model)
        if where:
            stmt = stmt.where(*where)
        stmt = self._apply_scope(stmt)
        if order_by:
            stmt = stmt.order_by(*order_by)
        if offset:
            stmt = stmt.offset(offset)
        if limit is not None:
            stmt = stmt.limit(limit)
        return list(self.session.exec(stmt).all())

    def create(self, obj_in: CreateT | dict[str, Any]) -> ModelT:
        data = obj_in if isinstance(obj_in, dict) else obj_in.model_dump()
        obj = self.model(**data)
        if hasattr(obj, "created_id") and self.auth.user is not None:
            if getattr(obj, "created_id", None) is None:
                obj.created_id = self.auth.user.id
        self.session.add(obj)
        self.session.commit()
        self.session.refresh(obj)
        return obj

    def update(self, *, db_obj: ModelT, obj_in: UpdateT | dict[str, Any]) -> ModelT:
        data = (
            obj_in
            if isinstance(obj_in, dict)
            else obj_in.model_dump(exclude_unset=True)
        )
        for key, value in data.items():
            setattr(db_obj, key, value)
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def delete_by_ids(self, ids: list[Any]) -> int:
        id_attr = getattr(self.model, "id")
        stmt = select(self.model).where(col(id_attr).in_(ids))
        stmt = self._apply_scope(stmt)
        rows = list(self.session.exec(stmt).all())
        for row in rows:
            self.session.delete(row)
        self.session.commit()
        return len(rows)
