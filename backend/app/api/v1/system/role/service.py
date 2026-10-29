#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from fastapi import HTTPException
from sqlmodel import Session, col, or_, select

from app.api.v1.system.association.model import RoleDeptLink, RoleMenuLink, UserRoleLink
from app.api.v1.system.dept.model import SysDept
from app.api.v1.system.role.model import SysRole
from app.api.v1.system.role.schema import (
    RoleBatchStatusIn,
    RoleCreate,
    RoleOptionOut,
    RoleOut,
    RolePermissionIn,
    RolePermissionOut,
    RoleUpdate,
)
from app.core.permission import DataScope


class RoleService:
    @staticmethod
    def list_roles(
        session: Session,
        *,
        name: str | None = None,
        available: bool | None = None,
    ) -> list[RoleOut]:
        stmt = select(SysRole).order_by(SysRole.id)
        if name:
            stmt = stmt.where(col(SysRole.name).contains(name))
        if available is not None:
            stmt = stmt.where(SysRole.available == available)
        rows = session.exec(stmt).all()
        return [RoleOut.model_validate(row) for row in rows]

    @staticmethod
    def list_options(session: Session) -> list[RoleOptionOut]:
        rows = session.exec(
            select(SysRole)
            .where(SysRole.available == True)  # noqa: E712
            .order_by(SysRole.id)
        ).all()
        return [RoleOptionOut.model_validate(row) for row in rows]

    @staticmethod
    def create_role(session: Session, body: RoleCreate) -> RoleOut:
        exists = session.exec(
            select(SysRole).where(
                or_(SysRole.code == body.code, SysRole.name == body.name)
            )
        ).first()
        if exists:
            raise HTTPException(status_code=400, detail="角色编码或名称已存在")
        role = SysRole(**body.model_dump())
        session.add(role)
        session.commit()
        session.refresh(role)
        return RoleOut.model_validate(role)

    @staticmethod
    def update_role(session: Session, role_id: int, body: RoleUpdate) -> RoleOut:
        role = session.get(SysRole, role_id)
        if not role:
            raise HTTPException(status_code=404, detail="角色不存在")
        data = body.model_dump(exclude_unset=True)
        if "code" in data:
            dup = session.exec(
                select(SysRole).where(
                    SysRole.code == data["code"], SysRole.id != role_id
                )
            ).first()
            if dup:
                raise HTTPException(status_code=400, detail="角色编码已存在")
        if "name" in data:
            dup = session.exec(
                select(SysRole).where(
                    SysRole.name == data["name"], SysRole.id != role_id
                )
            ).first()
            if dup:
                raise HTTPException(status_code=400, detail="角色名称已存在")
        for key, value in data.items():
            setattr(role, key, value)
        session.add(role)
        session.commit()
        session.refresh(role)
        return RoleOut.model_validate(role)

    @staticmethod
    def delete_role(session: Session, role_id: int) -> None:
        role = session.get(SysRole, role_id)
        if not role:
            raise HTTPException(status_code=404, detail="角色不存在")
        if role.code == "admin":
            raise HTTPException(status_code=400, detail="系统内置管理员角色不可删除")
        user_bound = session.exec(
            select(UserRoleLink).where(UserRoleLink.role_id == role_id)
        ).first()
        if user_bound:
            raise HTTPException(status_code=400, detail="角色已绑定用户，无法删除")
        for link in session.exec(
            select(RoleMenuLink).where(RoleMenuLink.role_id == role_id)
        ).all():
            session.delete(link)
        for link in session.exec(
            select(RoleDeptLink).where(RoleDeptLink.role_id == role_id)
        ).all():
            session.delete(link)
        session.delete(role)
        session.commit()

    @staticmethod
    def batch_update_status(session: Session, body: RoleBatchStatusIn) -> int:
        rows = session.exec(select(SysRole).where(col(SysRole.id).in_(body.ids))).all()
        for row in rows:
            if row.code == "admin" and not body.available:
                continue
            row.available = body.available
            session.add(row)
        session.commit()
        return len(rows)

    @staticmethod
    def get_permissions(session: Session, role_id: int) -> RolePermissionOut:
        role = session.get(SysRole, role_id)
        if not role:
            raise HTTPException(status_code=404, detail="角色不存在")
        menu_ids = list(
            session.exec(
                select(RoleMenuLink.menu_id).where(RoleMenuLink.role_id == role_id)
            ).all()
        )
        dept_ids = list(
            session.exec(
                select(RoleDeptLink.dept_id).where(RoleDeptLink.role_id == role_id)
            ).all()
        )
        return RolePermissionOut(
            role_id=role_id,
            menu_ids=menu_ids,
            data_scope=role.data_scope,
            dept_ids=dept_ids,
        )

    @staticmethod
    def set_permissions(
        session: Session, role_id: int, body: RolePermissionIn
    ) -> RolePermissionOut:
        role = session.get(SysRole, role_id)
        if not role:
            raise HTTPException(status_code=404, detail="角色不存在")

        role.data_scope = body.data_scope
        session.add(role)

        for link in session.exec(
            select(RoleMenuLink).where(RoleMenuLink.role_id == role_id)
        ).all():
            session.delete(link)
        for menu_id in set(body.menu_ids):
            session.add(RoleMenuLink(role_id=role_id, menu_id=menu_id))

        for link in session.exec(
            select(RoleDeptLink).where(RoleDeptLink.role_id == role_id)
        ).all():
            session.delete(link)

        dept_ids: list[int] = []
        if body.data_scope == DataScope.CUSTOM:
            unique_depts = sorted(set(body.dept_ids))
            if unique_depts:
                found = set(
                    session.exec(
                        select(SysDept.id).where(col(SysDept.id).in_(unique_depts))
                    ).all()
                )
                missing = [d for d in unique_depts if d not in found]
                if missing:
                    raise HTTPException(
                        status_code=400, detail=f"部门不存在: {missing}"
                    )
                for dept_id in unique_depts:
                    session.add(RoleDeptLink(role_id=role_id, dept_id=dept_id))
                dept_ids = unique_depts

        session.commit()
        return RolePermissionOut(
            role_id=role_id,
            menu_ids=sorted(set(body.menu_ids)),
            data_scope=role.data_scope,
            dept_ids=dept_ids,
        )
