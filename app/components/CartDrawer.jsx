'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '../context/CartContext';
import { useDebounceQuantityUpdate } from '../hooks/useDebounceQuantityUpdate';

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { updateQuantityWithDebounce, isLoading } = useDebounceQuantityUpdate(updateQuantity, 300);
  const items = cart?.items || [];
  const [whatsappPhone, setWhatsappPhone] = useState('8801345447500');

  useEffect(() => {
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem('vestro_wa_phone') : null;
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
        if (typeof window !== 'undefined') sessionStorage.setItem('vestro_wa_phone', normalized);
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
    let text = "Hello Vestro Wear House, I want to order:\n\n";
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
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 z-10 bg-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-neutral-900" />
            <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-neutral-900 m-0">
              Shopping Bag ({items.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button 
                onClick={clearCart} 
                className="text-xs font-semibold text-neutral-500 hover:text-black transition-colors uppercase tracking-wider"
              >
                Clear
              </button>
            )}
            <button 
              onClick={onClose}
              aria-label="Close cart"
              className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors text-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Items Area */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-neutral-100">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400 py-12">
              <ShoppingBag className="w-16 h-16 stroke-1 mb-4 text-neutral-300" />
              <p className="text-sm font-semibold tracking-wider uppercase text-neutral-900 mb-1">Your bag is empty</p>
              <p className="text-xs text-neutral-500 mb-6">Discover the new fashion collection</p>
              <Link
                href="/shop"
                onClick={onClose}
                className="px-6 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-black transition-colors"
              >
                Explore Collection
              </Link>
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
              <div key={itemKey} className="flex gap-4 py-4 items-start">
                {/* Product Image (Aspect 3/4) */}
                <div className="w-20 h-24 relative flex-shrink-0 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200">
                  <Image 
                    src={image} 
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                  <div>
                    <h3 className="font-bold text-neutral-900 text-xs sm:text-sm leading-tight line-clamp-2 pr-2">{product.name}</h3>
                    {(item.variantData?.selectedAttributes || item.selectedAttributes) && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.entries(item.variantData?.selectedAttributes || item.selectedAttributes).map(([k, v]) => (
                          <span key={k} className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-800 uppercase tracking-wider">
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-neutral-900 font-extrabold text-sm mt-1">৳{Number(price).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {/* Stepper */}
                    <div className="flex items-center border border-neutral-300 rounded overflow-hidden">
                      <button 
                        onClick={() => updateQuantityWithDebounce(productId, item.quantity - 1, variantSku)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-neutral-100 text-neutral-700 font-bold transition-colors cursor-pointer disabled:opacity-40"
                        disabled={item.quantity <= 1 || isLoading(productId, variantSku)}
                      >
                        -
                      </button>
                      <span className="w-7 text-center font-bold text-xs">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantityWithDebounce(productId, item.quantity + 1, variantSku)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-neutral-100 text-neutral-700 font-bold transition-colors cursor-pointer"
                        disabled={isLoading(productId, variantSku)}
                      >
                        +
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(productId, variantSku)}
                      className="text-neutral-400 hover:text-black p-1 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )})
          )}
        </div>

        {/* Summary Section */}
        {items.length > 0 && (
          <div className="bg-white p-5 border-t border-neutral-200 z-10 space-y-3">
            <div className="flex justify-between text-neutral-600 text-xs uppercase tracking-wider">
              <span>Subtotal</span>
              <span className="font-bold text-neutral-900">৳{subtotal.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-baseline font-black text-base text-neutral-900 border-t border-neutral-100 pt-2">
              <span className="uppercase tracking-widest text-xs font-bold text-neutral-500">Total</span>
              <span className="text-xl">৳{total.toLocaleString()}</span>
            </div>

            <Link 
              href="/checkout?source=cart"
              onClick={onClose}
              className="block w-full py-3.5 bg-neutral-900 hover:bg-black text-white text-center rounded-xl transition-all font-bold text-xs uppercase tracking-[0.18em] shadow-sm"
            >
              Checkout Now
            </Link>

            <a 
              href={`https://wa.me/${whatsappPhone}?text=${generateWhatsAppText()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full py-2.5 border border-neutral-300 text-neutral-800 hover:border-black rounded-xl transition-colors font-bold text-xs uppercase tracking-wider gap-2"
            >
              Order via WhatsApp
            </a>
          </div>
        )}
      </div>
    </>
  );
}
