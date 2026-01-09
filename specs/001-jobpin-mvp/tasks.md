# 任务清单：Jobpin MVP
**MVP 以 T001–T071 为范围，但实现按优先级逐步推进；非阻塞项可推迟或合并**

**输入来源**：`/specs/001-jobpin-mvp/` 的设计文档
**前置条件**：plan.md, spec.md, research.md, data-model.md, contracts/
**技术栈**：Next.js 14 (App Router), TypeScript, Clerk, Supabase, Stripe, Tailwind CSS

**测试**：未明确要求 - 按 plan.md 进行手动测试（TypeScript + lint + typecheck + 关键路径验证）

**组织方式**：任务按用户故事分组，支持独立实现和测试

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**：可并行执行（不同文件，无依赖）
- **[Story]**：该任务所属的用户故事（US1-US4）
- 描述中包含精确的文件路径

---

## 第一阶段：项目初始化（共享基础设施）

**目的**：项目初始化和环境配置

- [ ] T001 在 `web/` 目录下使用 `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"` 创建 Next.js 14 + TypeScript 项目
- [ ] T002 安装核心依赖到 `web/package.json`：`@clerk/nextjs @supabase/supabase-js stripe react-hook-form zod axios`, axios 可选
- [ ] T003 [P] 在 `web/` 目录初始化 shadcn/ui，使用 `npx shadcn-ui@latest init` 并添加基础组件：button, card, input, label
- [ ] T004 [P] 配置 `web/.gitignore` 排除 `.env.local`（验证根目录 `.gitignore` 已包含）
- [ ] T005 [P] 检查 `web/tsconfig.json` 已启用 strict，并确保 `npm scripts` 有 typecheck
- [ ] T006 [P] 创建 `web/tailwind.config.ts` 配置自定义主题（jobpin 风格配色）

---

## 第二阶段：基础架构（阻塞性前置条件）

**目的**：任何用户故事开始前必须完成的核心基础设施

**⚠️ 关键**：此阶段完成前，不能开始任何用户故事的实现

### 数据库与存储

- [ ] T007 创建 Supabase 项目并配置环境变量：`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 到 `web/.env.local`
- [ ] T008 在 Supabase SQL 编辑器执行 `data-model.md` 中的迁移脚本，创建 3 张表：`user_profiles`, `resume_parsing_results`, `subscriptions`
- [ ] T009 [P] 在 Supabase Dashboard 验证所有 3 张表的 RLS 策略已启用
- [ ] T010 [P] 创建 `web/lib/supabase.ts`，配置 Supabase 客户端单例

### Clerk 认证

- [ ] T011 在 `web/.env.local` 配置 Clerk 环境变量：`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, 重定向 URL
- [ ] T012 [P] 创建 `web/app/layout.tsx`，包含根布局和 `<ClerkProvider>` 包装器
- [ ] T013 [P] 创建 `web/app/(auth)/sign-in/page.tsx`，使用 Clerk 的 `<SignIn />` 组件
- [ ] T014 [P] 创建 `web/app/(auth)/sign-up/page.tsx`，使用 Clerk 的 `<SignUp />` 组件
- [ ] T015 [P] 创建 `web/middleware.ts`，配置 Clerk 中间件保护 `/onboarding/*` 和 `/dashboard/*` 路由

### 外部 API（简历解析）

- [ ] T019 在 `web/.env.local` 配置 DMXAPI 环境变量：`DMXAPI_API_KEY`，可选的模型配置
- [ ] T020 [P] 创建 `web/lib/resume-parser.ts`，包含 PDF 解析和 LLM 集成函数（占位实现）

### 类型定义

- [ ] T021 [P] 创建 `web/types/database.ts`，包含 `UserProfile`, `ResumeParsingResult`, `Subscription` 的 TypeScript 接口，与 `data-model.md` 匹配

**检查点**：基础架构就绪 - 现在可以并行开始用户故事的实现

---

## 第三阶段：用户故事 1 - 落地页与认证（优先级：P1）🎯 MVP

**目标**：用户可以发现应用，注册/登录，并进入受保护的 Onboarding 流程

**独立测试**：
1. 访问 `/` - 看到落地页（hero 区域和 CTA）
2. 点击 "Get started" → 重定向到 `/sign-up`
3. 使用邮箱+密码注册 → 收到验证码
4. 验证邮箱 → 重定向到 `/onboarding/rolename`
5. 登录后访问 `/dashboard` → 重定向到 `/onboarding`（未完成）
6. 登出后访问 `/dashboard` → 重定向到 `/sign-in`

