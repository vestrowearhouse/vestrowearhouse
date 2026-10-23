'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Send, Users, Store, Loader2, AlertCircle, CheckCircle2, Search, Bell, 
  RefreshCw, Download, Trash2, Copy, Check, Sparkles, Megaphone, 
  Clock, ShieldAlert, Info, Calendar, X 
} from 'lucide-react';

const PRESET_TEMPLATES = [
  {
    label: '🚚 Courier & Delivery Advisory',
    type: 'info',
    title: 'Nationwide Delivery Schedule Update',
    message: 'Due to festive volume, orders outside Dhaka may experience a 24-48 hour extended delivery window. Our courier partners are working around the clock to deliver your parcels safely.'
  },
  {
    label: '⚡ Flash Sale Announcement',
    type: 'event',
    title: 'Exclusive Flash Deals Are Now Live!',
    message: 'Huge discounts up to 50% are live across electronics, lifestyle, and fashion items! Stock is strictly limited, grab your favorites before the countdown ends.'
  },
  {
    label: '🛠️ Scheduled System Maintenance',
    type: 'warning',
    title: 'Routine Server Upgrade Notice',
    message: 'We will be conducting routine infrastructure optimization tonight between 2:00 AM and 3:30 AM BST. The storefront will remain operational, but brief checkout delays may occur.'
  },
  {
    label: '💳 Payment Gateway Notice',
    type: 'info',
    title: 'bKash & Nagad Direct Instant Checkout',
    message: 'Instant automated payment verification for bKash, Nagad, and Rocket is now fully operational. Enjoy seamless zero-delay order processing!'
  },
  {
    label: '🛡️ Merchant Fulfillment Policy',
    type: 'alert',
    title: 'Urgent: Dispatch Deadline Compliance',
    message: 'Attention all verified merchants: Pending orders must be packed and assigned to couriers within 24 hours of confirmation to maintain your seller rating.'
  }
];

