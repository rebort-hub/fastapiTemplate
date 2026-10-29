#!/usr/bin/env python
# -*- coding: utf-8 -*-
#author：罗伯特
import logging
import smtplib
import ssl
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from pathlib import Path
from typing import Any
import jwt
from jinja2 import Template
from jwt.exceptions import InvalidTokenError
from app.config.config import settings

logger = logging.getLogger(__name__)

EMAIL_TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "email-templates"


@dataclass
class EmailData:
    html_content: str
    subject: str


def render_email_template(*, template_name: str, context: dict[str, Any]) -> str:
    template_path = EMAIL_TEMPLATES_DIR / template_name
    if not template_path.is_file():
        raise FileNotFoundError(f"邮件模板不存在: {template_path}")
    html = Template(template_path.read_text(encoding="utf-8"))
    return html.render(**context)


def send_email(
    *,
    email_to: str,
    subject: str = "",
    html_content: str = "",
) -> None:
    if not settings.emails_enabled:
        raise RuntimeError(
            "邮件服务未配置完整，请填写 SMTP_HOST/SMTP_USER/SMTP_PASSWORD/EMAILS_FROM_EMAIL"
        )

    from_name = settings.EMAILS_FROM_NAME or settings.PROJECT_NAME
    from_email = settings.EMAILS_FROM_EMAIL
    assert from_email and settings.SMTP_HOST

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = formataddr((from_name, from_email))
    msg["To"] = email_to
    # 纯文本兜底，避免部分客户端空白
    plain = (
        "请使用支持 HTML 的邮箱客户端查看本邮件。\n"
        f"主题：{subject}\n"
    )
    msg.attach(MIMEText(plain, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    host = settings.SMTP_HOST
    port = settings.SMTP_PORT
    user = settings.SMTP_USER or ""
    password = settings.SMTP_PASSWORD or ""
    timeout = 30

    logger.info(
        "准备发送邮件 | to=%s | subject=%s | host=%s:%s | ssl=%s | tls=%s",
        email_to,
        subject,
        host,
        port,
        settings.SMTP_SSL,
        settings.SMTP_TLS,
    )

    context = ssl.create_default_context()
    try:
        if settings.SMTP_SSL or port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=timeout, context=context) as server:
                if user:
                    server.login(user, password)
                server.sendmail(from_email, [email_to], msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=timeout) as server:
                server.ehlo()
                if settings.SMTP_TLS:
                    server.starttls(context=context)
                    server.ehlo()
                if user:
                    server.login(user, password)
                server.sendmail(from_email, [email_to], msg.as_string())
    except Exception:
        logger.exception("SMTP 发送失败 | to=%s | subject=%s", email_to, subject)
        raise

    logger.info("邮件发送成功 | to=%s | subject=%s", email_to, subject)


def generate_test_email(email_to: str) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - 测试邮件"
    html_content = render_email_template(
        template_name="test_email.html",
        context={"project_name": project_name, "email": email_to},
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_reset_password_email(email_to: str, email: str, token: str) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - 重置密码"
    link = f"{settings.FRONTEND_HOST.rstrip('/')}/reset-password?token={token}"
    html_content = render_email_template(
        template_name="reset_password.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": email,
            "email": email_to,
            "valid_hours": settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": link,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_new_account_email(
    email_to: str, username: str, password: str
) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - 账号创建成功"
    html_content = render_email_template(
        template_name="new_account.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": username,
            "password": password,
            "email": email_to,
            "link": settings.FRONTEND_HOST,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_password_reset_token(email: str) -> str:
    delta = timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.now(timezone.utc)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> str | None:
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return str(decoded_token["sub"])
    except InvalidTokenError:
        return None
