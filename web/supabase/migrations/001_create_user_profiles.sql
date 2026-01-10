-- Migration: Create user_profiles table with correct schema
-- This migration ensures the user_profiles table has all required columns

-- Drop existing table if it exists (WARNING: This will delete any existing data)
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table with correct schema
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
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

-- Create indexes
CREATE UNIQUE INDEX idx_user_profiles_clerk_user_id ON user_profiles(clerk_user_id);
CREATE INDEX idx_user_profiles_onboarding_completed ON user_profiles(onboarding_completed);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create RLS policies
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (clerk_user_id = auth.uid()::text);
