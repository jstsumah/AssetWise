/**
 * AssetWise — Admin Seed Script
 * Creates the first admin user directly via Supabase Auth + RLS-allowed insert.
 * No service role key required.
 *
 * Usage:
 *   node --env-file=.env seed-admin.js
 *   node --env-file=.env seed-admin.js --email=you@example.com --password=Pass123! --name="Your Name"
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

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌  Missing Supabase env vars. Run with: node --env-file=.env seed-admin.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('\n🚀  AssetWise — Admin Seed Script');
  console.log('══════════════════════════════════');
  console.log(`  Email    : ${email}`);
  console.log(`  Name     : ${name}`);
  console.log('══════════════════════════════════\n');

  // ── 1. Sign up ────────────────────────────────────────────────────────────
  process.stdout.write('1. Creating Supabase auth user... ');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });

  let userId;

  if (signUpError) {
    if (signUpError.message.toLowerCase().includes('already registered')) {
      console.log('already exists, continuing.');
    } else {
      console.error('\n❌  Sign-up failed:', signUpError.message);
      process.exit(1);
    }
  } else {
    userId = signUpData.user?.id;
    console.log('✅');
  }

  // ── 2. Sign in ────────────────────────────────────────────────────────────
  process.stdout.write('2. Signing in to get session...   ');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    console.error('\n❌  Sign-in failed:', signInError.message);
    console.log('\n   If email confirmation is enabled, disable it in:');
    console.log('   Supabase → Authentication → Providers → Email → uncheck "Confirm email"');
    process.exit(1);
  }

  userId = signInData.user.id;
  console.log('✅');

  // ── 3. Check / create employee record ─────────────────────────────────────
  process.stdout.write('3. Checking employee record...    ');
  const { data: existing } = await supabase
    .from('employees')
    .select('id, email, active, role')
    .eq('id', userId)
    .single();

  if (existing) {
    console.log(`found (active=${existing.active}, role=${existing.role})`);

    if (!existing.active || existing.role !== 'Admin') {
      process.stdout.write('   Promoting to active Admin...    ');
      const { error: updateError } = await supabase
        .from('employees')
        .update({ active: true, role: 'Admin' })
        .eq('id', userId);

      if (updateError) {
        console.error('\n❌  Update failed:', updateError.message);
        console.log('\n   → Run this SQL in Supabase Dashboard → SQL Editor:');
        printManualSQL(email);
      } else {
        console.log('✅');
      }
    } else {
      console.log('   Already active Admin — nothing to do.');
    }
  } else {
    console.log('not found, inserting...');
    process.stdout.write('   Inserting admin employee record... ');
    const { error: insertError } = await supabase
      .from('employees')
      .insert({
        id:         userId,
        name,
        email,
        department: 'Management',
        jobtitle:   'System Administrator',
        avatarurl:  '',
        role:       'Admin',
        active:     true,
        companyid:  null
      });

    if (insertError) {
      console.error('\n❌  Insert failed:', insertError.message);
      console.log('\n   → Run this SQL in Supabase Dashboard → SQL Editor:');
      printManualSQL(email, userId);
      await supabase.auth.signOut();
      process.exit(1);
    } else {
      console.log('✅');
    }
  }

  // ── 4. Verify ─────────────────────────────────────────────────────────────
  process.stdout.write('4. Verifying final state...       ');
  const { data: final, error: finalError } = await supabase
    .from('employees')
    .select('id, name, email, role, active')
    .eq('id', userId)
    .single();

  await supabase.auth.signOut();

  if (finalError || !final) {
    console.error('\n❌  Could not verify record:', finalError?.message);
    process.exit(1);
  }

  console.log('✅\n');
  console.log('══════════════════════════════════');
  console.log('  ✅  Admin account ready!');
  console.log(`  Name   : ${final.name}`);
  console.log(`  Email  : ${final.email}`);
  console.log(`  Role   : ${final.role}`);
  console.log(`  Active : ${final.active}`);
  console.log('══════════════════════════════════');
  console.log('\n  👉  Log in at: http://localhost:9002/login');
  console.log('  📝  Note: Create a Company first in the UI to assign employees.\n');
}

function printManualSQL(email, id) {
  console.log(`
  INSERT INTO public.employees (id, name, email, department, jobtitle, avatarurl, role, active)
  VALUES ('${id || '<YOUR_AUTH_USER_ID>'}', 'Admin User', '${email}', 'Management', 'System Administrator', '', 'Admin', true)
  ON CONFLICT (id) DO UPDATE SET role = 'Admin', active = true;
  `);
}

run().catch(err => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
