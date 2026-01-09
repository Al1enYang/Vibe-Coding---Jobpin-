1. 背景与目标
1.1 背景

实现一个仿 jobpin.ai 的求职助手应用：用户先登录/注册，完成 Onboarding（固定步骤）后进入 Dashboard。用户上传 PDF 简历，系统解析并展示结构化信息，并提供 Stripe 订阅入口（Test 模式）。

1.2 目标

Clerk 登录/注册可用，Dashboard 受保护；实现邮箱验证码逻辑（Clerk 默认行为）

Onboarding 为独立路由，按步骤完成后进入 Dashboard

用户上传 PDF 简历后，可得到结构化信息并展示

Stripe Test 订阅流程跑通；webhook 同步订阅状态并在 Dashboard 展示

UI 不追求高还原，但允许轻度模仿 jobpin.ai 风格（Tailwind/Shadcn 任意）

1.3 非目标（Out of scope）

不实现 JD 匹配/兼容度评分算法

不实现 LinkedIn 登录（仅 Email+Password + Google）

不实现多份简历版本管理（每用户只保留 1 份）

不追求 UI 高还原（但允许轻度定制）

不实现订阅限制业务（例如付费解锁查看/下载等）

2. 用户与使用场景
2.1 用户类型

未登录用户：只能访问 Landing Page（/）

已登录但未完成 Onboarding：访问 /dashboard 会被重定向到 /onboarding

已登录并完成 Onboarding：可进入 /dashboard

已订阅用户：Dashboard 展示订阅计划与下次扣款日期，并提供管理订阅入口

2.2 使用场景

用户通过 Landing CTA 注册/登录 → 进入 Onboarding（4 个页面按顺序完成）→ 进入 Dashboard → 查看解析结果/订阅状态 →（可选）升级订阅。

3. 功能范围
3.1 Must（必须实现）
A） 登录/注册（Clerk）

使用 Clerk 的 Next.js（App Router）集成

页面/路由：

/sign-up：注册

/sign-in：登录

/dashboard：登录保护

支持：

Email + Password 注册/登录

Google 登录

**Clerk 集成实现要求**：
1. 在 `app/layout.tsx` 中配置 `<ClerkProvider>`:
   ```tsx
   import { ClerkProvider } from '@clerk/nextjs'

   export default function RootLayout({ children }) {
     return (
       <ClerkProvider>
         {children}
       </ClerkProvider>
     )
   }
   ```

2. 使用 Clerk 提供的组件:
   - `/sign-in` 路由使用 `<SignIn />` 组件
   - `/sign-up` 路由使用 `<SignUp />` 组件
   - 或使用 Clerk 的路由中间件进行自动重定向

**邮箱验证码逻辑**：
- 必须可用（由 Clerk 默认行为实现）
- 用户注册后发送验证码到邮箱
- 验证通过后才能完成注册

校验与错误提示：
系统需提供这些校验与错误提示（可由 Clerk 默认行为实现）
邮箱验证码逻辑必须可用（由 Clerk 默认行为实现）。
密码规则由 Clerk policy 或默认策略提供。

B） Landing Page（/，未登录可访问）

Hero：标题 + 副标题 + CTA（例如 “Get started for free”）

How it works（2-step 模块）

Step 1：完善个人信息、上传简历

Step 2：解析简历并生成结构化信息（以及求职建议展示占位）

C） Onboarding（独立路由，4 个页面固定顺序）

Onboarding 路由为独立流程（例如 /onboarding/...），一共 4 个单独页面，按顺序完成：

Step 1：RoleName 页面

用户填写 Role（Profile Name）（必填）

Step 2：Profile 页面

字段：

First Name（必填）

Last Name（必填）

Country（可选）

City（可选）

Step 3：Work Type 页面

Work Type 多选（可选）：part-time / full-time / internship

Step 4：Resume 页面（上传简历并解析展示结果）

引导文案：提示用户“上传后我们会自动为你解析”

用户上传 PDF，完成解析并展示结构化结果（至少展示本 PRD 定义的结构化字段）

完成后提供一个类似 “Start / Continue” 的按钮进入 Dashboard

Onboarding 完成条件（进入 Dashboard 的最低要求）：

RoleName ✅

First Name ✅

Last Name ✅

