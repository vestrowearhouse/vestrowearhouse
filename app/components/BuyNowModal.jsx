'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, Zap, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';

let cachedWhatsAppPhone = null;

export default function BuyNowModal({
  isOpen,
  onClose,
  product,
  quantity = 1,
  variant = null,
  onDirectOrder,
}) {
  const [mounted, setMounted] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState(cachedWhatsAppPhone || '8801345447500');

  // SSR mount check for createPortal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch store phone/whatsapp if not already cached
  useEffect(() => {
    if (cachedWhatsAppPhone) {
      setWhatsappPhone(cachedWhatsAppPhone);
      return;
    }

    const sessionPhone = typeof window !== 'undefined' ? sessionStorage.getItem('stellar_wa_phone') : null;
    if (sessionPhone) {
      cachedWhatsAppPhone = sessionPhone;
      setWhatsappPhone(sessionPhone);
      return;
    }

    let isSubscribed = true;
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (!isSubscribed) return;
        const phone = data?.settings?.support_phone || data?.settings?.phone || '8801345447500';
        const clean = phone.replace(/[^0-9]/g, '');
        const normalized = clean.startsWith('01') ? `88${clean}` : clean;
        cachedWhatsAppPhone = normalized;
        if (typeof window !== 'undefined') sessionStorage.setItem('stellar_wa_phone', normalized);
        setWhatsappPhone(normalized);
      })
      .catch(() => {
        // Fallback to default
        cachedWhatsAppPhone = '8801345447500';
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Escape key handler & scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  // Resolve product data
  const productName = product?.name || 'Product';
  const getNum = (v) => {
    const n = Number(v);
    return !isNaN(n) && n > 0 ? n : 0;
  };

  const unitPrice =
    getNum(variant?.price) ||
    getNum(variant?.sellingPrice) ||
    getNum(product?.sellingPrice) ||
    getNum(product?.selling_price) ||
    getNum(product?.price) ||
    0;

  const qty = Math.max(1, Number(quantity) || 1);
  const totalPrice = unitPrice * qty;

  const productImage =
    variant?.image ||
    product?.image ||
    product?.featuredImage ||
    (Array.isArray(product?.images) ? product.images[0] : null) ||
    '/placeholder.png';

  // Format variant string
  let variantLabel = '';
  if (variant) {
    if (variant.selectedAttributes && typeof variant.selectedAttributes === 'object') {
      variantLabel = Object.entries(variant.selectedAttributes)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    } else if (variant.attributes && typeof variant.attributes === 'object') {
      variantLabel = Object.entries(variant.attributes)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    } else if (variant.title || variant.name) {
      variantLabel = variant.title || variant.name;
    }
  }

  // Handle WhatsApp Order Click
  const handleWhatsAppOrder = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://stellarmartbd.com';
    const prodSlug = product?.slug || product?.id || product?._id || '';
    const prodUrl = prodSlug ? `${origin}/product/${prodSlug}` : (typeof window !== 'undefined' ? window.location.href : '');

    let msg = `*🛍️ নতুন অর্ডার অনুরোধ (Stellar Mart BD)*\n\n`;
    msg += `📦 *পণ্য:* ${productName}\n`;
    if (variantLabel) {
      msg += `🎨 *ভেরিয়েন্ট/সাইজ:* ${variantLabel}\n`;
    }
    msg += `🔢 *পরিমাণ:* ${qty}\n`;
    msg += `💰 *প্রতি পিস মূল্য:* ৳${unitPrice.toLocaleString('en-IN')}\n`;
    msg += `💵 *সর্বমোট মূল্য:* ৳${totalPrice.toLocaleString('en-IN')}\n`;
    if (prodUrl) {
      msg += `🔗 *প্রোডাক্ট লিংক:* ${prodUrl}\n`;
    }
    msg += `\nআমি এই পণ্যটি অর্ডার করতে চাই। দয়া করে বিস্তারিত জানিয়ে অর্ডারটি কনফার্ম করুন।`;

    const cleanTarget = (whatsappPhone || '8801345447500').replace(/[^0-9]/g, '');
    const finalPhone = cleanTarget.startsWith('01') ? `88${cleanTarget}` : cleanTarget;
    const waUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
    onClose?.();
  };

  // Handle Direct Website Order Click
  const handleDirectOrder = () => {
    onClose?.();
    if (typeof onDirectOrder === 'function') {
      onDirectOrder();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh] sm:max-h-[90vh] transition-all transform animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="relative px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3.5 h-3.5" /> Order Options
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
              কিভাবে অর্ডার করতে চান?
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              আপনার সুবিধাজনক অর্ডার পদ্ধতিটি বেছে নিন
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 -mr-1 -mt-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Mini Product Summary Card */}
          <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl border border-gray-200/70">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
              {productImage ? (
                <Image
                  src={productImage}
                  alt={productName}
                  fill
                  className="object-contain p-1"
                  sizes="64px"
                />
              ) : (
                <span className="text-xs text-gray-400">No Image</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
                {productName}
              </h4>
              {variantLabel && (
                <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                  <span className="font-medium text-gray-700">অপশন:</span> {variantLabel}
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-[#15803d]">
                  ৳{unitPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-gray-500">
                  × {qty}
                </span>
                <span className="text-xs font-semibold text-gray-700 bg-gray-200/70 px-2 py-0.5 rounded-full ml-auto">
                  মোট: ৳{totalPrice.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Option 1: Order from WhatsApp */}
          <button
            type="button"
            onClick={handleWhatsAppOrder}
            className="w-full text-left group p-4 rounded-xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-500 to-[#25D366] hover:from-emerald-600 hover:to-[#20ba59] active:scale-[0.99] text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                {/* Official WhatsApp SVG Icon */}
                <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                  <path d="M12.031 0C5.385 0 .001 5.385.001 12.031c0 2.127.553 4.202 1.604 6.037L.055 24l6.106-1.597c1.782.955 3.774 1.458 5.868 1.458 6.645 0 12.029-5.385 12.029-12.031C24.059 5.384 18.676 0 12.031 0zm0 21.968c-1.802 0-3.535-.483-5.064-1.393l-.363-.215-3.766.984.998-3.668-.236-.375c-.997-1.583-1.523-3.411-1.523-5.27 0-5.59 4.549-10.14 10.138-10.14 5.59 0 10.14 4.549 10.14 10.14 0 5.591-4.55 10.14-10.14 10.14zm5.556-7.592c-.305-.152-1.805-.89-2.083-.992-.279-.101-.482-.152-.686.152-.204.304-.789.992-.967 1.194-.177.203-.355.228-.66.076-1.53-.761-2.617-1.39-3.634-2.684-.262-.335.263-.309.845-1.421.076-.152.038-.284-.038-.436-.076-.152-.686-1.65-.94-2.261-.247-.594-.499-.513-.686-.523-.177-.01-.38-.01-.584-.01-.203 0-.533.076-.812.381-.279.304-1.066 1.04-1.066 2.535 0 1.495 1.091 2.94 1.244 3.143.152.203 2.146 3.272 5.197 4.509 1.942.787 2.656.84 3.125.795.539-.052 1.805-.736 2.059-1.446.254-.71.254-1.319.177-1.446-.076-.127-.279-.203-.584-.355z" />
                </svg>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base tracking-wide">Order from WhatsApp</span>
                  <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded font-medium uppercase tracking-wider">
                    জনপ্রিয়
                  </span>
                </div>
                <p className="text-xs text-emerald-50 mt-0.5 leading-snug">
                  আমাদের হোয়াটসঅ্যাপে সরাসরি চ্যাট করে অর্ডার কনফার্ম করুন
                </p>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 shrink-0 text-white/80 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Option 2: Order Directly on Website */}
          <button
            type="button"
            onClick={handleDirectOrder}
            className="w-full text-left group p-4 rounded-xl border-2 border-blue-600/30 bg-gradient-to-r from-[#0066cc] to-[#083b66] hover:from-[#0052a3] hover:to-[#062c4d] active:scale-[0.99] text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base tracking-wide">Order Directly</span>
                  <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded font-medium uppercase tracking-wider">
                    ক্যাশ অন ডেলিভারি
                  </span>
                </div>
                <p className="text-xs text-blue-100 mt-0.5 leading-snug">
                  ওয়েবসাইটে সরাসরি নাম ও ঠিকানা দিয়ে অর্ডার সম্পন্ন করুন
                </p>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 shrink-0 text-white/80 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Bottom Trust Guarantee */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-4 text-[11px] text-gray-500">
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ১০০% নিরাপদ অর্ডার
          </span>
          <span className="text-gray-300">•</span>
          <span>সারা দেশে ক্যাশ অন ডেলিভারি</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