### US1 实现任务

- [ ] T022 [P] [US1] 创建 `web/app/(public)/page.tsx`（落地页），包含 hero 区域、"How it works" 2 步说明模块、CTA 按钮
- [ ] T023 [P] [US1] 创建 `web/components/landing/hero.tsx`，包含标题、副标题、链接到 `/sign-up` 的 CTA 按钮
- [ ] T024 [P] [US1] 创建 `web/components/landing/how-it-works.tsx`，包含 2 步说明卡片
- [ ] T025 [US1] 测试认证流程：注册 → 验证邮箱 → 访问受保护路由
- [ ] T026 [US1] 测试路由保护：未登录访问 `/dashboard` → `/sign-in`

**检查点**：此时用户可以发现应用、注册并到达 Onboarding - US1 完成

---

## 第四阶段：用户故事 2 - Onboarding 流程（优先级：P1）🎯 MVP

**目标**：用户完成 4 步 Onboarding（RoleName → Profile → Work Type → Resume）并到达 Dashboard

**独立测试**：
1. 新用户认证后到达 `/onboarding/rolename`
2. 步骤 1：输入 RoleName（必填）→ Next 启用 → 保存到 Supabase
3. 步骤 2：输入 First/Last（必填），Country/City（可选）→ Next → 保存
4. 步骤 3：选择 Work Types（可选多选）→ Next 或 Skip → 保存
5. 步骤 4：上传 PDF → 看到解析结果 → "Start/Continue" 启用 → 进入 `/dashboard`
6. 编辑流程：从 Dashboard 点击任意步骤 → 编辑 → Save → 返回 Dashboard

### US2 实现任务

#### 步骤 1：RoleName

- [ ] T027 [P] [US2] 创建 `web/app/(protected)/onboarding/rolename/page.tsx`，包含表单输入
- [ ] T028 [P] [US2] 创建 `web/components/onboarding/rolename-form.tsx`，包含验证（必填），Next 按钮（为空时禁用）
- [ ] T029 [US2] 实现保存逻辑：点击 Next 时，通过 Supabase upsert 到 `user_profiles.role_name`

#### 步骤 2：Profile

- [ ] T030 [P] [US2] 创建 `web/app/(protected)/onboarding/profile/page.tsx`，包含表单输入
- [ ] T031 [P] [US2] 创建 `web/components/onboarding/profile-form.tsx`，包含 First/Last（必填），Country/City（可选）
- [ ] T032 [US2] 实现保存逻辑：点击 Next 时，upsert `user_profiles.first_name`, `last_name`, `country`, `city`

#### 步骤 3：Work Type

- [ ] T033 [P] [US2] 创建 `web/app/(protected)/onboarding/work-type/page.tsx`，包含多选复选框
- [ ] T034 [P] [US2] 创建 `web/components/onboarding/work-type-form.tsx`，包含 part-time/full-time/internship 选项，Next 和 Skip 按钮
  - **实现细节**：Work Type 可选，用户可留空；Skip 按钮直接跳过（work_types 为空数组）
- [ ] T035 [US2] 实现保存逻辑：点击 Next/Skip 时，upsert `work_types` 数组到 `user_profiles`
  - **实现细节**：Dashboard 编辑时，Save 后直接返回 `/dashboard`，不按 Onboarding 顺序继续

#### 步骤 4：Resume（解析集成）

- [ ] T036 [P] [US2] 创建 `web/app/(protected)/onboarding/resume/page.tsx`，包含文件上传、解析结果展示、Start/Continue 按钮
- [ ] T037 [P] [US2] 创建 `web/components/onboarding/resume-upload.tsx`，包含 PDF 文件输入、进度指示器
- [ ] T038 [P] [US2] 创建 `web/components/onboarding/resume-results.tsx`，展示解析后的 Header/Skills/Experiences/Summary
- [ ] T039 [US2] 实现 `POST /api/resume/parse/route.ts`：接收 PDF → 调用 DMXAPI PDF 解析 → 调用 LLM 整理 → Zod 校验 → 保存到 `resume_parsing_results`（upsert）
  - **实现细节**：参考 plan.md 的 LLM JSON 验证策略；校验失败返回 500 + "解析失败，请重试"
