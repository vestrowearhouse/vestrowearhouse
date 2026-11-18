import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminAccess } from '@/lib/auth';
import { verifyAdminToken } from '@/lib/secureJwt';
import { revalidatePath } from 'next/cache';
import { clearCache, clearCacheByPrefix } from '@/lib/api-cache';

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase URL or Key');
  return createClient(supabaseUrl, supabaseKey);
};

const isValidUUID = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

// Helper for admin auth
async function checkAuth(request) {
  try {
    const auth = await checkAdminAccess();
    if (auth.authorized) return true;
  } catch {}
  try {
    const decoded = await verifyAdminToken(request);
    if (decoded) return true;
  } catch {}
  return false;
}

// GET - Fetch single category by ID or slug
export async function GET(request, { params }) {
  const { id } = params;
  try {
    const supabase = getSupabaseClient();
    const isUUID = isValidUUID(id);
    let query = supabase.from('categories').select('*');
    if (isUUID) { query = query.eq('id', id); } else { query = query.eq('slug', id); }
    const { data: category, error } = await query.single();
    if (error || !category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    return NextResponse.json({ category }, { status: 200 });
  } catch (error) {
    console.error('Fetch single category error:', error);
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

// PUT - Update a category
export async function PUT(request, { params }) {
  const { id } = params;
  try {
    const isAuthorized = await checkAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized - admin access required' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const data = await request.json();

    const parentId = (data.parent_id && isValidUUID(data.parent_id)) ? data.parent_id : null;

    const updateData = {
      name: data.name?.trim(),
      slug: data.slug?.trim(),
      description: data.description !== undefined ? (data.description ? data.description.trim() : null) : null,
      image: data.image !== undefined ? (data.image ? data.image.trim() : null) : null,
      parent_id: parentId,
      status: data.status === 'inactive' ? 'inactive' : 'active',
      sort_order: data.sort_order !== undefined ? Number(data.sort_order) || 0 : 0,
      icon: data.icon !== undefined ? data.icon : '📦',
      icon_type: data.iconType || data.icon_type || 'emoji',
      isFeatured: data.isFeatured !== undefined ? Boolean(data.isFeatured) : false,
      updated_at: new Date().toISOString(),
    };

    // Strip undefined keys
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const { data: updatedCategory, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 400 });
      }
      throw error;
    }

    // Invalidate caches
    clearCache('home:v1');
    clearCacheByPrefix('categories:');

    // Revalidate Next.js cached pages
    try {
      revalidatePath('/', 'layout');
    } catch (e) {
      console.warn('Revalidate error:', e);
    }

    return NextResponse.json({ message: 'Category updated successfully', category: updatedCategory }, { status: 200 });
  } catch (error) {
    console.error(`Update category error (ID: ${id}):`, error);
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
  }
}

// DELETE - Remove a category
export async function DELETE(request, { params }) {
  const { id } = params;
  try {
    const isAuthorized = await checkAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized - admin access required' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;

    // Invalidate caches
    clearCache('home:v1');
    clearCacheByPrefix('categories:');
    try {
      revalidatePath('/', 'layout');
    } catch (e) {
      console.warn('Revalidate error:', e);
    }

    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Delete category error (ID: ${id}):`, error);
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 });
  }
}