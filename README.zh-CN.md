![openship](https://github.com/user-attachments/assets/75cba728-571e-4f6c-9c09-f3473d0f68b9)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fopenship-org%2Fopenship%2F&stores=[{"type"%3A"postgres"}])

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/openship)

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

Openship 是一款订单路由器，用于连接销售端与履约端。它会自动将订单从销售渠道路由到履约合作伙伴，让你能够完全掌控订单流程。

## 演示

<a href="https://os.openship.org"><img src="https://github.com/user-attachments/assets/2e3bf74b-74f3-4883-a267-8222044469e5" alt="Openship Demo" width="600"></a>

| | |
|---|---|
| **控制面板** | [os.openship.org](https://os.openship.org) |
| **用户** | `os@openship.org` |
| **密码** | `k54f5JaPI1gXze9IWD0%f!Sg@YQ*@ACyBv2` |

[在 YouTube 上观看完整演示 →](https://youtu.be/C55wxCMAX8E)

[了解更多 →](https://openship.org/products/openship)

## Openfront 生态系统

Openship 是一套开源工具中的一部分，这套工具旨在为 Shopify、Toast、MindBody 等专有商业平台提供现代、灵活的替代方案。

- **[Openfront E-commerce](https://github.com/openshiporg/openfront)**：一个全面的无头电商平台，拥有 78 个以上的数据模型，支持多区域，并提供高级礼品卡和索赔系统。
- **[Openfront Restaurant](https://github.com/openshiporg/openfront-restaurant)**：专为餐饮行业打造的平台，具备 POS、KDS 和餐桌管理功能。
- **Openship**：将这些平台（及其他平台）连接到履约合作伙伴的中央订单路由器。

我们的愿景是构建模块化、高性能的商业基础设施，让企业能够完全掌控自己的数据和客户体验。

## 核心概念

### 商店
商店代表客户下单的线上店铺（例如 Shopify、WooCommerce、eBay、Amazon）。连接后，新订单可以被路由到 Openship 进行履约。

### 渠道
渠道代表订单可以被路由并完成履约的目的地。渠道可以是现有平台，例如供应商的 Shopify 商店或第三方物流（3PL）履约服务；也可以是更简单的目标，例如向 Google Sheet 添加一行，或发送一封包含订单详情的电子邮件。

### 链接
链接代表商店与渠道之间的连接。建立链接后，新的商店订单会被转发到关联渠道进行履约。

### 匹配
为了更精细地控制履约流程，可以在产品层级创建匹配。匹配代表商店产品与渠道产品之间的连接。当商店产品和渠道产品之间建立匹配后，Openship 会自动处理该订单。

## 架构

### 技术栈
- **前端**：采用 App Router 的 Next.js 15
- **后端**：采用 GraphQL API 的 KeystoneJS 6
- **数据库**：采用 Prisma ORM 的 PostgreSQL
- **样式**：Tailwind CSS 和 shadcn/ui 组件
- **身份验证**：基于会话并采用基于角色的权限

### 应用结构
```
openship/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Admin interface
│   ├── (storefront)/      # Customer-facing pages
│   └── api/              # API endpoints and webhooks
├── features/
│   ├── keystone/         # Backend models and GraphQL schema
│   ├── platform/         # Admin platform components
│   ├── storefront/       # Frontend components and screens
│   └── integrations/     # Shop and channel integrations
└── components/           # Shared UI components
```

## 快速开始

### 前置要求
- Node.js 20+
- PostgreSQL 数据库
- npm、yarn、pnpm 或 bun

### 设置

1. **克隆并安装依赖：**
   ```bash
   git clone https://github.com/openship-org/openship.git
   cd openship
   npm install
   ```

2. **配置环境变量：**
   ```bash
   cp .env.example .env
   ```

   使用你的配置更新 `.env`：
   ```env
   # Required - Database Connection
   DATABASE_URL="postgresql://username:password@localhost:5432/openship"

   # Required - Session Security (must be at least 32 characters)
   SESSION_SECRET="your-very-long-session-secret-key-here-32-chars-minimum"

   # Optional - SMTP configuration for email notifications
   SMTP_FROM="no-reply@yourdomain.com"
   SMTP_HOST="your-smtp-host"
   SMTP_PASSWORD="your-smtp-password"
   SMTP_PORT="587"
   SMTP_USER="your-smtp-user"

   # Optional - Shop Integrations
   SHOPIFY_APP_KEY="your-shopify-app-key"
   SHOPIFY_APP_SECRET="your-shopify-app-secret"

   # Optional - Channel Integrations
   SHIPPO_API_KEY="shippo_test_..."
   ```

3. **启动开发服务器：**
   ```bash
   npm run dev
   ```

   此命令将：
   - 构建 KeystoneJS schema
   - 运行数据库迁移
   - 使用 Turbopack 启动 Next.js 开发服务器

4. **访问应用：**
   - **控制面板**：[http://localhost:3000](http://localhost:3000) - 订单路由界面
   - **GraphQL API**：[http://localhost:3000/api/graphql](http://localhost:3000/api/graphql) - 交互式 API 浏览器

5. **创建第一个管理员用户：**
   首次访问控制面板时，系统会提示你在 `/init` 创建管理员用户账户

6. **连接第一个商店和渠道：**
   创建管理员账户后，首先连接一个商店（订单来源）和一个渠道（订单履约目的地）

## 开发命令

- `npm run dev` - 构建 Keystone、执行迁移并启动 Next.js 开发服务器
- `npm run build` - 构建 Keystone、执行迁移并构建用于生产环境的 Next.js
- `npm run migrate:gen` - 生成并应用新的数据库迁移
- `npm run migrate` - 将现有迁移部署到数据库
- `npm run lint` - 运行 ESLint

## 主要功能

### 订单路由
- 自动将订单从商店路由到渠道
- 支持多渠道履约
- 实时同步订单
- 灵活的路由规则和条件

### 商店集成
- **Shopify**：用于导入订单的原生集成
- **WooCommerce**：支持 WordPress 电商
- **自定义 API**：构建自定义商店连接器
- **Webhook 支持**：实时订单通知

### 渠道集成
- **Shopify**：将订单路由到供应商的 Shopify 商店
- **第三方物流（3PL）服务**：与履约合作伙伴集成
- **自定义渠道**：电子邮件、Google Sheets、Webhook
- **直运**：直接与供应商集成

### 产品匹配
- 在商店和渠道之间进行智能产品匹配
- 批量匹配功能
- 支持变体层级匹配
- 灵活的匹配规则和例外

### 订单管理
- 实时订单跟踪和状态更新
- 自动化履约工作流
- 错误处理和重试机制
- 全面的订单历史记录和分析

## 文档

如需完整的技术文档，请参阅 [docs.openship.org/docs/openship/ecommerce](https://docs.openship.org/docs/openship/ecommerce)，其中包括：
- 完整的集成指南
- API 参考和操作说明
- 自定义商店和渠道开发
- Webhook 配置和安全
- 高级路由配置

## 部署

### 生产环境部署
Openship 已可用于生产环境，并可部署到：

- **Vercel**：通过上方按钮一键部署
- **Railway**：通过上方按钮一键部署
- **Docker**：使用随附的 Dockerfile 进行容器化部署
- **自行托管**：部署到任意 Node.js 托管环境

### 扩展注意事项
- 针对高订单量处理优化数据库
- 用于订单路由的后台任务处理
- Webhook 可靠性和重试机制
- 对失败订单进行监控和告警

## 贡献

欢迎贡献！有关以下内容的详细信息，请参阅我们的贡献指南：
- 代码标准和约定
- 测试要求
- Pull Request 流程
- Issue 报告

## 支持

- **文档**：请在 [docs.openship.org/docs/openship/ecommerce](https://docs.openship.org/docs/openship/ecommerce) 查看完整文档
- **Issue**：在 GitHub Issues 中报告错误和功能请求
- **社区**：加入我们的社区讨论
- **企业服务**：联系我们以获取企业支持和自定义集成

---

基于 [next-keystone-starter](https://github.com/junaid33/next-keystone-starter) 构建
