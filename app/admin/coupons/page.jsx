'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Ticket, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  X, 
  Copy, 
  Check, 
  Clock, 
  Calendar, 
  Sparkles, 
  TrendingUp, 
  Tag, 
  Percent, 
  RefreshCw, 
  AlertCircle, 
  Layers, 
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Zap,
  Info
} from 'lucide-react';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState(null);

  // Modal State for Add & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Form State
  const initialForm = {
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '0',
    max_discount_amount: '',
    usage_limit: '',
    start_date: '',
    end_date: '',
    status: 'active'
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCoupons = async (showSpin = false) => {
    if (showSpin) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/coupons?limit=200');
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Fetch error:', error);
      showToast('Failed to load coupons', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper to get coupon live status
  const getCouponStatus = (coupon) => {
    const now = new Date();
    if (coupon.status === 'inactive') {
      return { key: 'inactive', label: 'Inactive', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (coupon.start_date && new Date(coupon.start_date) > now) {
      return { key: 'scheduled', label: 'Scheduled', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (coupon.end_date && new Date(coupon.end_date) < now) {
      return { key: 'expired', label: 'Expired', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
    if (coupon.usage_limit && (coupon.used_count || 0) >= coupon.usage_limit) {
      return { key: 'exhausted', label: 'Limit Reached', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200' };
    }
    return { key: 'active', label: 'Active', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  // Key KPI metrics calculations
  const metrics = useMemo(() => {
    const now = new Date();
    let activeCount = 0;
    let scheduledCount = 0;
    let expiredCount = 0;
    let inactiveCount = 0;
    let totalRedemptions = 0;
    let highestDiscount = 0;

    coupons.forEach(c => {
      totalRedemptions += (c.used_count || 0);
      const st = getCouponStatus(c);
      if (st.key === 'active') activeCount++;
      else if (st.key === 'scheduled') scheduledCount++;
      else if (st.key === 'expired') expiredCount++;
      else if (st.key === 'inactive') inactiveCount++;

      const val = Number(c.discount_value) || 0;
      if (val > highestDiscount) highestDiscount = val;
    });

    return {
      total: coupons.length,
      active: activeCount,
      scheduled: scheduledCount,
      expired: expiredCount,
      inactive: inactiveCount,
      redemptions: totalRedemptions,
      highestDiscount
    };
  }, [coupons]);

  // Filtered coupons list
  const filteredCoupons = useMemo(() => {
    return coupons.filter(coupon => {
      // Search match
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || 
        coupon.code?.toLowerCase().includes(query) ||
        coupon.discount_value?.toString().includes(query) ||
        coupon.min_order_amount?.toString().includes(query);

      // Status match
      const currentStatus = getCouponStatus(coupon).key;
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && currentStatus === 'active') ||
        (statusFilter === 'scheduled' && currentStatus === 'scheduled') ||
        (statusFilter === 'expired' && (currentStatus === 'expired' || currentStatus === 'exhausted')) ||
        (statusFilter === 'inactive' && currentStatus === 'inactive');

      // Type match
      const matchesType = 
        typeFilter === 'all' || 
        coupon.discount_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [coupons, searchQuery, statusFilter, typeFilter]);

  // Copy code handler with visual feedback
  const handleCopyCode = (code) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Coupon code "${code}" copied to clipboard!`, 'success');
    setTimeout(() => {
      setCopiedCode((prev) => (prev === code ? null : prev));
    }, 2000);
  };

  // Generate random promo code
  const handleGenerateRandomCode = () => {
    const prefixes = ['STELLAR', 'DEAL', 'SAVE', 'VIP', 'OFFER', 'FLASH', 'SPECIAL'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const val = formData.discount_value ? Math.round(Number(formData.discount_value)) : Math.floor(Math.random() * 5 + 1) * 10;
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    setFormData(prev => ({
      ...prev,
      code: `${randomPrefix}${val > 0 ? val : randomSuffix}`
    }));
  };

  // Open modal in Create Mode
  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  // Open modal in Edit Mode
  const handleOpenEditModal = (coupon) => {
    setEditingCoupon(coupon);

    // Format ISO string to datetime-local format YYYY-MM-DDTHH:mm
    const formatDateForInput = (isoString) => {
      if (!isoString) return '';
      try {
        const d = new Date(isoString);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
      } catch {
        return '';
      }
    };

    setFormData({
      code: coupon.code || '',
      discount_type: coupon.discount_type || 'percentage',
      discount_value: coupon.discount_value !== undefined ? String(coupon.discount_value) : '',
      min_order_amount: coupon.min_order_amount !== undefined ? String(coupon.min_order_amount) : '0',
      max_discount_amount: coupon.max_discount_amount ? String(coupon.max_discount_amount) : '',
      usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '',
      start_date: formatDateForInput(coupon.start_date),
      end_date: formatDateForInput(coupon.end_date),
      status: coupon.status || 'active'
    });
    setIsModalOpen(true);
  };

  // Submit form (handles both create and edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const codeClean = formData.code.trim().toUpperCase();
      if (!codeClean) {
        showToast('Please enter a coupon code', 'error');
        setSubmitting(false);
        return;
      }

      const discVal = parseFloat(formData.discount_value);
      if (isNaN(discVal) || discVal <= 0) {
        showToast('Please enter a valid discount amount', 'error');
        setSubmitting(false);
        return;
      }

      const submitData = {
        code: codeClean,
        discount_type: formData.discount_type,
        discount_value: discVal,
        min_order_amount: formData.min_order_amount ? Math.max(0, parseFloat(formData.min_order_amount)) : 0,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit, 10) : null,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        status: formData.status
      };

      if (editingCoupon) {
        // Edit existing coupon
        const res = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update coupon');
        }

        showToast(`Coupon "${codeClean}" updated successfully!`);
      } else {
        // Create new coupon
        const res = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create coupon');
        }

        showToast(`New coupon "${codeClean}" created successfully!`);
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (error) {
      console.error('Save error:', error);
      showToast(error.message || 'An error occurred while saving', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle status with optimistic UI
  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    // Optimistic update
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        throw new Error('Failed to update status');
      }
      showToast(`Coupon status set to ${newStatus}`);
    } catch (error) {
      // Revert optimistic update
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, status: currentStatus } : c));
      showToast('Could not change status', 'error');
    }
  };

  // Delete coupon
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete coupon');
      setCoupons(prev => prev.filter(c => c.id !== id));
      setDeleteConfirmId(null);
      showToast('Coupon permanently removed');
    } catch (error) {
      showToast(error.message || 'Error deleting coupon', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Quick preset helper for dates in modal
  const applyDatePreset = (days) => {
    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const toInputString = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    setFormData(prev => ({
      ...prev,
      start_date: toInputString(now),
      end_date: toInputString(end)
    }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Promotion & Discount Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Coupons & Promo Codes</h1>
            <p className="text-blue-100 text-sm sm:text-base max-w-2xl font-light">
              Create and manage promotional discount vouchers, control cart spending conditions, monitor customer redemption caps, and launch seasonal campaigns.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchCoupons(true)}
              disabled={refreshing}
              className="p-3 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl backdrop-blur-md transition-all duration-150 flex items-center gap-2 text-sm font-medium"
              title="Refresh Coupons"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 rounded-xl font-bold text-sm shadow-md transition-all duration-150 flex items-center gap-2"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Create Coupon</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Coupons</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{metrics.total}</span>
            <span className="text-xs font-medium text-gray-400">issued</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Across all store campaigns</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live & Active</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{metrics.active}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/70 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ready
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{metrics.scheduled} scheduled for later</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Redemptions</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{metrics.redemptions}</span>
            <span className="text-xs font-medium text-gray-400">orders used</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Customer coupon conversions</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Inactive & Expired</span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-700">{metrics.expired + metrics.inactive}</span>
            <span className="text-xs font-medium text-gray-400">archived</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{metrics.expired} expired, {metrics.inactive} paused</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Controls Bar */}
        <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coupon code or discount..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status & Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex bg-gray-100 p-1 rounded-xl text-xs font-medium">
              {[
                { id: 'all', label: `All (${coupons.length})` },
                { id: 'active', label: `Active (${metrics.active})` },
                { id: 'scheduled', label: `Scheduled (${metrics.scheduled})` },
                { id: 'expired', label: `Expired (${metrics.expired})` },
                { id: 'inactive', label: `Inactive (${metrics.inactive})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === tab.id
                      ? 'bg-white text-gray-900 font-semibold shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Type selector */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter coupons by discount type"
              className="px-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Types</option>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (৳)</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-gray-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Loading store vouchers...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-gray-800">No coupons found</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'No promo codes match your active filters. Try adjusting your search query.'
                : 'You have not created any discount coupons yet. Click below to add your first promotional voucher.'}
            </p>
            {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all') ? (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); setTypeFilter('all'); }}
                className="mt-4 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                Clear all filters
              </button>
            ) : (
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create First Coupon
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Promo Voucher</th>
                  <th className="px-6 py-4">Discount Offer</th>
                  <th className="px-6 py-4">Min. Spend</th>
                  <th className="px-6 py-4">Redemption / Limit</th>
                  <th className="px-6 py-4">Validity Period</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCoupons.map((coupon) => {
                  const statusInfo = getCouponStatus(coupon);
                  const isCopied = copiedCode === coupon.code;
                  const isDeleting = deletingId === coupon.id;

                  // Usage calculation
                  const used = coupon.used_count || 0;
                  const limit = coupon.usage_limit;
                  const usagePercent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

                  // Dates formatting
                  const startDateStr = coupon.start_date
                    ? new Date(coupon.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : null;
                  const endDateStr = coupon.end_date
                    ? new Date(coupon.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : null;

                  return (
                    <tr key={coupon.id} className="hover:bg-blue-50/30 transition-colors group">
                      {/* Coupon Code / Ticket */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl px-3 py-1.5 shadow-sm group-hover:border-blue-300 transition-colors">
                            <span className="font-mono font-extrabold text-blue-700 tracking-wider text-base uppercase">
                              {coupon.code}
                            </span>
                            <button
                              onClick={() => handleCopyCode(coupon.code)}
                              className="ml-2.5 p-1 rounded-md text-blue-500 hover:text-blue-700 hover:bg-blue-100/60 transition-colors"
                              title="Copy promo code"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in-50" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Discount Amount */}
                      <td className="px-6 py-4">
                        {coupon.discount_type === 'percentage' ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Percent className="w-3.5 h-3.5" />
                              {coupon.discount_value}% OFF
                            </span>
                            {coupon.max_discount_amount && (
                              <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-0.5">
                                <span>Cap:</span>
                                <span className="font-semibold text-gray-700">৳{Number(coupon.max_discount_amount).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Tag className="w-3.5 h-3.5" />
                              ৳{Number(coupon.discount_value).toLocaleString()} OFF
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Minimum Order */}
                      <td className="px-6 py-4">
                        {coupon.min_order_amount > 0 ? (
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-0.5">
                              <span className="text-gray-500 font-semibold">৳</span>
                              <span>{Number(coupon.min_order_amount).toLocaleString()}</span>
                            </div>
                            <span className="text-[11px] text-gray-400">Min. cart requirement</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200/60">
                            No Minimum
                          </span>
                        )}
                      </td>

                      {/* Usage and Limit */}
                      <td className="px-6 py-4">
                        {limit ? (
                          <div className="space-y-1.5 min-w-[130px]">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-gray-800">{used}</span>
                              <span className="text-gray-400">of {limit}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  usagePercent >= 100
                                    ? 'bg-rose-500'
                                    : usagePercent >= 75
                                    ? 'bg-amber-500'
                                    : 'bg-blue-600'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {limit - used > 0 ? `${limit - used} left` : 'Fully redeemed'}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-gray-900">{used}</span>
                            <span className="text-xs text-gray-500 ml-1">uses</span>
                            <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <span>Limit:</span>
                              <span className="font-semibold text-emerald-600">Unlimited (∞)</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Validity */}
                      <td className="px-6 py-4 text-xs">
                        {startDateStr && endDateStr ? (
                          <div className="space-y-0.5">
                            <div className="text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span>{startDateStr} - {endDateStr}</span>
                            </div>
                          </div>
                        ) : endDateStr ? (
                          <div className="text-gray-700 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>Expires {endDateStr}</span>
                          </div>
                        ) : startDateStr ? (
                          <div className="text-gray-700 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>Starts {startDateStr}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Always Valid
                          </span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(coupon.id, coupon.status || 'active')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all active:scale-95 shadow-sm hover:brightness-95 ${statusInfo.badgeClass}`}
                          title="Click to toggle active / inactive state"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            statusInfo.key === 'active' ? 'bg-emerald-500 animate-pulse' :
                            statusInfo.key === 'scheduled' ? 'bg-amber-500' :
                            statusInfo.key === 'expired' ? 'bg-slate-400' :
                            'bg-rose-500'
                          }`} />
                          {statusInfo.label}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(coupon)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Edit coupon details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {deleteConfirmId === coupon.id ? (
                            <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-xl p-1 animate-in zoom-in-90 duration-150">
                              <button
                                onClick={() => handleDelete(coupon.id)}
                                disabled={isDeleting}
                                className="px-2 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1"
                              >
                                {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="p-1 text-gray-500 hover:text-gray-700 rounded-lg"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(coupon.id)}
                              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Delete coupon"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-gray-100 my-8 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">
                    {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create Promotional Coupon'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {editingCoupon ? 'Update coupon rules, validity, and limits.' : 'Set discount details and launch a new store campaign.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Promo Code Input & Random Generator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Coupon Code <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomCode}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono uppercase text-base tracking-wider font-bold text-blue-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. EID500 or STELLAR20"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 pointer-events-none">
                    CODE
                  </div>
                </div>
              </div>

              {/* Discount Type and Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Discount Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discount_type: 'percentage' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        formData.discount_type === 'percentage'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discount_type: 'fixed' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        formData.discount_type === 'fixed'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-bold">৳</span>
                      Fixed (৳)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Discount Value <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder={formData.discount_type === 'percentage' ? 'e.g. 10' : 'e.g. 200'}
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                      {formData.discount_type === 'percentage' ? '%' : '৳ BDT'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Min Spend and Max Discount Cap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Minimum Order Amount (৳)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.min_order_amount}
                      onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                      className="w-full pl-4 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="0 for no minimum"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                      ৳
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400 mt-1 block">Set 0 for no minimum cart spend.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Max Discount Cap (৳) <span className="text-gray-400 font-normal lowercase">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={formData.max_discount_amount}
                      onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                      className="w-full pl-4 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="e.g. 500"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                      ৳
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400 mt-1 block">Cap percentage discounts to a max value.</span>
                </div>
              </div>

              {/* Usage Limit and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Total Usage Limit <span className="text-gray-400 font-normal lowercase">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Leave empty for unlimited (∞)"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">Maximum total customer redemptions.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="active">Active (Usable on Checkout)</option>
                    <option value="inactive">Inactive / Paused</option>
                  </select>
                </div>
              </div>

              {/* Validity Dates */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Validity Schedule <span className="text-gray-400 font-normal lowercase">(Optional)</span>
                  </label>
                  {/* Date presets */}
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => applyDatePreset(7)}
                      className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                    >
                      +7d
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset(14)}
                      className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                    >
                      +14d
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset(30)}
                      className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                    >
                      +30d
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, start_date: '', end_date: '' })}
                      className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-rose-600 rounded-md transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] text-gray-500 block mb-1">Start Date & Time</span>
                    <input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 block mb-1">End Date & Time</span>
                    <input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Voucher */}
              <div className="p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 rounded-2xl border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    Customer Voucher Preview
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-blue-700 shadow-xs border border-blue-200">
                    {formData.discount_type === 'percentage'
                      ? `${formData.discount_value || '0'}% OFF`
                      : `৳${Number(formData.discount_value || 0).toLocaleString()} OFF`}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-blue-100 shadow-sm">
                  <div className="space-y-0.5">
                    <span className="font-mono font-extrabold text-blue-700 text-sm tracking-wider uppercase">
                      {formData.code || 'YOURCODE'}
                    </span>
                    <p className="text-[11px] text-gray-500">
                      {parseFloat(formData.min_order_amount) > 0
                        ? `On orders over ৳${Number(formData.min_order_amount).toLocaleString()}`
                        : 'No minimum order required'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-emerald-600">
                      {formData.end_date ? 'Limited Time' : 'Valid Storewide'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingCoupon ? 'Save Changes' : 'Create Voucher'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}