Resume 解析并展示结果 ✅（完成 Step 4）

Onboarding 数据保存策略：

每一步都保存（Next/Save 即持久化）

进度/字段完成情况存 Supabase DB（与 Clerk userId 关联）

首次进入 Dashboard 的站内高亮引导（第一次注册用户）

仅在用户第一次进入 Dashboard 时触发一次，采用混合方案判断：优先检查 localStorage，不存在时再查 DB 字段 `hasSeenDashboardGuide`（布尔值）

引导方式：高亮说明几个主要区域，例如：

「这里是总结（Resume Summary）」

「这里是工作经历（Experiences）」

「这里是订阅状态（Subscription）」

每一步高亮提示需有一个类似 “OK / Next” 的按钮推进

高亮说明主要区域完成后：

以同样高亮方式引导用户点击 “Upgrade / Subscribe” 按钮

点击后跳转到 Stripe 订阅流程（Checkout）

D） Dashboard（完成 Onboarding 后进入的主页面）

Dashboard 至少包含以下区域：

顶部欢迎区

显示用户姓名（来自 Clerk）

Profile 完成度进度条（至少基于：

Profile（RoleName/First/Last）是否完成

Resume 是否已完成解析

订阅是否 active）

Onboarding 步骤区（显示 4 个部分 + 完成状态 + 可跳转编辑）

显示 4 个 Onboarding 模块，并标注每个模块的完成状态（已完成/未完成）：

RoleName

Profile

Work Type

Resume

用户可点击任意模块快速跳转到对应的 Onboarding 编辑页面

编辑行为要求：

从 Dashboard 点击进入某一步编辑页后，用户修改并点击 Save 即可返回 Dashboard

返回 Dashboard 后不需要继续按 Onboarding 固定顺序走后续页面

简历信息区

展示解析后的结构化信息

提供 “重新上传简历” 按钮：直接覆盖旧解析结果

订阅状态区

若用户未订阅：

显示 “Free plan” + 升级按钮（通过 Stripe 开始订阅）

若用户已订阅：

显示当前订阅计划（例如 “Pro – $1 / month”）+ 下次扣款日期

提供一个「管理订阅」链接：

跳转到 Stripe Customer Portal

用户可在 Portal 中进行取消订阅 / 切换 plan（不需要在应用内自建完整 UI）

简单统计/占位

技能数量、经历条数、兼容度占位（fake data）

E） 简历上传 & 结构化解析（选项 B：外部解析 API + LLM 整理）

目标：用户上传 PDF 后，系统得到结构化信息并展示；每用户仅保留 1 份解析结果（重新上传覆盖）。

存储策略

不保存 PDF 文件本体

仅保存结构化解析结果到 Supabase（覆盖写）

实现方式（服务端处理，隐藏 key）

前端上传 PDF 至应用自身的服务端接口（Next.js Route Handler，例如 POST /api/resume/parse）

服务端流程（接口格式要求）：

接收 PDF 文件并转为 base64（或其他接口要求格式）

调用外部 PDF 解析接口获得"原始解析结果"（接口需支持：文件上传、返回文本/markdown，超时 60 秒）

将解析结果（或其中的可读文本/markdown部分）发送给大模型接口进行整理（接口需支持：文本输入、结构化 JSON 输出，超时 60 秒）

大模型输出严格结构化 JSON（字段见下）

保存结构化 JSON 到 Supabase，并返回给前端展示

注：具体服务商选择（如 PDF.co/Adobe PDF Services + OpenAI/Claude）在计划阶段确定

超时与重试策略：

每个外部 API 调用（PDF 解析、LLM 整理）设置 60 秒超时

发生超时或 5xx 错误时，不自动重试，直接向前端返回错误并提示用户手动重试

结构化输出最小字段（至少）

fullName（string）

email（string）

phone（string）

skills（string[]，可为空）

experiences（数组，至少 1–2 段为目标；缺失允许为空）：

company（string）

title（string）

start（string）

end（string）

summary（string）

resumeSummary（string）

LLM 整理约束

必须输出有效 JSON（不带多余解释文本）

找不到字段时使用空字符串/空数组，不允许编造

页面展示结构

Header：姓名/邮箱/电话

Skills：标签形式显示

Experiences：列表（公司、职位、起止时间、简要描述）

