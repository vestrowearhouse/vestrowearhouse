import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import BrandLogo from './BrandLogo';

// Default fallback settings shown when the DB table doesn't exist or returns no data
const DEFAULT_SETTINGS = {
  site_name: 'Vestro Wear House',
  site_tagline: 'আপনার বিশ্বস্ত প্রিমিয়াম ফ্যাশন ও লাইফস্টাইল ব্র্যান্ড। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।',
  email: 'support@vestrowearhouse.com',
  phone: '+880 1345-447500',
  address: 'House 12, Road 5, Mirpur, Dhaka, Bangladesh',
  facebook_url: 'https://www.facebook.com/vestrowearhouse',
  instagram_url: 'https://www.instagram.com/vestrowearhouse',
  youtube_url: 'https://www.youtube.com/@vestrowearhouse'
};

async function getSettings() {
  try {
    // Use service role key to bypass RLS — this is a server-only component
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return DEFAULT_SETTINGS;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('settings').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle();

    // If error (table missing, RLS block, etc.) — use fallback silently
    if (error || !data) return DEFAULT_SETTINGS;

    return {
      ...DEFAULT_SETTINGS,
      ...data,
      facebook_url: data.facebook_url && data.facebook_url !== '#' ? data.facebook_url : DEFAULT_SETTINGS.facebook_url,
      site_name: data.site_name || 'Vestro Wear House',
      address: data.address || DEFAULT_SETTINGS.address
    };
  } catch {
    // Never throw — silently fall back so the page still renders
    return DEFAULT_SETTINGS;
  }
}

export default async function Footer() {
  const settings = await getSettings();
  return (
    <footer className="bg-gray-900 text-white py-8 md:py-16">
      <div className="max-w-7xl mx-auto px-3 md:px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3 md:mb-4">
              <BrandLogo size="md" textColor="text-white" />
            </div>
            <p className="text-gray-300 mb-4 text-sm leading-relaxed">{settings.site_tagline}</p>
            <div className="flex gap-2.5 md:gap-3">
              <a 
                href={settings.facebook_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Visit our Facebook page"
                className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 text-white font-bold text-sm shadow-sm transition-transform hover:scale-110"
              >
                f
              </a>
              <a 
                href="https://wa.me/8801345447500?text=Hello%20StellarMartBD" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Contact us on WhatsApp"
                className="w-9 h-9 bg-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-500 text-white font-bold text-sm shadow-sm transition-transform hover:scale-110"
              >
                💬
              </a>
              <a 
                href={settings.youtube_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Visit our YouTube channel"
                className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-500 text-white font-bold text-sm shadow-sm transition-transform hover:scale-110"
              >
                Y
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-sm md:text-base mb-3 md:mb-4 text-white uppercase tracking-wider">Customer Care</h3>
            <ul className="space-y-2 text-gray-300 text-xs md:text-sm">
              <li><Link href="/return-policy" className="hover:text-emerald-400 transition-colors font-medium text-emerald-300">🔄 ৭ দিনের রিটার্ন পলিসি</Link></li>
              <li><Link href="/delivery-policy" className="hover:text-blue-400 transition-colors font-medium text-blue-300">🚚 ডেলিভারি ও চার্জ পলিসি</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/contact" className="hover:text-blue-400 transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm md:text-base mb-3 md:mb-4 text-white uppercase tracking-wider">My Account</h3>
            <ul className="space-y-2 text-gray-300 text-xs md:text-sm">
              <li><Link href="/orders" className="hover:text-blue-400 transition-colors">Track My Orders</Link></li>
              <li><Link href="/profile" className="hover:text-blue-400 transition-colors">User Profile</Link></li>
              <li><Link href="/cart" className="hover:text-blue-400 transition-colors">Shopping Cart</Link></li>
              <li><Link href="/wishlist" className="hover:text-blue-400 transition-colors">Saved Wishlist</Link></li>
              <li><Link href="/shop" className="hover:text-blue-400 transition-colors">All Gaming Products</Link></li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h3 className="font-bold text-sm md:text-base mb-3 md:mb-4 text-white uppercase tracking-wider">Contact & Hub</h3>
            <ul className="space-y-2.5 text-gray-300 text-xs md:text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">📍</span> 
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">📧</span> 
                <a href={`mailto:${settings.email}`} className="hover:text-blue-400">{settings.email}</a>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">📞</span> 
                <a href={`tel:${settings.phone}`} className="hover:text-blue-400">{settings.phone}</a>
              </li>
              <li className="flex items-center gap-2 pt-1">
                <a
                  href="https://wa.me/8801345447500?text=Hello%20StellarMartBD"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 rounded-lg text-white font-medium text-xs transition-colors flex items-center gap-1.5"
                >
                  <span>💬 WhatsApp Support</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-xs md:text-sm text-center md:text-left">
            © 2026 {settings.site_name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-xs font-semibold">💵 Cash on Delivery</span>
            <span className="px-2.5 py-1 bg-gray-800 rounded text-gray-300 text-xs">💰 bKash</span>
            <span className="px-2.5 py-1 bg-gray-800 rounded text-gray-300 text-xs">💰 Nagad</span>
            <span className="px-2.5 py-1 bg-gray-800 rounded text-gray-300 text-xs">💳 Visa</span>
            <span className="px-2.5 py-1 bg-gray-800 rounded text-gray-300 text-xs">💳 Mastercard</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
