#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
import uuid

from fastapi import HTTPException
from sqlmodel import Session, col, delete, func, select

from app.api.v1.system.association.model import UserRoleLink
from app.api.v1.system.dept.model import SysDept
from app.api.v1.system.role.model import SysRole
from app.api.v1.system.user.model import User, UserRepository
from app.api.v1.system.user.schema import (
    UpdatePassword,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)
from app.config.config import settings
from app.core.crud import AuthContext
from app.core.permission import Permission
from app.core.security import get_password_hash, verify_password
from app.plugin.fastadmin_items.items.model import Item
from app.utils.email import generate_new_account_email, send_email


class UserService:
    @staticmethod
    def _role_maps(
        session: Session, user_ids: list[uuid.UUID]
    ) -> dict[uuid.UUID, tuple[list[int], list[str]]]:
        if not user_ids:
            return {}
        rows = session.exec(
            select(UserRoleLink.user_id, SysRole.id, SysRole.name)
            .join(SysRole, SysRole.id == UserRoleLink.role_id)
            .where(col(UserRoleLink.user_id).in_(user_ids))
            .order_by(SysRole.id)
        ).all()
        result: dict[uuid.UUID, tuple[list[int], list[str]]] = {
            uid: ([], []) for uid in user_ids
        }
        for user_id, role_id, role_name in rows:
            ids, names = result[user_id]
            ids.append(role_id)
            names.append(role_name)
        return result

    @staticmethod
    def _dept_name_map(
        session: Session, dept_ids: list[int | None]
    ) -> dict[int, str]:
        ids = sorted({d for d in dept_ids if d is not None})
        if not ids:
            return {}
        rows = session.exec(
            select(SysDept.id, SysDept.name).where(col(SysDept.id).in_(ids))
        ).all()
        return {dept_id: name for dept_id, name in rows}

    @staticmethod
    def to_public(session: Session, user: User) -> UserPublic:
        role_map = UserService._role_maps(session, [user.id])
        role_ids, role_names = role_map.get(user.id, ([], []))
        dept_names = UserService._dept_name_map(session, [user.dept_id])
        payload = UserPublic.model_validate(user).model_dump()
        payload["role_ids"] = role_ids
        payload["role_names"] = role_names
        payload["dept_name"] = dept_names.get(user.dept_id) if user.dept_id else None
        return UserPublic(**payload)

    @staticmethod
    def _set_roles(session: Session, user_id: uuid.UUID, role_ids: list[int]) -> None:
        old = session.exec(
            select(UserRoleLink).where(UserRoleLink.user_id == user_id)
        ).all()
        for link in old:
            session.delete(link)
        unique_ids = sorted(set(role_ids))
        if unique_ids:
            roles = session.exec(
                select(SysRole).where(col(SysRole.id).in_(unique_ids))
            ).all()
            found = {r.id for r in roles}
            missing = [rid for rid in unique_ids if rid not in found]
            if missing:
                raise HTTPException(
                    status_code=400, detail=f"角色不存在: {missing}"
                )
            for role_id in unique_ids:
                session.add(UserRoleLink(user_id=user_id, role_id=role_id))
        session.commit()

    @staticmethod
    def list_users(
        *,
        session: Session,
        auth: AuthContext,
        skip: int = 0,
        limit: int = 100,
        email: str | None = None,
        full_name: str | None = None,
        is_active: bool | None = None,
    ) -> UsersPublic:
        stmt = select(User)
        if email:
            stmt = stmt.where(col(User.email).contains(email))
        if full_name:
            stmt = stmt.where(col(User.full_name).contains(full_name))
        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)
        stmt = Permission(
            session=session,
            user=auth.user,
            model=User,
            check_data_scope=auth.check_data_scope,
        ).filter_statement(stmt)
        users = session.exec(
            stmt.order_by(User.created_at.desc()).offset(skip).limit(limit)
        ).all()
        # count 与列表同一数据范围
        count_stmt = select(func.count()).select_from(User)
        if email:
            count_stmt = count_stmt.where(col(User.email).contains(email))
        if full_name:
            count_stmt = count_stmt.where(col(User.full_name).contains(full_name))
        if is_active is not None:
            count_stmt = count_stmt.where(User.is_active == is_active)
        count_stmt = Permission(
            session=session,
            user=auth.user,
            model=User,
            check_data_scope=auth.check_data_scope,
        ).filter_statement(count_stmt)
        count = session.exec(count_stmt).one()
        role_map = UserService._role_maps(session, [u.id for u in users])
        dept_names = UserService._dept_name_map(session, [u.dept_id for u in users])
        data: list[UserPublic] = []
        for user in users:
            role_ids, role_names = role_map.get(user.id, ([], []))
            item = UserPublic.model_validate(user).model_dump()
            item["role_ids"] = role_ids
            item["role_names"] = role_names
            item["dept_name"] = (
                dept_names.get(user.dept_id) if user.dept_id else None
            )
            data.append(UserPublic(**item))
        return UsersPublic(data=data, count=count)

    @staticmethod
    def register(*, session: Session, user_in: UserRegister) -> User:
        if UserRepository.get_by_email(session=session, email=user_in.email):
            raise HTTPException(
                status_code=400,
                detail="该邮箱已被注册",
            )
        user_create = UserCreate.model_validate(user_in)
        return UserRepository.create(session=session, user_create=user_create)

    @staticmethod
    def create_user(*, session: Session, user_in: UserCreate) -> UserPublic:
        if UserRepository.get_by_email(session=session, email=user_in.email):
            raise HTTPException(
                status_code=400,
                detail="该邮箱已被注册",
            )
        user = UserRepository.create(session=session, user_create=user_in)
        if user_in.role_ids:
            UserService._set_roles(session, user.id, user_in.role_ids)
        if settings.emails_enabled and user_in.email:
            email_data = generate_new_account_email(
                email_to=user_in.email,
                username=user_in.email,
                password=user_in.password,
            )
            send_email(
                email_to=user_in.email,
                subject=email_data.subject,
                html_content=email_data.html_content,
            )
        return UserService.to_public(session, user)

    @staticmethod
    def get_user(*, session: Session, user_id: uuid.UUID) -> UserPublic:
        user = UserRepository.get_by_id(session=session, user_id=user_id)
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        return UserService.to_public(session, user)

    @staticmethod
    def update_user(
        *, session: Session, user_id: uuid.UUID, user_in: UserUpdate
    ) -> UserPublic:
        db_user = UserRepository.get_by_id(session=session, user_id=user_id)
        if not db_user:
            raise HTTPException(status_code=404, detail="用户不存在")
        if user_in.email:
            existing = UserRepository.get_by_email(session=session, email=user_in.email)
            if existing and existing.id != user_id:
                raise HTTPException(status_code=409, detail="该邮箱已被其他用户使用")
        db_user = UserRepository.update(
            session=session, db_user=db_user, user_in=user_in
        )
        if user_in.role_ids is not None:
            UserService._set_roles(session, user_id, user_in.role_ids)
        return UserService.to_public(session, db_user)

    @staticmethod
    def delete_user(*, session: Session, user_id: uuid.UUID, current_user: User) -> None:
        user = UserRepository.get_by_id(session=session, user_id=user_id)
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        if user == current_user:
            raise HTTPException(status_code=403, detail="不能删除当前登录的超级管理员")
        links = session.exec(
            select(UserRoleLink).where(UserRoleLink.user_id == user_id)
        ).all()
        for link in links:
            session.delete(link)
        session.exec(delete(Item).where(col(Item.owner_id) == user_id))
        UserRepository.delete(session=session, user=user)

    @staticmethod
    def update_me(*, session: Session, current_user: User, user_in: UserUpdateMe) -> UserPublic:
        if user_in.email:
            existing = UserRepository.get_by_email(session=session, email=user_in.email)
            if existing and existing.id != current_user.id:
                raise HTTPException(status_code=409, detail="该邮箱已被其他用户使用")
        user_data = user_in.model_dump(exclude_unset=True)
        current_user.sqlmodel_update(user_data)
        session.add(current_user)
        session.commit()
        session.refresh(current_user)
        return UserService.to_public(session, current_user)

    @staticmethod
    def update_password_me(
        *, session: Session, current_user: User, body: UpdatePassword
    ) -> None:
        if not verify_password(body.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="当前密码不正确")
        if body.current_password == body.new_password:
            raise HTTPException(status_code=400, detail="新密码不能与当前密码相同")
        current_user.hashed_password = get_password_hash(body.new_password)
        session.add(current_user)
        session.commit()

    @staticmethod
    def delete_me(*, session: Session, current_user: User) -> None:
        if current_user.is_superuser:
            raise HTTPException(status_code=403, detail="超级管理员不能删除自己的账号")
        links = session.exec(
            select(UserRoleLink).where(UserRoleLink.user_id == current_user.id)
        ).all()
        for link in links:
            session.delete(link)
        UserRepository.delete(session=session, user=current_user)
