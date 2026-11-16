import { createClient } from '@supabase/supabase-js';
import CategoriesClient from './CategoriesClient';

export const revalidate = 60; // Revalidate every 60 seconds

export const metadata = {
  title: 'Categories | Vestro Wear House',
  description: 'Explore curated fashion categories at Vestro Wear House. T-shirts, Hoodies, Sweatshirts, Cargo Pants, and Footwear.',
};

async function getCategories() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return [];
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, icon, icon_type, image')
      .not('slug', 'in', '("system-category-layout","system-flash-sale-config","system-quick-channels")')
      .eq('status', 'active')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CategoriesPage] Error fetching categories:', error);
      return [];
    }

    return categories || [];
  } catch (error) {
    console.error('[CategoriesPage] Unexpected error:', error);
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  return <CategoriesClient initialCategories={categories} />;
}
