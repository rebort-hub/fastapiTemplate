#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
"""接口权限解析 + 数据范围过滤"""

from __future__ import annotations
import uuid
from typing import Any
from sqlalchemy.sql.elements import ColumnElement
from sqlmodel import Session, col, or_, select
from app.api.v1.system.association.model import RoleDeptLink, RoleMenuLink, UserRoleLink
from app.api.v1.system.menu.model import SysMenu
from app.utils.tree import get_child_id_map, get_child_recursion


class DataScope:
    """数据权限范围"""

    SELF = 1
    DEPT = 2
    DEPT_AND_CHILD = 3
    ALL = 4
    CUSTOM = 5

    LABELS = {
        SELF: "仅本人数据权限",
        DEPT: "本部门数据权限",
        DEPT_AND_CHILD: "本部门及以下数据权限",
        ALL: "全部数据权限",
        CUSTOM: "自定义数据权限",
    }


class PermissionService:
    """解析用户角色关联菜单上的 permission 标识。"""

    @staticmethod
    def get_user_permissions(session: Session, user_id: uuid.UUID) -> set[str]:
        statement = (
            select(SysMenu.permission)
            .join(RoleMenuLink, RoleMenuLink.menu_id == SysMenu.id)
            .join(UserRoleLink, UserRoleLink.role_id == RoleMenuLink.role_id)
            .where(UserRoleLink.user_id == user_id)
            .where(SysMenu.available == True)  # noqa: E712
            .where(SysMenu.permission != "")
        )
        return set(session.exec(statement).all())


class Permission:
    """按角色 data_scope 对查询做行级过滤（多角色取并集）。"""

    def __init__(
        self,
        *,
        session: Session,
        user: Any,
        model: type,
        check_data_scope: bool = True,
    ) -> None:
        self.session = session
        self.user = user
        self.model = model
        self.check_data_scope = check_data_scope

    def filter_statement(self, stmt: Any) -> Any:
        condition = self.permission_condition()
        return stmt.where(condition) if condition is not None else stmt

    def permission_condition(self) -> ColumnElement | None:
        if not self.check_data_scope:
            return None
        if not self.user or not getattr(self.user, "id", None):
            return None
        if getattr(self.user, "is_superuser", False):
            return None

        owner_attr = self._owner_attr()
        if owner_attr is None and self.model.__name__ != "User":
            return None

        scopes, custom_dept_ids = self._load_role_scopes()
        if DataScope.ALL in scopes:
            return None

        include_self = DataScope.SELF in scopes
        dept_ids = self._collect_dept_ids(scopes, custom_dept_ids)

        return self._build_condition(
            include_self=include_self,
            dept_ids=dept_ids,
            owner_attr=owner_attr,
        )

    def _owner_attr(self) -> Any | None:
        if hasattr(self.model, "created_id"):
            return getattr(self.model, "created_id")
        if hasattr(self.model, "creator_id"):
            return getattr(self.model, "creator_id")
        return None

    def _load_role_scopes(self) -> tuple[set[int], set[int]]:
        from app.api.v1.system.role.model import SysRole

        rows = self.session.exec(
            select(SysRole.id, SysRole.data_scope)
            .join(UserRoleLink, UserRoleLink.role_id == SysRole.id)
            .where(UserRoleLink.user_id == self.user.id)
            .where(SysRole.available == True)  # noqa: E712
        ).all()
        scopes: set[int] = set()
        role_ids: list[int] = []
        for role_id, scope in rows:
            scopes.add(int(scope))
            role_ids.append(role_id)

        custom_dept_ids: set[int] = set()
        if DataScope.CUSTOM in scopes and role_ids:
            custom_dept_ids = set(
                self.session.exec(
                    select(RoleDeptLink.dept_id).where(
                        col(RoleDeptLink.role_id).in_(role_ids)
                    )
                ).all()
            )
        return scopes, custom_dept_ids

    def _collect_dept_ids(
        self, scopes: set[int], custom_dept_ids: set[int]
    ) -> set[int]:
        dept_ids: set[int] = set()
        user_dept_id = getattr(self.user, "dept_id", None)

        if DataScope.DEPT in scopes and user_dept_id is not None:
            dept_ids.add(user_dept_id)

        if DataScope.DEPT_AND_CHILD in scopes and user_dept_id is not None:
            dept_ids.update(self._load_dept_children(user_dept_id))

        if DataScope.CUSTOM in scopes:
            dept_ids.update(custom_dept_ids)

        return dept_ids

    def _load_dept_children(self, dept_id: int) -> set[int]:
        from app.api.v1.system.dept.model import SysDept

        depts = self.session.exec(select(SysDept)).all()
        return set(
            get_child_recursion(id=dept_id, id_map=get_child_id_map(depts))
        )

    def _build_condition(
        self,
        *,
        include_self: bool,
        dept_ids: set[int],
        owner_attr: Any | None,
    ) -> ColumnElement | None:
        parts: list[ColumnElement] = []

        if self.model.__name__ == "User":
            if include_self:
                parts.append(self.model.id == self.user.id)
            if dept_ids and hasattr(self.model, "dept_id"):
                parts.append(col(self.model.dept_id).in_(list(dept_ids)))
            if not parts:
                return self.model.id == self.user.id
            return or_(*parts) if len(parts) > 1 else parts[0]

        if include_self and owner_attr is not None:
            parts.append(owner_attr == self.user.id)

        if dept_ids and owner_attr is not None:
            from app.api.v1.system.user.model import User

            creator_rel = getattr(self.model, "created_by", None)
            if creator_rel is not None:
                parts.append(creator_rel.has(col(User.dept_id).in_(list(dept_ids))))
            else:
                # 无关系时：创建人 ID 落在目标部门的用户集合中
                parts.append(
                    owner_attr.in_(
                        select(User.id).where(col(User.dept_id).in_(list(dept_ids)))
                    )
                )

        if not parts:
            if owner_attr is not None:
                return owner_attr == self.user.id
            return None
        return or_(*parts) if len(parts) > 1 else parts[0]
