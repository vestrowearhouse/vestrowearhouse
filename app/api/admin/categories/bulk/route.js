import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminAccess, ROLES } from '@/lib/auth';
import { logActivity } from '@/lib/logger';
import { clearCache, clearCacheByPrefix } from '@/lib/api-cache';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

function generateSlug(name) {
  if (!name) return `cat-${Date.now().toString(36)}`;
  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  return cleaned || `cat-${Date.now().toString(36)}`;
}

const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export async function POST(request) {
  try {
    const auth = await checkAdminAccess([ROLES.SUPER_ADMIN, ROLES.EDITOR]);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const rawItems = Array.isArray(body) ? body : (body.categories || body.items || []);

    if (!rawItems || rawItems.length === 0) {
      return NextResponse.json({ error: 'No category data provided. Please provide an array of categories.' }, { status: 400 });
    }

    if (rawItems.length > 500) {
      return NextResponse.json({ error: 'Max 500 categories allowed per bulk batch.' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Fetch existing categories from Supabase
    const { data: existingCats } = await supabase.from('categories').select('id, name, slug');
    const categoryMap = new Map(); // maps lower(name), lower(slug), id -> UUID
    const existingSlugsSet = new Set();

    if (existingCats) {
      existingCats.forEach(c => {
        if (c.id) categoryMap.set(c.id.toLowerCase(), c.id);
        if (c.slug) {
          categoryMap.set(c.slug.toLowerCase(), c.id);
          existingSlugsSet.add(c.slug.toLowerCase());
        }
        if (c.name) categoryMap.set(c.name.trim().toLowerCase(), c.id);
      });
    }

    const validCategories = [];
    const validationErrors = [];

    for (let index = 0; index < rawItems.length; index++) {
      const item = rawItems[index];
      const rowIndex = index + 1;

      if (!item.name || typeof item.name !== 'string' || !item.name.trim()) {
        validationErrors.push({ row: rowIndex, item, reason: 'Category name is required' });
        continue;
      }

      const name = item.name.trim();

      // Generate or sanitize slug
      let slug = item.slug ? String(item.slug).trim() : '';
      if (!slug) {
        slug = generateSlug(name);
      } else {
        slug = generateSlug(slug);
      }

      // Check for collision against DB or current batch
      if (existingSlugsSet.has(slug.toLowerCase())) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
      }
      existingSlugsSet.add(slug.toLowerCase());

      // Parent category reference resolution
      let parentReference = item.parent_id || item.parentId || item.parent || item.parentCategory || null;
      if (parentReference && typeof parentReference === 'string') {
        parentReference = parentReference.trim();
      }

      validCategories.push({
        _originalIndex: rowIndex,
        _parentRef: parentReference,
        name,
        slug,
        description: item.description ? String(item.description).trim() : null,
        image: item.image ? String(item.image).trim() : null,
        parent_id: null, // will be resolved in two passes
        status: item.status === 'inactive' ? 'inactive' : 'active',
        sort_order: !isNaN(parseInt(item.sort_order || item.sortOrder)) ? parseInt(item.sort_order || item.sortOrder) : 0,
        icon: item.icon ? String(item.icon).trim() : '📦',
        icon_type: item.icon_type || item.iconType || 'emoji',
        custom_code: item.custom_code || item.customCode || null,
        isFeatured: Boolean(item.isFeatured || item.featured)
      });
    }

    if (validCategories.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No valid categories found to process.',
        total: rawItems.length,
        insertedCount: 0,
        failedCount: validationErrors.length,
        errors: validationErrors
      }, { status: 400 });
    }

    // Separate categories into Pass 1 (Root categories or parents already in DB) and Pass 2 (Children pointing to batch parents)
    const pass1Categories = [];
    const pass2Categories = [];

    validCategories.forEach(cat => {
      const ref = cat._parentRef;
      if (!ref) {
        cat.parent_id = null;
        pass1Categories.push(cat);
      } else if (isValidUUID(ref)) {
        cat.parent_id = ref;
        pass1Categories.push(cat);
      } else {
        const resolvedInDb = categoryMap.get(ref.toLowerCase());
        if (resolvedInDb) {
          cat.parent_id = resolvedInDb;
          pass1Categories.push(cat);
        } else {
          // Might reference another category in this same batch
          pass2Categories.push(cat);
        }
      }
    });

    const successfullyInserted = [];
    const insertionErrors = [...validationErrors];

    // Helper to insert a category list
    const insertBatch = async (categoriesToInsert) => {
      for (const cat of categoriesToInsert) {
        const { _originalIndex, _parentRef, ...cleanCat } = cat;
        const { data, error } = await supabase
          .from('categories')
          .insert([cleanCat])
          .select()
          .single();

        if (!error && data) {
          successfullyInserted.push(data);
          // Register in map so subsequent child categories can resolve it!
          if (data.id) categoryMap.set(data.id.toLowerCase(), data.id);
          if (data.slug) categoryMap.set(data.slug.toLowerCase(), data.id);
          if (data.name) categoryMap.set(data.name.trim().toLowerCase(), data.id);
        } else {
          insertionErrors.push({
            row: _originalIndex,
            name: cat.name,
            reason: error?.message || 'Database category insert failed'
          });
        }
      }
    };

    // Pass 1: Insert root & DB-linked categories
    await insertBatch(pass1Categories);

    // Pass 2: Now resolve parent references that were just inserted in Pass 1
    const resolvedPass2 = [];
    pass2Categories.forEach(cat => {
      const ref = cat._parentRef;
      const matchedId = ref ? categoryMap.get(ref.toLowerCase()) : null;
      cat.parent_id = matchedId || null;
      resolvedPass2.push(cat);
    });

    await insertBatch(resolvedPass2);

    // Invalidate caches
    try {
      clearCache('home:v1');
      clearCacheByPrefix('categories:');
      revalidatePath('/', 'layout');
      revalidatePath('/admin/categories');
    } catch (cacheErr) {
      console.warn('Cache revalidation error:', cacheErr);
    }

    // Activity Log
    logActivity({
      action: 'BULK_CREATE_CATEGORIES',
      description: `Bulk imported ${successfullyInserted.length} categories (Errors: ${insertionErrors.length})`,
      req: request
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      total: rawItems.length,
      insertedCount: successfullyInserted.length,
      failedCount: insertionErrors.length,
      inserted: successfullyInserted,
      errors: insertionErrors
    }, { status: 201 });

  } catch (err) {
    console.error('Bulk categories POST error:', err);
    return NextResponse.json({
      error: 'An unexpected error occurred during bulk category import: ' + (err.message || 'Unknown error')
    }, { status: 500 });
  }
}
