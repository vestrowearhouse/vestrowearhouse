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
      <div className="min-h-[75vh] bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <p className="text-slate-600 text-sm font-medium">Loading your orders...</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'processing':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'shipped':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const resolveItemAttributes = (item) => {
    let attrs = item.selectedAttributes || item.attributes || item.variantData?.selectedAttributes;
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
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 pb-32 sm:pb-16 text-slate-800">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                <Package className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                My Orders
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Track delivery progress and view previous order invoices
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200/80 rounded-full text-slate-600 w-fit shadow-2xs">
            {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} Total
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No Orders Found</h2>
            <p className="text-slate-500 text-sm mb-6">Looks like you haven't placed any orders yet.</p>
            <Link 
              href="/shop" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const orderId = order.orderNumber || order.id;
              const orderDate = new Date(order.createdAt || order.created_at || Date.now());
              const dateStr = orderDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
              const totalAmount = order.amounts?.total ?? order.total ?? 0;
              const itemsList = order.items || [];

              return (
                <div 
                  key={order.id || order.orderNumber} 
                  className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden hover:border-slate-300 transition-all"
                >
                  {/* Card Header Bar */}
                  <div className="bg-slate-50/90 p-4 sm:p-5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Order Number</span>
                        <span className="font-extrabold text-slate-900 font-mono text-sm">
                          #{orderId}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block font-medium">Date Placed</span>
                        <span className="font-semibold text-slate-700">
                          {dateStr}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block font-medium">Total Amount</span>
                        <span className="font-bold text-blue-600 font-mono text-sm">
                          ৳{totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize shadow-2xs ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>

                      <Link 
                        href={`/orders/${orderId}`} 
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track Order</span>
                      </Link>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="p-4 sm:p-5 divide-y divide-slate-100 space-y-3">
                    {itemsList.map((item, idx) => {
                      const img = item.image || item.featuredImage || (item.images && item.images[0]);
                      const itemPrice = item.price || 0;
                      const itemQty = item.quantity || 1;
                      return (
                        <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                              {img ? (
                                <img src={img} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                                  <Package className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-slate-800 text-xs sm:text-sm truncate">
                                {item.name}
                              </h4>
                              {/* Selected Attributes & Variant */}
                              {(() => {
                                const attrList = resolveItemAttributes(item);
                                if (attrList.length === 0) return null;
                                return (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {attrList.map((a, i) => (
                                      <span key={i} className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                                        {a.key ? `${a.key}: ` : ''}{a.value}
                                      </span>
                                    ))}
                                  </div>
                                );
                              })()}
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Qty: {itemQty} × ৳{itemPrice.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm flex-shrink-0">
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