import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getCache, setCache } from '@/lib/api-cache';

// Publicly readable site settings — no auth required
export const revalidate = 86400; // Cache settings for 24 hours at the Edge

const DEFAULT_SETTINGS = {
  site_name: 'Vestro Wear House',
  site_tagline: 'Premium Streetwear & Contemporary Apparel in Bangladesh.',
  email: 'support@vestrowearhouse.com',
  phone: '+880 1847-853887',
  bkash_number: '01847853887',
  address: 'Dhaka, Bangladesh',
  facebook_url: 'https://www.facebook.com/vestrowearhouse',
  instagram_url: 'https://www.instagram.com/vestrowearhouse',
  youtube_url: '#',
  whatsapp: '+880 1847-853887',
  whatsapp_url: 'https://wa.me/8801847853887',
};

// Only expose these keys publicly — never expose private/admin fields
const PUBLIC_FIELDS = [
  'site_name', 'site_tagline', 'email', 'phone', 'address',
  'facebook_url', 'instagram_url', 'youtube_url',
  'support_phone', 'support_email', 'whatsapp', 'whatsapp_url',
  'bkash_number',
];

export async function GET() {
  const cached = getCache('site:public-settings');
  if (cached) {
    return NextResponse.json({ settings: cached });
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ settings: DEFAULT_SETTINGS });
    }

    // OPTIMIZATION: Only select specific public fields instead of '*'
    const { data, error } = await supabase
      .from('settings')
      .select(PUBLIC_FIELDS.join(','))
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ settings: DEFAULT_SETTINGS });
    }

    // Filter to only public fields
    const publicData = {};
    for (const key of PUBLIC_FIELDS) {
      if (data[key] !== undefined) publicData[key] = data[key];
    }

    const finalSettings = { ...DEFAULT_SETTINGS, ...publicData };
    setCache('site:public-settings', finalSettings, 86400);

    return NextResponse.json(
      { settings: finalSettings },
      {
        headers: {
          // Browser caches for 1 hour, CDN caches for 24 hours
          'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    );
  } catch {
    return NextResponse.json({ settings: DEFAULT_SETTINGS });
  }
}
