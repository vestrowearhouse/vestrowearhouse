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

    // 1. Fetch current banners
    const { data: banners, error } = await supabase
      .from('banners')
      .select('*')
      .order('position', { ascending: true });

    if (error) throw error;

    const results = [];

    for (const banner of (banners || [])) {
      const currentImg = banner.image || '';
      
      // If image is an external google thumbnail or needs migration to Supabase storage
      if (currentImg.includes('gstatic.com') || currentImg.includes('encrypted-tbn0')) {
        try {
          const res = await fetch(currentImg, {
            headers: {
              'User-Agent': 'Mozilla/5.0'
            }
          });

          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const fileName = `banners/banner-${banner.position || 0}-${Date.now()}.jpg`;

            const { error: uploadError } = await supabase.storage
              .from('product-images')
              .upload(fileName, buffer, {
                contentType: 'image/jpeg',
                upsert: true
              });

            if (!uploadError) {
              const { data: publicUrlData } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

              const newUrl = publicUrlData.publicUrl;

              // Also provide clean default titles if missing
              let title = banner.title;
              if (!title) {
                if (banner.position === 100) title = 'Special Deals';
                else if (banner.position === 200) title = 'Trending Electronics';
                else if (banner.position === 0) title = 'Mega Sale & Offers';
                else title = 'Exclusive Collection';
              }

              let link = banner.link;
              if (!link) link = '/shop';

              const { error: updateError } = await supabase
                .from('banners')
                .update({
                  image: newUrl,
                  title,
                  link,
                  updated_at: new Date().toISOString()
                })
                .eq('id', banner.id);

              if (!updateError) {
                results.push({
                  id: banner.id,
                  position: banner.position,
                  oldImage: currentImg,
                  newImage: newUrl,
                  title
                });
              } else {
                results.push({ id: banner.id, error: updateError.message });
              }
            } else {
              results.push({ id: banner.id, uploadError: uploadError.message });
            }
          }
        } catch (fetchErr) {
          results.push({ id: banner.id, fetchErr: fetchErr.message });
        }
      }
    }

    // 2. Clear caches
    clearCacheByPrefix('banners');
    clearCacheByPrefix('home');
    try {
      revalidateTag('homepage-data');
    } catch (_) {}
    revalidatePath('/', 'layout');
    revalidatePath('/admin/banners');

    return NextResponse.json({
      success: true,
      migratedCount: results.length,
      migratedBanners: results,
      totalBanners: banners?.length || 0
    });
  } catch (err) {
    console.error('Error in fix-banners:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
