import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkAdminAccess } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { getCache, setCache, clearCache, clearCacheByPrefix } from '@/lib/api-cache';

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  return getSupabaseAdmin();
};

// Helper function to build a nested tree from a flat array
const buildCategoryTree = (categories, parentId = null) => {
  const tree = [];
  categories
    .filter((category) => category.parent_id === parentId)
    .forEach((category) => {
      const children = buildCategoryTree(categories, category.id);
      if (children.length) {
        category.subcategories = children; // Match frontend component prop
      }
      tree.push(category);
    });
  return tree;
};

// GET - Fetch all categories
export async function GET(request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Optional filter
    const nested = searchParams.get('nested') === 'true';
    const noCache = searchParams.has('t') || searchParams.has('nocache') || request.headers.get('cache-control')?.includes('no-cache');
    const cacheKey = `categories:${searchParams.toString() || 'all'}`;

    if (!noCache) {
      const cached = getCache(cacheKey);
      if (cached) {
        return NextResponse.json(
          { categories: cached },
          { 
            status: 200, 
            headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } 
          }
        );
      }
    }

    let query = supabase
      .from('categories')
      .select('id, name, slug, image, icon, icon_type, parent_id, sort_order, isFeatured, status')
      .not('slug', 'like', 'system-%')
      .not('slug', 'in', '("system-category-layout","system-flash-sale-config","system-quick-channels")')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: categories, error } = await query;

    if (error) throw error;

    const result = nested ? buildCategoryTree(categories || []) : (categories || []);

    if (!noCache) {
      setCache(cacheKey, result, 3600);
    }

    return NextResponse.json(
      { categories: result },
      { 
        status: 200, 
        headers: { 
          'Cache-Control': noCache 
            ? 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0' 
            : 'public, s-maxage=3600, stale-while-revalidate=86400' 
        } 
      }
    );
  } catch (error) {
    console.error('Fetch categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST - Create a new category (Admin Only)
export async function POST(request) {
  try {
    const auth = await checkAdminAccess();
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized - admin access required' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const data = await request.json();

    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    // Auto-generate or sanitize slug (support English, Bengali, and Unicode)
    let slug = (data.slug || '').trim();
    if (!slug) {
      slug = data.name
        .toLowerCase()
        .trim()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    }
    if (!slug) {
      slug = `cat-${Date.now().toString(36)}`;
    }

    // Check if slug already exists to prevent duplicate key error
    const { data: existingSlug } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Validate parent_id UUID
    const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    const parentId = (data.parent_id && isValidUUID(data.parent_id)) ? data.parent_id : null;

    const newCategory = {
      name: data.name.trim(),
      slug: slug,
      description: data.description?.trim() || null,
      image: data.image?.trim() || null,
      parent_id: parentId,
      status: data.status === 'inactive' ? 'inactive' : 'active',
      sort_order: Number(data.sort_order) || 0,
      icon: data.icon || '📦',
      icon_type: data.iconType || data.icon_type || 'emoji',
      isFeatured: Boolean(data.isFeatured)
    };

    const { data: createdCategory, error } = await supabase
      .from('categories')
      .insert([newCategory])
      .select()
      .single();

    if (error) {
      console.error('Supabase category insert error:', error);
      throw error;
    }

    // Invalidate in-memory caches
    clearCache('home:v1');
    clearCacheByPrefix('categories:');

    // Fast single-pass layout revalidation
    try {
      revalidatePath('/', 'layout');
    } catch (e) {
      console.warn('Revalidate error:', e);
    }

    return NextResponse.json(
      { message: 'Category created successfully', category: createdCategory },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}