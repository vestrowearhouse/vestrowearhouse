'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '../context/CartContext';
import { useDebounceQuantityUpdate } from '../hooks/useDebounceQuantityUpdate';

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { updateQuantityWithDebounce, isLoading } = useDebounceQuantityUpdate(updateQuantity, 300);
  const items = cart?.items || [];
  const [whatsappPhone, setWhatsappPhone] = useState('8801345447500');

  useEffect(() => {
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem('stellar_wa_phone') : null;
    if (cached) {
      setWhatsappPhone(cached);
      return;
    }
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        const phone = data?.settings?.whatsapp || data?.settings?.support_phone || data?.settings?.phone || '8801345447500';
        const clean = phone.replace(/[^0-9]/g, '');
        const normalized = clean.startsWith('01') ? `88${clean}` : clean;
        if (typeof window !== 'undefined') sessionStorage.setItem('stellar_wa_phone', normalized);
        setWhatsappPhone(normalized || '8801345447500');
      })
      .catch(() => {});
  }, []);

  const subtotal = items.reduce((acc, item) => {
    const price = item.variantPrice || item.product?.sellingPrice || item.product?.price || 0;
    return acc + Number(price) * (item.quantity || 1);
  }, 0);
  
  const shipping = 0;
  const total = subtotal + shipping;

  const generateWhatsAppText = () => {
    let text = "Hello, I want to order the following items:\n\n";
    items.forEach(item => {
      const product = item.product;
      if (product) {
        text += `- ${product.name} (Qty: ${item.quantity})\n`;
      }
    });
    text += `\nTotal: ৳${total.toLocaleString()}`;
    return encodeURIComponent(text);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-[#f8fafc] z-[70] shadow-2xl flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-white shadow-sm z-10">
          <h1 className="text-[22px] font-bold text-gray-800 m-0 flex items-center gap-2">
            🛒 Your Cart
          </h1>
          {items.length > 0 && (
            <button onClick={clearCart} className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors mr-2 ml-auto">
              Clear All
            </button>
          )}
          <button 
            onClick={onClose}
            aria-label="Close cart"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cart Items Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-lg font-semibold">Your cart is empty</p>
            </div>
          ) : (
            items.map((item, index) => {
              const product = item.product;
              if (!product) return null;
              
              const productId = product._id || product.id || item.productId || item.id;
              const variantSku = item.variantSku || item.variantData?.variantSku || null;
              const itemKey = `${productId}-${variantSku || index}`;
              const price = item.variantPrice || product.sellingPrice || product.price || 0;
              const image = item.variantData?.variantImage || product.featuredImage || (product.images && product.images[0]) || product.image || '/placeholder.png';

              return (
              <div key={itemKey} className="flex items-center bg-white p-[15px] rounded-[12px] mb-[15px] shadow-[0_5px_15px_rgba(0,0,0,0.08)]">
                <div className="w-[80px] h-[80px] relative flex-shrink-0 mr-[15px]">
                  <Image 
                    src={image} 
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover rounded-[10px]"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-[14px] leading-tight line-clamp-2 pr-2">{product.name}</h3>
                  {(item.variantData?.selectedAttributes || item.selectedAttributes) && (
                    <div className="flex flex-wrap gap-1 mt-1 mb-1">
                      {Object.entries(item.variantData?.selectedAttributes || item.selectedAttributes).map(([k, v]) => (
                        <span key={k} className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[#2ed573] font-bold mt-1">৳ {Number(price).toLocaleString()}</p>
                </div>

                <div className="flex gap-[8px] items-center">
                  <button 
                    onClick={() => updateQuantityWithDebounce(productId, item.quantity - 1, variantSku)}
                    className="px-[10px] py-[4px] bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded text-gray-700 font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={item.quantity <= 1 || isLoading(productId, variantSku)}
                  >
                    -
                  </button>
                  <span className="font-bold w-4 text-center text-sm">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantityWithDebounce(productId, item.quantity + 1, variantSku)}
                    className="px-[10px] py-[4px] bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded text-gray-700 font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading(productId, variantSku)}
                  >
                    +
                  </button>
                </div>

                <button 
                  onClick={() => removeFromCart(productId, variantSku)}
                  className="ml-[15px] text-red-500 hover:text-red-700 font-medium text-[13px] bg-transparent border-none cursor-pointer transition-colors"
                >
                  Remove
                </button>
              </div>
            )})
          )}
        </div>

        {/* Summary Section */}
        {items.length > 0 && (
          <div className="bg-white p-[20px] rounded-t-[20px] shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-10">
            <div className="flex justify-between mb-[10px] text-gray-600 font-medium text-sm">
              <span>Subtotal</span>
              <span>৳ {subtotal.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between mb-[15px] font-bold text-[18px] text-gray-900 border-t border-gray-100 pt-3 mt-3">
              <span>Total</span>
              <span className="text-[#2ed573]">৳ {total.toLocaleString()}</span>
            </div>

            <a 
              href={`https://wa.me/${whatsappPhone}?text=${generateWhatsAppText()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full p-[14px] mb-[10px] bg-[#25D366] text-white text-center border-none rounded-[10px] cursor-pointer hover:bg-[#1ebd5b] transition-colors font-bold text-[15px] shadow-md shadow-green-500/30 gap-2"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 .001 5.385.001 12.031c0 2.127.553 4.202 1.604 6.037L.055 24l6.106-1.597c1.782.955 3.774 1.458 5.868 1.458 6.645 0 12.029-5.385 12.029-12.031C24.059 5.384 18.676 0 12.031 0zm0 21.968c-1.802 0-3.535-.483-5.064-1.393l-.363-.215-3.766.984.998-3.668-.236-.375c-.997-1.583-1.523-3.411-1.523-5.27 0-5.59 4.549-10.14 10.138-10.14 5.59 0 10.14 4.549 10.14 10.14 0 5.591-4.55 10.14-10.14 10.14zm5.556-7.592c-.305-.152-1.805-.89-2.083-.992-.279-.101-.482-.152-.686.152-.204.304-.789.992-.967 1.194-.177.203-.355.228-.66.076-1.53-.761-2.617-1.39-3.634-2.684-.262-.335.263-.309.845-1.421.076-.152.038-.284-.038-.436-.076-.152-.686-1.65-.94-2.261-.247-.594-.499-.513-.686-.523-.177-.01-.38-.01-.584-.01-.203 0-.533.076-.812.381-.279.304-1.066 1.04-1.066 2.535 0 1.495 1.091 2.94 1.244 3.143.152.203 2.146 3.272 5.197 4.509 1.942.787 2.656.84 3.125.795.539-.052 1.805-.736 2.059-1.446.254-.71.254-1.319.177-1.446-.076-.127-.279-.203-.584-.355z"/></svg>
              Order via WhatsApp
            </a>
            <Link 
              href="/checkout?source=cart"
              onClick={onClose}
              className="block w-full p-[14px] bg-[#2ed573] text-white text-center border-none rounded-[10px] cursor-pointer hover:bg-[#20bf6b] transition-colors font-bold text-[15px] shadow-md shadow-green-500/30"
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