- [ ] T040 [US2] 更新 `web/lib/resume-parser.ts`，实现实际的 DMXAPI 集成：`parsePDF()` 和 `organizeWithLLM()` 函数，每个超时 60 秒
  - **实现细节**：LLM 输出必须符合最小字段集合（fullName, email, phone, skills[], experiences[], resumeSummary）
- [ ] T041 [US2] 实现错误处理：上传取消、超时、解析失败 → 用户友好的对话框提示重试
  - **实现细节**：必须覆盖上传失败/用户取消/解析失败/LLM 整理失败/网络错误；弹窗内容：简短原因 + 重试按钮；UI 方式不限（原生 alert/modal/shadcn Dialog）
- [ ] T042 [US2] 点击 Start/Continue 时设置 `onboarding_completed = true` 到 `user_profiles`，重定向到 `/dashboard`

#### Onboarding 完成逻辑

- [ ] T043 [US2] 创建 `web/lib/onboarding.ts`，包含辅助函数：`isOnboardingComplete(userId)` 检查所有必填字段
- [ ] T044 [US2] 更新 `web/middleware.ts`，如果 `onboarding_completed = false`，将 `/dashboard` 重定向到 `/onboarding/rolename`

**检查点**：此时 Onboarding 完成，用户到达 Dashboard - US2 完成

---

## 第五阶段：用户故事 3 - Dashboard 与简历展示（优先级：P1）🎯 MVP

**目标**：Dashboard 展示用户信息、简历解析结果、4 个 Onboarding 模块及编辑功能、首次访问引导

**独立测试**：
1. 新用户完成 Onboarding → 到达 `/dashboard`
2. 看到欢迎消息和用户名
3. 看到 4 个 Onboarding 模块：RoleName ✅, Profile ✅, Work Type ✅, Resume ✅
4. 点击任意模块 → 编辑页面 → 修改 → Save → 返回 Dashboard
5. 看到简历结果：Header（姓名/邮箱/电话），Skills（标签），Experiences（列表），Summary（卡片）
6. 点击 "重新上传简历" → 上传新 PDF → 旧结果被覆盖
7. 首次访问：看到高亮引导（Resume Summary → Experiences → Subscription → Upgrade 按钮）

### US3 实现任务

#### Dashboard 结构

- [ ] T045 [P] [US3] 创建 `web/app/(protected)/dashboard/page.tsx`，包含欢迎头部、进度条、4 个模块卡片、简历区域、订阅区域
- [ ] T046 [P] [US3] 创建 `web/components/dashboard/welcome-header.tsx`，展示来自 Clerk 的用户名
- [ ] T047 [P] [US3] 创建 `web/components/dashboard/profile-progress.tsx`，根据 `user_profiles` + `resume_parsing_results` + `subscriptions` 计算完成度

#### Onboarding 模块

- [ ] T048 [P] [US3] 创建 `web/components/dashboard/onboarding-modules.tsx`，展示 4 个卡片及完成状态，点击可编辑
- [ ] T049 [US3] 实现编辑导航：点击模块 → `/onboarding/{step}` 并预填充数据，Save → 返回 Dashboard
  - **实现细节**：所有模块（包括 Work Type）编辑后 Save 都直接返回 `/dashboard`，不按 Onboarding 固定顺序继续

#### 简历展示

- [ ] T050 [P] [US3] 创建 `web/components/dashboard/resume-header.tsx`，展示 `resume_parsing_results` 中的 fullName/email/phone
- [ ] T051 [P] [US3] 创建 `web/components/dashboard/resume-skills.tsx`，以标签形式展示 skills
- [ ] T052 [P] [US3] 创建 `web/components/dashboard/resume-experiences.tsx`，列出 company/title/start/end/summary
- [ ] T053 [P] [US3] 创建 `web/components/dashboard/resume-summary.tsx`，展示 summary 文本
- [ ] T054 [US3] 创建 `web/components/dashboard/resume-reupload.tsx`，包含重新上传按钮（调用相同的 `/api/resume/parse` 并 upsert）

#### 首次访问引导

- [ ] T055 [US3] 实现引导检测：优先检查 `localStorage.getItem('hasSeenDashboardGuide')`，若为 null 再检查 `user_profiles.has_seen_dashboard_guide`
- [ ] T056 [US3] 创建 `web/components/dashboard/guide-highlight.tsx`，包含分步高亮覆盖：Resume Summary → Experiences → Subscription → Upgrade 按钮
- [ ] T057 [US3] 引导完成后，设置 DB 和 localStorage 的 `has_seen_dashboard_guide = true`

