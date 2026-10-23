'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Globe, 
  RefreshCw, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  Trash2,
  Filter
} from 'lucide-react';

export default function PageLogsPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCode, setFilterCode] = useState('all');
  const [message, setMessage] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/page-logs?code=${filterCode}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch page logs:', error);
    } finally {
      setLoading(false);
    }
  }, [filterCode]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear page error logs?')) return;
    try {
      const res = await fetch('/api/admin/page-logs', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchLogs();
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to clear logs.' });
    }
  };

  const filteredLogs = logs.filter(log => {
    const route = log.route_path || '';
    const details = log.details || '';
    const ip = log.user_ip || '';
    const matchesSearch = 
      route.toLowerCase().includes(searchTerm.toLowerCase()) ||
      details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ip.includes(searchTerm);
    return matchesSearch;
  });

  const getErrorBadge = (code) => {
    if (code >= 500) {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <XCircle className="w-3.5 h-3.5" />,
        label: '500 Server Error'
      };
    }
    if (code === 404) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        label: '404 Not Found'
      };
    }
    return {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: `${code} OK`
    };
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = Math.max(0, now - past);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Route & Page Logs</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Route Telemetry
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Monitor 404 Missing URLs, 500 Server Exceptions, and storefront route health in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Logs
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 border shadow-xs ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <CheckCircle2 className={`w-5 h-5 ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
          <span>{message.text}</span>
        </div>
      )}

      {/* KPI Ribbon (4 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-gray-400 font-medium block">Route Health</span>
            <span className="text-sm font-bold text-gray-900 truncate block">
              {stats?.systemStatus || 'Healthy'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-gray-400 font-medium block">404 Warnings</span>
            <span className="text-sm font-bold text-gray-900 truncate block">
              {stats?.count404 || 0} Events
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-gray-400 font-medium block">500 Exceptions</span>
            <span className="text-sm font-bold text-gray-900 truncate block">
              {stats?.count500 || 0} Critical
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-gray-400 font-medium block">Active Routes</span>
            <span className="text-sm font-bold text-gray-900 truncate block">
              {stats?.scannedRoutes || 51} Monitored
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search route paths (e.g. /shop, /cart, /admin)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Filter Code Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Statuses' },
            { id: '404', label: '404 Errors' },
            { id: '500', label: '500 Server Errors' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterCode(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterCode === item.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/80'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Page Logs Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-3.5">HTTP Code</th>
                <th className="px-6 py-3.5">Route Path</th>
                <th className="px-6 py-3.5">Diagnostic Details</th>
                <th className="px-6 py-3.5">Client IP</th>
                <th className="px-6 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Checking route telemetry...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    No route logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getErrorBadge(log.error_code);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge.bg}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="font-mono text-xs font-bold text-gray-800 bg-gray-100/80 px-2 py-0.5 rounded">
                          {log.route_path}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <span>{log.details || 'Standard storefront request'}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-500 whitespace-nowrap">
                        {log.user_ip || '127.0.0.1'}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500 whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-gray-700">{formatTimeAgo(log.created_at)}</span>
                          <span className="text-[10px] text-gray-400">
                            {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
