import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import BrandLogo from './BrandLogo';
import { Instagram, Facebook, Youtube, ShieldCheck, RefreshCw, Truck, Headphones } from 'lucide-react';

const DEFAULT_SETTINGS = {
  site_name: 'Vestro Wear House',
  site_tagline: 'Contemporary Urban Streetwear & High-Fashion Lifestyle Label in Bangladesh.',
  email: 'support@vestrowearhouse.com',
  phone: '+880 1345-447500',
  address: 'House 12, Road 5, Mirpur, Dhaka, Bangladesh',
  facebook_url: 'https://www.facebook.com/vestrowearhouse',
  instagram_url: 'https://www.instagram.com/vestrowearhouse',
  youtube_url: 'https://www.youtube.com/@vestrowearhouse'
};

async function getSettings() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzjspqceuthqdumvsdos.supabase.co';
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
    <footer id="site-footer" className="bg-black text-zinc-300 border-t border-zinc-900 mt-20 sm:mt-28">
      {/* 1. Value Pillars Header (Onfire Style) */}
      <div className="border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-3">
            <Truck className="w-6 h-6 text-white shrink-0" />
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-white">Nationwide Delivery</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Cash on delivery across all 64 districts</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-3">
            <RefreshCw className="w-6 h-6 text-white shrink-0" />
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-white">7 Days Exchange</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Hassle-free size & product exchange</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-white shrink-0" />
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-white">Premium Quality</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">100% genuine combed cotton fabrics</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-3">
            <Headphones className="w-6 h-6 text-white shrink-0" />
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-white">Direct Support</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Friendly support via WhatsApp & phone</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Brand Information & Socials */}
        <div className="md:col-span-4 space-y-4">
          <BrandLogo size="lg" textColor="text-white" />
          <p className="text-[13px] leading-relaxed text-zinc-400 pr-4">
            Vestro Wear House is an urban streetwear label defined by contemporary silhouettes, premium fabrics, and high-precision tailoring for modern culture.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <a 
              href={settings.facebook_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-white hover:text-black flex items-center justify-center transition-all"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a 
              href={settings.instagram_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-white hover:text-black flex items-center justify-center transition-all"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a 
              href={settings.youtube_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-white hover:text-black flex items-center justify-center transition-all"
              aria-label="Youtube"
            >
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Collections */}
        <div className="md:col-span-3">
          <p className="text-[12px] font-bold tracking-[0.2em] uppercase text-white mb-5">COLLECTIONS</p>
          <ul className="space-y-3 text-[13px] text-zinc-400">
            <li><Link href="/new" className="hover:text-white transition-colors">New Drops</Link></li>
            <li><Link href="/shop" className="hover:text-white transition-colors">All Streetwear</Link></li>
            <li><Link href="/category/t-shirts" className="hover:text-white transition-colors">Heavyweight T-Shirts</Link></li>
            <li><Link href="/category/hoodies" className="hover:text-white transition-colors">Hoodies & Sweatshirts</Link></li>
            <li><Link href="/category/pants" className="hover:text-white transition-colors">Cargos & Bottoms</Link></li>
          </ul>
        </div>

        {/* Customer Care & Policies */}
        <div className="md:col-span-3">
          <p className="text-[12px] font-bold tracking-[0.2em] uppercase text-white mb-5">HELP & POLICIES</p>
          <ul className="space-y-3 text-[13px] text-zinc-400">
            <li><Link href="/orders" className="hover:text-white transition-colors">Track Your Order</Link></li>
            <li><Link href="/delivery-policy" className="hover:text-white transition-colors">Shipping & Delivery Policy</Link></li>
            <li><Link href="/return-policy" className="hover:text-white transition-colors">7-Day Return & Exchange</Link></li>
            <li><Link href="/about" className="hover:text-white transition-colors">Brand Story</Link></li>
            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Contact & Hours */}
        <div className="md:col-span-2 space-y-3">
          <p className="text-[12px] font-bold tracking-[0.2em] uppercase text-white mb-5">GET IN TOUCH</p>
          <p className="text-[12px] text-zinc-400">Customer Helpline:</p>
          <a href={`tel:${settings.phone}`} className="block text-sm font-bold text-white hover:underline">
            {settings.phone}
          </a>
          <p className="text-[12px] text-zinc-400 mt-2">Email Inquiries:</p>
          <a href={`mailto:${settings.email}`} className="block text-[13px] text-zinc-300 hover:text-white hover:underline">
            {settings.email}
          </a>
          <p className="text-[11px] text-zinc-500 pt-2">
            Available 10:00 AM – 10:00 PM (Daily)
          </p>
        </div>

      </div>

      {/* 3. Bottom Legal Bar */}
      <div className="border-t border-zinc-900 py-6 px-4 text-center text-[11px] tracking-[0.16em] uppercase text-zinc-500 mb-14 lg:mb-0">
        © 2026 VESTRO WEAR HOUSE · ALL RIGHTS RESERVED
      </div>
    </footer>
  );
}
