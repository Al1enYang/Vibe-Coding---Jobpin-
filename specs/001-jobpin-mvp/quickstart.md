# Quickstart Guide: Jobpin MVP

**Feature**: 001-jobpin-mvp
**Date**: 2026-01-09
**Prerequisites**: Node.js 18+, npm, git

---

## Overview

本指南帮助你快速设置 Jobpin MVP 项目的本地开发环境。

---

## Step 1: Create Next.js Project

### 1.1 创建 Next.js 应用

在项目根目录执行:

```bash
# 创建 Next.js 14 项目 (使用 App Router)
npx create-next-app@latest web --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# 进入项目目录
cd web
```

**参数说明**:
- `--typescript`: 使用 TypeScript
- `--tailwind`: 使用 Tailwind CSS
- `--app`: 使用 App Router (新架构)
- `--no-src-dir`: 不使用 src 目录(简化结构)
- `--import-alias "@/*"`: 设置导入别名

**创建后的目录结构**:
```
web/
├── app/                    # App Router 页面
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页 (/)
│   └── globals.css        # 全局样式
├── public/                # 静态资源
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

### 1.2 安装基础依赖

```bash
cd web

# 安装 Clerk (认证)
npm install @clerk/nextjs

# 安装 Supabase (数据库)
npm install @supabase/supabase-js

# 安装 Stripe (支付)
npm install stripe

# 安装表单管理
npm install react-hook-form zod

# 安装 HTTP 客户端 (用于 DMXAPI)
npm install axios

# 安装 shadcn/ui 所需依赖
npm install class-variance-authority clsx tailwind-merge
```

### 1.3 验证安装

```bash
# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 应该看到 Next.js 欢迎页面。

---

## Step 2: Clone and Install (如果已有仓库)

如果你已经克隆了仓库:

```bash
# Clone the repository
git clone <repository-url>
cd "4/Vibe Coding"

# Navigate to the web directory
cd web

# Install dependencies
npm install
```

---

## Step 3: Configure Environment Variables

创建 `web/.env.local` 文件并配置以下变量:

```bash
# ===========================================
# Clerk (Authentication)
# ===========================================
# Get these from: https://dashboard.clerk.com/
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# ===========================================
# Supabase (Database)
# ===========================================
# Get these from: https://supabase.com/dashboard/project/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # Only for server-side

# ===========================================
# DMXAPI (Resume Parsing - PDF + LLM)
# ===========================================
# 统一的 API Key 用于 PDF 解析和 LLM 整理
DMXAPI_API_KEY=sk-...
DMXAPI_PDF_MODEL=hehe-tywd
DMXAPI_LLM_MODEL=gpt-5-mini

# ===========================================
# Stripe (Payments - Test Mode)
# ===========================================
# Get these from: https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PRICE_ID=price_...  # Test price ID ($9/month)

# Webhook secret (get from Stripe Dashboard -> Webhooks -> CLI)
STRIPE_WEBHOOK_SECRET=whsec_...

# Application URL (for redirects and webhooks)
APP_URL=http://localhost:3000
```

---

## Step 4: Set Up Supabase Database

### Option A: Using Supabase Dashboard (Recommended for MVP)

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 执行 `data-model.md` 中的迁移脚本:

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建 user_profiles 表
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  role_name VARCHAR(100),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  country VARCHAR(100),
  city VARCHAR(100),
  work_types TEXT[],
  onboarding_completed BOOLEAN DEFAULT false,
  has_seen_dashboard_guide BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 resume_parsing_results 表
CREATE TABLE resume_parsing_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  experiences JSONB DEFAULT '[]'::jsonb,
  resume_summary TEXT,
  parsed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 subscriptions 表
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  plan VARCHAR(50),
  active BOOLEAN DEFAULT false,
  next_billing_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE UNIQUE INDEX idx_user_profiles_clerk_user_id ON user_profiles(clerk_user_id);
CREATE INDEX idx_user_profiles_onboarding_completed ON user_profiles(onboarding_completed);
CREATE UNIQUE INDEX idx_resume_parsing_results_clerk_user_id ON resume_parsing_results(clerk_user_id);
CREATE INDEX idx_resume_parsing_results_parsed_at ON resume_parsing_results(parsed_at DESC);
CREATE UNIQUE INDEX idx_subscriptions_clerk_user_id ON subscriptions(clerk_user_id);
CREATE UNIQUE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE UNIQUE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX idx_subscriptions_active ON subscriptions(active);
```

5. 执行 RLS 策略:

```sql
-- 启用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_parsing_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- user_profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (clerk_user_id = auth.uid()::text);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (clerk_user_id = auth.uid()::text);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (clerk_user_id = auth.uid()::text);

