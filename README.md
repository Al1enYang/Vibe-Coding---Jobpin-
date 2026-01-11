## 简要介绍

这是一个仿 jobpin.ai 的求职助手 MVP：用户先通过 Clerk 注册/登录，按 4 步完成 Onboarding（RoleName → Profile → Work Type（可选）→ 上传简历并解析），完成后进入 Dashboard 查看个人信息、简历解析结果与订阅状态，并可通过 Stripe（Test 模式） 开通每月订阅（$9/月）。简历解析通过外部 PDF 解析服务提取文本，再由 LLM 将内容结构化为 JSON，并将结构化结果写入 Supabase。

---

## 协作宪法（AI Agent 行为规则）

本项目的协作宪法与全局行为规则位于：
- `.specify/memory/constitution.md`
当与其它文档存在冲突时，以该文件为最高优先级规则来源

## 1. 项目背景 & 产品大方向

### 1.1 背景
求职者通常需要一个简单的工具来：
- 建立基础个人档案（Profile）
- 上传简历并查看结构化解析结果
- 在一个控制台中管理信息与订阅状态

### 1.2 产品方向（MVP）
本 MVP 实现：
- **Clerk 认证**（Email+Password 含邮箱验证码 + Google 登录）
- **Onboarding 独立流程（4 个页面）**：
  1) RoleName  
  2) Profile（First/Last 必填；Country/City 可选）  
  3) Work Type（可选多选）  
  4) Resume 上传 + 解析 + 结果展示  
- **Dashboard**（Onboarding 完成后进入）：
  - 展示 Onboarding 4 个模块完成状态，并支持点击跳转编辑
  - 展示简历结构化解析结果
  - 展示订阅状态与操作入口
- **Stripe Billing 订阅（Test 模式）**
  - $9/月单一 plan
  - Checkout 订阅与 webhook 同步
  - Customer Portal 支持取消/切换 plan
  - webhook 延迟时展示 Pending/同步中提示

### 1.3 非目标（Out of Scope）：
- 不实现 JD 匹配/兼容度评分算法
- 不实现 LinkedIn 登录
- 不实现多份简历版本管理（每用户仅保留 1 份解析结果）
- 不保存 PDF 文件本体（只存解析结构化结果）
- 不实现订阅限制功能（例如付费解锁查看/下载）

---

## 2. 技术栈

- **前端/全栈框架**：Next.js 14（App Router）+ TypeScript
- **认证**：Clerk（Next.js 官方集成）
- **数据库**：Supabase（Postgres）
- **支付**：Stripe Subscriptions（Test 模式）
- **UI**：Tailwind CSS /（可选）shadcn/ui
- **部署**：Vercel

---

## 3. 本地运行

### 3.1 前置条件
- Node.js（建议 LTS）
- Clerk 应用（获取 keys）
- Supabase 项目（URL + anon key）
- Stripe 账号（Test 模式）+ webhook secret
- （如启用解析）外部 PDF 解析服务 + LLM 整理接口的 key（只放服务端 env）

### 3.2 安装与启动
在 `web/` 目录执行：
```bash
cd web
npm install
npm run dev
```

默认访问：
http://localhost:3000

### 3.3 构建/Lint/Typecheck
```bash
npm run build
npm run lint
npm run typecheck
```
如果 typecheck 尚未配置，可添加脚本:tsc --noEmit

### 3.4 Stripe Test 模式说明
•	使用 Test 卡号付款：4242 4242 4242 4242（任意未来有效期、任意 CVC）

### 3.5 重置第一次登录
# 清空 localStorage
localStorage.removeItem('has_seen_dashboard_tour')

# 重置 DB
UPDATE user_profiles SET has_seen_dashboard_guide = false WHERE clerk_user_id = 'your_clerk_user_id';

## 4. 本地运行环境变量配置(必须)
创建 web/.env.local 文件，并填入以下变量(示例为占位符):

### 4.1 Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

### 4.2 Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

<!-- 可选：如需服务端写入/管理权限可使用（按实现需要决定是否启用） -->
SUPABASE_SERVICE_ROLE_KEY=...

**数据库 Schema 说明**：
需要在 Supabase 中创建以下表（具体字段见 `spec.md` 或数据库迁移脚本）：
<!-- 表名是建议命名，实际以迁移脚本为准 -->
- `users_profile`：用户 Profile + Onboarding 完成状态
- `resume_parsed`：简历解析结果（每用户 1 条，覆盖写）
- `subscriptions`：Stripe 订阅状态同步

