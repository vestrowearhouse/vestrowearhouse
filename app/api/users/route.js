import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/secureJwt';

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Key');
  }
  return createClient(supabaseUrl, supabaseKey);
};

export async function GET(request) {
  // 🔒 SECURITY: Admin-only endpoint — verify admin token before returning user data
  const adminPayload = await verifyAdminToken(request);
  if (!adminPayload) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseClient();
    
    const { data: usersData, error } = await supabase
      .from('users')
      .select('id, name, email, role, status, phone, email_verified, created_at, last_login')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    const users = usersData.map(u => ({ ...u, _id: u.id, emailVerified: u.email_verified, createdAt: u.created_at, lastLogin: u.last_login }));
    
    return NextResponse.json({ 
      users,
      stats: { active: users.filter(u => u.status === 'active').length } 
    });
  } catch (error) { 
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 }); 
  }
}