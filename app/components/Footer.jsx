import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import BrandLogo from './BrandLogo';

const DEFAULT_SETTINGS = {
  site_name: 'Vestro Wear House',
  site_tagline: 'Your Trusted Fashion & Lifestyle Destination in Bangladesh.',
  email: 'support@vestrowearhouse.com',
  phone: '+880 1345-447500',
  address: 'House 12, Road 5, Mirpur, Dhaka, Bangladesh',
  facebook_url: 'https://www.facebook.com/vestrowearhouse',
  instagram_url: 'https://www.instagram.com/vestrowearhouse',
  youtube_url: 'https://www.youtube.com/@vestrowearhouse'
};

async function getSettings() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return DEFAULT_SETTINGS;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('settings').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle();

    if (error || !data) return DEFAULT_SETTINGS;

    return {
      ...DEFAULT_SETTINGS,
      ...data,
      site_name: data.site_name || 'Vestro Wear House',
      address: data.address || DEFAULT_SETTINGS.address
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default async function Footer() {
  const settings = await getSettings();

  return (
    <footer id="site-footer" className="mt-16 sm:mt-24 border-t border-neutral-100 bg-neutral-50 text-neutral-800">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-3 sm:px-6">
        {/* Column 1: Top Categories */}
        <div>
          <p className="mb-4 text-[12px] font-bold tracking-[0.2em] uppercase text-neutral-900">TOP CATEGORIES</p>
          <ul className="space-y-2.5 text-[13px] text-neutral-600">
            <li><Link href="/shop" className="hover:text-black transition-colors">Shop All</Link></li>
            <li><Link href="/category/t-shirts" className="hover:text-black transition-colors">T-Shirts</Link></li>
            <li><Link href="/category/hoodies" className="hover:text-black transition-colors">Hoodies & Sweats</Link></li>
            <li><Link href="/category/pants" className="hover:text-black transition-colors">Bottom Wear</Link></li>
            <li><Link href="/category/shoes" className="hover:text-black transition-colors">Footwear</Link></li>
          </ul>
        </div>

        {/* Column 2: Information */}
        <div>
          <p className="mb-4 text-[12px] font-bold tracking-[0.2em] uppercase text-neutral-900">INFORMATION</p>
          <ul className="space-y-2.5 text-[13px] text-neutral-600">
            <li><Link href="/about" className="hover:text-black transition-colors">Our Story</Link></li>
            <li><Link href="/delivery-policy" className="hover:text-black transition-colors">Shipping & Delivery</Link></li>
            <li><Link href="/return-policy" className="hover:text-black transition-colors">Returns & Exchange</Link></li>
            <li><Link href="/orders" className="hover:text-black transition-colors">Track Order</Link></li>
            <li><Link href="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link></li>
            <li><Link href="/contact" className="hover:text-black transition-colors">Contact Support</Link></li>
          </ul>
        </div>

        {/* Column 3: Brand Details */}
        <div>
          <div className="mb-4">
            <BrandLogo size="md" />
          </div>
          <p className="text-[13px] leading-relaxed text-neutral-600 mb-3">
            Vestro Wear House · Dhaka, Bangladesh. Contemporary fashion, urban streetwear, and lifestyle apparel crafted for modern trends.
          </p>
          <p className="text-[12px] text-neutral-500 mb-1">
            📍 {settings.address}
          </p>
          <p className="text-[12px] text-neutral-500">
            📞 Helpline: <a href={`tel:${settings.phone}`} className="text-neutral-900 font-semibold hover:underline">{settings.phone}</a>
          </p>
        </div>
      </div>

      {/* Bottom Copyright bar */}
      <div className="border-t border-neutral-200/60 py-6 px-4 text-center text-[11px] tracking-[0.16em] uppercase text-neutral-500 mb-14 lg:mb-0">
        © 2026 VESTRO WEAR HOUSE · ALL RIGHTS RESERVED
      </div>
    </footer>
  );
}
