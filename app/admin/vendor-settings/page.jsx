'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Save, 
  ShieldCheck, 
  Percent, 
  Bell, 
  Store, 
  Wallet, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  HelpCircle, 
  Clock, 
  RefreshCw, 
  Check, 
  Sliders, 
  CreditCard, 
  Package, 
  Users, 
  Tag, 
  Info,
  Lock,
  Layers
} from 'lucide-react';

export default function VendorSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Form State
  const [settings, setSettings] = useState({
    commission_rate: 10,
    min_payout_amount: 1000,
    payout_frequency: 'weekly',
    holding_period_days: 3,
    require_product_approval: true,
    require_vendor_approval: true,
    allow_vendor_coupons: true,
    auto_approve_price_updates: false,
    allow_vendor_messaging: true,
    supported_payout_methods: ['bkash', 'nagad', 'bank'],
    notify_admin_on_new_vendor: true,
    notify_admin_on_payout_request: true
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/vendor-settings', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.settings) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      showToast('Using default settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/vendor-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (res.ok) {
        showToast(json.message || 'Global vendor settings saved successfully!');
      } else {
        showToast(json.error || 'Failed to save settings', 'error');
      }
    } catch (err) {
      console.error('Save error:', err);
      showToast('Network error while saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleMethod = (method) => {
    setSettings(prev => {
      const current = prev.supported_payout_methods || [];
      const updated = current.includes(method)
        ? current.filter(m => m !== method)
        : [...current, method];
      return { ...prev, supported_payout_methods: updated };
    });
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Toast Alert */}
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
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Global Marketplace & Vendor Policy
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Vendor Management Settings</h1>
            <p className="text-blue-100 text-sm sm:text-base max-w-3xl font-light">
              Configure default marketplace commission rates, product moderation approval workflows, payout settlement schedules, and merchant permissions across Stellar Mart BD.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={fetchSettings}
              disabled={loading}
              className="p-3 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl backdrop-blur-md transition-all duration-150 flex items-center gap-2 text-xs font-bold"
              title="Reload settings"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 rounded-xl font-bold text-xs shadow-md transition-all duration-150 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Controls (Left 2 cols) and Live Summary (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Settings Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Default Commission & Revenue Splits */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Default Commission Rules</h3>
                  <p className="text-xs text-gray-500">Platform take-rate and vendor revenue split configurations</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                {settings.commission_rate}% Platform Share
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  Global Commission Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.commission_rate}
                    onChange={(e) => setSettings({ ...settings, commission_rate: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-400 pointer-events-none">
                    %
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Default fee automatically applied to all newly approved vendors.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  Minimum Payout Threshold (৳)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={settings.min_payout_amount}
                    onChange={(e) => setSettings({ ...settings, min_payout_amount: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-400 pointer-events-none">
                    ৳ BDT
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Minimum balance a vendor must accumulate before requesting a payout.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  Holding Period After Delivery (Days)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={settings.holding_period_days}
                    onChange={(e) => setSettings({ ...settings, holding_period_days: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                    Days
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Buffer days to allow customer return/refund window before funds mature.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  Payout Settlement Cycle
                </label>
                <select
                  value={settings.payout_frequency}
                  onChange={(e) => setSettings({ ...settings, payout_frequency: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                >
                  <option value="daily">Daily Settlements</option>
                  <option value="weekly">Weekly (Every Monday)</option>
                  <option value="biweekly">Bi-Weekly (Every 15 Days)</option>
                  <option value="monthly">Monthly</option>
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Scheduled dispatch cycle for processed vendor balances.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Approval & Moderation Workflows */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Approval & Moderation Workflows</h3>
                <p className="text-xs text-gray-500">Quality control and security gates for products and merchants</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Product Approval */}
              <label className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.require_product_approval}
                  onChange={(e) => setSettings({ ...settings, require_product_approval: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-gray-800 block">
                    Require Admin Approval for New Products
                  </span>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Products submitted by vendors will remain in "Pending Review" status until an admin manually verifies description, price, and authenticity.
                  </p>
                </div>
              </label>

              {/* Vendor Approval */}
              <label className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.require_vendor_approval}
                  onChange={(e) => setSettings({ ...settings, require_vendor_approval: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-gray-800 block">
                    Require Verification for New Vendor Registrations
                  </span>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    New sellers registering on the portal cannot publish products until trade licenses, NID, and contact details are approved.
                  </p>
                </div>
              </label>

              {/* Price Updates Auto-Approve */}
              <label className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.auto_approve_price_updates}
                  onChange={(e) => setSettings({ ...settings, auto_approve_price_updates: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-gray-800 block">
                    Auto-Approve Minor Price & Stock Updates
                  </span>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Allow already approved live products to instantly update their inventory stock count without re-entering review queue.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Card 3: Merchant Privileges & Supported Payouts */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Supported Payout Channels & Privileges</h3>
                <p className="text-xs text-gray-500">Allowed disbursement gateways and vendor feature toggles</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                Allowed Payout Gateways
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'bkash', label: 'bKash' },
                  { id: 'nagad', label: 'Nagad' },
                  { id: 'bank', label: 'Bank Transfer' },
                  { id: 'rocket', label: 'Rocket' }
                ].map(item => {
                  const isChecked = (settings.supported_payout_methods || []).includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleMethod(item.id)}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                        isChecked 
                          ? 'bg-purple-50 border-purple-300 text-purple-700 ring-2 ring-purple-500/20' 
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isChecked ? <Check className="w-4 h-4 text-purple-600" /> : <div className="w-4 h-4 border border-gray-300 rounded" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allow_vendor_coupons}
                  onChange={(e) => setSettings({ ...settings, allow_vendor_coupons: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Vendor Custom Promo Codes</span>
                  <span className="text-[11px] text-gray-500">Permit vendors to launch coupons for their own shop products.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allow_vendor_messaging}
                  onChange={(e) => setSettings({ ...settings, allow_vendor_messaging: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Vendor-Customer Chat</span>
                  <span className="text-[11px] text-gray-500">Enable in-app direct messaging between buyers and vendors.</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Live Policy Summary & Quick Links */}
        <div className="space-y-6">
          {/* Card: Live Marketplace Policy Preview */}
          <div className="bg-gradient-to-br from-gray-900 to-slate-900 text-white rounded-2xl p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                Active Store Policy
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Default Commission</span>
                <span className="text-lg font-black text-white">{settings.commission_rate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Vendor Net Share</span>
                <span className="text-lg font-black text-emerald-400">{100 - settings.commission_rate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Min. Payout Threshold</span>
                <span className="text-sm font-bold text-white flex items-center gap-0.5">
                  <span className="text-emerald-400 font-extrabold">৳</span>
                  <span>{Number(settings.min_payout_amount || 0).toLocaleString()}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Holding Escrow Period</span>
                <span className="text-sm font-bold text-white">{settings.holding_period_days} Days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Product Moderation</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  settings.require_product_approval 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {settings.require_product_approval ? 'Required' : 'Instant Publish'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Updating Policy...' : 'Apply & Save Settings'}</span>
              </button>
            </div>
          </div>

          {/* Card: Quick Navigation Links */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Vendor Operations Hub
            </h4>

            <div className="space-y-2">
              <Link
                href="/admin/vendors"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-colors group"
              >
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <Store className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                  <span>All Registered Vendors</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              </Link>

              <Link
                href="/admin/vendor-product-requests"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 transition-colors group"
              >
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <Package className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                  <span>Pending Product Requests</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
              </Link>

              <Link
                href="/admin/vendor-revenue"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700 transition-colors group"
              >
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <Wallet className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                  <span>Vendor Revenue & Payouts</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
              </Link>
            </div>
          </div>

          {/* Card: Important Guidance Note */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5 text-blue-900 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Multi-Vendor Guidance</span>
            </div>
            <p className="text-xs text-blue-700/90 leading-relaxed font-light">
              Changing the global commission rate sets the default fee for newly registered merchants. Individual vendors can still be granted custom negotiated rates in their profile settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
