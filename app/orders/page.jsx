'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { 
  Package, 
  Loader2, 
  ShoppingBag, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Truck, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      fetchOrders();
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders', {
        credentials: 'include'
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch orders');
      }
      
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('[OrdersPage] Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[75vh] bg-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-black mb-3" />
        <p className="text-neutral-500 text-xs uppercase tracking-widest font-semibold">Loading orders...</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'confirmed':
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
      case 'processing':
        return 'bg-neutral-900 text-white border-neutral-900';
      case 'shipped':
        return 'bg-neutral-800 text-white border-neutral-800';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
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

  return (
    <div className="min-h-screen bg-white py-8 sm:py-12 pb-32 sm:pb-16 text-neutral-900">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8 pb-6 border-b border-neutral-200">
          <div>
            <span className="text-[11px] font-semibold tracking-[0.25em] text-neutral-400 uppercase block mb-1">
              Vestro Wear House
            </span>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-neutral-900">
                My Orders
              </h1>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Track delivery progress and view previous order invoices
            </p>
          </div>

          <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 bg-neutral-100 border border-neutral-200 rounded-full text-neutral-700 w-fit">
            {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} Total
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 p-12 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-neutral-900 mb-2">No Orders Found</h2>
            <p className="text-neutral-500 text-xs sm:text-sm mb-6">Looks like you haven't placed any orders yet.</p>
            <Link 
              href="/shop" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-neutral-800 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const orderId = order.orderNumber || order.id;
              const orderDate = new Date(order.createdAt || order.created_at || Date.now());
              const dateStr = orderDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
              const totalAmount = order.amounts?.total ?? order.total ?? 0;
              const itemsList = order.items || [];

              return (
                <div 
                  key={order.id || order.orderNumber} 
                  className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:border-black transition-colors"
                >
                  {/* Card Header Bar */}
                  <div className="bg-neutral-50 p-4 sm:p-5 border-b border-neutral-200 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                      <div>
                        <span className="text-neutral-400 block font-medium uppercase tracking-wider text-[10px]">Order Number</span>
                        <span className="font-bold text-neutral-900 font-mono text-sm">
                          #{orderId}
                        </span>
                      </div>

                      <div>
                        <span className="text-neutral-400 block font-medium uppercase tracking-wider text-[10px]">Date Placed</span>
                        <span className="font-semibold text-neutral-800">
                          {dateStr}
                        </span>
                      </div>

                      <div>
                        <span className="text-neutral-400 block font-medium uppercase tracking-wider text-[10px]">Total Amount</span>
                        <span className="font-bold text-neutral-900 font-mono text-sm">
                          ৳{totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>

                      <Link 
                        href={`/orders/${orderId}`} 
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track</span>
                      </Link>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="p-4 sm:p-5 divide-y divide-neutral-100 space-y-3">
                    {itemsList.map((item, idx) => {
                      const img = item.image || item.featuredImage || (item.images && item.images[0]);
                      const itemPrice = item.price || 0;
                      const itemQty = item.quantity || 1;
                      return (
                        <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-14 rounded bg-neutral-100 border border-neutral-200 overflow-hidden flex-shrink-0">
                              {img ? (
                                <img src={img} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                                  <Package className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-neutral-900 text-xs sm:text-sm uppercase tracking-tight truncate">
                                {item.name}
                              </h4>
                              {/* Selected Attributes & Variant */}
                              {(() => {
                                const attrList = resolveItemAttributes(item);
                                if (attrList.length === 0) return null;
                                return (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {attrList.map((a, i) => (
                                      <span key={i} className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                                        {a.key ? `${a.key}: ` : ''}{a.value}
                                      </span>
                                    ))}
                                  </div>
                                );
                              })()}
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Qty: {itemQty} × ৳{itemPrice.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <span className="font-bold text-neutral-900 font-mono text-xs sm:text-sm flex-shrink-0">
                            ৳{(itemPrice * itemQty).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}