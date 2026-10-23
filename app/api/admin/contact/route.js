import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 250;
    const offset = parseInt(searchParams.get('offset')) || 0;

    let allMessages = [];

    // 1. Try querying contact_messages table if present
    try {
      const { data: dbData } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (Array.isArray(dbData) && dbData.length > 0) {
        allMessages.push(...dbData);
      }
    } catch (err) {
      // Table might not exist yet, fallback to system-inbox storage
    }

    // 2. Query system-inbox messages stored in Supabase
    try {
      const { data: sysData } = await supabase
        .from('categories')
        .select('id, name, slug, description, custom_code, created_at, updated_at')
        .like('slug', 'system-inbox-%')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (Array.isArray(sysData)) {
        const formatted = sysData.map(row => {
          let details = {};
          try {
            if (row.custom_code) {
              details = JSON.parse(row.custom_code);
            }
          } catch (e) {}

          return {
            id: row.id,
            slug: row.slug,
            name: details.name || row.name || 'Anonymous User',
            email: details.email || 'customer@stellarmartbd.com',
            phone: details.phone || '',
            subject: details.subject || row.description || '(No Subject)',
            message: details.message || '',
            status: details.status || 'unread',
            created_at: row.created_at,
            updated_at: row.updated_at
          };
        });

        allMessages.push(...formatted);
      }
    } catch (err) {
      console.warn('Failed to load system-inbox categories:', err.message);
    }

    // Sort all messages by created_at descending
    allMessages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const paginated = allMessages.slice(offset, offset + limit);

    return NextResponse.json({
      messages: paginated,
      total: allMessages.length
    });
  } catch (error) {
    console.error('Contact messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}