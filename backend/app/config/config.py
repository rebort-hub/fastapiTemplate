#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from functools import lru_cache
from logging import getLevelNamesMapping
from pathlib import Path
from typing import Literal
from urllib.parse import quote_plus
from pydantic import AliasChoices, Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ENV_DIR = BACKEND_DIR / "env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(ENV_DIR / ".env", BACKEND_DIR.parent / ".env"),
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        extra="ignore",
    )

    # ---------- 服务器 ----------
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8000
    TRUSTED_PROXY_HOPS: int = 1

    # ---------- 文档 / 运行模式 ----------
    DEBUG: bool = True
    VERSION: str = "3.1.0"
    DEMO_ENABLE: bool = False

    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "FastAPI Template"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    FRONTEND_HOST: str = "http://localhost:5173"

    # ---------- 数据库（mysql | postgres | sqlite） ----------
    DATABASE_TYPE: Literal["mysql", "postgres", "sqlite"] = "postgres"
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: int = 5432
    DATABASE_USER: str = "postgres"
    DATABASE_PASSWORD: str = ""
    DATABASE_NAME: str = "app"
    DATABASE_URI: str | None = Field(
        default=None,
        validation_alias=AliasChoices("DATABASE_URI", "DATABASE_URL"),
    )

    # ---------- Redis ----------
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_USER: str = ""
    REDIS_PASSWORD: str = ""
    REDIS_DB_NAME: int = 0
    REDIS_URI: str | None = None

    # ---------- 日志 ----------
    LOGGER_LEVEL: str = "INFO"
    LOG_DIR: Path = BACKEND_DIR / "logs"
    LOG_FILE_ENABLE: bool = True
    LOG_FILE_RETENTION_DAYS: int = 7

    FIRST_SUPERUSER: str
    FIRST_SUPERUSER_PASSWORD: str = Field(min_length=8, max_length=128)
    EMAIL_TEST_USER: str = "test@example.com"

    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    SMTP_PORT: int = 587
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAILS_FROM_EMAIL: str | None = None
    EMAILS_FROM_NAME: str | None = None

    PLUGIN_PREFIX: str = "fastadmin_"
    SEED_DATA_DIR: Path = BACKEND_DIR / "scripts" / "data"
    AUTO_CREATE_TABLES: bool = True
    AUTO_SEED_ON_STARTUP: bool = True

    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48
    SENTRY_DSN: str | None = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def ENVIRONMENT(self) -> Literal["development", "production"]:
        return "development" if self.DEBUG else "production"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def DATABASE_URL(self) -> str:
        if self.DATABASE_URI:
            return self._normalize_database_url(self.DATABASE_URI)
        if self.DATABASE_TYPE == "sqlite":
            if self.DATABASE_NAME == ":memory:":
                return "sqlite:///:memory:"
            return f"sqlite:///{self.DATABASE_NAME}"
        password = quote_plus(self.DATABASE_PASSWORD)
        if self.DATABASE_TYPE == "postgres":
            return (
                f"postgresql+psycopg://{self.DATABASE_USER}:{password}"
                f"@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
            )
        return (
            f"mysql+pymysql://{self.DATABASE_USER}:{password}"
            f"@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def REDIS_URL(self) -> str:
        if self.REDIS_URI:
            return self.REDIS_URI
        auth = ""
        if self.REDIS_USER or self.REDIS_PASSWORD:
            auth = f"{self.REDIS_USER}:{quote_plus(self.REDIS_PASSWORD)}@"
        return f"redis://{auth}{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB_NAME}"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def emails_enabled(self) -> bool:
        # 企业邮通常必须账号+授权码，缺任一则视为未启用
        return bool(
            self.SMTP_HOST
            and self.EMAILS_FROM_EMAIL
            and self.SMTP_USER
            and self.SMTP_PASSWORD
        )

    @property
    def log_level(self) -> int:
        return getLevelNamesMapping().get(self.LOGGER_LEVEL.upper(), 20)

    @staticmethod
    def _normalize_database_url(database_url: str) -> str:
        for scheme in ("postgres://", "postgresql://"):
            if database_url.startswith(scheme):
                return database_url.replace(scheme, "postgresql+psycopg://", 1)
        return database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
