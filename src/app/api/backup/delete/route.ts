import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { id, fileName } = await request.json();
    if (!id || !fileName) {
      return NextResponse.json({ error: 'Missing id or fileName' }, { status: 400 });
    }

    const supabaseAdmin = getServiceSupabase();

    // 1. Delete file from storage
    const { error: storageError } = await supabaseAdmin.storage.from('backups').remove([fileName]);
    if (storageError) {
      console.warn("Storage deletion error (maybe already deleted):", storageError);
    }

    // 2. Delete metadata from app_backups table
    const { error: dbError } = await supabaseAdmin.from('app_backups').delete().eq('id', id);
    if (dbError) {
      throw new Error(`Failed to delete backup metadata: ${dbError.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Backup deletion error:", error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
