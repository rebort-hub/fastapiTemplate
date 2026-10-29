#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from enum import IntEnum


class MenuType(IntEnum):
    """菜单类型：目录 / 页面 / 按钮 / 外链（按钮级权限与接口 permission 共用标识）。"""

    DIRECTORY = 1
    PAGE = 2
    BUTTON = 3
    LINK = 4


class BizCode:
    OK = 0
    VALIDATION_ERROR = 40000
    UNAUTHORIZED = 40100
    FORBIDDEN = 40300
    NOT_FOUND = 40400
    INTERNAL_ERROR = 50000
