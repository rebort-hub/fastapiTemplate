# FastAPI 模板

## 技术栈与特性

- ⚡ [**FastAPI**](https://fastapi.tiangolo.com)：Python 后端 API
  - 🧰 [SQLModel](https://sqlmodel.tiangolo.com)：Python SQL 数据库交互（ORM）
  - 🔍 [Pydantic](https://docs.pydantic.dev)：数据校验与配置管理（FastAPI 内置）
  - 💾 [PostgreSQL](https://www.postgresql.org)：关系型数据库
- 🚀 [React](https://react.dev)：前端
  - 🧩 构建产物内置于后端，由 FastAPI 同域托管
  - 💃 TypeScript、Hooks、[Vite](https://vitejs.dev) 等现代前端技术
  - 🎨 [Tailwind CSS](https://tailwindcss.com) 与 [shadcn/ui](https://ui.shadcn.com) 组件
  - 🤖 基于 OpenAPI 自动生成前端客户端
  - 🦇 支持深色模式
- 🐋 [Docker Compose](https://www.docker.com)：本地依赖与自建部署
  - 📞 [Traefik](https://traefik.io)：反向代理与自动 HTTPS
- 🔒 默认安全密码哈希
- 🔑 JWT（JSON Web Token）认证
- 📫 基于邮件的密码找回
- ✉️ [React Email](https://react.email)：邮件模板
- 📬 [Mailpit](https://mailpit.axllent.org)：本地开发邮件调试

## 如何使用

点击本页上方的 **Use this template**，基于模板创建新仓库。

## 后端开发

见 [backend/README.md](./backend/README.md)。

## 前端开发

见 [frontend/README.md](./frontend/README.md)。

## 部署

FastAPI Cloud 部署：[deployment.md](./deployment.md)。

自建机 / 本地 Docker Compose 部署：[`docker/README.md`](./docker/README.md)。

## 开发指南

通用开发文档：[development.md](./development.md)。

内容包括本地 FastAPI + Vite 工作流、Docker Compose 服务、`.env` 配置等。

