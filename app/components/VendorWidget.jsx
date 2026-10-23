'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Star, 
  Store, 
  ChevronRight, 
  ShieldCheck, 
  Clock, 
  Truck, 
  BadgeCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function VendorWidget({ vendorId, vendor: initialVendor, isOfficial: explicitOfficial }) {
  const isOfficial = explicitOfficial || !vendorId || vendorId === 'official';
  const [vendor, setVendor] = useState(initialVendor || null);
  const [loading, setLoading] = useState(!initialVendor && !isOfficial && !!vendorId);

  useEffect(() => {
    if (initialVendor) {
      setVendor(initialVendor);
      setLoading(false);
      return;
    }

    if (isOfficial) {
      setVendor({
        id: 'official',
        shop_name: 'Stellar Mart Official',
        owner_name: 'Stellar Mart BD',
        logo_url: null,
        is_official: true,
        is_verified: true,
        verification_badge: 'Official Mall',
        average_rating: 4.9,
        total_reviews: 1250,
        shop_address: 'Dhaka, Bangladesh (Official Warehouse)',
        response_rate: '100%',
        on_time_delivery: '99.9%',
        fulfilled_by: 'Stellar Direct'
      });
      setLoading(false);
      return;
    }

    if (!vendorId || vendorId === 'official') return;
    
    let isMounted = true;
    async function fetchVendor() {
      try {
        const res = await fetch(`/api/vendors/${vendorId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.vendor) {
            setVendor(data.vendor);
          }
        }
      } catch (err) {
        console.error('Failed to fetch vendor for widget', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    fetchVendor();
    return () => { isMounted = false; };
  }, [vendorId, initialVendor, isOfficial]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING 1: STELLAR MART OFFICIAL STORE ---
  if (isOfficial || !vendor || vendor.is_official) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-4 shadow-sm border border-blue-900/60 transition-all">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Official Mall Avatar */}
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md flex-shrink-0 border border-white/20">
              <ShieldCheck className="w-6 h-6 text-white" />
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 rounded-full p-0.5 shadow">
                <Sparkles className="w-3 h-3 fill-slate-950" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 px-2 py-0.5 rounded-full shadow-xs">
                  Official Mall
                </span>
                <span className="text-[11px] text-blue-200/90 flex items-center gap-0.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-blue-400 inline" /> 100% Genuine
                </span>
              </div>
              <h3 className="font-bold text-white text-sm sm:text-base truncate mt-0.5 flex items-center gap-1">
                Stellar Mart Official
              </h3>
              <p className="text-[11px] text-slate-300 truncate">
                Fulfilled & Quality Checked by Stellar Direct
              </p>
            </div>
          </div>

          <Link 
            href="/shop?vendor=official" 
            className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg transition-colors shadow-xs"
          >
            Visit Mall <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Official Performance Metrics */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-center relative z-10">
          <div className="bg-white/5 rounded-lg py-1.5 px-1 border border-white/5">
            <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-bold">
              <Star className="w-3 h-3 fill-amber-400" /> 4.9 / 5.0
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Store Rating</div>
          </div>
          <div className="bg-white/5 rounded-lg py-1.5 px-1 border border-white/5">
            <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-bold">
              <Truck className="w-3 h-3" /> 99.9%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">On-Time Dispatch</div>
          </div>
          <div className="bg-white/5 rounded-lg py-1.5 px-1 border border-white/5">
            <div className="flex items-center justify-center gap-1 text-blue-300 text-xs font-bold">
              <Clock className="w-3 h-3" /> &lt; 15 mins
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Response Time</div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING 2: INDEPENDENT VENDOR STORE ---
  const shopName = vendor.shop_name || 'Vendor Store';
  const rating = Number(vendor.average_rating || vendor.rating || 4.8).toFixed(1);
  const totalReviews = vendor.total_reviews || 24;

  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs hover:border-purple-200 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Store Logo / Icon */}
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-purple-50 border border-purple-100 shadow-2xs flex-shrink-0 flex items-center justify-center">
            {vendor.logo_url ? (
              <img src={vendor.logo_url} alt={shopName} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-6 h-6 text-purple-600" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                Vendor Store
              </span>
              {(vendor.is_verified || vendor.verification_badge) && (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-500" /> Verified Seller
                </span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate mt-0.5">
              {shopName}
            </h3>
            {vendor.shop_address && (
              <p className="text-[11px] text-gray-500 truncate">
                📍 {vendor.shop_address}
              </p>
            )}
          </div>
        </div>

        <Link 
          href={`/shop?vendor=${vendor.id}`} 
          className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors border border-purple-200/60"
        >
          Visit Store <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Vendor Stats Strip */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 text-center">
        <div className="bg-gray-50/80 rounded-lg py-1.5 px-1 border border-gray-100">
          <div className="flex items-center justify-center gap-1 text-amber-500 text-xs font-bold">
            <Star className="w-3 h-3 fill-amber-500" /> {rating}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">({totalReviews} reviews)</div>
        </div>
        <div className="bg-gray-50/80 rounded-lg py-1.5 px-1 border border-gray-100">
          <div className="text-xs font-bold text-emerald-600">
            98%
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Positive Rating</div>
        </div>
        <div className="bg-gray-50/80 rounded-lg py-1.5 px-1 border border-gray-100">
          <div className="text-xs font-bold text-blue-600">
            99%
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Ship on Time</div>
        </div>
      </div>
    </div>
  );
}
