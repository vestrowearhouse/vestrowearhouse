'use client';

import { useState, useEffect } from 'react';
import { Users, CheckCircle, Package, ShoppingCart, DollarSign, Loader2, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminVendorAnalytics() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/vendors/analytics');
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
        setCharts(data.charts);
      }
    } catch (error) {
      console.error('Failed to fetch vendor analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96 text-blue-600"><Loader2 className="w-10 h-10 animate-spin" /></div>;
  }

  const statCards = [
    { title: 'Total Vendors', value: stats?.total_vendors || 0, icon: Users, color: 'bg-blue-500' },
    { title: 'Active Vendors', value: stats?.active_vendors || 0, icon: CheckCircle, color: 'bg-green-500' },
    { title: 'Total Vendor Products', value: stats?.total_products || 0, icon: Package, color: 'bg-purple-500' },
    { title: 'Total Vendor Orders', value: stats?.total_orders || 0, icon: ShoppingCart, color: 'bg-orange-500' },
    { title: 'Completed Orders', value: stats?.completed_orders || 0, icon: TrendingUp, color: 'bg-teal-500' },
    { title: 'Total Vendor Revenue', value: `৳${stats?.total_revenue?.toLocaleString() || '0.00'}`, icon: DollarSign, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Vendor Analytics</h2>
        <p className="text-gray-500">Monitor the overall performance of all vendors in your marketplace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className={`${stat.color} w-14 h-14 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Future implementation: Charts and Top Vendors List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8 space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Revenue Overview (Last 7 Days)</h3>
        {charts && charts.revenue ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={charts.revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `৳${value / 1000}k`} />
              <Tooltip formatter={(value) => `৳${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" activeDot={{ r: 8 }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-gray-300 mx-auto mb-3 animate-spin" />
              <p className="text-gray-500 font-medium">Loading chart data...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
