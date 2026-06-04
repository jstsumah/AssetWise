/**
 * AssetWise — Admin Seed Script
 *
 * This script creates your first admin account in Supabase.
 *
 * Usage:
 *   node seed-admin.js --email=admin@example.com --password=YourPassword123! --name="Your Name"
 *
 * IMPORTANT: Before running, you must first run bootstrap.sql in the
 * Supabase SQL Editor to install the auth trigger and default company.
 *
 * Steps:
 *   1. Run bootstrap.sql in Supabase → SQL Editor
 *   2. Run: node seed-admin.js --email=... --password=... --name=...
 *   3. Go to Supabase → SQL Editor and run the UPDATE printed at the end
 *   4. Log in at http://localhost:9002/login
 */

import { createClient } from '@supabase/supabase-js';

// ─── Parse CLI args ────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map(arg => {
    const [key, ...val] = arg.replace(/^--/, '').split('=');
    return [key, val.join('=')];
  })
);

const email    = args.email    || 'admin@assetwise.com';
const password = args.password || 'Admin1234!';
const name     = args.name     || 'Admin User';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌  Missing Supabase env vars. Run with: node --env-file=.env seed-admin.js');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log(`\n🚀  AssetWise Admin Seed Script`);
  console.log(`─────────────────────────────────`);
  console.log(`   Email   : ${email}`);
  console.log(`   Name    : ${name}`);
  console.log(`─────────────────────────────────\n`);

  // Step 1: Sign up the user via Supabase Auth
  console.log('1️⃣   Creating Supabase auth user...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });

  if (signUpError) {
    if (signUpError.message.toLowerCase().includes('already registered')) {
      console.log('   ℹ️   User already exists in Supabase Auth — continuing...');
    } else {
      console.error('   ❌  Sign-up failed:', signUpError.message);
      console.error('\n   → Make sure you have run bootstrap.sql in Supabase SQL Editor first.');
      process.exit(1);
    }
  } else {
    console.log('   ✅  Auth user created:', signUpData.user?.id);
  }

  // Step 2: Sign in to get a session (so we can insert with RLS)
  console.log('\n2️⃣   Signing in to get session...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    console.error('   ❌  Sign-in failed:', signInError.message);
    console.log('\n   → If email confirmation is required, disable it in:');
    console.log('      Supabase Dashboard → Authentication → Providers → Email → uncheck "Confirm email"');
    process.exit(1);
  }

  const userId = signInData.user?.id;
  console.log('   ✅  Signed in as:', userId);

  // Step 3: Check if employee record was created by trigger
  console.log('\n3️⃣   Checking for employee record (created by trigger)...');
  const { data: existing } = await supabase
    .from('employees')
    .select('id, email, active, role')
    .eq('id', userId)
    .single();

  if (existing) {
    console.log('   ✅  Employee record exists:', existing);

    if (existing.active && existing.role === 'Admin') {
      console.log('\n🎉  Done! You are already an active admin. Log in at http://localhost:9002/login\n');
      return;
    }
  } else {
    console.log('   ⚠️   No employee record found — trigger may not be installed.');
    console.log('   → Inserting employee record manually...');

    const { error: insertError } = await supabase
      .from('employees')
      .insert({
        id: userId,
        name,
        email,
        department: 'Management',
        jobtitle: 'System Administrator',
        avatarurl: '',
        role: 'Employee',
        active: false,
        companyid: 'default-company'
      });

    if (insertError) {
      console.error('   ❌  Insert failed:', insertError.message);
    } else {
      console.log('   ✅  Employee record inserted.');
    }
  }

  // Step 4: Print the SQL to activate them as admin
  console.log('\n4️⃣   ⚠️  One final manual step required:');
  console.log('─────────────────────────────────────────────────────');
  console.log('   Go to: Supabase Dashboard → SQL Editor → New Query');
  console.log('   Paste and run this SQL:\n');
  console.log(`UPDATE public.employees`);
  console.log(`SET`);
  console.log(`  active    = true,`);
  console.log(`  role      = 'Admin',`);
  console.log(`  companyid = 'default-company'`);
  console.log(`WHERE email = '${email}';\n`);
  console.log('─────────────────────────────────────────────────────');
  console.log('\n   Then log in at: http://localhost:9002/login\n');

  await supabase.auth.signOut();
}

run().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
