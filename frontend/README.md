# FastAPI 项目 - 前端

前端基于 [Vite](https://vitejs.dev/)、[React](https://react.dev/)、[TypeScript](https://www.typescriptlang.org/)、[TanStack Query](https://tanstack.com/query)、[TanStack Router](https://tanstack.com/router)、[Tailwind CSS](https://tailwindcss.com/) 与 [shadcn/ui](https://ui.shadcn.com/) 构建。

## 环境要求

- [pnpm](https://pnpm.io/)（Node.js >= 20，推荐 22 LTS）

## 快速开始

在 `frontend` 目录安装依赖并启动开发服务器：

```bash
cd frontend
pnpm install
pnpm dev
```

浏览器打开 <http://localhost:5173/>。


若希望由 FastAPI 托管前端，在 `frontend` 执行 `pnpm build` 后访问 `http://localhost:8000`。


## HTTP 请求封装

Axios 实例位于 `src/lib/http/`，应用启动时通过 `setupHttpClient()` 注入到 OpenAPI 生成的 `client`：

| 能力 | 说明 |
|------|------|
| 请求拦截 | 自动附加 `Authorization: Bearer <token>` |
| 错误拦截 | 解析 FastAPI `detail` 并弹出错误 Toast |
| 401/403 | 清除 token 并跳转 `/login` |
| 成功提示 | 请求配置 `successMessage` 时自动 Toast（可选） |
| 跳过提示 | `skipErrorToast` / `skipAuthRedirect` |

业务 mutation 的成功提示仍在 `onSuccess` 中调用 `useCustomToast().showSuccessToast()`；失败提示由拦截器统一处理。

## 邮件模板

React Email 模板位于 `frontend/packages/react-email/`，可导出到 `backend/app/email-templates/`：

```bash
pnpm email:dev
pnpm email:export
```

## 移除前端（仅保留 API）

若只需 API 应用，可按下列步骤去掉前端：

* 删除 `./frontend` 目录
* 在 `backend/app/main.py` 中移除 `app.frontend()` 相关调用
* 在 `backend/Dockerfile` 中移除前端构建阶段及 `COPY --from=frontend-build`
* 在 `.github/workflows/deploy.yml` 中移除前端安装与构建相关步骤

完成后即为纯 API 应用。

## 生成客户端

### 自动

在 `frontend` 目录执行：

```bash
pnpm generate-client:all
```

然后将变更提交到仓库。

### 手动

1. 确保后端已启动  
2. 从 `http://localhost:8000/api/v1/openapi.json` 下载 OpenAPI JSON，保存为 `frontend/openapi.json`  
3. 执行：

```bash
pnpm generate-client
```

4. 提交变更  

后端 OpenAPI 有影响时，请重新生成客户端。

## 使用远程 API

默认构建后的前端与 FastAPI **同源**。开发时若要直连远程 API，可在 `frontend/.env`（或 `.env.development`）设置：

```env
VITE_API_URL=https://my-domain.example.com
```

Vite 开发服务器会将该地址作为 API 基址。

## 目录结构

```
frontend/
├─ public/                 # 静态资源
├─ packages/react-email/   # 邮件模板
├─ scripts/                # generate-client 等脚本
└─ src/
   ├─ api/                 # 手写业务 API
   ├─ client/              # OpenAPI 生成客户端
   ├─ components/          # 通用组件与 ui/
   ├─ hooks/
   ├─ i18n/
   ├─ layouts/
   ├─ lib/                 # http、echarts、utils
   ├─ pages/               # 页面
   ├─ routes/              # TanStack Router 文件路由
   ├─ store/
   ├─ styles/
   └─ types/
```

生成客户端：

```bash
pnpm generate-client:all
```
