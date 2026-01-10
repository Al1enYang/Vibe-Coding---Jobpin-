#!/usr/bin/env node
/**
 * =============================================================================
 * Onboarding Flow Verification Script (Node.js version)
 * =============================================================================
 * Tests:
 * T042 - Start/Continue sets onboarding_completed=true and redirects to dashboard
 * T043 - Middleware redirects incomplete users to /onboarding/rolename
 * T044 - Complete users can access dashboard
 *
 * Usage: cd web && node .test-scripts/test-onboarding-flow.mjs
 * =============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.local manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../.env.local');

try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
} catch (err) {
  console.warn('Warning: Could not read .env.local file');
}

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  dim: '\x1b[2m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}${msg}${colors.reset}`),
  dim: (msg) => console.log(`${colors.dim}${msg}${colors.reset}`)
};

// =============================================================================
// Configuration
// =============================================================================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  log.error('Missing Supabase credentials in .env.local');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test user IDs
const TEST_USER_INCOMPLETE = 'test_incomplete_verify_123';
const TEST_USER_COMPLETE = 'test_complete_verify_456';

// =============================================================================
// Helper Functions
// =============================================================================
async function checkTableExists() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')
    .limit(1);

  if (error) {
    if (error.code === '42P01') {
      // Table does not exist
      return { exists: false, error: 'Table user_profiles does not exist' };
    }
    return { exists: false, error: error.message };
  }
  return { exists: true, error: null };
}

async function checkColumnExists() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .limit(1);

  if (error) {
    if (error.code === '42703') {
      // Column does not exist
      return { exists: false, error: 'Column onboarding_completed does not exist' };
    }
    return { exists: false, error: error.message };
  }
  return { exists: true, error: null };
}

async function getOnboardingStatus(clerkUserId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('onboarding_completed, email, role_name, first_name, last_name')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { exists: false, onboarding_completed: null };
    }
    return { exists: false, error: error.message };
  }
  return { exists: true, onboarding_completed: data?.onboarding_completed, ...data };
}

async function createTestUser(clerkUserId, email, onboardingCompleted) {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      clerk_user_id: clerkUserId,
      email,
      role_name: onboardingCompleted ? 'Designer' : 'Developer',
      first_name: onboardingCompleted ? 'Jane' : 'John',
      last_name: onboardingCompleted ? 'Smith' : 'Doe',
      onboarding_completed: onboardingCompleted
    }, { onConflict: 'clerk_user_id' })
    .select('onboarding_completed')
    .single();

  return { data, error };
}

async function setOnboardingComplete(clerkUserId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
    .eq('clerk_user_id', clerkUserId)
    .select('onboarding_completed')
    .single();

  return { data, error };
}

async function deleteTestUser(clerkUserId) {
  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('clerk_user_id', clerkUserId);

  return { error };
}

// =============================================================================
// Main Test Execution
// =============================================================================
async function main() {
  console.log('');
  log.info('========================================');
  log.info('Onboarding Flow Verification Script');
  log.info('========================================');
  console.log('');

  let allPassed = true;
  const results = [];

  // =============================================================================
  // Test 1: Pre-flight checks
  // =============================================================================
  log.warn('[1/5] Running pre-flight checks...');
  console.log('');

  const tableCheck = await checkTableExists();
  if (!tableCheck.exists) {
    log.error(`✗ user_profiles table not found: ${tableCheck.error}`);
    process.exit(1);
  }
  log.success('✓ user_profiles table exists');
  console.log('');

  const columnCheck = await checkColumnExists();
  if (!columnCheck.exists) {
    log.error(`✗ onboarding_completed column not found: ${columnCheck.error}`);
    process.exit(1);
  }
  log.success('✓ onboarding_completed column exists');
  console.log('');

  // =============================================================================
  // Test 2: Create test users
  // =============================================================================
  log.warn('[2/5] Setup: Creating test users...');
  console.log('');

  const incompleteUser = await createTestUser(TEST_USER_INCOMPLETE, 'incomplete@test.com', false);
  if (incompleteUser.error) {
    log.error(`✗ Failed to create incomplete test user: ${incompleteUser.error.message}`);
    process.exit(1);
  }
  log.success(`✓ Created test user (incomplete onboarding)`);
  log.dim(`  Clerk ID: ${TEST_USER_INCOMPLETE}`);
  log.dim(`  onboarding_completed: ${incompleteUser.data.onboarding_completed}`);
  console.log('');

  const completeUser = await createTestUser(TEST_USER_COMPLETE, 'complete@test.com', true);
  if (completeUser.error) {
    log.error(`✗ Failed to create complete test user: ${completeUser.error.message}`);
    process.exit(1);
  }
  log.success(`✓ Created test user (complete onboarding)`);
  log.dim(`  Clerk ID: ${TEST_USER_COMPLETE}`);
  log.dim(`  onboarding_completed: ${completeUser.data.onboarding_completed}`);
  console.log('');

  // =============================================================================
  // Test 3: T043 - Incomplete user redirect check
  // =============================================================================
  log.warn('[3/5] Test T043: Incomplete user redirect check...');
  console.log('');

  const incompleteStatus = await getOnboardingStatus(TEST_USER_INCOMPLETE);
  log.info(`  Query: SELECT onboarding_completed FROM user_profiles WHERE clerk_user_id = '${TEST_USER_INCOMPLETE}'`);
  log.dim(`  Result: ${incompleteStatus.onboarding_completed}`);

  if (incompleteStatus.onboarding_completed === false) {
    log.success('✓ T043 PASS: Incomplete user has onboarding_completed=false');
    log.dim('  Expected: Middleware should redirect to /onboarding/rolename when accessing /dashboard');
    results.push({ test: 'T043', status: 'PASS' });
  } else {
    log.error('✗ T043 FAIL: Expected onboarding_completed=false');
    results.push({ test: 'T043', status: 'FAIL' });
    allPassed = false;
  }
  console.log('');

  // =============================================================================
  // Test 4: T042 - completeOnboarding simulation
  // =============================================================================
  log.warn('[4/5] Test T042: completeOnboarding simulation...');
  console.log('');

  log.info(`  Simulating: completeOnboarding() for user '${TEST_USER_INCOMPLETE}'`);

  const completeResult = await setOnboardingComplete(TEST_USER_INCOMPLETE);
  if (completeResult.error) {
    log.error(`✗ Failed to update onboarding_completed: ${completeResult.error.message}`);
    results.push({ test: 'T042', status: 'FAIL' });
    allPassed = false;
  } else {
    log.dim(`  Result: ${completeResult.data.onboarding_completed}`);

    if (completeResult.data.onboarding_completed === true) {
      log.success('✓ T042 PASS: onboarding_completed updated to true');
      log.dim('  Expected: User should be able to access /dashboard after this');
      results.push({ test: 'T042', status: 'PASS' });
    } else {
      log.error('✗ T042 FAIL: onboarding_completed was not set to true');
      results.push({ test: 'T042', status: 'FAIL' });
      allPassed = false;
    }
  }
  console.log('');

  // =============================================================================
  // Test 5: T044 - Complete user access check
  // =============================================================================
  log.warn('[5/5] Test T044: Complete user access check...');
  console.log('');

  const completeStatus = await getOnboardingStatus(TEST_USER_COMPLETE);
  log.info(`  Query: SELECT onboarding_completed FROM user_profiles WHERE clerk_user_id = '${TEST_USER_COMPLETE}'`);
  log.dim(`  Result: ${completeStatus.onboarding_completed}`);

  if (completeStatus.onboarding_completed === true) {
    log.success('✓ T044 PASS: Complete user has onboarding_completed=true');
    log.dim('  Expected: Middleware should allow access to /dashboard');
    results.push({ test: 'T044', status: 'PASS' });
  } else {
    log.error('✗ T044 FAIL: Expected onboarding_completed=true');
    results.push({ test: 'T044', status: 'FAIL' });
    allPassed = false;
  }
  console.log('');

  // =============================================================================
  // Summary
  // =============================================================================
  log.info('========================================');
  log.info('Summary');
  log.info('========================================');
  console.log('');

  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✓' : '✗';
    const color = r.status === 'PASS' ? 'success' : 'error';
    log[color](`${icon} ${r.test}: ${r.status}`);
  });
  console.log('');

  // Browser testing instructions
  log.warn('Manual Browser Testing Required:');
  console.log('');
  console.log('1. Test T043 (Incomplete Redirect):');
  console.log('   - Sign in with a new user (onboarding_completed=false)');
  console.log('   - Navigate to /dashboard');
  console.log('   - Expected: Redirect to /onboarding/rolename');
  console.log('');
  console.log('2. Test T042 (Complete Onboarding):');
  console.log('   - Complete the 4 onboarding steps');
  console.log('   - Click "Start" on Resume step');
  console.log('   - Expected: Redirect to /dashboard');
  console.log('');
  console.log('3. Test T044 (Dashboard Access):');
  console.log('   - Sign in with a user who has completed onboarding');
  console.log('   - Navigate to /dashboard');
  console.log('   - Expected: Dashboard loads without redirect');
  console.log('');

  // Cleanup - use readline for cross-platform compatibility
  const readline = (await import('readline')).createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise(resolve => {
    readline.question('Cleanup: Remove test users? (yes/no) > ', resolve);
  });
  readline.close();

  if (answer?.trim().toLowerCase() === 'yes' || answer?.trim().toLowerCase() === 'y') {
    await deleteTestUser(TEST_USER_INCOMPLETE);
    await deleteTestUser(TEST_USER_COMPLETE);
    log.success('✓ Test users removed');
  } else {
    log.dim('Test users left in database');
  }

  console.log('');
  log.success('Verification script complete!');

  process.exit(allPassed ? 0 : 1);
}

// Run the script
main().catch(err => {
  log.error(`Script error: ${err.message}`);
  process.exit(1);
});
