/**
 * Custom React Hooks for Vendor System
 * Hooks for fetching and managing vendor data
 */

import { useState, useEffect, useCallback } from 'react';
import { vendorApi, adminApi } from '@/lib/vendor-api-client';

/**
 * Hook to fetch vendor profile
 */
export const useVendorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vendorApi.getProfile();
      setProfile(data.vendor);
      setError(null);
    } catch (err) {
      setError(err.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
};

/**
 * Hook to fetch vendor orders
 */
export const useVendorOrders = (page = 1, limit = 20, status = null) => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vendorApi.getOrders(page, limit, status);
      setOrders(data.orders || []);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, pagination, loading, error, refetch: fetchOrders };
};

/**
 * Hook to fetch single order details
 */
export const useOrderDetails = (orderId) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await vendorApi.getOrderDetails(orderId);
      setOrder(data.order);
      setError(null);
    } catch (err) {
      setError(err.message);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { order, loading, error, refetch: fetchOrder };
};

/**
 * Hook to fetch vendor analytics
 */
export const useVendorAnalytics = (period = 30) => {
  const [analytics, setAnalytics] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vendorApi.getAnalytics(period);
      setAnalytics(data.analytics || []);
      setSummary(data.summary);
      setError(null);
    } catch (err) {
      setError(err.message);
      setAnalytics([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, summary, loading, error, refetch: fetchAnalytics };
};

/**
 * Hook to fetch vendor revenue
 */
export const useVendorRevenue = (page = 1, limit = 20) => {
  const [revenue, setRevenue] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRevenue = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vendorApi.getRevenue(page, limit);
      setRevenue(data.revenue || []);
      setSummary(data.summary);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err.message);
      setRevenue([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  return { revenue, summary, pagination, loading, error, refetch: fetchRevenue };
};

/**
 * Hook to fetch vendor notifications
 */
export const useVendorNotifications = (page = 1, limit = 20) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vendorApi.getNotifications(page, limit);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err.message);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return { notifications, unreadCount, pagination, loading, error, refetch: fetchNotifications };
};

/**
 * Hook to fetch vendor products
 */
export const useVendorProducts = (page = 1, limit = 20, status = null) => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vendorApi.getProducts(page, limit, status);
      setProducts(data.products || []);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, status]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, pagination, loading, error, refetch: fetchProducts };
};

/**
 * Hook to fetch all vendors (Admin)
 */
export const useAllVendors = (page = 1, limit = 10, status = null, search = null) => {
  const [vendors, setVendors] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getVendors(page, limit, status, search);
      setVendors(data.vendors || []);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err.message);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, search]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return { vendors, pagination, loading, error, refetch: fetchVendors };
};

/**
 * Hook for managing async operations (create, update, delete)
 */
export const useAsync = (asyncFunction, immediate = true) => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (...args) => {
    setStatus('pending');
    setData(null);
    setError(null);

    try {
      const response = await asyncFunction(...args);
      setData(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error);
      setStatus('error');
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, data, error };
};

/**
 * Hook to update order status
 */
export const useUpdateOrderStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateStatus = useCallback(async (orderId, status, trackingNumber = null) => {
    try {
      setLoading(true);
      const data = await vendorApi.updateOrderStatus(orderId, status, trackingNumber);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateStatus, loading, error };
};

/**
 * Hook to mark notification as read
 */
export const useMarkNotificationRead = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      setLoading(true);
      const data = await vendorApi.markNotificationRead(notificationId);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { markAsRead, loading, error };
};

/**
 * Hook to create vendor (Admin)
 */
export const useCreateVendor = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createVendor = useCallback(async (vendorData) => {
    try {
      setLoading(true);
      const data = await adminApi.createVendor(vendorData);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createVendor, loading, error };
};

/**
 * Hook to update vendor (Admin)
 */
export const useUpdateVendor = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateVendor = useCallback(async (vendorId, vendorData) => {
    try {
      setLoading(true);
      const data = await adminApi.updateVendor(vendorId, vendorData);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateVendor, loading, error };
};

/**
 * Hook to delete vendor (Admin)
 */
export const useDeleteVendor = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteVendor = useCallback(async (vendorId) => {
    try {
      setLoading(true);
      const data = await adminApi.deleteVendor(vendorId);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteVendor, loading, error };
};

export default {
  useVendorProfile,
  useVendorOrders,
  useOrderDetails,
  useVendorAnalytics,
  useVendorRevenue,
  useVendorNotifications,
  useVendorProducts,
  useAllVendors,
  useAsync,
  useUpdateOrderStatus,
  useMarkNotificationRead,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
};
