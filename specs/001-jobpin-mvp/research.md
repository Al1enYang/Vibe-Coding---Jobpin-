# Research Document: Jobpin MVP - Technical Decisions

**Feature**: 001-jobpin-mvp
**Date**: 2026-01-09
**Phase**: Phase 0 - Research & Technical Decisions

## Overview

本文档记录了 Jobpin MVP 项目的技术选型决策,涵盖 PDF 解析、LLM 服务、UI 组件库和部署平台。所有决策基于 MVP 阶段的需求(快速启动、成本可控、易于维护)。

---

## Decision 1: PDF 解析服务

### 🏆 Final Decision: **DMXAPI (现有接口)**

#### Rationale

**1. 已有现成接口**
- PDF 解析接口: `https://www.dmxapi.cn/v1/responses` (模型: `hehe-tywd`)
- LLM 整理接口: `https://www.dmxapi.cn/v1/chat/completions` (模型: `gpt-5-mini`)
- 参考实现: `example.py` 和 `llm_example.py`

**2. 集成简单**
- 统一的 API 提供商 (DMXAPI)
- 使用相同的 API Key
- 参考 Python 示例可直接转换为 TypeScript

**3. 完全服务端处理**
- 符合安全要求(隐藏 API 密钥)
- 不暴露任何密钥到浏览器
- 可在 Next.js Route Handler 中实现

**4. 成本可控**
- 使用现有 API 密钥,无需额外注册
- 按实际使用计费

#### Alternatives Considered

| 选项 | 成本(月/100次) | 优势 | 劣势 | 推荐度 |
|------|---------------|------|------|--------|
| **DMXAPI (现有)** | 根据实际计费 | 已有现成接口、统一管理 | 依赖第三方服务 | ⭐⭐⭐⭐⭐ |
| pdf-parse + GPT-4o-mini | ~$0.30 | 成本最低、集成简单 | 解析能力依赖 PDF 文本质量 | ⭐⭐⭐⭐ |
| Adobe PDF Services + GPT-4o-mini | $0-5 | 免费额度 500 次/月、专业解析 | 配置复杂、需注册账号 | ⭐⭐⭐ |

#### Implementation Notes

**环境变量配置**:
```bash
# DMXAPI (统一密钥)
DMXAPI_API_KEY=sk-...
DMXAPI_PDF_MODEL=hehe-tywd
DMXAPI_LLM_MODEL=gpt-5-mini
```

**依赖安装**:
```bash
npm install axios  # HTTP 客户端
```

**实施流程**:
1. 用户上传 PDF 到 `/api/resume/parse`
2. 调用 DMXAPI PDF 解析接口 (`/v1/responses`)
3. 将原始解析结果发送给 DMXAPI LLM 接口 (`/v1/chat/completions`)
4. 保存结构化 JSON 到 Supabase
5. 返回解析结果

