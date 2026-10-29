#!/usr/bin/env python
# -*- coding: utf-8 -*-
#author：罗伯特
"""树形结构工具（部门父子递归等）。"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any, Protocol


class _HasParent(Protocol):
    id: int
    parent_id: int | None


def get_child_id_map(model_list: Sequence[Any]) -> dict[int, list[int]]:
    """构建 {parent_id: [child_ids]}，并为每个节点预置空列表。"""
    data_map: dict[int, list[int]] = {}
    for model in model_list:
        mid = model.id
        data_map.setdefault(mid, [])
        parent_id = model.parent_id
        if parent_id is not None:
            data_map.setdefault(parent_id, []).append(mid)
    return data_map


def get_child_recursion(
    id: int, id_map: dict[int, list[int]], ids: list[int] | None = None
) -> list[int]:
    """递归收集某节点及其全部子孙 ID（含自身）。"""
    ids = ids if ids is not None else []
    ids.append(id)
    for child in id_map.get(id, []):
        get_child_recursion(child, id_map, ids)
    return ids
