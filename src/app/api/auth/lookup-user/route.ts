import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[lookup-user] Missing SUPABASE_SERVICE_ROLE_KEY in .env');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // List users and filter by email (Supabase Admin API doesn't support direct email lookup)
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const matched = (data.users || []).find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (matched) {
      return NextResponse.json({ found: true, userId: matched.id });
    }

    return NextResponse.json({ found: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