**TypeScript 实现示例**:
```typescript
// 步骤 1: PDF 解析
const pdfResponse = await axios.post('https://www.dmxapi.cn/v1/responses', {
  model: process.env.DMXAPI_PDF_MODEL,
  input: pdfBase64,
  parse_mode: 'scan',
  dpi: 144,
  table_flavor: 'html',
  markdown_details: 1,
}, {
  headers: {
    'Authorization': `Bearer ${process.env.DMXAPI_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// 步骤 2: LLM 整理
const llmResponse = await axios.post('https://www.dmxapi.cn/v1/chat/completions', {
  model: process.env.DMXAPI_LLM_MODEL,
  messages: [
    {
      role: 'system',
      content: '你是一个专业的简历解析助手。将简历文本提取为结构化 JSON。'
    },
    {
      role: 'user',
      content: pdfResponse.data.content  // 原始解析结果
    }
  ]
}, {
  headers: {
    'Authorization': `Bearer ${process.env.DMXAPI_API_KEY}`,
    'Content-Type': 'application/json'
  }
});
```

---

## Decision 2: LLM 服务

### 🏆 Final Decision: **DMXAPI GPT-5-Mini (现有接口)**

#### Rationale

**1. 与 PDF 解析使用同一 API 提供商**
- 统一的 API Key 和管理
- 简化配置和依赖
- 降低集成复杂度

**2. 已有现成接口**
- LLM 接口: `https://www.dmxapi.cn/v1/chat/completions` (模型: `gpt-5-mini`)
- 参考实现: `llm_example.py`
- 支持 OpenAI 兼容的消息格式

**3. 结构化输出**
- 在 system prompt 中明确定义 JSON Schema
- 要求模型输出严格的 JSON 格式
- 可添加后处理验证确保数据质量

**4. 实施简单**
- 直接使用现有 API 密钥
- Python 示例可直接转换为 TypeScript
- 无需额外的 SDK 或配置

#### Alternatives Considered

| 选项 | 输入成本 | 输出成本 | JSON 可靠性 | 推荐度 |
|------|---------|---------|------------|--------|
| **DMXAPI GPT-5-Mini** | 根据实际计费 | 根据实际计费 | ⭐⭐⭐⭐ (prompt 约束) | ⭐⭐⭐⭐⭐ |
| OpenAI GPT-4o-mini | $0.15/M | $0.60/M | ⭐⭐⭐⭐⭐ (100%) | ⭐⭐⭐⭐ |
| Claude 3.5 Haiku | $0.80/M | $1.00/M | ⭐⭐⭐ (需验证) | ⭐⭐⭐ |

#### Implementation Notes

**核心配置**:
```typescript
// 步骤 2: LLM 整理 (从 PDF 解析结果中提取)
const llmResponse = await axios.post('https://www.dmxapi.cn/v1/chat/completions', {
  model: 'gpt-5-mini',
  messages: [
    {
      role: 'system',
      content: `你是一个专业的简历解析助手。将简历文本提取为结构化 JSON。

要求:
1. 必须输出有效的 JSON 格式,不允许有额外解释文本
2. 找不到字段时使用空字符串或空数组,不允许编造
3. 严格按照以下 Schema 输出:

{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "skills": ["string1", "string2"],
  "experiences": [
    {
      "company": "string",
      "title": "string",
      "start": "string",
      "end": "string",
      "summary": "string"
    }
  ],
  "resumeSummary": "string"
}`
    },
    {
      role: 'user',
      content: pdfRawContent  // 从 DMXAPI PDF 解析接口获得的原始内容
    }
  ]
}, {
  headers: {
    'Authorization': `Bearer ${process.env.DMXAPI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 60000  // 60 秒超时
});

// 解析 LLM 响应
const structuredData = JSON.parse(llmResponse.data.choices[0].message.content);
```

**验证与后处理**:
```typescript
// 验证 JSON 结构
function validateResumeData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.fullName !== 'string') return false;
  if (!Array.isArray(data.skills)) return false;
  if (!Array.isArray(data.experiences)) return false;
  return true;
}

