# 后端架构说明


## 目录

```
backend/
├── main.py                     # CLI 入口：run / seed / upgrade / revision
├── scripts/
│   ├── prestart.sh             # 部署前：迁移 + 种子
│   ├── seed.py                 # 种子逻辑
│   └── data/                   # 菜单、角色等 JSON 种子（在此维护）
└── app/
    ├── main.py                 # FastAPI 应用实例（ASGI：app.main:app）
    ├── api/v1/system/          # 系统基座四层
    ├── common/
    ├── config/
    ├── core/                   # deps / db / security / discover
    ├── plugin/                 # 业务插件（fastadmin_*）
    └── utils/
```

## 依赖安装

后端是**独立 Python 项目**，虚拟环境与锁文件均在 `backend/` 下：

```bash
cd backend
uv sync          # 创建 backend/.venv 并安装依赖
```

请勿在 `backend/` 内手动 `python -m venv .venv`；统一用 `uv sync` 管理环境。

## 启动方式

```bash
cd backend

# 迁移 + 种子（首次或部署）
uv run bash scripts/prestart.sh

# 开发启动（推荐）
uv run python main.py run --reload   # 启动时输出表检查、插件扫描、种子初始化日志

# 或使用 FastAPI CLI（等价）
uv run fastapi dev app/main.py

# 仅写入种子
uv run python main.py seed

# 模型变更：生成 / 应用 Alembic 迁移
uv run python main.py revision -m "描述"
uv run python main.py upgrade
# 已激活 backend/.venv 时可直接：
# python main.py revision -m "描述"
# python main.py upgrade
```

## API 路径

| 模块 | 路径前缀 | 说明 |
|------|----------|------|
| auth | `/api/v1/system/auth` | 登录、权限码、密码找回 |
| user | `/api/v1/system/user` | 注册、CRUD、个人中心 |
| menu | `/api/v1/system/menu` | 菜单树 |
| utils | `/api/v1/utils` | 健康检查、测试邮件 |
| items | `/api/v1/items` | 插件 `fastadmin_items` |

## 种子数据

在 `scripts/data/` 维护 JSON：

| 文件 | 表 |
|------|-----|
| `system_menu.json` | system_menu |
| `system_role.json` | system_role |
| `system_role_menus.json` | system_role_menu |

超级管理员由 `core/db.py` 的 `init_db` 根据 `.env` 中 `FIRST_SUPERUSER` 创建。

## 配置（`env/.env`）

复制 `env/.env.example` 为 `env/.env`。主要项：

| 分组 | 变量 | 说明 |
|------|------|------|
| 服务器 | `SERVER_HOST` / `SERVER_PORT` | 默认 `0.0.0.0:8000`，`uv run python main.py run` 会读取 |
| 运行 | `DEBUG` / `VERSION` / `DEMO_ENABLE` | `DEBUG=true` 时等同开发模式（热重载、详细日志） |
| 数据库 | `DATABASE_TYPE` + `DATABASE_HOST/PORT/USER/PASSWORD/NAME` | 支持 `postgres` / `mysql` / `sqlite`，自动拼连接串 |
| Redis | `REDIS_HOST/PORT/USER/PASSWORD/REDIS_DB_NAME` | 可选；也可直接写 `REDIS_URI` |
| 日志 | `LOGGER_LEVEL` / `LOG_DIR` / `LOG_FILE_ENABLE` | 控制台 + `logs/info.log`、`logs/error.log`（按天滚动） |

仍支持 `DATABASE_URI`（或旧名 `DATABASE_URL`）覆盖分项配置，便于 Docker Compose。

## 启动时自动建表

启动时会扫描 ORM 模型（system + `plugin/fastadmin_*/**/model.py`），并按配置执行 `create_all`（**只建缺失表，不会改已有表结构**）：

| 环境变量 | 默认 | 说明 |
|----------|------|------|
| `AUTO_CREATE_TABLES` | `true` | 缺失表时自动 `create_all` |
| `AUTO_SEED_ON_STARTUP` | `true` | 空表时灌种子 JSON |

模型字段变更请用 Alembic：`python main.py revision -m "描述"` / `python main.py upgrade`（未激活虚拟环境时加 `uv run`）。  
生产环境建议 `DEBUG=false`、`AUTO_CREATE_TABLES=false`，完全依赖迁移。

## 插件

- 目录名以 `PLUGIN_PREFIX`（默认 `fastadmin_`）开头
- `controller.py` 暴露 `APIRouter` → 自动挂载到 `/api/v1/<suffix>/`
