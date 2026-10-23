'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  Loader2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Star,
  Clock,
  CheckCircle2,
  Plus,
  Eye,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Tag,
  Truck,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles
} from 'lucide-react';

export default function VendorDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    processingOrders: 0,
    averageRating: 4.9,
    activeCoupons: 2,
    walletBalance: 0,
  });

  const [vendorInfo, setVendorInfo] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchDashboardData = async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      else setLoading(true);

      const [profileRes, ordersRes, productsRes, couponsRes] = await Promise.all([
        fetch('/api/vendor/profile', { credentials: 'include' }).catch(() => null),
        fetch('/api/vendor/orders?limit=6', { credentials: 'include' }).catch(() => null),
        fetch('/api/vendor/products', { credentials: 'include' }).catch(() => null),
        fetch('/api/vendor/coupons', { credentials: 'include' }).catch(() => null),
      ]);

      const profileData = profileRes && profileRes.ok ? await profileRes.json() : {};
      const ordersData = ordersRes && ordersRes.ok ? await ordersRes.json() : { orders: [] };
      const productsData = productsRes && productsRes.ok ? await productsRes.json() : { products: [] };
      const couponsData = couponsRes && couponsRes.ok ? await couponsRes.json() : { coupons: [] };

      const vendor = profileData.vendor || profileData.user || {};
      setVendorInfo(vendor);

      const allOrders = ordersData.orders || [];
      const pendingCount = allOrders.filter(o => o.vendor_status === 'pending').length;
      const deliveredCount = allOrders.filter(o => o.vendor_status === 'delivered').length;
      const processingCount = allOrders.filter(o => o.vendor_status === 'processing' || o.vendor_status === 'shipped').length;

      const calcRevenue = vendor.total_revenue || allOrders.reduce((sum, o) => sum + (parseFloat(o.total || o.subtotal) || 0), 0);

      const lowList = (productsData.products || []).filter(p => {
        const s = Number(p.stock || p.stockQuantity || 0);
        return s > 0 && s <= 5;
      });
      setLowStockProducts(lowList);

      setStats({
        products: productsData.products?.length || vendor.total_products || 0,
        orders: vendor.total_orders || allOrders.length || 0,
        totalRevenue: calcRevenue,
        pendingOrders: pendingCount,
        deliveredOrders: deliveredCount,
        processingOrders: processingCount,
        averageRating: vendor.average_rating || 4.9,
        activeCoupons: couponsData.coupons?.filter(c => c.status === 'active')?.length || 0,
        walletBalance: Math.max(0, calcRevenue * 0.9), // Net payout after platform commission
      });

      setRecentOrders(allOrders);
      setTopProducts((productsData.products || []).slice(0, 4));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Only poll when window is visible (saves database hits when tab is inactive)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchDashboardData(true);
    }, 60000);

    const onFocus = () => fetchDashboardData(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <h3 className="text-base font-bold text-gray-800">Loading Vendor Dashboard...</h3>
        <p className="text-xs text-gray-500">Retrieving real-time orders, store metrics, and catalog inventory.</p>
      </div>
    );
  }

  const storeName = vendorInfo?.shop_name || 'My Store';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome & Executive Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Store Online & Accepting Orders
            </span>
            {(vendorInfo?.verification_badge || vendorInfo?.is_verified) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Verified Merchant Partner
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>Welcome back, {storeName}!</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here is your live marketplace store performance summary for today, {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 active:scale-95 border border-gray-200 rounded-xl font-bold text-xs text-gray-700 transition-all flex items-center gap-2 disabled:opacity-50"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>

          <Link
            href="/vendor/products/add"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Low Stock Warning Alert Banner */}
      {lowStockProducts.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm shadow-amber-500/30">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950">
                ⚠️ Low Stock Alert: {lowStockProducts.length} {lowStockProducts.length === 1 ? 'Product is' : 'Products are'} Running Low!
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {lowStockProducts.map(p => `${p.name} (${p.stock || p.stockQuantity} left)`).slice(0, 3).join(', ')}
                {lowStockProducts.length > 3 ? ` and ${lowStockProducts.length - 3} more...` : ''}. Restock soon to prevent missed sales.
              </p>
            </div>
          </div>
          <Link
            href="/vendor/products"
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shrink-0 text-center shadow-sm shadow-amber-600/20"
          >
            Review & Restock
          </Link>
        </div>
      )}

      {/* 8 KPI Executive Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Revenue */}
        <Link href="/vendor/revenue" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-blue-200 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Sales</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
              ৳
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mt-3">
            ৳{Number(stats.totalRevenue).toLocaleString()}
          </h3>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Lifetime Gross Volume</span>
          </div>
        </Link>

        {/* Card 2: Wallet Payout */}
        <Link href="/vendor/revenue" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-blue-200 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Net Available Payout</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 mt-3">
            ৳{Number(stats.walletBalance).toLocaleString()}
          </h3>
          <div className="mt-2 text-xs text-gray-500 font-medium">
            Ready for withdrawal (Bkash/Bank)
          </div>
        </Link>

        {/* Card 3: Total Orders */}
        <Link href="/vendor/orders" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-blue-200 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Orders</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mt-3">
            {stats.orders}
          </h3>
          <div className="mt-2 text-xs text-blue-600 font-semibold flex items-center gap-1">
            <span>View all order history</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Card 4: Pending Fulfillment */}
        <Link href="/vendor/orders?status=pending" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-amber-200 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Orders</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-600 mt-3">
            {stats.pendingOrders}
          </h3>
          <div className="mt-2 text-xs text-amber-700 font-medium">
            Requires packing & courier handover
          </div>
        </Link>

        {/* Card 5: Active Catalog Products */}
        <Link href="/vendor/products" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-blue-200 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Products</span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mt-3">
            {stats.products}
          </h3>
          <div className="mt-2 text-xs text-gray-500 font-medium">
            Live catalog listings
          </div>
        </Link>

        {/* Card 6: Completed Deliveries */}
        <Link href="/vendor/orders?status=delivered" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Delivered</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-teal-600 mt-3">
            {stats.deliveredOrders}
          </h3>
          <div className="mt-2 text-xs text-teal-700 font-medium">
            Completed successful parcels
          </div>
        </Link>

        {/* Card 7: Active Coupons */}
        <Link href="/vendor/coupons" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Coupons</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mt-3">
            {stats.activeCoupons}
          </h3>
          <div className="mt-2 text-xs text-indigo-600 font-semibold flex items-center gap-1">
            <span>Manage discount codes</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Card 8: Customer Rating */}
        <Link href="/vendor/reviews" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-amber-200 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Store Rating</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-3">
            <h3 className="text-2xl font-black text-gray-900">{stats.averageRating}</h3>
            <span className="text-xs text-gray-400 font-semibold">/ 5.0</span>
          </div>
          <div className="mt-2 text-xs text-amber-700 font-medium">
            Excellent seller reputation
          </div>
        </Link>
      </div>

      {/* Quick Launchpad & Operational Tools */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-6 sm:p-7 rounded-3xl text-white shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-200 bg-white/10 px-3 py-1 rounded-full">
            Merchant Toolkit
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold mt-2 tracking-tight">
            Supercharge Your Marketplace Sales
          </h2>
          <p className="text-sm text-blue-100 mt-1 max-w-xl">
            Quickly add high-demand products, manage customer fulfillment, issue promo discounts, or customize your storefront branding.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/vendor/products/add"
            className="px-4 py-2.5 bg-white text-blue-800 hover:bg-blue-50 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Add Product</span>
          </Link>

          <Link
            href="/vendor/orders"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all border border-white/20 flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4 text-blue-200" />
            <span>Process Orders</span>
          </Link>

          <Link
            href="/vendor/coupons"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all border border-white/20 flex items-center gap-2"
          >
            <Tag className="w-4 h-4 text-amber-300" />
            <span>Create Promo</span>
          </Link>

          <Link
            href="/vendor/settings"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all border border-white/20 flex items-center gap-2"
          >
            <Truck className="w-4 h-4 text-emerald-300" />
            <span>Shipping Rates</span>
          </Link>
        </div>
      </div>

      {/* Main Content: Recent Orders (Left) + Top Selling / Quick Stats (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Recent Orders (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Recent Store Orders</h3>
              <p className="text-xs text-gray-500 mt-0.5">Latest customer orders dispatched or awaiting fulfillment.</p>
            </div>
            <Link
              href="/vendor/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-gray-800">No Orders Received Yet</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Once customers purchase your products on StellarMartBD, orders will appear here automatically in real time.
              </p>
              <Link
                href="/vendor/products/add"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publish More Products</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3.5 px-6">Order ID</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Items</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {recentOrders.map((order) => {
                    const status = order.vendor_status || order.status || 'pending';
                    return (
                      <tr key={order.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-gray-800">
                          #{String(order.id).slice(0, 8)}
                        </td>
                        <td className="py-4 px-4 text-gray-900 font-semibold">
                          {order.customer_name || order.shipping_address?.name || 'Customer'}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {Array.isArray(order.items) ? order.items.length : 1} item(s)
                        </td>
                        <td className="py-4 px-4 font-bold text-gray-900">
                          ৳{Number(order.total || order.subtotal || 0).toLocaleString()}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                            status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                              : status === 'shipped'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
                              : status === 'cancelled'
                              ? 'bg-red-50 text-red-700 border border-red-200/50'
                              : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link
                            href="/vendor/orders"
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg inline-flex items-center gap-1 font-bold text-xs"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Details</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Top Products & Store Health (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Top Products */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-gray-900">Featured Products</h3>
              <Link href="/vendor/products" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>

            {topProducts.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No products published yet.</p>
            ) : (
              <div className="space-y-3.5">
                {topProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                      {p.images && p.images[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{p.name}</h4>
                      <p className="text-[11px] text-gray-500 font-medium">Stock: {p.stock || p.stockQuantity || 0}</p>
                    </div>
                    <span className="text-xs font-black text-gray-900 shrink-0">
                      ৳{Number(p.price || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Store Health & Partner Overview */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">
            <h3 className="text-base font-extrabold text-gray-900">Merchant Status</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Marketplace Standing</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Good Standing (100%)
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Platform Commission</span>
                <span className="font-bold text-gray-800">10% Standard Rate</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Payout Cycle</span>
                <span className="font-bold text-gray-800">Weekly / On Request</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-gray-500 font-medium">Store Verification</span>
                <span className="font-bold text-blue-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Partner
                </span>
              </div>
            </div>

            <Link
              href="/vendor/support"
              className="mt-2 w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-gray-200"
            >
              <span>Need Help? Contact Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
