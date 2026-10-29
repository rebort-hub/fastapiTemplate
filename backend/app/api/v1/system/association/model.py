#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
import uuid
from sqlmodel import Field, SQLModel


class UserRoleLink(SQLModel, table=True):
    __tablename__ = "system_user_role"

    user_id: uuid.UUID = Field(foreign_key="system_user.id", primary_key=True)
    role_id: int = Field(foreign_key="system_role.id", primary_key=True)


class RoleMenuLink(SQLModel, table=True):
    __tablename__ = "system_role_menu"

    role_id: int = Field(foreign_key="system_role.id", primary_key=True)
    menu_id: int = Field(foreign_key="system_menu.id", primary_key=True)


class RoleDeptLink(SQLModel, table=True):
    """角色自定义数据权限关联的部门。"""

    __tablename__ = "system_role_dept"

    role_id: int = Field(foreign_key="system_role.id", primary_key=True)
    dept_id: int = Field(foreign_key="system_dept.id", primary_key=True)
