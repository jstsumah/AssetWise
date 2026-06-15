import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabaseAdmin = getServiceSupabase();
    
    // Fetch backup catalog metadata
    const { data, error } = await supabaseAdmin
      .from('app_backups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch backup history: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error("Backup history error:", error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
