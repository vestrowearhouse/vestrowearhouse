'use client';

import { useState, useEffect } from 'react';
import { 
  Truck, 
  Loader2, 
  AlertCircle, 
  Save, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Package, 
  DollarSign,
  HelpCircle
} from 'lucide-react';

export default function VendorShippingPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [shipping, setShipping] = useState({
    inside_dhaka_rate: 60,
    outside_dhaka_rate: 120,
    express_shipping_rate: 150,
    free_shipping_threshold: 2000,
    processing_time: '1-2 Days',
    allow_cash_on_delivery: true,
    allow_pickup: true,
    courier_partners: ['Steadfast Courier', 'Pathao Logistics'],
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchShipping = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/vendor/shipping', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.shipping) setShipping(data.shipping);
        }
      } catch (err) {
        console.error('Error fetching shipping:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchShipping();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/vendor/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(shipping),
      });

      if (!res.ok) throw new Error('Failed to update shipping settings');
      showToast('Delivery and shipping rates saved successfully!');
    } catch (err) {
      showToast(err.message || 'Saving error', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCourier = (courier) => {
    setShipping(prev => {
      const current = prev.courier_partners || [];
      const updated = current.includes(courier)
        ? current.filter(c => c !== courier)
        : [...current, courier];
      return { ...prev, courier_partners: updated };
    });
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-xs font-bold text-gray-500">Loading store delivery rules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 ${
          toast.type === 'error' ? 'bg-red-900 text-white border-red-700' : 'bg-emerald-900 text-white border-emerald-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-300" /> : <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md">
              Order Fulfillment
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Truck className="w-7 h-7 text-emerald-600" />
            <span>Shipping & Delivery Settings</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure parcel delivery charges across Bangladesh, delivery turnaround times, and supported courier services.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Standard Regional Rates */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm">Domestic Regional Delivery Charges</h3>
              <p className="text-xs text-gray-500">Fixed shipping fees charged to customers at checkout based on destination.</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Inside Dhaka City (৳) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                <input
                  type="number"
                  required
                  min="0"
                  value={shipping.inside_dhaka_rate}
                  onChange={(e) => setShipping({ ...shipping, inside_dhaka_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Standard rate for deliveries within Dhaka metropolitan area.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Outside Dhaka City (৳) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                <input
                  type="number"
                  required
                  min="0"
                  value={shipping.outside_dhaka_rate}
                  onChange={(e) => setShipping({ ...shipping, outside_dhaka_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">All other divisions and districts across Bangladesh.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Express / Same-Day Delivery Rate (৳)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                <input
                  type="number"
                  min="0"
                  value={shipping.express_shipping_rate}
                  onChange={(e) => setShipping({ ...shipping, express_shipping_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Free Shipping Threshold (৳)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                <input
                  type="number"
                  min="0"
                  value={shipping.free_shipping_threshold}
                  onChange={(e) => setShipping({ ...shipping, free_shipping_threshold: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Orders above this amount qualify for automated free delivery.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Order Turnaround & Courier Services */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm">Processing Time & Integrated Couriers</h3>
              <p className="text-xs text-gray-500">Fulfillment turnaround SLA and preferred logistics courier services.</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Average Dispatch & Packaging Time
              </label>
              <select
                value={shipping.processing_time}
                onChange={(e) => setShipping({ ...shipping, processing_time: e.target.value })}
                className="w-full max-w-md px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="Same Day (within 6 hours)">Same Day (within 6 hours)</option>
                <option value="1-2 Days">1-2 Days (Standard)</option>
                <option value="2-3 Days">2-3 Days</option>
                <option value="3-5 Days (Custom/Pre-order)">3-5 Days (Custom / Pre-order)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                Supported Logistics Partners
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {['Steadfast Courier', 'Pathao Logistics', 'RedX Delivery', 'eCourier BD', 'Paperfly', 'Sundarban Courier'].map((courier) => {
                  const isChecked = (shipping.courier_partners || []).includes(courier);
                  return (
                    <button
                      key={courier}
                      type="button"
                      onClick={() => toggleCourier(courier)}
                      className={`p-3.5 rounded-2xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                        isChecked 
                          ? 'bg-blue-50/70 border-blue-300 text-blue-800 shadow-2xs' 
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span>{courier}</span>
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment & Pickup Toggles */}
            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3.5 bg-gray-50/60 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100/60">
                <input
                  type="checkbox"
                  checked={shipping.allow_cash_on_delivery}
                  onChange={(e) => setShipping({ ...shipping, allow_cash_on_delivery: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Cash on Delivery (COD)</span>
                  <span className="text-[11px] text-gray-500">Allow customers to pay cash when product is delivered.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 bg-gray-50/60 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100/60">
                <input
                  type="checkbox"
                  checked={shipping.allow_pickup}
                  onChange={(e) => setShipping({ ...shipping, allow_pickup: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Direct Store Pickup</span>
                  <span className="text-[11px] text-gray-500">Customers can pick up packages directly from your physical outlet.</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving Changes...' : 'Save & Publish Shipping Rules'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
