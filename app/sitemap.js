import { getSupabaseAdmin } from '@/lib/supabase';

const BASE_URL = 'https://www.vestrowearhouse.com';

// Cache generated sitemap for 24 hours to prevent repeated DB egress on bot crawls
export const revalidate = 86400;
export default async function sitemap() {
  // Static pages — always included
  const staticRoutes = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Dynamic routes from database
  let productRoutes = [];
  let categoryRoutes = [];

  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {

      // Fetch product slugs
      const { data: products } = await supabase
        .from('products')
        .select('slug, updated_at')
        .limit(500);

      if (products) {
        productRoutes = products
          .filter(p => p.slug)
          .map(p => ({
            url: `${BASE_URL}/product/${p.slug}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
          }));
      }

      // Fetch category slugs
      const { data: categories } = await supabase
        .from('categories')
        .select('slug, updated_at')
        .eq('status', 'active')
        .neq('slug', 'system-category-layout');

      if (categories) {
        categoryRoutes = categories
          .filter(c => c.slug)
          .map(c => ({
            url: `${BASE_URL}/category/${c.slug}`,
            lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
          }));
      }
    }
  } catch {
    // Return only static routes if DB is unavailable
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
