import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Get total vendors
    const { count: totalVendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true });

    if (vendorsError) {
      throw vendorsError;
    }

    // Get active vendors
    const { count: activeVendors, error: activeError } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (activeError) {
      throw activeError;
    }

    // Get verified vendors
    const { count: verifiedVendors, error: verifiedError } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true);

    if (verifiedError) {
      throw verifiedError;
    }

    // Latest vendors
    const { data: latestVendors, error: latestError } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (latestError) {
      throw latestError;
    }

    return NextResponse.json({
      success: true,
      analytics: {
        totalVendors: totalVendors || 0,
        activeVendors: activeVendors || 0,
        verifiedVendors: verifiedVendors || 0,
        latestVendors: latestVendors || []
      }
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error'
      },
      {
        status: 500
      }
    );
  }
}