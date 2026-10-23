'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  Wallet, 
  ArrowUpRight, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  Clock, 
  Search, 
  Download, 
  Store, 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Check, 
  ChevronRight, 
  X, 
  TrendingUp, 
  PieChart as PieChartIcon,
  Calendar,
  Layers
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

export default function VendorRevenuePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settlingId, setSettlingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('payouts'); // 'payouts' | 'vendors'
  const [timeframe, setTimeframe] = useState('all'); // 'all' | '30d' | '7d'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRevenue = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch('/api/admin/revenue', {
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        showToast('Failed to load vendor revenue metrics', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch revenue', error);
      showToast('Network error while connecting to server', 'error');
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

  const handleSettle = async (id) => {
    setSettlingId(id);
    try {
      const res = await fetch('/api/admin/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId: id, status: 'completed' })
      });
      if (res.ok) {
        showToast(`Payout #${id.slice(0, 8)} successfully settled!`);
        fetchRevenue(false);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to settle payout', 'error');
      }
    } catch (error) {
      showToast('Settlement request failed', 'error');
    } finally {
      setSettlingId(null);
    }
  };

  // Export CSV
  const exportPayoutsCSV = () => {
    if (!data?.payouts || data.payouts.length === 0) {
      showToast('No payout records to export', 'error');
      return;
    }
    const headers = ['Payout ID', 'Vendor', 'Gross Amount (BDT)', 'Platform Fee (BDT)', 'Net Amount (BDT)', 'Method', 'Status', 'Date'];
    const rows = data.payouts.map(p => [
      `"${p.id}"`,
      `"${(p.vendor || '').replace(/"/g, '""')}"`,
      p.amount,
      p.fee,
      p.amount - p.fee,
      `"${p.method}"`,
      `"${p.status}"`,
      `"${p.date}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vendor_payouts_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter growth by timeframe
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

  // Filter payouts
  const filteredPayouts = useMemo(() => {
    if (!data?.payouts) return [];
    return data.payouts.filter(p => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || 
        p.id?.toLowerCase().includes(q) || 
        p.vendor?.toLowerCase().includes(q) || 
        p.method?.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || 
        (p.status || '').toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [data?.payouts, searchQuery, statusFilter]);

  // Filter vendors
  const filteredVendors = useMemo(() => {
    if (!data?.vendors) return [];
    return data.vendors.filter(v => {
      const q = searchQuery.trim().toLowerCase();
      return !q || v.shop_name?.toLowerCase().includes(q) || v.status?.toLowerCase().includes(q);
    });
  }, [data?.vendors, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="relative">
          <RefreshCw className="w-10 h-10 animate-spin text-purple-600" />
          <div className="w-3 h-3 rounded-full bg-purple-500 absolute -top-1 -right-1 animate-ping" />
        </div>
        <p className="text-sm text-gray-500 font-medium">Loading vendor financial intelligence...</p>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="p-8 max-w-xl bg-rose-50 border border-rose-200 rounded-2xl my-8">
        <div className="flex items-center gap-3 text-rose-700 font-bold mb-2">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <span>Error loading vendor revenue data</span>
        </div>
        <p className="text-sm text-rose-600 mb-5">{data?.error || 'Unable to retrieve live vendor metrics.'}</p>
        <button
          onClick={() => fetchRevenue(false)}
          className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 active:scale-95 transition-all shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { metrics = {}, payouts = [], vendors = [], paymentMethods = [] } = data;
  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
  const hasPaymentData = paymentMethods.length > 0 && paymentMethods.some(p => Number(p.value) > 0);
  const hasGrowthData = filteredGrowth.length > 0;
  const totalPaymentValue = paymentMethods.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Toast alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium border animate-in slide-in-from-top duration-200 ${
          toast.type === 'error' 
            ? 'bg-rose-50 text-rose-800 border-rose-200' 
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-violet-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              Vendor Financials & Payout Settlement
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Vendor Revenue & Payouts</h1>
            <p className="text-purple-100 text-sm sm:text-base max-w-3xl font-light">
              Audit marketplace vendor gross sales, monitor platform commission splits (10%), manage vendor disbursements, and settle payout requests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => fetchRevenue(true)}
              disabled={refreshing}
              className="p-3 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl backdrop-blur-md transition-all duration-150 flex items-center gap-2 text-xs font-bold"
              title="Sync latest financial data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
            <button
              onClick={exportPayoutsCSV}
              className="px-4 py-3 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl backdrop-blur-md transition-all duration-150 flex items-center gap-2 text-xs font-bold"
              title="Download Payouts CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export Payouts</span>
            </button>
            <Link
              href="/admin/vendors"
              className="px-5 py-3 bg-white text-purple-800 hover:bg-purple-50 active:scale-95 rounded-xl font-bold text-xs shadow-md transition-all duration-150 flex items-center gap-1.5"
            >
              <Store className="w-4 h-4" />
              <span>All Vendors</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4-Card Executive KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Gross Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross Sales Volume</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-lg font-bold text-blue-600">৳</span>
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{(metrics.grossRevenue || 0).toLocaleString()}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Total orders volume:</span>
            <span className="font-bold text-gray-800">{metrics.totalOrders || 0} orders</span>
          </div>
        </div>

        {/* Platform Commission */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform Commission (10%)</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-lg font-bold text-emerald-600">৳</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{(metrics.platformCommission || 0).toLocaleString()}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Retained Share
            </span>
            <span className="font-bold text-gray-800">10% Take Rate</span>
          </div>
        </div>

        {/* Net Vendor Payable */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Vendor Payable</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-lg font-bold text-purple-600">৳</span>
            <span className="text-2xl sm:text-3xl font-black text-purple-600">{(metrics.netPayable || 0).toLocaleString()}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Vendor earnings pool:</span>
            <span className="font-bold text-gray-800">90% of sales</span>
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Disbursements</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-lg font-bold text-amber-600">৳</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{(metrics.pendingPayouts || 0).toLocaleString()}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Awaiting payout settlement:</span>
            <span className="font-bold text-gray-800">{payouts.filter(p => p.status === 'pending').length} pending</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue Growth */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Vendor Sales Growth
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Daily gross merchandise volume over time</p>
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
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02}/>
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
                    formatter={(value) => [`৳ ${Number(value).toLocaleString()}`, 'Sales Volume']}
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
                    stroke="#8b5cf6" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm space-y-2">
                <TrendingUp className="w-10 h-10 text-gray-200 stroke-[1.5]" />
                <p className="font-medium text-gray-500">No revenue data for this timeframe</p>
                <p className="text-xs text-gray-400">Order transactions will populate the chart automatically.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Payment Distribution Donut */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              Payment Channels
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Order volumes by customer payment gateway</p>
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
                <p className="font-medium text-gray-500">No payment data recorded</p>
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

      {/* Payouts & Vendors Ledger Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Toolbar & Tab Navigation */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('payouts')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'payouts'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-purple-600" />
              <span>Payout Requests ({payouts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'vendors'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span>Active Vendors ({vendors.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'payouts' ? "Search payout or vendor..." : "Search shop name..."}
                className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
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

            {/* Status Filter for Payouts */}
            {activeTab === 'payouts' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter payouts by status"
                className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed / Settled</option>
              </select>
            )}
          </div>
        </div>

        {/* Tab 1: Payout Requests Table */}
        {activeTab === 'payouts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Payout ID</th>
                  <th className="px-6 py-4">Vendor Shop</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Gross Amount</th>
                  <th className="px-6 py-4">Platform Fee</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredPayouts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-gray-400">
                      <Wallet className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="font-semibold text-gray-600">No payout requests recorded</p>
                      <p className="text-xs text-gray-400 mt-0.5">When vendors request earnings withdrawal, they will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayouts.map((pay) => {
                    const isCopied = copiedId === pay.id;
                    const isSettling = settlingId === pay.id;
                    const isCompleted = pay.status === 'completed';

                    return (
                      <tr key={pay.id} className="hover:bg-purple-50/20 transition-colors group">
                        {/* Payout ID */}
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-2 bg-gray-50 hover:bg-purple-50 border border-gray-200 rounded-lg px-2.5 py-1 transition-colors">
                            <span className="font-mono text-xs font-bold text-purple-700">
                              {String(pay.id).slice(0, 8)}...
                            </span>
                            <button
                              onClick={() => handleCopy(pay.id)}
                              className="text-gray-400 hover:text-purple-600 transition-colors p-0.5"
                              title="Copy Payout ID"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>

                        {/* Vendor */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-100 to-indigo-100 text-purple-800 font-bold text-xs flex items-center justify-center shrink-0 border border-purple-200/60">
                              {pay.vendor ? pay.vendor.charAt(0).toUpperCase() : 'V'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 leading-tight">{pay.vendor}</p>
                              <span className="text-[11px] text-gray-400">Merchant</span>
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{pay.date}</span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 flex items-center gap-0.5 text-sm">
                            <span className="text-purple-700 font-extrabold text-sm">৳</span>
                            <span>{Number(pay.amount || 0).toLocaleString()}</span>
                          </div>
                        </td>

                        {/* Fee */}
                        <td className="px-6 py-4">
                          <div className="text-xs font-semibold text-rose-600 flex items-center gap-0.5">
                            <span>-৳</span>
                            <span>{Number(pay.fee || 0).toLocaleString()}</span>
                          </div>
                        </td>

                        {/* Method */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                            <CreditCard className="w-3 h-3" />
                            {String(pay.method || '').replace('_', ' ')}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold capitalize border shadow-xs ${
                            isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                            {pay.status}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 text-right">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Settled
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSettle(pay.id)}
                              disabled={isSettling}
                              className="px-3.5 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 rounded-xl shadow-xs transition-all disabled:opacity-50"
                            >
                              {isSettling ? 'Settling...' : 'Settle Now'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Active Vendors Directory */}
        {activeTab === 'vendors' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Shop / Store Name</th>
                  <th className="px-6 py-4">Commission Rate</th>
                  <th className="px-6 py-4">Vendor Status</th>
                  <th className="px-6 py-4">Registration Date</th>
                  <th className="px-6 py-4 text-right">Vendor Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-400">
                      <Store className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="font-semibold text-gray-600">No vendors found</p>
                      <p className="text-xs text-gray-400 mt-0.5">Approved store merchants will be listed here.</p>
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-100 to-indigo-100 text-purple-800 font-bold text-xs flex items-center justify-center shrink-0 border border-purple-200/60">
                            {vendor.shop_name ? vendor.shop_name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 leading-tight">{vendor.shop_name || 'Vendor Shop'}</p>
                            <span className="text-[11px] text-gray-400">ID: {vendor.id?.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {vendor.commission_rate ? `${vendor.commission_rate}%` : '10% Standard'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold capitalize border bg-emerald-50 text-emerald-700 border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {vendor.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/vendors`}
                          className="inline-flex items-center gap-1 p-2 text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all"
                          title="Manage in Vendors Directory"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
