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

  const COLORS = ['#2563eb', '#16a34a', '#9333ea', '#ea580c'];

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">

      {/* HEADER */}
        
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8">

        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
            Dashboard Overview
          </h1>

          <p className="text-gray-500 mt-2">
            Welcome back! Here’s your ecommerce analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">

          <RefreshCw
            className={`w-4 h-4 text-blue-500 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          />

          <span className="font-medium text-gray-700">
            Live
          </span>

          <span className="text-gray-400">
            • {lastUpdated.toLocaleTimeString()}
          </span>

        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">

          <AlertCircle className="w-5 h-5 text-red-600" />

          <p className="text-red-700">
            {error}
          </p>

          <button
            onClick={fetchStats}
            className="ml-auto px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
          >
            Retry
          </button>

        </div>
      )}

      {/* LOADING */}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>

          {/* STATS */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

            {/* USERS */}

            <Link
              href="/admin/users"
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >

              <div className="flex items-center justify-between mb-6">

                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>

                <div className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                  <TrendingUp className="w-4 h-4" />
                  +12%
                </div>

              </div>

              <p className="text-gray-500 font-medium">
                Total Users
              </p>

              <h2 className="text-4xl font-black text-gray-900 mt-2">
                {stats.users}
              </h2>

            </Link>

            {/* PRODUCTS */}

            <Link
              href="/admin/products"
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >

              <div className="flex items-center justify-between mb-6">

                <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
                  <ShoppingCart className="w-7 h-7 text-green-600" />
                </div>

                <div className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                  <TrendingUp className="w-4 h-4" />
                  +18%
                </div>

              </div>

              <p className="text-gray-500 font-medium">
                Products
              </p>

              <h2 className="text-4xl font-black text-gray-900 mt-2">
                {stats.products}
              </h2>

            </Link>

            {/* CATEGORIES */}

            <Link
              href="/admin/categories"
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >

              <div className="flex items-center justify-between mb-6">

                <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <Package className="w-7 h-7 text-purple-600" />
                </div>

                <div className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                  <TrendingUp className="w-4 h-4" />
                  +8%
                </div>

              </div>

              <p className="text-gray-500 font-medium">
                Categories
              </p>

              <h2 className="text-4xl font-black text-gray-900 mt-2">
                {stats.categories}
              </h2>

            </Link>

            {/* ORDERS */}

            <Link
              href="/admin/orders"
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >

              <div className="flex items-center justify-between mb-6">

                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-orange-600" />
                </div>

                <div className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                  <TrendingUp className="w-4 h-4" />
                  +24%
                </div>

              </div>

              <p className="text-gray-500 font-medium">
                Orders
              </p>

              <h2 className="text-4xl font-black text-gray-900 mt-2">
                {stats.orders}
              </h2>

            </Link>

          </div>

          {/* ANALYTICS */}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

            {/* SALES CHART */}

            <div className="xl:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">

              <div className="flex items-center justify-between mb-6">

                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Sales Analytics
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Monthly sales growth overview
                  </p>
                </div>

                <div className={`px-4 py-2 rounded-full text-sm font-bold ${Number(chartData.salesGrowth) >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {Number(chartData.salesGrowth) > 0 ? '+' : ''}{chartData.salesGrowth}%
                </div>

              </div>

            <div className="h-[350px] rounded-lg border border-gray-100">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.sales} margin={{ top: 20, right: 24, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} width={64} />
                  <Tooltip formatter={(value) => [`৳${Number(value).toLocaleString('en-BD')}`, 'Sales']} />
                  <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            </div>

            {/* PIE CHART */}

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">

              <div className="mb-6">

                <h2 className="text-2xl font-bold text-gray-900">
                  Top Categories
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Highest product count by category
                </p>

              </div>

              <div className="h-[280px] rounded-lg border border-gray-100">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.categories}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={54}
                      outerRadius={96}
                      paddingAngle={4}
                    >
                      {chartData.categories.map((item, index) => (
                        <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">

                {chartData.categories.map((item, index) => (

                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm"
                  >

                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: COLORS[index],
                      }}
                    />

                    <span className="text-gray-700 font-medium">
                      {item.name} ({item.value})
                    </span>

                  </div>

                ))}

              </div>

            </div>

          </div>

          {/* BAR CHART */}

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8">

            <div className="flex items-center justify-between mb-6">

          <div>

                <h2 className="text-2xl font-bold text-gray-900">
                  Orders Performance
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Weekly orders analytics
                </p>

              </div>

              <div className="text-sm text-blue-600 font-bold">
                Live Tracking
              </div>

            </div>

            <div className="h-[320px] rounded-lg border border-gray-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.weeklyOrders} margin={{ top: 20, right: 24, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 12 }} width={48} />
                  <Tooltip formatter={(value) => [value, 'Orders']} />
                  <Bar dataKey="orders" fill="#16a34a" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* BANNER STATUS */}

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8">

            <div className="flex items-center justify-between mb-4">

              <h2 className="text-2xl font-bold text-gray-900">
                Banner Status
              </h2>

              <Link
                href="/admin/banners"
                className="text-blue-600 hover:underline text-sm font-semibold"
              >
                Manage →
              </Link>

            </div>

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center">
                <Image className="w-6 h-6 text-pink-600" />
              </div>

              <div>

                <p className="text-gray-500">
                  Active Banners
                </p>

                <h3 className="text-2xl font-black text-gray-900">
                  {stats.banners}
                </h3>

              </div>

            </div>

          </div>

          {/* QUICK ACTIONS */}

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">

            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Quick Actions
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

              <Link
                href="/admin/products"
                className="p-5 bg-blue-50 rounded-2xl text-center hover:bg-blue-100 transition-all"
              >

                <ShoppingCart className="w-8 h-8 text-blue-600 mx-auto mb-3" />

                <span className="text-sm font-bold text-gray-900">
                  Add Product
                </span>

              </Link>

              <Link
                href="/admin/categories"
                className="p-5 bg-green-50 rounded-2xl text-center hover:bg-green-100 transition-all"
              >

                <Package className="w-8 h-8 text-green-600 mx-auto mb-3" />

                <span className="text-sm font-bold text-gray-900">
                  Add Category
                </span>

              </Link>

              <Link
                href="/admin/banners"
                className="p-5 bg-purple-50 rounded-2xl text-center hover:bg-purple-100 transition-all"
              >

                <Image className="w-8 h-8 text-purple-600 mx-auto mb-3" />

                <span className="text-sm font-bold text-gray-900">
                  Add Banner
                </span>

              </Link>

              <Link
                href="/admin/users"
                className="p-5 bg-orange-50 rounded-2xl text-center hover:bg-orange-100 transition-all"
              >

                <Users className="w-8 h-8 text-orange-600 mx-auto mb-3" />

                <span className="text-sm font-bold text-gray-900">
                  View Users
                </span>

              </Link>

            </div>

          </div>

        </>
      )}

    </div>
  );
}
