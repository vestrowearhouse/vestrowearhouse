'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, TrendingUp, Users, ShoppingCart, Eye } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function VendorAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics(false);
    
    // Auto refresh every 30 seconds for real-time updates
    const intervalId = setInterval(() => {
      if (document.hidden) return;
      fetchAnalytics(true);
    }, 30000);
    return () => clearInterval(intervalId);
  }, [timeRange]);

  const fetchAnalytics = async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true); // Don't show full page loader on background refresh
      const res = await fetch(`/api/vendor/analytics?range=${timeRange}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      } else {
        try {
          const errorData = await res.json();
          setError(`Error: ${errorData.error || 'Internal Server Error'} (Status: ${res.status})`);
        } catch (e) {
          setError(`Failed to load analytics (Status: ${res.status})`);
        }
      }
    } catch (err) {
      setError('Error fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600 mb-3" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const MetricCard = ({ icon: Icon, label, value, change, unit = '' }) => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{label}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}{unit}</h3>
          {change !== undefined && (
            <p className={`text-xs mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from last period
            </p>
          )}
        </div>
        <div className="bg-amber-100 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-amber-700" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Store Analytics</h1>
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="1y">Last Year</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Key Metrics */}
      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard 
              icon={Eye}
              label="Total Views"
              value={analytics.totalViews || 0}
              change={analytics.viewsChange || 0}
            />
            <MetricCard 
              icon={Users}
              label="Unique Visitors"
              value={analytics.uniqueVisitors || 0}
              change={analytics.visitorsChange || 0}
            />
            <MetricCard 
              icon={ShoppingCart}
              label="Total Orders"
              value={analytics.totalOrders || 0}
              change={analytics.ordersChange || 0}
            />
            <MetricCard 
              icon={TrendingUp}
              label="Conversion Rate"
              value={(analytics.conversionRate || 0).toFixed(2)}
              unit="%"
            />
          </div>

          {/* Charts Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Sales & Orders Trend</h2>
            <div className="h-80 w-full">
              {analytics.analytics && analytics.analytics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.analytics} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="analytics_date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 12 }} 
                      dy={10}
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      yAxisId="left"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 12 }} 
                      tickFormatter={(val) => `৳${val}`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 12 }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="net_revenue" 
                      name="Revenue" 
                      stroke="#d97706" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="total_orders" 
                      name="Orders" 
                      stroke="#2563eb" 
                      strokeWidth={3} 
                      fill="none" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-lg text-gray-500">
                  <p>No chart data available for the selected period.</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top Products</h2>
            {analytics.topProducts && analytics.topProducts.length > 0 ? (
              <div className="space-y-4">
                {analytics.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border-b last:border-0">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sales} sales</p>
                    </div>
                    <p className="font-semibold text-gray-900">৳{product.revenue}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No product data available</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
