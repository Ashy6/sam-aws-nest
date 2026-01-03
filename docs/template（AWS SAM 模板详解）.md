# AWS SAM 模板详解 (template.yml)

本文档详细解析了项目根目录下的 `template.yml` 文件。该文件遵循 AWS Serverless Application Model (SAM) 规范，用于定义整个后端应用的基础设施即代码 (IaC)。

## 一、文件概览

该模板主要定义了以下核心资源：

1. **BackendHttpApi**: 一个 API Gateway (HTTP API)，作为后端的统一入口。
2. **BackendFunction**: 运行 NestJS 代码的主 Lambda 函数。
3. **MigrationFunction**: 专门用于执行数据库迁移 (Prisma Migrate) 的 Lambda 函数。
4. **网络与安全**: 自动处理 VPC 绑定和安全组规则，确保 Lambda 能安全访问私有 RDS。

---

## 二、参数配置 (Parameters)

这些参数在部署时通过 `--parameter-overrides` 传入，用于适应不同环境（如 dev/prod）。

| 参数名                    | 类型   | 默认值                   | 说明                                                                               |
| :------------------------ | :----- | :----------------------- | :--------------------------------------------------------------------------------- |
| `DatabaseUrl`             | String | (无)                     | **[必填]** 数据库连接串。`NoEcho: true` 表示在控制台日志中隐藏该值。               |
| `VpcId`                   | VPC ID | `vpc-xxx`                | 部署的目标 VPC ID。                                                                |
| `LambdaSubnetIds`         | List   | `subnet-xxx, subnet-yyy` | Lambda 运行所在的 **私有子网** ID 列表（通常建议 2-3 个跨可用区）。                |
| `DatabaseSecurityGroupId` | SG ID  | `sg-xxx`                 | RDS 数据库已绑定的安全组 ID。用于自动添加允许 Lambda 访问的规则。                  |
| `LambdaSecurityGroupId`   | String | `''` (空字符串)          | **[可选]** 如果你想复用已有的安全组，请填写此 ID。留空则会自动创建一个新的安全组。 |

---

## 三、条件逻辑 (Conditions)

为了灵活处理安全组，模板定义了简单的逻辑判断：

```yaml
Conditions:
  # 如果用户没传 LambdaSecurityGroupId，则认为需要创建一个由 SAM 管理的新安全组
  CreateManagedLambdaSecurityGroup: !Equals [!Ref LambdaSecurityGroupId, '']
  # 如果用户传了，则使用用户提供的安全组
  UseExistingLambdaSecurityGroup: !Not [!Equals [!Ref LambdaSecurityGroupId, '']]
```

---

## 四、核心资源 (Resources)

### 1. HTTP API (BackendHttpApi)

- **类型**: `AWS::Serverless::HttpApi`
- **作用**: 提供公网访问入口。
- **配置**:
  - **CORS**: 允许跨域访问 (`AllowOrigins: '*'`, `AllowMethods: GET, POST...`)。

### 2. 后端业务函数 (BackendFunction)

- **类型**: `AWS::Serverless::Function`
- **代码路径**: `apps/backend/`
- **入口**: `src/lambda.handler` (适配了 serverless-express)
- **VPC 配置**:
  - 绑定到私有子网 (`LambdaSubnetIds`)。
  - 安全组：根据条件，要么使用你传入的 `LambdaSecurityGroupId`，要么使用自动创建的 `BackendLambdaSecurityGroup`。
- **事件触发**: 任何路径的 HTTP 请求 (`/{proxy+}`) 都会转发给此函数。

### 3. 迁移任务函数 (MigrationFunction)

- **类型**: `AWS::Serverless::Function`
- **作用**: 在 VPC 内部执行 `prisma migrate deploy`。
- **特点**:
  - **超时时间**: 900秒（15分钟），因为数据库迁移可能比较耗时。
  - **网络环境**: 与业务函数一致，必须在 VPC 内才能连上 RDS。
  - **代码复用**: 复用了 `apps/backend/` 的代码，但在 `Makefile` 构建时会包含 `prisma/migrations` 文件夹。

### 4. 自动安全组 (BackendLambdaSecurityGroup)

- **条件**: 仅当 `CreateManagedLambdaSecurityGroup` 为真时创建。
- **作用**: 充当 Lambda 的防火墙。

### 5. 数据库入站规则 (DatabaseIngressFromBackendLambda)

- **类型**: `AWS::EC2::SecurityGroupIngress`
- **作用**: 自动修改 RDS 的安全组 (`DatabaseSecurityGroupId`)。
- **规则**: 允许来自 Lambda 安全组的流量访问 `5432` 端口 (PostgreSQL)。
- **重要性**: 这一步实现了“闭环”——**只要部署成功，网络就是通的**，无需手动去 AWS 控制台加白名单。

---

## 五、输出 (Outputs)

部署完成后，CloudFormation 会输出以下关键信息：

1. **BackendApiUrl**: API Gateway 的公网访问地址 (如 `https://xxx.execute-api.ap-southeast-2.amazonaws.com`)。
2. **MigrationFunctionName**: 迁移函数的名称。部署脚本需要读取这个名字来调用它执行迁移。