### 4.3 PDF 解析服务 & LLM 整理(外部接口)
注意:该 key 必须只放在服务端环境变量中，禁止写进前端代码、禁止提交到仓库。
DMXAPI_API_KEY=...
DMXAPI_PDF_MODEL=hehe-tywd      # 可选：PDF 解析模型名
DMXAPI_LLM_MODEL=gpt-5-mini     # 可选：LLM 模型名

### 4.4 Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

NEXT_PUBLIC_STRIPE_PRICE_ID=...  # $9/月 price id
APP_URL=http://localhost:3000

- **安全要求**：
  - .env.local 必须在 .gitignore 中(不可提交)
  - 所有敏感 key 必须通过 env 管理，不允许出现在代码、README 的真实值中

## 5. Stripe Test 模式说明

### 5.1 测试支付
- Checkout 中可使用测试卡完成支付: `4242 4242 4242 4242`
- 任意未来日期作为过期日期，任意 3 位 CVC

### 5.2 Webhook 处理
webhook 至少处理以下事件:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### 5.3 本地测试 Webhook
使用 Stripe CLI 转发 webhook 到本地：
```bash
# 安装 Stripe CLI（首次）
# macOS（可选）: brew install stripe/stripe-cli/stripe
# 也可以直接用 Stripe Dashboard 配 webhook（不走 CLI）
# 其他系统见：https://stripe.com/docs/stripe-cli

# 登录
stripe login

# 转发 webhook 到本地
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
运行后会输出 `whsec_...` 格式的 webhook signing secret，将其更新到 `.env.local` 的 `STRIPE_WEBHOOK_SECRET`

### 5.4 订阅管理
- 若 webhook 同步存在延迟，Dashboard 会显示 "订阅同步中/Pending activation" 提示
- "取消订阅/切换 plan" 通过 Stripe Customer Portal 完成（无需自建完整 UI）

## 6. 简历解析策略 (选项B:外部解析 API+ LLM 整理)
本 MVP 使用 服务端解析，以避免在客户端暴露 key:

### 6.1 服务端解析流程
1. 前端上传 PDF 到本应用服务端接口 (Next.js Route Handler, 例如POST /api/resume/parse)
2. 服务端将 PDF 转为接口所需格式(如 base64)
3. 调用外部 PDF 解析接口 得到解析“原始结果”
4. 将原始结果(或其中的可读文本部分)提交给LLM接口，输出严格结构化JSON:
  - fullName / email / phone
  - skills (数组)
  - experiences (数组，目标识别 1-2 段； 缺失允许为空)
  - resumeSummary
5. 保存到 Supabase: 只保存结构化结果，不保存 PDF 文件
6. 用户重新上传时， 覆盖旧解析结果

### 6.2 选择原因
- 更容易稳定提取内容(比纯规则解析更棒)
- 不需要自建复杂的 PDF 解析逻辑
- 仍满足“只存解析结果"的要求

## 7. 项目结构

### 7.1 根目录文档
```
/
├── .specify/memory/constitution.md  # 协作宪法（最高优先级规则）
├── spec.md                          # PRD/产品规格
├── README.md                        # 本文件（运行说明）
├── CLAUDE.md                        # Claude Code 入口说明
├── PROMPTS.md                       # AI 交互 prompt（不作为实现依据）
└── Reflection.md                    # 反思记录（不作为实现依据）
```

### 7.2 Next.js 工程结构 (web/)
```
web/
├── app/
│   ├── (auth)/                      # 认证路由组
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── onboarding/                  # Onboarding 独立流程（4 步）
│   │   ├── role/page.tsx            # Step 1: RoleName
│   │   ├── profile/page.tsx         # Step 2: Profile
│   │   ├── work-type/page.tsx       # Step 3: Work Type
│   │   └── resume/page.tsx          # Step 4: Resume 上传与解析
│   ├── dashboard/                   # Dashboard
│   │   └── page.tsx
│   ├── api/
│   │   ├── resume/
│   │   │   └── parse/route.ts       # 简历解析（服务端）
│   │   └── stripe/
│   │       └── webhook/route.ts     # Stripe webhook 处理
│   ├── layout.tsx                   # 根布局（Clerk Provider）
│   └── page.tsx                     # 首页
├── lib/
│   ├── supabase.ts                  # Supabase 客户端
│   ├── stripe.ts                    # Stripe 客户端
│   └── resume-parser.ts             # 简历解析逻辑封装
├── components/
│   ├── ui/                          # shadcn/ui 或基础 UI 组件
│   └── dashboard/                   # Dashboard 专用组件
├── middleware.ts                    # Clerk 路由保护中间件
└── package.json
```

### 7.3 路由访问规则
- **未登录用户**：
  - 可访问：`/`、`/sign-in`、`/sign-up`
  - 访问受保护路由（`/onboarding`、`/dashboard`）→ 重定向至 `/sign-in`

- **已登录但未完成 Onboarding**：
  - 访问 `/dashboard` → 重定向至 `/onboarding`
  - 必须按顺序完成 Onboarding 4 步，首次进入需要顺序完成；完成后在 Dashboard 可随时跳转编辑任一步

- **已完成 Onboarding**：
  - 可访问 `/dashboard`
  - 可点击 Dashboard 中的模块卡片跳转编辑对应 Onboarding 步骤
  - 编辑保存后返回 `/dashboard`

## 8. 验收清单 (MVP)
  - ✅ Clerk 注册/登录可用（Email+Password+邮箱验证码 + Google）
  - ✅ `/dashboard` 受保护，未登录自动跳 `/sign-in`
  - ✅ Onboarding 为独立流程（4 个页面）；完成第 4 步后进入 Dashboard
  - ✅ Dashboard 展示 Onboarding 4 模块完成状态，并可点击跳转编辑（保存后返回 Dashboard）
  - ✅ PDF 简历上传后完成解析并结构化展示；重新上传覆盖旧结果
  - ✅ Stripe Checkout（Test）可订阅 $9/月；可用测试卡完成支付
  - ✅ webhook 更新订阅状态到 DB；Dashboard 展示 Free/Pro、下次扣款日期、Portal 入口
  - ✅ webhook 延迟时 Dashboard 提示订阅同步中（Pending）
  - ✅ Customer Portal 支持取消/切换 plan（无需自建完整 UI）

---

## 9. 开发规范（关键提醒）

### 9.1 安全红线
- **禁止泄露密钥**：任何真实 API key、secret 只允许存在于：
  - 本地：`web/.env.local`（已加入 `.gitignore`）
  - 部署：Vercel 环境变量
- **禁止提交 `.env.local`** 到 Git
- **禁止在代码、注释、README 示例中出现真实密钥**

### 9.2 代码质量
改动后必须通过以下检查（在 `web/` 目录执行）：
```bash
npm run lint        # ESLint 检查
npm run typecheck   # TypeScript 类型检查
npm run build       # 构建通过
```

### 9.3 最小改动原则
- **优先编辑现有文件**，避免过度工程
- **不添加未被明确要求的功能**
- **保持简单**：三行相似代码优于过早抽象

### 9.4 协作宪法优先级
所有行为规则以 `.specify/memory/constitution.md` 为最高优先级，当与其他文档冲突时，以宪法为准。

---

## 10. 常见问题（FAQ）

### Q1: Webhook 延迟怎么调试？
A: 使用 Stripe CLI 本地转发（见 5.3 节），并查看终端输出的 webhook 事件日志。可在 Stripe Dashboard → Developers → Webhooks 查看事件详情。

### Q2: 如何测试 Onboarding 跳转逻辑？
A:
1. 清空 Supabase `users_profile` 表中的测试用户数据
2. 重新登录触发 Onboarding 流程
3. 在 Dashboard 点击模块卡片测试编辑跳转

### Q3: 简历解析失败怎么办？
A:
1. 检查 `DMXAPI_API_KEY` 是否正确配置在 `.env.local`
2. 查看服务端日志（`/api/resume/parse` 接口）
3. 确认 PDF 文件大小 < 10MB，格式正确

### Q4: 部署到 Vercel 注意事项？
A:
1. 在 Vercel 项目设置中配置所有环境变量（与 `.env.local` 内容一致）
2. Stripe webhook URL 需更新为生产域名：`https://your-domain.com/api/stripe/webhook`
3. 在 Stripe Dashboard 添加生产 webhook endpoint 并获取新的 signing secret