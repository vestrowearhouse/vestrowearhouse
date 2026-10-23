'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { 
  Zap, 
  Save, 
  Plus, 
  Trash2, 
  Clock, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Flame, 
  ChevronRight,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function AdminFlashSalePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Config state
  const [enabled, setEnabled] = useState(true);
  const [title, setTitle] = useState('Flash Sale');
  const [endDate, setEndDate] = useState('');
  const [items, setItems] = useState([]);

  // Available catalog products for picker
  const [allProducts, setAllProducts] = useState([]);
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);

  // Live countdown preview
  const [countdown, setCountdown] = useState({ hours: '00', minutes: '00', seconds: '00' });

  // Fetch initial config & catalog products
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/flash-sale?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();

      if (data.config) {
        setEnabled(data.config.enabled !== false);
        setTitle(data.config.title || 'Flash Sale');
        
        // Format ISO date string for datetime-local input
        if (data.config.endDate) {
          const d = new Date(data.config.endDate);
          const formatted = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setEndDate(formatted);
        } else {
          // Default to 24 hours from now
          const tomorrow = new Date(Date.now() + 86400000);
          setEndDate(tomorrow.toISOString().slice(0, 16));
        }

        setItems(data.config.items || []);
      }

      if (data.products) {
        setAllProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to load flash sale config:', err);
      setMessage({ text: 'Failed to load configuration.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Update live preview countdown
  useEffect(() => {
    if (!endDate) return;

    const updateTimer = () => {
      const target = new Date(endDate).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setCountdown({
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  // Filter available products in picker modal
  const selectableProducts = useMemo(() => {
    const existingIds = new Set(items.map((i) => i.productId));
    return allProducts
      .filter((p) => {
        const id = p._id || p.id;
        if (existingIds.has(id)) return false;
        if (!searchProductQuery.trim()) return true;
        return p.name?.toLowerCase().includes(searchProductQuery.toLowerCase().trim()) ||
               p.slug?.toLowerCase().includes(searchProductQuery.toLowerCase().trim());
      })
      .slice(0, 20);
  }, [allProducts, items, searchProductQuery]);

  const handleAddProduct = (product) => {
    const pId = product._id || product.id;
    const price = Number(product.sellingPrice || product.price || 0);
    const originalPrice = Number(product.regularPrice || product.originalPrice || Math.round(price * 1.25));
    const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 10;

    const newItem = {
      productId: pId,
      name: product.name,
      slug: product.slug,
      image: (() => {
        if (product.featuredImage) return product.featuredImage;
        let imgs = product.images;
        if (imgs) {
          if (typeof imgs === 'string') {
            try { imgs = JSON.parse(imgs); } catch(e) { return imgs; }
          }
          if (Array.isArray(imgs) && imgs[0]) return imgs[0];
        }
        return product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80';
      })(),
      originalPrice,
      flashPrice: price,
      stockLeft: 6,
      discountPercent: discount,
    };

    setItems((prev) => [...prev, newItem]);
    setShowProductModal(false);
    setSearchProductQuery('');
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // Recalculate discount percent if prices changed
      if (field === 'flashPrice' || field === 'originalPrice') {
        const flash = Number(item.flashPrice || 0);
        const orig = Number(item.originalPrice || 0);
        if (orig > flash && orig > 0) {
          item.discountPercent = Math.round(((orig - flash) / orig) * 100);
        }
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const targetIso = endDate ? new Date(endDate).toISOString() : new Date().toISOString();

      const res = await fetch('/api/admin/flash-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          title,
          endDate: targetIso,
          items,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: 'Flash Sale configuration updated successfully!', type: 'success' });
      } else {
        setMessage({ text: data.error || 'Failed to update settings', type: 'error' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ text: 'Network error occurred while saving.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-500/20">
            <Zap className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
              Flash Sale Campaign
              {enabled ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                  Active
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  Disabled
                </span>
              )}
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              Control the homepage Flash Sale carousel, live countdown timer, and featured sale items.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#f85606] hover:bg-[#e04c00] text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* Status Messages */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 2. Campaign Timing & Controls Card */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Timing Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Campaign Deadline & Visibility
          </h2>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <span className="font-semibold text-sm text-gray-800 block">Flash Sale Active</span>
              <span className="text-xs text-gray-500">Show or hide the Flash Sale section on the mobile homepage</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={enabled} 
                onChange={(e) => setEnabled(e.target.checked)} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f85606]"></div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Campaign End Date & Time
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 rounded-2xl text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Live Customer Preview</span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">Mobile Banner Preview</span>
            </div>
            <h3 className="text-lg font-black text-white">How Customers See the Timer</h3>
            <p className="text-xs text-gray-400 mt-1">Calculated in real-time based on the deadline set above.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 mt-4 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-lg font-black text-white">Fla</span>
              <span className="text-lg font-black text-[#f85606]">⚡</span>
              <span className="text-lg font-black text-white">h Sale</span>
            </div>
            
            {/* Live Timer Ticker Preview */}
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="bg-[#f85606] text-white px-2 py-1 rounded-md shadow-sm">{countdown.hours}</span>
              <span className="text-[#f85606] font-bold">:</span>
              <span className="bg-[#f85606] text-white px-2 py-1 rounded-md shadow-sm">{countdown.minutes}</span>
              <span className="text-[#f85606] font-bold">:</span>
              <span className="bg-[#f85606] text-white px-2 py-1 rounded-md shadow-sm">{countdown.seconds}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Flash Sale Selected Products List */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Flash Sale Items ({items.length})
            </h2>
            <p className="text-xs text-gray-500">
              Customize prices, discount badges, and stock count pills for each flash item.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowProductModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl border border-blue-200 transition"
          >
            <Plus className="w-4 h-4" />
            Add Products
          </button>
        </div>

        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">Regular Price</th>
                  <th className="py-3 px-3">Flash Price (৳)</th>
                  <th className="py-3 px-3">Stock Left Pill</th>
                  <th className="py-3 px-3">Preview Badge</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {items.map((item, index) => (
                  <tr key={item.productId || index} className="hover:bg-gray-50/50">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden relative flex-shrink-0 border border-gray-200">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="max-w-xs">
                          <span className="font-bold text-gray-900 line-clamp-1 text-xs">{item.name}</span>
                          <span className="text-[10px] text-gray-400">ID: {String(item.productId).slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        value={item.originalPrice}
                        onChange={(e) => handleItemChange(index, 'originalPrice', Number(e.target.value))}
                        className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        value={item.flashPrice}
                        onChange={(e) => handleItemChange(index, 'flashPrice', Number(e.target.value))}
                        className="w-24 px-2 py-1.5 border border-orange-300 rounded-lg font-bold text-orange-600 text-xs focus:ring-1 focus:ring-orange-400"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400">🔥</span>
                        <input
                          type="number"
                          value={item.stockLeft}
                          min={1}
                          onChange={(e) => handleItemChange(index, 'stockLeft', Number(e.target.value))}
                          className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                        />
                        <span className="text-[10px] text-gray-500">Left</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded shadow-xs">
                        SAVE {item.discountPercent || 15}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center">
            <Zap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-600">No products added to Flash Sale yet.</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Click "Add Products" above to pick items from your catalog.</p>
          </div>
        )}
      </div>

      {/* 4. Product Picker Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Select Product for Flash Sale</h3>
                <p className="text-xs text-gray-500">Pick any product from your active catalog</p>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Search */}
            <div className="p-3 bg-gray-50 border-b border-gray-100">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchProductQuery}
                  onChange={(e) => setSearchProductQuery(e.target.value)}
                  placeholder="Search product by name..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Modal Products List */}
            <div className="p-2 overflow-y-auto divide-y divide-gray-100 flex-1">
              {selectableProducts.length > 0 ? (
                selectableProducts.map((prod) => {
                  const pId = prod._id || prod.id;
                  const price = prod.sellingPrice || prod.price || 0;
                  const img = (() => {
                    if (prod.featuredImage) return prod.featuredImage;
                    let imgs = prod.images;
                    if (imgs) {
                      if (typeof imgs === 'string') {
                        try { imgs = JSON.parse(imgs); } catch(e) { return imgs; }
                      }
                      if (Array.isArray(imgs) && imgs[0]) return imgs[0];
                    }
                    return prod.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80';
                  })();

                  return (
                    <div key={pId} className="flex items-center justify-between p-2.5 hover:bg-blue-50/50 rounded-xl transition">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden relative flex-shrink-0">
                          <Image src={img} alt={prod.name} fill className="object-cover" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-gray-900 line-clamp-1">{prod.name}</h4>
                          <span className="text-[11px] text-gray-500 font-semibold">৳{Number(price).toLocaleString()}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddProduct(prod)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition active:scale-95"
                      >
                        Select
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-gray-400">
                  No unselected products found matching your search.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