// 清理和规范化
function sanitizeResumeData(data: any): ResumeParsingResult {
  return {
    clerk_user_id: userId,
    full_name: data.fullName || '',
    email: data.email || '',
    phone: data.phone || '',
    skills: Array.isArray(data.skills) ? data.skills : [],
    experiences: Array.isArray(data.experiences) ? data.experiences : [],
    resume_summary: data.resumeSummary || '',
  };
}
```

**成本估算**:
- 使用现有 API 密钥,按实际使用计费
- 成本已在 PDF 解析方案中统一考虑

---

## Decision 3: UI 组件库

### 🏆 Final Decision: **shadcn/ui**

#### Rationale

**1. 完美的 Next.js 14 App Router + RSC 兼容性**
- 基于 Radix UI Primitives 构建,天然支持 React Server Components
- 所有组件都可以直接在服务端组件中使用
- 组件代码直接复制到项目中,完全可控,无运行时依赖

**2. 与 Tailwind CSS 深度集成**
- 完全基于 Tailwind CSS 样式,零运行时开销
- 使用 Tailwind Variants 简化变体管理
- 支持完整的主题定制

**3. 极致的可定制性与控制权**
- "不是组件库,而是可复制粘贴的组件"
- 所有源代码都在你的项目中,可以自由修改
- 基于 Radix UI 的无障碍性保证(WAI-ARIA 规范)

**4. 适合 MVP 快速开发**
- CLI 工具快速安装组件: `npx shadcn-ui@latest add button`
- 提供完整的设计系统(Typography、Colors、Spacing)
- 丰富的组件库(50+ 组件)

**5. TypeScript 优先**
- 完整的类型定义
- 自动补全和类型检查
- 减少运行时错误

#### Alternatives Considered

| 选项 | RSC 支持 | Tailwind 集成 | 可定制性 | 推荐度 |
|------|---------|--------------|---------|--------|
| **shadcn/ui** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| NextUI/HeroUI | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Mantine | ❌ 不支持 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Headless UI | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Chakra UI | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

**关键发现**: Mantine 官方文档明确说明 "Mantine components cannot be used as server components",这与项目需要充分利用 Next.js 14 RSC 性能优势的需求冲突。

#### Implementation Notes

**安装步骤**:
```bash
# 1. 初始化 shadcn/ui
npx shadcn-ui@latest init

