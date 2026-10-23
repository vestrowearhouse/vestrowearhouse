'use client';

import { useState, useEffect } from 'react';
import {
  Flame,
  Zap,
  Calendar,
  Clock,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  RefreshCw,
  Gift,
  ArrowRight,
  X,
  TrendingUp,
  Percent
} from 'lucide-react';

export default function VendorCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [discountPercent, setDiscountPercent] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vendor/campaigns', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      showToast('Error loading campaigns', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!selectedCampaign || !selectedProductId || isSubmitting) return;

    const chosenProduct = products.find(p => p.id === selectedProductId);
    const originalPrice = chosenProduct ? Number(chosenProduct.price) : 0;
    const campaignPrice = Math.round(originalPrice * (1 - discountPercent / 100));

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/vendor/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          campaignId: selectedCampaign.id,
          productId: selectedProductId,
          campaignPrice,
          discountPercent
        })
      });

      if (res.ok) {
        showToast(`Product enrolled in "${selectedCampaign.title}"!`);
        setSelectedCampaign(null);
        setSelectedProductId('');
        fetchCampaigns();
      } else {
        showToast('Failed to enroll product', 'error');
      }
    } catch {
      showToast('Network error during campaign enrollment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const chosenProduct = products.find(p => p.id === selectedProductId);
  const calculatedCampaignPrice = chosenProduct
    ? Math.round(Number(chosenProduct.price) * (1 - discountPercent / 100))
    : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
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
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md">
              Promotions & Growth
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Flame className="w-7 h-7 text-amber-500 fill-amber-500" />
            <span>Marketplace Campaigns & Flash Sales</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Enroll your products into high-traffic seasonal events, flash deals, and homepage showcases to supercharge sales.
          </p>
        </div>

        <button
          onClick={fetchCampaigns}
          className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 active:scale-95 border border-gray-200 rounded-xl font-bold text-xs text-gray-700 transition-all flex items-center gap-2 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Campaigns</span>
        </button>
      </div>

      {/* Campaign KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Campaigns</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{campaigns.length}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5 fill-amber-500" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Enrolled Products</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {campaigns.reduce((sum, c) => sum + (c.enrolled_products_count || 0), 0)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Commission Subsidy</p>
            <p className="text-2xl font-black text-blue-600 mt-1">Up to 3% Off</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Gift className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs text-gray-500">Loading marketplace campaigns...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-white rounded-3xl border border-gray-100 shadow-xs hover:shadow-lg transition-all flex flex-col overflow-hidden group"
            >
              {/* Banner Header */}
              <div className="h-44 relative bg-gray-100 overflow-hidden">
                <img
                  src={camp.banner}
                  alt={camp.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                    camp.status === 'live'
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-indigo-600 text-white'
                  }`}>
                    {camp.status === 'live' ? '🔥 Live Now' : 'Registration Open'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-gray-900 backdrop-blur-xs">
                    {camp.badge}
                  </span>
                </div>
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-lg font-black text-white">{camp.title}</h3>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-gray-600 leading-relaxed">
                  {camp.description}
                </p>

                <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Percent className="w-3.5 h-3.5 text-amber-500" />
                      Min Discount:
                    </span>
                    <strong className="text-gray-900">{camp.min_discount}% off</strong>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Gift className="w-3.5 h-3.5 text-emerald-500" />
                      Perk / Reward:
                    </span>
                    <strong className="text-emerald-700">{camp.commission_discount}</strong>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      Period:
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {new Date(camp.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })} – {new Date(camp.end_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">
                    Enrolled: <strong className="text-gray-900">{camp.enrolled_products_count}</strong>
                  </span>

                  <button
                    onClick={() => {
                      setSelectedCampaign(camp);
                      setDiscountPercent(camp.min_discount || 15);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Join Campaign</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Campaign Enrollment Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Campaign Nomination</span>
                <h3 className="text-lg font-black text-gray-900 mt-0.5">{selectedCampaign.title}</h3>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnroll} className="space-y-4">
              {/* Product Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Select Product to Nominate
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  required
                >
                  <option value="">-- Choose from your product inventory --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock || 0} | ৳{Number(p.price || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Discount Percentage */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Promotional Discount: {discountPercent}%
                </label>
                <input
                  type="range"
                  min={selectedCampaign.min_discount || 10}
                  max={70}
                  step={5}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>Min: {selectedCampaign.min_discount}%</span>
                  <span>50%</span>
                  <span>Max: 70%</span>
                </div>
              </div>

              {/* Price Calculation Card */}
              {chosenProduct && (
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500 block">Regular Selling Price:</span>
                    <strong className="text-gray-900 font-black text-sm">৳{Number(chosenProduct.price).toLocaleString()}</strong>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                  <div className="text-right">
                    <span className="text-blue-700 font-bold block">Campaign Sale Price:</span>
                    <strong className="text-blue-700 font-black text-base">৳{calculatedCampaignPrice.toLocaleString()}</strong>
                  </div>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedCampaign(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedProductId || isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Confirm Enrollment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
