import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkAdminAccess, ROLES } from '@/lib/auth';
import { logActivity } from '@/lib/logger';
import { cacheHeaders, getCache, setCache } from '@/lib/api-cache';
import { assignProductAndVariantSKUs } from '@/lib/skuServer';

export const dynamic = 'force-dynamic';

async function getAICorrectedSearchTerm(term) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  
  const prompt = `A user searched for "${term}" in an e-commerce store but no products were found. They likely made a typo.
What is the correct, intended search keyword? Return ONLY the single corrected word or short phrase. Do not include any quotes, punctuation, or explanations. If it seems completely random and cannot be corrected, return the original word.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 }
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      let corrected = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return corrected.trim().replace(/['"]/g, '');
    }
  } catch (err) {
    console.error('AI search correction failed:', err);
  }
  return null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cacheKey = `products:${searchParams.toString() || 'all'}`;
    const cached = getCache(cacheKey);
    if (cached) {
      if (Array.isArray(cached)) {
        return NextResponse.json({ products: cached, hasMore: false, totalCount: cached.length }, { headers: cacheHeaders(300, 1800) });
      }
      return NextResponse.json(cached, { headers: cacheHeaders(300, 1800) });
    }

    const supabase = getSupabaseAdmin();
    
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const featured = searchParams.get('featured');
    const slug = searchParams.get('slug');
    const categoryParam = searchParams.get('category');
    const sort = searchParams.get('sort');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    
    // Resolve categoryParam: support slug, UUID, name, and include all subcategory products
    let matchedCategoryValues = null;
    if (categoryParam) {
      try {
        const { data: allCategories } = await supabase
          .from('categories')
          .select('id, parent_id, slug, name');

        if (allCategories && allCategories.length > 0) {
          const cleanParam = decodeURIComponent(categoryParam).trim().toLowerCase();
          const target = allCategories.find(c => 
            c.id?.toLowerCase() === cleanParam || 
            c.slug?.toLowerCase() === cleanParam || 
            c.name?.toLowerCase() === cleanParam
          );

          if (target) {
            const collectDescendants = (parentId) => {
              let ids = [parentId];
              const children = allCategories.filter(c => c.parent_id === parentId);
              for (const child of children) {
                ids = ids.concat(collectDescendants(child.id));
              }
              return ids;
            };

            const allMatchedIds = Array.from(new Set(collectDescendants(target.id)));
            const allMatchedSlugs = allCategories
              .filter(c => allMatchedIds.includes(c.id))
              .map(c => c.slug)
              .filter(Boolean);
            const allMatchedNames = allCategories
              .filter(c => allMatchedIds.includes(c.id))
              .map(c => c.name)
              .filter(Boolean);

            matchedCategoryValues = Array.from(new Set([
              ...allMatchedIds,
              ...allMatchedSlugs,
              ...allMatchedNames,
              categoryParam
            ])).filter(Boolean);
          }
        }
      } catch (catErr) {
        console.error('Error resolving category in /api/products:', catErr);
      }
    }

    // OPTIMIZATION: When querying by slug for product page, include full details.
    // For listing queries (category, search, pagination), omit heavy HTML description, attributes, variants, and extra gallery images to save massive bandwidth!
    const selectFields = slug
      ? 'id, name, description, shortDescription, regularPrice, sellingPrice, price, oldPrice, stockQuantity, stock, stockStatus, category, category_code, sku, legacy_sku, brand, tags, images, featuredImage, isFeatured, isNewArrival, isBestSeller, isActive, attributes, variants, created_at, slug, rating, review_count, sold_count'
      : 'id, name, sellingPrice, regularPrice, price, oldPrice, stockQuantity, stock, stockStatus, category, category_code, sku, legacy_sku, variants, featuredImage, isFeatured, isNewArrival, isBestSeller, isActive, slug, rating, review_count, sold_count';

    let query = supabase.from('products').select(selectFields, { count: 'exact' });
    
    if (slug) query = query.eq('slug', slug);
    if (featured === 'true') query = query.eq('isFeatured', true);
    
    const isNewArrival = searchParams.get('isNewArrival') || searchParams.get('newArrival');
    const isBestSeller = searchParams.get('isBestSeller') || searchParams.get('bestSeller');
    if (isNewArrival === 'true') query = query.eq('isNewArrival', true);
    if (isBestSeller === 'true') query = query.eq('isBestSeller', true);
    if (categoryParam) {
      if (matchedCategoryValues && matchedCategoryValues.length > 0) {
        const formatted = matchedCategoryValues.map(v => `"${v}"`).join(',');
        query = query.or(`category.in.(${formatted}),category_slug.in.(${formatted})`);
      } else {
        const safeVal = `"${categoryParam}"`;
        query = query.or(`category.eq.${safeVal},category_slug.eq.${safeVal}`);
      }
    }
    if (minPrice && !isNaN(parseFloat(minPrice))) query = query.or(`sellingPrice.gte.${minPrice},price.gte.${minPrice}`);
    if (maxPrice && !isNaN(parseFloat(maxPrice))) query = query.or(`sellingPrice.lte.${maxPrice},price.lte.${maxPrice}`);
    
    if (search) {
      const safeSearch = search.replace(/[,%]/g, '').trim();
      if (safeSearch) {
        query = query.or(`name.ilike.%${safeSearch}%,slug.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
      }
    }
    
    if (sort === 'price_low') {
      query = query.order('sellingPrice', { ascending: true, nullsFirst: false });
    } else if (sort === 'price_high') {
      query = query.order('sellingPrice', { ascending: false, nullsFirst: false });
    } else {
      query = query.order('created_at', { ascending: sort === 'createdAt' });
    }
    
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    let products = data || [];
    let totalCount = count || 0;

    // --- AI Smart Fallback Logic ---
    if (search && products.length === 0 && search.length > 2) {
      const correctedTerm = await getAICorrectedSearchTerm(search);
      if (correctedTerm && correctedTerm.toLowerCase() !== search.toLowerCase()) {
        const safeSearch = correctedTerm.replace(/[,%]/g, '').trim();
        if (safeSearch) {
          let fallbackQuery = supabase.from('products').select('*', { count: 'exact' });
          if (slug) fallbackQuery = fallbackQuery.eq('slug', slug);
          if (featured === 'true') fallbackQuery = fallbackQuery.or('isFeatured.eq.true,featured.eq.true');
          if (vendorParam === 'official') {
            fallbackQuery = fallbackQuery.is('vendor_id', null);
          } else if (vendorParam) {
            fallbackQuery = fallbackQuery.eq('vendor_id', vendorParam);
          }
          if (categoryParam) {
            if (matchedCategoryValues && matchedCategoryValues.length > 0) {
              fallbackQuery = fallbackQuery.in('category', matchedCategoryValues);
            } else {
              fallbackQuery = fallbackQuery.eq('category', categoryParam);
            }
          }
          if (minPrice && !isNaN(parseFloat(minPrice))) fallbackQuery = fallbackQuery.or(`sellingPrice.gte.${minPrice},price.gte.${minPrice}`);
          if (maxPrice && !isNaN(parseFloat(maxPrice))) fallbackQuery = fallbackQuery.or(`sellingPrice.lte.${maxPrice},price.lte.${maxPrice}`);
          
          fallbackQuery = fallbackQuery.or(`name.ilike.%${safeSearch}%,slug.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
          
          if (sort === 'price_low') {
            fallbackQuery = fallbackQuery.order('sellingPrice', { ascending: true, nullsFirst: false });
          } else if (sort === 'price_high') {
            fallbackQuery = fallbackQuery.order('sellingPrice', { ascending: false, nullsFirst: false });
          } else {
            fallbackQuery = fallbackQuery.order('created_at', { ascending: sort === 'createdAt' });
          }
          
          fallbackQuery = fallbackQuery.range(from, to);
          
          const { data: fallbackData, error: fallbackError, count: fbCount } = await fallbackQuery;
          if (!fallbackError && fallbackData && fallbackData.length > 0) {
            products = fallbackData;
            totalCount = fbCount || 0;
          }
        }
      }
    }

    // --- AI Semantic Search Fallback Logic ---
    if (search && products.length === 0 && search.length > 2) {
      try {
        const { generateProductEmbedding } = require('@/lib/ai-embeddings');
        const queryEmbedding = await generateProductEmbedding({ name: search });
        if (queryEmbedding) {
          const { data: semanticProducts, error: semanticError } = await supabase.rpc('match_products', {
            query_embedding: queryEmbedding,
            match_threshold: 0.35,
            match_count: limit
          });

          if (!semanticError && semanticProducts && semanticProducts.length > 0) {
            products = semanticProducts;
            totalCount = semanticProducts.length;
          }
        }
      } catch (err) {
        console.error('Semantic search fallback failed:', err);
      }
    }

    // --- Store Branding (Vestro Wear House) ---
    const brandStore = {
      id: 'vestro',
      shop_name: 'Vestro Wear House',
      owner_name: 'Vestro Wear House',
      logo_url: '/tab-icon.png',
      is_verified: true,
      verification_badge: 'Official Brand Store',
      is_official: true,
      rating: 4.9,
      total_reviews: 1250,
      shop_address: 'Dhaka, Bangladesh',
      response_rate: '100%',
      on_time_delivery: '99.9%',
      fulfilled_by: 'Vestro Direct'
    };

    products = products.map(p => ({
      ...p,
      vendor_id: null,
      store_name: 'Vestro Wear House',
      vendor_logo: '/tab-icon.png',
      is_official: true,
      vendor: brandStore
    }));

    const hasMore = from + limit < totalCount;
    const responseData = { products, hasMore, totalCount };
    
    setCache(cacheKey, responseData, 300);
    return NextResponse.json(responseData, { headers: cacheHeaders(300, 1800) });
  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

import { updateProductEmbedding } from '@/lib/ai-embeddings';
import { revalidatePath } from 'next/cache';
import { clearCache, clearCacheByPrefix } from '@/lib/api-cache';

import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request) {
  try {
    const auth = await checkAdminAccess([ROLES.SUPER_ADMIN, ROLES.EDITOR]);
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await request.json();

    // Automatically generate a unique slug from the product name if missing
    if (!body.slug && body.name) {
      const baseSlug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      body.slug = `${baseSlug}-${Date.now().toString(36)}`;
    }
    
    // Prevent Supabase unique constraint errors for empty SKUs
    if (body.sku === '') body.sku = null;

    // Always nullify vendor_id (Direct-to-consumer store model)
    body.vendor_id = null;

    // Automatically upload any base64 images to Cloudinary to prevent database & bandwidth bloat
    if (typeof body.featuredImage === 'string' && body.featuredImage.startsWith('data:')) {
      try {
        const uploadRes = await uploadToCloudinary(body.featuredImage, { folder: 'stellar-mart/products' });
        body.featuredImage = uploadRes.url;
      } catch (uploadErr) {
        console.error('Failed to upload base64 featuredImage to Cloudinary:', uploadErr);
      }
    }
    if (Array.isArray(body.images)) {
      body.images = await Promise.all(
        body.images.map(async (img) => {
          if (typeof img === 'string' && img.startsWith('data:')) {
            try {
              const uploadRes = await uploadToCloudinary(img, { folder: 'stellar-mart/products' });
              return uploadRes.url;
            } catch (uploadErr) {
              console.error('Failed to upload base64 images item to Cloudinary:', uploadErr);
              return img;
            }
          }
          return img;
        })
      );
    }

    const supabase = getSupabaseAdmin();

    // Generate atomic, race-condition safe SKUs server-side for product & variants
    try {
      const skuAssignment = await assignProductAndVariantSKUs(supabase, {
        categoryId: body.category,
        categoryCode: body.category_code,
        variants: body.variants,
        attributes: body.attributes
      });
      body.sku = skuAssignment.sku;
      body.category_code = skuAssignment.category_code;
      body.size_code = skuAssignment.size_code;
      body.color_code = skuAssignment.color_code;
      body.variants = skuAssignment.variants;
    } catch (skuErr) {
      console.error('Server SKU generation warning:', skuErr);
    }

    const { data, error } = await supabase.from('products').insert([body]).select().single();
    if (error) throw error;

    // Generate vector embedding asynchronously in background without blocking HTTP response
    if (data?.id) {
      updateProductEmbedding(data.id).catch(() => {});
    }

    // Invalidate caches
    clearCache('home:v1');
    clearCacheByPrefix('products:');
    try {
      revalidatePath('/', 'layout');
    } catch (e) {}

    // Non-blocking log
    logActivity({ action: 'CREATE_PRODUCT', description: `Created new product: ${body.name}`, req: request }).catch(() => {});

    return NextResponse.json({ success: true, product: data }, { status: 201 });
  } catch (error) {
    console.error('Product create error:', error);
    return NextResponse.json({ error: 'পণ্য তৈরি করা সম্ভব হয়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।' }, { status: 500 });
  }
}