**检查点**：Dashboard 完全可用，包含简历展示和引导 - US3 完成

---

## 第六阶段：用户故事 4 - Stripe 订阅（优先级：P1）🎯 MVP

**目标**：用户可以通过 Stripe Checkout 升级到 Pro 计划（$9/月），Dashboard 展示订阅状态和 Customer Portal 链接

**独立测试**：
1. Free 用户在 Dashboard 看到 "Free plan" + "Upgrade" 按钮
2. 点击 Upgrade → 重定向到 Stripe Checkout（测试模式）
3. 使用测试卡 `4242 4242 4242 4242` 支付 → 支付完成
4. Webhook 接收 `checkout.session.completed` → 保存到 `subscriptions`
5. Dashboard 更新为 "Pro - $9/month" + 下次扣款日期 + "Manage subscription" 链接
6. 点击 "Manage subscription" → 打开 Stripe Customer Portal
7. 在 Portal 中：取消订阅 → webhook `customer.subscription.deleted` → Dashboard 显示 "Free plan"
8. 测试 webhook 延迟：支付后立即查看 Dashboard，短暂显示 "Syncing..."

### Stripe 配置（US4 前置条件）

- [ ] T016 [US4] 在 `web/.env.local` 配置 Stripe 环境变量：`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_ID`, `APP_URL`
- [ ] T017 [P] [US4] 创建 `web/lib/stripe.ts`，配置 Stripe 客户端单例
- [ ] T018 [P] [US4] 在 Stripe Dashboard 创建 Product（$9/月计划），将 Price ID 复制到 `.env.local`

### US4 实现任务

#### 升级流程

- [ ] T058 [P] [US4] 创建 `web/components/dashboard/subscription-status.tsx`，展示 Free/Pro、计划、下次扣款日期、Upgrade/Manage 按钮
- [ ] T059 [P] [US4] 创建 `web/lib/stripe-checkout.ts`，包含 `createCheckoutSession(userId)` 函数调用 `stripe.checkout.sessions.create`
- [ ] T060 [US4] 实现 "Upgrade" 按钮 onClick：调用 `/api/stripe/checkout`（创建路由）→ 重定向到 Stripe Checkout URL
- [ ] T061 [P] [US4] 创建 `web/app/api/stripe/checkout/route.ts`，创建 Checkout 会话，包含 `metadata.clerk_user_id`，返回 URL

#### Webhook 处理器

- [ ] T062 [P] [US4] 创建 `web/app/api/stripe/webhook/route.ts`，使用 Stripe SDK 进行签名验证
- [ ] T063 [P] [US4] 实现 `checkout.session.completed` 处理器：insert/update `subscriptions`，设置 `plan='pro'`, `active=true`, `next_billing_date`
- [ ] T064 [P] [US4] 实现 `customer.subscription.updated` 处理器：通过 `stripe_subscription_id` 更新 `active`, `plan`, `next_billing_date`
- [ ] T065 [P] [US4] 实现 `customer.subscription.deleted` 处理器：通过 `stripe_subscription_id` 设置 `active=false`, `plan='free'`
- [ ] T066 [US4] 添加幂等性：insert 使用 ON CONFLICT，update 使用 WHERE 子句
- [ ] T067 [US4] 添加日志：接收时记录 event ID/type，记录错误（不含敏感数据）
- [ ] T068 [US4] 本地测试 webhook：`stripe listen --forward-to localhost:3000/api/stripe/webhook` + `stripe trigger` 命令

#### Portal 集成

- [ ] T069 [US4] 实现 "Manage subscription" 按钮：调用 `/api/stripe/portal`（创建路由）→ 重定向到 Customer Portal URL
- [ ] T070 [P] [US4] 创建 `web/app/api/stripe/portal/route.ts`，使用 `customer_id` 创建 Portal 会话
- [ ] T071 [US4] 添加 Pending 状态：在 Dashboard 检查订阅是否存在，若不存在显示 "Syncing..." 消息
  - **实现细节**：Pending 触发条件为 Checkout 成功但 webhook 未更新；提供 "刷新状态" 按钮；超过 3-5 分钟仍 Pending 提示用户稍后刷新或进入 Portal 查看；不强制定死轮询

**检查点**：Stripe 配置、订阅、webhook 完全可用（MVP 级别）- US4 完成，**MVP 完成**

