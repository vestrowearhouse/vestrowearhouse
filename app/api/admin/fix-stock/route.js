import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clearCacheByPrefix } from '@/lib/api-cache';
import { revalidatePath, revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

export async function GET(request) {
  try {
    const supabase = getSupabase();
    
    // Fetch all products
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, stock, stockQuantity, stockStatus');

    if (error) throw error;

    const needsFix = (products || []).filter(p => {
      const s = Number(p.stock || 0);
      const sq = Number(p.stockQuantity || 0);
      return (s > 0 && sq === 0) || (sq > 0 && s === 0) || !p.stockStatus;
    });

    const updated = [];

    for (const p of needsFix) {
      const s = Number(p.stock || 0);
      const sq = Number(p.stockQuantity || 0);
      const targetStock = Math.max(s, sq);
      const targetStatus = targetStock > 0 ? 'in_stock' : 'out_of_stock';

      const { error: updateErr } = await supabase
        .from('products')
        .update({
          stock: targetStock,
          stockQuantity: targetStock,
          stockStatus: targetStatus
        })
        .eq('id', p.id);

      if (!updateErr) {
        updated.push({
          id: p.id,
          name: p.name,
          oldStock: s,
          oldStockQuantity: sq,
          newStock: targetStock,
          newStockStatus: targetStatus
        });
      }
    }

    // Purge caches so homepage and product lists update immediately
    clearCacheByPrefix('products');
    clearCacheByPrefix('home');
    try {
      revalidateTag('homepage-data');
    } catch (_) {}
    revalidatePath('/', 'layout');
    revalidatePath('/shop');

    return NextResponse.json({
      success: true,
      totalChecked: products?.length || 0,
      fixedCount: updated.length,
      fixedProducts: updated
    });
  } catch (error) {
    console.error('Error fixing product stocks:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
