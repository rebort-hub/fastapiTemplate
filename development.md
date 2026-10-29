# FastAPI 项目 - 开发指南

## 本地开发

本地开发时：用 Docker Compose 跑 PostgreSQL 与 Mailpit，本机分别启动 FastAPI 与 Vite。

启动依赖服务：

```bash
cd docker
cp -n .env.example .env   # 首次
docker compose up -d db mailpit
```

在 `backend` 目录安装依赖并准备数据库：

```bash
cd backend
uv sync
uv run bash scripts/prestart.sh
```

启动 FastAPI 开发服务：

```bash
cd backend
uv run python main.py run --reload
# 或：uv run fastapi dev app/main.py
```

另开终端安装前端依赖并启动 Vite：

```bash
cd frontend
pnpm install
pnpm dev
```

常用地址：

| 服务 | URL |
|------|-----|
| 前端开发服务器 | <http://localhost:5173> |
| 后端 API | <http://localhost:8000> |
| Swagger 交互文档 | <http://localhost:8000/docs> |
| Mailpit | <http://localhost:8025> |

前端开发服务器通过 Vite 代理访问本机后端；详见 `frontend/.env` / `.env.development`。

### 由 FastAPI 托管前端

在 `frontend` 目录构建：

```bash
cd frontend
pnpm build
```

产物写入 `backend/app/frontend`，由 FastAPI 在 <http://localhost:8000> 托管。前端有改动后需重新构建。

## 使用 Docker Compose 跑全栈

Docker 编排统一放在 [`docker/`](./docker/) 目录：

```bash
cd docker
cp -n .env.example .env
docker compose run --rm backend bash scripts/prestart.sh
docker compose watch
```

常用地址：

| 服务 | URL |
|------|-----|
| 应用（前端 + API，由 FastAPI 提供） | <http://localhost:8000> |
| Swagger 交互文档 | <http://localhost:8000/docs> |
| Adminer（数据库管理） | <http://localhost:8080> |
| Traefik 面板（查看代理路由） | <http://localhost:8090> |
| Mailpit | <http://localhost:8025> |

启动 Compose 后端前，请先停掉本机占用 `8000` 端口的 FastAPI 进程。

**说明**：首次拉起全栈可能需要一分钟左右服务才就绪。可用 `docker compose logs`，或 `docker compose logs backend` 查看后端日志。

## Mailpit

[Mailpit](https://mailpit.axllent.org) 会拦截本地发出的邮件，不会真正投递。本机后端连 `localhost:1025`，Compose 后端连 `mailpit` 服务。查看收件：<http://localhost:8025>。

## Docker Compose 文件与环境变量

详见 [`docker/README.md`](./docker/README.md)。

| 文件 | 说明 |
|------|------|
| `docker/compose.yml` | 全栈共享配置 |
| `docker/compose.override.yml` | 本地开发叠加（在 `docker/` 下自动合并） |
| `docker/compose.deploy.yml` | 生产 HTTPS，需 `-f` 显式合并 |

Compose 从 `docker/.env` 读取插值变量（可从 `.env.example` 复制）。后端本地开发另使用 `backend/env/.env`。

生产密钥不要提交仓库；部署说明见 [docker/README.md](./docker/README.md)。

修改变量后重启：

```bash
cd docker
docker compose watch
```

## Pre-commit 与代码检查

项目使用 [prek](https://prek.j178.dev/)（[pre-commit](https://pre-commit.com/) 的现代替代）做提交前检查与格式化。

仓库根目录有 `.pre-commit-config.yaml` 配置。

### 安装钩子（提交时自动跑）

`prek` 已在项目依赖中。在仓库根目录安装 Git hook：

```bash
uv run prek install -f
```

`-f` 会强制安装（覆盖已有的 `pre-commit` 钩子）。

之后执行例如：

```bash
git commit
```

`prek` 会检查并格式化即将提交的代码。若改动了文件，请再次 `git add` 后再提交。

### 手动运行

在仓库根目录对全部文件手动执行：

```bash
uv run prek run --all-files
```
