'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  Check,
  CheckCircle2, 
  ChevronRight, 
  ChevronDown, 
  Truck, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Building2, 
  Tag, 
  ShieldCheck, 
  Lock, 
  RotateCcw, 
  ArrowLeft, 
  ArrowRight, 
  Copy, 
  CheckCheck, 
  ShoppingBag, 
  Loader2, 
  AlertCircle, 
  Clock, 
  Home, 
  Package,
  Sparkles
} from 'lucide-react';

// Mark this page as dynamic since it uses useSearchParams()
export const dynamic = 'force-dynamic';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, clearCart } = useCart();
  const items = cart?.items || [];
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [orderItems, setOrderItems] = useState([]);
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Confirmation
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [bkashNumber, setBkashNumber] = useState('01606069754');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    division: 'Dhaka',
    district: '',
    address: '',
    couponCode: '',
    paymentMethod: 'cod', // cod or bkash
    transactionId: '',
  });

  // Fetch store bKash number from public settings (cached)
  useEffect(() => {
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem('stellar_settings_cache') : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed?.bkash_number) {
          setBkashNumber(parsed.bkash_number);
          return;
        }
      } catch(e) {}
    }

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          try { sessionStorage.setItem('stellar_settings_cache', JSON.stringify(data.settings)); } catch(e) {}
          if (data.settings.bkash_number) {
            setBkashNumber(data.settings.bkash_number);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Handle Buy Now vs Cart source
  useEffect(() => {
    let isMounted = true;

    const handleBuyNowLogic = async () => {
      const buyNowProductId = searchParams.get('buyNow');
      const rawQty = searchParams.get('qty');
      const buyNowQty = rawQty ? Math.max(1, parseInt(rawQty, 10) || 1) : 1;
      const rawPrice = searchParams.get('price');
      const paramSku = searchParams.get('variantSku');
      const rawAttrs = searchParams.get('attrs');
      const source = searchParams.get('source');

      let sessionVariant = null;
      try {
        const stored = sessionStorage.getItem('vestro_buynow_variant') || sessionStorage.getItem('stellar_buynow_variant');
        if (stored) sessionVariant = JSON.parse(stored);
      } catch (e) {}

      let parsedAttrs = sessionVariant?.selectedAttributes || null;
      if (!parsedAttrs && rawAttrs) {
        try {
          parsedAttrs = JSON.parse(decodeURIComponent(rawAttrs));
        } catch (e) {}
      }

      if (buyNowProductId) {
        try {
          const res = await fetch(`/api/products/${encodeURIComponent(buyNowProductId)}`);
          const data = await res.json();
          if (isMounted && data?.product) {
            const p = data.product;

            // Safely parse attributes & variants
            let pAttrs = p.attributes;
            if (typeof pAttrs === 'string') {
              try { pAttrs = JSON.parse(pAttrs); } catch (e) { pAttrs = []; }
            }
            let pVars = p.variants;
            if (typeof pVars === 'string') {
              try { pVars = JSON.parse(pVars); } catch (e) { pVars = []; }
            }
            if (!Array.isArray(pAttrs)) pAttrs = [];
            if (!Array.isArray(pVars)) pVars = [];

            // If attributes were not provided in URL/session, but product has attributes, pre-select default
            if ((!parsedAttrs || Object.keys(parsedAttrs).length === 0) && pAttrs.length > 0) {
              const defaultAttrs = {};
              pAttrs.forEach(attr => {
                if (attr.name && Array.isArray(attr.values) && attr.values.length > 0) {
                  defaultAttrs[attr.name] = attr.values[0];
                }
              });
              if (Object.keys(defaultAttrs).length > 0) {
                parsedAttrs = defaultAttrs;
              }
            }

            // Find matching variant if available
            let matchedVariant = null;
            if (pVars.length > 0 && parsedAttrs) {
              matchedVariant = pVars.find(v => {
                const comb = v.combination || v.selectedAttributes || {};
                return Object.entries(parsedAttrs).every(([k, val]) => String(comb[k] || '').toLowerCase() === String(val || '').toLowerCase());
              });
            }

            const itemPrice = Number(
              sessionVariant?.variantPrice ||
              matchedVariant?.discountPrice ||
              matchedVariant?.price ||
              (rawPrice ? Number(rawPrice) : null) ||
              p.sellingPrice ||
              p.price ||
              p.selling_price ||
              0
            );

            const itemImage = sessionVariant?.variantImage || (matchedVariant?.images && matchedVariant.images[0]) || p.featuredImage || (Array.isArray(p.images) ? p.images[0] : (typeof p.images === 'string' && p.images.startsWith('http') ? p.images : p.image)) || '';
            const variantSku = sessionVariant?.variantSku || (paramSku ? decodeURIComponent(paramSku) : null) || matchedVariant?.sku || p.sku || null;
            const variantTitle = sessionVariant?.variantTitle || (parsedAttrs ? Object.entries(parsedAttrs).map(([k, v]) => `${k}: ${v}`).join(' • ') : null);

            setOrderItems([{
              ...p,
              _id: p.id || p._id,
              id: p.id || p._id,
              name: p.name || 'Product',
              price: itemPrice,
              sellingPrice: itemPrice,
              image: itemImage,
              quantity: buyNowQty,
              variantSku,
              selectedAttributes: parsedAttrs,
              variantTitle,
              availableAttributes: pAttrs,
              availableVariants: pVars,
            }]);
          }
        } catch (err) {
          console.error('[Checkout] Error fetching buy now product:', err);
        }
      } else if (source === 'cart' || (!buyNowProductId && items.length > 0)) {
        const flatItems = items.map(item => {
          const p = item.product || {};
          const itemPrice = Number(item.variantPrice || item.variantData?.variantPrice || p.sellingPrice || p.price || 0);
          const itemImage = item.variantImage || item.variantData?.variantImage || p.featuredImage || (Array.isArray(p.images) ? p.images[0] : (typeof p.images === 'string' && p.images.startsWith('http') ? p.images : p.image)) || '';
          return {
            ...p,
            _id: p.id || p._id,
            id: p.id || p._id,
            name: p.name || 'Product',
            price: itemPrice,
            sellingPrice: itemPrice,
            image: itemImage,
            quantity: Math.max(1, Number(item.quantity || 1)),
            variantSku: item.variantSku || item.variantData?.variantSku || null,
            selectedAttributes: item.variantData?.selectedAttributes || item.selectedAttributes || null,
            variantTitle: item.variantData?.variantTitle || null,
          };
        });
        if (isMounted) setOrderItems(flatItems);
      } else if (!buyNowProductId && items.length === 0) {
        router.push('/shop');
        return;
      }
      if (isMounted) setPageLoading(false);
    };

    if (!authLoading) {
      handleBuyNowLogic();
    }

    return () => {
      isMounted = false;
    };
  }, [authLoading, searchParams, items.length, router]);

  // Pre-fill form if user is logged in (guest checkout remains supported)
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || prev.fullName || '',
        email: user.email || prev.email || '',
        phone: user.phone || prev.phone || '',
      }));
    }
  }, [user]);

  const getShippingCost = () => {
    const dist = (formData.district || '').toLowerCase().trim();
    const div = (formData.division || '').toLowerCase().trim();

    if (!dist) {
      return div === 'dhaka' ? 60 : 120;
    }
    if (
      dist === 'dhaka' ||
      dist.includes('dhaka city') ||
      dist.includes('dhaka north') ||
      dist.includes('dhaka south') ||
      dist.includes('mirpur') ||
      dist.includes('gulshan') ||
      dist.includes('dhanmondi') ||
      dist.includes('uttara') ||
      dist.includes('banani') ||
      dist.includes('mohammadpur')
    ) {
      return 60;
    }
    if (
      dist.includes('dhaka') || 
      dist.includes('manikganj') || 
      dist.includes('manikgonj') ||
      dist.includes('gazipur') ||
      dist.includes('narayanganj')
    ) {
      return 80;
    }
    return 120;
  };

  const shippingCost = getShippingCost();
  const subtotal = orderItems.reduce((acc, item) => {
    const itemPrice = Number(item?.price || item?.sellingPrice || 0);
    const qty = Number(item?.quantity || 1);
    return acc + (itemPrice * qty);
  }, 0);
  const tax = 0;
  const total = Math.max(0, subtotal + shippingCost + tax - discount);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateShippingForm = () => {
    if (!formData.fullName.trim()) return 'Full name is required';
    if (!formData.phone.trim()) return 'Phone number is required';
    if (!formData.address.trim()) return 'Address is required';
    if (!formData.district.trim()) return 'District is required';
    return '';
  };

  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!formData.couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError('');
    
    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(formData.couponCode.trim())}&active=true`);
      const data = await res.json();
      
      if (!res.ok || !data.coupons || data.coupons.length === 0) {
        setCouponError('Invalid or expired coupon code');
        setDiscount(0);
        setIsApplyingCoupon(false);
        return;
      }

      const coupon = data.coupons[0];

      const minAmount = coupon.min_order_amount || coupon.minOrderAmount || 0;
      if (subtotal < minAmount) {
        setCouponError(`Minimum order amount for this coupon is ৳${minAmount}`);
        setDiscount(0);
        setIsApplyingCoupon(false);
        return;
      }

      let calculatedDiscount = 0;
      const discountType = coupon.discount_type || coupon.discountType || 'percentage';
      const discountValue = coupon.discount_value || coupon.discountValue || 0;

      if (discountType === 'percentage') {
        calculatedDiscount = Math.round(subtotal * (discountValue / 100));
      } else {
        calculatedDiscount = discountValue;
      }

      if (calculatedDiscount > subtotal) {
        calculatedDiscount = subtotal;
      }

      setDiscount(calculatedDiscount);
      setCouponError('');
    } catch (error) {
      console.error('Coupon fetch error:', error);
      setCouponError('Failed to verify coupon');
      setDiscount(0);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const copyToClipboard = (text, type = 'number') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'number') {
        setCopiedNumber(true);
        setTimeout(() => setCopiedNumber(false), 2500);
      } else if (type === 'order') {
        setCopiedOrderId(true);
        setTimeout(() => setCopiedOrderId(false), 2500);
      }
    }
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    const validationError = validateShippingForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep(2);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.transactionId.trim()) {
      setError('bKash Transaction ID (TrxID) is required to place your order');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const csrfToken = typeof document !== 'undefined'
        ? document.cookie.split('; ').find((row) => row.startsWith('csrf_token='))?.split('=')[1]
        : null;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          items: orderItems.map(item => ({
            id: item._id || item.id,
            productId: item._id || item.id,
            product: item._id || item.id,
            name: item.name,
            quantity: Math.max(1, Number(item.quantity || 1)),
            price: Number(item.price || item.sellingPrice || 0),
            image: item.image || item.featuredImage || (Array.isArray(item.images) ? item.images[0] : (typeof item.images === 'string' && item.images.startsWith('http') ? item.images : '')) || '',
            variantSku: item.variantSku || null,
            selectedAttributes: item.selectedAttributes || null,
            variantTitle: item.variantTitle || (item.selectedAttributes && typeof item.selectedAttributes === 'object' ? Object.entries(item.selectedAttributes).map(([k, v]) => `${k}: ${v}`).join(' • ') : null),
          })),
          shipping: formData,
          payment: {
            method: formData.paymentMethod,
            transactionId: formData.transactionId,
          },
          amounts: {
            subtotal,
            tax,
            shipping: shippingCost,
            discount,
            total,
          },
          couponCode: formData.couponCode,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setOrderId(data.order.orderNumber || data.order._id);
        clearCart();
        try {
          sessionStorage.removeItem('vestro_buynow_variant');
          sessionStorage.removeItem('stellar_buynow_variant');
        } catch (e) {}
        setStep(3);
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        setError(data.error || 'Failed to place order. Please try again.');
      }
    } catch (err) {
      console.error('[Checkout] Order error:', err);
      setError('A network error occurred while placing your order.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <p className="text-slate-600 text-sm font-medium">Preparing your secure checkout...</p>
      </div>
    );
  }

  if (orderItems.length === 0) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">No Items to Checkout</h1>
          <p className="text-slate-600 mb-6 text-sm">Your order list is empty. Add products to your cart to proceed with checkout.</p>
          <Link href="/shop" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm">
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/70 pb-28 sm:pb-16 text-neutral-800">
      
      {/* ── Top Header & Professional Stepper ── */}
      <div className="bg-black text-white border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>256-Bit SSL Encrypted & Protected</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                VESTRO WEAR HOUSE · CHECKOUT
              </h1>
            </div>

            <div className="flex items-center gap-3 text-xs text-neutral-300 bg-neutral-900 px-3.5 py-1.5 rounded-full border border-neutral-800 w-fit">
              <span className="flex items-center gap-1.5 text-white">
                <Truck className="w-3.5 h-3.5" /> Nationwide Delivery
              </span>
              <span className="w-1 h-1 bg-neutral-600 rounded-full" />
              <span className="flex items-center gap-1.5 text-neutral-300">
                <RotateCcw className="w-3.5 h-3.5" /> 7 Days Exchange
              </span>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="max-w-xl mx-auto relative pt-2">
            <div className="flex items-center justify-between relative">
              {/* Background connector line */}
              <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-neutral-800 -z-0" />
              <div 
                className="absolute top-1/2 left-8 -translate-y-1/2 h-0.5 bg-white transition-all duration-500 -z-0"
                style={{ 
                  width: step === 1 ? '0%' : step === 2 ? '50%' : 'calc(100% - 4rem)' 
                }}
              />

              {/* Step 1 Button */}
              <button 
                type="button"
                onClick={() => step === 2 && setStep(1)}
                disabled={step !== 2}
                className={`flex flex-col items-center gap-1.5 relative z-10 transition group ${step === 2 ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${
                  step > 1 
                    ? 'bg-white text-black' 
                    : step === 1 
                    ? 'bg-white text-black ring-4 ring-white/20 scale-105' 
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                }`}>
                  {step > 1 ? <Check className="w-5 h-5 stroke-[2.5]" /> : '1'}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${step >= 1 ? 'text-white' : 'text-neutral-400'}`}>
                  Shipping
                </span>
              </button>

              {/* Step 2 Button */}
              <div className="flex flex-col items-center gap-1.5 relative z-10">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${
                  step > 2 
                    ? 'bg-white text-black' 
                    : step === 2 
                    ? 'bg-white text-black ring-4 ring-white/20 scale-105' 
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                }`}>
                  {step > 2 ? <Check className="w-5 h-5 stroke-[2.5]" /> : '2'}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${step >= 2 ? 'text-white' : 'text-neutral-400'}`}>
                  Payment
                </span>
              </div>

              {/* Step 3 Indicator */}
              <div className="flex flex-col items-center gap-1.5 relative z-10">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${
                  step === 3 
                    ? 'bg-white text-black ring-4 ring-white/20 scale-105' 
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                }`}>
                  {step === 3 ? <Check className="w-5 h-5 stroke-[2.5]" /> : '3'}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${step === 3 ? 'text-white' : 'text-neutral-400'}`}>
                  Confirmed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Order Summary Accordion (Sticky on small screens) ── */}
      <div className="block lg:hidden bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-left focus:outline-none bg-white hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-semibold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <span>{mobileSummaryOpen ? 'Hide Order Summary' : 'Show Order Summary'}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${mobileSummaryOpen ? 'rotate-180' : ''}`} />
              </div>
              <span className="text-[11px] text-slate-500">
                {orderItems.reduce((sum, item) => sum + (item.quantity || 1), 0)} items in cart
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Total</span>
            <span className="text-base font-extrabold text-blue-600 font-mono">৳{total.toLocaleString()}</span>
          </div>
        </button>

        {mobileSummaryOpen && (
          <div className="px-4 py-4 bg-slate-50/90 border-t border-slate-100 space-y-3">
            {/* Products */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {orderItems.map((item) => {
                const img = item.image || item.featuredImage || (item.images && item.images[0]);
                const itemPrice = item.price || item.sellingPrice || 0;
                return (
                  <div key={item._id || item.id} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative flex-shrink-0">
                      {img ? (
                        <img src={img} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                      {item.selectedAttributes && typeof item.selectedAttributes === 'object' && Object.keys(item.selectedAttributes).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {Object.entries(item.selectedAttributes).map(([k, v]) => (
                            <span key={k} className="inline-block px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[9px] font-semibold rounded border border-blue-100">
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[11px] text-slate-500">Qty: {item.quantity} × ৳{itemPrice.toLocaleString()}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      ৳{(itemPrice * (item.quantity || 1)).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Calculations */}
            <div className="pt-2 border-t border-slate-200/80 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800 font-mono">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge {formData.district ? (shippingCost === 80 ? '(Dhaka/Nearby)' : '(Outside Dhaka)') : ''}</span>
                <span className="font-semibold text-slate-800 font-mono">৳{shippingCost}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span className="font-mono">-৳{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Amount</span>
                <span className="text-blue-600 font-mono">৳{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Layout (Form Column + Sticky Sidebar) ── */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* ── Left Column: Active Step Form ── */}
          <div className="lg:col-span-2">
            
            {/* ══════ STEP 1: SHIPPING DETAILS ══════ */}
            {step === 1 && (
              <form onSubmit={handleShippingSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-8">
                
                {/* Form Header */}
                <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-xs">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      Shipping Information
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Enter your address accurately to ensure fast doorstep delivery
                    </p>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50/90 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4 sm:space-y-5">
                  
                  {/* Full Name & Phone Number (1 col on mobile, 2 col on sm) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-sm transition placeholder:text-slate-400"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="01XXXXXXXXX"
                          className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-sm transition placeholder:text-slate-400 font-mono"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">We will call this number for delivery confirmation</p>
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Email Address {user ? '' : '(Optional)'}</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {user ? 'Auto-linked from account' : 'For order updates & invoice'}
                      </span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!!user}
                        placeholder="yourname@gmail.com (optional)"
                        className={`w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl text-sm transition ${
                          user ? 'bg-slate-50/80 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Division & District */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                        Division <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          name="division"
                          value={formData.division}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-10 py-2.5 sm:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-sm transition bg-white appearance-none cursor-pointer"
                          required
                        >
                          <option value="Dhaka">Dhaka (ঢাকা)</option>
                          <option value="Chittagong">Chattogram (চট্টগ্রাম)</option>
                          <option value="Sylhet">Sylhet (সিলেট)</option>
                          <option value="Khulna">Khulna (খুলনা)</option>
                          <option value="Rajshahi">Rajshahi (রাজশাহী)</option>
                          <option value="Barisal">Barisal (বরিশাল)</option>
                          <option value="Rangpur">Rangpur (রংপুর)</option>
                          <option value="Mymensingh">Mymensingh (ময়মনসিংহ)</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                        District / City <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          name="district"
                          value={formData.district}
                          onChange={handleInputChange}
                          placeholder="e.g. Dhaka, Manikganj, Gazipur"
                          className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-sm transition placeholder:text-slate-400"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Delivery Cost Indicator */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    shippingCost === 80 
                      ? 'bg-blue-50/70 border-blue-200/80 text-blue-900' 
                      : 'bg-purple-50/70 border-purple-200/80 text-purple-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Truck className={`w-4 h-4 ${shippingCost === 80 ? 'text-blue-600' : 'text-purple-600'}`} />
                      <span className="font-semibold">
                        {shippingCost === 80 ? 'Inside Dhaka Division' : 'Outside Dhaka (Nationwide)'}
                      </span>
                    </div>
                    <span className="font-bold text-xs bg-white px-2.5 py-1 rounded-md shadow-2xs border border-slate-200/60 font-mono">
                      ৳{shippingCost} Delivery Charge
                    </span>
                  </div>

                  {/* Full Delivery Address */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Full Delivery Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Home className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="House / Holding number, Road number, Area / Thana, Landmark (if any)"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-sm transition placeholder:text-slate-400 resize-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Coupon Code Input Box */}
                  <div className="pt-2">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Discount Coupon (Optional)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          name="couponCode"
                          value={formData.couponCode}
                          onChange={handleInputChange}
                          placeholder="Enter coupon code (e.g. VESTRO10)"
                          className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-sm uppercase tracking-wider font-semibold placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !formData.couponCode.trim()}
                        className="px-5 py-2.5 sm:py-3 bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-800 active:scale-[0.98] transition disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs"
                      >
                        {isApplyingCoupon ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Checking</span>
                          </>
                        ) : (
                          'Apply'
                        )}
                      </button>
                    </div>

                    {couponError && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {couponError}
                      </p>
                    )}
                    {discount > 0 && (
                      <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          Coupon code applied successfully!
                        </span>
                        <span className="font-bold font-mono bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-700">
                          -৳{discount.toLocaleString()} OFF
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Continue to Payment Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 group text-base"
                    >
                      <span>Proceed to Payment</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                </div>
              </form>
            )}

            {/* ══════ STEP 2: PAYMENT METHOD ══════ */}
            {step === 2 && (
              <form onSubmit={handlePaymentSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-8">
                
                {/* Form Header */}
                <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                        Choose Payment Method
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500">
                        Select how you want to complete payment for this order
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Edit Address
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50/90 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Payment Options Selection Cards */}
                <div className="space-y-3.5 mb-6">
                  
                  {/* Method 1: Cash On Delivery (COD) */}
                  <label 
                    className={`block p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.paymentMethod === 'cod'
                        ? 'border-blue-600 bg-blue-50/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 mt-1 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm sm:text-base">
                            Cash On Delivery (ক্যাশ অন ডেলিভারি)
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            Popular
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1">
                          Pay with cash to the delivery rider upon receiving your package at your doorstep.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Method 2: bKash Direct Full Payment */}
                  <label 
                    className={`block p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.paymentMethod === 'bkash'
                        ? 'border-pink-600 bg-pink-50/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bkash"
                        checked={formData.paymentMethod === 'bkash'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-pink-600 mt-1 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm sm:text-base">
                            bKash Full Payment (বিকাশ সম্পূর্ণ পেমেন্ট)
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800">
                            Express
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1">
                          Pay total amount (৳{total.toLocaleString()}) via bKash for priority dispatch and zero hassle.
                        </p>
                      </div>
                    </div>
                  </label>

                </div>

                {/* ── Instructions Box for COD (Advance Delivery Charge Verification) ── */}
                {formData.paymentMethod === 'cod' && (
                  <div className="mb-6 bg-gradient-to-br from-pink-50/70 via-rose-50/40 to-white border-2 border-pink-200/80 rounded-2xl p-4 sm:p-6 shadow-2xs">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-pink-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        ৳
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        বিকাশ সেন্ড মানি নির্দেশনা (Delivery Charge Verification)
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                      অর্ডারটি নিশ্চিত করতে ডেলিভারি চার্জ <strong className="text-pink-600 font-bold font-mono">৳{shippingCost}</strong> অগ্রিম সেন্ড মানি করুন। বাকি <strong className="text-slate-900 font-bold font-mono">৳{Math.max(0, subtotal - discount).toLocaleString()}</strong> পণ্য হাতে পেয়ে ডেলিভারি ম্যানকে ক্যাশ প্রদান করবেন।
                    </p>

                    {/* Prominent Number Card */}
                    <div className="bg-white border border-pink-200 rounded-xl p-3 sm:p-4 mb-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          bKash Personal Account
                        </span>
                        <span className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono tracking-wide">
                          {bkashNumber}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(bkashNumber, 'number')}
                        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                          copiedNumber 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-pink-600 hover:bg-pink-700 text-white active:scale-95'
                        }`}
                      >
                        {copiedNumber ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Number</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Step Guide */}
                    <div className="bg-pink-100/50 rounded-xl p-3 mb-4 text-xs text-slate-700 space-y-1">
                      <p>১. আপনার bKash App থেকে উপরে দেওয়া নম্বরে <strong>৳{shippingCost}</strong> 'Send Money' করুন।</p>
                      <p>২. সেন্ড মানি সফল হলে প্রাপ্ত ফিরতি SMS থেকে <strong>Transaction ID (TrxID)</strong> নিচের বক্সে লিখুন।</p>
                    </div>

                    {/* Transaction ID Input */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                        bKash Transaction ID (TrxID) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="transactionId"
                        value={formData.transactionId}
                        onChange={handleInputChange}
                        placeholder="যেমন: BL87AX90P"
                        className="w-full px-4 py-3 border-2 border-pink-300 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-600 outline-none text-sm font-mono uppercase tracking-wider font-bold transition placeholder:font-normal placeholder:text-slate-400 bg-white"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* ── Instructions Box for Full bKash Payment ── */}
                {formData.paymentMethod === 'bkash' && (
                  <div className="mb-6 bg-gradient-to-br from-pink-50/70 via-rose-50/40 to-white border-2 border-pink-200/80 rounded-2xl p-4 sm:p-6 shadow-2xs">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-pink-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        ৳
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        সম্পূর্ণ পেমেন্ট নির্দেশিকা (Full Payment Instructions)
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                      অর্ডারটি সম্পূর্ণ পেইড করতে সর্বমোট <strong className="text-pink-600 font-bold font-mono">৳{total.toLocaleString()}</strong> সেন্ড মানি করুন। ডেলিভারির সময় আপনাকে আর কোনো অতিরিক্ত চার্জ দিতে হবে না।
                    </p>

                    {/* Prominent Number Card */}
                    <div className="bg-white border border-pink-200 rounded-xl p-3 sm:p-4 mb-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          bKash Personal Account
                        </span>
                        <span className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono tracking-wide">
                          {bkashNumber}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(bkashNumber, 'number')}
                        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                          copiedNumber 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-pink-600 hover:bg-pink-700 text-white active:scale-95'
                        }`}
                      >
                        {copiedNumber ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Number</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Step Guide */}
                    <div className="bg-pink-100/50 rounded-xl p-3 mb-4 text-xs text-slate-700 space-y-1">
                      <p>১. আপনার bKash App থেকে উপরে দেওয়া নম্বরে <strong>৳{total.toLocaleString()}</strong> 'Send Money' করুন।</p>
                      <p>২. পেমেন্ট সম্পন্ন হলে প্রাপ্ত <strong>Transaction ID (TrxID)</strong> নিচের বক্সে লিখে অর্ডার কনফার্ম করুন।</p>
                    </div>

                    {/* Transaction ID Input */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                        bKash Transaction ID (TrxID) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="transactionId"
                        value={formData.transactionId}
                        onChange={handleInputChange}
                        placeholder="যেমন: BL87AX90P"
                        className="w-full px-4 py-3 border-2 border-pink-300 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-600 outline-none text-sm font-mono uppercase tracking-wider font-bold transition placeholder:font-normal placeholder:text-slate-400 bg-white"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Step 2 Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3.5 sm:py-4 px-5 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Shipping</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !formData.transactionId.trim()}
                    className="flex-1 py-3.5 sm:py-4 px-6 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:to-green-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg active:scale-[0.99] transition disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Placing Your Order...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Confirm & Place Order</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

            {/* ══════ STEP 3: ORDER CONFIRMATION ══════ */}
            {step === 3 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-10 text-center">
                
                {/* Celebration Icon */}
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-emerald-50/50 shadow-sm">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                  Order Placed Successfully! 🎉
                </h2>
                <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-6">
                  ধন্যবাদ! আপনার অর্ডারটি আমরা সফলভাবে গ্রহণ করেছি। খুব শীঘ্রই আমাদের প্রতিনিধি কল করে অর্ডার কনফার্ম করবেন।
                </p>

                {/* Order ID Pill */}
                <div className="inline-flex items-center gap-2.5 bg-slate-900 text-white px-5 py-2.5 rounded-full font-mono text-sm font-bold mb-8 shadow-xs">
                  <span>Order ID: #{orderId?.slice(-8)?.toUpperCase() || 'CONFIRMED'}</span>
                  <button 
                    type="button" 
                    onClick={() => copyToClipboard(orderId, 'order')}
                    className="hover:text-blue-400 transition"
                    title="Copy Order ID"
                  >
                    {copiedOrderId ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Estimated Delivery Timeline */}
                <div className="max-w-md mx-auto mb-8 bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 sm:p-5 text-left">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-sm mb-3">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Estimated Delivery Timeline</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span><strong>Dhaka Division:</strong> 2 - 3 business days</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span><strong>Outside Dhaka (Nationwide):</strong> 3 - 5 business days</span>
                    </li>
                  </ul>
                </div>

                {/* Order Summary Details */}
                <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 max-w-md mx-auto text-left text-xs sm:text-sm text-slate-700 space-y-2.5 border border-slate-200/80 mb-8">
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Shipping To:</span>
                    <span className="font-semibold text-slate-900 text-right max-w-[60%] truncate">
                      {formData.address}, {formData.district}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Contact Phone:</span>
                    <span className="font-semibold text-slate-900 font-mono">{formData.phone}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Payment Method:</span>
                    <span className="font-semibold text-slate-900">
                      {formData.paymentMethod === 'cod' ? 'Cash On Delivery' : 'bKash Mobile Payment'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction ID (TrxID):</span>
                    <span className="font-bold text-slate-900 font-mono">{formData.transactionId}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                  <Link 
                    href="/orders" 
                    className="flex-1 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md text-sm text-center"
                  >
                    View My Orders
                  </Link>
                  <Link 
                    href="/shop" 
                    className="flex-1 px-6 py-3.5 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl transition-colors text-sm text-center"
                  >
                    Continue Shopping
                  </Link>
                </div>

              </div>
            )}

          </div>

          {/* ── Right Column: Sticky Order Summary (Desktop) ── */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sticky top-6">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Order Summary</h3>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-600">
                  {orderItems.reduce((acc, it) => acc + (it.quantity || 1), 0)} items
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1 mb-5 divide-y divide-slate-100">
                {orderItems.map((item) => {
                  const img = item.image || item.featuredImage || (item.images && item.images[0]);
                  const itemPrice = item.price || item.sellingPrice || 0;
                  return (
                    <div key={item._id || item.id} className="pt-3.5 first:pt-0 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative flex-shrink-0">
                        {img ? (
                          <img src={img} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                          {item.name}
                        </p>
                        {item.selectedAttributes && typeof item.selectedAttributes === 'object' && Object.keys(item.selectedAttributes).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {Object.entries(item.selectedAttributes).map(([k, v]) => (
                              <span key={k} className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded border border-blue-100">
                                {k}: {v}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Qty: {item.quantity} × ৳{itemPrice.toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        ৳{(itemPrice * (item.quantity || 1)).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Financial Calculation */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs sm:text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900 font-mono">৳{subtotal.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>
                    Delivery Charge {formData.district ? (shippingCost === 80 ? '(Dhaka)' : '(Outside)') : ''}
                  </span>
                  <span className="font-semibold text-slate-900 font-mono">৳{shippingCost}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount Applied</span>
                    <span className="font-mono">-৳{discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="pt-3 border-t-2 border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">Total Payable</span>
                    <span className="text-[11px] text-slate-400">Inclusive of VAT & charges</span>
                  </div>
                  <span className="text-xl font-extrabold text-blue-600 font-mono">
                    ৳{total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Guarantees Box */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>100% Genuine & Verified Products</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Express Courier Dispatch in 24 Hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Easy 7 Days Return Policy</span>
                </div>
              </div>

              {/* Need Help Box */}
              <div className="mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">Need assistance?</span>
                  <span className="text-[11px] text-slate-500">Support helpline active</span>
                </div>
                <a 
                  href={`tel:${bkashNumber}`} 
                  className="font-bold text-blue-600 hover:text-blue-700 font-mono"
                >
                  {bkashNumber}
                </a>
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <p className="text-slate-600 text-sm font-medium">Loading checkout...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
