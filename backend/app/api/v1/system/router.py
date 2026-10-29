#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from fastapi import APIRouter

from app.api.v1.system.auth.controller import router as auth_router
from app.api.v1.system.dept.controller import router as dept_router
from app.api.v1.system.file.controller import router as file_router
from app.api.v1.system.log.controller import router as log_router
from app.api.v1.system.menu.controller import router as menu_router
from app.api.v1.system.position.controller import router as position_router
from app.api.v1.system.role.controller import router as role_router
from app.api.v1.system.user.controller import router as user_router

system_router = APIRouter()
system_router.include_router(auth_router, prefix="/auth", tags=["系统认证"])
system_router.include_router(user_router, prefix="/user", tags=["系统用户"])
system_router.include_router(menu_router, prefix="/menu", tags=["系统菜单"])
system_router.include_router(role_router, prefix="/role", tags=["系统角色"])
system_router.include_router(dept_router, prefix="/dept", tags=["系统部门"])
system_router.include_router(position_router, prefix="/position", tags=["系统岗位"])
system_router.include_router(file_router, prefix="/file", tags=["系统文件"])
system_router.include_router(log_router, prefix="/log", tags=["操作日志"])
