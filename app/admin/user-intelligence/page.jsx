'use client';

import { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, TrendingDown, Eye, MousePointer, Clock, MapPin, Smartphone,
  Search, Filter, Download, RefreshCw, UserCheck, UserX, AlertCircle
} from 'lucide-react';

export default function UserIntelligencePage() {
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: { totalUsers: 0, newUsers: 0, activeUsers: 0, bounceRate: 0, avgSessionDuration: '0' },
    topUsers: [],
    userLocations: [],
    userDevices: [],
    userBehavior: []
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/intelligence/users');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error('Failed to fetch user intelligence data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  const { stats, topUsers, userLocations, userDevices, userBehavior } = data;

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
          <h1 className="text-2xl font-bold">User Intelligence</h1>
          <p className="text-gray-500">Understand your users behavior and demographics</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="flex items-center text-green-500 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              +12%
            </span>
          </div>
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <span className="flex items-center text-green-500 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              +8%
            </span>
          </div>
          <p className="text-sm text-gray-500">Active Users</p>
          <p className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <span className="flex items-center text-red-500 text-sm">
              <TrendingDown className="w-4 h-4 mr-1" />
              -2%
            </span>
          </div>
          <p className="text-sm text-gray-500">Avg Session Duration</p>
          <p className="text-2xl font-bold">{stats.avgSessionDuration}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <span className="flex items-center text-red-500 text-sm">
              <TrendingDown className="w-4 h-4 mr-1" />
              +3%
            </span>
          </div>
          <p className="text-sm text-gray-500">Bounce Rate</p>
          <p className="text-2xl font-bold">{stats.bounceRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* User Locations */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">User Locations</h2>
          <div className="space-y-3">
            {userLocations.map((location, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {location.country}
                  </span>
                  <span className="text-gray-600">{location.users} users ({location.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${location.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Devices */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Device Usage</h2>
          <div className="space-y-3">
            {userDevices.map((device, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-gray-400" />
                    {device.device}
                  </span>
                  <span className="text-gray-600">{device.users} users ({device.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${device.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Behavior Funnel */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">User Behavior Funnel</h2>
        <div className="space-y-3">
          {userBehavior.map((behavior, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-32 text-sm text-gray-600">{behavior.action}</div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div 
                    className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${behavior.percentage}%` }}
                  >
                    <span className="text-white text-xs">{behavior.percentage}%</span>
                  </div>
                </div>
              </div>
              <div className="w-20 text-sm text-gray-600 text-right">{behavior.count.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Top Active Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Visits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">{user.visits}</td>
                  <td className="px-6 py-4 text-gray-600">{user.lastActive}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
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
