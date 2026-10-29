#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from fastapi import HTTPException
from sqlmodel import Session, select

from app.api.v1.system.association.model import RoleMenuLink, UserRoleLink
from app.api.v1.system.menu.model import SysMenu
from app.api.v1.system.menu.schema import (
    MenuBatchStatusIn,
    MenuCreate,
    MenuOptionOut,
    MenuOut,
    MenuUpdate,
)
from app.api.v1.system.user.model import User
from app.common.constants import MenuType


class MenuService:
    @staticmethod
    def list_menus(session: Session) -> list[MenuOut]:
        rows = session.exec(select(SysMenu).order_by(SysMenu.order, SysMenu.id)).all()
        return [MenuOut.model_validate(row) for row in rows]

    @staticmethod
    def list_options(session: Session) -> list[MenuOptionOut]:
        rows = session.exec(
            select(SysMenu)
            .where(SysMenu.type != MenuType.BUTTON)
            .order_by(SysMenu.order, SysMenu.id)
        ).all()
        return [MenuOptionOut.model_validate(row) for row in rows]

    @staticmethod
    def get_user_route_menus(session: Session, user: User) -> list[MenuOut]:
        """当前用户可访问的目录/页面菜单（侧栏与动态路由用，不含按钮）。"""
        if user.is_superuser:
            rows = session.exec(
                select(SysMenu)
                .where(SysMenu.available == True)  # noqa: E712
                .where(SysMenu.type != MenuType.BUTTON)
                .where(SysMenu.hidden == False)  # noqa: E712
                .order_by(SysMenu.order, SysMenu.id)
            ).all()
            return [MenuOut.model_validate(row) for row in rows]

        linked_ids = set(
            session.exec(
                select(RoleMenuLink.menu_id)
                .join(UserRoleLink, UserRoleLink.role_id == RoleMenuLink.role_id)
                .where(UserRoleLink.user_id == user.id)
            ).all()
        )
        if not linked_ids:
            return []

        all_menus = session.exec(select(SysMenu)).all()
        by_id = {m.id: m for m in all_menus if m.id is not None}

        # 角色关联的菜单 + 其祖先目录，保证侧栏树完整
        allowed: set[int] = set()
        for mid in linked_ids:
            current = by_id.get(mid)
            while current and current.id is not None:
                if current.id in allowed:
                    break
                allowed.add(current.id)
                current = by_id.get(current.parent_id) if current.parent_id else None

        rows = [
            m
            for m in all_menus
            if m.id in allowed
            and m.available
            and not m.hidden
            and m.type != MenuType.BUTTON
        ]
        rows.sort(key=lambda m: (m.order, m.id or 0))
        return [MenuOut.model_validate(row) for row in rows]

    @staticmethod
    def create_menu(session: Session, body: MenuCreate) -> MenuOut:
        if body.parent_id is not None:
            parent = session.get(SysMenu, body.parent_id)
            if not parent:
                raise HTTPException(status_code=404, detail="父级菜单不存在")
        menu = SysMenu(**body.model_dump())
        session.add(menu)
        session.commit()
        session.refresh(menu)
        return MenuOut.model_validate(menu)

    @staticmethod
    def update_menu(session: Session, menu_id: int, body: MenuUpdate) -> MenuOut:
        menu = session.get(SysMenu, menu_id)
        if not menu:
            raise HTTPException(status_code=404, detail="菜单不存在")
        data = body.model_dump(exclude_unset=True)
        if "parent_id" in data and data["parent_id"] is not None:
            if data["parent_id"] == menu_id:
                raise HTTPException(status_code=400, detail="不能将自身设为父级菜单")
            parent = session.get(SysMenu, data["parent_id"])
            if not parent:
                raise HTTPException(status_code=404, detail="父级菜单不存在")

        next_type = data.get("type", menu.type)
        if next_type == MenuType.LINK:
            next_link = data.get("link", menu.link)
            if not (next_link or "").strip():
                raise HTTPException(status_code=400, detail="外链类型必须填写外链地址")
        elif "type" in data:
            data.setdefault("link", None)
            data.setdefault("is_iframe", False)

        if next_type == MenuType.BUTTON:
            data["show_badge"] = False
            data["show_text_badge"] = None
        elif data.get("show_badge") is False:
            data["show_text_badge"] = None

        for key, value in data.items():
            setattr(menu, key, value)
        session.add(menu)
        session.commit()
        session.refresh(menu)
        return MenuOut.model_validate(menu)

    @staticmethod
    def delete_menu(session: Session, menu_id: int) -> None:
        menu = session.get(SysMenu, menu_id)
        if not menu:
            raise HTTPException(status_code=404, detail="菜单不存在")
        children = session.exec(
            select(SysMenu).where(SysMenu.parent_id == menu_id)
        ).first()
        if children:
            raise HTTPException(status_code=400, detail="请先删除子菜单")
        session.delete(menu)
        session.commit()

    @staticmethod
    def batch_update_status(session: Session, body: MenuBatchStatusIn) -> int:
        rows = session.exec(select(SysMenu).where(SysMenu.id.in_(body.ids))).all()
        for row in rows:
            row.available = body.available
            session.add(row)
        session.commit()
        return len(rows)
