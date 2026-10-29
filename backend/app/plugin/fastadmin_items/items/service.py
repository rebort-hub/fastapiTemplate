#!/usr/bin/env python
# -*- coding: utf-8 -*-
#author：罗伯特
import uuid

from fastapi import HTTPException
from sqlmodel import Session, func, select

from app.api.v1.system.user.model import User
from app.plugin.fastadmin_items.items.model import Item, ItemRepository
from app.plugin.fastadmin_items.items.schema import ItemCreate, ItemsPublic, ItemUpdate


class ItemService:
    @staticmethod
    def _ensure_can_access(*, item: Item, current_user: User) -> None:
        if not current_user.is_superuser and item.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")

    @staticmethod
    def list_items(
        *, session: Session, current_user: User, skip: int = 0, limit: int = 100
    ) -> ItemsPublic:
        if current_user.is_superuser:
            count = session.exec(select(func.count()).select_from(Item)).one()
            items = session.exec(select(Item).offset(skip).limit(limit)).all()
        else:
            count = session.exec(
                select(func.count())
                .select_from(Item)
                .where(Item.owner_id == current_user.id)
            ).one()
            items = session.exec(
                select(Item)
                .where(Item.owner_id == current_user.id)
                .offset(skip)
                .limit(limit)
            ).all()
        return ItemsPublic(data=items, count=count)

    @staticmethod
    def get_item(*, session: Session, item_id: uuid.UUID, current_user: User) -> Item:
        item = ItemRepository.get(session=session, item_id=item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        ItemService._ensure_can_access(item=item, current_user=current_user)
        return item

    @staticmethod
    def create_item(
        *, session: Session, item_in: ItemCreate, current_user: User
    ) -> Item:
        return ItemRepository.create(
            session=session, item_in=item_in, owner_id=current_user.id
        )

    @staticmethod
    def update_item(
        *,
        session: Session,
        item_id: uuid.UUID,
        item_in: ItemUpdate,
        current_user: User,
    ) -> Item:
        item = ItemRepository.get(session=session, item_id=item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        ItemService._ensure_can_access(item=item, current_user=current_user)
        item.sqlmodel_update(item_in.model_dump(exclude_unset=True))
        return ItemRepository.save(session=session, item=item)

    @staticmethod
    def delete_item(
        *, session: Session, item_id: uuid.UUID, current_user: User
    ) -> None:
        item = ItemRepository.get(session=session, item_id=item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        ItemService._ensure_can_access(item=item, current_user=current_user)
        ItemRepository.delete(session=session, item=item)
