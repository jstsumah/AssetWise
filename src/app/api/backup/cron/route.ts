import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

// Default retention to 30 days if not globally set
const RETENTION_DAYS = 30;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      const isCron = authHeader === `Bearer ${cronSecret}`;
      if (!isCron) {
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

    // 1. Fetch backups older than retention policy
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    const { data: expiredBackups, error: fetchError } = await supabaseAdmin
      .from('app_backups')
      .select('id, file_name')
      .lt('created_at', cutoffDate.toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch expired backups: ${fetchError.message}`);
    }

    if (!expiredBackups || expiredBackups.length === 0) {
      return NextResponse.json({ success: true, message: 'No expired backups to delete.' });
    }

    let deletedCount = 0;
    const errors: string[] = [];

    // 2. Iterate and delete
    for (const backup of expiredBackups) {
      const { id, file_name } = backup;

      // Delete from storage
      const { error: storageError } = await supabaseAdmin.storage.from('backups').remove([file_name]);
      if (storageError) {
        console.warn(`Could not remove file ${file_name} from storage:`, storageError);
      }

      // Delete from db
      const { error: dbError } = await supabaseAdmin.from('app_backups').delete().eq('id', id);
      if (dbError) {
        errors.push(`Failed to delete DB record ${id}: ${dbError.message}`);
      } else {
        deletedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      deletedCount, 
      errors: errors.length > 0 ? errors : undefined 
    });

  } catch (error: any) {
    console.error("Backup cron error:", error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
