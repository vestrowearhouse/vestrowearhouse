import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/secureJwt';
import { cookies } from 'next/headers';
import { revalidatePath, revalidateTag } from 'next/cache';
import { clearCacheByPrefix } from '@/lib/api-cache';

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

const QUICK_CHANNELS_SLUG = 'system-quick-channels';

export const DEFAULT_CHANNELS = [
  {
    id: 'mega-deals',
    name: 'Mega Deals',
    icon: 'Flame',
    bg: 'from-amber-400 to-orange-500',
    href: '/shop?featured=true',
    actionType: 'link',
    enabled: true,
  },
  {
    id: 'low-price',
    name: 'Low Price',
    icon: 'Tag',
    bg: 'from-yellow-400 to-amber-500',
    href: '/shop?sort=price-asc',
    actionType: 'link',
    enabled: true,
  },
  {
    id: 'beauty-finds',
    name: 'Beauty Finds',
    icon: 'Sparkles',
    bg: 'from-pink-400 to-rose-500',
    href: '/categories',
    actionType: 'link',
    enabled: true,
  },
  {
    id: 'fashion-look',
    name: 'Fashion Look',
    icon: 'Shirt',
    bg: 'from-purple-500 to-indigo-500',
    href: '/categories',
    actionType: 'link',
    enabled: true,
  },
  {
    id: 'stellar-mall',
    name: 'StellarMall',
    icon: 'ShieldCheck',
    bg: 'from-blue-600 to-indigo-700',
    href: '/shop',
    actionType: 'link',
    enabled: true,
  },
  {
    id: 'flash-sale',
    name: 'Flash Sale',
    icon: 'Zap',
    bg: 'from-red-500 to-rose-600',
    href: '#mobile-flash-sale',
    actionType: 'link',
    enabled: true,
  },
  {
    id: 'electronics',
    name: 'Electronics',
    icon: 'Smartphone',
    bg: 'from-sky-400 to-blue-600',
    href: '/categories',
    actionType: 'link',
    enabled: true,
  },
  {
    id: 'vouchers',
    name: 'Vouchers',
    icon: 'Ticket',
    bg: 'from-fuchsia-500 to-pink-500',
    href: '/profile',
    actionType: 'link',
    enabled: true,
  },
  {
    id: 'free-delivery',
    name: 'Free Delivery',
    icon: 'Truck',
    bg: 'from-emerald-400 to-green-600',
    href: '/shop',
    actionType: 'link',
    enabled: true,
  },
  {
    id: 'ai-support',
    name: 'AI Support',
    icon: 'Bot',
    bg: 'from-blue-500 to-cyan-500',
    href: '#ai-chat',
    actionType: 'ai-chat',
    enabled: true,
  },
];

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken || !(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { data: row } = await supabase
      .from('categories')
      .select('id, custom_code, status')
      .eq('slug', QUICK_CHANNELS_SLUG)
      .single();

    let config = {
      enabled: true,
      channels: DEFAULT_CHANNELS
    };

    if (row && row.custom_code) {
      try {
        const parsed = JSON.parse(row.custom_code);
        config = {
          enabled: row.status !== 'inactive' && parsed.enabled !== false,
          channels: Array.isArray(parsed.channels) && parsed.channels.length > 0 ? parsed.channels : DEFAULT_CHANNELS
        };
      } catch (e) {
        console.error('Failed to parse quick channels JSON', e);
      }
    }

    return NextResponse.json({ config, defaultChannels: DEFAULT_CHANNELS });
  } catch (error) {
    console.error('Fetch quick channels error:', error);
    return NextResponse.json({ error: 'Failed to fetch quick channels config' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken || !(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enabled = true, channels = [] } = await request.json();

    const supabase = getSupabaseClient();
    const payloadStr = JSON.stringify({
      enabled: Boolean(enabled),
      channels: Array.isArray(channels) ? channels : DEFAULT_CHANNELS
    });

    const status = enabled ? 'active' : 'inactive';

    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', QUICK_CHANNELS_SLUG)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('categories')
        .update({
          custom_code: payloadStr,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('categories')
        .insert([{
          name: 'System Quick Channels Config',
          slug: QUICK_CHANNELS_SLUG,
          status,
          custom_code: payloadStr
        }]);

      if (error) throw error;
    }

    try {
      clearCacheByPrefix('home');
      revalidatePath('/', 'layout');
    } catch (cacheErr) {
      console.warn('Revalidation warning:', cacheErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Quick Channels configuration saved successfully!',
      config: { enabled, channels }
    });
  } catch (error) {
    console.error('Update quick channels error:', error);
    return NextResponse.json({ error: 'Failed to update quick channels config' }, { status: 500 });
  }
}
