# FastAPI 项目 - 部署

通过内置的 GitHub Actions 工作流，可将项目部署到 [FastAPI Cloud](https://fastapicloud.com)。

## 创建 FastAPI Cloud 应用

在 FastAPI Cloud 中创建应用，并将 [Application Directory](https://fastapicloud.com/docs/builds-and-deployments/application-directory/) 设为 `backend`。

通过 [Neon](https://fastapicloud.com/docs/integrations/neon-integration/) 或 [Supabase](https://fastapicloud.com/docs/integrations/supabase-integration/) 集成连接 PostgreSQL。这两种集成会自动配置 `DATABASE_URL` 密钥；也可手动配置 `DATABASE_URL` 指向其他 PostgreSQL 提供商。

## 配置应用

### 环境变量

在 FastAPI Cloud 应用中添加以下必需的 [环境变量](https://fastapicloud.com/docs/builds-and-deployments/environment-variables/)：

* `PROJECT_NAME`：项目名称，用于 API 文档与邮件
* `FIRST_SUPERUSER`：首个超级管理员邮箱
* `FRONTEND_HOST`：应用公网 URL，例如生成的 `https://your-app.fastapicloud.dev` 或自定义域名

若要发送邮件，按邮件服务商补充可选变量：

* `SMTP_HOST`
* `SMTP_USER`
* `EMAILS_FROM_EMAIL`

启用 Sentry 时配置 `SENTRY_DSN`。

### 密钥（Secrets）

添加以下必需项，并标记为 secret：

* `SECRET_KEY`：用于签发安全令牌
* `FIRST_SUPERUSER_PASSWORD`：首个超级管理员密码
* `DATABASE_URL`：PostgreSQL 连接串（使用数据库集成时会自动配置）

使用需认证的邮件服务时，将 `SMTP_PASSWORD` 也加为 secret。

可用下面命令生成 `SECRET_KEY` 与 `FIRST_SUPERUSER_PASSWORD`：

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 配置持续部署

仓库内 `.github/workflows/deploy.yml` 会在推送到 `master` 时构建前端、准备数据库并部署；也可在 **Actions** 页手动触发。

登录 FastAPI Cloud，将 [deploy token](https://fastapicloud.com/docs/advanced-features/deploy-tokens/) 与应用 ID 配成 GitHub 仓库 Secrets：

```bash
uv run fastapi login
uv run fastapi cloud setup-ci --secrets-only --app-id <your-app-id>
```

若已安装并登录 GitHub CLI，该命令会自动配置 `FASTAPI_CLOUD_TOKEN` 与 `FASTAPI_CLOUD_APP_ID`；否则会打印数值，请到仓库 **Settings** > **Secrets and variables** > **Actions** 手动添加。

工作流会在部署前执行数据库迁移并创建首个超级管理员。在同一页面添加：

仓库 **Variables：**

* `PROJECT_NAME`
* `FIRST_SUPERUSER`

仓库 **Secrets：**

* `DATABASE_URL`
* `SECRET_KEY`
* `FIRST_SUPERUSER_PASSWORD`

取值应与 FastAPI Cloud 中一致。`DATABASE_URL` 使用数据库提供商给出的连接串，且须能从 GitHub-hosted runner 访问，以便准备步骤连库。

部署流程大致为：

1. 安装并构建前端到 `backend/app/frontend`
2. 执行 `backend/scripts/prestart.sh`（迁移 + 创建超级管理员）
3. 使用 `uv run fastapi deploy` 部署

## 访问地址

将 `your-app.fastapicloud.dev` 换成你的应用域名。

- 应用（前端 + API）：`https://your-app.fastapicloud.dev`
- 交互式 API 文档：`https://your-app.fastapicloud.dev/docs`

## Docker Compose

自建服务器部署见 [Docker Compose 部署指南](./docker/README.md)。

## GitHub 仓库自动化

可安装以下 GitHub App 以启用仓库自动化：

* [Latest Changes](https://github.com/apps/latest-changes)：合并 PR 后更新发布说明
* [PR Push](https://github.com/apps/pr-push)：允许 pre-commit 工作流向 PR 分支推送自动修复
* [PR Submit](https://github.com/apps/pr-submit)：允许「Bump pre-commit hooks」「Prepare Release」等工作流创建 PR

若使用 [Smokeshow](https://github.com/samuelcolvin/smokeshow) 发布覆盖率，请将 `SMOKESHOW_AUTH_KEY` 配为仓库 Secret。
