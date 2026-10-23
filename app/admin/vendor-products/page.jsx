'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Package,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Store,
  Tag,
  ImageIcon,
} from 'lucide-react';

const TABS = [
  { key: 'approved', label: '✅ Approved' },
  { key: 'pending',  label: '⏳ Pending'  },
  { key: 'rejected', label: '❌ Rejected' },
  { key: '',         label: 'All'          },
];

const STATUS_BADGE = {
  pending:  'bg-amber-100 text-amber-700 border border-amber-200',
  approved: 'bg-green-100 text-green-700 border border-green-200',
  rejected: 'bg-red-100   text-red-700   border border-red-200',
};

export default function AdminVendorProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('approved');
  const [search, setSearch] = useState('');
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState(null);
  const [total, setTotal] = useState(0);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (tab) params.set('approval_status', tab);
      const res = await fetch(`/api/admin/vendor-product-requests?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setTotal(data.pagination?.total || 0);
      } else {
        showToast('Failed to load products', 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [tab]);
  const fetchVendors = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/vendors?limit=100', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { 
    fetchProducts(); 
    fetchVendors();
  }, [fetchProducts, fetchVendors]);

  const handleAction = async (productId, action) => {
    setActionLoading((prev) => ({ ...prev, [productId]: action }));
    try {
      const res = await fetch(`/api/admin/vendor-products/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Product ${action}d!`);
        setProducts((prev) =>
          prev.map((p) => p.id === productId ? { ...p, approval_status: data.approval_status } : p)
        );
      } else {
        showToast(data.error || 'Action failed', 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setActionLoading((prev) => { const n = { ...prev }; delete n[productId]; return n; });
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || 
                          p.vendor?.shop_name?.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesVendor = selectedVendor ? p.vendor_id === selectedVendor : true;
    return matchesSearch && matchesVendor;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Products</h1>
          <p className="text-gray-500 text-sm mt-1">
            All products uploaded by vendors — {total} total
          </p>
        </div>
        <button
          onClick={fetchProducts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs + Search + Vendor Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 text-gray-700 font-medium"
          >
            <option value="">All Vendors</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.shop_name}</option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Approval</th>
              <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  <p className="text-gray-400 mt-2 text-sm">Loading...</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-16 text-center">
                  <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No products found</p>
                  {search && <p className="text-gray-400 text-xs mt-1">Try clearing your search</p>}
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const isLoading = actionLoading[product.id];
                const isApproved = product.approval_status === 'approved';
                const isRejected = product.approval_status === 'rejected';
                const isPending  = product.approval_status === 'pending';

                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    {/* Product */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {product.featured_image || product.images?.[0] ? (
                          <img
                            src={product.featured_image || product.images[0]}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          {product.sku && <p className="text-xs text-gray-400">SKU: {product.sku}</p>}
                          {product.category && (
                            <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              <Tag className="w-2.5 h-2.5" />{product.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Vendor */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {product.vendor?.shop_name || `Vendor ${product.vendor_id?.slice(0, 8)}`}
                          </p>
                          {product.vendor?.owner_name && <p className="text-xs text-gray-400">{product.vendor.owner_name}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">৳{Number(product.price).toLocaleString()}</p>
                      {product.original_price > product.price && (
                        <p className="text-xs text-gray-400 line-through">৳{Number(product.original_price).toLocaleString()}</p>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-5 py-4">
                      <span className={`font-medium ${product.stock <= 0 ? 'text-red-600' : product.stock < 10 ? 'text-amber-600' : 'text-gray-700'}`}>
                        {product.stock ?? '—'}
                      </span>
                    </td>

                    {/* Approval */}
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[product.approval_status] || STATUS_BADGE.pending}`}>
                        {isPending ? '⏳ Pending' : isApproved ? '✅ Approved' : '❌ Rejected'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(product.created_at).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {!isApproved && (
                          <button
                            onClick={() => handleAction(product.id, 'approve')}
                            disabled={!!isLoading}
                            className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold rounded-lg flex items-center gap-1 disabled:opacity-50"
                          >
                            {isLoading === 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Approve
                          </button>
                        )}
                        {!isRejected && (
                          <button
                            onClick={() => handleAction(product.id, 'reject')}
                            disabled={!!isLoading}
                            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold rounded-lg flex items-center gap-1 disabled:opacity-50"
                          >
                            {isLoading === 'reject' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                            {isApproved ? 'Revoke' : 'Reject'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
