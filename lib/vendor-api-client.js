/**
 * Vendor API Client Helper
 * Utility functions for making requests to vendor API endpoints
 */

export const vendorApi = {
  /**
   * Fetch vendor profile
   */
  getProfile: async () => {
    const res = await fetch('/api/vendor/profile', {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  /**
   * Update vendor profile
   */
  updateProfile: async (data) => {
    const res = await fetch('/api/vendor/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  /**
   * Get vendor orders
   */
  getOrders: async (page = 1, limit = 20, status = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    const res = await fetch(`/api/vendor/orders?${params}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  /**
   * Get order details
   */
  getOrderDetails: async (orderId) => {
    const res = await fetch(`/api/vendor/orders/${orderId}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch order details');
    return res.json();
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (orderId, status, trackingNumber = null) => {
    const res = await fetch('/api/vendor/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, vendor_status: status, tracking_number: trackingNumber }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to update order');
    return res.json();
  },

  /**
   * Get vendor analytics
   */
  getAnalytics: async (period = 30) => {
    const res = await fetch(`/api/vendor/analytics?period=${period}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  /**
   * Get vendor revenue
   */
  getRevenue: async (page = 1, limit = 20) => {
    const res = await fetch(`/api/vendor/revenue?page=${page}&limit=${limit}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch revenue');
    return res.json();
  },

  /**
   * Get vendor notifications
   */
  getNotifications: async (page = 1, limit = 20) => {
    const res = await fetch(`/api/vendor/notifications?page=${page}&limit=${limit}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  /**
   * Mark notification as read
   */
  markNotificationRead: async (notificationId) => {
    const res = await fetch('/api/vendor/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notificationId, is_read: true }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to update notification');
    return res.json();
  },

  /**
   * Get vendor settings
   */
  getSettings: async () => {
    const res = await fetch('/api/vendor/settings', {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  /**
   * Update vendor settings
   */
  updateSettings: async (data) => {
    const res = await fetch('/api/vendor/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  /**
   * Get vendor products
   */
  getProducts: async (page = 1, limit = 20, status = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    const res = await fetch(`/api/vendor/products/list?${params}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },
};

export const adminApi = {
  /**
   * Get all vendors
   */
  getVendors: async (page = 1, limit = 10, status = null, search = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    const res = await fetch(`/api/admin/vendors?${params}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch vendors');
    return res.json();
  },

  /**
   * Create new vendor
   */
  createVendor: async (data) => {
    const res = await fetch('/api/admin/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create vendor');
    }
    return res.json();
  },

  /**
   * Update vendor
   */
  updateVendor: async (vendorId, data) => {
    const res = await fetch(`/api/admin/vendors/${vendorId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to update vendor');
    return res.json();
  },

  /**
   * Delete vendor
   */
  deleteVendor: async (vendorId) => {
    const res = await fetch(`/api/admin/vendors/${vendorId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete vendor');
    return res.json();
  },
};

/**
 * Utility function to format currency
 */
export const formatCurrency = (amount, currency = 'BDT') => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Utility function to format date
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Utility function to format date and time
 */
export const formatDateTime = (date) => {
  return new Date(date).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get status color class
 */
export const getStatusColor = (status) => {
  const colors = {
    // Order statuses
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    packed: 'bg-purple-100 text-purple-700',
    shipped: 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    refunded: 'bg-red-100 text-red-700',

    // Vendor statuses
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-red-100 text-red-700',
    suspended: 'bg-gray-100 text-gray-700',
    pending_approval: 'bg-yellow-100 text-yellow-700',

    // Payment statuses
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
  };

  return colors[status] || 'bg-gray-100 text-gray-700';
};

export default vendorApi;
