#!/usr/bin/env python
# -*- coding: utf-8 -*-
#author：罗伯特
import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Body, Path, Query

from app.api.v1.system.user.schema import Message
from app.core.deps import CurrentUser, SessionDep
from app.plugin.fastadmin_items.items.schema import ItemCreate, ItemPublic, ItemsPublic, ItemUpdate
from app.plugin.fastadmin_items.items.service import ItemService

ItemRouter = APIRouter(tags=["Items"])


@ItemRouter.get("/", summary="查询 Items 列表", response_model=ItemsPublic)
def read_items(
    session: SessionDep,
    current_user: CurrentUser,
    skip: Annotated[int, Query(description="跳过条数", ge=0)] = 0,
    limit: Annotated[int, Query(description="每页条数", ge=1, le=200)] = 100,
) -> Any:
    return ItemService.list_items(
        session=session, current_user=current_user, skip=skip, limit=limit
    )


@ItemRouter.get("/{id}", summary="查询 Item 详情", response_model=ItemPublic)
def read_item(
    session: SessionDep,
    current_user: CurrentUser,
    id: Annotated[uuid.UUID, Path(description="Item ID")],
) -> Any:
    return ItemService.get_item(session=session, item_id=id, current_user=current_user)


@ItemRouter.post("/", summary="创建 Item", response_model=ItemPublic)
def create_item(
    session: SessionDep,
    current_user: CurrentUser,
    item_in: Annotated[ItemCreate, Body(description="Item 创建参数")],
) -> Any:
    return ItemService.create_item(
        session=session, item_in=item_in, current_user=current_user
    )


@ItemRouter.put("/{id}", summary="修改 Item", response_model=ItemPublic)
def update_item(
    session: SessionDep,
    current_user: CurrentUser,
    id: Annotated[uuid.UUID, Path(description="Item ID")],
    item_in: Annotated[ItemUpdate, Body(description="Item 修改参数")],
) -> Any:
    return ItemService.update_item(
        session=session, item_id=id, item_in=item_in, current_user=current_user
    )


@ItemRouter.delete("/{id}", summary="删除 Item", response_model=Message)
def delete_item(
    session: SessionDep,
    current_user: CurrentUser,
    id: Annotated[uuid.UUID, Path(description="Item ID")],
) -> Any:
    ItemService.delete_item(session=session, item_id=id, current_user=current_user)
    return Message(message="Item deleted successfully")
