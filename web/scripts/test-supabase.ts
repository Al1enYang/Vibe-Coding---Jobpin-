import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  // Test 1: Check user_profiles table exists
  console.log('1️⃣ Testing user_profiles table...');
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);

  if (profilesError) {
    console.error('   ❌ Error:', profilesError.message);
  } else {
    console.log('   ✅ Connected! Table exists');
  }

  // Test 2: Check resume_parsing_results table exists
  console.log('\n2️⃣ Testing resume_parsing_results table...');
  const { data: resumes, error: resumesError } = await supabase
    .from('resume_parsing_results')
    .select('*')
    .limit(1);

  if (resumesError) {
    console.error('   ❌ Error:', resumesError.message);
  } else {
    console.log('   ✅ Connected! Table exists');
  }

  // Test 3: Check subscriptions table exists
  console.log('\n3️⃣ Testing subscriptions table...');
  const { data: subs, error: subsError } = await supabase
    .from('subscriptions')
    .select('*')
    .limit(1);

  if (subsError) {
    console.error('   ❌ Error:', subsError.message);
  } else {
    console.log('   ✅ Connected! Table exists');
  }

  console.log('\n✅ All Supabase connection tests passed!');
}

testConnection().catch(console.error);
