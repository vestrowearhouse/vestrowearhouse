'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Eye, 
  X, 
  Clock, 
  Truck, 
  Package, 
  Check, 
  Copy, 
  MapPin, 
  User, 
  Phone, 
  Calendar, 
  RefreshCw,
  ArrowRight,
  Printer,
  FileText
} from 'lucide-react';

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null); // Details modal
  const [invoiceOrder, setInvoiceOrder] = useState(null); // Printable invoice modal
  const [invoiceType, setInvoiceType] = useState('label'); // 'label' (thermal sticker) | 'a4' (tax invoice)
  const [updatingId, setUpdatingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrders = async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      else setLoading(true);

      const res = await fetch('/api/vendor/orders?limit=50', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/vendor/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, vendor_status: newStatus } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, vendor_status: newStatus }));
        }
        showToast(`Order marked as "${newStatus}"!`);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update order status', 'error');
      }
    } catch {
      showToast('Network error while updating status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopy = (id) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    showToast('Order ID copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredOrders = orders.filter(o => {
    const status = o.vendor_status || o.status || 'pending';
    if (statusFilter !== 'all' && status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const idMatch = String(o.id).toLowerCase().includes(term);
      const custMatch = (o.customer_name || o.shipping_address?.name || '').toLowerCase().includes(term);
      const phoneMatch = String(o.shipping_address?.phone || '').includes(term);
      return idMatch || custMatch || phoneMatch;
    }
    return true;
  });

  const pendingCount = orders.filter(o => (o.vendor_status || o.status) === 'pending').length;
  const processingCount = orders.filter(o => (o.vendor_status || o.status) === 'processing').length;
  const shippedCount = orders.filter(o => (o.vendor_status || o.status) === 'shipped').length;
  const deliveredCount = orders.filter(o => (o.vendor_status || o.status) === 'delivered').length;

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
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
              Order Fulfillment Desk
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            <span>Store Orders Management</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage incoming customer orders, print packing details, update delivery progress, and handle fulfillment.
          </p>
        </div>

        <button
          onClick={() => fetchOrders(true)}
          disabled={isRefreshing}
          className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 active:scale-95 border border-gray-200 rounded-xl font-bold text-xs text-gray-700 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Orders'}</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Orders</span>
          <h3 className="text-2xl font-black text-gray-900 mt-2">{orders.length}</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Pickup</span>
          <h3 className="text-2xl font-black text-amber-600 mt-2">{pendingCount}</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Shipped / Courier</span>
          <h3 className="text-2xl font-black text-blue-600 mt-2">{shippedCount}</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Delivered</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-2">{deliveredCount}</h3>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order ID, customer, or phone..."
            className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: `All (${orders.length})` },
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'processing', label: `Processing (${processingCount})` },
            { id: 'shipped', label: `Shipped (${shippedCount})` },
            { id: 'delivered', label: `Delivered (${deliveredCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-bold text-gray-500">Loading store orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-800">No Orders Found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              There are no orders matching your current filter. Incoming sales will populate automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-4 px-6">Order ID</th>
                  <th className="py-4 px-4">Customer & Phone</th>
                  <th className="py-4 px-4">Items / Qty</th>
                  <th className="py-4 px-4">Total Amount</th>
                  <th className="py-4 px-4">Payment</th>
                  <th className="py-4 px-4">Delivery Status</th>
                  <th className="py-4 px-6 text-right">Fulfillment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredOrders.map((order) => {
                  const status = order.vendor_status || order.status || 'pending';
                  const isUpdating = updatingId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-gray-800">
                          <span>#{String(order.id).slice(0, 8)}</span>
                          <button
                            onClick={() => handleCopy(order.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            title="Copy Full ID"
                          >
                            {copiedId === order.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-bold text-gray-900 block truncate max-w-[150px]">
                          {order.customer_name || order.shipping_address?.name || 'Customer'}
                        </span>
                        <span className="text-[11px] text-gray-500 block">
                          {order.shipping_address?.phone || order.phone || 'No phone'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-gray-700">
                        <span className="font-bold text-gray-900 block text-xs">
                          {Array.isArray(order.items) ? `${order.items.length} item(s)` : '1 item'}
                        </span>
                        {Array.isArray(order.items) && (
                          <div className="mt-1 space-y-0.5 max-w-[200px]">
                            {order.items.slice(0, 2).map((it, idx) => {
                              const attrs = it.selectedAttributes || it.attributes;
                              const attrStr = attrs && typeof attrs === 'object'
                                ? Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(' · ')
                                : it.variantTitle || '';
                              return (
                                <div key={idx} className="text-[11px] text-gray-600 truncate">
                                  <span>{it.name || it.title}</span>
                                  {attrStr && <span className="text-blue-600 block text-[10px] font-semibold">{attrStr}</span>}
                                </div>
                              );
                            })}
                            {order.items.length > 2 && (
                              <span className="text-[10px] text-gray-400">+{order.items.length - 2} more</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 font-black text-gray-900 text-sm">
                        ৳{Number(order.total || order.subtotal || 0).toLocaleString()}
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase rounded-md">
                          {order.payment_method || 'COD'}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                            : status === 'shipped'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
                            : status === 'cancelled'
                            ? 'bg-red-50 text-red-700 border border-red-200/50'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                        }`}>
                          {status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Status Changers */}
                          {status === 'pending' && (
                            <button
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(order.id, 'processing')}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold border border-amber-200"
                            >
                              Pack Order
                            </button>
                          )}
                          {status === 'processing' && (
                            <button
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(order.id, 'shipped')}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-[11px] font-bold border border-blue-200"
                            >
                              Handover Courier
                            </button>
                          )}
                          {status === 'shipped' && (
                            <button
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(order.id, 'delivered')}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-200"
                            >
                              Mark Delivered
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setInvoiceOrder(order);
                              setInvoiceType('label');
                            }}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Print Shipping Label / Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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

      {/* View Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Overview</span>
                <h3 className="text-lg font-black text-gray-900 mt-0.5">#{selectedOrder.id}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setInvoiceOrder(selectedOrder);
                    setInvoiceType('a4');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Customer Details */}
            <div className="p-4 bg-gray-50 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-bold text-gray-900">{selectedOrder.customer_name || selectedOrder.shipping_address?.name || 'Customer'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{selectedOrder.shipping_address?.phone || selectedOrder.phone || 'N/A'}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="text-gray-700">
                  {typeof selectedOrder.shipping_address === 'string'
                    ? selectedOrder.shipping_address
                    : `${selectedOrder.shipping_address?.address || ''}, ${selectedOrder.shipping_address?.city || ''}`}
                </span>
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Update Order Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['pending', 'processing', 'shipped', 'delivered'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold capitalize border transition-all ${
                      (selectedOrder.vendor_status || selectedOrder.status) === st
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="font-bold text-gray-500">Total Payable:</span>
              <span className="text-lg font-black text-gray-900">
                ৳{Number(selectedOrder.total || selectedOrder.subtotal || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice & Shipping Label Modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 my-8 animate-in zoom-in-95">
            {/* Modal Actions Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 print:hidden">
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setInvoiceType('label')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    invoiceType === 'label' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📦 4x6 Shipping Label
                </button>
                <button
                  onClick={() => setInvoiceType('a4')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    invoiceType === 'a4' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📄 A4 Invoice Slip
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setInvoiceOrder(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content Container */}
            <div id="printable-invoice" className="p-6 bg-white border border-gray-200 rounded-2xl text-gray-900 font-sans">
              {/* Type: 4x6 Thermal Shipping Label */}
              {invoiceType === 'label' ? (
                <div className="space-y-4 text-xs font-medium">
                  {/* Top Barcode Header */}
                  <div className="border-b-2 border-black pb-3 text-center">
                    <div className="flex items-center justify-between font-black text-sm">
                      <span>STELLAR MART BD</span>
                      <span className="bg-black text-white px-2 py-0.5 rounded text-[10px]">EXPRESS COURIER</span>
                    </div>
                    {/* Simulated barcode */}
                    <div className="py-2 flex flex-col items-center">
                      <div className="font-mono text-2xl tracking-[4px] font-black select-none">
                        ||| | |||| | ||| ||||||| | ||||
                      </div>
                      <span className="font-mono text-[10px] tracking-widest mt-0.5">TRK-{invoiceOrder.id?.slice(0, 16)}</span>
                    </div>
                  </div>

                  {/* Consignee Recipient */}
                  <div className="border-b-2 border-dashed border-gray-300 pb-3">
                    <p className="text-[10px] uppercase font-bold text-gray-500">Deliver To (Customer):</p>
                    <p className="text-base font-black text-gray-900 mt-0.5">
                      {invoiceOrder.customer_name || invoiceOrder.shipping_address?.name || 'Customer'}
                    </p>
                    <p className="font-bold text-gray-800 text-sm mt-0.5">
                      📞 {invoiceOrder.shipping_address?.phone || invoiceOrder.phone || 'Phone N/A'}
                    </p>
                    <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                      📍 {typeof invoiceOrder.shipping_address === 'string'
                        ? invoiceOrder.shipping_address
                        : `${invoiceOrder.shipping_address?.address || ''}, ${invoiceOrder.shipping_address?.city || ''}`}
                    </p>
                  </div>

                  {/* Cash On Delivery / Prepaid Box */}
                  <div className="border-2 border-black p-3 rounded-lg flex items-center justify-between bg-gray-50">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        {invoiceOrder.payment_method?.toLowerCase() === 'cod' || !invoiceOrder.payment_method ? 'CASH ON DELIVERY (COD)' : 'PREPAID ORDER'}
                      </p>
                      <p className="text-xl font-black text-gray-900">
                        ৳{Number(invoiceOrder.total || invoiceOrder.subtotal || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500">Order ID:</p>
                      <p className="font-mono font-bold text-xs">#{invoiceOrder.id?.slice(0, 10)}</p>
                    </div>
                  </div>

                  {/* Package Items Mini Table */}
                  <div className="pt-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Package Contents:</p>
                    <div className="space-y-1">
                      {(invoiceOrder.items || invoiceOrder.order_items || []).map((it, idx) => {
                        const attrs = it.selectedAttributes || it.attributes;
                        const attrStr = attrs && typeof attrs === 'object'
                          ? Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(' · ')
                          : it.variantTitle || '';
                        return (
                          <div key={idx} className="flex justify-between text-xs py-1 border-b border-gray-100">
                            <div className="truncate max-w-[280px]">
                              <span className="font-semibold text-gray-800 block">
                                {it.title || it.name || 'Product Item'} × {it.quantity || 1}
                              </span>
                              {attrStr && (
                                <span className="text-[10px] text-blue-700 font-bold block">{attrStr}</span>
                              )}
                              {(it.variantSku || it.sku) && (
                                <span className="text-[10px] text-gray-400 font-mono block">SKU: {it.variantSku || it.sku}</span>
                              )}
                            </div>
                            <span className="font-bold text-gray-900">৳{Number(it.price || 0) * (it.quantity || 1)}</span>
                          </div>
                        );
                      })}
                      {(!invoiceOrder.items || invoiceOrder.items.length === 0) && (
                        <div className="text-xs text-gray-600 flex justify-between">
                          <span>Standard Merchant Package</span>
                          <span>Qty: 1</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Merchant Footer */}
                  <div className="pt-2 text-[10px] text-gray-500 flex justify-between border-t border-gray-200">
                    <span>Shipped via: Steadfast / Pathao</span>
                    <span>Date: {new Date(invoiceOrder.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              ) : (
                /* Type: A4 Official Invoice */
                <div className="space-y-6 text-xs">
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-gray-200 pb-4">
                    <div>
                      <h2 className="text-xl font-black text-gray-900">STELLAR MART BD</h2>
                      <p className="text-xs text-gray-500">Official Merchant Tax Invoice & Dispatch Bill</p>
                      <p className="text-[10px] text-gray-400 mt-1">Website: www.stellarmartbd.com</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 font-bold rounded text-[10px]">
                        INVOICE #{invoiceOrder.id?.slice(0, 8)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Date: {new Date(invoiceOrder.created_at || Date.now()).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Status: <strong className="capitalize">{invoiceOrder.vendor_status || invoiceOrder.status || 'Pending'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Customer & Merchant Meta */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Billed & Shipped To:</p>
                      <p className="font-bold text-gray-900 mt-1 text-sm">{invoiceOrder.customer_name || 'Valued Customer'}</p>
                      <p className="text-gray-600 mt-0.5">📞 {invoiceOrder.shipping_address?.phone || invoiceOrder.phone || 'N/A'}</p>
                      <p className="text-gray-600 mt-0.5">
                        📍 {typeof invoiceOrder.shipping_address === 'string'
                          ? invoiceOrder.shipping_address
                          : `${invoiceOrder.shipping_address?.address || ''}, ${invoiceOrder.shipping_address?.city || ''}`}
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Details:</p>
                      <p className="font-bold text-gray-900 mt-1">Method: {invoiceOrder.payment_method || 'Cash on Delivery (COD)'}</p>
                      <p className="text-gray-600 mt-0.5">Courier: Express Logistics Partner</p>
                      <p className="text-gray-600 mt-0.5">Delivery Status: {invoiceOrder.vendor_status || 'Processing'}</p>
                    </div>
                  </div>

                  {/* Table */}
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 text-[10px] uppercase">
                        <th className="py-2 font-bold">Item Description</th>
                        <th className="py-2 font-bold text-center">Qty</th>
                        <th className="py-2 font-bold text-right">Unit Price</th>
                        <th className="py-2 font-bold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(invoiceOrder.items || invoiceOrder.order_items || []).map((it, idx) => {
                        const attrs = it.selectedAttributes || it.attributes;
                        const attrStr = attrs && typeof attrs === 'object'
                          ? Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(' · ')
                          : it.variantTitle || '';
                        return (
                          <tr key={idx}>
                            <td className="py-2">
                              <span className="font-medium text-gray-900 block">{it.title || it.name || 'Product'}</span>
                              {attrStr && (
                                <span className="text-[10px] text-blue-700 font-bold block">{attrStr}</span>
                              )}
                              {(it.variantSku || it.sku) && (
                                <span className="text-[10px] text-gray-400 font-mono block">SKU: {it.variantSku || it.sku}</span>
                              )}
                            </td>
                            <td className="py-2 text-center text-gray-600">{it.quantity || 1}</td>
                            <td className="py-2 text-right text-gray-600">৳{Number(it.price || 0).toLocaleString()}</td>
                            <td className="py-2 text-right font-bold text-gray-900">
                              ৳{(Number(it.price || 0) * (it.quantity || 1)).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                      {(!invoiceOrder.items || invoiceOrder.items.length === 0) && (
                        <tr>
                          <td className="py-2 font-medium text-gray-900">Standard Order Item Package</td>
                          <td className="py-2 text-center text-gray-600">1</td>
                          <td className="py-2 text-right text-gray-600">৳{Number(invoiceOrder.total || 0).toLocaleString()}</td>
                          <td className="py-2 text-right font-bold text-gray-900">৳{Number(invoiceOrder.total || 0).toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="border-t-2 border-gray-200">
                      <tr>
                        <td colSpan="3" className="pt-2 text-right font-bold text-gray-500">Subtotal:</td>
                        <td className="pt-2 text-right font-bold text-gray-900">
                          ৳{Number(invoiceOrder.subtotal || invoiceOrder.total || 0).toLocaleString()}
                        </td>
                      </tr>
                      {invoiceOrder.shipping_fee > 0 && (
                        <tr>
                          <td colSpan="3" className="py-1 text-right text-gray-500">Shipping Delivery Fee:</td>
                          <td className="py-1 text-right font-bold text-gray-900">৳{Number(invoiceOrder.shipping_fee).toLocaleString()}</td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan="3" className="py-2 text-right font-black text-sm text-gray-900">Grand Total Payable:</td>
                        <td className="py-2 text-right font-black text-sm text-indigo-700">
                          ৳{Number(invoiceOrder.total || invoiceOrder.subtotal || 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Footnotes */}
                  <div className="pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400">
                    <p>Thank you for shopping with Stellar Mart BD! For customer support, visit www.stellarmartbd.com</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
