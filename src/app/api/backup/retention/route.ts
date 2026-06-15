import { NextResponse } from 'next/server';

// Note: In a full production app, you might store this retention setting in the database.
// For this implementation, we can simulate updating a global configuration or storing it in 
// a specific settings table if one exists.
let currentRetentionDays = 30; 

export async function GET() {
  return NextResponse.json({ success: true, retentionDays: currentRetentionDays });
}

export async function POST(request: Request) {
  try {
    const { retentionDays } = await request.json();
    
    if (typeof retentionDays !== 'number') {
      return NextResponse.json({ error: 'retentionDays must be a number' }, { status: 400 });
    }

    currentRetentionDays = retentionDays;
    
    // If you had a settings table:
    // const supabaseAdmin = getServiceSupabase();
    // await supabaseAdmin.from('settings').update({ backup_retention: retentionDays }).eq('id', 1);

    return NextResponse.json({ success: true, retentionDays });
  } catch (error: any) {
    console.error("Backup retention error:", error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
