import { getSupabaseAdmin } from '@/lib/supabase';

export async function generateMetadata({ params }) {
  const { slug } = params;
  if (!slug) return { title: 'Category | Vestro Wear House' };

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return { title: 'Category | Vestro Wear House' };

    const { data: category } = await supabase
      .from('categories')
      .select('name, image, description')
      .eq('slug', decodeURIComponent(slug))
      .maybeSingle();

    if (!category) {
      return {
        title: 'Category | Vestro Wear House',
      };
    }

    const title = `${category.name} | Vestro Wear House`;
    const description = category.description || `Browse the latest collection of ${category.name} at Vestro Wear House. Cash on delivery and fast shipping across Bangladesh.`;
    const imageUrl = category.image || 'https://www.vestrowearhouse.com/logo.png';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://www.vestrowearhouse.com/category/${slug}`,
        siteName: 'Vestro Wear House',
        images: [{ url: imageUrl, alt: category.name }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return {
      title: 'Category | Vestro Wear House',
    };
  }
}

export default function CategoryLayout({ children }) {
  return children;
}
