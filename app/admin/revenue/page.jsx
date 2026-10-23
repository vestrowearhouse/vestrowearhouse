'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  Activity, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  Clock, 
  Download, 
  Search, 
  ArrowUpRight, 
  CreditCard, 
  Wallet, 
  ShoppingBag, 
  Filter, 
  Check, 
  Copy, 
  Calendar, 
  Sparkles,
  ShieldCheck,
  ChevronRight,
  X
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function PlatformRevenuePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [timeframe, setTimeframe] = useState('all'); // 'all' | '30d' | '7d'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const fetchRevenue = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/general-revenue', {
        credentials: 'include'
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        setErrorMsg(json?.error || 'Failed to fetch revenue data');
      }
    } catch (error) {
      console.error('Failed to fetch revenue', error);
      setErrorMsg('Network error while connecting to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  const handleCopy = (id) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export to CSV function
  const exportToCSV = () => {
    if (!data?.recentOrders || data.recentOrders.length === 0) return;
    const headers = ['Order ID', 'Customer', 'Date', 'Amount (BDT)', 'Payment Method', 'Status'];
    const rows = data.recentOrders.map(o => [
      `"${o.id}"`,
      `"${(o.customer || '').replace(/"/g, '""')}"`,
      `"${o.date}"`,
      o.amount,
      `"${o.method}"`,
      `"${o.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stellarmart_revenue_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter growth data by timeframe
  const filteredGrowth = useMemo(() => {
    if (!data?.revenueGrowth) return [];
    if (timeframe === 'all') return data.revenueGrowth;

    const now = new Date();
    const days = timeframe === '7d' ? 7 : 30;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return data.revenueGrowth.filter(item => {
      try {
        const itemDate = new Date(item.date);
        return itemDate >= cutoff;
      } catch {
        return true;
      }
    });
  }, [data?.revenueGrowth, timeframe]);

  // Filter recent orders
  const filteredOrders = useMemo(() => {
    if (!data?.recentOrders) return [];
    return data.recentOrders.filter(order => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || 
        order.id?.toLowerCase().includes(q) || 
        order.customer?.toLowerCase().includes(q) ||
        String(order.amount).includes(q);

      const matchesStatus = statusFilter === 'all' || 
        (order.status || '').toLowerCase() === statusFilter.toLowerCase();

      const methodLower = (order.method || '').toLowerCase();
      const matchesMethod = methodFilter === 'all' ||
        (methodFilter === 'cod' && (methodLower.includes('cod') || methodLower.includes('cash'))) ||
        (methodFilter === 'bkash' && (methodLower.includes('bkash') || methodLower.includes('nagad') || methodLower.includes('rocket'))) ||
        (methodFilter === 'card' && (methodLower.includes('card') || methodLower.includes('online')));

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [data?.recentOrders, searchQuery, statusFilter, methodFilter]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="relative">
          <RefreshCw className="w-10 h-10 animate-spin text-emerald-600" />
          <div className="w-3 h-3 rounded-full bg-emerald-500 absolute -top-1 -right-1 animate-ping" />
        </div>
        <p className="text-sm text-gray-500 font-medium">Gathering real-time revenue intelligence...</p>
      </div>
    );
  }

  if (errorMsg || !data || data.error) {
    return (
      <div className="p-8 max-w-xl bg-rose-50 border border-rose-200 rounded-2xl my-8">
        <div className="flex items-center gap-3 text-rose-700 font-bold mb-2">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <span>Error loading revenue analytics</span>
        </div>
        <p className="text-sm text-rose-600 mb-5">{errorMsg || data?.error || 'Unable to retrieve live database revenue metrics.'}</p>
        <button
          onClick={() => fetchRevenue(false)}
          className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 active:scale-95 transition-all shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { metrics = {}, recentOrders = [], paymentMethods = [] } = data;
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
  const hasPaymentData = paymentMethods.length > 0 && paymentMethods.some(p => Number(p.value) > 0);
  const hasGrowthData = filteredGrowth.length > 0;

  const totalPaymentValue = paymentMethods.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  const pendingRevenue = Math.max(0, (metrics.grossRevenue || 0) - (metrics.netRevenue || 0));

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              Financial Analytics & Revenue Control
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Platform Revenue & Sales</h1>
            <p className="text-emerald-100 text-sm sm:text-base max-w-3xl font-light">
              Real-time audit of gross order volumes, net realized earnings from fulfilled deliveries, average customer basket value, and payment method distribution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => fetchRevenue(true)}
              disabled={refreshing}
              className="p-3 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl backdrop-blur-md transition-all duration-150 flex items-center gap-2 text-xs font-bold"
              title="Sync latest orders"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-3 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl backdrop-blur-md transition-all duration-150 flex items-center gap-2 text-xs font-bold"
              title="Download CSV report"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <Link
              href="/admin/orders"
              className="px-5 py-3 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 rounded-xl font-bold text-xs shadow-md transition-all duration-150 flex items-center gap-1.5"
            >
              <span>Manage Orders</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4-Card Executive KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Gross Sales */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross Sales Volume</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-lg font-bold text-blue-600">৳</span>
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{(metrics.grossRevenue || 0).toLocaleString()}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Total placed orders:</span>
            <span className="font-bold text-gray-800">{metrics.totalOrders || 0} orders</span>
          </div>
        </div>

        {/* Net Realized Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Realized Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-lg font-bold text-emerald-600">৳</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{(metrics.netRevenue || 0).toLocaleString()}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Completed
            </span>
            <span className="font-bold text-gray-800">{metrics.completedOrders || 0} delivered</span>
          </div>
        </div>

        {/* In-Pipeline / Pending */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">In-Pipeline Value</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-lg font-bold text-amber-600">৳</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{pendingRevenue.toLocaleString()}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Pending delivery:</span>
            <span className="font-bold text-gray-800">{Math.max(0, (metrics.totalOrders || 0) - (metrics.completedOrders || 0))} orders</span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg. Order Value (AOV)</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-lg font-bold text-indigo-600">৳</span>
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{(metrics.aov || 0).toLocaleString()}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Average per order:</span>
            <span className="font-bold text-gray-800">Basket Benchmark</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue Growth Timeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Revenue Growth Timeline
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Daily sales accumulation from valid customer orders</p>
            </div>

            {/* Timeframe pill tabs */}
            <div className="inline-flex bg-gray-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
              {[
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: 'all', label: 'All Time' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTimeframe(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    timeframe === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            {hasGrowthData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredGrowth} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNetRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: '#6b7280' }} 
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#6b7280' }} 
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(val) => `৳${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <RechartsTooltip 
                    formatter={(value) => [`৳ ${Number(value).toLocaleString()}`, 'Daily Revenue']}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderRadius: '12px', 
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', 
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorNetRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm space-y-2">
                <Activity className="w-10 h-10 text-gray-200 stroke-[1.5]" />
                <p className="font-medium text-gray-500">No revenue data for this timeframe</p>
                <p className="text-xs text-gray-400">Switch timeframe to view historical orders.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Payment Distribution Donut */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              Payment Distribution
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Order volume split across payment channels</p>
          </div>

          <div className="relative h-60 w-full flex items-center justify-center my-2">
            {hasPaymentData ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethods}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={88}
                      fill="#8884d8"
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(val) => `৳ ${Number(val).toLocaleString()}`}
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        borderRadius: '10px', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total</span>
                  <span className="text-base font-black text-gray-800">৳{totalPaymentValue.toLocaleString()}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 text-sm space-y-2">
                <PieChartIcon className="w-10 h-10 text-gray-200 stroke-[1.5]" />
                <p className="font-medium text-gray-500">No payment records yet</p>
              </div>
            )}
          </div>

          {/* Detailed breakdown list */}
          {hasPaymentData && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {paymentMethods.map((entry, index) => {
                const percent = totalPaymentValue > 0 ? Math.round((entry.value / totalPaymentValue) * 100) : 0;
                return (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-medium text-gray-700">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">৳{Number(entry.value).toLocaleString()}</span>
                      <span className="text-gray-400 font-medium">({percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900">Recent Transactions</h3>
            <p className="text-xs text-gray-500 mt-0.5">Real order events and customer checkout settlements</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID or customer..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              aria-label="Filter transactions by payment method"
              className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Methods</option>
              <option value="cod">Cash on Delivery</option>
              <option value="bkash">bKash / Nagad</option>
              <option value="card">Card / Online</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter transactions by order status"
              className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed / Delivered</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <span className="text-xs font-bold px-3 py-2 bg-gray-100 text-gray-700 rounded-xl">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
            </span>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-semibold text-gray-600">No matching transactions found</p>
                    <p className="text-xs text-gray-400 mt-0.5">Try clearing filters or adjusting your search query.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isCopied = copiedId === order.id;
                  const isDelivered = order.status === 'completed' || order.status === 'delivered';
                  const isPending = order.status === 'pending';
                  const isCancelled = order.status === 'cancelled';
                  const methodText = String(order.method || 'COD').toUpperCase();

                  return (
                    <tr key={order.id} className="hover:bg-emerald-50/20 transition-colors group">
                      {/* Order ID */}
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg px-2.5 py-1 transition-colors">
                          <span className="font-mono text-xs font-bold text-blue-700 tracking-wide">
                            {order.id}
                          </span>
                          <button
                            onClick={() => handleCopy(order.id)}
                            className="text-gray-400 hover:text-blue-600 transition-colors p-0.5"
                            title="Copy Order ID"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-100 to-teal-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200/60">
                            {order.customer ? order.customer.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 leading-tight">{order.customer || 'Guest Customer'}</p>
                            <span className="text-[11px] text-gray-400">Verified Buyer</span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{order.date}</span>
                        </div>
                      </td>

                      {/* Amount (Styled Taka to prevent 'i' glyph glitch) */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 flex items-center gap-0.5 text-sm">
                          <span className="text-emerald-700 font-extrabold text-sm">৳</span>
                          <span>{Number(order.amount || 0).toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="px-6 py-4">
                        {methodText.includes('BKASH') || methodText.includes('NAGAD') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200">
                            <Wallet className="w-3 h-3" />
                            {order.method}
                          </span>
                        ) : methodText.includes('COD') || methodText.includes('CASH') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <CreditCard className="w-3 h-3" />
                            Cash on Delivery
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <CreditCard className="w-3 h-3" />
                            {order.method}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold capitalize border shadow-xs ${
                          isDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          isPending ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          isCancelled ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isDelivered ? 'bg-emerald-500' :
                            isPending ? 'bg-amber-500 animate-pulse' :
                            isCancelled ? 'bg-rose-500' :
                            'bg-blue-500'
                          }`} />
                          {order.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/orders`}
                          className="inline-flex items-center gap-1 p-2 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
                          title="View order in Orders Dashboard"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
