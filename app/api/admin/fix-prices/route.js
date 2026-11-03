import { NextResponse } from 'next/server';
import { clearCacheByPrefix } from '@/lib/api-cache';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getAdminSupabase } from '@/lib/dbExplorer';

export const dynamic = 'force-dynamic';

const getSupabase = () => getAdminSupabase();

export async function GET(request) {
  try {
    const supabase = getSupabase();
    
    // Fetch all products
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, sellingPrice, regularPrice, oldPrice');

    if (error) throw error;

    const needsFix = (products || []).filter(
      p => (!p.sellingPrice || Number(p.sellingPrice) === 0) && Number(p.price) > 0
    );

    const updated = [];

    for (const p of needsFix) {
      const newSelling = Number(p.price);
      const newRegular = Number(p.oldPrice) > 0 
        ? Number(p.oldPrice) 
        : (Number(p.regularPrice) > 0 ? Number(p.regularPrice) : newSelling);

      const { error: updateErr } = await supabase
        .from('products')
        .update({
          sellingPrice: newSelling,
          regularPrice: newRegular
        })
        .eq('id', p.id);

      if (!updateErr) {
        updated.push({ id: p.id, name: p.name, sellingPrice: newSelling, regularPrice: newRegular });
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
  } catch (err) {
    console.error('Error fixing prices:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
