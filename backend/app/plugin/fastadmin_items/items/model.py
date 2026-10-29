#!/usr/bin/env python
# -*- coding: utf-8 -*-
#author：罗伯特
import uuid

from sqlmodel import Field, Relationship, Session, SQLModel

from app.api.v1.system.user.model import User
from app.plugin.fastadmin_items.items.schema import ItemBase, ItemCreate


class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="system_user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


class ItemRepository:
    @staticmethod
    def create(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
        db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
        session.add(db_item)
        session.commit()
        session.refresh(db_item)
        return db_item

    @staticmethod
    def get(*, session: Session, item_id: uuid.UUID) -> Item | None:
        return session.get(Item, item_id)

    @staticmethod
    def save(*, session: Session, item: Item) -> Item:
        session.add(item)
        session.commit()
        session.refresh(item)
        return item

    @staticmethod
    def delete(*, session: Session, item: Item) -> None:
        session.delete(item)
        session.commit()
