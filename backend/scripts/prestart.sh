#! /usr/bin/env bash

set -e
set -x

alembic upgrade head
python scripts/seed.py
