import { getSupabaseAdmin } from '@/lib/supabase';

export async function generateMetadata({ params }) {
  const { slug } = params;
  if (!slug) return { title: 'Product | Stellar Mart BD' };

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return { title: 'Product | Stellar Mart BD' };

    const { data: product } = await supabase
      .from('products')
      .select('name, description, shortDescription, sellingPrice, price, featuredImage, images')
      .eq('slug', decodeURIComponent(slug))
      .maybeSingle();

    if (!product) {
      return {
        title: 'Product | Stellar Mart BD',
      };
    }

    const title = `${product.name} | Stellar Mart BD`;
    const rawDesc = product.shortDescription || product.description || 'Shop authentic products at the best prices on Stellar Mart BD with fast cash on delivery across Bangladesh.';
    const cleanDesc = rawDesc.replace(/<[^>]*>/g, '').trim().slice(0, 160);
    const imageUrl = product.featuredImage || (Array.isArray(product.images) && product.images[0]) || 'https://www.stellarmartbd.com/logo.png';

    return {
      title,
      description: cleanDesc,
      openGraph: {
        title,
        description: cleanDesc,
        url: `https://www.stellarmartbd.com/product/${slug}`,
        siteName: 'Stellar Mart BD',
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 800,
            alt: product.name,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: cleanDesc,
        images: [imageUrl],
      },
    };
  } catch {
    return {
      title: 'Product | Stellar Mart BD',
    };
  }
}

export default function ProductLayout({ children }) {
  return children;
}
