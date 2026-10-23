import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Basic security check: Vercel CRON_SECRET verification
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Calculate timestamp for 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Since chat_messages has ON DELETE CASCADE constraint, 
    // deleting old chat_sessions will automatically delete their associated messages.
    const { data: deletedSessions, error: sessError } = await supabase
      .from('chat_sessions')
      .delete()
      .lt('updated_at', twentyFourHoursAgo);

    if (sessError) {
      console.error('Failed to delete old sessions:', sessError);
      throw sessError;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Old chat sessions and messages cleaned up successfully.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron cleanup error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
