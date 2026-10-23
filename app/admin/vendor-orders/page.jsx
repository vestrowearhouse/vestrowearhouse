'use client';

import { useState, useEffect } from 'react';
import { Loader2, ShoppingCart, Eye } from 'lucide-react';
import Link from 'next/link';

export default function VendorOrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/admin/vendor-orders', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error('Error fetching vendor orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Vendor Orders Management</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 text-sm">Order ID</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 text-sm">Vendor Name</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 text-sm">Net Amount</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600 text-sm">Vendor Status</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-600 text-sm">View</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-blue-600">
                      #{order.order_number || order.id?.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.vendors?.shop_name || 'Vendor ID: ' + order.vendor_id?.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      ৳{order.net_amount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${order.vendor_status === 'delivered' ? 'bg-green-100 text-green-700' : order.vendor_status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {order.vendor_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/vendor-orders/${order.id}`} className="p-2 bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg inline-flex items-center">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>No vendor orders found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}