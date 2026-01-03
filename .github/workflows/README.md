# 后端生产环境部署 (Deploy Backend prod)

本文档详细说明了如何配置 GitHub Actions 以自动部署 NestJS 后端到 AWS Lambda，并连接 RDS 数据库。

## 一、前置准备 (GitHub Secrets 配置)

在你的 GitHub 仓库中，进入 **Settings** -> **Secrets and variables** -> **Actions**，点击 **New repository secret** 添加以下密钥：

### 1. 必需密钥 (Required)

| 密钥名称                | 说明                      | 示例值                                                                   |
| :---------------------- | :------------------------ | :----------------------------------------------------------------------- |
| `AWS_ACCESS_KEY_ID`     | AWS IAM 用户的 Access Key | `AKIAIOSFODNN7EXAMPLE`                                                   |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM 用户的 Secret Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`                               |
| `DATABASE_URL`          | 生产环境数据库连接串      | `postgresql://user:pass@xxx.rds.amazonaws.com:5432/dbname?schema=public` |

> **注意**：`DATABASE_URL` 必须指向一个真实存在的数据库。如果库不存在，你需要先手动连接上去创建数据库名，或者确保你的连接串用户有权限创建数据库。

### 2. 可选密钥 (Optional)

| 密钥名称                   | 说明                       | 推荐场景                                                          |
| :------------------------- | :------------------------- | :---------------------------------------------------------------- |
| `DB_SECURITY_GROUP_ID`     | RDS 数据库的安全组 ID      | 如果自动探测失败，或者你有多个安全组绑定在 RDS 上，建议显式指定。 |
| `LAMBDA_SECURITY_GROUP_ID` | Lambda 函数使用的安全组 ID | 如果你想复用现有的安全组（而不是让 SAM 自动新建），请填写此项。   |

---

## 二、部署流程详解

该工作流 (`deploy-backend-prod.yml`) 包含以下关键步骤：

### 1. 触发方式

- **手动触发** (`workflow_dispatch`)：为了安全起见，生产环境部署默认需要手动点击 "Run workflow" 按钮触发。

### 2. 环境配置

- **运行环境**：`ubuntu-latest`
- **Node.js**：版本 `22`
- **SAM CLI**：自动安装最新版 AWS SAM CLI

### 3. 构建 (Build)

```bash
sam validate && sam build --use-container
```

- 使用 Docker 容器进行构建，确保构建环境与 AWS Lambda 运行时环境 (Linux) 一致，避免依赖包（如 `bcrypt`, `sharp` 等）出现平台不兼容问题。

### 4. 部署 (Deploy)

该步骤会自动处理复杂的网络配置：

1. **解析数据库安全组**：
    - 脚本会从你的 `DATABASE_URL` 提取主机名。
    - 然后调用 AWS API (`aws rds describe-db-instances`) 自动查找该 RDS 实例绑定的安全组 ID。
    - **目的**：为了让 Lambda 能自动获得访问 RDS 的权限（通过安全组规则）。

2. **执行 SAM 部署**：
    - 使用 CloudFormation 部署/更新资源。
    - 自动将 `DATABASE_URL` 等敏感信息作为参数加密传递给 Lambda。

### 5. 数据库迁移 (Prisma Migrate)

```bash
Run Prisma migrations (in VPC)
```

- **关键点**：部署完成后，会调用一个专门的 Lambda 函数 (`MigrationFunction`)。
- **原因**：因为 RDS 在私有子网，GitHub Actions 运行器（公网）无法直接连数据库。必须通过 VPC 内部的 Lambda 来执行 `prisma migrate deploy`。
- **效果**：自动创建/更新数据库表结构，无需手动操作。

---

## 三、常见问题排查

### 1. 部署失败：找不到数据库安全组

**报错信息**：
`Could not resolve DB security group from RDS endpoint`

**原因**：

- `DATABASE_URL` 写错了。
- RDS 实例没有绑定安全组。
- AWS 凭证权限不足，无法读取 RDS 信息。

**解决**：

- 检查 `DATABASE_URL`。
- 或者直接在 Secrets 里设置 `DB_SECURITY_GROUP_ID`，跳过自动探测。

### 2. 迁移失败

**原因**：

- 数据库连接超时（通常是安全组没配好）。
- 数据库账号密码错误。

**解决**：

- 检查 RDS 安全组是否允许 Lambda 安全组入站 (端口 5432)。
- 检查 Secrets 里的 `DATABASE_URL` 是否正确。
