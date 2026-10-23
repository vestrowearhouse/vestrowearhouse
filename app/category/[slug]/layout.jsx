import { getSupabaseAdmin } from '@/lib/supabase';

export async function generateMetadata({ params }) {
  const { slug } = params;
  if (!slug) return { title: 'Category | Stellar Mart BD' };

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return { title: 'Category | Stellar Mart BD' };

    const { data: category } = await supabase
      .from('categories')
      .select('name, image, description')
      .eq('slug', decodeURIComponent(slug))
      .maybeSingle();

    if (!category) {
      return {
        title: 'Category | Stellar Mart BD',
      };
    }

    const title = `${category.name} | Stellar Mart BD`;
    const description = category.description || `Browse the best collection of ${category.name} at Stellar Mart BD. Cash on delivery and quick shipping across Bangladesh.`;
    const imageUrl = category.image || 'https://www.stellarmartbd.com/logo.png';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://www.stellarmartbd.com/category/${slug}`,
        siteName: 'Stellar Mart BD',
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
      title: 'Category | Stellar Mart BD',
    };
  }
}

export default function CategoryLayout({ children }) {
  return children;
}