export default function NotificationControlCenter() {
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all'); // all, info, warning, event, alert
  const [historySearch, setHistorySearch] = useState('');
  
  const [targetType, setTargetType] = useState('all'); // all, all_users, all_vendors, single_user, single_vendor
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' // info, warning, event, alert
  });
  
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchDirectory();
  }, []);

  const fetchDirectory = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setVendors(data.vendors || []);
        setHistory(data.history || []);
        if (isManual) showToast('Directory and history refreshed');
      } else {
        showToast('Failed to fetch notifications data', 'error');
      }
    } catch (err) {
      console.error('Failed to fetch directory', err);
      showToast('Network error while loading directory', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setFormData({
      title: preset.title,
      message: preset.message,
      type: preset.type
    });
    showToast(`Loaded "${preset.label}" template`);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      showToast('Title and message are required', 'error');
      return;
    }
    if ((targetType === 'single_user' || targetType === 'single_vendor') && selectedIds.length === 0) {
      showToast('Please select at least one recipient from the directory', 'error');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_ids: selectedIds,
          title: formData.title.trim(),
          message: formData.message.trim(),
          type: formData.type
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Notification broadcasted successfully!');
        const newEntry = {
          id: data.data?.id || Date.now().toString(),
          title: formData.title.trim(),
          message: formData.message.trim(),
          type: formData.type,
          recipient_type: targetType,
          created_at: new Date().toISOString()
        };
        setHistory(prev => [newEntry, ...prev]);
        setFormData({ title: '', message: '', type: 'info' });
        setSelectedIds([]);
      } else {
        showToast(data.error || 'Failed to send notification', 'error');
      }
    } catch (err) {
      showToast('An error occurred while sending notification', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteHistory = async (id, title) => {
    if (!confirm(`Remove "${title}" from notification history?`)) return;
    try {
      const res = await fetch(`/api/admin/notifications?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
        showToast('Notification removed from history');
      } else {
        showToast('Failed to delete notification', 'error');
      }
    } catch {
      showToast('Network error while deleting', 'error');
    }
  };

  const handleDuplicate = (item) => {
    setFormData({
      title: item.title,
      message: item.message,
      type: item.type
    });
    setCopiedId(item.id);
    showToast('Copied content into composer');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    if (!history.length) {
      showToast('No notification history to export', 'error');
      return;
    }
    const headers = ['ID', 'Title', 'Message', 'Type', 'Target Audience', 'Sent At'];
    const rows = history.map(n => [
      n.id,
      `"${(n.title || '').replace(/"/g, '""')}"`,
      `"${(n.message || '').replace(/"/g, '""')}"`,
      n.type,
      n.recipient_type,
      n.created_at
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stellarmart_notifications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported notification ledger to CSV');
  };

  const displayList = targetType === 'single_vendor' ? vendors : users;
  const filteredList = useMemo(() => {
    return displayList.filter(item => 
      (item.name || item.shop_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [displayList, searchTerm]);

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      if (historyFilter !== 'all' && item.type !== historyFilter) return false;
      if (historySearch) {
        const query = historySearch.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(query);
        const matchMsg = (item.message || '').toLowerCase().includes(query);
        const matchTarget = (item.recipient_type || '').toLowerCase().includes(query);
        if (!matchTitle && !matchMsg && !matchTarget) return false;
      }
      return true;
    });
  }, [history, historyFilter, historySearch]);

  // Statistics
  const stats = useMemo(() => {
    const totalSent = history.length;
    const customerCount = users.length;
    const vendorCount = vendors.length;
    const broadcastsCount = history.filter(h => h.recipient_type === 'all' || h.recipient_type === 'all_users' || h.recipient_type === 'all_vendors').length;
    const urgentCount = history.filter(h => h.type === 'alert' || h.type === 'warning').length;
    return { totalSent, customerCount, vendorCount, broadcastsCount, urgentCount };
  }, [history, users, vendors]);

  const getTypeStyle = (type) => {
    switch (type) {
      case 'alert':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          badge: 'bg-rose-100 text-rose-800',
          dot: 'bg-rose-500',
          icon: ShieldAlert
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          badge: 'bg-amber-100 text-amber-800',
          dot: 'bg-amber-500',
          icon: AlertCircle
        };
      case 'event':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          badge: 'bg-purple-100 text-purple-800',
          dot: 'bg-purple-500',
          icon: Sparkles
        };
      default:
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          badge: 'bg-blue-100 text-blue-800',
          dot: 'bg-blue-500',
          icon: Info
        };
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white font-medium transition-all duration-300 transform translate-y-0 ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-200" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-sm">{toast.msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                <Bell className="w-7 h-7 text-indigo-200" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Notification Control Center</h1>
                <p className="text-indigo-100 text-sm">Broadcast platform announcements or dispatch targeted alerts to customers and merchants</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full font-medium text-white border border-white/20">
                {stats.totalSent} Dispatched Logs
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/30 backdrop-blur-sm rounded-full font-medium text-emerald-200 border border-emerald-400/30">
                {stats.customerCount} Reachable Customers
              </span>
              <span className="px-2.5 py-1 bg-amber-500/30 backdrop-blur-sm rounded-full font-medium text-amber-200 border border-amber-400/30">
                {stats.vendorCount} Active Merchants
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchDirectory(true)}
              disabled={refreshing}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2 border border-white/20 shadow-sm backdrop-blur-md disabled:opacity-50"
              title="Refresh Directory and History"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2 border border-white/20 shadow-sm backdrop-blur-md"
              title="Export Notification Ledger to CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI 4-Card Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Dispatched</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Megaphone className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900">{stats.totalSent}</div>
          <p className="text-xs text-gray-500 mt-1">Platform broadcasts & targeted alerts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Customer Audience</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">{stats.customerCount}</div>
          <p className="text-xs text-gray-500 mt-1">Registered shopper profiles</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Merchant Network</span>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-600">{stats.vendorCount}</div>
          <p className="text-xs text-gray-500 mt-1">Active verified merchant shops</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">High-Priority Alerts</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600">{stats.urgentCount}</div>
          <p className="text-xs text-gray-500 mt-1">Warnings and urgent policy notices</p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Composer Studio (5 Cols) */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                <span>Compose Message</span>
              </h2>
              <span className="text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full font-semibold">
                Live Dispatch
              </span>
            </div>

            {/* Quick Templates Picker */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Announcement Templates</span>
              </label>
              <select
                onChange={(e) => {
                  const idx = parseInt(e.target.value);
                  if (!isNaN(idx) && PRESET_TEMPLATES[idx]) {
                    handleApplyPreset(PRESET_TEMPLATES[idx]);
                  }
                }}
                defaultValue=""
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="" disabled>-- Select a pre-built notification template --</option>
                {PRESET_TEMPLATES.map((tpl, i) => (
                  <option key={i} value={i}>{tpl.label}</option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              {/* Target Audience */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Target Audience *
                </label>
                <select 
                  value={targetType}
                  onChange={(e) => {
                    setTargetType(e.target.value);
                    setSelectedIds([]);
                  }}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium transition-all"
                >
                  <option value="all">📢 Broadcast to Everyone (Customers + Vendors)</option>
                  <option value="all_users">👥 All Registered Customers Only</option>
                  <option value="all_vendors">🏪 All Verified Vendors Only</option>
                  <option value="single_user">🎯 Select Specific Customer(s)</option>
                  <option value="single_vendor">🏢 Select Specific Vendor(s)</option>
                </select>
              </div>

              {/* Notification Type Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Notification Type & Priority *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'info', label: 'Info', icon: Info, color: 'bg-blue-50 text-blue-700 border-blue-300 ring-blue-500' },
                    { id: 'warning', label: 'Warning', icon: AlertCircle, color: 'bg-amber-50 text-amber-700 border-amber-300 ring-amber-500' },
                    { id: 'event', label: 'Event', icon: Sparkles, color: 'bg-purple-50 text-purple-700 border-purple-300 ring-purple-500' },
                    { id: 'alert', label: 'Alert', icon: ShieldAlert, color: 'bg-rose-50 text-rose-700 border-rose-300 ring-rose-500' }
                  ].map(t => {
                    const Icon = t.icon;
                    const isSelected = formData.type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: t.id })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          isSelected ? `${t.color} ring-2 shadow-sm` : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Notification Title *
                  </label>
                  <span className="text-[11px] font-mono text-gray-400">
                    {formData.title.length}/100
                  </span>
                </div>
                <input 
                  type="text" 
                  maxLength={100}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Special Holiday Shipping Schedule"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                  required
                />
              </div>

              {/* Message Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Message Body *
                  </label>
                  <span className="text-[11px] font-mono text-gray-400">
                    {formData.message.length}/500
                  </span>
                </div>
                <textarea 
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows="4"
                  maxLength={500}
                  placeholder="Write clear, friendly instructions or announcements for recipients..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none transition-all"
                  required
                />
              </div>

              {/* Real-time Recipient Preview Box */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Bell className="w-3 h-3 text-indigo-500" />
                  <span>Preview as Recipient</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-900 truncate">
                      {formData.title || 'Notification Title'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getTypeStyle(formData.type).badge}`}>
                      {formData.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {formData.message || 'Notification content will appear here...'}
                  </p>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={sending}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                <span>{sending ? 'Broadcasting Notice...' : 'Send Notification'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Dynamic View (Recipient Directory OR Broadcast History) (7 Cols) */}
        <div className="xl:col-span-7 space-y-6">
          {(targetType === 'single_user' || targetType === 'single_vendor') ? (
            /* Mode 1: Directory Selection */
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[640px]">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    {targetType === 'single_vendor' ? <Store className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">
                      Select {targetType === 'single_vendor' ? 'Target Merchants' : 'Target Customers'}
                    </h2>
                    <p className="text-xs text-gray-500">Pick one or multiple recipients to receive this alert</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-3 py-1.5 rounded-xl">
                  {selectedIds.length} Selected
                </span>
              </div>
              
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${targetType === 'single_vendor' ? 'merchants by shop, email, phone...' : 'customers by name, email...'}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[500px]">
                {loading ? (
                  <div className="flex flex-col justify-center items-center h-64 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-xs text-gray-500">Loading directory...</p>
                  </div>
                ) : filteredList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500 p-6 text-center space-y-2">
                    <Users className="w-10 h-10 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-700">No {targetType === 'single_vendor' ? 'merchants' : 'customers'} found</p>
                    <p className="text-xs text-gray-400">Try adjusting your search query</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/80 sticky top-0 border-b border-gray-100 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3 w-12 text-center">
                          <input 
                            type="checkbox" 
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            checked={filteredList.length > 0 && selectedIds.length === filteredList.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds(filteredList.map(i => i.id));
                              } else {
                                setSelectedIds([]);
                              }
                            }}
                          />
                        </th>
                        <th className="px-4 py-3">Profile / Shop</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredList.map((item) => {
                        const isSelected = selectedIds.includes(item.id);
                        return (
                          <tr 
                            key={item.id} 
                            className={`hover:bg-indigo-50/50 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}
                            onClick={() => toggleSelection(item.id)}
                          >
                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => toggleSelection(item.id)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-gray-900">{item.shop_name || item.name || 'Unnamed Account'}</p>
                              <p className="text-xs text-gray-400 font-mono truncate max-w-[200px]">ID: {item.id}</p>
                            </td>
                            <td className="px-4 py-3 text-xs">
                              <p className="text-gray-700 font-medium">{item.email}</p>
                              {item.phone && <p className="text-gray-400 mt-0.5">{item.phone}</p>}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                item.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                targetType === 'single_vendor' ? 'bg-orange-100 text-orange-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {item.role || 'Vendor'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            /* Mode 2: Broadcast Mode & History Ledger */
            <div className="space-y-6">
              {/* Broadcast Mode Info Card */}
              <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl border border-indigo-200/60 p-5 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0 text-indigo-600 border border-indigo-100">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-indigo-950">Broadcast Audience Scope</h3>
                      <span className="px-2 py-0.5 bg-indigo-200/60 text-indigo-900 rounded text-[11px] font-bold uppercase">
                        {targetType === 'all' ? 'All Platform' : targetType === 'all_users' ? 'Shoppers' : 'Merchants'}
                      </span>
                    </div>
                    <p className="text-indigo-800 text-xs mt-0.5">
                      This notification will be dispatched to{' '}
                      <strong className="underline decoration-indigo-400">
                        {targetType === 'all' 
                          ? `all ${stats.customerCount} customers and ${stats.vendorCount} merchants` 
                          : targetType === 'all_users' 
                          ? `all ${stats.customerCount} customers` 
                          : `all ${stats.vendorCount} verified merchants`}
                      </strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* History Ledger Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>Previously Sent Notifications</span>
                    </h3>
                    <p className="text-xs text-gray-500">Record of historical platform dispatches</p>
                  </div>

                  {/* History Filter Pills */}
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs overflow-x-auto">
                    {['all', 'info', 'warning', 'event', 'alert'].map(type => (
                      <button
                        key={type}
                        onClick={() => setHistoryFilter(type)}
                        className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                          historyFilter === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* History Search Sub-bar */}
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Filter history by title or text..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* History Items Feed */}
                <div className="p-5 space-y-3.5 max-h-[500px] overflow-y-auto">
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-12 px-4 space-y-2">
                      <Bell className="w-8 h-8 text-gray-300 mx-auto" />
                      <p className="text-sm font-semibold text-gray-700">No sent notifications found</p>
                      <p className="text-xs text-gray-400">Notifications sent from the composer will appear here in chronological order.</p>
                    </div>
                  ) : (
                    filteredHistory.map(notif => {
                      const style = getTypeStyle(notif.type);
                      const TypeIcon = style.icon;

                      return (
                        <div 
                          key={notif.id} 
                          className="p-4 border border-gray-100 rounded-2xl bg-white hover:border-indigo-200 hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`p-1.5 rounded-lg ${style.bg}`}>
                                <TypeIcon className="w-3.5 h-3.5" />
                              </span>
                              <h4 className="font-bold text-gray-900 text-sm">{notif.title}</h4>
                            </div>
                            <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
                              {new Date(notif.created_at).toLocaleString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <p className="text-gray-600 text-xs leading-relaxed mb-3 pl-8">
                            {notif.message}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-50 pl-8">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider ${style.badge}`}>
                                {notif.type}
                              </span>
                              <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-full capitalize">
                                To: {notif.recipient_type?.replace(/_/g, ' ')}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleDuplicate(notif)}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Duplicate into composer"
                              >
                                {copiedId === notif.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteHistory(notif.id, notif.title)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove from history"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}