Resume Summary：卡片

F） Stripe 订阅（Test 模式）

单一 plan：$9/月

Checkout：点击 Upgrade/Subscribe → Stripe Checkout（Test）

用户可在 Stripe Checkout 中绑定银行卡（Test 卡号，例如 4242 4242 4242 4242）

Webhook 同步订阅状态（至少处理）：

checkout.session.completed

customer.subscription.updated

customer.subscription.deleted

Webhook 安全要求：

必须使用 Stripe 官方库进行签名验证,防止伪造请求

验证失败时拒绝处理并记录错误日志

DB 记录（至少）：

userId（Clerk）

stripeCustomerId

stripeSubscriptionId

plan

active

nextBillingDate

Customer Portal：

Dashboard 提供 “Manage subscription” 链接跳转 Portal

用户可在 Portal 中取消订阅 / 切换 plan（不要求在应用内实现完整 UI）

Dashboard 订阅区需根据订阅状态展示对应信息（Free/Pro、下次扣款日期、Portal 入口）

3.2 数据模型需求（业务字段，具体表结构在计划阶段设计）

Onboarding 相关数据需求：
- 用户标识：与 Clerk userId 关联
- RoleName（Profile Name）：字符串，必填
- Profile 信息：
  - First Name：字符串，必填
  - Last Name：字符串，必填
  - Country：字符串，可选
  - City：字符串，可选
- Work Type：多选字符串数组（part-time / full-time / internship），可选
- Onboarding 完成状态：至少需记录 RoleName、First Name、Last Name、Resume 解析是否完成
- Dashboard 引导标记：hasSeenDashboardGuide（布尔值）

简历解析结果数据需求（每用户仅保留 1 份）：
- fullName（string）
- email（string）
- phone（string）
- skills（string[]，可为空）
- experiences（数组，每项包含 company/title/start/end/summary）
- resumeSummary（string）

订阅数据需求：
- userId（Clerk 用户 ID）
- stripeCustomerId（Stripe 客户 ID）
- stripeSubscriptionId（Stripe 订阅 ID）
- plan（订阅计划标识，如 "pro"）
- active（布尔值，订阅是否激活）
- nextBillingDate（下次扣款日期）

3.3 非功能质量属性

性能目标：
- 页面首次加载：<3 秒（LCP 目标）
- API 响应时间：<2 秒（不含外部 PDF 解析和 LLM 处理时间）
- 简历解析外部调用：每次 60 秒超时（已在实现方案中定义）

可观测性要求：
- 日志记录范围：
  - 所有错误（Error 级别）
  - 关键业务流程：用户注册、Onboarding 完成、简历解析成功/失败、订阅状态变更
- 日志内容：至少包含 userId、操作类型、成功/失败状态、关键错误信息（不含敏感数据）
- 不要求实时监控或告警系统（MVP 阶段）

4. 核心流程与异常处理（必须写清）
4.1 访问与路由保护流程

未登录用户：

可访问 /、/sign-in、/sign-up

未登录访问 /onboarding 或 /dashboard → 重定向 /sign-in

登录后：

默认进入 /onboarding（新用户）

未完成 Onboarding（四步未完成）：

访问 /dashboard → 重定向 /onboarding

完成 Onboarding：

通过 Step 4 的 “Start/Continue” 进入 /dashboard

4.2 注册（Sign up）流程与异常（Clerk 默认行为即可满足）

主流程：

Landing CTA → /sign-up

用户填写 Email / Password / Confirm Password

发送并填写 Email verification code

验证通过 → 注册成功 → 进入 /onboarding

异常：
系统需提供这些校验与错误提示（可由 Clerk 默认行为实现）

Email 格式不正确

密码不符合 Clerk policy/默认策略

Password 与 Confirm Password 不一致

Email verification code 不正确/过期（可重发）

Email 已被注册（引导去登录）

4.3 登录（Sign in）流程

/sign-in 提供 Email+Password 与 Google 登录

sign-up / sign-in 之间可互相跳转

4.4 Onboarding 流程与异常（4 页面）

主流程：

RoleName → Next

Profile（First/Last 必填；Country/City 可选）→ Next

Work Type（可选多选）→ Next/Skip

