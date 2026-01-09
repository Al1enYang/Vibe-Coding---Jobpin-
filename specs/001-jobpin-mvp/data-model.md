# Data Model: Jobpin MVP

**Feature**: 001-jobpin-mvp
**Date**: 2026-01-09
**Database**: Supabase PostgreSQL
**ORM**: Supabase Client (supabase-js)

## Overview

本文档定义了 Jobpin MVP 项目的 Supabase 数据模型,包含表结构、字段类型、关系、索引和 RLS (Row Level Security) 策略。

---

## Table: `user_profiles`

存储用户的 Onboarding 配置信息和 Dashboard 引导状态。

### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | 唯一标识符 |
| `clerk_user_id` | VARCHAR(255) | UNIQUE, NOT NULL | Clerk 用户 ID(外键关联) |
| `role_name` | VARCHAR(100) | | Profile Name / Role(必填) |
| `first_name` | VARCHAR(100) | | First Name(必填) |
| `last_name` | VARCHAR(100) | | Last Name(必填) |
| `country` | VARCHAR(100) | | Country(可选) |
| `city` | VARCHAR(100) | | City(可选) |
| `work_types` | TEXT[] | | Work Type 多选数组(part-time/full-time/internship) |
| `onboarding_completed` | BOOLEAN | DEFAULT false | Onboarding 是否完成 |
| `has_seen_dashboard_guide` | BOOLEAN | DEFAULT false | 是否已看过 Dashboard 引导 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |

### Indexes

```sql
CREATE UNIQUE INDEX idx_user_profiles_clerk_user_id ON user_profiles(clerk_user_id);
CREATE INDEX idx_user_profiles_onboarding_completed ON user_profiles(onboarding_completed);
```

### Validation Rules

- `clerk_user_id`: 必须存在且来自 Clerk
- `role_name`: Onboarding 完成时必填
- `first_name`: Onboarding 完成时必填
- `last_name`: Onboarding 完成时必填
- `work_types`: 可选,值为 `['part-time', 'full-time', 'internship']` 的子集

### RLS Policies

```sql
-- 启用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 用户只能读取自己的 profile
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (clerk_user_id = auth.uid()::text);

-- 用户只能插入自己的 profile
CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
WITH CHECK (clerk_user_id = auth.uid()::text);

-- 用户只能更新自己的 profile
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (clerk_user_id = auth.uid()::text);
```

---

## Table: `resume_parsing_results`

存储用户简历的解析结果(每用户仅保留 1 份)。

### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | 唯一标识符 |
| `clerk_user_id` | VARCHAR(255) | UNIQUE, NOT NULL | Clerk 用户 ID(外键关联) |
| `full_name` | TEXT | | 姓名 |
| `email` | TEXT | | 邮箱 |
| `phone` | TEXT | | 电话 |
| `skills` | JSONB | DEFAULT '[]'::jsonb | 技能数组 |
| `experiences` | JSONB | DEFAULT '[]'::jsonb | 工作经历数组 |
| `resume_summary` | TEXT | | 简历总结 |
| `parsed_at` | TIMESTAMPTZ | DEFAULT NOW() | 解析时间 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |

### JSONB Structure

**`skills` 字段**:
```json
["JavaScript", "TypeScript", "React", "Node.js"]
```

**`experiences` 字段**:
```json
[
  {
    "company": "Company Name",
    "title": "Software Engineer",
    "start": "2020-01",
    "end": "2023-12",
    "summary": "Brief description of responsibilities and achievements."
  }
]
```

### Indexes

```sql
CREATE UNIQUE INDEX idx_resume_parsing_results_clerk_user_id ON resume_parsing_results(clerk_user_id);
CREATE INDEX idx_resume_parsing_results_parsed_at ON resume_parsing_results(parsed_at DESC);
```

### RLS Policies

```sql
-- 启用 RLS
ALTER TABLE resume_parsing_results ENABLE ROW LEVEL SECURITY;

-- 用户只能读取自己的简历解析结果
CREATE POLICY "Users can view own resume"
ON resume_parsing_results FOR SELECT
USING (clerk_user_id = auth.uid()::text);

-- 用户只能插入自己的简历解析结果
CREATE POLICY "Users can insert own resume"
ON resume_parsing_results FOR INSERT
WITH CHECK (clerk_user_id = auth.uid()::text);

-- 用户只能更新自己的简历解析结果
CREATE POLICY "Users can update own resume"
ON resume_parsing_results FOR UPDATE
USING (clerk_user_id = auth.uid()::text);
```

