# Implementation Plan: Jobpin MVP

**Branch**: `001-jobpin-mvp` | **Date**: 2026-01-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-jobpin-mvp/spec.md`

## Summary

实现一个仿 jobpin.ai 的求职助手应用 MVP,包含以下核心功能:
- Clerk 登录/注册系统(Email+Password + Google OAuth)
- 4 步 Onboarding 流程(RoleName → Profile → Work Type → Resume)
- Dashboard 展示用户信息、简历解析结果、订阅状态
- 简历 PDF 上传与解析(外部 API + LLM 整理)
- Stripe 订阅流程(Test 模式,$9/月)

技术方案: Next.js 14 (App Router) + TypeScript + Clerk + Supabase + Stripe + Tailwind CSS

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 14 (App Router), Node.js 18+
**Primary Dependencies**:
  - @clerk/nextjs: 认证与用户管理
  - @supabase/supabase-js: 数据库与状态存储
  - stripe: 订阅与支付
  - react-hook-form + zod: 表单管理
  - tailwindcss: UI 样式
  - shadcn/ui: UI 组件库(可选)
  - axios: HTTP 客户端(用于 DMXAPI 调用)

**Storage**:
  - Supabase PostgreSQL: 用户配置、简历解析结果、订阅状态
  - 不存储 PDF 文件本体,仅存结构化解析结果

**Testing**: TypeScript + 手动测试为主 (MVP 阶段),可选 Playwright E2E
**Target Platform**: Vercel (Next.js 原生支持)
**Project Type**: web (Next.js 全栈应用)
**Performance Goals**:
  - 页面首次加载 <3 秒 (LCP)
  - API 响应时间 <2 秒(不含外部 PDF 解析和 LLM 处理)
  - 简历解析外部调用: 60 秒超时,失败显示错误提示,允许用户手动重试

**Constraints**:
  - Test 模式下运行 Stripe
  - 每用户仅保留 1 份简历解析结果
  - 所有 API 调用必须在服务端(隐藏密钥)
  - Webhook 必须验证签名

**Scale/Scope**: MVP 阶段,单租户架构

**技术选型 (Phase 0 已完成)**:
  - PDF 解析: DMXAPI (现有接口 `hehe-tywd`) - 已有现成接口、统一管理
  - LLM 服务: DMXAPI GPT-5-Mini (现有接口) - 与 PDF 解析同一提供商、简化配置
  - UI 组件库: shadcn/ui (RSC 支持、可定制性强)
  - 部署平台: Vercel (Next.js 原生、集成便利)
  - 测试策略: TypeScript + 手动测试 (MVP 快速迭代)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 需求复述与验收

✅ **需求已复述**: 从 `spec.md` 提取核心功能与验收标准
✅ **验收点明确**: 第 5 节定义了清晰的 DoD
✅ **边界条件清晰**: 第 1.3 节 Out of scope,第 4 节异常处理

### 优先相关文档和代码

✅ **规格已读取**: `spec.md` 完整分析
✅ **宪法已读取**: `.specify/memory/constitution.md`
⏳ **代码库探索**: Phase 0 研究阶段进行

### Phase 0 & Phase 1 完成后评估

✅ **技术选型完成**: `research.md` 包含所有技术决策和理由
✅ **数据模型已设计**: `data-model.md` 包含完整表结构、索引、RLS
✅ **API 契约已定义**: `contracts/api-routes.yaml` 和 `contracts/webhooks.yaml`
✅ **快速开始指南已创建**: `quickstart.md` 提供完整环境配置步骤
✅ **Agent Context 已更新**: `CLAUDE.md` 包含当前技术栈
✅ **成本可控**: MVP 阶段预计成本 < $50/月 (OpenAI + Supabase 免费额度)
✅ **安全合规**: 所有 API 调用在服务端,Webhook 验证签名

### 待办清单

⏳ **计划待创建**: 本文档完成后运行 `/speckit.tasks` 生成 `tasks.md`
✅ **可执行粒度**: 宪法要求待办必须可验证,将在 Phase 2 保证

### 先审核后执行

✅ **计划先行**: 本 `plan.md` 为实施基础
✅ **等待审核**: 本计划需用户审核通过后方可开始编码

### 小步迭代

✅ **迭代策略**: 每轮 1-3 个 task,在 `tasks.md` 勾选进度
✅ **避免大改动**: 宪法禁止"顺手重构/大改架构/与任务无关的美化"

### 验证步骤

✅ **验证要求已明确**: 每次改动包含 lint/typecheck/关键路径手动验证
✅ **根因修复**: 宪法要求根因修复优先,禁止临时补丁

### 合规检查清单

每轮迭代自检项(已在宪法第 3.3 节定义):
- [ ] 遵守"先复述需求与验收 → 提问确认 → 再开始"
- [ ] 已建立 `specs/<feature>/plan.md` 与 `specs/<feature>/tasks.md` 并通过审核
- [ ] 本轮仅实现 1-3 条 tasks 且已勾选进度
- [ ] 执行并报告 lint/typecheck/关键路径验证
- [ ] 避免了与任务无关的大改动
- [ ] 未泄露任何 secret / key

### 文档优先级

根据宪法第 4 节:
- **运行方式**: 以 `README.md` 为准
- **产品规格**: 以 `spec.md` 为准
- **协作宪法**: 以 `.specify/memory/constitution.md` 为准(最高优先级)

## Project Structure

### Documentation (this feature)

```text
specs/001-jobpin-mvp/
├── plan.md              # 本文件 (/speckit.plan 命令输出)
├── research.md          # Phase 0 输出
├── data-model.md        # Phase 1 输出
├── quickstart.md        # Phase 1 输出
├── contracts/           # Phase 1 输出
│   ├── api-routes.yaml  # API 路由契约
│   └── webhooks.yaml    # Webhook 事件契约
└── tasks.md             # Phase 2 输出 (/speckit.tasks 命令)
```

### Source Code (repository root)

```text
web/                           # Next.js 应用根目录
├── app/                       # App Router 页面
│   ├── (auth)/               # 认证路由组
│   │   ├── sign-in/
│   │   │   └── page.tsx
│   │   └── sign-up/
│   │       └── page.tsx
│   ├── (public)/             # 公开路由组
│   │   └── page.tsx          # Landing Page
│   ├── (protected)/          # 受保护路由组
│   │   ├── onboarding/       # Onboarding 流程
│   │   │   ├── rolename/
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── work-type/
│   │   │   │   └── page.tsx
│   │   │   └── resume/
│   │   │       └── page.tsx
│   │   └── dashboard/
│   │       └── page.tsx
│   ├── api/                  # API 路由
│   │   ├── resume/
│   │   │   └── parse/
│   │   │       └── route.ts  # 简历解析端点
│   │   └── stripe/
│   │       └── webhook/
│   │           └── route.ts  # Stripe webhook 端点
│   ├── layout.tsx            # 根布局
│   └── globals.css           # 全局样式
├── components/               # React 组件
│   ├── ui/                   # shadcn/ui 组件(可选)
│   ├── landing/              # Landing Page 组件
│   ├── onboarding/           # Onboarding 组件
│   └── dashboard/            # Dashboard 组件
├── lib/                      # 工具函数与配置
│   ├── supabase.ts           # Supabase 客户端
│   ├── stripe.ts             # Stripe 客户端
│   ├── resume-parser.ts      # 简历解析服务
│   └── utils.ts              # 通用工具
├── middleware.ts             # Clerk 中间件(路由保护)
├── .env.local                # 环境变量(本地)
├── package.json
├── tailwind.config.ts
└── tsconfig.json

