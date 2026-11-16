import { getSupabaseAdmin } from '@/lib/supabase';

export async function generateMetadata({ params }) {
  const { slug } = params;
  if (!slug) return { title: 'Product | Vestro Wear House' };

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return { title: 'Product | Vestro Wear House' };

    const { data: product } = await supabase
      .from('products')
      .select('name, description, shortDescription, sellingPrice, price, featuredImage, images')
      .eq('slug', decodeURIComponent(slug))
      .maybeSingle();

    if (!product) {
      return {
        title: 'Product | Vestro Wear House',
      };
    }

    const title = `${product.name} | Vestro Wear House`;
    const rawDesc = product.shortDescription || product.description || 'Shop premium streetwear and fashion apparel at Vestro Wear House with nationwide cash on delivery across Bangladesh.';
    const cleanDesc = rawDesc.replace(/<[^>]*>/g, '').trim().slice(0, 160);
    const imageUrl = product.featuredImage || (Array.isArray(product.images) && product.images[0]) || 'https://www.vestrowearhouse.com/logo.png';

    return {
      title,
      description: cleanDesc,
      openGraph: {
        title,
        description: cleanDesc,
        url: `https://www.vestrowearhouse.com/product/${slug}`,
        siteName: 'Vestro Wear House',
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
      title: 'Product | Vestro Wear House',
    };
  }
}

export default function ProductLayout({ children }) {
  return children;
}
