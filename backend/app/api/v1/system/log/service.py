#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from datetime import datetime

from sqlmodel import Session, col, func, select

from app.api.v1.system.log.model import SysLog
from app.api.v1.system.log.schema import LogOut, LogsPublic
from app.core.crud import AuthContext
from app.core.permission import Permission


class LogService:
    @staticmethod
    def list_logs(
        session: Session,
        *,
        auth: AuthContext,
        skip: int = 0,
        limit: int = 20,
        request_path: str | None = None,
        creator_name: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> LogsPublic:
        stmt = select(SysLog)
        count_stmt = select(func.count()).select_from(SysLog)
        if request_path:
            stmt = stmt.where(col(SysLog.request_path).contains(request_path))
            count_stmt = count_stmt.where(
                col(SysLog.request_path).contains(request_path)
            )
        if creator_name:
            stmt = stmt.where(col(SysLog.creator_name).contains(creator_name))
            count_stmt = count_stmt.where(
                col(SysLog.creator_name).contains(creator_name)
            )
        if start_date:
            stmt = stmt.where(SysLog.created_at >= start_date)
            count_stmt = count_stmt.where(SysLog.created_at >= start_date)
        if end_date:
            stmt = stmt.where(SysLog.created_at <= end_date)
            count_stmt = count_stmt.where(SysLog.created_at <= end_date)

        perm = Permission(
            session=session,
            user=auth.user,
            model=SysLog,
            check_data_scope=auth.check_data_scope,
        )
        stmt = perm.filter_statement(stmt)
        count_stmt = perm.filter_statement(count_stmt)

        count = session.exec(count_stmt).one()
        rows = session.exec(
            stmt.order_by(SysLog.created_at.desc()).offset(skip).limit(limit)
        ).all()
        return LogsPublic(
            data=[LogOut.model_validate(r) for r in rows],
            count=count,
        )

    @staticmethod
    def get_log(
        session: Session, log_id: int, *, auth: AuthContext
    ) -> LogOut | None:
        stmt = select(SysLog).where(SysLog.id == log_id)
        stmt = Permission(
            session=session,
            user=auth.user,
            model=SysLog,
            check_data_scope=auth.check_data_scope,
        ).filter_statement(stmt)
        row = session.exec(stmt).first()
        return LogOut.model_validate(row) if row else None
