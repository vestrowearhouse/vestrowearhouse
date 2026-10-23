'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  FileText, 
  RefreshCw, 
  Save, 
  CheckCircle2, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  Layers, 
  Package, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

const DEFAULT_ROBOTS = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /vendor/
Disallow: /checkout
Disallow: /cart
Disallow: /profile
Disallow: /orders
Disallow: /settings
Disallow: /wishlist

Sitemap: https://www.stellarmartbd.com/sitemap.xml
Host: https://www.stellarmartbd.com`;

export default function SeoManagerPage() {
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [robotsContent, setRobotsContent] = useState(DEFAULT_ROBOTS);
  const [sitemapStats, setSitemapStats] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchSeoData();
  }, []);

  const fetchSeoData = async () => {
    try {
      const res = await fetch('/api/admin/seo');
      const data = await res.json();
      if (data.robots) setRobotsContent(data.robots);
      if (data.sitemapStats) setSitemapStats(data.sitemapStats);
    } catch (error) {
      console.error('Failed to fetch SEO data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleGenerateSitemap = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_sitemap' })
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(data.message, 'success');
        fetchSeoData();
      } else {
        showMessage(data.error || 'Failed to generate sitemap', 'error');
      }
    } catch (error) {
      showMessage('Network error occurred.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveRobots = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_robots', robotsContent })
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(data.message, 'success');
      } else {
        showMessage(data.error || 'Failed to save robots.txt', 'error');
      }
    } catch (error) {
      showMessage('Network error occurred.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyRobots = () => {
    navigator.clipboard.writeText(robotsContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetRobots = () => {
    setRobotsContent(DEFAULT_ROBOTS);
    showMessage('Robots.txt restored to optimal default.', 'success');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Advanced SEO & Sitemap Manager</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Crawler Optimized
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Configure search engine crawler directives, monitor dynamic sitemap indexing, and manage metadata.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <a
            href="https://www.stellarmartbd.com/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Globe className="w-3.5 h-3.5" />
            View sitemap.xml
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
          <a
            href="https://www.stellarmartbd.com/robots.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            View robots.txt
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>
      </div>

      {/* Action Notification */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 border shadow-xs ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <CheckCircle2 className={`w-5 h-5 ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
          <span>{message.text}</span>
        </div>
      )}

      {/* Dynamic Sitemap Overview Card */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Google XML Sitemap</h2>
              <p className="text-xs text-gray-500">
                Next.js App Router dynamic sitemap automatically serves all live products, categories, and static routes.
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateSitemap}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-60"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isGenerating ? 'Regenerating...' : 'Regenerate Sitemap Now'}
          </button>
        </div>

        {/* Sitemap KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
            <span className="text-xs text-gray-400 font-medium block">Indexed Products</span>
            <span className="text-lg font-black text-gray-900 mt-1 block">
              {sitemapStats?.productsCount || 32} Products
            </span>
            <span className="text-[11px] text-purple-600 font-medium block mt-0.5">Priority: 0.8 · Weekly</span>
          </div>

          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
            <span className="text-xs text-gray-400 font-medium block">Indexed Categories</span>
            <span className="text-lg font-black text-gray-900 mt-1 block">
              {sitemapStats?.categoriesCount || 12} Categories
            </span>
            <span className="text-[11px] text-blue-600 font-medium block mt-0.5">Priority: 0.8 · Weekly</span>
          </div>

          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
            <span className="text-xs text-gray-400 font-medium block">Static Core Pages</span>
            <span className="text-lg font-black text-gray-900 mt-1 block">
              {sitemapStats?.staticCount || 7} Core Routes
            </span>
            <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">Shop, Privacy, Terms, Contact</span>
          </div>

          <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
            <span className="text-xs text-purple-600 font-medium block">Total Search URLs</span>
            <span className="text-lg font-black text-purple-900 mt-1 block">
              {sitemapStats?.totalUrls || 51} Live Pages
            </span>
            <span className="text-[11px] text-purple-700 font-medium block mt-0.5">100% Crawlable</span>
          </div>
        </div>
      </div>

      {/* Robots.txt Editor */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Robots.txt Directive Editor</h2>
              <p className="text-xs text-gray-400">Instruct Googlebot, Bing, and search engines which directories to allow or block</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyRobots}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleResetRobots}
              className="px-3 py-1.5 text-gray-500 hover:text-gray-800 text-xs font-semibold hover:bg-gray-50 rounded-lg transition-colors"
            >
              Reset Default
            </button>
          </div>
        </div>

        {/* Code Area */}
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <div className="bg-gray-900 text-gray-400 px-4 py-2 text-[11px] font-mono flex items-center justify-between border-b border-gray-800">
            <span>robots.txt</span>
            <span>UTF-8 · Plain Text</span>
          </div>
          <textarea
            value={robotsContent}
            onChange={(e) => setRobotsContent(e.target.value)}
            rows={12}
            className="w-full p-4 font-mono text-xs bg-gray-950 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 border-0 leading-relaxed resize-y"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Changes take effect immediately on <code className="text-blue-600 font-semibold bg-blue-50 px-1 py-0.5 rounded">https://www.stellarmartbd.com/robots.txt</code>
          </p>

          <button
            onClick={handleSaveRobots}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-60"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save Robots.txt'}
          </button>
        </div>
      </div>
    </div>
  );
}