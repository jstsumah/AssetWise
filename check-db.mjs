/**
 * AssetWise — Quick DB connectivity check
 * Run: node --env-file=.env check-db.mjs
 */
import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍  AssetWise — Database Connectivity Check');
console.log('═══════════════════════════════════════════');
console.log(`  URL       : ${url ?? '❌ MISSING'}`);
console.log(`  Anon key  : ${anon ? anon.slice(0, 30) + '…' : '❌ MISSING'}`);
console.log(`  Svc key   : ${svc  ? svc.slice(0, 30)  + '…' : '❌ MISSING'}`);
console.log('───────────────────────────────────────────\n');

if (!url || !anon) {
  console.error('❌  Missing env vars. Exiting.');
  process.exit(1);
}

// ── 1. Anon client (public access) ──────────────────────────────────────────
const anonClient = createClient(url, anon);

process.stdout.write('1. Anon client — ping employees table… ');
const { data: anonData, error: anonErr } = await anonClient
  .from('employees')
  .select('id, email, role, active')
  .limit(5);

if (anonErr) {
  console.log(`❌  ERROR: ${anonErr.message} (code: ${anonErr.code})`);
} else {
  console.log(`✅  Returned ${anonData.length} row(s)`);
  if (anonData.length) {
    console.table(anonData);
  } else {
    console.log('   ⚠️  Table is empty or RLS is blocking access (no authenticated session).');
  }
}

// ── 2. Service-role client (bypasses RLS) ────────────────────────────────────
if (svc) {
  const svcClient = createClient(url, svc);

  process.stdout.write('\n2. Service-role — count employees…   ');
  const { count, error: svcErr } = await svcClient
    .from('employees')
    .select('*', { count: 'exact', head: true });

  if (svcErr) {
    console.log(`❌  ERROR: ${svcErr.message}`);
  } else {
    console.log(`✅  ${count} employee row(s) in DB`);
  }

  process.stdout.write('3. Service-role — count auth.users…  ');
  const { data: authUsers, error: authErr } = await svcClient
    .rpc('get_auth_user_count');          // may not exist; fall back below

  if (authErr) {
    // Fallback: list users via admin API
    const { data: listData, error: listErr } = await svcClient.auth.admin.listUsers();
    if (listErr) {
      console.log(`❌  ERROR: ${listErr.message}`);
    } else {
      console.log(`✅  ${listData.users.length} user(s) in auth.users`);
      console.log('\n   Auth users (email + id):');
      listData.users.forEach(u =>
        console.log(`   • ${u.email.padEnd(35)} id=${u.id}  confirmed=${!!u.email_confirmed_at}`)
      );
    }
  }

  process.stdout.write('\n4. Service-role — sample employees…  ');
  const { data: empRows, error: empErr } = await svcClient
    .from('employees')
    .select('id, email, role, active')
    .limit(10);

  if (empErr) {
    console.log(`❌  ERROR: ${empErr.message}`);
  } else {
    console.log(`✅`);
    console.table(empRows);
  }

  // ── 3. ID match check ────────────────────────────────────────────────────
  console.log('\n5. Checking auth ↔ employees ID alignment…');
  const { data: listData2 } = await svcClient.auth.admin.listUsers();
  const { data: allEmps }   = await svcClient.from('employees').select('id, email, active');

  if (listData2 && allEmps) {
    const authMap = Object.fromEntries(listData2.users.map(u => [u.email.toLowerCase(), u.id]));
    let mismatches = 0;
    for (const emp of allEmps) {
      const authId = authMap[emp.email.toLowerCase()];
      const match  = authId === emp.id;
      if (!match) {
        mismatches++;
        console.log(`   ❌ MISMATCH — ${emp.email}`);
        console.log(`      employees.id : ${emp.id}`);
        console.log(`      auth.users.id: ${authId ?? '(not found in auth)'}`);
      }
    }
    if (mismatches === 0) {
      console.log('   ✅  All IDs match between auth.users and employees!');
    } else {
      console.log(`\n   ⚠️  ${mismatches} mismatch(es) found — this is why login fails.`);
    }
  }
} else {
  console.log('\n⚠️  No SUPABASE_SERVICE_ROLE_KEY — skipping admin checks.');
}

console.log('\n═══════════════════════════════════════════\n');
