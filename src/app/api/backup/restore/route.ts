import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { fileName } = await request.json();
    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    const supabaseAdmin = getServiceSupabase();

    // 1. Download file from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('backups')
      .download(fileName);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download backup file: ${downloadError?.message}`);
    }

    const text = await fileData.text();
    const parsedBackup = JSON.parse(text);

    if (!parsedBackup.data) {
      throw new Error('Invalid backup file format');
    }

    // 2. Dependency-ordered restore sequence
    const tables = [
      'companies',
      'employees',
      'assets',
      'activity_logs',
      'vault',
      'vault_password_history'
    ];

    // Deleting in reverse dependency order to prevent FK constraint violations
    const reverseTables = [...tables].reverse();
    for (const table of reverseTables) {
      // This will delete all rows where id is not null (which is all rows)
      await supabaseAdmin.from(table).delete().not('id', 'is', null);
    }

    // 3. Insert in dependency order
    for (const table of tables) {
      const rows = parsedBackup.data[table];
      if (rows && rows.length > 0) {
        const { error: insertError } = await supabaseAdmin.from(table).insert(rows);
        if (insertError) {
          throw new Error(`Failed to restore table ${table}: ${insertError.message}`);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Restore completed successfully' });

  } catch (error: any) {
    console.error("Backup restore error:", error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
