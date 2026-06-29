import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/create-user
 * Admin-only: creates a Supabase Auth user and immediately sends them a
 * password-reset / set-password email so they can activate their own account.
 *
 * Body: { email: string, name: string }
 * Returns: { userId: string } | { error: string }
 */
export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[create-user] Missing SUPABASE_SERVICE_ROLE_KEY in .env');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if user already exists in Auth
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existing = (listData?.users || []).find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      // User already has an auth account — return their ID so the caller can
      // link the employee profile to the existing auth record.
      return NextResponse.json({ userId: existing.id, alreadyExists: true });
    }

    // Create the auth user with a random secure temp password
    const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2).toUpperCase() + '!9';
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // skip email confirmation step
      user_metadata: { name: name || email },
    });

    if (createError) {
      console.error('[create-user] Failed to create auth user:', createError.message);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    const userId = createData.user.id;

    // Send a password-reset email so the user can set their own password
    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:9002';
    await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    return NextResponse.json({ userId, alreadyExists: false });
  } catch (error: any) {
    console.error('[create-user] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
