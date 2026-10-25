'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Loader2, 
  ArrowLeft, 
  ShoppingBag, 
  CreditCard, 
  ShieldCheck, 
  Calendar, 
  Phone, 
  Mail, 
  User, 
  Copy, 
  CheckCheck, 
  Printer, 
  MessageSquare, 
  Tag, 
  Home, 
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function OrderTrackingPage({ params }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedTrxId, setCopiedTrxId] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        if (!res.ok) {
          if (res.status === 401) router.push('/login');
          if (res.status === 404) router.push('/orders');
          throw new Error('Failed to fetch order');
        }
        const data = await res.json();
        setOrder(data.order);
      } catch (error) {
        console.error('Fetch order error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [params.id, router]);

  const copyToClipboard = (text, type = 'order') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && text) {
      navigator.clipboard.writeText(text);
      if (type === 'order') {
        setCopiedOrderId(true);
        setTimeout(() => setCopiedOrderId(false), 2500);
      } else if (type === 'trx') {
        setCopiedTrxId(true);
        setTimeout(() => setCopiedTrxId(false), 2500);
      }
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <p className="text-slate-600 text-sm font-medium">Fetching real-time tracking updates...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
          <p className="text-slate-600 text-sm mb-6">We couldn't locate the order details. Please verify your order number.</p>
          <Link href="/orders" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition">
            <ArrowLeft className="w-4 h-4" /> Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const statuses = [
    { key: 'pending', label: 'Order Placed', icon: Clock, desc: 'We have received your order request' },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, desc: 'Order verified by StellarMart team' },
    { key: 'processing', label: 'Processing & Packed', icon: Package, desc: 'Items inspected and packed safely' },
    { key: 'shipped', label: 'Handed to Courier', icon: Truck, desc: 'Rider is en route to your address' },
    { key: 'delivered', label: 'Delivered', icon: MapPin, desc: 'Successfully delivered to your doorstep' },
  ];

  const currentStatusIndex = statuses.findIndex(s => s.key === order.status);
  const isCancelled = order.status === 'cancelled';

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending Verification' };
      case 'confirmed':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Order Confirmed' };
      case 'processing':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Packaging in Progress' };
      case 'shipped':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Out for Delivery' };
      case 'delivered':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Delivered' };
      case 'cancelled':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Order Cancelled' };
      default:
        return { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: status || 'Pending' };
    }
  };

  const resolveItemAttributes = (item) => {
    let attrs = item.selectedAttributes || item.attributes || item.variantData?.selectedAttributes || item.selected_attributes;
    if (typeof attrs === 'string') {
      try {
        attrs = JSON.parse(attrs);
      } catch (e) {
        attrs = null;
      }
    }
    if (attrs && typeof attrs === 'object' && Object.keys(attrs).length > 0) {
      return Object.entries(attrs).map(([k, v]) => ({ key: k, value: String(v) }));
    }
    if (item.variantTitle && typeof item.variantTitle === 'string') {
      if (item.variantTitle.includes('•') || item.variantTitle.includes(',')) {
        const parts = item.variantTitle.split(/[•,]/).map(s => s.trim()).filter(Boolean);
        return parts.map(part => {
          if (part.includes(':')) {
            const [k, ...v] = part.split(':');
            return { key: k.trim(), value: v.join(':').trim() };
          }
          return { key: '', value: part };
        });
      }
      return [{ key: '', value: item.variantTitle }];
    }
    // Fallback: parse from variantSku (e.g. stm-0001-xl-blue)
    if (item.variantSku && typeof item.variantSku === 'string' && item.variantSku.includes('-')) {
      const parts = item.variantSku.split('-');
      if (parts.length >= 4) {
        return [
          { key: 'Size', value: parts[2].toUpperCase() },
          { key: 'Color', value: parts[3].charAt(0).toUpperCase() + parts[3].slice(1) }
        ];
      }
      if (parts.length === 3) {
        return [
          { key: 'Option', value: parts[2].toUpperCase() }
        ];
      }
    }
    return [];
  };

  const statusBadge = getStatusBadge(order.status);
  const shippingInfo = order.shipping_address || {};
  const orderDate = new Date(order.createdAt || order.created_at || Date.now());
  const formattedDate = orderDate.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
  const formattedTime = orderDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });

  const subtotal = order.amounts?.subtotal ?? order.subtotal ?? 0;
  const shippingCost = order.amounts?.shipping ?? order.shipping_cost ?? 0;
  const discount = order.discount ?? 0;
  const total = order.amounts?.total ?? order.total ?? 0;

  return (
    <div className="min-h-screen bg-slate-50/70 pb-32 sm:pb-16 text-slate-800">
      
      {/* ── Navigation Top Bar ── */}
      <div className="max-w-5xl mx-auto px-4 pt-6 sm:pt-8 pb-4">
        <div className="flex items-center justify-between gap-4">
          <Link 
            href="/orders" 
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>

            <a
              href={`https://wa.me/8801345447500?text=${encodeURIComponent(`Hi StellarMart, I have a question regarding my order #${order.orderNumber || order.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Help</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 space-y-6">
        
        {/* ── Header Hero Card with Order Metadata & Status ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-Time Order Tracking</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight font-mono text-white">
                    #{order.orderNumber || order.id}
                  </h1>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(order.orderNumber || order.id, 'order')}
                    className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800/80"
                    title="Copy Order ID"
                  >
                    {copiedOrderId ? (
                      <CheckCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Placed on {formattedDate} at {formattedTime}</span>
                </p>
              </div>

              {/* Status Pill on Header */}
              <div className="flex flex-col sm:items-end gap-1.5">
                <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Current Status
                </span>
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold border shadow-xs ${statusBadge.bg}`}>
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {statusBadge.label}
                </span>
              </div>
            </div>
          </div>

          {/* ── Cancelled Order State Banner ── */}
          {isCancelled ? (
            <div className="p-6 sm:p-8 bg-rose-50/50 text-center">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">This order was cancelled</h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mb-4">
                If this was a mistake or you have any questions, please contact our support team immediately.
              </p>
              <div className="flex justify-center gap-3">
                <a 
                  href="tel:+8801606069754" 
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                >
                  Call Support (+880 1606-069754)
                </a>
              </div>
            </div>
          ) : (
            /* ── Progress Stepper / Tracking Timeline ── */
            <div className="p-5 sm:p-8 border-t border-slate-100">
              
              {/* Delivery ETA Notice Banner */}
              <div className="mb-8 p-3.5 sm:p-4 rounded-xl bg-blue-50/70 border border-blue-200/70 flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm text-blue-900">
                <div className="flex items-center gap-2.5 font-medium">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span>
                    <strong>Estimated Arrival:</strong> 2 - 3 days (Dhaka) / 3 - 5 days (Nationwide)
                  </span>
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-white px-2.5 py-1 rounded-md border border-blue-200/80 font-mono shadow-2xs">
                  Cash On Delivery
                </span>
              </div>

              {/* Desktop Horizontal Stepper (md:block) */}
              <div className="hidden md:block relative pt-2 pb-4">
                {/* Background Connecting Line */}
                <div className="absolute top-8 left-10 right-10 -translate-y-1/2 h-1 bg-slate-200 rounded-full z-0" />
                {/* Active Progress Line */}
                <div
                  className="absolute top-8 left-10 -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-700"
                  style={{
                    width: currentStatusIndex >= 0 
                      ? `${(currentStatusIndex / (statuses.length - 1)) * 100}%` 
                      : '0%'
                  }}
                />

                <div className="flex justify-between items-start relative z-10">
                  {statuses.map((s, idx) => {
                    const isCompleted = idx <= currentStatusIndex;
                    const isCurrent = idx === currentStatusIndex;
                    const Icon = s.icon;
                    return (
                      <div key={s.key} className="flex flex-col items-center text-center max-w-[140px]">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                          isCurrent 
                            ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 scale-110' 
                            : isCompleted 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          {isCompleted && !isCurrent ? (
                            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>

                        <h4 className={`text-xs sm:text-sm font-bold mt-3 ${
                          isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                        }`}>
                          {s.label}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                          {s.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Vertical Stepper (block md:hidden) */}
              <div className="block md:hidden relative pl-2 py-1">
                <div className="space-y-6 relative">
                  {statuses.map((s, idx) => {
                    const isCompleted = idx <= currentStatusIndex;
                    const isCurrent = idx === currentStatusIndex;
                    const isLast = idx === statuses.length - 1;
                    const Icon = s.icon;

                    return (
                      <div key={s.key} className="flex items-start gap-4 relative">
                        {/* Vertical line connecting nodes */}
                        {!isLast && (
                          <div 
                            className={`absolute left-5 top-10 bottom-[-1.5rem] w-0.5 ${
                              idx < currentStatusIndex ? 'bg-blue-600' : 'bg-slate-200'
                            }`} 
                          />
                        )}

                        {/* Node icon circle */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 transition-all shadow-xs ${
                          isCurrent 
                            ? 'bg-blue-600 text-white ring-4 ring-blue-500/25 scale-105' 
                            : isCompleted 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          {isCompleted && !isCurrent ? (
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>

                        {/* Node details */}
                        <div className="pt-1 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-xs sm:text-sm font-bold ${
                              isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                            }`}>
                              {s.label}
                            </h4>
                            {isCurrent && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {s.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ── Order Breakdown Grid (Items on Left, Shipping & Payment on Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column (2 Cols): Items List */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Order Items
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-600">
                  {order.items?.length || 0} Products
                </span>
              </div>

              <div className="divide-y divide-slate-100 space-y-3.5">
                {order.items?.map((item, idx) => {
                  const img = item.image || item.featuredImage || (item.images && item.images[0]);
                  const itemPrice = item.price || 0;
                  const itemQty = item.quantity || 1;
                  return (
                    <div key={idx} className="pt-3.5 first:pt-0 flex items-center gap-3.5 sm:gap-4 group">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative flex-shrink-0">
                        {img ? (
                          <img 
                            src={img} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                          {itemQty}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </h4>
                        {/* Selected Attributes & Variant */}
                        {(() => {
                          const attrList = resolveItemAttributes(item);
                          if (!attrList || attrList.length === 0) return null;
                          return (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {attrList.map((a, i) => (
                                <span
                                  key={i}
                                  className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
                                >
                                  {a.key ? `${a.key}: ` : ''}{a.value}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                        <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                          Price: ৳{itemPrice.toLocaleString()} × {itemQty}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono block">
                          ৳{(itemPrice * itemQty).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Need Help Banner Card */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Need help with this order?</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Our customer support hotline is available 24/7 for delivery inquiries or address changes.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <a
                  href="tel:+8801345447500"
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Call Support</span>
                </a>
                <a
                  href={`https://wa.me/8801345447500?text=${encodeURIComponent(`Hello, I need help with my order #${order.orderNumber || order.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

          </div>

          {/* Right Column (1 Col): Address & Summary Cards */}
          <div className="space-y-6">
            
            {/* Delivery Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6">
              <div className="flex items-center gap-2.5 pb-3.5 mb-4 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Delivery Destination
                </h3>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {shippingInfo.fullName || 'Recipient'}
                    </span>
                    <span className="text-xs text-slate-500">Customer Name</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <a 
                      href={`tel:${shippingInfo.phone}`} 
                      className="font-bold text-blue-600 hover:underline font-mono"
                    >
                      {shippingInfo.phone || 'N/A'}
                    </a>
                    <span className="text-xs text-slate-500 block">Contact Phone</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Home className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-800 leading-snug">
                      {shippingInfo.address || 'Address provided during checkout'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {[shippingInfo.district, shippingInfo.division].filter(Boolean).join(', ') || 'Bangladesh'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Calculation & Payment Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6">
              <div className="flex items-center gap-2.5 pb-3.5 mb-4 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Payment Summary
                </h3>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Payment Method</span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {order.payment_method === 'bkash' ? 'bKash Mobile Payment' : 'Cash On Delivery'}
                  </span>
                </div>

                {/* TrxID if exists */}
                {shippingInfo.transactionId && (
                  <div className="flex justify-between items-center py-1.5 px-2.5 bg-pink-50/70 border border-pink-200/70 rounded-xl">
                    <span className="text-[11px] font-semibold text-pink-900">TrxID:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-pink-700">
                        {shippingInfo.transactionId}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(shippingInfo.transactionId, 'trx')}
                        className="text-pink-600 hover:text-pink-800"
                        title="Copy TrxID"
                      >
                        {copiedTrxId ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-800 font-mono">৳{subtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Shipping Fee</span>
                    <span className="font-semibold text-slate-800 font-mono">৳{shippingCost.toLocaleString()}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                      </span>
                      <span className="font-mono">-৳{discount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="pt-2.5 border-t-2 border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">Total Amount</span>
                      <span className="text-[10px] text-slate-400">All taxes & fees included</span>
                    </div>
                    <span className="text-lg sm:text-xl font-extrabold text-blue-600 font-mono">
                      ৳{total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Trust Badges */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs text-slate-500 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>100% Genuine & Checked Products</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Express Courier Dispatch in 24 Hours</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
