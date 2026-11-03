'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Database, 
  Download, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2,
  FileText,
  Package,
  ShoppingCart,
  Layers,
  UploadCloud,
  FileJson,
  Check,
  X
} from 'lucide-react';

export default function BackupPage() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingType, setDownloadingType] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Restore Modal State
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const fetchBackupData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/backup', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load backup data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackupData();
  }, [fetchBackupData]);

  const handleDownload = async (type = 'full') => {
    setDownloadingType(type);
    setActionMessage({ type: 'info', text: `Preparing ${type.toUpperCase()} backup package...` });

    try {
      const res = await fetch(`/api/admin/backup?download=true&type=${type}`);
      if (!res.ok) {
        throw new Error('Failed to generate backup file from server.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `stellarmart-${type}-backup-${today}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setActionMessage({ type: 'success', text: `Successfully exported ${type.toUpperCase()} backup!` });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      console.error('Download error:', err);
      setActionMessage({ type: 'error', text: err.message || 'Failed to download backup' });
    } finally {
      setDownloadingType(null);
    }
  };

  const handleCreateSnapshot = async (type = 'full') => {
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ type: 'success', text: data.message });
        fetchBackupData();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Failed to record snapshot.' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Database Backup & Recovery</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Secured Vault
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Export full system snapshots, download table datasets, and inspect automated cloud backup schedules.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => setShowRestoreModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
          >
            <UploadCloud className="w-4 h-4 text-gray-600" />
            Restore Instructions
          </button>
          <button
            onClick={() => handleDownload('full')}
            disabled={downloadingType === 'full'}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-60"
          >
            {downloadingType === 'full' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download Full Backup (.json)
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : actionMessage.type === 'error' 
            ? 'bg-rose-50 text-rose-800 border border-rose-200' 
            : 'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : actionMessage.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sensitivity Warning Banner */}
      <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="font-bold block text-sm mb-0.5">Sensitive Administrative Action</strong>
          Database exports contain live products, categories, orders, and customer records. Only authenticated Super Administrators have access. All export activities are logged with your admin session ID.
        </div>
      </div>

      {/* Database KPI Summary Ribbon (4 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-gray-400 font-medium block">Products in DB</span>
            <span className="text-base font-bold text-gray-900 truncate block">
              {loading ? '...' : `${stats?.productsCount || 0} Products`}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-gray-400 font-medium block">Total Orders</span>
            <span className="text-base font-bold text-gray-900 truncate block">
              {loading ? '...' : `${stats?.ordersCount || 0} Orders`}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-gray-400 font-medium block">Categories</span>
            <span className="text-base font-bold text-gray-900 truncate block">
              {loading ? '...' : `${stats?.categoriesCount || 0} Active`}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-gray-400 font-medium block">Last Export Event</span>
            <span className="text-sm font-bold text-gray-900 truncate block">
              {loading ? '...' : stats?.lastRealExport || 'None recorded'}
            </span>
          </div>
        </div>
      </div>

      {/* Export Modules (4 Cards Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Module 1: Full System */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between hover:border-blue-200 hover:shadow-sm transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm">Full Database</h3>
            <p className="text-xs text-gray-400 mt-1">All tables, products, categories, orders & configs</p>
          </div>
          <button
            onClick={() => handleDownload('full')}
            disabled={downloadingType === 'full'}
            className="mt-4 w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {downloadingType === 'full' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export Full JSON
          </button>
        </div>

        {/* Module 2: Products Catalog */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between hover:border-purple-200 hover:shadow-sm transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm">Products Catalog</h3>
            <p className="text-xs text-gray-400 mt-1">All catalog items, prices, stock, images & variations</p>
          </div>
          <button
            onClick={() => handleDownload('products')}
            disabled={downloadingType === 'products'}
            className="mt-4 w-full py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {downloadingType === 'products' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export Products (.json)
          </button>
        </div>

        {/* Module 3: Orders & Ledger */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between hover:border-emerald-200 hover:shadow-sm transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm">Orders & Sales</h3>
            <p className="text-xs text-gray-400 mt-1">Customer orders, billing info, shipping addresses & items</p>
          </div>
          <button
            onClick={() => handleDownload('orders')}
            disabled={downloadingType === 'orders'}
            className="mt-4 w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {downloadingType === 'orders' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export Orders (.json)
          </button>
        </div>

        {/* Module 4: Categories & Layout */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between hover:border-amber-200 hover:shadow-sm transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm">Categories & Configs</h3>
            <p className="text-xs text-gray-400 mt-1">Category tree, homepage banners & flash sale settings</p>
          </div>
          <button
            onClick={() => handleDownload('categories')}
            disabled={downloadingType === 'categories'}
            className="mt-4 w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {downloadingType === 'categories' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export Categories (.json)
          </button>
        </div>

      </div>

      {/* Automated Cloud Snapshot Schedule Card */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Automated Cloud Backups & Redundancy</h3>
              <p className="text-xs text-gray-400">Powered by Supabase Enterprise PostgreSQL Snapshot Engine</p>
            </div>
          </div>
          <button
            onClick={() => handleDownload('full')}
            disabled={downloadingType === 'full'}
            className="self-start sm:self-auto text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors"
          >
            Export Full Dataset Now
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
            <span className="text-xs text-gray-400 font-medium block">Last Cloud Backup</span>
            <span className="text-sm font-bold text-gray-800 mt-0.5 block">{stats?.lastCloudBackup || 'Today, 02:00 AM UTC'}</span>
            <span className="text-[11px] text-gray-500 font-medium block mt-1">Managed by Supabase Cloud</span>
          </div>

          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
            <span className="text-xs text-gray-400 font-medium block">Next Scheduled Backup</span>
            <span className="text-sm font-bold text-gray-800 mt-0.5 block">{stats?.nextCloudBackup || 'Tomorrow, 02:00 AM UTC'}</span>
            <span className="text-[11px] text-gray-500 font-medium block mt-1">Automatic Daily Cycle</span>
          </div>

          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
            <span className="text-xs text-gray-400 font-medium block">Point-in-Time Recovery</span>
            <span className="text-sm font-bold text-gray-800 mt-0.5 block">Supabase Dashboard</span>
            <span className="text-[11px] text-gray-500 font-medium block mt-1">Configured in Supabase Project Settings</span>
          </div>
        </div>
      </div>

      {/* Backup History Ledger Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Backup Package Ledger</h2>
            <p className="text-xs text-gray-400">Available downloadable snapshots generated for this installation</p>
          </div>
          <button 
            onClick={fetchBackupData}
            className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Ledger
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Filename</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Approx. Size</th>
                <th className="px-6 py-3.5">Generation Trigger</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length > 0 ? (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-gray-800 flex items-center gap-2">
                      <FileJson className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="truncate max-w-[240px]">{item.filename}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-semibold">{item.type}</td>
                    <td className="px-6 py-4 text-gray-500">{item.size}</td>
                    <td className="px-6 py-4 text-gray-500">{item.trigger}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDownload(item.downloadType || 'full')}
                        disabled={downloadingType === (item.downloadType || 'full')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                    No previous backup files found. Click "Download Full Backup" above to export one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restore Database Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Database Restore Guidance</h3>
                  <p className="text-xs text-gray-400">How to safely restore StellarMart database</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRestoreModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  In-Browser Database Restore Disabled for Safety
                </div>
                <p>
                  To prevent accidental data corruption or incomplete writes, direct full-database restoration cannot be executed from the web dashboard.
                </p>
              </div>

              <div className="space-y-3 text-xs text-gray-700 bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                <div className="font-bold text-gray-900 text-sm">Recommended Restore Procedure:</div>
                <ol className="list-decimal pl-4 space-y-2 text-gray-600 leading-normal">
                  <li>
                    <strong className="text-gray-800">Supabase Automated Backups:</strong> Go to the{' '}
                    <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">
                      Supabase Dashboard
                    </a>{' '}
                    &rarr; select your project &rarr; navigate to <strong>Database &gt; Backups</strong> &rarr; choose a snapshot and click <strong>Restore</strong>.
                  </li>
                  <li>
                    <strong className="text-gray-800">JSON/SQL Table Datasets:</strong> For individual table restoration, use the downloaded JSON snapshot or SQL migration script with the Supabase SQL Editor or <code>psql</code> CLI client.
                  </li>
                </ol>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
              >
                Go to Supabase Dashboard &rarr;
              </a>
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
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