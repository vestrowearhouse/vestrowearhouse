import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import BrandLogo from './BrandLogo';

// Default fallback settings shown when the DB table doesn't exist or returns no data
const DEFAULT_SETTINGS = {
  site_name: 'StellarMart',
  site_tagline: 'Your trusted online shopping destination.',
  email: 'support@stellarmartbd.com',
  phone: '+880 1345-447500',
  address: 'Dhaka, Bangladesh',
  facebook_url: '#',
  instagram_url: '#',
  youtube_url: '#'
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

    return data;
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8 md:12">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3 md:mb-4">
              <BrandLogo size="md" textColor="text-white" />
            </div>
            <p className="text-gray-300 mb-4 text-sm">{settings.site_tagline}</p>
            <div className="flex gap-2 md:gap-4">
              <a href={settings.facebook_url || '#'} className="w-8 md:w-10 h-8 md:h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 text-white font-bold text-sm">f</a>
              <a href={settings.instagram_url || '#'} className="w-8 md:w-10 h-8 md:h-10 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-600 text-white font-bold text-sm">in</a>
              <a href={settings.youtube_url || '#'} className="w-8 md:w-10 h-8 md:h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-500 text-white font-bold text-sm">Y</a>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-lg mb-3 md:mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2 text-gray-300 text-xs md:text-sm">
              <li><Link href="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-blue-400 transition-colors">Contact Us</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-blue-400 transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-lg mb-3 md:mb-4 text-white">My Account</h3>
            <ul className="space-y-2 text-gray-300 text-xs md:text-sm">
              <li><Link href="/login" className="hover:text-blue-400 transition-colors">Login</Link></li>
              <li><Link href="/register" className="hover:text-blue-400 transition-colors">Register</Link></li>
              <li><Link href="/cart" className="hover:text-blue-400 transition-colors">Shopping Cart</Link></li>
              <li><Link href="/orders" className="hover:text-blue-400 transition-colors">My Orders</Link></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-bold text-sm md:text-lg mb-3 md:mb-4 text-white">Contact Us</h3>
            <ul className="space-y-2 text-gray-300 text-xs md:text-sm">
              <li className="flex items-center gap-2">
                <span className="text-blue-400">📍</span> {settings.address}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">📧</span> {settings.email}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">📞</span> {settings.phone}
              </li>
              <li className="flex items-center gap-2">
                <a
                  href={`https://wa.me/${(settings.phone || '+8801345447500').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-400 transition-colors flex items-center gap-2"
                >
                  <span className="text-green-400">💬</span> WhatsApp: {settings.phone || '+880 1345-447500'}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-4 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
          <p className="text-gray-300 text-xs md:text-sm">© {new Date().getFullYear()} {settings.site_name}. All rights reserved.</p>
          <div className="flex items-center gap-2 md:gap-4">
            <span className="px-2 md:px-3 py-1 bg-gray-800 rounded text-gray-300 text-xs">💳 Visa</span>
            <span className="px-2 md:px-3 py-1 bg-gray-800 rounded text-gray-300 text-xs">💳 Mastercard</span>
            <span className="px-2 md:px-3 py-1 bg-gray-800 rounded text-gray-300 text-xs hidden sm:inline">💰 bKash</span>
            <span className="px-2 md:px-3 py-1 bg-gray-800 rounded text-gray-300 text-xs hidden sm:inline">💰 Nagad</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