README.md                      # 运行方式与环境变量说明
CLAUDE.md                      # Claude Code 协作入口
```

**Structure Decision**: 采用标准的 Next.js 14 App Router 结构,使用路由组 `(auth)`、`(public)`、`(protected)` 来组织不同访问权限的页面。所有业务逻辑集中在 `lib/` 目录,组件按功能模块组织在 `components/` 下。

## Complexity Tracking

> 本项目暂无宪法违规项,无需填写此表。如后续出现必须 justified 的复杂设计,将在此记录。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (无)      | -          | -                                    |

---

## Phase 0: Research & Technical Decisions

✅ **状态**: 已完成

**目标**: 解决所有 Technical Context 中的 NEEDS CLARIFICATION 项

**研究任务**:
1. PDF 解析服务选型: 验证已选方案可用性 + 成本/限制确认
2. LLM 服务选型: OpenAI GPT-4o-mini vs Anthropic Claude 3 Haiku vs 其他
3. UI 组件库选择: shadcn/ui vs 其他
4. 测试策略: MVP 阶段合适的测试覆盖
5. 部署平台: Vercel vs 其他(考虑 Next.js 生态)

**输出**: ✅ `research.md` 包含每个决策的选择、理由和替代方案评估

## Phase 1: Design & Contracts

✅ **状态**: 已完成

**前提**: `research.md` 完成,所有技术选型已确定

**设计任务**:
1. **数据模型设计** (`data-model.md`)
   - Supabase 表结构定义(用户配置、简历解析结果、订阅状态)
   - 字段类型、关系、索引
   - RLS (Row Level Security) 策略

2. **API 契约** (`contracts/`)
   - API 路由定义: POST /api/resume/parse, POST /api/stripe/webhook
   - 请求/响应 Schema(OpenAPI/TypeScript 类型)
   - Webhook 事件契约

3. **快速开始指南** (`quickstart.md`)
   - 环境变量配置清单
   - 本地运行步骤
   - 数据库初始化脚本

4. **Agent Context 更新**
   - 运行 `.specify/scripts/bash/update-agent-context.sh claude`
   - 更新 Claude 特定的上下文文件

**输出**: ✅ `data-model.md`, ✅ `contracts/*.yaml`, ✅ `quickstart.md`, agent context 文件

**Clerk 集成实施细节**:

1. **安装 Clerk 依赖**:
   ```bash
   npm install @clerk/nextjs
   ```

2. **配置环境变量** (`web/.env.local`):
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
   ```

3. **配置 ClerkProvider** (`web/app/layout.tsx`):
   ```tsx
   import { ClerkProvider } from '@clerk/nextjs'
   import './globals.css'

   export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
       <ClerkProvider>
         <html lang="zh-CN">
           <body>{children}</body>
         </html>
       </ClerkProvider>
     )
   }
   ```

4. **创建登录页面** (`web/app/(auth)/sign-in/page.tsx`):
   ```tsx
   import { SignIn } from '@clerk/nextjs'

   export default function SignInPage() {
     return <SignIn />
   }
   ```

5. **创建注册页面** (`web/app/(auth)/sign-up/page.tsx`):
   ```tsx
   import { SignUp } from '@clerk/nextjs'

   export default function SignUpPage() {
     return <SignUp />
   }
   ```

6. **配置路由保护中间件** (`web/middleware.ts`):
   ```tsx
   import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

   const isProtectedRoute = createRouteMatcher(['/dashboard(.*)?', '/onboarding(.*)?'])
   const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)?', '/sign-up(.*)?'])

   export default clerkMiddleware((auth, req) => {
     if (isProtectedRoute(req)) auth().protect()
   })

   export const config = {
     matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)']
   }
   ```

7. **启用邮箱验证**:
   - 在 Clerk Dashboard 中启用 Email 验证码功能
   - 配置邮件模板(可选)
   - 使用 Clerk 默认行为即可

## Phase 2: Task Breakdown

**前提**: Phase 0 和 Phase 1 完成

**任务分解**: 运行 `/speckit.tasks` 命令生成 `tasks.md`

- 每个任务可独立验证
- 按优先级和依赖关系排序
- 包含验证步骤

**输出**: `tasks.md` (此文件不由 `/speckit.plan` 生成,由单独命令生成)

---

## 实施步骤

### 前置准备

```bash
# 1. 创建 Next.js 项目
npx create-next-app@latest web --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd web

# 2. 安装核心依赖
npm install @clerk/nextjs @supabase/supabase-js stripe react-hook-form zod axios

# 3. (可选) 初始化 shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label
```

**检查点**: `npm run dev` 可启动,访问 localhost:3000 显示欢迎页

### 环境配置（web/.env.local）

在 `web/` 目录创建 `.env.local`，从各服务 Dashboard 获取并配置以下变量。
注意：所有 key 只能存在于本地 `.env.local` 或部署平台环境变量中，禁止写入代码/README 真实值，禁止提交到 Git。

**Clerk（必填）**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

**Supabase（必填）**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`（可选）：仅在需要服务端以管理员权限写入/管理时启用，默认不要求

**DMXAPI（必填/可选）**
- `DMXAPI_API_KEY`（必填）：服务端调用 PDF 解析与 LLM 整理
- `DMXAPI_PDF_MODEL`（可选）：如需指定模型名则配置；不配则使用默认/示例值
- `DMXAPI_LLM_MODEL`（可选）：同上

**Stripe（必填）**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PRICE_ID`
- `APP_URL`

**检查点**: 所有环境变量已配置,无空值

### 数据库初始化

```bash
# 在 Supabase Dashboard SQL Editor 中执行 data-model.md 的迁移脚本
```

**检查点**:
- 3 张表已创建 (user_profiles, resume_parsing_results, subscriptions)，建议命名，最终以迁移脚本为准
- RLS 已启用
- 所有索引已创建

### Clerk 集成

```bash
# 1. 配置 app/layout.tsx 添加 ClerkProvider
# 2. 创建 app/(auth)/sign-in/page.tsx 和 sign-up/page.tsx
# 3. 配置 middleware.ts 路由保护
```

**检查点**:
- `/sign-in` 和 `/sign-up` 页面可访问
- 未登录访问 `/dashboard` 重定向到 `/sign-in`
- 注册后邮箱验证码可发送

### 核心功能开发

```bash
# 1. Onboarding 4 个页面 (rolename → profile → work-type → resume)
# 2. Dashboard 页面
# 3. API 路由: /api/resume/parse 和 /api/stripe/webhook
# 4. lib/ 下的工具函数: supabase.ts, stripe.ts, resume-parser.ts
```

**检查点**:
- Onboarding 4 步可顺序完成
- Resume 上传后可解析并展示结果
- Dashboard 显示订阅状态和引导流程

### Stripe 订阅配置

```bash
# 1. 在 Stripe Dashboard 创建 Product ($9/月)
# 2. 配置 Webhook endpoint
# 3. 本地测试: stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**检查点**:
- Checkout 流程可完成
- Webhook 三事件可更新订阅状态
- Dashboard 正确展示 Free/Pro 状态

---

## 边界条件

| 场景 | 预期行为 | 不允许 |
|------|----------|--------|
| 未登录访问受保护页面 | 重定向到 `/sign-in` (或 Clerk 托管页) | 返回 401/403 |
| 未完成 Onboarding 访问 Dashboard | 重定向到 `/onboarding` 第一步 | 显示空白页 |
| Onboarding 必填字段为空 | Next 按钮禁用或提示错误 | 允许继续下一步 |
| Resume 未上传解析 | Start/Continue 按钮禁用 | 允许跳过 |
| PDF 解析超时/失败 | 显示错误对话框,提供重试按钮 | 自动无限重试 |
| LLM 整理返回非 JSON | 记录日志,提示用户重试 | 展示原始文本 |
| Webhook 签名验证失败 | 返回 401,记录错误日志 | 仍处理请求 |
| 环境变量缺失 | 构建失败或启动时报错 | 使用默认值静默失败 |
| 支付取消/失败 | 保持 Free 状态,可重试 | 锁定用户 |
| 取消订阅后 | `active=false`,显示 Free | 无法重新订阅 |

**补充说明**: 所有边界条件均已在 `spec.md` 第 4 节详细定义,实施时参考该章节的异常处理流程。

---

## 风险缓解

| 风险 | 缓解措施 | 回滚方案 |
|------|----------|----------|
| **密钥泄露** | 禁止提交 `.env.local`,使用环境变量,`.gitignore` 包含该文件 | 立即撤销已泄露的 key,重新生成 |
| **密钥泄露** | `.env.local` 文件仅通过环境变量生成或手动创建,永不写入代码或提交 | 切换到新的 API key |
| **DMXAPI 服务不可用** | 设置 60 秒超时,失败时显示清晰错误提示,允许用户手动重试 | 临时切换到备用解析服务或提示稍后重试 |
| **Stripe Webhook 丢失** | 使用幂等性设计,同一事件多次处理结果相同 | 手动从 Stripe Dashboard 同步订阅状态 |
| **Supabase RLS 配置错误** | 最小可行策略: 仅确保用户只能访问自己的数据 | 若阻塞开发，可在本地调试环境临时放宽；完成后恢复最小策略 |
| **LLM 返回非结构化数据** | 后处理验证 JSON 结构,失败时回退到部分展示 | 使用空值或 "Not found" 占位 |
| **部署后环境变量缺失** | 在 Vercel Dashboard 配置完整环境变量清单 | 回滚到上一个稳定版本 |
| **Clerk 配额超限** | MVP 阶段免费额度足够 (5,000 MAU) | 切换到 Clerk Pro 计划 |

---

## 修改文件清单

### 需要创建的文件

```
web/
├── app/
│   ├── layout.tsx                          # 根布局 + ClerkProvider
│   ├── globals.css                         # 全局样式
│   ├── (auth)/
│   │   ├── sign-in/page.tsx                # 登录页
│   │   └── sign-up/page.tsx                # 注册页
│   ├── (public)/
│   │   └── page.tsx                        # Landing Page
│   ├── (protected)/
│   │   ├── onboarding/
│   │   │   ├── rolename/page.tsx           # Onboarding Step 1
│   │   │   ├── profile/page.tsx            # Onboarding Step 2
│   │   │   ├── work-type/page.tsx          # Onboarding Step 3
│   │   │   └── resume/page.tsx             # Onboarding Step 4
│   │   └── dashboard/page.tsx              # Dashboard 主页
│   └── api/
│       ├── resume/parse/route.ts           # 简历解析 API
│       └── stripe/webhook/route.ts         # Stripe Webhook
├── components/
│   ├── ui/                                 # shadcn/ui 组件(可选)
│   ├── landing/                            # Landing Page 组件
│   ├── onboarding/                         # Onboarding 组件
│   └── dashboard/                          # Dashboard 组件
├── lib/
│   ├── supabase.ts                         # Supabase 客户端
│   ├── stripe.ts                           # Stripe 客户端
│   ├── resume-parser.ts                    # 简历解析服务
│   └── utils.ts                            # 通用工具函数
├── middleware.ts                           # Clerk 中间件
├── .env.local                              # 环境变量(不提交)
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

### 需要修改的文件

```
根目录/
├── README.md                               # 添加运行方式说明
├── CLAUDE.md                               # 更新技术栈信息
└── .gitignore                              # 确保 .env.local 在忽略列表中
```

### 文件数量统计

- **新建文件**: 约 25-30 个 (含组件和工具函数)
- **修改文件**: 3 个 (README.md, CLAUDE.md, .gitignore)
- **配置文件**: 5 个 (package.json, tsconfig.json, tailwind.config.ts, middleware.ts, .env.local)

---

## 测试验证

### 自动化验证

```bash
# 1. TypeScript 类型检查
npm run typecheck  # 或 npx tsc --noEmit

# 2. ESLint 代码检查
npm run lint       # 或 npx eslint . --ext .ts,.tsx

# 3. 构建验证
npm run build      # 确保生产构建成功
```

**检查点**: 无类型错误,无 ESLint 错误,构建成功

### 手动验证清单

#### 认证流程
- [ ] 访问 `/sign-up` 可注册新用户
- [ ] 邮箱验证码可发送和验证
- [ ] Google 登录可用(已配置)
- [ ] 未登录访问 `/dashboard` 重定向到 `/sign-in`
- [ ] 登录后访问 `/onboarding` 正常显示

#### Onboarding 流程
- [ ] RoleName 页面: 必填项验证,Next 按钮禁用逻辑正确
- [ ] Profile 页面: First/Last 必填,Country/City 可选
- [ ] Work Type 页面: 多选功能正常,可 Skip
- [ ] Resume 页面: 上传 PDF 后显示解析结果,Start/Continue 按钮逻辑正确

#### Dashboard 功能
- [ ] 4 个 Onboarding 模块显示完成状态
- [ ] 点击模块可跳转编辑,Save 后返回 Dashboard
- [ ] 简历解析结果展示 (Header/Skills/Experiences/Summary)
- [ ] 重新上传简历覆盖旧结果
- [ ] 首次进入显示高亮引导流程

#### 订阅功能
- [ ] Free 用户显示升级按钮
- [ ] 点击 Upgrade 跳转 Stripe Checkout
- [ ] 使用测试卡 (4242...) 完成支付
- [ ] Webhook 更新订阅状态
- [ ] Dashboard 显示 Pro 状态和下次扣款日期
- [ ] Manage subscription 链接跳转 Customer Portal

#### 异常处理
- [ ] 上传非 PDF 文件提示错误
- [ ] PDF 解析超时显示错误对话框
- [ ] LLM 整理失败提示重试
- [ ] Webhook 签名验证失败返回 401
- [ ] 支付取消/失败后保持 Free 状态

### 性能验证

```bash
# Lighthouse 检查 (Chrome DevTools → Lighthouse)
# 目标: LCP <3 秒
```

**检查点**: 首页 LCP <3 秒,Dashboard LCP <3 秒

### 本地开发验证

```bash
# 1. 启动开发服务器
npm run dev

# 2. 测试 Stripe Webhook (另一终端)
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

**检查点**: Webhook 端点接收事件,数据库正确更新

---

## Next Steps

1. ✅ **完成**: 本计划文档已创建
2. ✅ **完成**: Phase 0 已执行,生成 `research.md` 解决技术选型
3. ✅ **完成**: Phase 1 已执行,设计数据模型和 API 契约
4. ⏳ **当前**: 用户审核 `plan.md` + 设计文档
5. ⏳ **下一步**: 运行 `/speckit.tasks` 生成 `tasks.md`
6. ⏳ **待开始**: 宪法要求审核通过后方可开始编码