### Upsert Behavior

每用户仅保留 1 份解析结果:
```sql
INSERT INTO resume_parsing_results (clerk_user_id, full_name, email, phone, skills, experiences, resume_summary)
VALUES (...)
ON CONFLICT (clerk_user_id)
DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  skills = EXCLUDED.skills,
  experiences = EXCLUDED.experiences,
  resume_summary = EXCLUDED.resume_summary,
  parsed_at = NOW(),
  updated_at = NOW();
```

---

## Table: `subscriptions`

存储用户的 Stripe 订阅状态。

### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | 唯一标识符 |
| `clerk_user_id` | VARCHAR(255) | UNIQUE, NOT NULL | Clerk 用户 ID(外键关联) |
| `stripe_customer_id` | VARCHAR(255) | UNIQUE | Stripe 客户 ID |
| `stripe_subscription_id` | VARCHAR(255) | UNIQUE | Stripe 订阅 ID |
| `plan` | VARCHAR(50) | | 订阅计划('free' 或 'pro') |
| `active` | BOOLEAN | DEFAULT false | 订阅是否激活 |
| `next_billing_date` | TIMESTAMPTZ | | 下次扣款日期 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |

### Indexes

```sql
CREATE UNIQUE INDEX idx_subscriptions_clerk_user_id ON subscriptions(clerk_user_id);
CREATE UNIQUE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE UNIQUE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX idx_subscriptions_active ON subscriptions(active);
```

### Validation Rules

- `plan`: 值为 `'free'` 或 `'pro'`
- `stripe_customer_id`: 可选,用户订阅时填充
- `stripe_subscription_id`: 可选,用户订阅时填充

### RLS Policies

```sql
-- 启用 RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 用户只能读取自己的订阅状态
CREATE POLICY "Users can view own subscription"
ON subscriptions FOR SELECT
USING (clerk_user_id = auth.uid()::text);

-- Webhook 服务端可以插入/更新(使用 service_role_key)
CREATE POLICY "Service role can manage subscriptions"
ON subscriptions FOR ALL
USING (true);
```

---

## Relationships

```
user_profiles (1) ←→ (1) resume_parsing_results
     ↓ (1:1)
user_profiles (1) ←→ (1) subscriptions
```

**说明**:
- 每个 `clerk_user_id` 对应 1 条 `user_profiles` 记录
- 每个 `clerk_user_id` 对应 1 条 `resume_parsing_results` 记录
- 每个 `clerk_user_id` 对应 1 条 `subscriptions` 记录
- 所有关系都是 1:1

---

## Migration Scripts

### Initial Setup

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

### RLS Setup

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

---

## Type Definitions (TypeScript)

### UserProfile

```typescript
interface UserProfile {
  id: string;
  clerk_user_id: string;
  role_name?: string;
  first_name?: string;
  last_name?: string;
  country?: string;
  city?: string;
  work_types?: ('part-time' | 'full-time' | 'internship')[];
  onboarding_completed: boolean;
  has_seen_dashboard_guide: boolean;
  created_at: string;
  updated_at: string;
}
```

### ResumeParsingResult

```typescript
interface ResumeParsingResult {
  id: string;
  clerk_user_id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  experiences: Experience[];
  resume_summary?: string;
  parsed_at: string;
  created_at: string;
  updated_at: string;
}

interface Experience {
  company: string;
  title: string;
  start: string;
  end?: string;
  summary?: string;
}
```

### Subscription

```typescript
interface Subscription {
  id: string;
  clerk_user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan?: 'free' | 'pro';
  active: boolean;
  next_billing_date?: string;
  created_at: string;
  updated_at: string;
}
```

---

## Next Steps

1. ✅ 数据模型已定义
2. ⏳ 创建 API 契约文档
3. ⏳ 生成 quickstart.md
4. ⏳ 更新 agent context
