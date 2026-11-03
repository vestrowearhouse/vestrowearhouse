import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { logActivity } from '@/lib/logger';
import { getAdminSupabase } from '@/lib/dbExplorer';

export const dynamic = 'force-dynamic';

const DEFAULT_VENDOR_SETTINGS = {
  commission_rate: 10,
  min_payout_amount: 1000,
  payout_frequency: 'weekly',
  holding_period_days: 3,
  require_product_approval: true,
  require_vendor_approval: true,
  allow_vendor_coupons: true,
  auto_approve_price_updates: false,
  supported_payout_methods: ['bkash', 'nagad', 'bank'],
  notify_admin_on_new_vendor: true,
  notify_admin_on_payout_request: true
};

const getSupabase = () => getAdminSupabase();

export async function GET(request) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getSupabase();

    // Try fetching vendor-specific settings row
    let loadedSettings = { ...DEFAULT_VENDOR_SETTINGS };
    try {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'vendor-settings')
        .single();

      if (data && data.metadata) {
        loadedSettings = { ...loadedSettings, ...(typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata) };
      }
    } catch (_) {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      settings: loadedSettings
    });
  } catch (error) {
    console.error('[Vendor Settings API] GET error:', error);
    return NextResponse.json({
      success: true,
      settings: DEFAULT_VENDOR_SETTINGS
    });
  }
}

export async function POST(request) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = getSupabase();

    const mergedSettings = {
      ...DEFAULT_VENDOR_SETTINGS,
      ...body
    };

    try {
      // Upsert vendor-settings row with metadata
      await supabase
        .from('settings')
        .upsert({
          id: 'vendor-settings',
          site_name: 'Vendor Settings',
          metadata: JSON.stringify(mergedSettings),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (e) {
      console.warn('[Vendor Settings API] Upsert warning:', e);
    }

    await logActivity({
      action: 'VENDOR_SETTINGS_UPDATE',
      resource: 'settings',
      resourceId: 'vendor-settings',
      description: 'Updated global vendor configuration settings',
      details: {
        changedFields: Object.keys(body || {}),
        commission_rate: mergedSettings.commission_rate,
        payout_frequency: mergedSettings.payout_frequency,
      },
      req: request,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Global vendor settings updated successfully!',
      settings: mergedSettings
    });
  } catch (error) {
    console.error('[Vendor Settings API] POST error:', error);
    return NextResponse.json({ error: 'Failed to save vendor settings' }, { status: 500 });
  }
}
