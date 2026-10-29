#!/usr/bin/env python
"""CLI 入口：写入种子数据。"""

from app.seed import run_seed
from app.utils.logging import setup_logging

if __name__ == "__main__":
    setup_logging()
    run_seed()