---

## 第七阶段：打磨与跨领域关注点

**目的**：代码测试就绪 / Demo 就绪所需的跨领域改进（MVP 级别）

### 错误处理与日志

- [ ] T072 [P] 为 `web/app/` 中的所有页面组件添加错误边界
- [ ] T073 [P] 实现统一的错误对话框组件 `web/components/ui/error-dialog.tsx`
  - **实现细节**：必须覆盖上传失败/用户取消/解析失败/LLM 整理失败/网络错误；弹窗内容：简短原因 + 建议操作（重试/关闭）；UI 方式不限（原生 alert/modal/shadcn Dialog）
- [ ] T074 [P] 在 `web/lib/logger.ts` 添加结构化日志：认证事件、onboarding 完成、简历解析成功/失败、订阅变更

### 验证与类型安全

- [ ] T075 [P] 在 `web/lib/schemas.ts` 添加所有 API 请求/响应体的 Zod schema
  - **实现细节**：包含 LLM 输出的 ResumeParseResultSchema（参考 plan.md LLM JSON 验证策略）
- [ ] T076 运行 `npm run typecheck` 并修复所有 TypeScript 错误
- [ ] T077 运行 `npm run lint` 并修复所有 ESLint 警告

### 性能与构建

- [ ] T078 [P] 运行 `npm run build` 并验证构建成功（用于代码测试/Demo）
- [ ] T079 [P2] [尽力完成，不阻塞交付] 使用 Lighthouse（Chrome DevTools）在 Desktop profile 下测试 Landing 和 Dashboard，记录分数和 LCP 数值；目标 <3s，若未达标给出主要原因与最小修复建议
- [ ] T079a [P2] [尽力完成，不阻塞交付] 用 DevTools Network 采样普通 API 响应时间 3 次，记录 p95/大致范围；不含 PDF/LLM 解析接口；若 >2s，记录原因（冷启动/DB/RLS/网络）并给出改进建议（可不实施）

### 文档

- [ ] T080 [P] 更新根目录 `README.md`，包含环境配置、运行命令、Stripe 测试模式说明
- [ ] T081 [P] 验证 `quickstart.md` 步骤准确完整

### 安全验证

- [ ] T082 验证代码中无密钥：grep 搜索 keys，确保 `.env.local` 在 `.gitignore` 中
- [ ] T083 验证 `web/app/api/stripe/webhook/route.ts` 中的 webhook 签名验证
- [ ] T084 验证 Supabase Dashboard 中 RLS 策略已启用

---

## 依赖关系与执行顺序

### 阶段依赖

- **项目初始化（第一阶段）**：无依赖 - 可立即开始
- **基础架构（第二阶段）**：依赖项目初始化完成 - **阻塞所有用户故事**
- **用户故事（第三至六阶段）**：都依赖基础架构阶段完成
  - **US1（Landing/Auth）**：基础架构完成后可开始 - 无其他故事依赖
  - **US2（Onboarding）**：基础架构 + US1 完成后可开始 - 使用 US1 的认证
  - **US3（Dashboard）**：依赖 US2 完成 - 需要 Onboarding 数据来展示
  - **US4（Subscriptions）**：依赖 US3 完成 - 集成到 Dashboard
- **打磨（第七阶段）**：依赖所有用户故事完成

### 用户故事依赖关系

```
基础架构（第二阶段）
    ↓
US1: Landing & Auth
    ↓
US2: Onboarding Flow
    ↓
US3: Dashboard & Resume
    ↓
US4: Stripe Subscriptions
    ↓
打磨（第七阶段）
```

### 并行机会

- **项目初始化阶段**：T003, T004, T005, T006 可并行执行
- **基础架构阶段**：T009, T010, T013, T014, T020, T021 可并行执行（在各自依赖完成后）
- **US1**：T022, T023, T024 可并行执行（不同组件）
- **US2**：T027-T028, T030-T031, T033-T034, T036-T038 在各步骤内可并行执行
- **US3**：T045-T047, T048, T050-T054 可并行执行（不同组件）
- **US4**：T016-T018（配置）, T058-T059, T061-T062, T064-T065, T070 可并行执行
- **打磨**：T072, T073, T074, T075, T078, T080 可并行执行

---

## 并行示例：Onboarding 步骤 1（US2）

