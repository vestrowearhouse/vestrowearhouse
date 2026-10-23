'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Target, Mail, Share2, Megaphone,
  BarChart3, PieChart, Calendar, Filter, Download, RefreshCw, Eye, MousePointer, ArrowUp, ArrowDown
} from 'lucide-react';

export default function MarketingIntelPage() {
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    kpiData: {
      revenue: { value: 0, change: 0, trend: 'up' },
      orders: { value: 0, change: 0, trend: 'up' },
      conversionRate: { value: 0, change: 0, trend: 'up' },
      avgOrderValue: { value: 0, change: 0, trend: 'up' },
    },
    campaigns: [],
    channels: [],
    topProducts: []
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/intelligence/marketing');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error('Failed to fetch marketing intel data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  const { kpiData, campaigns, channels, topProducts } = data;

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded-xl"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Marketing Intelligence</h1>
          <p className="text-gray-500">Track your marketing performance and ROI</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className={`flex items-center text-sm ${kpiData.revenue.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {kpiData.revenue.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(kpiData.revenue.change)}%
            </span>
          </div>
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold">৳{kpiData.revenue.value.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <span className={`flex items-center text-sm ${kpiData.orders.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {kpiData.orders.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(kpiData.orders.change)}%
            </span>
          </div>
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold">{kpiData.orders.value.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <span className={`flex items-center text-sm ${kpiData.conversionRate.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {kpiData.conversionRate.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(kpiData.conversionRate.change)}%
            </span>
          </div>
          <p className="text-sm text-gray-500">Conversion Rate</p>
          <p className="text-2xl font-bold">{kpiData.conversionRate.value}%</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <span className={`flex items-center text-sm ${kpiData.avgOrderValue.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {kpiData.avgOrderValue.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(kpiData.avgOrderValue.change)}%
            </span>
          </div>
          <p className="text-sm text-gray-500">Avg Order Value</p>
          <p className="text-2xl font-bold">৳{kpiData.avgOrderValue.value}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Marketing Campaigns */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Active Campaigns</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Budget</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{campaign.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">৳{campaign.spent.toLocaleString()} / ৳{campaign.budget.toLocaleString()}</div>
                      <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-600 font-medium">{campaign.roi}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Channel Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Channel Performance</h2>
          <div className="space-y-4">
            {channels.map((channel, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{channel.channel}</span>
                  <span className="text-gray-600">৳{channel.revenue.toLocaleString()} ({channel.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    style={{ width: `${channel.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Top Performing Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{product.name}</td>
                  <td className="px-6 py-4">{product.sales}</td>
                  <td className="px-6 py-4">৳{product.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center ${product.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {product.growth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                      {Math.abs(product.growth)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
