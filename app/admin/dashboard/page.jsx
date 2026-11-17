'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  Users,
  Package,
  ShoppingCart, 
  Image,
  CreditCard,
  Loader2,
  AlertCircle,
  RefreshCw,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const DashboardSkeleton = () => (
  <div className="animate-pulse">
    {/* STATS */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gray-100" />
            <div className="w-12 h-4 bg-gray-100 rounded" />
          </div>
          <p className="bg-gray-100 rounded w-24 h-4"></p>
          <h2 className="bg-gray-100 rounded w-16 h-8 mt-2"></h2>
        </div>
      ))}
    </div>

    {/* ANALYTICS */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
      {/* SALES CHART */}
      <div className="xl:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="bg-gray-100 rounded w-40 h-7"></h2>
            <p className="bg-gray-100 rounded mt-2 w-56 h-4"></p>
          </div>
          <div className="w-16 h-8 bg-gray-100 rounded-full" />
        </div>
        <div className="h-[350px] rounded-lg border border-gray-100 bg-gray-50/50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
        </div>
      </div>

      {/* PIE CHART */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <div className="mb-6">
          <h2 className="bg-gray-100 rounded w-36 h-7"></h2>
          <p className="bg-gray-100 rounded mt-2 w-52 h-4"></p>
        </div>
        <div className="h-[280px] rounded-lg border border-gray-100 bg-gray-50/50 flex items-center justify-center">
          <div className="w-36 h-36 rounded-full border-8 border-gray-100 border-t-blue-400 animate-spin" />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-100" />
              <span className="bg-gray-100 rounded w-20 h-4"></span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* BAR CHART */}
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="bg-gray-100 rounded w-44 h-7"></h2>
          <p className="bg-gray-100 rounded mt-2 w-48 h-4"></p>
        </div>
        <div className="bg-gray-100 rounded w-24 h-5"></div>
      </div>
      <div className="h-[320px] rounded-lg border border-gray-100 bg-gray-50/50 flex items-end justify-between px-6 py-4 gap-2">
        <div className="w-full bg-gray-100 rounded-t-md h-[40%]" />
        <div className="w-full bg-gray-100 rounded-t-md h-[65%]" />
        <div className="w-full bg-gray-100 rounded-t-md h-[50%]" />
        <div className="w-full bg-gray-100 rounded-t-md h-[80%]" />
        <div className="w-full bg-gray-100 rounded-t-md h-[30%]" />
        <div className="w-full bg-gray-100 rounded-t-md h-[95%]" />
        <div className="w-full bg-gray-100 rounded-t-md h-[60%]" />
      </div>
    </div>

    {/* BANNER STATUS */}
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="bg-gray-100 rounded w-32 h-7"></h2>
        <div className="bg-gray-100 rounded w-20 h-4"></div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gray-100" />
        <div>
          <p className="bg-gray-100 rounded w-28 h-4 mb-2"></p>
          <h3 className="bg-gray-100 rounded w-8 h-6"></h3>
        </div>
      </div>
    </div>

    {/* QUICK ACTIONS */}
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
      <h2 className="bg-gray-100 rounded w-36 h-7 mb-6"></h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="p-5 bg-gray-50/50 rounded-2xl h-[104px] flex flex-col items-center justify-center">
            <div className="w-8 h-8 bg-gray-100 rounded-full mb-3" />
            <div className="bg-gray-100 rounded w-20 h-4" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    categories: 0,
    orders: 0,
    banners: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [chartData, setChartData] = useState({
    sales: [],
    categories: [],
    weeklyOrders: [],
    salesGrowth: '0.0'
  });

  useEffect(() => {
    // 1. Load cached data for instant UI render
    try {
      const cachedStats = localStorage.getItem('adminDashboardStats');
      const cachedChartData = localStorage.getItem('adminDashboardChartData');
      if (cachedStats && cachedChartData) {
        setStats(JSON.parse(cachedStats));
        setChartData(JSON.parse(cachedChartData));
        setLoading(false); // Instant load!
      }
    } catch (e) {
      console.error('Failed to load dashboard cache', e);
    }

    fetchStats();

    // 2. Refresh every 60 seconds only when tab is active (prevents 5 parallel API calls while tab is hidden)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchStats();
    }, 60000);

    const onFocus = () => fetchStats();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const fetchStats = async () => {
    try {
      if (stats.users === 0 && stats.orders === 0 && !localStorage.getItem('adminDashboardStats')) {
        setLoading(true);
      }

      setIsRefreshing(true);

      const [
        usersRes,
        productsRes,
        categoriesRes,
        ordersRes,
        bannersRes,
      ] = await Promise.all([
        fetch('/api/users').catch(() => ({
          ok: false,
          json: () => ({ users: [] }),
        })),

        fetch('/api/products?limit=1000').catch(() => ({
          ok: false,
          json: () => ({ products: [], totalCount: 0 }),
        })),

        fetch('/api/categories').catch(() => ({
          ok: false,
          json: () => ({ categories: [] }),
        })),

        fetch('/api/admin/orders?limit=1000').catch(() => ({
          ok: false,
          json: () => ({ orders: [], total: 0 }),
        })),

        fetch('/api/banners?admin=true').catch(() => ({
          ok: false,
          json: () => ({ banners: [] }),
        })),
      ]);

      const usersData = usersRes.ok
        ? await usersRes.json()
        : { users: [] };

      const productsData = productsRes.ok
        ? await productsRes.json()
        : { products: [], totalCount: 0 };

      const categoriesData = categoriesRes.ok
        ? await categoriesRes.json()
        : { categories: [] };

      const ordersData = ordersRes.ok
        ? await ordersRes.json()
        : { orders: [], total: 0 };

      const bannersData = bannersRes.ok
        ? await bannersRes.json()
        : { banners: [] };

      // Extract Arrays
      const users = usersData.users || [];
      const products = productsData.products || [];
      const categories = categoriesData.categories || [];
      const orders = ordersData.orders || [];
      const banners = bannersData.banners || [];

      const newStats = {
        users: usersData.total ?? usersData.stats?.active ?? users.length ?? 0,
        products: productsData.totalCount ?? productsData.count ?? products.length ?? 0,
        categories: categoriesData.total ?? categories.length ?? 0,
        orders: ordersData.total ?? ordersData.count ?? orders.length ?? 0,
        banners: bannersData.total ?? banners.length ?? 0,
      };

      setStats(newStats);

      // ==========================================
      // REAL-TIME ANALYTICS CALCULATION
      // ==========================================
      
      // 1. Process Sales Data (Last 6 Months)
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyData = {};
      const today = new Date();

      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = monthNames[d.getMonth()];
        monthlyData[monthKey] = { month: monthKey, sales: 0, orders: 0 };
      }

      let currentMonthSales = 0;
      let lastMonthSales = 0;
      const currentMonth = today.getMonth();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const weeklyOrders = Array.from({ length: 7 }).map((_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - index));
        return {
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dateKey: date.toISOString().slice(0, 10),
          orders: 0,
        };
      });

      orders.forEach(order => {
        const orderDate = order.createdAt || order.created_at;
        if (orderDate) {
          const date = new Date(orderDate);
          const monthKey = monthNames[date.getMonth()];
          const amount = order.totalAmount || order.totalPrice || order.total || order.amount || 0;
          const weekItem = weeklyOrders.find((item) => item.dateKey === date.toISOString().slice(0, 10));

          if (monthlyData[monthKey]) {
            monthlyData[monthKey].orders += 1;
            monthlyData[monthKey].sales += amount;
          }

          if (weekItem) {
            weekItem.orders += 1;
          }

          // Calculate growth
          if (date.getMonth() === currentMonth && date.getFullYear() === today.getFullYear()) {
            currentMonthSales += amount;
          } else if (date.getMonth() === lastMonth && (date.getFullYear() === today.getFullYear() || (currentMonth === 0 && date.getFullYear() === today.getFullYear() - 1))) {
            lastMonthSales += amount;
          }
        }
      });

      let growth = 0;
      if (lastMonthSales > 0) {
        growth = ((currentMonthSales - lastMonthSales) / lastMonthSales) * 100;
      } else if (currentMonthSales > 0) {
        growth = 100;
      }

      // 2. Process Top Categories
      const categoryCounts = {};
      products.forEach(product => {
        let catName = 'Uncategorized';
        if (product.category) {
          if (product.category.name) {
            catName = product.category.name;
          } else {
            const foundCategory = categories.find(c => c.id === product.category || c._id === product.category);
            catName = foundCategory ? foundCategory.name : product.category;
          }
        }
        categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
      });

      let processedCategoryData = Object.entries(categoryCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 4); // Get top 4 categories

      if (processedCategoryData.length === 0) {
        processedCategoryData = [{ name: 'No Data', value: 1 }];
      }

      const newChartData = {
        sales: Object.values(monthlyData),
        categories: processedCategoryData,
        weeklyOrders,
        salesGrowth: growth.toFixed(1)
      };

      setChartData(newChartData);

      // 3. Save to Cache for next instant load
      try {
        localStorage.setItem('adminDashboardStats', JSON.stringify(newStats));
        localStorage.setItem('adminDashboardChartData', JSON.stringify(newChartData));
      } catch (e) {}

      setLastUpdated(new Date());

      setError(null);
    } catch (err) {
      console.error(err);

      setError(
        'Failed to connect to database. Please check MongoDB connection.'
      );
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Analytics Data
  const COLORS = ['#000000', '#404040', '#737373', '#a3a3a3'];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
            DASHBOARD OVERVIEW
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 uppercase tracking-wider">
            Live ecommerce performance & catalog insights
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-medium text-neutral-600 bg-white px-3.5 py-1.5 rounded-full border border-neutral-200 shadow-2xs">
          <RefreshCw
            className={`w-3.5 h-3.5 text-black ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          />
          <span className="font-bold text-neutral-900 uppercase tracking-wider">Live</span>
          <span className="text-neutral-400">• {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-xs sm:text-sm text-red-700 font-medium">{error}</p>
          <button
            onClick={fetchStats}
            className="ml-auto px-3.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* LOADING OR CONTENT */}
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* STATS TILES */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* USERS */}
            <Link
              href="/admin/users"
              className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 hover:border-black transition-all duration-200 shadow-2xs group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">USERS</span>
              </div>
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-neutral-400">
                Total Customers
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-black mt-1 tracking-tight">
                {stats.users}
              </h2>
            </Link>

            {/* PRODUCTS */}
            <Link
              href="/admin/products"
              className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 hover:border-black transition-all duration-200 shadow-2xs group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">ITEMS</span>
              </div>
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-neutral-400">
                Live Products
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-black mt-1 tracking-tight">
                {stats.products}
              </h2>
            </Link>

            {/* CATEGORIES */}
            <Link
              href="/admin/categories"
              className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 hover:border-black transition-all duration-200 shadow-2xs group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">SECTIONS</span>
              </div>
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-neutral-400">
                Categories
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-black mt-1 tracking-tight">
                {stats.categories}
              </h2>
            </Link>

            {/* ORDERS */}
            <Link
              href="/admin/orders"
              className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 hover:border-black transition-all duration-200 shadow-2xs group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">SALES</span>
              </div>
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-neutral-400">
                Total Orders
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-black mt-1 tracking-tight">
                {stats.orders}
              </h2>
            </Link>
          </div>

          {/* ANALYTICS CHARTS */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* SALES LINE CHART */}
            <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-black">
                    Sales Growth
                  </h2>
                  <p className="text-xs text-neutral-400 uppercase tracking-wider mt-0.5">
                    Monthly revenue trends (BDT)
                  </p>
                </div>
                <div className="px-3 py-1 bg-black text-white rounded-full text-xs font-bold tracking-wider">
                  {Number(chartData.salesGrowth) > 0 ? '+' : ''}{chartData.salesGrowth}%
                </div>
              </div>

              <div className="h-[300px] rounded-lg">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.sales} margin={{ top: 15, right: 20, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fill: '#737373', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#737373', fontSize: 11 }} width={64} />
                    <Tooltip formatter={(value) => [`৳${Number(value).toLocaleString('en-BD')}`, 'Sales']} />
                    <Line type="monotone" dataKey="sales" stroke="#000000" strokeWidth={2.5} dot={{ r: 3, fill: '#000000' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CATEGORIES PIE CHART */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-2xs">
              <div className="mb-6">
                <h2 className="text-base font-black uppercase tracking-wider text-black">
                  Catalogue Share
                </h2>
                <p className="text-xs text-neutral-400 uppercase tracking-wider mt-0.5">
                  Products count by category
                </p>
              </div>

              <div className="h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.categories}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={84}
                      paddingAngle={3}
                    >
                      {chartData.categories.map((item, index) => (
                        <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-neutral-100">
                {chartData.categories.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-neutral-700 font-semibold truncate">
                      {item.name} ({item.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BAR CHART & BANNER STATUS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* WEEKLY ORDERS */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-black">
                    Weekly Orders Activity
                  </h2>
                  <p className="text-xs text-neutral-400 uppercase tracking-wider mt-0.5">
                    Order volume per day
                  </p>
                </div>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
                  REALTIME
                </span>
              </div>

              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.weeklyOrders} margin={{ top: 15, right: 20, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fill: '#737373', fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#737373', fontSize: 11 }} width={36} />
                    <Tooltip formatter={(value) => [value, 'Orders']} />
                    <Bar dataKey="orders" fill="#000000" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* BANNER STATUS */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-black uppercase tracking-wider text-black">
                    Banners
                  </h2>
                  <Link
                    href="/admin/banners"
                    className="text-xs font-bold text-neutral-900 hover:underline uppercase tracking-wider"
                  >
                    Manage →
                  </Link>
                </div>
                <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200/60">
                  <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center">
                    <Image className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-neutral-400">
                      Active Slides
                    </p>
                    <h3 className="text-2xl font-black text-black">
                      {stats.banners}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100">
                <Link
                  href="/admin/banners"
                  className="w-full py-2.5 px-4 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center transition-colors shadow-2xs"
                >
                  Edit Homepage Sliders
                </Link>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-2xs">
            <h2 className="text-base font-black uppercase tracking-wider text-black mb-5">
              Quick Management Shortcuts
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Link
                href="/admin/products"
                className="p-5 bg-neutral-50 hover:bg-black group border border-neutral-200 hover:border-black rounded-xl text-center transition-all duration-200"
              >
                <ShoppingCart className="w-6 h-6 text-neutral-800 group-hover:text-white mx-auto mb-2.5 transition-colors" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 group-hover:text-white transition-colors block">
                  Add Product
                </span>
              </Link>

              <Link
                href="/admin/categories"
                className="p-5 bg-neutral-50 hover:bg-black group border border-neutral-200 hover:border-black rounded-xl text-center transition-all duration-200"
              >
                <Package className="w-6 h-6 text-neutral-800 group-hover:text-white mx-auto mb-2.5 transition-colors" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 group-hover:text-white transition-colors block">
                  Categories
                </span>
              </Link>

              <Link
                href="/admin/banners"
                className="p-5 bg-neutral-50 hover:bg-black group border border-neutral-200 hover:border-black rounded-xl text-center transition-all duration-200"
              >
                <Image className="w-6 h-6 text-neutral-800 group-hover:text-white mx-auto mb-2.5 transition-colors" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 group-hover:text-white transition-colors block">
                  Banners
                </span>
              </Link>

              <Link
                href="/admin/orders"
                className="p-5 bg-neutral-50 hover:bg-black group border border-neutral-200 hover:border-black rounded-xl text-center transition-all duration-200"
              >
                <Users className="w-6 h-6 text-neutral-800 group-hover:text-white mx-auto mb-2.5 transition-colors" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 group-hover:text-white transition-colors block">
                  View Orders
                </span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
