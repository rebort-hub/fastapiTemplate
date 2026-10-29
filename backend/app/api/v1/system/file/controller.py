#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Body, Depends, File, Path as PathParam, Query, UploadFile
from fastapi.responses import FileResponse

from app.api.v1.system.file.schema import (
    FileBatchDeleteIn,
    FileOut,
    FilesPublic,
    FileStatistics,
    Message,
)
from app.api.v1.system.file.service import FileService
from app.core.crud import AuthContext
from app.core.deps import AuthPermission, CurrentUser, SessionDep

router = APIRouter()


@router.get("/list", summary="查询文件列表", response_model=FilesPublic)
def list_files(
    session: SessionDep,
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:file:query"], check_data_scope=False)),
    ],
    skip: Annotated[int, Query(description="跳过条数", ge=0)] = 0,
    limit: Annotated[int, Query(description="每页条数", ge=1, le=200)] = 20,
    name: Annotated[str | None, Query(description="文件名称")] = None,
    storage_type: Annotated[str | None, Query(description="存储类型")] = None,
) -> FilesPublic:
    return FileService.list_files(
        session,
        skip=skip,
        limit=limit,
        name=name,
        storage_type=storage_type,
    )


@router.get("/statistics", summary="查询文件统计", response_model=FileStatistics)
def file_statistics(
    session: SessionDep,
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:file:query"], check_data_scope=False)),
    ],
) -> FileStatistics:
    return FileService.statistics(session)


@router.post("/upload", summary="上传文件", response_model=FileOut)
async def upload_file(
    session: SessionDep,
    current_user: CurrentUser,
    file: Annotated[UploadFile, File(description="上传文件")],
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:file:upload"], check_data_scope=False)),
    ],
) -> FileOut:
    return await FileService.upload(
        session, file=file, uploader_id=current_user.id
    )


@router.get("/download/{file_id}", summary="下载文件")
def download_file(
    file_id: Annotated[int, PathParam(description="文件ID", ge=1)],
    session: SessionDep,
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:file:query"], check_data_scope=False)),
    ],
) -> FileResponse:
    row = FileService.get_file(session, file_id)
    return FileResponse(
        path=Path(row.file_path),
        filename=row.original_name,
        media_type=row.content_type or "application/octet-stream",
    )


@router.post("/batch/delete", summary="批量删除文件", response_model=Message)
def batch_delete_files(
    session: SessionDep,
    body: Annotated[FileBatchDeleteIn, Body(description="批量删除参数")],
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:file:delete"], check_data_scope=False)),
    ],
) -> Message:
    count = FileService.batch_delete(session, body)
    return Message(message=f"已删除 {count} 项")


@router.delete("/{file_id}", summary="删除文件", response_model=Message)
def delete_file(
    session: SessionDep,
    file_id: Annotated[int, PathParam(description="文件ID", ge=1)],
    _auth: Annotated[
        AuthContext,
        Depends(AuthPermission(permissions=["system:file:delete"], check_data_scope=False)),
    ],
) -> Message:
    FileService.delete_file(session, file_id)
    return Message(message="删除成功")
