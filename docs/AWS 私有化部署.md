# AWS 私有化部署（Lambda / ECS / EC2）+ 私有 RDS + 对外 API 访问

本文以本仓库的 NestJS + Prisma + PostgreSQL 为例，说明如何把计算层（Lambda / ECS / EC2）放进 VPC 私有子网，把数据库放进 VPC 私有子网，并通过对外入口（API Gateway / ALB）提供公网 API 访问。

## 目标与原则

- 计算层与数据库都在 VPC 私有子网，避免被公网直接访问
- 数据库安全组只放行来自计算层安全组的 `5432/tcp`
- 对外只暴露一层入口（HTTP API 或 ALB），便于做鉴权、限流、日志与 WAF
- 机密信息（`DATABASE_URL` 等）不写进代码与模板，走参数/密钥注入

## 三种计算层选型

| 方案                        | 对外入口                           | 计算层形态                  | 典型场景                     | 关键点                                          |
| --------------------------- | ---------------------------------- | --------------------------- | ---------------------------- | ----------------------------------------------- |
| A. Lambda（推荐本仓库默认） | API Gateway HTTP API               | `AWS::Serverless::Function` | 低运维、弹性、按量           | Lambda 进 VPC 后需要子网/安全组；构建要产物模板 |
| B. ECS Fargate              | 公有 ALB 或 API Gateway + VPC Link | 容器任务                    | 中高并发、长连接、可控运行时 | 需要镜像仓库/ECR、任务角色、服务发现或 LB       |
| C. EC2                      | 公有 ALB 或 NLB                    | 自管主机进程/容器           | 强定制、特殊依赖、传统部署   | 需要补齐补丁、伸缩、滚动发布、日志/监控         |

## 通用网络与安全组设计

### 1) VPC 与子网

推荐使用 3AZ：

- 公有子网（Public Subnet）：放 NAT Gateway、（可选）Bastion、（可选）公有 ALB
- 私有子网（Private Subnet）：放 Lambda ENI / ECS Tasks / EC2 实例、RDS

若计算层需要访问公网（例如调用第三方 API），私有子网路由 `0.0.0.0/0` 指向 NAT Gateway。

### 2) 安全组（最小权限）

以 PostgreSQL 为例：

- `db-sg`（RDS 安全组）
  - 入站：允许来源为 `app-sg` 的 `5432/tcp`
  - 出站：默认全放行（或按需要收敛）
- `app-sg`（计算层安全组）
  - 出站：允许到 `db-sg` 的 `5432/tcp`
  - 入站：通常不需要开放（Lambda/ECS/EC2 均建议经入口层转发）

管理连接（例如本地 psql）不要直接开放 `db-sg` 到 `0.0.0.0/0`。更安全的方式：

- 通过 SSM Session Manager 进入一台私有 EC2/容器做跳板
- 或使用 Bastion Host + 仅对固定办公网段放行

## 数据库（RDS 私有化）

### 1) 创建数据库

- RDS PostgreSQL 实例放在私有子网
- `PubliclyAccessible = false`
- 绑定 `db-sg`
- 配置数据库名与 schema（本项目 Prisma 默认 `public`）

### 2) 连接串（DATABASE_URL）

本项目使用 Prisma，运行时必须注入 `DATABASE_URL`：

- 本地开发：`apps/backend/.env`
- 生产：建议放在 GitHub Secrets / SSM Parameter Store / Secrets Manager，再由部署流程注入

## 方案 A：Lambda + API Gateway（本仓库默认实现）

### 架构

```
Internet
  → API Gateway (HTTP API)
    → Lambda (private subnets + app-sg)
      → RDS (private subnets + db-sg)
```

### 基础设施（SAM 模板要点）

本仓库 SAM 模板在 `template.yml`：

- HTTP API：`Resources.BackendHttpApi`（CORS 允许跨域）
- 业务函数：`Resources.BackendFunction`
  - `VpcConfig.SubnetIds`：私有子网列表
  - `VpcConfig.SecurityGroupIds`：`app-sg`
  - `Environment.Variables.DATABASE_URL`：数据库连接串
  - `Events.ProxyApi`：`/{proxy+}` 透传
- 迁移函数：`Resources.MigrationFunction`
  - 用于执行 `prisma migrate deploy`，创建/更新表结构
- 安全组联动：当不传 `LambdaSecurityGroupId` 时，模板会自动创建 Lambda SG 并向 `DatabaseSecurityGroupId` 写入入站规则（放行 `5432/tcp`）

对应定义见：`template.yml:5` ~ `template.yml:118`。

### 部署流程（CLI）

1) 构建（TypeScript 必须构建出 `dist/`）

```bash
sam validate
sam build --use-container
```

1) 部署（使用构建产物模板）

