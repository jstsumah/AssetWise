import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    let triggerType = 'manual';

    if (cronSecret) {
      const isCron = authHeader === `Bearer ${cronSecret}`;
      if (isCron) {
        triggerType = 'automated (cron)';
      } else {
        if (!authHeader?.startsWith('Bearer ')) {
          return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const supabaseAuth = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        );
        const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
        if (error || !user) {
          return NextResponse.json({ error: 'Unauthorized: Invalid user session' }, { status: 401 });
        }
      }
    }

    const supabaseAdmin = getServiceSupabase();

    const tables = [
      'companies',
      'employees',
      'assets',
      'activity_logs',
      'vault',
      'vault_password_history'
    ];

    const backupData: Record<string, any[]> = {};
    const recordCounts: Record<string, number> = {};
    
    let totalSize = 0;

    // 1. Fetch data from all tables
    for (const table of tables) {
      const { data, error } = await supabaseAdmin.from(table).select('*');
      if (error) {
        throw new Error(`Failed to fetch from ${table}: ${error.message}`);
      }
      backupData[table] = data || [];
      recordCounts[table] = data?.length || 0;
    }

    const payload = JSON.stringify({
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: backupData
    });
    
    totalSize = new Blob([payload]).size;
    const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    // 2. Upload to storage bucket
    const { error: uploadError } = await supabaseAdmin.storage
      .from('backups')
      .upload(fileName, payload, {
        contentType: 'application/json',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload backup to storage: ${uploadError.message}`);
    }

    // 3. Insert metadata into app_backups table
    const { error: dbError } = await supabaseAdmin.from('app_backups').insert({
      file_name: fileName,
      size_bytes: totalSize,
      record_counts: recordCounts,
      status: 'completed',
      trigger_type: triggerType
    });

    if (dbError) {
      // Best effort cleanup if DB insert fails
      await supabaseAdmin.storage.from('backups').remove([fileName]);
      throw new Error(`Failed to insert backup metadata: ${dbError.message}`);
    }

    return NextResponse.json({ success: true, fileName, recordCounts, size: totalSize });
  } catch (error: any) {
    console.error("Backup creation error:", error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