# 2. 安装核心组件
npx shadcn-ui@latest add button card input label form
npx shadcn-ui@latest add dialog sheet select checkbox
npx shadcn-ui@latest add dropdown-menu avatar badge
```

**项目组件需求匹配**:
- ✅ 登录/注册表单
- ✅ Onboarding 多步骤表单
- ✅ Dashboard 布局和卡片
- ✅ 文件上传组件(结合 React Dropzone)
- ✅ 订阅状态展示
- ✅ 响应式导航和侧边栏

---

## Decision 4: 部署平台

### 🏆 Final Decision: **Vercel**

#### Rationale

**1. Next.js 14 原生支持**
- Vercel 是 Next.js 的官方创建者
- 零配置部署,自动识别 Next.js 项目并优化构建
- Edge Functions、Image Optimization、ISR 等特性为 Next.js 深度优化

**2. 集成便利性**
- **Clerk**: Vercel 与 Clerk 有官方集成,环境变量配置一键同步
- **Stripe**: Vercel 官方提供 Stripe 集成模板,webhook 配置简化
- **Supabase**: 支持 Supabase 连接池,Edge Functions 可直接调用 Supabase API

**3. 开发者体验**
- 每次 Git push 自动创建预览部署(Preview Deployments)
- 内置 Analytics、Speed Insights、Logging 等可观测性工具
- 与 GitHub/GitLab/GitBit 无缝集成

**4. 性能优势**
- 全球边缘网络(Edge Network),CDN 加速
- 自动 HTTPS、智能缓存优化
- 冷启动时间短(~50ms)

**5. 免费额度充足**
- 带宽: 100 GB/月
- Serverless 调用: 100,000 次/月
- 构建时间: 6,000 分钟/月
- 适合 MVP 阶段(月活 1,000-5,000 人)

#### Alternatives Considered

| 平台 | 带宽/月 | Serverless/月 | 构建时间/月 | 推荐度 |
|------|---------|--------------|------------|--------|
| **Vercel** | 100 GB | 100,000 次 | 6,000 分钟 | ⭐⭐⭐⭐⭐ |
| Netlify | 100 GB | 125,000 次 | 300 分钟 | ⭐⭐⭐⭐ |
| Railway | $5 额度 | 无限(计费) | 无限 | ⭐⭐⭐ |
| Render | 100 GB | 无限(计费) | 无限 | ⭐⭐⭐ |

**关键发现**: Netlify 的构建时间仅 300 分钟/月(仅为 Vercel 的 5%),对于频繁开发的 MVP 项目可能不够用。

#### Implementation Notes

**部署流程**:
```bash
# 1. 连接 GitHub 仓库
# 2. Vercel 自动检测 Next.js 项目
# 3. 配置环境变量(一次性填入所有 Clerk/Supabase/Stripe keys)
# 4. 自动部署,获得 *.vercel.app 域名
# 5. 每次推送代码自动触发部署
```

**环境变量清单**:
```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# OpenAI
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_STRIPE_PRICE_ID=...
APP_URL=https://your-domain.vercel.app
```

---

## Decision 5: 测试策略

### 🏆 Final Decision: **TypeScript + 手动测试为主,可选 E2E 测试**

#### Rationale

**MVP 阶段测试策略**:
1. **TypeScript 类型检查**: `npm run typecheck` - 捕获类型错误
2. **ESLint 代码检查**: `npm run lint` - 代码质量保证
3. **关键路径手动验证**: 按照验收标准走一遍主流程
4. **可选 Playwright E2E 测试**: 如时间允许,为核心流程添加 E2E 测试

**原因**:
- MVP 阶段优先功能完整性和快速迭代
- 过度的测试覆盖会拖慢开发速度
- TypeScript + ESLint 已能捕获大部分错误
- 手动测试可以快速验证用户体验

**未来扩展**:
- 项目稳定后可添加单元测试(Vitest)
- 核心流程可添加 E2E 测试(Playwright)
- 性能测试可使用 Lighthouse CI

---

## Summary of Decisions

| 技术领域 | 决策 | 核心优势 |
|---------|------|---------|
| **PDF 解析** | DMXAPI (现有接口) | 已有现成接口、统一管理 |
| **LLM 服务** | DMXAPI GPT-5-Mini (现有接口) | 与 PDF 解析同一提供商、简化配置 |
| **UI 组件库** | shadcn/ui | RSC 支持、可定制性强 |
| **部署平台** | Vercel | Next.js 原生、集成便利 |
| **测试策略** | TypeScript + 手动测试 | MVP 快速迭代 |

---

## Next Steps

1. ✅ **Phase 0 完成**: 所有技术选型已确定
2. ⏳ **Phase 1**: 设计数据模型和 API 契约
3. ⏳ **Phase 1**: 生成 quickstart.md 和 agent context
4. ⏳ **审核**: 用户审核 plan.md + research.md
5. ⏳ **Phase 2**: 运行 `/speckit.tasks` 生成 tasks.md

---

## Sources

### PDF 解析
- [Adobe PDF Services API 官网](https://www.adobe.io/document-services/)
- [pdf-parse NPM 文档](https://www.npmjs.com/package/pdf-parse)
- [Best Resume Parsing Software in 2026](https://skima.ai/blog/industry-trends-and-insights/best-resume-parser-api)
- [LLMs for Structured Data Extraction from PDFs](https://unstract.com/blog/comparing-approaches-for-using-llms-for-structured-data-extraction-from-pdfs)

### LLM 服务
- [OpenAI Structured Outputs 文档](https://platform.openai.com/docs/guides/structured-outputs)
- [GPT-4o-mini Pricing](https://platform.openai.com/docs/models/gpt-4o-mini)
- [Resume Parsing with LLMs Guide](https://www.datumo.io/blog/parsing-resumes-with-llms-a-guide-to-structuring-cvs-for-hr-automation)

### UI 组件库
- [shadcn/ui - Next.js 安装指南](https://ui.shadcn.com/docs/installation/next)
- [React UI libraries in 2025: Comparing shadcn/ui, Radix, Mantine](https://makersden.io/blog/react-ui-libs-2025-comparing-shadcn-radix-mantine-mui-chakra)
- [Mantine - Usage with Next.js (Server Components)](https://mantine.dev/guides/next/)

### 部署平台
- [Vercel vs. Netlify vs. Railway: Where to Deploy](https://medium.com/@sergey.prusov/vercel-vs-netlify-vs-railway-where-to-deploy-when-vendor-lock-in-matters-098e1e2cfa1f)
- [Choosing the best hosting provider for your Next.js app](https://makerkit.dev/blog/tutorials/best-hosting-nextjs)
- [Vercel Official Limits Documentation](https://vercel.com/docs/limits)