Resume（上传 PDF，提示“上传后自动为你解析”）→ 解析完成展示结果 → 点击 Start/Continue → Dashboard

异常/交互约束：

必填未填时：

Next 不可用（disabled）或点击提示错误

Skip 不可用（对必填步骤）

Resume 页面：

未完成上传解析前，Start/Continue 不可用（或提示需完成解析）

4.5 简历上传与解析异常（B 方案）

用户取消选择文件 / 上传取消：

弹出对话框提示 “上传已取消/未选择文件”，允许重新上传

上传到应用服务端失败：

弹出对话框提示 “上传失败”，提供重试

外部 PDF 解析接口失败 / 超时：

弹出对话框提示 “解析服务不可用/解析失败”，提供重试

LLM 整理失败 / 输出非 JSON：

弹出对话框提示 “整理失败，请重试”，并记录日志（不展示敏感信息）

解析成功但字段缺失：

仍展示页面，缺失字段显示 “Not found/Unknown”

重新上传：

直接覆盖旧解析结果（无需二次确认）

4.6 订阅流程与异常（含 Pending）

主流程：

Dashboard 点击 Upgrade/Subscribe

跳转 Stripe Checkout（Test），用户可使用测试卡完成绑定与支付

webhook 写入订阅状态到 DB

Dashboard 展示订阅计划、下次扣款日期、Portal 链接

异常/边界：

支付失败/取消：仍为 Free，可重试

webhook 延迟/未同步（Pending）：Dashboard 提示 Subscription syncing... / Pending activation

取消订阅/切换 plan：通过 Portal 完成后，webhook 同步到系统并更新展示

取消订阅：收到 customer.subscription.deleted 后 active=false，显示 Free

5. 验收标准（Definition of Done）
5.1 登录/注册

Clerk 注册/登录可用，支持 Email+Password + Google

邮箱验证码流程可用（Clerk 默认行为）

/dashboard 受保护，未登录跳 /sign-in

5.2 Onboarding（4 页面）

Onboarding 独立路由，按 4 页面顺序完成

Step 4（Resume）必须完成解析并展示结果后才能进入 Dashboard

未完成 Onboarding 访问 /dashboard → 重定向 /onboarding

Dashboard 显示 4 模块完成状态，并可点击跳回对应编辑页；编辑后 Save 返回 Dashboard

5.3 简历解析与展示（B 方案）

用户上传 PDF 后，系统通过外部解析 + LLM 整理得到结构化 JSON 并展示 Header/Skills/Experiences/Summary

只保存解析结构化结果，不保存 PDF 本体；重新上传覆盖旧结果

上传取消/失败、外部解析失败、LLM 整理失败都有对话框提示并支持重试

5.4 Stripe 订阅

$9/月 Test 订阅可跑通 Checkout，并可使用测试卡完成支付

webhook 三事件可更新 DB 订阅状态

Dashboard 正确展示 Free/Pro、下次扣款日期、Portal link

webhook 延迟时 Dashboard 有 Pending 提示

Portal 可用于取消订阅/切换 plan，且系统状态可通过 webhook 同步更新展示

## Clarifications

### Session 2026-01-09

- Q: PDF 解析和 LLM 处理的超时/重试策略是什么？ → A: 每次 API 调用 60 秒超时，超时/5xx 错误时不自动重试，直接显示错误提示，允许用户手动重试
- Q: 首次进入 Dashboard 的站内高亮引导,应该使用什么方式来判断"首次"？ → A: 混合方案 - 优先检查 localStorage，不存在时再查 DB，平衡性能与可靠性
- Q: 用于简历解析的外部 PDF 解析 API 和 LLM API 应该选择什么服务？ → A: 仅规定接口格式,具体实现在计划阶段确定,保持灵活性
- Q: Supabase 数据库表结构应该如何在规格中定义？ → A: 仅列出业务字段需求,具体表结构在计划/实现阶段设计
- Q: 应用的非功能质量属性(性能、可观测性)应该达到什么水平？ → A: 定义基本性能目标(页面加载 <3s, API 响应 <2s)和基础日志要求(error + 关键业务流程)
- Q: Stripe Webhook 端点应该如何验证请求的真实性？ → A: 实现 Webhook 签名验证(使用 Stripe 官方库验证),防止伪造请求,符合安全最佳实践