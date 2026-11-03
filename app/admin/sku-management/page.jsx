'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag,
  Layers,
  Palette,
  Maximize2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Edit2,
  ArrowRight,
  Database
} from 'lucide-react';

export default function SkuManagementPage() {
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'sizes' | 'colors' | 'registry'
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [registry, setRegistry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  // Modals state
  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ code: '', name: '', group_name: '' });

  const [showSizeModal, setShowSizeModal] = useState(false);
  const [sizeForm, setSizeForm] = useState({ code: '', name: '' });

  const [showColorModal, setShowColorModal] = useState(false);
  const [colorForm, setColorForm] = useState({ code: '', name: '', hex: '#000000' });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, sizeRes, colRes] = await Promise.all([
        fetch('/api/admin/sku/categories'),
        fetch('/api/admin/sku/sizes'),
        fetch('/api/admin/sku/colors'),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
      if (sizeRes.ok) {
        const sizeData = await sizeRes.json();
        setSizes(sizeData.sizes || []);
      }
      if (colRes.ok) {
        const colData = await colRes.json();
        setColors(colData.colors || []);
      }
    } catch (err) {
      console.error('Failed to load SKU tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text, type = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // ── Category Handlers ──
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catForm.code || !catForm.name || !catForm.group_name) {
      alert('Please fill all fields');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/sku/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save category');
      showMsg(`Category ${catForm.code} - ${catForm.name} saved!`);
      setShowCatModal(false);
      setCatForm({ code: '', name: '', group_name: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleCategoryActive = async (cat) => {
    try {
      const res = await fetch('/api/admin/sku/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cat.code, is_active: !cat.is_active })
      });
      if (res.ok) {
        showMsg(`Category ${cat.code} updated`);
        fetchData();
      }
    } catch (err) {
      alert('Failed to update category status');
    }
  };

  // ── Size Handlers ──
  const handleSaveSize = async (e) => {
    e.preventDefault();
    if (!sizeForm.code || !sizeForm.name) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/sku/sizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sizeForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save size');
      showMsg(`Size ${sizeForm.code} added`);
      setShowSizeModal(false);
      setSizeForm({ code: '', name: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSize = async (code) => {
    if (!confirm(`Delete size code ${code}?`)) return;
    try {
      const res = await fetch(`/api/admin/sku/sizes?code=${encodeURIComponent(code)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showMsg(`Size ${code} deleted`);
        fetchData();
      }
    } catch (err) {
      alert('Failed to delete size');
    }
  };

  // ── Color Handlers ──
  const handleSaveColor = async (e) => {
    e.preventDefault();
    if (!colorForm.code || !colorForm.name) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/sku/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(colorForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save color');
      showMsg(`Color ${colorForm.code} added`);
      setShowColorModal(false);
      setColorForm({ code: '', name: '', hex: '#000000' });
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteColor = async (code) => {
    if (!confirm(`Delete color code ${code}?`)) return;
    try {
      const res = await fetch(`/api/admin/sku/colors?code=${encodeURIComponent(code)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showMsg(`Color ${code} deleted`);
        fetchData();
      }
    } catch (err) {
      alert('Failed to delete color');
    }
  };

  // Filter lists
  const filteredCats = categories.filter(c =>
    c.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.code?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.group_name?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredSizes = sizes.filter(s =>
    s.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.code?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredColors = colors.filter(c =>
    c.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.code?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Tag className="w-4 h-4" />
            <span>Master Catalog Codes</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            SKU Code Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Configure 2-digit category codes, size codes, color codes, and live sequence counters without modifying code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
          >
            ← Back to Products
          </Link>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-bold ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 pt-2 rounded-t-2xl">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('categories'); setSearchFilter(''); }}
            className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('sizes'); setSearchFilter(''); }}
            className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sizes'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Maximize2 className="w-4 h-4" />
            <span>Sizes ({sizes.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('colors'); setSearchFilter(''); }}
            className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'colors'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Colors ({colors.length})</span>
          </button>
        </div>

        {/* Action button per tab */}
        <div>
          {activeTab === 'categories' && (
            <button
              onClick={() => setShowCatModal(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          )}
          {activeTab === 'sizes' && (
            <button
              onClick={() => setShowSizeModal(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Size</span>
            </button>
          )}
          {activeTab === 'colors' && (
            <button
              onClick={() => setShowColorModal(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Color</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-b-2xl border-x border-b border-gray-200">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={`Filter ${activeTab} by code, name...`}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* TAB 1: CATEGORIES TABLE */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-bold">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Category Name</th>
                  <th className="px-5 py-3">Group Name</th>
                  <th className="px-5 py-3">Last Serial Assigned</th>
                  <th className="px-5 py-3 text-center">Active Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCats.map((c) => (
                  <tr key={c.code} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5 font-mono font-extrabold text-blue-700">
                      {c.code}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-900">
                      {c.name}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                        {c.group_name || 'General'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-800">
                      <span className="font-bold">{c.last_serial || 0}</span>
                      <span className="text-gray-400 text-xs ml-1.5 font-sans">
                        (Next SKU: SMBD{c.code}{String((c.last_serial || 0) + 1).padStart(4, '0')})
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => toggleCategoryActive(c)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition ${
                          c.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {c.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>{c.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          const newName = prompt('Update category name:', c.name);
                          if (newName && newName.trim()) {
                            fetch('/api/admin/sku/categories', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ code: c.code, name: newName.trim() })
                            }).then(() => fetchData());
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold px-2 py-1 rounded hover:bg-blue-50"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SIZES TABLE */}
      {activeTab === 'sizes' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-bold">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Size Label / Name</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSizes.map((s) => (
                  <tr key={s.code} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5 font-mono font-extrabold text-blue-700">
                      {s.code}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-900">
                      {s.name}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteSize(s.code)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COLORS TABLE */}
      {activeTab === 'colors' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-bold">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Color Swatch</th>
                  <th className="px-5 py-3">Color Name</th>
                  <th className="px-5 py-3">Hex Value</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredColors.map((col) => (
                  <tr key={col.code} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5 font-mono font-extrabold text-blue-700">
                      {col.code}
                    </td>
                    <td className="px-5 py-3.5">
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300 shadow-2xs"
                        style={{ background: col.hex || '#ccc' }}
                      />
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-900">
                      {col.name}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-gray-600 text-xs">
                      {col.hex || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteColor(col.code)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New SKU Category</h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">2-Digit Code (e.g. 28)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={catForm.code}
                  onChange={(e) => setCatForm({ ...catForm, code: e.target.value })}
                  placeholder="28"
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="e.g. Traditional Vest"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={catForm.group_name}
                  onChange={(e) => setCatForm({ ...catForm, group_name: e.target.value })}
                  placeholder="e.g. Men's Fashion"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                >
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SIZE MODAL */}
      {showSizeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Size</h3>
            <form onSubmit={handleSaveSize} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Size Code (e.g. 08 or 46)</label>
                <input
                  type="text"
                  value={sizeForm.code}
                  onChange={(e) => setSizeForm({ ...sizeForm, code: e.target.value })}
                  placeholder="08"
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm uppercase"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Size Name / Label</label>
                <input
                  type="text"
                  value={sizeForm.name}
                  onChange={(e) => setSizeForm({ ...sizeForm, name: e.target.value })}
                  placeholder="e.g. 5XL or Size 46"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSizeModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                >
                  {saving ? 'Saving...' : 'Save Size'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD COLOR MODAL */}
      {showColorModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Color</h3>
            <form onSubmit={handleSaveColor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Color Code (e.g. 19)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={colorForm.code}
                  onChange={(e) => setColorForm({ ...colorForm, code: e.target.value })}
                  placeholder="19"
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Color Name</label>
                <input
                  type="text"
                  value={colorForm.name}
                  onChange={(e) => setColorForm({ ...colorForm, name: e.target.value })}
                  placeholder="e.g. Cyan"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Color Hex (e.g. #06B6D4)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={colorForm.hex?.startsWith('#') ? colorForm.hex : '#000000'}
                    onChange={(e) => setColorForm({ ...colorForm, hex: e.target.value })}
                    className="w-10 h-10 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={colorForm.hex}
                    onChange={(e) => setColorForm({ ...colorForm, hex: e.target.value })}
                    placeholder="#06B6D4"
                    className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowColorModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                >
                  {saving ? 'Saving...' : 'Save Color'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

