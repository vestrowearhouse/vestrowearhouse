import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

const DEFAULT_SETTINGS = {
  id: 'site-settings',
  site_name: 'StellarMartBD',
  site_tagline: 'Your Trusted Online Shopping Destination in Bangladesh',
  email: 'support@stellarmartbd.com',
  phone: '+880 1345-447500',
  address: 'House #12, Road #5, Dhanmondi, Dhaka, Bangladesh',
  logo_url: 'https://i.postimg.cc/CxQSCP22/Whats-App-Image-2026-04-29-at-9-49-48-PM.jpg',
  facebook_url: 'https://www.facebook.com/stellarmartbd',
  instagram_url: 'https://www.instagram.com/stellarmartbd',
  youtube_url: 'https://www.youtube.com/@stellarmartbd'
};

import { revalidatePath } from 'next/cache';
import { clearCache, clearCacheByPrefix } from '@/lib/api-cache';

export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const merged = { ...DEFAULT_SETTINGS, ...(data || {}) };

    return NextResponse.json(
      {
        success: true,
        settings: merged,
        ...merged
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        }
      }
    );
  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json({
      success: true,
      settings: DEFAULT_SETTINGS,
      ...DEFAULT_SETTINGS
    });
  }
}

export async function POST(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = getSupabase();

    // Check if a row exists in settings table
    const { data: existing } = await supabase.from('settings').select('id').limit(1).single();

    const payload = {
      ...DEFAULT_SETTINGS,
      ...body,
      id: existing?.id || 'site-settings',
      updated_at: new Date().toISOString()
    };

    const { data: saved, error } = await supabase
      .from('settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn('Settings upsert warning:', error);
    }

    // Invalidate caches & single-pass layout revalidation
    try {
      clearCache('home:v1');
      clearCacheByPrefix('settings');
      revalidatePath('/', 'layout');
    } catch (cacheErr) {
      console.warn('Revalidate warning:', cacheErr);
    }

    return NextResponse.json({
      success: true,
      message: 'System settings updated successfully!',
      settings: saved || payload
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}