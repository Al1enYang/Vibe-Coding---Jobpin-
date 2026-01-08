# CLAUDE.md — 项目协作说明（Claude Code）

> 目的：让 Claude Code / AI Agent 进入仓库后，能快速理解目标、边界、协作方式与验证要求。  
> 注意：本文件是“入口索引 + 项目说明”，不重复写宪法/PRD 细节；协作宪法以 `.specify/memory/constitution.md` 为准，产品规格以 `spec.md` 为准，运行与 env 配置以 `README.md` 为准。

---

## 0） 一句话目标 & 当前阶段

**目标（MVP）：** 复刻 jobpin.ai 的核心流程（登录/注册 → Onboarding 4 步 → 简历上传解析 → Dashboard → Stripe 订阅 Test 模式）。  
**阶段：** Code Test / MVP（优先功能可用、流程完整、可本地跑通；UI 只需基础样式与轻度模仿）。

---

## 1） 权威来源与优先级（重要）

当出现冲突时按以下优先级处理，并**先指出冲突点再继续实现**：

1. `.specify/memory/constitution.md`：协作宪法与全局行为规则（最高优先级）
2. `spec.md`：产品规格（需求/流程/异常/验收）
3. `README.md`：本地运行、环境变量、Stripe Test 说明
4. `CLAUDE.md`：入口索引与项目说明（本文件）

---

## 2） 协作宪法（不要在这里重复）

**必须遵守：** `.specify/memory/constitution.md`  
（包含：交付节奏、计划方式、验证要求、质量红线、最小改动原则等。）

---

## 3） 技术栈（高层概览）

- Next.js 14（App Router）+ TypeScript
- Clerk：Email+Password（邮箱验证码）+ Google 登录
- Supabase：存三类数据（Onboarding/Profile、Resume 解析结果、Subscription 状态）；具体 schema/表名以 README 为准
- Stripe：Subscriptions（Test 模式），单一 plan $9/月，webhook 同步状态 + Customer Portal
- UI：Tailwind（可选 shadcn/ui）

**安全要求（高层提醒）：**
- 所有密钥只允许存在于 `web/.env.local`（本地）或部署环境变量中
- 禁止在代码、README、提交记录里出现任何真实 key
- 禁止提交 `.env.local`

（详细规则见 `.specify/memory/constitution.md` 与 `README.md`）

---

## 4） 运行方式（dev/build/lint/test/typecheck）

在 `web/` 目录执行（详见 README）：
- 前置：确保 `web/.env.local` 已配置完整（Clerk/Supabase/Stripe/PDF 解析 keys）
- `npm install`
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`

**关于 test：**
- 若项目存在 `npm run test`（或等价脚本），改动后必须执行并通过；
- 若未配置自动化测试，则以关键路径手动验证 + lint + typecheck 为最低标准（细则见宪法与 spec）。

---

## 5） 目录结构与关键模块定位（入口/路由/核心业务位置）

> 以仓库实际为准；以下为推荐/预期定位，便于 agent 快速定位文件。

根目录（交付物/文档）：
- `.specify/memory/constitution.md`：协作宪法（最高优先级）
- `spec.md`：PRD / 规格（需求、流程、异常、验收）
- `README.md`：运行方式、env、Stripe Test 说明
- `PROMPTS.md`：不作为实现依据
- `Reflection.md`：不作为实现依据
- `CLAUDE.md`：本文件（索引与说明）

Next.js 工程在 `web/`：
- `web/app/`：页面与路由（App Router）
  - `web/app/sign-in`、`web/app/sign-up`（或等价 auth 路由）
  - `web/app/onboarding/*`：Onboarding 4 步（独立路由）
  - `web/app/dashboard/*`：Dashboard
  - `web/app/api/resume/parse/route.ts`：简历解析（服务端）
  - `web/app/api/stripe/webhook/route.ts`：Stripe webhook
- `web/middleware.ts`：Clerk 路由保护中间件（配合 matcher 控制访问权限）
- `web/lib/`：
  - Supabase / Stripe / Resume 解析与 LLM 整理封装
- `web/components/`：
  - UI 组件（可选 `ui/`）

---

## 6） 路由与核心流程（高层摘要）

**未登录：**
- 可访问：`/`、`/sign-in`、`/sign-up`
- 访问 `/onboarding` 或 `/dashboard` → 重定向 `/sign-in`

**登录后：**
- 新用户/未完成 onboarding：访问 `/dashboard` → 重定向 `/onboarding`
- 完成 onboarding（4 步）后：进入 `/dashboard`

**Onboarding（4 个独立页面，固定顺序完成进入 Dashboard）：**
1) RoleName（必填）
2) Profile（First/Last 必填；Country/City 可选）
3) Work Type（可选多选）
4) Resume（上传 PDF → 解析 → 展示结果 → Start/Continue 进入 Dashboard）

**Dashboard：**
- 展示 4 个 onboarding 模块完成状态，并支持点击跳转编辑
  - **编辑行为**：从 Dashboard 点击进入某一步编辑页后，修改并 Save 直接返回 Dashboard（不需要按 Onboarding 固定顺序走后续页面）
- 展示简历解析结构化结果（重新上传覆盖）
- 展示订阅状态（Free/Pro、下次扣款日期、Portal 入口）
- 首次进入 Dashboard 需要高亮引导（分步 OK/Next 推进，最后引导点 Upgrade）
  - **首次判断**：以实现便利为准（可存 DB 字段或 localStorage）
  - **引导内容**：依次高亮 Resume Summary → Experiences → Subscription → 最后引导点击 Upgrade

所有流程/边界/异常/验收细节以 `spec.md` 为准。

---

## 7） 简历解析实现（关键提醒）

解析方案：**选项 B（外部解析 API + LLM 整理）**  
关键约束：
- 必须在**服务端**解析（Next.js Route Handler / Server 侧），禁止在浏览器端直接调用外部解析/LLM（避免泄露 key）
- 仅保存结构化解析结果到 Supabase，不保存 PDF 文件本体
- 每用户仅保留 1 份解析结果，重新上传直接覆盖

字段结构与展示要求见 `spec.md`。

---

## 8） Stripe 订阅（Test）关键提醒

- 单一 plan：$9/月
- Upgrade/Subscribe → Stripe Checkout（Test）
- webhook 至少处理：`checkout.session.completed`、`customer.subscription.updated`、`customer.subscription.deleted`
- Dashboard 展示 Free/Pro、下次扣款日期、Customer Portal 管理入口
- webhook 延迟时：Dashboard 展示 Pending/同步中提示

细节与验收见 `spec.md` 与 `README.md`。

---

## 9） 不确定时怎么做

- 不要猜：先查 `.specify/memory/constitution.md`、`spec.md`、`README.md`
- 仍不确定：提出 1–3 个清晰问题让我决策
- 需要新增依赖/改结构：先说明收益与风险，再做最小变更方案
