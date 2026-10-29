#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from fastapi import HTTPException
from sqlmodel import Session, col, select

from app.api.v1.system.position.model import SysPosition
from app.api.v1.system.position.schema import (
    PositionBatchStatusIn,
    PositionCreate,
    PositionOptionOut,
    PositionOut,
    PositionUpdate,
)


class PositionService:
    @staticmethod
    def list_positions(
        session: Session,
        *,
        name: str | None = None,
        available: bool | None = None,
    ) -> list[PositionOut]:
        stmt = select(SysPosition).order_by(SysPosition.order, SysPosition.id)
        if name:
            stmt = stmt.where(col(SysPosition.name).contains(name))
        if available is not None:
            stmt = stmt.where(SysPosition.available == available)
        rows = session.exec(stmt).all()
        return [PositionOut.model_validate(row) for row in rows]

    @staticmethod
    def list_options(session: Session) -> list[PositionOptionOut]:
        rows = session.exec(
            select(SysPosition)
            .where(SysPosition.available == True)  # noqa: E712
            .order_by(SysPosition.order, SysPosition.id)
        ).all()
        return [PositionOptionOut.model_validate(row) for row in rows]

    @staticmethod
    def create_position(session: Session, body: PositionCreate) -> PositionOut:
        exists = session.exec(
            select(SysPosition).where(SysPosition.name == body.name)
        ).first()
        if exists:
            raise HTTPException(status_code=400, detail="岗位名称已存在")
        pos = SysPosition(**body.model_dump())
        session.add(pos)
        session.commit()
        session.refresh(pos)
        return PositionOut.model_validate(pos)

    @staticmethod
    def update_position(
        session: Session, position_id: int, body: PositionUpdate
    ) -> PositionOut:
        pos = session.get(SysPosition, position_id)
        if not pos:
            raise HTTPException(status_code=404, detail="岗位不存在")
        data = body.model_dump(exclude_unset=True)
        if "name" in data:
            dup = session.exec(
                select(SysPosition).where(
                    SysPosition.name == data["name"],
                    SysPosition.id != position_id,
                )
            ).first()
            if dup:
                raise HTTPException(status_code=400, detail="岗位名称已存在")
        for key, value in data.items():
            setattr(pos, key, value)
        session.add(pos)
        session.commit()
        session.refresh(pos)
        return PositionOut.model_validate(pos)

    @staticmethod
    def delete_position(session: Session, position_id: int) -> None:
        pos = session.get(SysPosition, position_id)
        if not pos:
            raise HTTPException(status_code=404, detail="岗位不存在")
        session.delete(pos)
        session.commit()

    @staticmethod
    def batch_update_status(session: Session, body: PositionBatchStatusIn) -> int:
        rows = session.exec(
            select(SysPosition).where(col(SysPosition.id).in_(body.ids))
        ).all()
        for row in rows:
            row.available = body.available
            session.add(row)
        session.commit()
        return len(rows)
