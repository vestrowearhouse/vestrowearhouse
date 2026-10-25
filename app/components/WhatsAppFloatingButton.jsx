'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function WhatsAppFloatingButton() {
  const pathname = usePathname();

  // Don't clutter checkout or order tracking pages
  if (pathname === '/checkout' || pathname?.startsWith('/orders/')) {
    return null;
  }

  const phoneNumber = '+880 1345-447500';
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  const message = encodeURIComponent('Hello StellarMartBD, I want to inquire about a product.');
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;

  return (
    <div className="fixed bottom-[140px] md:bottom-24 right-4 md:right-6 z-40 flex items-center group">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_25px_rgba(37,211,102,0.6)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
      >
        {/* Pulsing ring animation */}
        <span className="absolute -inset-0.5 rounded-full bg-[#25D366]/30 animate-ping pointer-events-none" />

        {/* WhatsApp Icon from user */}
        <div className="relative w-full h-full p-1 z-10 flex items-center justify-center">
          <Image
            src="/whatsapp-icon.png"
            alt="WhatsApp"
            width={56}
            height={56}
            className="w-full h-full object-contain rounded-full"
            priority
          />
        </div>

        {/* Online Indicator Badge */}
        <span className="absolute top-0 right-0 w-3 h-3 md:w-3.5 md:h-3.5 bg-emerald-400 border-2 border-white rounded-full z-20" />
      </a>

      {/* Tooltip on Hover (Facing Left towards page content) */}
      <span className="hidden md:block absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        WhatsApp-এ কথা বলুন 💬
      </span>
    </div>
  );
}
