#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @author: Ntesterc
from sqlmodel import Session, create_engine, select
from app.api.v1.system.user.model import User, UserRepository
from app.api.v1.system.user.schema import UserCreate
from app.config.config import settings

engine = create_engine(str(settings.DATABASE_URL), pool_pre_ping=True)


def init_db(session: Session) -> None:
    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        UserRepository.create(session=session, user_create=user_in)
