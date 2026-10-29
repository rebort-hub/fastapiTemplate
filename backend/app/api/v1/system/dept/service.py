#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from fastapi import HTTPException
from sqlmodel import Session, col, select

from app.api.v1.system.dept.model import SysDept
from app.api.v1.system.dept.schema import (
    DeptBatchStatusIn,
    DeptCreate,
    DeptOptionOut,
    DeptOut,
    DeptUpdate,
)


class DeptService:
    @staticmethod
    def list_depts(session: Session) -> list[DeptOut]:
        rows = session.exec(
            select(SysDept).order_by(SysDept.order, SysDept.id)
        ).all()
        return [DeptOut.model_validate(row) for row in rows]

    @staticmethod
    def list_options(session: Session) -> list[DeptOptionOut]:
        rows = session.exec(
            select(SysDept)
            .where(SysDept.available == True)  # noqa: E712
            .order_by(SysDept.order, SysDept.id)
        ).all()
        return [DeptOptionOut.model_validate(row) for row in rows]

    @staticmethod
    def create_dept(session: Session, body: DeptCreate) -> DeptOut:
        if body.parent_id is not None:
            parent = session.get(SysDept, body.parent_id)
            if not parent:
                raise HTTPException(status_code=404, detail="父级部门不存在")
        dept = SysDept(**body.model_dump())
        session.add(dept)
        session.commit()
        session.refresh(dept)
        return DeptOut.model_validate(dept)

    @staticmethod
    def update_dept(session: Session, dept_id: int, body: DeptUpdate) -> DeptOut:
        dept = session.get(SysDept, dept_id)
        if not dept:
            raise HTTPException(status_code=404, detail="部门不存在")
        data = body.model_dump(exclude_unset=True)
        if "parent_id" in data and data["parent_id"] is not None:
            if data["parent_id"] == dept_id:
                raise HTTPException(status_code=400, detail="不能将自身设为父级部门")
            parent = session.get(SysDept, data["parent_id"])
            if not parent:
                raise HTTPException(status_code=404, detail="父级部门不存在")
        for key, value in data.items():
            setattr(dept, key, value)
        session.add(dept)
        session.commit()
        session.refresh(dept)
        return DeptOut.model_validate(dept)

    @staticmethod
    def delete_dept(session: Session, dept_id: int) -> None:
        dept = session.get(SysDept, dept_id)
        if not dept:
            raise HTTPException(status_code=404, detail="部门不存在")
        child = session.exec(
            select(SysDept).where(SysDept.parent_id == dept_id)
        ).first()
        if child:
            raise HTTPException(status_code=400, detail="请先删除子部门")
        session.delete(dept)
        session.commit()

    @staticmethod
    def batch_update_status(session: Session, body: DeptBatchStatusIn) -> int:
        rows = session.exec(
            select(SysDept).where(col(SysDept.id).in_(body.ids))
        ).all()
        for row in rows:
            row.available = body.available
            session.add(row)
        session.commit()
        return len(rows)
