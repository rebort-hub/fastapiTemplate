#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sqlmodel import Field, Relationship, Session, select

from app.api.v1.system.user.schema import UserBase, UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password

if TYPE_CHECKING:
    from app.plugin.fastadmin_items.items.model import Item


def get_datetime_utc() -> datetime:
    return datetime.now(UTC)


class User(UserBase, table=True):
    __tablename__ = "system_user"
    __table_args__ = {"quote": True}

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    dept_id: int | None = Field(default=None, foreign_key="system_dept.id", index=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        nullable=False,
    )
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)


class UserRepository:
    @staticmethod
    def create(*, session: Session, user_create: UserCreate) -> User:
        # 勿用 model_validate：User 上 Relationship 名为 items，
        # 会与 dict.items 冲突并触发 “builtin_function_or_method is not list-like”
        data = user_create.model_dump(exclude={"password", "role_ids"})
        db_obj = User(
            **data,
            hashed_password=get_password_hash(user_create.password),
        )
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(*, session: Session, db_user: User, user_in: UserUpdate) -> User:
        user_data = user_in.model_dump(exclude_unset=True, exclude={"role_ids"})
        extra_data: dict[str, Any] = {}
        if "password" in user_data:
            password = user_data.pop("password")
            extra_data["hashed_password"] = get_password_hash(password)
        db_user.sqlmodel_update(user_data, update=extra_data)
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
        return db_user

    @staticmethod
    def get_by_email(*, session: Session, email: str) -> User | None:
        statement = select(User).where(User.email == email)
        return session.exec(statement).first()

    @staticmethod
    def get_by_id(*, session: Session, user_id: uuid.UUID) -> User | None:
        return session.get(User, user_id)

    @staticmethod
    def authenticate(*, session: Session, email: str, password: str) -> User | None:
        db_user = UserRepository.get_by_email(session=session, email=email)
        if not db_user:
            return None
        if not verify_password(password, db_user.hashed_password):
            return None
        return db_user

    @staticmethod
    def delete(*, session: Session, user: User) -> None:
        session.delete(user)
        session.commit()
