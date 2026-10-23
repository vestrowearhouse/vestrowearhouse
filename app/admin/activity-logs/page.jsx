'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  Filter, 
  Clock, 
  User, 
  Layers, 
  ShoppingCart, 
  Database, 
  Settings, 
  KeyRound,
  CheckCircle2,
  Eye,
  X,
  FileCode,
  Package,
  Globe
} from 'lucide-react';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stats, setStats] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/activity-logs?category=${selectedCategory}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch logs', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Strip any HTML tags and clean up whitespace
  const sanitizeText = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const filteredLogs = logs.filter(log => {
    const q = searchTerm.toLowerCase();
    const cleanDesc = sanitizeText(log.description).toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) || 
      cleanDesc.includes(q) ||
      log.actor?.toLowerCase().includes(q) ||
      log.ip_address?.toLowerCase().includes(q)
    );
  });

  const getActionBadge = (category, action) => {
    const act = (action || '').toUpperCase();
    const cat = (category || '').toLowerCase();

    if (cat === 'orders' || act.includes('ORDER')) {
      return {
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: <ShoppingCart className="w-3.5 h-3.5" />
      };
    }
    if (cat === 'products' || act.includes('PRODUCT')) {
      return {
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        icon: <Package className="w-3.5 h-3.5" />
      };
    }
    if (cat === 'database' || act.includes('BACKUP')) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <Database className="w-3.5 h-3.5" />
      };
    }
    if (cat === 'settings' || act.includes('SETTING')) {
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <Settings className="w-3.5 h-3.5" />
      };
    }
    if (cat === 'auth' || act.includes('LOGIN') || act.includes('AUTH')) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <KeyRound className="w-3.5 h-3.5" />
      };
    }
    return {
      bg: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: <Layers className="w-3.5 h-3.5" />
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
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Audit & Activity Logs</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Immutable Ledger
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Real-time tracking of admin actions, configuration modifications, database transactions, and security events.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            Refresh Logs
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by action, description, actor, or IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'products', label: 'Products' },
            { id: 'orders', label: 'Orders' },
            { id: 'settings', label: 'Settings' },
            { id: 'database', label: 'Database' },
            { id: 'auth', label: 'Auth & Access' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-3.5">Action Event</th>
                <th className="px-6 py-3.5 min-w-[320px]">Activity Description</th>
                <th className="px-6 py-3.5">Actor / System</th>
                <th className="px-6 py-3.5">Source IP / Node</th>
                <th className="px-6 py-3.5 text-right">Timestamp</th>
                <th className="px-4 py-3.5 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading activity ledger...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    No activity logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getActionBadge(log.category, log.action);
                  const cleanDesc = sanitizeText(log.description);

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/70 transition-colors group">
                      {/* Action Event Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge.bg}`}>
                          {badge.icon}
                          {log.action}
                        </span>
                      </td>

                      {/* Clean Activity Description */}
                      <td className="px-6 py-4 text-gray-800">
                        <span className="block font-semibold text-gray-900 leading-snug line-clamp-2 max-w-xl" title={cleanDesc}>
                          {cleanDesc}
                        </span>
                        {log.record_id && (
                          <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                            Record: {log.record_id.slice(0, 16)}...
                          </span>
                        )}
                      </td>

                      {/* Actor */}
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{log.actor || 'Super Admin'}</span>
                        </div>
                      </td>

                      {/* Source IP */}
                      <td className="px-6 py-4 font-mono text-gray-500 whitespace-nowrap">
                        {log.ip_address || '127.0.0.1'}
                      </td>

                      {/* Timestamp */}
                      <td className="px-6 py-4 text-right text-gray-500 whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-gray-700">{formatTimeAgo(log.created_at)}</span>
                          <span className="text-[10px] text-gray-400">
                            {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </td>

                      {/* Inspect Details Button */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Inspect raw audit details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Audit Log Details</h3>
                  <p className="text-[11px] text-gray-500">{selectedLog.action}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <div>
                  <span className="text-[11px] text-gray-400 font-bold uppercase block">Category / Table</span>
                  <span className="font-semibold text-gray-800">{selectedLog.category}</span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 font-bold uppercase block">Actor</span>
                  <span className="font-semibold text-gray-800">{selectedLog.actor}</span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 font-bold uppercase block">Source IP</span>
                  <span className="font-mono text-gray-800">{selectedLog.ip_address}</span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 font-bold uppercase block">Created At</span>
                  <span className="text-gray-800">{selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : 'N/A'}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-gray-400 font-bold uppercase block mb-1">Description</span>
                <p className="text-xs text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed font-medium">
                  {sanitizeText(selectedLog.description)}
                </p>
              </div>

              {selectedLog.details && (
                <div>
                  <span className="text-[11px] text-gray-400 font-bold uppercase block mb-1">Payload Details (JSON)</span>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed">
                    {JSON.stringify(
                      Object.fromEntries(
                        Object.entries(selectedLog.details).map(([k, v]) => [
                          k,
                          typeof v === 'string' && v.length > 120 ? v.slice(0, 120) + '...' : v
                        ])
                      ),
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}