'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Store,
  Tag,
  ImageIcon,
} from 'lucide-react';

const APPROVAL_TABS = [
  { key: 'pending',  label: '⏳ Pending',  color: 'text-amber-700  bg-amber-50  border-amber-200' },
  { key: 'approved', label: '✅ Approved', color: 'text-green-700  bg-green-50  border-green-200' },
  { key: 'rejected', label: '❌ Rejected', color: 'text-red-700    bg-red-50    border-red-200' },
  { key: '',         label: 'All',          color: 'text-gray-700   bg-gray-50   border-gray-200' },
];

const STATUS_BADGE = {
  pending:  'bg-amber-100 text-amber-700 border border-amber-200',
  approved: 'bg-green-100 text-green-700 border border-green-200',
  rejected: 'bg-red-100   text-red-700   border border-red-200',
};

function ProductDetail({ product, expanded }) {
  if (!expanded) return null;
  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs space-y-2">
      {product.description && (
        <div><span className="font-semibold text-gray-500">Description: </span><span className="text-gray-700">{product.description}</span></div>
      )}
      {product.brand && (
        <div><span className="font-semibold text-gray-500">Brand: </span><span className="text-gray-700">{product.brand}</span></div>
      )}
      {product.sku && (
        <div><span className="font-semibold text-gray-500">SKU: </span><span className="text-gray-700">{product.sku}</span></div>
      )}
      {product.category && (
        <div><span className="font-semibold text-gray-500">Category: </span><span className="text-gray-700">{product.category}</span></div>
      )}
      {product.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 items-center">
          <span className="font-semibold text-gray-500">Tags: </span>
          {product.tags.map((t, i) => <span key={i} className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-600">{t}</span>)}
        </div>
      )}
      {product.images?.length > 0 && (
        <div>
          <span className="font-semibold text-gray-500">Images: </span>
          <div className="flex gap-2 mt-1 flex-wrap">
            {product.images.slice(0, 5).map((url, i) => (
              <img key={i} src={url} alt={`img-${i}`} className="w-16 h-16 object-cover rounded-lg border border-gray-200" onError={(e) => { e.target.style.display = 'none'; }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminVendorProductRequests() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState({});
  const [noteMap, setNoteMap] = useState({});
  const [showNoteFor, setShowNoteFor] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = tab ? `?approval_status=${tab}` : '';
      const res = await fetch(`/api/admin/vendor-product-requests${params}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        showToast('Failed to fetch products', 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleAction = async (productId, action) => {
    // ── Optimistic update: remove immediately so the UI responds instantly ──
    // Store the removed product so we can roll back if the API fails.
    let removedProduct = null;
    setProducts((prev) => {
      removedProduct = prev.find((p) => p.id === productId) || null;
      return prev.filter((p) => p.id !== productId);
    });

    setActionLoading((prev) => ({ ...prev, [productId]: action }));
    const admin_note = noteMap[productId] || null;

    try {
      const res = await fetch(`/api/admin/vendor-products/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, admin_note }),
      });
      const data = await res.json();

      if (res.ok) {
        showToast(`Product ${action}d successfully!`);
        setShowNoteFor(null);
        setNoteMap((prev) => { const n = { ...prev }; delete n[productId]; return n; });
        // Background re-fetch to sync server state (doesn't block the UI)
        fetchProducts();
      } else {
        // Rollback: put the product back where it was
        if (removedProduct) {
          setProducts((prev) => {
            // Re-insert in original position by putting at front
            // (fetchProducts will correct order on next load)
            return [removedProduct, ...prev];
          });
        }
        showToast(data.error || `Failed to ${action} product`, 'error');
      }
    } catch (err) {
      // Rollback on network error
      if (removedProduct) {
        setProducts((prev) => [removedProduct, ...prev]);
      }
      showToast('Network error: ' + err.message, 'error');
    } finally {
      setActionLoading((prev) => { const n = { ...prev }; delete n[productId]; return n; });
    }
  };

  const counts = { pending: 0, approved: 0, rejected: 0, '': 0 };
  // counts are based on filtered list — we just show what's loaded

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Product Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Review and approve or reject products submitted by vendors</p>
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

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {APPROVAL_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Price / Stock</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  <p className="text-gray-400 mt-2 text-sm">Loading...</p>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-16 text-center">
                  <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No {tab || ''} products found</p>
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const isPending = product.approval_status === 'pending';
                const isLoading = actionLoading[product.id];
                const isExpanded = expandedId === product.id;

                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors align-top">
                    {/* Product */}
                    <td className="px-5 py-4 max-w-xs">
                      <div className="flex gap-3 items-start">
                        {product.featured_image || product.images?.[0] ? (
                          <img
                            src={product.featured_image || product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                          {product.name_bn && <p className="text-xs text-gray-400 mt-0.5">{product.name_bn}</p>}
                          {product.brand && <p className="text-xs text-gray-500 mt-0.5">Brand: {product.brand}</p>}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : product.id)}
                            className="flex items-center gap-1 text-xs text-blue-600 mt-1.5 hover:text-blue-700"
                          >
                            <Eye className="w-3 h-3" />
                            {isExpanded ? 'Hide' : 'View'} details
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          <ProductDetail product={product} expanded={isExpanded} />

                          {/* Admin note input */}
                          {isPending && showNoteFor === product.id && (
                            <div className="mt-2">
                              <textarea
                                rows="2"
                                value={noteMap[product.id] || ''}
                                onChange={(e) => setNoteMap((prev) => ({ ...prev, [product.id]: e.target.value }))}
                                placeholder="Optional note to vendor..."
                                className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Vendor */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {product.vendor?.shop_name || `Vendor ${product.vendor_id?.slice(0, 8)}`}
                          </p>
                          {product.vendor?.owner_name && <p className="text-xs text-gray-400">{product.vendor.owner_name}</p>}
                          {product.vendor?.email && <p className="text-xs text-gray-400">{product.vendor.email}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Price / Stock */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">৳{Number(product.price).toLocaleString()}</p>
                      {product.original_price > product.price && (
                        <p className="text-xs text-gray-400 line-through">৳{Number(product.original_price).toLocaleString()}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">Stock: {product.stock ?? '—'}</p>
                      {product.category && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          <Tag className="w-2.5 h-2.5" />{product.category}
                        </span>
                      )}
                    </td>

                    {/* Approval Status */}
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[product.approval_status] || STATUS_BADGE.pending}`}>
                        {product.approval_status === 'pending' ? '⏳ Pending' : product.approval_status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(product.created_at).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {showNoteFor !== product.id && (
                            <button
                              onClick={() => setShowNoteFor(product.id)}
                              className="text-xs text-gray-400 hover:text-gray-600 underline"
                            >
                              + Note
                            </button>
                          )}
                          <button
                            onClick={() => handleAction(product.id, 'reject')}
                            disabled={!!isLoading}
                            title="Reject"
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 text-xs font-semibold"
                          >
                            {isLoading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            Reject
                          </button>
                          <button
                            onClick={() => handleAction(product.id, 'approve')}
                            disabled={!!isLoading}
                            title="Approve"
                            className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 text-xs font-semibold"
                          >
                            {isLoading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Approve
                          </button>
                        </div>
                      ) : (
                        <div className="text-right">
                          {product.approval_status === 'rejected' && isPending === false && (
                            <button
                              onClick={() => handleAction(product.id, 'approve')}
                              disabled={!!isLoading}
                              className="text-xs text-green-600 hover:text-green-700 font-medium underline"
                            >
                              Re-approve
                            </button>
                          )}
                          {product.approval_status === 'approved' && (
                            <button
                              onClick={() => handleAction(product.id, 'reject')}
                              disabled={!!isLoading}
                              className="text-xs text-red-500 hover:text-red-700 font-medium underline"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      )}
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