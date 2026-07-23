# AssetWise — Database Restore & Migration Guide

> Follow this guide **top-to-bottom** every time you migrate AssetWise to a
> new Supabase project. Skipping steps or doing them out of order will cause
> login failures.

---

## Prerequisites

| Tool | Purpose |
|------|---------|
| Node.js ≥ 18 | Running the helper scripts |
| Access to old Supabase project | Exporting data |
| Access to new Supabase project | Receiving data |
| `.env` file updated | Pointing to the new project |

---

## Overview

```
Old Supabase              New Supabase
────────────              ────────────
auth.users        ──✗──►  (must re-create manually)
public.employees  ──CSV─► public.employees  ← IDs will MISMATCH → run fix script
public.companies  ──CSV─► public.companies
public.assets     ──CSV─► public.assets
public.vault      ──CSV─► public.vault
public.activity_logs ─CSV► public.activity_logs
```

> **Why IDs mismatch:** Supabase generates a new UUID every time you create
> an auth user. CSV imports keep the *old* UUIDs. The fix script re-links them.

---

## Step 1 — Update `.env` with New Credentials

Open `.env` and replace all three Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<new-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<new anon key>
SUPABASE_SERVICE_ROLE_KEY=<new service role key>
```

Find these in: **Supabase Dashboard → Project Settings → API**

---

## Step 2 — Disable Email Confirmation on New Project

> If you skip this step the seed script and user logins will fail.

**Supabase Dashboard → Authentication → Providers → Email**
→ Uncheck **"Confirm email"** → Save

---

## Step 3 — Run the Schema SQL

Go to **Supabase Dashboard → SQL Editor → New Query**, paste the contents of
`schema.sql` and click **Run**.

This creates all tables, indexes, and RLS policies. It is **non-destructive** —
safe to run even if tables already exist.

---

## Step 4 — Run the Auth Trigger SQL

In SQL Editor, paste the contents of `auth_trigger.sql` and Run.

This installs the `handle_new_user` trigger that auto-creates an `employees`
row whenever a new auth user is created.

---

## Step 5 — Import CSV Data

Export each table from your **old** Supabase project:
**Table Editor → (select table) → Export → CSV**

Then import into the **new** project in this order (respects foreign keys):

| Order | Table | Notes |
|-------|-------|-------|
| 1 | `companies` | No dependencies |
| 2 | `employees` | Depends on `companies` |
| 3 | `assets` | Depends on `employees`, `companies` |
| 4 | `vault` | Depends on `employees`, `companies` |
| 5 | `activity_logs` | Depends on `assets`, `employees` |
| 6 | `vault_password_history` | Depends on `vault` |

Import via: **Table Editor → (select table) → Import data from CSV**

> **Do NOT import `app_backups`** — backup metadata records reference files
> stored in Supabase Storage. Re-generate fresh backups from the app after
> the restore is complete.

---

## Step 6 — Create Auth Users

You must manually create auth accounts for every employee.

**Supabase Dashboard → Authentication → Users → Add user**

- Use the exact same email address as in the `employees` table
- Set a temporary password (employees can reset later)
- Repeat for every user who needs to log in

> **Tip:** Use "Invite user" instead — the employee receives an email and sets
> their own password. No need for you to manage temporary passwords.

Only users with a matching auth account can log in. Employees without one
will stay in the system (for asset tracking) but cannot access the app.

---

## Step 7 — Run the ID Repair Script

Because new auth users get new UUIDs that differ from the old `employees.id`
values in your CSV, you must run:

```powershell
node --env-file=.env fix-id-mismatch.mjs
```

This script will:
1. Detect all employees whose `id` doesn't match their `auth.users` UUID
2. Drop the blocking FK constraints temporarily
3. Update `vault`, `assets`, `activity_logs`, and `employees` with the correct IDs
4. Re-add all FK constraints
5. Verify that 0 mismatches remain

**If the script reports FK errors**, it will automatically print a SQL block
you can copy-paste into SQL Editor to finish the repair manually.

---

## Step 8 — Promote an Admin User

After the repair, make sure at least one user is an active Admin.
Run in SQL Editor:

```sql
UPDATE public.employees
SET active = true, role = 'Admin'
WHERE email = 'your-admin@email.com';
```

Or use the seed script to create a fresh admin:

```powershell
node --env-file=.env seed-admin.js --email=you@company.com --password=YourPass123! --name="Your Name"
```

---

## Step 9 — Verify Everything

Run the connectivity check:

```powershell
node --env-file=.env check-db.mjs
```

A healthy output looks like:

```
✅  32 employee row(s) in DB
✅  32 user(s) in auth.users
✅  All IDs match between auth.users and employees!
```

Then try logging in at **http://localhost:9002/login**.

---

## Step 10 — Restart the Dev Server

Stop and restart `npm run dev` so Next.js picks up the new `.env` values:

```powershell
# Stop the running server (Ctrl+C), then:
npm run dev
```

---

## Troubleshooting

### "Invalid email or password" after restore

| Cause | Fix |
|-------|-----|
| Auth user doesn't exist | Create user in Supabase → Authentication → Users |
| `employees.id` ≠ `auth.users.id` | Run `fix-id-mismatch.mjs` |
| `employees.active = false` | Run the UPDATE SQL in Step 8 |
| Email not confirmed | Disable email confirmation (Step 2) or run `UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;` |

### FK constraint error when running fix script

The script will print the full manual SQL. Paste it into SQL Editor and run it.
It drops and re-creates the FK constraints so the updates go through cleanly.

### `employees` table is empty after CSV import

Check the import order — `companies` must be imported before `employees` due
to the `fk_employee_company` foreign key.

---

## Helper Scripts Reference

| Script | Command | Purpose |
|--------|---------|---------|
| `check-db.mjs` | `node --env-file=.env check-db.mjs` | Connectivity check + ID alignment report |
| `fix-id-mismatch.mjs` | `node --env-file=.env fix-id-mismatch.mjs` | Auto-repair ID mismatches after migration |
| `seed-admin.js` | `node --env-file=.env seed-admin.js` | Create/promote the first Admin user |

---

## SQL Files Reference

| File | Purpose | When to run |
|------|---------|-------------|
| `schema.sql` | Creates all tables, indexes, RLS policies | Step 3 — once per new project |
| `auth_trigger.sql` | Auto-creates employee row on auth signup | Step 4 — once per new project |
| `update_admin_rls.sql` | Grants Admins update rights on all tables | Only if RLS policies are missing |

---

*Last updated: 2026-07 — AssetWise*
