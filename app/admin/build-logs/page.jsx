'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Terminal, 
  RefreshCw, 
  Server, 
  CheckCircle2, 
  Clock, 
  Zap, 
  ExternalLink, 
  GitCommit, 
  Copy, 
  Check, 
  ShieldCheck,
  Layers
} from 'lucide-react';

export default function BuildLogsPage() {
  const [deployments, setDeployments] = useState([]);
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const logsEndRef = useRef(null);

  const fetchBuildLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/build-logs');
      const data = await res.json();
      if (data.success && data.deployments) {
        setDeployments(data.deployments);
        setStats(data.stats);
        setSelectedDeployment(prev => prev || data.deployments[0]);
      }
    } catch (err) {
      console.error('Failed to fetch build logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuildLogs();
  }, [fetchBuildLogs]);

  const handleCopyLogs = () => {
    if (!selectedDeployment) return;
    const text = (selectedDeployment.terminal_lines || []).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">CI/CD & Deployment Telemetry</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Pipeline Active
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Real-time deployment tracking, build execution steps, edge compilation logs, and Vercel release history.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={fetchBuildLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            Refresh Pipeline
          </button>
          <a
            href="https://vercel.com/stellermartbd-2168s-projects/stellarmartbd"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Vercel Console
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* KPI Ribbon (4 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-gray-400 font-medium block">Latest Status</span>
            <span className="text-sm font-bold text-gray-900 truncate block">READY (Production)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-gray-400 font-medium block">Avg. Build Time</span>
            <span className="text-sm font-bold text-gray-900 truncate block">{stats?.avgBuildTime || '51s'}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-gray-400 font-medium block">Build Success</span>
            <span className="text-sm font-bold text-gray-900 truncate block">{stats?.successRate || '100%'}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-gray-400 font-medium block">Release Target</span>
            <span className="text-sm font-bold text-gray-900 truncate block">Production (iad1)</span>
          </div>
        </div>
      </div>

      {/* Main Terminal & Releases Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Deployment Release List */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Release History</span>
            <span className="text-xs text-gray-400 font-medium">{deployments.length} Builds</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[480px] pr-1">
            {deployments.map((dep) => {
              const isSelected = selectedDeployment?.id === dep.id;
              return (
                <div
                  key={dep.id}
                  onClick={() => setSelectedDeployment(dep)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-200 shadow-xs'
                      : 'bg-gray-50/70 hover:bg-gray-100/80 border-gray-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      READY
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">{formatTimeAgo(dep.created_at)}</span>
                  </div>

                  <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug">
                    {dep.commit_message}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/60 text-[10px] text-gray-400 font-mono">
                    <span className="truncate max-w-[140px]">{dep.deployment_id}</span>
                    <span>{dep.duration_sec || 50}s build</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Build Terminal */}
        <div className="lg:col-span-2 bg-gray-950 rounded-2xl shadow-xl border border-gray-800 flex flex-col overflow-hidden font-mono text-xs">
          
          {/* Terminal Titlebar */}
          <div className="bg-gray-900/90 px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-gray-400 ml-2 text-xs font-bold flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-gray-400" />
                {selectedDeployment ? selectedDeployment.deployment_id : 'build-stream.log'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLogs}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Terminal Console Body */}
          <div className="p-5 flex-1 overflow-y-auto max-h-[480px] space-y-2 text-gray-300 leading-relaxed">
            <div className="text-gray-500 pb-2 border-b border-gray-800">
              [CI/CD Engine: Next.js v14.2.35 · Vercel Anycast Edge Deployment · Region: iad1]
            </div>

            {selectedDeployment?.terminal_lines && selectedDeployment.terminal_lines.length > 0 ? (
              selectedDeployment.terminal_lines.map((line, idx) => {
                const isSuccess = line.includes('✓') || line.includes('READY');
                const isHeader = line.includes('▲');
                const isWarn = line.includes('warning') || line.includes('Notice');

                let lineClass = 'text-gray-300';
                if (isSuccess) lineClass = 'text-emerald-400 font-semibold';
                if (isHeader) lineClass = 'text-cyan-400 font-bold';
                if (isWarn) lineClass = 'text-amber-300';

                return (
                  <div key={idx} className={`flex items-start gap-2 ${lineClass}`}>
                    <span className="text-gray-600 select-none text-[10px] w-6 shrink-0 text-right">{idx + 1}</span>
                    <span className="flex-1">{line}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-gray-500 py-8 text-center">
                Waiting for deployment telemetry stream...
              </div>
            )}

            <div ref={logsEndRef} />
          </div>

          {/* Terminal Status Footer */}
          <div className="bg-gray-900/60 px-4 py-2.5 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Live Vercel Edge Synced
            </span>
            <span>Target: stellarmartbd.com</span>
          </div>

        </div>

      </div>
    </div>
  );
}
