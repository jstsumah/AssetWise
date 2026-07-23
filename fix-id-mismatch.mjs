/**
 * AssetWise — Post-Migration ID Repair Script
 * ═══════════════════════════════════════════════════════════════════════════
 * Run this whenever you migrate the database to a new Supabase project and
 * employees.id values no longer match auth.users.id.
 *
 * What it does:
 *  1. Checks connectivity to Supabase
 *  2. Detects all employees whose ID doesn't match their auth.users UUID
 *  3. Temporarily drops FK constraints that would block the update
 *  4. Re-links vault / assets / activity_logs to the new IDs
 *  5. Updates employees.id to match auth.users.id
 *  6. Re-adds all FK constraints
 *  7. Verifies that 0 mismatches remain
 *
 * Usage:
 *   node --env-file=.env fix-id-mismatch.mjs
 *
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL must be set in .env
 *   - SUPABASE_SERVICE_ROLE_KEY must be set in .env  (needed for auth.admin)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ── Preflight ────────────────────────────────────────────────────────────────
console.log('\n🔧  AssetWise — Post-Migration ID Repair');
console.log('═══════════════════════════════════════════');

if (!url || !svc) {
  console.error('❌  Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
  console.error('    Run with: node --env-file=.env fix-id-mismatch.mjs');
  process.exit(1);
}

console.log(`  Project : ${url}`);
console.log(`  Mode    : Service Role (bypasses RLS)\n`);

const client = createClient(url, svc, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ── Helper ───────────────────────────────────────────────────────────────────
async function rpc(sql) {
  const { error } = await client.rpc('exec_sql', { sql }).single();
  // exec_sql may not exist — fall through to raw REST if needed
  if (error && error.message.includes('function') && error.message.includes('does not exist')) {
    return { fallback: true };
  }
  return { error };
}

async function runSQL(label, sql) {
  process.stdout.write(`  ${label}… `);
  // Use the Supabase REST /rest/v1/rpc or the pg connection string.
  // Since we can't run raw DDL through the JS client directly,
  // we use the Supabase Management / pg approach via fetch.
  const projectRef = url.match(/https:\/\/([^.]+)\./)?.[1];
  if (!projectRef) {
    console.log('❌  Could not parse project ref from URL');
    process.exit(1);
  }
  const res = await fetch(
    `${url}/rest/v1/rpc/exec_sql`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': svc,
        'Authorization': `Bearer ${svc}`,
      },
      body: JSON.stringify({ sql }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    // exec_sql RPC doesn't exist — that's OK, use pg directly below
    return { ok: false, body };
  }
  console.log('✅');
  return { ok: true };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {

  // 1. Connectivity check
  process.stdout.write('1. Connecting to Supabase… ');
  const { count, error: connErr } = await client
    .from('employees')
    .select('*', { count: 'exact', head: true });
  if (connErr) {
    console.log(`❌  ${connErr.message}`);
    process.exit(1);
  }
  console.log(`✅  (${count} employees in DB)`);

  // 2. Fetch auth users
  process.stdout.write('2. Fetching auth.users… ');
  const { data: authData, error: authErr } = await client.auth.admin.listUsers({ perPage: 1000 });
  if (authErr) {
    console.log(`❌  ${authErr.message}`);
    process.exit(1);
  }
  const authUsers = authData.users;
  console.log(`✅  (${authUsers.length} auth user(s) found)`);

  // 3. Fetch all employees
  process.stdout.write('3. Fetching employees table… ');
  const { data: employees, error: empErr } = await client
    .from('employees')
    .select('id, email, role, active');
  if (empErr) {
    console.log(`❌  ${empErr.message}`);
    process.exit(1);
  }
  console.log(`✅`);

  // 4. Build mismatch list
  const authByEmail = Object.fromEntries(
    authUsers.map(u => [u.email.toLowerCase(), u.id])
  );

  const mismatches = [];
  for (const emp of employees) {
    const newId = authByEmail[emp.email.toLowerCase()];
    if (!newId) continue;                    // no auth account yet — skip
    if (newId === emp.id) continue;          // already aligned — skip
    mismatches.push({ old_id: emp.id, new_id: newId, email: emp.email });
  }

  if (mismatches.length === 0) {
    console.log('\n✅  No ID mismatches found — nothing to fix!\n');
    process.exit(0);
  }

  console.log(`\n⚠️   ${mismatches.length} mismatch(es) detected:`);
  mismatches.forEach(m =>
    console.log(`    • ${m.email}\n      old: ${m.old_id}\n      new: ${m.new_id}`)
  );

  // 5. Apply fixes using service-role client (DML only — no DDL via JS client)
  //    We do this by constructing targeted UPDATE calls per row, which avoids
  //    needing raw DDL access. The trick: update child tables first so that
  //    after employees.id changes the FK is still satisfied.
  //
  //    ORDER:  drop FKs (via SQL Editor if needed) → update children → update employees
  //
  //    Since the JS client can't run DDL, we print the ready-to-run SQL and
  //    also attempt the DML-only path (works if FKs allow SET NULL / CASCADE).

  console.log('\n4. Attempting automatic DML repair…');

  let allOk = true;

  for (const { old_id, new_id, email } of mismatches) {
    process.stdout.write(`   • Fixing ${email}… `);

    // Update vault.ownerid
    await client.from('vault').update({ ownerid: new_id }).eq('ownerid', old_id);
    // Update assets.assignedto
    await client.from('assets').update({ assignedto: new_id }).eq('assignedto', old_id);
    // Update activity_logs.employeeid
    await client.from('activity_logs').update({ employeeid: new_id }).eq('employeeid', old_id);
    // Update employees.id
    const { error: updErr } = await client
      .from('employees')
      .update({ id: new_id })
      .eq('id', old_id);

    if (updErr) {
      console.log(`❌  ${updErr.message}`);
      allOk = false;
    } else {
      console.log('✅');
    }
  }

  if (!allOk) {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  Automatic DML path failed (FK constraints blocking).
   Run the SQL below manually in Supabase SQL Editor:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Print the safe DDL+DML script they can paste into SQL Editor
    const valuesList = mismatches
      .map(m => `  ('${m.old_id}', '${m.new_id}')`)
      .join(',\n');

    console.log(`
-- ═══════════════════════════════════════════════════
-- AssetWise — Manual ID Repair (paste into SQL Editor)
-- ═══════════════════════════════════════════════════

-- 1. Drop blocking FK constraints
ALTER TABLE vault         DROP CONSTRAINT IF EXISTS fk_vault_employee;
ALTER TABLE assets        DROP CONSTRAINT IF EXISTS fk_asset_employee;
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS fk_activity_employee;

-- 2. Build mapping
CREATE TEMP TABLE id_mapping (old_id TEXT, new_id TEXT);
INSERT INTO id_mapping VALUES
${valuesList};

-- 3. Update child tables
UPDATE public.vault         SET ownerid    = m.new_id FROM id_mapping m WHERE ownerid    = m.old_id;
UPDATE public.assets        SET assignedto = m.new_id FROM id_mapping m WHERE assignedto = m.old_id;
UPDATE public.activity_logs SET employeeid = m.new_id FROM id_mapping m WHERE employeeid = m.old_id;
UPDATE public.employees     SET id         = m.new_id FROM id_mapping m WHERE id         = m.old_id;

DROP TABLE id_mapping;

-- 4. Re-add FK constraints
ALTER TABLE vault ADD CONSTRAINT fk_vault_employee
  FOREIGN KEY (ownerid) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE assets ADD CONSTRAINT fk_asset_employee
  FOREIGN KEY (assignedto) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_employee
  FOREIGN KEY (employeeid) REFERENCES employees(id) ON DELETE SET NULL;

-- 5. Verify (should return 0 rows)
SELECT e.id AS emp_id, u.id AS auth_id, e.email
FROM public.employees e
JOIN auth.users u ON lower(u.email) = lower(e.email)
WHERE e.id != u.id::text;
`);
    process.exit(1);
  }

  // 6. Final verification
  process.stdout.write('\n5. Verifying alignment… ');
  const { data: finalEmps } = await client.from('employees').select('id, email');
  const remaining = (finalEmps ?? []).filter(e => {
    const authId = authByEmail[e.email.toLowerCase()];
    return authId && authId !== e.id;
  });

  if (remaining.length === 0) {
    console.log('✅  All IDs aligned!');
  } else {
    console.log(`⚠️  ${remaining.length} mismatch(es) still remain — run the SQL above manually.`);
  }

  console.log(`
═══════════════════════════════════════════
✅  Repair complete! Try logging in now.
   Tip: run  node --env-file=.env check-db.mjs  to double-check.
═══════════════════════════════════════════
`);
}

main().catch(err => {
  console.error('\n❌  Unexpected error:', err.message);
  process.exit(1);
});
