'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Search, Plus, Edit, Trash2, Loader2, X, Eye, Globe, 
  CheckCircle2, Clock, Sparkles, RefreshCw, Download, ExternalLink, 
  Copy, Check, BookOpen, AlertCircle, Save, LayoutTemplate, Smartphone, Monitor, EyeOff
} from 'lucide-react';

export default function PagesManagement() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, published, draft
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeEditorTab, setActiveEditorTab] = useState('content'); // content, seo, settings
  
  // Quick Preview state
  const [previewPage, setPreviewPage] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // desktop, mobile
  
  // Toast state
  const [toast, setToast] = useState(null);
  const [copiedSlug, setCopiedSlug] = useState(null);

  const [formData, setFormData] = useState({
    title_en: '',
    title_bn: '',
    slug: '',
    content_en: '',
    content_bn: '',
    meta_title: '',
    meta_description: '',
    is_active: true
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/admin/pages?limit=200');
      const data = await res.json();
      setPages(data.pages || []);
      if (isManual) showToast('Pages refreshed successfully');
    } catch (error) {
      console.error('Failed to fetch pages', error);
      showToast('Failed to load pages', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenModal = (page = null) => {
    setActiveEditorTab('content');
    if (page) {
      setEditingId(page.id);
      setFormData({
        title_en: page.title_en || '',
        title_bn: page.title_bn || '',
        slug: page.slug || '',
        content_en: page.content_en || '',
        content_bn: page.content_bn || '',
        meta_title: page.meta_title || '',
        meta_description: page.meta_description || '',
        is_active: page.is_active !== undefined ? page.is_active : true
      });
    } else {
      setEditingId(null);
      setFormData({
        title_en: '',
        title_bn: '',
        slug: '',
        content_en: '',
        content_bn: '',
        meta_title: '',
        meta_description: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSlugGenerate = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleQuickInsert = (snippet) => {
    setFormData(prev => ({
      ...prev,
      content_en: (prev.content_en ? prev.content_en + '\n\n' : '') + snippet
    }));
  };

  const handleLoadPresetTemplate = (templateType) => {
    if (templateType === 'faq') {
      setFormData(prev => ({
        ...prev,
        title_en: prev.title_en || 'Frequently Asked Questions (FAQ)',
        title_bn: prev.title_bn || 'সাধারণ জিজ্ঞাসাসমূহ',
        slug: prev.slug || 'faq',
        meta_title: 'Frequently Asked Questions | StellarMartBD',
        meta_description: 'Find answers to common questions about orders, shipping rates across Bangladesh, and return procedures.',
        content_en: `<h2>1. How do I place an order?</h2>
<p>Browse our catalog, add items to your cart, and proceed to checkout using bKash, Nagad, Card, or Cash on Delivery.</p>

<h2>2. How long does delivery take?</h2>
<ul>
  <li><strong>Dhaka City:</strong> 24 to 48 Hours</li>
  <li><strong>All 64 Districts:</strong> 2 to 4 Business Days</li>
</ul>

<h2>3. What is your return window?</h2>
<p>We offer an easy 7-day return policy for any manufacturing defects or transit damages.</p>`
      }));
      showToast('Loaded FAQ preset template');
    } else if (templateType === 'shipping') {
      setFormData(prev => ({
        ...prev,
        title_en: prev.title_en || 'Shipping & Delivery Policy',
        title_bn: prev.title_bn || 'ডেলিভারি নীতিমালা',
        slug: prev.slug || 'shipping-policy',
        meta_title: 'Nationwide Delivery & Shipping Policy | StellarMartBD',
        meta_description: 'Fast, secure doorstep shipping to all 64 districts in Bangladesh. Check rates, delivery times, and packaging details.',
        content_en: `<h2>Doorstep Delivery Across Bangladesh</h2>
<p>We partner with top-tier logistics providers (Steadfast, Pathao, RedX, eCourier) to deliver to every upazila.</p>

<h2>Shipping Rates</h2>
<ul>
  <li><strong>Dhaka Metro:</strong> ৳60 (Free on orders above ৳1,500)</li>
  <li><strong>Dhaka Suburbs (Gazipur, Savar, Narayanganj):</strong> ৳100</li>
  <li><strong>Outside Dhaka:</strong> ৳120</li>
</ul>`
      }));
      showToast('Loaded Shipping Policy preset');
    } else if (templateType === 'returns') {
      setFormData(prev => ({
        ...prev,
        title_en: prev.title_en || 'Return & Refund Policy',
        title_bn: prev.title_bn || 'রিটার্ন ও রিফান্ড নীতি',
        slug: prev.slug || 'return-refund-policy',
        meta_title: '7-Day Return & Refund Policy | StellarMartBD',
        meta_description: 'Hassle-free 7-day returns for defective or incorrect orders. Full refunds via bKash, Nagad, or original card.',
        content_en: `<h2>7-Day Satisfaction Guarantee</h2>
<p>If you receive a defective, damaged, or incorrect product, contact us within 7 days for a hassle-free exchange or 100% refund.</p>

<h2>Refund Options</h2>
<ul>
  <li><strong>bKash / Nagad / Rocket:</strong> Processed within 24-48 hours</li>
  <li><strong>Credit/Debit Card:</strong> 5-7 working days</li>
  <li><strong>Store Credit / Wallet:</strong> Instant credit</li>
</ul>`
      }));
      showToast('Loaded Return Policy preset');
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('This will seed 4 standard e-commerce policy pages (FAQ, Shipping, Returns, Warranty) if they do not already exist. Proceed?')) return;
    
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed_defaults' })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Default pages seeded successfully!');
        await fetchPages();
      } else {
        showToast(data.error || 'Failed to seed pages', 'error');
      }
    } catch (error) {
      showToast('Network error occurred', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleStatus = async (page) => {
    const newStatus = !page.is_active;
    // Optimistic update
    setPages(prev => prev.map(p => p.id === page.id ? { ...p, is_active: newStatus } : p));
    
    try {
      const res = await fetch(`/api/admin/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus })
      });
      if (!res.ok) {
        // Revert
        setPages(prev => prev.map(p => p.id === page.id ? { ...p, is_active: !newStatus } : p));
        showToast('Failed to update page status', 'error');
      } else {
        showToast(`Page is now ${newStatus ? 'Published Live' : 'saved as Draft'}`);
      }
    } catch (err) {
      setPages(prev => prev.map(p => p.id === page.id ? { ...p, is_active: !newStatus } : p));
      showToast('Network error occurred', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title_en.trim()) {
      showToast('Page title is required', 'error');
      return;
    }

    setIsSubmitting(true);
    const finalSlug = (formData.slug || handleSlugGenerate(formData.title_en)).trim();
    const payload = {
      ...formData,
      slug: finalSlug,
      meta_title: formData.meta_title?.trim() || formData.title_en.trim()
    };

    try {
      const url = editingId ? `/api/admin/pages/${editingId}` : '/api/admin/pages';
      const method = editingId ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();

      if (res.ok) {
        showToast(editingId ? 'Page updated successfully!' : 'Page created and published!');
        setIsModalOpen(false);
        await fetchPages();
      } else {
        showToast(data.error || 'Failed to save page', 'error');
      }
    } catch (error) {
      showToast('Network connection error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/pages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPages(pages.filter(p => p.id !== id));
        showToast('Page deleted successfully');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to delete page', 'error');
      }
    } catch (error) {
      showToast('Network error while deleting', 'error');
    }
  };

  const handleCopyLink = (slug) => {
    const fullUrl = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    showToast('Page URL copied to clipboard!');
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleExportCSV = () => {
    if (!pages.length) {
      showToast('No pages to export', 'error');
      return;
    }
    const headers = ['ID', 'Title (EN)', 'Title (BN)', 'Slug', 'Status', 'Meta Title', 'Last Updated'];
    const rows = pages.map(p => [
      p.id,
      `"${(p.title_en || '').replace(/"/g, '""')}"`,
      `"${(p.title_bn || '').replace(/"/g, '""')}"`,
      p.slug,
      p.is_active ? 'Published' : 'Draft',
      `"${(p.meta_title || '').replace(/"/g, '""')}"`,
      p.updated_at || p.created_at || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stellarmart_pages_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported pages catalog to CSV');
  };

  // Filter and search
  const filteredPages = useMemo(() => {
    return pages.filter(p => {
      const matchesSearch = 
        (p.title_en && p.title_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.title_bn && p.title_bn.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.slug && p.slug.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.meta_description && p.meta_description.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'published') return p.is_active === true;
      if (statusFilter === 'draft') return p.is_active === false;
      return true;
    });
  }, [pages, searchTerm, statusFilter]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = pages.length;
    const published = pages.filter(p => p.is_active).length;
    const drafts = pages.filter(p => !p.is_active).length;
    const withMeta = pages.filter(p => p.meta_title && p.meta_description).length;
    const seoPercentage = total > 0 ? Math.round((withMeta / total) * 100) : 100;
    return { total, published, drafts, seoPercentage };
  }, [pages]);

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white font-medium transition-all duration-300 transform translate-y-0 ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-200" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                <FileText className="w-7 h-7 text-blue-200" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Pages Management (CMS)</h1>
                <p className="text-blue-100 text-sm">Design, publish, and optimize dynamic storefront pages, policy documents, and knowledge base</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full font-medium text-white border border-white/20">
                {stats.total} Total Pages
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/30 backdrop-blur-sm rounded-full font-medium text-emerald-200 border border-emerald-400/30">
                {stats.published} Published Live
              </span>
              <span className="px-2.5 py-1 bg-amber-500/30 backdrop-blur-sm rounded-full font-medium text-amber-200 border border-amber-400/30">
                {stats.drafts} Drafts
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchPages(true)}
              disabled={refreshing}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2 border border-white/20 shadow-sm backdrop-blur-md disabled:opacity-50"
              title="Refresh Pages List"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2 border border-white/20 shadow-sm backdrop-blur-md"
              title="Export CSV Catalog"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleSeedDefaults}
              className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 border border-amber-400/30 shadow-sm backdrop-blur-md"
              title="Auto-create FAQ, Shipping, and Returns templates"
            >
              <LayoutTemplate className="w-4 h-4 text-amber-300" />
              <span>Seed Policy Pages</span>
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="px-5 py-2.5 bg-white text-blue-900 hover:bg-blue-50 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-black/10 hover:shadow-xl hover:scale-105 transform duration-150"
            >
              <Plus className="w-5 h-5 text-blue-700" />
              <span>Add New Page</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI 4-Card Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total CMS Pages</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900">{stats.total}</div>
          <p className="text-xs text-gray-500 mt-1">Catalog of custom & dynamic pages</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Published Live</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">{stats.published}</div>
          <p className="text-xs text-gray-500 mt-1">Publicly accessible on storefront</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Drafts / Inactive</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600">{stats.drafts}</div>
          <p className="text-xs text-gray-500 mt-1">Unpublished content in progress</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">SEO Health</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-indigo-600">{stats.seoPercentage}%</div>
          <p className="text-xs text-gray-500 mt-1">Pages with complete meta details</p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search pages by title, slug, or meta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({pages.length})
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'published'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-600 hover:text-emerald-700'
            }`}
          >
            Published ({stats.published})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'draft'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-gray-600 hover:text-amber-700'
            }`}
          >
            Drafts ({stats.drafts})
          </button>
        </div>
      </div>

      {/* Main Pages Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-gray-500 font-medium text-sm">Loading dynamic pages...</p>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-lg font-bold text-gray-900">
                {searchTerm ? 'No matching pages found' : 'No dynamic pages created yet'}
              </h3>
              <p className="text-sm text-gray-500">
                {searchTerm
                  ? `No page titles or slugs match "${searchTerm}". Try resetting your search filter.`
                  : 'Get started by creating dynamic landing pages, return policies, or click below to populate standard e-commerce policies.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  Clear Search
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleOpenModal()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Create First Page
                  </button>
                  <button
                    onClick={handleSeedDefaults}
                    className="px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                  >
                    <LayoutTemplate className="w-4 h-4 text-amber-600" /> Seed Default Policies
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Page Information</th>
                  <th className="px-6 py-4">Storefront URL</th>
                  <th className="px-6 py-4">SEO Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPages.map((page) => {
                  const hasMeta = Boolean(page.meta_title && page.meta_description);
                  const publicUrl = `/p/${page.slug}`;

                  return (
                    <tr key={page.id} className="hover:bg-gray-50/70 transition-colors group">
                      {/* Page Information */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {page.title_en}
                            </div>
                            {page.title_bn && (
                              <div className="text-xs text-gray-500 font-medium">
                                {page.title_bn}
                              </div>
                            )}
                            <div className="text-xs text-gray-400 line-clamp-1 max-w-sm mt-0.5">
                              {page.content_en?.replace(/<[^>]+>/g, '') || 'No content snippet'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Storefront URL */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg border border-gray-200 max-w-[200px] truncate">
                            {publicUrl}
                          </span>
                          <button
                            onClick={() => handleCopyLink(page.slug)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Copy Public Link"
                          >
                            {copiedSlug === page.slug ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* SEO Details */}
                      <td className="px-6 py-4">
                        {hasMeta ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" /> Optimized
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200">
                            <AlertCircle className="w-3 h-3 text-amber-600" /> Missing Meta
                          </span>
                        )}
                      </td>

                      {/* Status with 1-click toggle */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(page)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            page.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title="Click to toggle Published / Draft status"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${page.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                          <span>{page.is_active ? 'Published' : 'Draft'}</span>
                        </button>
                      </td>

                      {/* Last Updated */}
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {page.updated_at || page.created_at
                          ? new Date(page.updated_at || page.created_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'Recent'}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Modal Preview */}
                          <button
                            onClick={() => {
                              setPreviewPage(page);
                              setPreviewDevice('desktop');
                            }}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                            title="Preview Page"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Open in Storefront Tab */}
                          <a
                            href={publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenModal(page)}
                            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                            title="Edit Page"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(page.id, page.title_en)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Delete Page"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Page Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-5xl my-auto max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingId ? 'Edit Dynamic Page' : 'Create New CMS Page'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {formData.slug ? `/p/${formData.slug}` : 'Auto-generated URL slug'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subnav Tabs */}
            <div className="px-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-6 text-sm">
              <button
                type="button"
                onClick={() => setActiveEditorTab('content')}
                className={`py-3 font-bold border-b-2 transition-colors ${
                  activeEditorTab === 'content'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                1. Content & Details
              </button>
              <button
                type="button"
                onClick={() => setActiveEditorTab('seo')}
                className={`py-3 font-bold border-b-2 transition-colors ${
                  activeEditorTab === 'seo'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                2. SEO & Social Meta
              </button>
              <button
                type="button"
                onClick={() => setActiveEditorTab('settings')}
                className={`py-3 font-bold border-b-2 transition-colors ${
                  activeEditorTab === 'settings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                3. Publishing Status
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <form id="pageForm" onSubmit={handleSubmit} className="space-y-6">
                {/* TAB 1: CONTENT */}
                {activeEditorTab === 'content' && (
                  <div className="space-y-5">
                    {/* Preset Template Selector */}
                    <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                        <LayoutTemplate className="w-4 h-4 text-blue-600" />
                        <span>Quick Load Pre-written Policy Templates:</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadPresetTemplate('faq')}
                          className="px-3 py-1 bg-white hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors"
                        >
                          FAQ Page
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadPresetTemplate('shipping')}
                          className="px-3 py-1 bg-white hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors"
                        >
                          Shipping Policy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadPresetTemplate('returns')}
                          className="px-3 py-1 bg-white hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors"
                        >
                          Return & Refund
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Page Title (English) *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.title_en}
                          onChange={(e) => {
                            const newTitle = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              title_en: newTitle,
                              slug: prev.slug ? prev.slug : handleSlugGenerate(newTitle),
                              meta_title: prev.meta_title ? prev.meta_title : newTitle
                            }));
                          }}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                          placeholder="e.g. Return & Exchange Policy"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Bengali Title (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.title_bn}
                          onChange={(e) => setFormData({ ...formData, title_bn: e.target.value })}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                          placeholder="e.g. রিটার্ন ও পরিবর্তন নীতিমালা"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          URL Slug (Public Path) *
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, slug: handleSlugGenerate(formData.title_en) })}
                          className="text-xs text-blue-600 font-semibold hover:underline"
                        >
                          Auto-generate from Title
                        </button>
                      </div>
                      <div className="flex items-center">
                        <span className="px-3.5 py-2.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-gray-500 text-xs font-mono select-none">
                          /p/
                        </span>
                        <input
                          type="text"
                          required
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: handleSlugGenerate(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-r-xl font-mono text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder="return-refund-policy"
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 font-mono">
                        Direct link: https://stellarmartbd.com/p/{formData.slug || 'your-slug'}
                      </p>
                    </div>

                    {/* Content Editor */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Page Body Content (HTML & Formatted Text) *
                        </label>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span>Quick Snippets:</span>
                          <button
                            type="button"
                            onClick={() => handleQuickInsert('<h2>Section Heading</h2>\n<p>Write your detailed policy or information here.</p>')}
                            className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-semibold text-[11px]"
                          >
                            + Heading & Paragraph
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickInsert('<ul>\n  <li>Key rule 1</li>\n  <li>Key rule 2</li>\n</ul>')}
                            className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-semibold text-[11px]"
                          >
                            + Bullet List
                          </button>
                        </div>
                      </div>

                      <textarea
                        required
                        rows="12"
                        value={formData.content_en}
                        onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-mono text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="<h1>Welcome to StellarMartBD Policies</h1><p>Write standard HTML content or paragraphs here...</p>"
                      />
                    </div>

                    {/* Bengali Content */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Bengali Body Content (Optional)
                      </label>
                      <textarea
                        rows="6"
                        value={formData.content_bn}
                        onChange={(e) => setFormData({ ...formData, content_bn: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="বাংলায় বিস্তারিত বিবরণ লিখুন (ঐচ্ছিক)..."
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: SEO & SOCIAL */}
                {activeEditorTab === 'seo' && (
                  <div className="space-y-6">
                    <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-300">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <span>Google Search Result Preview</span>
                      </div>
                      <div className="bg-white text-gray-900 p-4 rounded-xl space-y-1 shadow-inner">
                        <div className="text-xs text-emerald-800 truncate font-mono">
                          https://stellarmartbd.com &gt; p &gt; {formData.slug || 'page-slug'}
                        </div>
                        <div className="text-lg font-semibold text-blue-800 hover:underline cursor-pointer line-clamp-1">
                          {formData.meta_title || formData.title_en || 'Page Title | StellarMartBD'}
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-2">
                          {formData.meta_description || 'StellarMartBD provides premium shopping and customer satisfaction across all 64 districts in Bangladesh.'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          SEO Meta Title (Recommended: 50-60 chars)
                        </label>
                        <span className={`text-xs font-mono ${formData.meta_title?.length > 60 ? 'text-amber-600' : 'text-gray-400'}`}>
                          {formData.meta_title?.length || 0} / 60
                        </span>
                      </div>
                      <input
                        type="text"
                        value={formData.meta_title}
                        onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                        placeholder="e.g. Return & Exchange Policy | StellarMartBD"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          SEO Meta Description (Recommended: 120-160 chars)
                        </label>
                        <span className={`text-xs font-mono ${formData.meta_description?.length > 160 ? 'text-amber-600' : 'text-gray-400'}`}>
                          {formData.meta_description?.length || 0} / 160
                        </span>
                      </div>
                      <textarea
                        rows="4"
                        value={formData.meta_description}
                        onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                        placeholder="e.g. Understand our simple 7-day return policy, warranty terms, and rapid refund process on StellarMartBD."
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: PUBLISHING SETTINGS */}
                {activeEditorTab === 'settings' && (
                  <div className="space-y-6">
                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-bold text-gray-900 text-sm">Public Storefront Visibility</div>
                        <p className="text-xs text-gray-500">
                          When published, this page is immediately accessible to buyers at /p/{formData.slug || 'slug'}.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-900 space-y-1">
                        <span className="font-bold">Pro Tip for Site Navigation:</span>
                        <p>
                          Once published, you can link this page in your website footer or announcement bars simply by referencing its path: <code className="bg-white px-1.5 py-0.5 rounded font-mono text-blue-800">/p/{formData.slug || 'your-slug'}</code>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              
              <div className="flex items-center gap-3">
                {activeEditorTab !== 'content' && (
                  <button
                    type="button"
                    onClick={() => setActiveEditorTab('content')}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-semibold"
                  >
                    Back to Content
                  </button>
                )}
                <button
                  form="pageForm"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingId ? 'Update Page' : 'Save & Publish Page'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {previewPage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
            {/* Preview Toolbar */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Eye className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold truncate max-w-sm">{previewPage.title_en}</h3>
                  <p className="text-[11px] text-gray-400 font-mono">/p/{previewPage.slug}</p>
                </div>
              </div>

              {/* Viewport switch */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white/10 p-1 rounded-xl">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded-lg transition-colors ${previewDevice === 'desktop' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    title="Desktop View"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded-lg transition-colors ${previewDevice === 'mobile' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    title="Mobile View"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>

                <a
                  href={`/p/${previewPage.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Live</span>
                </a>

                <button
                  onClick={() => setPreviewPage(null)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Canvas */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-6 flex justify-center">
              <div
                className={`bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-300 overflow-hidden ${
                  previewDevice === 'mobile' ? 'w-[375px] min-h-[600px]' : 'w-full'
                }`}
              >
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 sm:p-8">
                  <div className="text-xs text-blue-200 mb-2 flex items-center gap-1">
                    <span>Home</span> &gt; <span>Pages</span> &gt; <span className="text-white font-medium">{previewPage.title_en}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black">{previewPage.title_en}</h1>
                  {previewPage.title_bn && <p className="text-blue-200 text-sm mt-1">{previewPage.title_bn}</p>}
                </div>

                {/* Body Content */}
                <div className="p-6 sm:p-8">
                  <article
                    className="prose prose-blue max-w-none text-gray-800 text-sm leading-relaxed prose-headings:font-bold prose-headings:text-gray-900 prose-ul:list-disc prose-ul:pl-5"
                    dangerouslySetInnerHTML={{ __html: previewPage.content_en }}
                  />

                  {previewPage.content_bn && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h4 className="font-bold text-gray-900 text-sm mb-3">বাংলা সংস্করণ</h4>
                      <article
                        className="prose prose-blue max-w-none text-gray-700 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: previewPage.content_bn }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}