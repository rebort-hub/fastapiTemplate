#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlmodel import Session, col, func, select

from app.api.v1.system.file.model import SysFile
from app.api.v1.system.file.schema import (
    FileBatchDeleteIn,
    FileOut,
    FilesPublic,
    FileStatistics,
)

MAX_SIZE_MB = 50
UPLOAD_ROOT = Path(__file__).resolve().parents[5] / "uploads"


class FileService:
    @staticmethod
    def _ensure_dir() -> Path:
        UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
        return UPLOAD_ROOT

    @staticmethod
    def list_files(
        session: Session,
        *,
        skip: int = 0,
        limit: int = 20,
        name: str | None = None,
        storage_type: str | None = None,
    ) -> FilesPublic:
        stmt = select(SysFile)
        count_stmt = select(func.count()).select_from(SysFile)
        if name:
            stmt = stmt.where(col(SysFile.original_name).contains(name))
            count_stmt = count_stmt.where(
                col(SysFile.original_name).contains(name)
            )
        if storage_type:
            stmt = stmt.where(SysFile.storage_type == storage_type)
            count_stmt = count_stmt.where(SysFile.storage_type == storage_type)
        count = session.exec(count_stmt).one()
        rows = session.exec(
            stmt.order_by(SysFile.created_at.desc()).offset(skip).limit(limit)
        ).all()
        return FilesPublic(
            data=[FileOut.model_validate(r) for r in rows],
            count=count,
        )

    @staticmethod
    def statistics(session: Session) -> FileStatistics:
        total_count = session.exec(select(func.count()).select_from(SysFile)).one()
        total_size = session.exec(
            select(func.coalesce(func.sum(SysFile.file_size), 0))
        ).one()
        return FileStatistics(
            total_count=total_count,
            total_size=int(total_size or 0),
            storage_type="local",
            max_size_mb=MAX_SIZE_MB,
        )

    @staticmethod
    async def upload(
        session: Session,
        *,
        file: UploadFile,
        uploader_id: uuid.UUID | None,
    ) -> FileOut:
        content = await file.read()
        size = len(content)
        if size > MAX_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400, detail=f"文件超过 {MAX_SIZE_MB}MB 上限"
            )
        original = file.filename or "unnamed"
        ext = Path(original).suffix
        stored_name = f"{uuid.uuid4().hex}{ext}"
        dest = FileService._ensure_dir() / stored_name
        dest.write_bytes(content)

        record = SysFile(
            name=stored_name,
            original_name=original,
            file_path=str(dest),
            file_url="",  # filled after id known
            file_size=size,
            content_type=file.content_type or "",
            storage_type="local",
            uploader_id=uploader_id,
        )
        session.add(record)
        session.commit()
        session.refresh(record)
        record.file_url = f"/api/v1/system/file/download/{record.id}"
        session.add(record)
        session.commit()
        session.refresh(record)
        return FileOut.model_validate(record)

    @staticmethod
    def get_file(session: Session, file_id: int) -> SysFile:
        row = session.get(SysFile, file_id)
        if not row:
            raise HTTPException(status_code=404, detail="文件不存在")
        path = Path(row.file_path)
        if not path.is_file():
            raise HTTPException(status_code=404, detail="文件已丢失")
        return row

    @staticmethod
    def delete_file(session: Session, file_id: int) -> None:
        row = session.get(SysFile, file_id)
        if not row:
            raise HTTPException(status_code=404, detail="文件不存在")
        Path(row.file_path).unlink(missing_ok=True)
        session.delete(row)
        session.commit()

    @staticmethod
    def batch_delete(session: Session, body: FileBatchDeleteIn) -> int:
        rows = session.exec(
            select(SysFile).where(col(SysFile.id).in_(body.ids))
        ).all()
        for row in rows:
            Path(row.file_path).unlink(missing_ok=True)
            session.delete(row)
        session.commit()
        return len(rows)