```bash
sam deploy \
  --template-file .aws-sam/build/template.yaml \
  --stack-name sam-aws-nest-backend-prod \
  --region ap-southeast-2 \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset \
  --parameter-overrides \
    "DatabaseUrl=$DATABASE_URL" \
    "VpcId=$VPC_ID" \
    "LambdaSubnetIds=$SUBNET_ID_1,$SUBNET_ID_2,$SUBNET_ID_3" \
    "DatabaseSecurityGroupId=$DB_SG_ID"
```

1) 执行迁移（在 VPC 内执行）

```bash
MIGRATION_FN=$(aws cloudformation describe-stacks \
  --stack-name sam-aws-nest-backend-prod \
  --region ap-southeast-2 \
  --query "Stacks[0].Outputs[?OutputKey=='MigrationFunctionName'].OutputValue" \
  --output text)

aws lambda invoke \
  --function-name "$MIGRATION_FN" \
  --region ap-southeast-2 \
  --payload '{}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/migrate.json
cat /tmp/migrate.json
```

### 部署流程（GitHub Actions）

仓库内置工作流会：

- 构建：`sam build --use-container`
- 部署：`sam deploy --template-file .aws-sam/build/template.yaml ...`
- 迁移：调用 `MigrationFunction`，确保 Prisma migration 已 apply

入口工作流：

- `.github/workflows/deploy-backend-prod.yml`

必需的 GitHub Secrets（至少）：

- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
- `DATABASE_URL`
- （可选）`DB_SECURITY_GROUP_ID`、`LAMBDA_SECURITY_GROUP_ID`

### 对外 API 访问路径

该项目 NestJS 在 Lambda handler 中设置了全局前缀 `api`（见 `apps/backend/src/lambda.ts:18`），所以对外访问一般是：

- `GET /api/diary`

## 方案 B：ECS（Fargate/EC2）+ 私有 RDS + 对外入口

ECS 推荐两种对外入口模式：

### 模式 B1：公有 ALB 直出（最简单）

```
Internet → ALB (public subnets) → ECS Tasks (private subnets) → RDS (private subnets)
```

配置要点：

- ALB Security Group 放行 `80/443`（来自 `0.0.0.0/0` 或 WAF/CloudFront）
- ECS Service 绑定 `app-sg`，只允许来自 ALB SG 的入站（例如 `3000/tcp`）
- `DATABASE_URL` 通过 Task Definition 的 environment / secrets 注入（建议 Secrets Manager）

### 模式 B2：API Gateway + VPC Link → NLB/ALB（计算层完全不暴露公网）

```
Internet → API Gateway (HTTP API) → VPC Link → NLB/ALB (internal) → ECS Tasks (private) → RDS (private)
```

配置要点：

- API Gateway 负责公网入口、鉴权、限流、日志、WAF
- 负载均衡器为 internal，ECS 仍在私有子网
- VPC Link 需要选择私有子网（与 LB 同 VPC）

## 方案 C：EC2 + 私有 RDS + 对外入口

推荐模式：

### 模式 C1：公有 ALB → 私有 EC2

```
Internet → ALB (public) → EC2 (private) → RDS (private)
```

配置要点：

- EC2 通过用户数据或配置管理工具部署 Node 服务
- `DATABASE_URL` 建议从 SSM Parameter Store / Secrets Manager 拉取
- 使用 Auto Scaling Group 做伸缩与滚动发布
- 日志与指标建议接入 CloudWatch Agent

### 模式 C2：API Gateway + VPC Link → internal NLB → EC2

与 ECS 的 B2 类似，只是后端目标变成 EC2 Target Group。

## 迁移与初始化（Prisma）

本项目 Prisma schema 位于：

- `apps/backend/prisma/schema.prisma`

第一次部署后，必须执行一次 `prisma migrate deploy`，否则业务查询会出现类似错误：

- `The table public.Diary does not exist`

在 Lambda 私有化方案中，推荐使用专用迁移函数（本仓库已提供 `MigrationFunction`）在 VPC 内执行迁移，避免在本地网络直接连私有 RDS。

## 常见问题排查

### 1) 迁移函数失败但 CI 不报错

需要检查 `aws lambda invoke` 的 `FunctionError` 以及 payload 是否为 `{ "ok": true }`。本仓库工作流已经将迁移步骤做成失败即退出。

### 2) Lambda 能部署但运行报 handler 找不到

TypeScript 项目必须部署构建产物模板 `.aws-sam/build/template.yaml`，否则上传的会是 `.ts` 源码，运行时无法加载 handler 模块。

### 3) 计算层无法连 RDS

依次检查：

- 计算层与 RDS 是否在同一 VPC
- 子网路由是否允许 VPC 内互通
- `db-sg` 是否放行来自 `app-sg` 的 `5432/tcp`
- `DATABASE_URL` 里的 host/port/dbname 是否正确