-- resume_parsing_results policies
CREATE POLICY "Users can view own resume" ON resume_parsing_results FOR SELECT USING (clerk_user_id = auth.uid()::text);
CREATE POLICY "Users can insert own resume" ON resume_parsing_results FOR INSERT WITH CHECK (clerk_user_id = auth.uid()::text);
CREATE POLICY "Users can update own resume" ON resume_parsing_results FOR UPDATE USING (clerk_user_id = auth.uid()::text);

-- subscriptions policies
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (clerk_user_id = auth.uid()::text);
CREATE POLICY "Service role can manage subscriptions" ON subscriptions FOR ALL USING (true);
```

### Option B: Using Migration Files (Production)

如果你 prefer 使用迁移文件:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

---

## Step 5: Initialize shadcn/ui (本项目采用 shadcn/ui)

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Follow the prompts:
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes

# Install core components
npx shadcn-ui@latest add button card input label form
npx shadcn-ui@latest add dialog sheet select checkbox
npx shadcn-ui@latest add dropdown-menu avatar badge
```

---

## Step 6: Configure Clerk Authentication

### 6.1 安装 Clerk 依赖

```bash
npm install @clerk/nextjs
```

### 6.2 配置 ClerkProvider

创建 `web/app/layout.tsx`:

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

### 6.3 创建登录页面

创建 `web/app/(auth)/sign-in/page.tsx`:

```tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return <SignIn />
}
```

### 6.4 创建注册页面

创建 `web/app/(auth)/sign-up/page.tsx`:

```tsx
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return <SignUp />
}
```

### 6.5 配置路由保护中间件

创建 `web/middleware.ts`:

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

### 6.6 在 Clerk Dashboard 中启用邮箱验证

1. 访问 [Clerk Dashboard](https://dashboard.clerk.com/)
2. 选择你的应用
3. 进入 **Settings** → **Emails** → **Email verification**
4. 确保启用以下功能:
   - ✅ Email verification (邮箱验证)
   - ✅ Password reset (密码重置,可选)
5. 配置邮件模板(可选,使用默认模板即可)

### 6.7 配置 Google OAuth (可选)

1. 在 Clerk Dashboard 中进入 **Configure** → **SSO Connections**
2. 添加 **Google** 连接
3. 按照指引配置 Google OAuth 凭据
4. 或使用 Clerk 提供的快速测试模式

---

## Step 7: Start Development Server

```bash
# Start the development server
npm run dev
```

访问 http://localhost:3000

---

## Step 8: Test Stripe Webhooks Locally

### Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
curl -s https://packages.stripe.com/api/security/keypairs/stripe-cli-gpg/public-key | gpg --dearmor -o /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe

# Windows (using Chocolatey)
choco install stripe-cli
```

### Login to Stripe

```bash
stripe login
```

### Forward Webhooks

```bash
# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook secret (whsec_...) and update .env.local
export STRIPE_WEBHOOK_SECRET=whsec_...
```

### Test Events

```bash
# In another terminal
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

---

## Step 9: Verify Setup

### Checklist

- [ ] Homepage loads at http://localhost:3000
- [ ] Sign in/up pages work (Clerk)
- [ ] Can create new user account
- [ ] Supabase tables exist and RLS is enabled
- [ ] Shadcn/ui components are available
- [ ] Stripe webhook forwarding is active

### Test Authentication

1. Visit http://localhost:3000/sign-up
2. Create an account (Email+Password or Google)
3. Verify you can sign in

### Test Database Connection

```bash
# In the project root
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'web/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

supabase.from('user_profiles').select('*').then(console.log);
"
```

---

## Common Issues

### Issue: Clerk authentication not working

**Solution**: Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are correct in `.env.local`.

### Issue: Supabase connection failed

**Solution**: Check `NEXT_PUBLIC_SUPABASE_URL` and ensure RLS policies are set correctly.

### Issue: Stripe webhook returns 401

**Solution**: Verify `STRIPE_WEBHOOK_SECRET` matches the secret from `stripe listen`.

### Issue: OpenAI API timeout

**Solution**: Check your internet connection and verify `OPENAI_API_KEY` is valid.

---

## Production Deployment (Vercel)

### 1. Connect to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### 2. Configure Environment Variables

在 Vercel Dashboard 中添加所有环境变量(从 `.env.local` 复制)。

### 3. Update Stripe Webhook URL

1. 打开 [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. 创建新的 webhook endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
3. 选择事件:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. 复制 webhook secret 并更新 Vercel 环境变量

### 4. Deploy

```bash
git push origin main
# Vercel will auto-deploy on push
```

---

## Next Steps

1. ✅ 环境已配置
2. ⏳ 运行 `/speckit.tasks` 生成实施任务清单
3. ⏳ 开始开发(在审核通过后)

---

## Support

- **Clerk**: https://clerk.com/docs
- **Supabase**: https://supabase.com/docs
- **Stripe**: https://stripe.com/docs
- **OpenAI**: https://platform.openai.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Next.js**: https://nextjs.org/docs