```bash
# 一起启动这些任务：
任务 T027: 创建 rolename page.tsx
任务 T028: 创建 rolename-form.tsx 组件
# 两者可以并行实现（不同文件）
# 然后实现 T029（保存逻辑），它依赖于两者
```

---

## 实施策略

### MVP 优先（仅用户故事 1-4）

1. 完成第一阶段：项目初始化（T001-T006）
2. 完成第二阶段：基础架构（T007-T015, T019-T021，不含 Stripe 配置）- **关键**
3. 完成第三阶段：US1 Landing & Auth（T022-T026）
4. 完成第四阶段：US2 Onboarding（T027-T044）
5. 完成第五阶段：US3 Dashboard（T045-T057）
6. 完成第六阶段：US4 Subscriptions（T016-T018 配置, T058-T071 集成）
7. **暂停并验证**：端到端测试完整用户旅程（代码测试/Demo）
8. 本地演示 MVP 或部署测试环境

### 渐进式交付

1. **基础就绪**（第二阶段后）：Auth, DB, 外部 API 已配置
2. **+ US1**（第三阶段后）：用户可以注册、登录、看到落地页
3. **+ US2**（第四阶段后）：用户可以完成 Onboarding，到达 Dashboard 占位
4. **+ US3**（第五阶段后）：Dashboard 完全可用，包含简历展示
5. **+ US4**（第六阶段后）：订阅完成 - **MVP 完成**
6. **+ 打磨**（第七阶段后）：代码测试就绪 / Demo 就绪 (MVP 级别)，包含错误处理、日志、验证

### 每次 Commit 的任务量

根据宪法，**每次 commit 实现 1-3 个任务**：

```
Commit 1: T001-T002（项目初始化 + 依赖）
Commit 2: T003（shadcn 初始化）
Commit 3: T004-T006（配置文件并行）
Commit 4: T007-T008（Supabase 设置）
Commit 5: T009-T010（RLS + 客户端，并行）
Commit 6: T011-T012（Clerk 环境变量 + layout）
... 以此类推
```

---

## 任务数量汇总

| 阶段 | 任务数 | 描述 |
|------|--------|------|
| 第一阶段：项目初始化 | 6 | 项目初始化 |
| 第二阶段：基础架构 | 12 | DB, Auth, API, Types |
| 第三阶段：US1（Landing/Auth） | 5 | 发现与认证 |
| 第四阶段：US2（Onboarding） | 18 | 4 步流程 + 简历解析 |
| 第五阶段：US3（Dashboard） | 13 | 展示与首次引导 |
| 第六阶段：US4（Subscriptions） | 17 | Stripe 配置、集成与 webhooks |
| 第七阶段：打磨 | 14 | 错误处理、验证、文档、性能测试（代码测试/Demo 就绪，MVP 级别） |
| **总计** | **85** | **MVP 的所有任务** |

---

## 各故事的独立测试标准

### US1（Landing & Auth）
- 落地页在 `/` 可访问
- 注册流程可用（邮箱 + 验证）
- 登录流程可用（邮箱/密码、Google）
- 路由保护正确重定向未认证用户

### US2（Onboarding）
- 所有 4 个步骤按顺序可访问
- 必填字段已验证（为空时 Next 禁用）
- 每步后数据持久化
- 简历上传触发解析并展示结果
- 仅在解析完成后启用 Start/Continue

### US3（Dashboard）
- Dashboard 正确展示所有 4 个模块及状态
- 编辑流程可用（点击 → 修改 → Save → 返回）
- 简历结果正确展示（Header/Skills/Experiences/Summary）
- 重新上传覆盖旧结果
- 首次引导出现一次并引导各区域

### US4（Subscriptions）
- Free 状态显示 Upgrade 按钮
- Upgrade 重定向到 Stripe Checkout
- 测试卡支付成功完成
- Webhook 正确更新数据库
- 支付后 Dashboard 显示 Pro 状态
- Customer Portal 链接可用
- 取消订阅后 Dashboard 更新为 Free

---

## 备注

- [P] 任务 = 不同文件，无阻塞依赖
- [US1-US4] 标签将任务映射到用户故事，便于追溯
- 每个用户故事可独立完成和测试
- 每 1-3 个任务 commit 一次（宪法要求）
- 可在任何检查点暂停，独立验证故事
- 每阶段后运行 `npm run typecheck` 和 `npm run lint`
- 所有 API 调用仅在服务端路由（绝不在客户端）
- **Webhook 签名验证是强制的**（安全门控）
