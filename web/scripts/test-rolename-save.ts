/**
 * Test script to verify Supabase user_profiles table and RLS policies
 * Run with: npx tsx scripts/test-rolename-save.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
function loadEnv() {
  const envPath = resolve('.env.local');
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  } catch (e) {
    console.error('Could not load .env.local:', e);
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure .env.local contains NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTableAccess() {
  console.log('🔍 Testing Supabase user_profiles table access...\n');

  // Test 1: Check if table exists by trying to select
  console.log('1. Testing table existence...');
  const { data: profiles, error: selectError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);

  if (selectError) {
    console.log('   ❌ Table does not exist or cannot be accessed:');
    console.log('   ', selectError.message);
    console.log('   ', selectError.hint);

    if (selectError.code === 'PGRST204') {
      console.log('\n   💡 The table "user_profiles" might not exist.');
      console.log('   Please run the SQL migration to create it.');
    }
    return false;
  }
  console.log('   ✅ Table exists and is accessible\n');

  // Test 2: Check table structure
  console.log('2. Checking table structure...');
  const { data: tableInfo, error: infoError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);

  if (!infoError && tableInfo) {
    const columns = Object.keys(tableInfo[0] || {});
    console.log('   Columns found:', columns.join(', '));

    const requiredColumns = ['clerk_user_id', 'email', 'role_name', 'updated_at'];
    const missingColumns = requiredColumns.filter(col => !columns.includes(col));

    if (missingColumns.length > 0) {
      console.log('   ⚠️  Missing columns:', missingColumns.join(', '));
    } else {
      console.log('   ✅ All required columns exist');
    }
  }
  console.log();

  // Test 3: Test INSERT with a test user ID
  console.log('3. Testing INSERT permissions...');
  const testUserId = 'test_user_' + Date.now();
  const { data: insertData, error: insertError } = await supabase
    .from('user_profiles')
    .insert({
      clerk_user_id: testUserId,
      email: 'test@example.com',
      role_name: 'Test Role',
    })
    .select();

  if (insertError) {
    console.log('   ❌ INSERT failed:');
    console.log('   ', insertError.message);
    console.log('   Code:', insertError.code);

    if (insertError.code === '42501') {
      console.log('\n   💡 RLS policy is blocking INSERT.');
      console.log('   You may need to add an RLS policy or use service_role key for inserts.');
    }
  } else {
    console.log('   ✅ INSERT successful');

    // Test 4: Clean up test data
    console.log('\n4. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('clerk_user_id', testUserId);

    if (deleteError) {
      console.log('   ⚠️  Could not delete test data:', deleteError.message);
    } else {
      console.log('   ✅ Test data cleaned up');
    }
  }
  console.log();

  return true;
}

testTableAccess()
  .then(success => {
    if (success) {
      console.log('✅ Tests completed');
    } else {
      console.log('❌ Tests failed');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
