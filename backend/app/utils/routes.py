#!/usr/bin/env python
# -*- coding: utf-8 -*-
#author：罗伯特
from fastapi import APIRouter, Depends
from pydantic.networks import EmailStr

from app.core.deps import get_current_active_superuser
from app.api.v1.system.user.schema import Message
from app.utils.email import generate_test_email, send_email

router = APIRouter(tags=["utils"])


@router.post(
    "/test-email/",
    dependencies=[Depends(get_current_active_superuser)],
    status_code=201,
)
def test_email(email_to: EmailStr) -> Message:
    email_data = generate_test_email(email_to=email_to)
    send_email(
        email_to=email_to,
        subject=email_data.subject,
        html_content=email_data.html_content,
    )
    return Message(message="测试邮件已发送")


@router.get("/health-check/")
async def health_check() -> bool:
    return True
