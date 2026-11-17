'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Loader2, 
  Eye, 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  X, 
  Save, 
  RefreshCw, 
  Printer, 
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Filter,
  Edit3
} from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Reset pagination to page 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter, sortOrder]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: '', payment_status: '' });

  // State for editing order item variants (Size, Color)
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [editingProductData, setEditingProductData] = useState(null);
  const [editingAttrs, setEditingAttrs] = useState({});
  const [isSavingItemVariant, setIsSavingItemVariant] = useState(false);
  const [loadingItemProduct, setLoadingItemProduct] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (orderId) => {
    setIsModalOpen(true);
    setOrderDetails(null); // Show loader in modal
    setEditingItemIndex(null);
    setEditingProductData(null);
    setEditingAttrs({});
    try {
      const res = await fetch(`/api/admin/orders?id=${orderId}`);
      const data = await res.json();
      if (data.order) {
        setOrderDetails(data.order);
        setUpdateForm({
          status: data.order.status || data.order.order_status || 'pending',
          payment_status: data.order.payment_status || 'unpaid'
        });
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    }
  };

  const handleOpenEditItemVariant = async (item, index) => {
    setEditingItemIndex(index);
    setLoadingItemProduct(true);
    const existing = item.selectedAttributes || item.attributes || item.variantData?.selectedAttributes || {};
    setEditingAttrs({ ...existing });

    const prodId = item.id || item.productId || item.product;
    try {
      if (prodId) {
        const res = await fetch(`/api/products/${encodeURIComponent(prodId)}`);
        const data = await res.json();
        if (data?.product) {
          let pAttrs = data.product.attributes;
          if (typeof pAttrs === 'string') {
            try { pAttrs = JSON.parse(pAttrs); } catch (e) { pAttrs = []; }
          }
          let pVars = data.product.variants;
          if (typeof pVars === 'string') {
            try { pVars = JSON.parse(pVars); } catch (e) { pVars = []; }
          }
          setEditingProductData({
            ...data.product,
            parsedAttributes: Array.isArray(pAttrs) ? pAttrs : [],
            parsedVariants: Array.isArray(pVars) ? pVars : []
          });
          return;
        }
      }
      setEditingProductData(null);
    } catch (e) {
      console.error('Error fetching product for variant edit:', e);
      setEditingProductData(null);
    } finally {
      setLoadingItemProduct(false);
    }
  };

  const handleSaveItemVariant = async (index) => {
    if (!orderDetails) return;
    setIsSavingItemVariant(true);

    try {
      const updatedItems = [...orderDetails.items];
      const targetItem = { ...updatedItems[index] };

      const pVars = editingProductData?.parsedVariants || [];
      let matchedVariant = null;
      if (pVars.length > 0 && Object.keys(editingAttrs).length > 0) {
        matchedVariant = pVars.find(v => {
          const comb = v.combination || v.selectedAttributes || {};
          return Object.entries(editingAttrs).every(([k, val]) => String(comb[k] || '').toLowerCase() === String(val || '').toLowerCase());
        });
      }

      const variantSku = matchedVariant?.sku || targetItem.variantSku || targetItem.sku || null;
      const variantTitle = Object.entries(editingAttrs).map(([k, v]) => `${k}: ${v}`).join(' • ');

      targetItem.selectedAttributes = editingAttrs;
      targetItem.variantSku = variantSku;
      targetItem.variantTitle = variantTitle;
      updatedItems[index] = targetItem;

      const orderId = orderDetails.id || orderDetails._id;
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, items: updatedItems })
      });

      if (res.ok) {
        setOrderDetails(prev => ({ ...prev, items: updatedItems }));
        setOrders(prev => prev.map(o => (o.id === orderId || o._id === orderId) ? { ...o, items: updatedItems } : o));
        setEditingItemIndex(null);
        setEditingProductData(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update item variant');
      }
    } catch (error) {
      console.error('Failed to update variant:', error);
      alert('Error updating item variant');
    } finally {
      setIsSavingItemVariant(false);
    }
  };

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    const id = orderDetails.id || orderDetails._id;
    try {
      const res = await fetch(`/api/admin/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updateForm })
      });
      
      if (res.ok) {
        // Update local list
        setOrders(orders.map(o => (o.id === id || o._id === id) ? { ...o, ...updateForm } : o));
        alert('Order status updated successfully!');
        setIsModalOpen(false);
      } else {
        try {
          const err = await res.json();
          alert(err.error || 'Failed to update order');
        } catch(e) {
          alert(`Error: ${res.status} ${res.statusText}`);
        }
      }
    } catch (error) {
      console.error('Update status error:', error);
      alert('Network error occurred.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickStatusUpdate = async (orderId, newStatus) => {
    if (!orderId) {
      alert('Error: Order ID is missing.');
      return;
    }

    if (!confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;
    
    setProcessingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus })
      });
      
      if (res.ok) {
        setOrders(orders.map(o => (o.id === orderId || o._id === orderId) ? { ...o, status: newStatus, order_status: newStatus } : o));
      } else {
        try {
          const err = await res.json();
          alert(err.error || 'Failed to update order');
        } catch (e) {
          alert(`Error: ${res.status} ${res.statusText}`);
        }
      }
    } catch (error) {
      console.error('Quick status update error:', error);
      alert('Network error occurred.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAndSortedOrders = orders.filter(order => {
    // Search by order number, customer name, phone, or TrxID
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term ||
      order.order_number?.toLowerCase().includes(term) || 
      order.billing_name?.toLowerCase().includes(term) ||
      order.billing_phone?.includes(term) ||
      order.shipping_address?.fullName?.toLowerCase().includes(term) ||
      order.shipping_address?.phone?.includes(term) ||
      (order.shipping_address?.transactionId && String(order.shipping_address.transactionId).toLowerCase().includes(term));

    // Order status filter
    const status = (order.status || order.order_status || 'pending').toLowerCase();
    const matchesStatus = statusFilter === 'all' || !statusFilter || status === statusFilter.toLowerCase();

    // Payment status filter
    const paymentStatus = (order.payment_status || 'unpaid').toLowerCase();
    const matchesPayment = paymentFilter === 'all' || !paymentFilter || paymentStatus === paymentFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPayment;
  }).sort((a, b) => {
    if (sortOrder === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    if (sortOrder === 'amount_high') return Number(b.total || b.total_amount || 0) - Number(a.total || a.total_amount || 0);
    if (sortOrder === 'amount_low') return Number(a.total || a.total_amount || 0) - Number(b.total || b.total_amount || 0);
    // newest first by default
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedOrders.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = filteredAndSortedOrders.slice(startIndex, startIndex + pageSize);

  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const hasActiveFilters = statusFilter !== 'all' || paymentFilter !== 'all' || sortOrder !== 'newest' || searchTerm.trim() !== '';

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setSortOrder('newest');
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>;
      case 'processing': return <span className="px-2.5 py-1 bg-neutral-100 text-black rounded-full text-xs font-medium flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin"/> Processing</span>;
      case 'shipped': return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium flex items-center gap-1"><Truck className="w-3 h-3"/> Shipped</span>;
      case 'delivered': return <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Delivered</span>;
      case 'cancelled': return <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1"><XCircle className="w-3 h-3"/> Cancelled</span>;
      default: return <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium capitalize">{status}</span>;
    }
  };

  const handlePrint = () => {
    if (!orderDetails) return;

    const items = orderDetails.items || [];
    const shipping = orderDetails.shipping_address || {};
    const customerName = typeof shipping === 'object' 
      ? (shipping.fullName || orderDetails.billing_name || 'Valued Customer')
      : (orderDetails.billing_name || 'Valued Customer');
    const customerPhone = typeof shipping === 'object' 
      ? (shipping.phone || orderDetails.billing_phone || 'N/A')
      : (orderDetails.billing_phone || 'N/A');
    const customerEmail = typeof shipping === 'object' 
      ? (shipping.email || orderDetails.billing_email || '')
      : (orderDetails.billing_email || '');
    
    let addressText = '';
    if (typeof shipping === 'object' && shipping.address) {
      addressText = shipping.address;
      if (shipping.district) addressText += `, ${shipping.district}`;
      if (shipping.division) addressText += `, ${shipping.division}`;
    } else {
      addressText = orderDetails.shipping_address || orderDetails.billing_address || 'Address not specified';
      if (orderDetails.shipping_city || orderDetails.billing_city) {
        addressText += `, ${orderDetails.shipping_city || orderDetails.billing_city}`;
      }
    }

    const orderDate = orderDetails.created_at 
      ? new Date(orderDetails.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleDateString();

    const subtotal = orderDetails.subtotal || orderDetails.total_amount || orderDetails.total || 0;
    const shippingFee = orderDetails.shipping_cost ?? orderDetails.shipping ?? 100;
    const grandTotal = orderDetails.total || orderDetails.total_amount || (Number(subtotal) + Number(shippingFee));
    const isPaid = (orderDetails.payment_status || '').toLowerCase() === 'paid';
    const paymentMethod = orderDetails.payment_method || (typeof shipping === 'object' && shipping.paymentMethod) || 'Cash on Delivery';
    const trxId = (typeof shipping === 'object' && shipping.transactionId) || orderDetails.transaction_id || '';

    const win = window.open('', '_blank', 'width=900,height=750');
    if (!win) {
      alert('Pop-up blocked. Please allow pop-ups for this website to print invoices.');
      return;
    }

    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Invoice #${orderDetails.order_number || 'Order'} - Vestro Wear House</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      background: #f1f5f9;
      padding: 30px;
      font-size: 13px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .invoice-card {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    .brand-title {
      font-size: 30px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }
    .brand-accent {
      color: #f97316;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 5px;
      font-weight: 600;
    }
    .brand-contact {
      font-size: 11px;
      color: #64748b;
      margin-top: 6px;
      line-height: 1.5;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-title {
      font-size: 28px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 2px;
      text-transform: uppercase;
      line-height: 1;
    }
    .invoice-number {
      font-size: 14px;
      font-family: monospace;
      color: #1e293b;
      font-weight: 700;
      margin-top: 6px;
    }
    .invoice-date {
      font-size: 12px;
      color: #64748b;
      margin-top: 3px;
    }
    .badge-group {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
      margin-top: 10px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-paid {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .badge-unpaid {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .badge-method {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }
    .trx-id {
      font-size: 11px;
      font-family: monospace;
      color: #64748b;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      padding: 3px 8px;
      border-radius: 4px;
      margin-top: 8px;
      display: inline-block;
    }
    .address-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }
    .address-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
    }
    .address-label {
      font-size: 10px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .customer-name {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .address-text {
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .items-table th {
      background: #0f172a;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 11px 14px;
      text-align: left;
    }
    .items-table th:first-child {
      border-top-left-radius: 6px;
    }
    .items-table th:last-child {
      border-top-right-radius: 6px;
      text-align: right;
    }
    .items-table th.center {
      text-align: center;
    }
    .items-table th.right {
      text-align: right;
    }
    .items-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
      vertical-align: middle;
    }
    .items-table tr:nth-child(even) td {
      background: #fbfcfd;
    }
    .item-name {
      font-weight: 600;
      color: #0f172a;
      font-size: 13px;
    }
    .item-meta {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .summary-section {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 24px;
      align-items: flex-start;
      margin-bottom: 28px;
    }
    .terms-box {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 8px;
      padding: 14px 16px;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
    .terms-title {
      font-weight: 700;
      color: #334155;
      margin-bottom: 6px;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }
    .totals-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 9px 16px;
      font-size: 12px;
      color: #475569;
      border-bottom: 1px solid #f1f5f9;
    }
    .totals-grand {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      background: #0f172a;
      color: #ffffff;
      font-size: 15px;
      font-weight: 800;
    }
    .totals-grand .price {
      color: #f97316;
    }
    .footer {
      border-top: 1px dashed #cbd5e1;
      padding-top: 20px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-left {
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
    }
    .footer-stamp {
      text-align: center;
      border: 2px dashed #94a3b8;
      border-radius: 8px;
      padding: 8px 18px;
      background: #f8fafc;
    }
    .stamp-text {
      font-size: 10px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .stamp-sub {
      font-size: 9px;
      color: #16a34a;
      font-weight: 700;
      margin-top: 2px;
    }
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .invoice-card {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
      @page {
        size: A4 portrait;
        margin: 12mm 15mm;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="brand-title">Vestro Wear House<span class="brand-accent">.</span></div>
        <div class="brand-sub">Premium Fashion & Apparel Destination</div>
        <div class="brand-contact">
          Website: www.vestrowearhouse.com<br>
          Support: support@vestrowearhouse.com | Dhaka, Bangladesh
        </div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">#${orderDetails.order_number || 'N/A'}</div>
        <div class="invoice-date">Date: ${orderDate}</div>
        <div class="badge-group">
          <span class="badge ${isPaid ? 'badge-paid' : 'badge-unpaid'}">
            ${isPaid ? 'PAID' : (orderDetails.payment_status ? orderDetails.payment_status.toUpperCase() : 'CASH ON DELIVERY')}
          </span>
          <span class="badge badge-method">${paymentMethod}</span>
        </div>
        ${trxId ? `<div class="trx-id">TrxID: ${trxId}</div>` : ''}
      </div>
    </div>

    <!-- Address Grid -->
    <div class="address-grid">
      <div class="address-box">
        <div class="address-label">Billed To (Customer)</div>
        <div class="customer-name">${customerName}</div>
        <div class="address-text">
          <strong>Phone:</strong> ${customerPhone}<br>
          ${customerEmail ? `<strong>Email:</strong> ${customerEmail}<br>` : ''}
          <strong>Order Type:</strong> Online Order
        </div>
      </div>
      <div class="address-box">
        <div class="address-label">Delivery Address (Shipped To)</div>
        <div class="customer-name">${customerName}</div>
        <div class="address-text">
          ${addressText}<br>
          <strong>Method:</strong> Standard Express Delivery
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 36px;">#</th>
          <th>Item Description</th>
          <th class="center" style="width: 70px;">Qty</th>
          <th class="right" style="width: 110px;">Unit Price</th>
          <th class="right" style="width: 120px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.length > 0 ? items.map((item, idx) => {
          const name = item.name || item.product_name || 'Product';
          const qty = item.quantity || 1;
          const price = Number(item.price || item.unit_price || 0);
          const lineTotal = price * qty;
          const rawAttrs = item.selectedAttributes || item.attributes || item.variantData?.selectedAttributes;
          let attrText = '';
          if (rawAttrs && typeof rawAttrs === 'object') {
            attrText = Object.entries(rawAttrs).map(([k, v]) => `${k}: ${v}`).join(' • ');
          } else if (item.variant_name || item.variant || item.selectedVariant || item.variantTitle) {
            attrText = item.variantTitle || item.variant_name || item.variant || item.selectedVariant;
          }
          const sku = item.variantSku || item.sku || '';

          return `
            <tr>
              <td style="color: #94a3b8; font-weight: 600;">${idx + 1}</td>
              <td>
                <div class="item-name">${name}</div>
                ${(attrText || sku) ? `<div class="item-meta">${[attrText, sku ? `SKU: ${sku}` : ''].filter(Boolean).join(' • ')}</div>` : ''}
              </td>
              <td class="center" style="font-weight: 600;">${qty}</td>
              <td class="right">৳${price.toLocaleString()}</td>
              <td class="right" style="font-weight: 700; color: #0f172a;">৳${lineTotal.toLocaleString()}</td>
            </tr>
          `;
        }).join('') : `
          <tr>
            <td colspan="5" style="text-align:center; padding: 20px; color: #94a3b8;">No items found</td>
          </tr>
        `}
      </tbody>
    </table>

    <!-- Summary Section -->
    <div class="summary-section">
      <div class="terms-box">
        <div class="terms-title">Terms & Conditions</div>
        <p>1. Please inspect all delivered products upon receipt.</p>
        <p>2. Eligible returns/exchanges must be initiated within 7 days in original packaging.</p>
        <p>3. Keep this invoice as proof of purchase for warranty and customer support.</p>
      </div>
      <div class="totals-box">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>৳${Number(subtotal).toLocaleString()}</span>
        </div>
        <div class="totals-row">
          <span>Delivery / Shipping Fee</span>
          <span>৳${Number(shippingFee).toLocaleString()}</span>
        </div>
        <div class="totals-grand">
          <span>Total Amount</span>
          <span class="price">৳${Number(grandTotal).toLocaleString()}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">
        <strong>Thank you for choosing Vestro Wear House!</strong><br>
        For inquiries or support, visit <a href="https://www.vestrowearhouse.com" style="color: #2563eb; text-decoration: none;">vestrowearhouse.com</a>
      </div>
      <div class="footer-stamp">
        <div class="stamp-text">VESTRO WEAR HOUSE</div>
        <div class="stamp-sub">✓ VERIFIED OFFICIAL DISPATCH</div>
      </div>
    </div>
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`);
    win.document.close();
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
          <p className="text-gray-500">View and update customer orders.</p>
        </div>
        <div className="flex items-center gap-2 bg-neutral-100 text-black px-4 py-2 rounded-lg border border-neutral-200 font-medium text-sm">
          <Package className="w-5 h-5" /> Total Orders: {orders.length}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Search & Filter Header */}
        <div className="p-4 border-b bg-gray-50 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Order ID, Customer Name, Phone, or TrxID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black bg-white"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs">
                Total: {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>
          </div>

          {/* Filter Tabs & Selectors */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-200/80 text-sm">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
              {[
                { id: 'all', label: 'All Orders' },
                { id: 'pending', label: 'Pending' },
                { id: 'confirmed', label: 'Confirmed' },
                { id: 'processing', label: 'Processing' },
                { id: 'shipped', label: 'Shipped' },
                { id: 'delivered', label: 'Delivered' },
                { id: 'cancelled', label: 'Cancelled' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                    statusFilter === tab.id
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Payment Filter */}
            <div className="flex items-center gap-1.5 min-w-[150px] ml-auto">
              <span className="text-xs font-medium text-gray-500">Payment:</span>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:ring-2 focus:ring-black/10 focus:border-black"
              >
                <option value="all">All Payment</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid / COD</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5 min-w-[160px]">
              <span className="text-xs font-medium text-gray-500">Sort:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:ring-2 focus:ring-black/10 focus:border-black"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount_high">Amount: High to Low</option>
                <option value="amount_low">Amount: Low to High</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center gap-1 border border-red-200 transition-colors"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-black"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : filteredAndSortedOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="font-medium">No orders found matching your filters.</p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-2 text-xs text-black hover:underline inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedOrders.map((order) => (
                  <tr key={order.id || order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-black">#{order.order_number}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{order.shipping_address?.fullName || order.billing_name || 'N/A'}</div>
                      <div className="text-gray-500 text-xs">{order.shipping_address?.phone || order.billing_phone || 'N/A'}</div>
                      {Array.isArray(order.items) && order.items.length > 0 && (
                        <div className="text-[11px] text-gray-500 mt-1 truncate max-w-[220px]">
                          {order.items.map((it) => {
                            const attrs = it.selectedAttributes || it.attributes || it.variantData?.selectedAttributes;
                            const attrStr = attrs && typeof attrs === 'object' && Object.keys(attrs).length > 0
                              ? Object.values(attrs).join('/') 
                              : (it.variantTitle || '');
                            return `${it.name || 'Item'}${attrStr ? ` (${attrStr})` : ''}`;
                          }).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">৳{order.total || order.total_amount}</td>
                    <td className="px-6 py-4 capitalize text-xs">
                      <span className={`px-2 py-1 rounded-md font-medium ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {order.payment_status || 'unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {order.shipping_address?.transactionId ? (
                        <div className="font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200 text-gray-700 truncate max-w-[150px]" title={order.shipping_address.transactionId}>
                          {order.shipping_address.transactionId}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(order.status || order.order_status)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {(order.status === 'pending' || order.order_status === 'pending' || order.status === 'cancelled' || order.order_status === 'cancelled' || !order.status) && (
                          <button
                            onClick={() => handleQuickStatusUpdate(order.id || order._id, 'confirmed')}
                            disabled={processingId === (order.id || order._id)}
                            className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Confirm Order"
                          >
                            {processingId === (order.id || order._id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                        )}
                        {(order.status === 'pending' || order.status === 'confirmed' || order.order_status === 'pending' || order.order_status === 'confirmed' || !order.status) && (
                          <button
                            onClick={() => handleQuickStatusUpdate(order.id || order._id, 'cancelled')}
                            disabled={processingId === (order.id || order._id)}
                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Cancel Order"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleViewOrder(order.id || order._id)}
                          className="p-1.5 text-black bg-neutral-100 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 20 Items Per Page Pagination Footer */}
        {!loading && filteredAndSortedOrders.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/70">
            <div className="text-xs text-gray-600 font-medium">
              Showing <span className="font-bold text-gray-900">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-gray-900">{Math.min(startIndex + pageSize, filteredAndSortedOrders.length)}</span> of{' '}
              <span className="font-bold text-gray-900">{filteredAndSortedOrders.length}</span> orders
              {filteredAndSortedOrders.length < orders.length && (
                <span className="text-gray-400 ml-1.5">({orders.length} total)</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all bg-white shadow-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, idx) => (
                  typeof page === 'number' ? (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all ${
                        currentPage === page
                          ? 'bg-black text-white shadow-sm ring-2 ring-black/20'
                          : 'text-gray-700 hover:bg-white bg-transparent border border-transparent hover:border-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ) : (
                    <span key={idx} className="px-1 text-gray-400 text-xs select-none">...</span>
                  )
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all bg-white shadow-xs"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-800">Order Details</h2>
                <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                  <Printer className="w-4 h-4" /> Print Invoice
                </button>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {!orderDetails ? (
                <div className="flex items-center justify-center py-20 text-black"><Loader2 className="w-8 h-8 animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Order Items & Info */}
                  <div className="lg:col-span-2 space-y-6" id="printable-invoice">
                    
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-6">
                      <div>
                        <h3 className="font-bold text-3xl text-gray-800">INVOICE</h3>
                        <p className="text-gray-500 mt-1 font-mono">Order #{orderDetails.order_number}</p>
                        <p className="text-gray-500 text-sm mt-1">{new Date(orderDetails.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        {getStatusBadge(orderDetails.status || orderDetails.order_status)}
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${orderDetails.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          Payment: {orderDetails.payment_status || 'unpaid'}
                        </span>
                        {orderDetails.shipping_address?.transactionId && (
                          <span className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100">
                            TrxID: {orderDetails.shipping_address.transactionId}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer & Shipping Info */}
                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div>
                        <h4 className="font-bold text-gray-700 mb-2 text-xs uppercase tracking-wider text-gray-500 border-b pb-2">Billed To</h4>
                        <p className="text-base font-bold text-gray-800">{orderDetails.shipping_address?.fullName || orderDetails.billing_name || 'N/A'}</p>
                        <p className="text-sm text-gray-600 mt-1">{orderDetails.shipping_address?.email || orderDetails.billing_email || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{orderDetails.shipping_address?.phone || orderDetails.billing_phone || 'N/A'}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-700 mb-2 text-xs uppercase tracking-wider text-gray-500 border-b pb-2">Ship To</h4>
                        <p className="text-sm text-gray-800 mt-1 leading-relaxed">
                          {typeof orderDetails.shipping_address === 'object' ? orderDetails.shipping_address?.address : (orderDetails.shipping_address || orderDetails.billing_address)}<br/>
                          {typeof orderDetails.shipping_address === 'object' ? `${orderDetails.shipping_address?.district || ''}, ${orderDetails.shipping_address?.division || ''}` : (orderDetails.shipping_city || orderDetails.billing_city)}
                        </p>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="p-4 font-semibold text-gray-700">Product</th>
                            <th className="p-4 font-semibold text-gray-700 text-center">Qty</th>
                            <th className="p-4 font-semibold text-gray-700 text-right">Price</th>
                            <th className="p-4 font-semibold text-gray-700 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {orderDetails.items?.map((item, index) => {
                            const rawAttrs = item.selectedAttributes || item.attributes || item.variantData?.selectedAttributes;
                            const hasAttrs = rawAttrs && typeof rawAttrs === 'object' && Object.keys(rawAttrs).length > 0;
                            const isEditingThisItem = editingItemIndex === index;

                            return (
                              <tr key={index} className="align-top">
                                <td className="p-4">
                                  <div className="flex items-start gap-3">
                                    {(item.image || item.product_image) && (
                                      <img src={item.image || item.product_image} alt="" className="w-12 h-12 object-cover rounded-lg border border-gray-100 shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <span className="font-semibold text-gray-800 block">{item.name || item.product_name}</span>
                                      
                                      {/* Variant Attributes Badges */}
                                      {hasAttrs ? (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {Object.entries(rawAttrs).map(([k, v]) => (
                                            <span key={k} className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-black border border-neutral-200">
                                              {k}: {v}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (item.variantTitle || item.variant_name || item.variant) ? (
                                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 mt-1">
                                          {item.variantTitle || item.variant_name || item.variant}
                                        </span>
                                      ) : (
                                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 mt-1">
                                          ⚠️ No Size/Color Selected
                                        </span>
                                      )}

                                      {/* SKU */}
                                      {(item.variantSku || item.sku) && (
                                        <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                                          SKU: {item.variantSku || item.sku}
                                        </span>
                                      )}

                                      {/* Quick Edit Variant Trigger */}
                                      {!isEditingThisItem ? (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditItemVariant(item, index)}
                                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-black hover:underline bg-neutral-100 hover:bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300 mt-1.5 transition-colors cursor-pointer"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                          {hasAttrs ? 'Edit Size/Color' : 'Set Size/Color'}
                                        </button>
                                      ) : null}

                                      {/* Inline Variant Selection Form */}
                                      {isEditingThisItem && (
                                        <div className="mt-2.5 p-3 bg-neutral-50 border border-neutral-300 rounded-xl space-y-2 text-xs">
                                          <div className="font-bold text-gray-800 flex items-center justify-between">
                                            <span>Select / Change Item Options:</span>
                                            {loadingItemProduct && <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />}
                                          </div>

                                          {editingProductData?.parsedAttributes && editingProductData.parsedAttributes.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                              {editingProductData.parsedAttributes.map((attr) => (
                                                <div key={attr.name}>
                                                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">
                                                    {attr.name}
                                                  </label>
                                                  <select
                                                    value={editingAttrs[attr.name] || ''}
                                                    onChange={(e) => setEditingAttrs({ ...editingAttrs, [attr.name]: e.target.value })}
                                                    className="w-full p-1.5 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-800 focus:ring-1 focus:ring-black/10 focus:border-black"
                                                  >
                                                    <option value="">-- Select {attr.name} --</option>
                                                    {attr.values?.map((val) => (
                                                      <option key={val} value={val}>{val}</option>
                                                    ))}
                                                  </select>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="space-y-1.5 pt-1">
                                              <p className="text-[11px] text-gray-600">Product has no preset options. You can type manual values:</p>
                                              <div className="flex gap-2">
                                                <input
                                                  type="text"
                                                  placeholder="Size (e.g. XL, M)"
                                                  value={editingAttrs['Size'] || ''}
                                                  onChange={(e) => setEditingAttrs({ ...editingAttrs, Size: e.target.value })}
                                                  className="w-1/2 p-1.5 bg-white border border-gray-300 rounded text-xs"
                                                />
                                                <input
                                                  type="text"
                                                  placeholder="Color (e.g. Red, Black)"
                                                  value={editingAttrs['Color'] || ''}
                                                  onChange={(e) => setEditingAttrs({ ...editingAttrs, Color: e.target.value })}
                                                  className="w-1/2 p-1.5 bg-white border border-gray-300 rounded text-xs"
                                                />
                                              </div>
                                            </div>
                                          )}

                                          <div className="flex items-center gap-2 pt-1">
                                            <button
                                              type="button"
                                              onClick={() => handleSaveItemVariant(index)}
                                              disabled={isSavingItemVariant}
                                              className="px-3 py-1 bg-black hover:bg-neutral-800 text-white rounded font-bold text-[11px] inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                                            >
                                              {isSavingItemVariant ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                              Save Size/Color
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setEditingItemIndex(null)}
                                              disabled={isSavingItemVariant}
                                              className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium text-[11px] cursor-pointer"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-center font-medium text-gray-600">{item.quantity}</td>
                                <td className="p-4 text-right text-gray-600">৳{item.price || item.unit_price}</td>
                                <td className="p-4 text-right font-bold text-gray-800">৳{(item.price || item.unit_price) * item.quantity}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                        <div className="w-1/2 space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span>৳{orderDetails.total || orderDetails.total_amount}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t border-gray-200">
                            <span>Total Amount</span>
                            <span className="text-black">৳{orderDetails.total || orderDetails.total_amount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action/Status Panel */}
                  <div className="bg-neutral-100 p-6 rounded-xl border border-neutral-200 h-fit">
                    <h3 className="font-bold text-gray-800 mb-4 border-b border-neutral-300 pb-2">Update Status</h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
                      <select 
                        value={updateForm.status} 
                        onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
                        className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black/10 focus:border-black"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                      <select 
                        value={updateForm.payment_status} 
                        onChange={(e) => setUpdateForm({...updateForm, payment_status: e.target.value})}
                        className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black/10 focus:border-black"
                      >
                        <option value="pending">Pending</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>

                    <button 
                      onClick={handleUpdateStatus}
                      disabled={isUpdating}
                      className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {isUpdating ? 'Updating...' : 'Save Changes'}
                    </button>
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