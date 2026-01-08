1. 初次梳理
# 1.1 Prompt
@README.md 我生成好了一个我自己版本的README.md 文档,其中要开发这个项目的话你认为我的项目结构清晰吗?是否需要补充或修改? 

# 1.1 Output
我来仔细分析你的 README.md 结构和内容。

  整体评价：结构清晰，内容完整度 85%

  ✅ 做得好的地方

  1. 目标明确：MVP 范围界定清晰，Non-goals 也写清楚了
  2. 环境变量详细：安全提醒到位，配置示例清楚
  3. 技术决策透明：简历解析选型（选项 B）有理由说明
  4. 验收清单：可量化的交付标准

  ⚠️ 需要补充的关键内容

  1. 安装步骤不完整（第 3.2 节）

  cd web
  npm install  # ← 缺少这一步
  npm run dev

  2. 缺少数据库 Schema 说明

  建议补充 Supabase 表结构设计：
  ## 4.5 Supabase Schema
  需要创建以下表：
  - users_profile（用户 Profile + Onboarding 状态）
  - resume_parsed（简历解析结果，每用户 1 条，覆盖写）
  - subscriptions（Stripe 订阅状态同步）

  具体字段见 spec.md 或数据库迁移脚本

  3. Stripe Webhook 本地测试配置缺失

  ### 5.1 本地测试 Stripe Webhook
  使用 Stripe CLI 转发 webhook：
  \`\`\`bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  \`\`\`
  获取 webhook signing secret 并更新到 .env.local

  4. 路由保护逻辑应该更明确

  建议在第 7 节「项目结构」后添加：
  ## 7.1 路由访问规则
  - **未登录**：可访问 `/`、`/sign-in`、`/sign-up`；访问受保护路由 → `/sign-in`
  - **已登录但未完成 Onboarding**：访问 `/dashboard` → `/onboarding`
  - **已完成 Onboarding**：可访问 `/dashboard`；可点击 Dashboard 模块卡片跳转编辑 Onboarding 各步

  5. 项目结构可以更具体

  当前第 7 节太抽象，建议改为：
  web/
  ├── app/
  │   ├── (auth)/
  │   │   ├── sign-in/[[...sign-in]]/page.tsx
  │   │   └── sign-up/[[...sign-up]]/page.tsx
  │   ├── onboarding/
  │   │   ├── role/page.tsx          # Step 1
  │   │   ├── profile/page.tsx       # Step 2
  │   │   ├── work-type/page.tsx     # Step 3
  │   │   └── resume/page.tsx        # Step 4
  │   ├── dashboard/page.tsx
  │   └── api/
  │       ├── resume/parse/route.ts
  │       └── stripe/webhook/route.ts
  ├── lib/
  │   ├── supabase.ts
  │   ├── stripe.ts
  │   └── resume-parser.ts
  └── components/
      ├── ui/              # shadcn/ui 组件
      └── dashboard/       # Dashboard 专用组件

  6. 开发规范应该提及

  ## 9. 开发规范（关键提醒）
  - **安全红线**：禁止在代码、提交记录中出现真实 key
  - **代码质量**：改动后必须通过 `npm run lint` 和 `npm run typecheck`
  - **最小改动**：优先编辑现有文件，避免过度工程
  - **协作宪法**：所有行为规则以 `.specify/memory/constitution.md` 为准

  🎯 推荐的修改优先级

  P0（必须补充）：
  1. 安装步骤加上 npm install
  2. Stripe webhook 本地测试说明
  3. 路由访问规则明确化

  P1（强烈建议）：
  4. 数据库 Schema 说明
  5. 项目结构具体化

  P2（锦上添花）：
  6. 开发规范提醒
  7. 常见问题 FAQ（如 webhook 延迟怎么调试）

# 1.2 Prompt
@CLAUDE.md 我生成好了一个我自己版本的CLAUDE.md 文档,其中要开发这个项目的话你认为我的内容或结构上描述清晰吗?是否需要补充或修改? 

# 1.2 Output
我来仔细分析你的 CLAUDE.md 文档的清晰度和完整性。

  整体评价：结构清晰，定位准确，内容完整度 90%

  ✅ 做得非常好的地方

  1. 定位精准：作为"入口索引"而非重复 spec/constitution，这个定位非常正确
  2. 优先级明确：第 1 节的优先级顺序清晰，避免了文档冲突时的混乱
  3. 安全意识：在第 3 节和第 9 节都强调了安全要求
  4. 流程清晰：第 6 节的路由与核心流程高层摘要写得很好
  5. 实用指导：第 9 节"不确定时怎么做"非常实用

  ---
  ⚠️ 需要补充/修改的内容

  P0（建议补充）

  1. 第 5 节缺少 middleware.ts 说明

  当前只列出了页面和 API 路由，但缺少关键的路由保护中间件说明。

  建议在第 5 节补充：
  Next.js 工程在 `web/`：
  - `web/app/`：页面与路由（App Router）
    - ...（现有内容）
  - `web/middleware.ts`：Clerk 路由保护中间件（配合 matcher 控制访问权限）
  - `web/lib/`：
    - ...（现有内容）

  2. 第 6 节缺少 Dashboard 编辑返回逻辑的明确说明

  当前只说"支持点击跳转编辑（保存后返回 Dashboard）"，但没有强调不需要按顺序走完后续步骤。

  建议修改第 6 节 Dashboard 部分：
  **Dashboard：**
  - 展示 4 个 onboarding 模块完成状态，并支持点击跳转编辑
    - **编辑行为**：从 Dashboard 点击进入某一步编辑页后，修改并 Save 直接返回 Dashboard（不需要按 Onboarding 固定顺序走后续页面）
  - 展示简历解析结构化结果（重新上传覆盖）
  - 展示订阅状态（Free/Pro、下次扣款日期、Portal 入口）
  - 首次进入 Dashboard 需要高亮引导（分步 OK/Next 推进，最后引导点 Upgrade）

  P1（强烈建议）

  3. 第 3 节缺少数据库表结构引用

  当前只说"Supabase：只存结构化解析结果"，但没说明有哪些表。

  建议在第 3 节 Supabase 后补充：
  - Supabase：只存结构化解析结果（每用户 1 份，覆盖写）
    - 核心表：`users_profile`（Onboarding 数据 + 完成状态）、`resume_parsed`（简历解析结果）、`subscriptions`（Stripe 订阅状态）
    - 详细 Schema 见 `README.md` 第 4.2 节

  4. 第 4 节缺少 Clerk 环境变量配置的提及

  运行方式只说了命令，但没提醒 Clerk 的路由配置环境变量。

  建议在第 4 节补充：
  在 `web/` 目录执行（详见 README）：
  - 前置：确保 `web/.env.local` 已配置完整（Clerk/Supabase/Stripe/PDF 解析 keys）
  - `npm install`
  - `npm run dev`
  - ...（现有内容）

  5. 第 6 节缺少首次 Dashboard 高亮引导的实现提示

  当前只说"首次进入 Dashboard 需要高亮引导"，但没说明如何判断"首次"。

  建议在第 6 节 Dashboard 部分补充：
  - 首次进入 Dashboard 需要高亮引导（分步 OK/Next 推进，最后引导点 Upgrade）
    - **首次判断**：可存 DB 字段（如 `has_seen_dashboard_tour`）或 localStorage
    - **引导内容**：依次高亮 Resume Summary → Experiences → Subscription → 最后引导点击 Upgrade

  P2（可选优化）

  6. 第 0 节可以补充非目标

  当前只说了目标和阶段，可以简要提及非目标以避免过度实现。

  建议在第 0 节补充：
  **阶段：** Code Test / MVP（优先功能可用、流程完整、可本地跑通；UI 只需基础样式与轻度模仿）。

  **非目标（Out of Scope）：**
  - 不实现 JD 匹配/兼容度评分算法
  - 不实现 LinkedIn 登录
  - 不实现多份简历版本管理
  - 不保存 PDF 文件本体

  7. 第 7 节可以补充解析字段示例

  当前只说"字段结构与展示要求见 spec.md"，可以给一个最小示例。

  建议在第 7 节补充：
  字段结构与展示要求见 `spec.md`。

  **最小字段示例（供快速参考）：**
  - `fullName`, `email`, `phone`
  - `skills`（数组）
  - `experiences`（数组，包含 company/title/start/end/summary）
  - `resumeSummary`

  ---
  🎯 推荐的修改优先级

  P0（建议补充，影响开发效率）：
  1. ✅ 补充 middleware.ts 说明
  2. ✅ 明确 Dashboard 编辑返回逻辑

  P1（强烈建议，提升文档完整性）：
  3. ✅ 补充数据库表结构引用
  4. ✅ 提及环境变量配置前置
  5. ✅ 补充首次 Dashboard 高亮引导实现提示

  P2（可选，锦上添花）：
  6. 补充非目标
  7. 补充解析字段示例

  ---
  📋 总结

  你的 CLAUDE.md 文档作为"入口索引"非常优秀，结构清晰、定位准确。主要缺失的是：
  - middleware.ts 的提及（关键文件遗漏）
  - Dashboard 编辑返回逻辑的明确说明（避免误解为需要走完后续步骤）
  - 数据库表结构的引用（方便快速定位）

  补充完 P0 + P1 内容后，这将成为一个非常完整的 AI Agent 入口文档！

 # 1.3 Prompt
 P0的两条可以修改。P1-3我建议不写死表名:
  Supabase：存三类数据（Onboarding/Profile、Resume 解析结果、Subscription 状态）；具体 schema/表名以 README 为准。                                             
  P1-4可以修改.P1-5可以修改但不要写成强制实现细节:在首次判断语句后面加上(已实现便利为准).P2的第6和第7点先不需要修改. 

  # 1.3 Output
  ✅ 修改总结

  P0（必须补充）

  1. ✅ 第 5 节：补充了 web/middleware.ts 说明（Clerk 路由保护中间件）
  2. ✅ 第 6 节：明确了 Dashboard 编辑返回逻辑（不需要按顺序走后续页面）

  P1（强烈建议）

  3. ✅ 第 3 节：补充了数据库说明，但不写死表名
    - 改为："存三类数据（Onboarding/Profile、Resume 解析结果、Subscription 状态）；具体 schema/表名以 README 为准"
  4. ✅ 第 4 节：补充了环境变量配置前置提醒
  5. ✅ 第 6 节：补充了首次 Dashboard 高亮引导实现提示
    - 首次判断：以实现便利为准（可存 DB 字段或 localStorage）
    - 引导内容：依次高亮 Resume Summary → Experiences → Subscription → 最后引导点击 Upgrade

  P2（未修改）

  6. ⏸️ 非目标说明（未修改）
  7. ⏸️ 解析字段示例（未修改）

  ---
  现在的 CLAUDE.md 已经非常完整且灵活，既明确了关键信息（middleware、编辑返回逻辑、环境变量前置），又避免了过度限定实现细节（数据库表名、首次判断方式）。这样的文档既能引导 AI Agent 快速理解项目，又保留了实现的灵活性！

  