'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FolderPlus, 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  ArrowLeft, 
  Loader2, 
  Search,
  Sparkles,
  HelpCircle,
  FileCheck,
  Check,
  ChevronRight,
  Folder
} from 'lucide-react';
import { 
  parseUploadedFile, 
  parseTSV, 
  parseCSV, 
  downloadCategorySampleCSV, 
  downloadExcelTemplate,
  exportToCSV
} from '@/lib/csvHelper';

export default function BulkCategoriesPage() {
  const router = useRouter();

  // State
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'table' | 'paste'
  const [categoryList, setCategoryList] = useState([]);
  const [pasteText, setPasteText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [tableSearch, setTableSearch] = useState('');

  // Processing & Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitResult, setSubmitResult] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch categories on mount
  useEffect(() => {
    fetchExistingCategories();
  }, []);

  const fetchExistingCategories = async () => {
    try {
      const res = await fetch(`/api/categories?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Helper to validate category row
  const validateCategory = (item) => {
    const issues = [];
    if (!item.name || !String(item.name).trim()) {
      issues.push('Missing category name');
    }
    return issues;
  };

  // Generate slug from name
  const autoSlug = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  // Handle uploaded file
  const handleFileUpload = async (file) => {
    if (!file) return;
    try {
      const rows = await parseUploadedFile(file);
      if (!rows || rows.length === 0) {
        alert('Could not parse any rows from this file. Please verify file content.');
        return;
      }

      const formatted = rows.map((r, i) => {
        const name = r.name || r.category || '';
        return {
          id: `cat-file-${Date.now()}-${i}`,
          name: name,
          slug: r.slug || autoSlug(name),
          parentId: r.parent_id || r.parentId || r.parentCategory || r.parent || '',
          description: r.description || '',
          icon: r.icon || '📦',
          image: r.image || '',
          status: r.status === 'inactive' ? 'inactive' : 'active',
          sortOrder: r.sort_order || r.sortOrder || (i + 1),
          isFeatured: String(r.isFeatured).toLowerCase() === 'true' || r.isFeatured === true
        };
      });

      setCategoryList(prev => [...prev, ...formatted]);
      setActiveTab('table');
    } catch (err) {
      console.error('Category file parsing error:', err);
      alert('Error reading file: ' + err.message);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Smart Paste Handler (supports simple list of 1 category per line, TSV, CSV, or JSON)
  const handleParsePaste = () => {
    if (!pasteText.trim()) return;
    try {
      let parsed = [];
      const trimmed = pasteText.trim();

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const rawJson = JSON.parse(trimmed);
        parsed = Array.isArray(rawJson) ? rawJson : (rawJson.categories || [rawJson]);
      } else if (trimmed.includes('\t')) {
        parsed = parseTSV(trimmed);
      } else if (trimmed.includes(',') && trimmed.includes('\n')) {
        parsed = parseCSV(trimmed);
      } else {
        // Simple list: one category name per line!
        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
        parsed = lines.map(line => ({ name: line }));
      }

      if (!parsed || parsed.length === 0) {
        alert('Could not find any categories in pasted text.');
        return;
      }

      const formatted = parsed.map((r, i) => {
        const name = r.name || r.category || '';
        return {
          id: `cat-paste-${Date.now()}-${i}`,
          name: name,
          slug: r.slug || autoSlug(name),
          parentId: r.parent_id || r.parentId || r.parentCategory || '',
          description: r.description || '',
          icon: r.icon || '📦',
          image: r.image || '',
          status: r.status === 'inactive' ? 'inactive' : 'active',
          sortOrder: r.sort_order || r.sortOrder || 0,
          isFeatured: String(r.isFeatured).toLowerCase() === 'true' || r.isFeatured === true
        };
      });

      setCategoryList(prev => [...prev, ...formatted]);
      setPasteText('');
      setActiveTab('table');
    } catch (err) {
      alert('Failed to parse pasted categories: ' + err.message);
    }
  };

  // Add empty row
  const handleAddEmptyRow = () => {
    const newRow = {
      id: `cat-manual-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: '',
      slug: '',
      parentId: '',
      description: '',
      icon: '📦',
      image: '',
      status: 'active',
      sortOrder: categoryList.length + 1,
      isFeatured: false
    };
    setCategoryList(prev => [newRow, ...prev]);
    if (activeTab !== 'table') setActiveTab('table');
  };

  // Update row cell
  const handleUpdateRow = (id, field, value) => {
    setCategoryList(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Auto update slug when name changes if user hasn't explicitly set a custom slug
        if (field === 'name' && (!item.slug || item.slug === autoSlug(item.name))) {
          updated.slug = autoSlug(value);
        }
        return updated;
      }
      return item;
    }));
  };

  // Duplicate a row
  const handleDuplicateRow = (index) => {
    const target = categoryList[index];
    if (!target) return;
    const duplicated = {
      ...target,
      id: `cat-copy-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: target.name ? `${target.name} (Sub)` : '',
      slug: target.slug ? `${target.slug}-copy` : ''
    };
    const updated = [...categoryList];
    updated.splice(index + 1, 0, duplicated);
    setCategoryList(updated);
  };

  // Delete a row
  const handleDeleteRow = (id) => {
    setCategoryList(prev => prev.filter(item => item.id !== id));
  };

  // Filtered categories
  const filteredCategories = categoryList.filter(item => {
    if (!tableSearch.trim()) return true;
    const q = tableSearch.toLowerCase();
    return item.name?.toLowerCase().includes(q) || item.slug?.toLowerCase().includes(q);
  });

  const totalCount = categoryList.length;
  const validCount = categoryList.filter(item => validateCategory(item).length === 0).length;
  const invalidCount = totalCount - validCount;

  // Submit to Backend API in Bulk
  const handleSubmitBatch = async () => {
    if (categoryList.length === 0) {
      alert('Please add or upload categories first.');
      return;
    }

    if (validCount === 0) {
      alert('No valid categories to import. Please provide category names.');
      return;
    }

    if (invalidCount > 0) {
      const proceed = confirm(
        `There are ${invalidCount} category item(s) missing a name.\n\nOnly the ${validCount} valid categories will be imported. Continue?`
      );
      if (!proceed) return;
    }

    setIsSubmitting(true);
    setUploadProgress(15);

    try {
      const validItems = categoryList.filter(item => validateCategory(item).length === 0);

      const payloadCategories = validItems.map(item => ({
        name: item.name.trim(),
        slug: item.slug ? item.slug.trim() : autoSlug(item.name),
        parent_id: item.parentId || null,
        description: item.description ? item.description.trim() : null,
        icon: item.icon ? item.icon.trim() : '📦',
        image: item.image ? item.image.trim() : null,
        status: item.status || 'active',
        sort_order: parseInt(item.sortOrder) || 0,
        isFeatured: Boolean(item.isFeatured)
      }));

      setUploadProgress(50);

      const res = await fetch('/api/admin/categories/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: payloadCategories })
      });

      setUploadProgress(90);
      const data = await res.json();
      setUploadProgress(100);

      if (res.ok && data.success) {
        setSubmitResult({
          success: true,
          total: data.total || payloadCategories.length,
          insertedCount: data.insertedCount || 0,
          failedCount: data.failedCount || 0,
          errors: data.errors || []
        });

        if (data.insertedCount > 0 && (!data.errors || data.errors.length === 0)) {
          setCategoryList([]);
          fetchExistingCategories();
        }
      } else {
        setSubmitResult({
          success: false,
          message: data.error || 'Failed to complete bulk category import.',
          errors: data.errors || []
        });
      }
    } catch (err) {
      console.error('Bulk category submission error:', err);
      setSubmitResult({
        success: false,
        message: 'Network or server error during upload: ' + err.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-900/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <Link href="/admin/dashboard" className="hover:text-white transition-colors">Catalog</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/admin/categories" className="hover:text-white transition-colors">Categories</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-white">Bulk Add Categories</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
              <span>📑</span>
              <span>Bulk Add Categories</span>
              <span className="text-xs bg-indigo-500/40 text-indigo-100 font-bold px-2.5 py-1 rounded-full uppercase border border-indigo-400/30">
                PRO Import
              </span>
            </h1>
            <p className="text-indigo-100/90 text-sm mt-1 max-w-2xl">
              Create entire catalog hierarchies in one operation. Upload CSV/Excel templates, paste plain category lists, or manage parent-child relationships in the grid.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/categories"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-sm backdrop-blur-md transition-all border border-white/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Categories</span>
            </Link>
          </div>
        </div>

        {/* Quick Template Download Strip */}
        <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-indigo-100">
            <HelpCircle className="w-4 h-4 text-indigo-300" />
            <span>Need sample category format? Download pre-configured templates:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadCategorySampleCSV()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-lg font-bold shadow-sm transition-all text-xs"
            >
              <Download className="w-3.5 h-3.5 text-indigo-700" />
              <span>Download CSV Template</span>
            </button>
            <button
              onClick={() => downloadExcelTemplate('categories')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold shadow-sm transition-all text-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'upload'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload File (CSV / Excel)</span>
        </button>

        <button
          onClick={() => setActiveTab('table')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all relative ${
            activeTab === 'table'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Category Grid Editor</span>
          {categoryList.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === 'table' ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-700'
            }`}>
              {categoryList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('paste')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'paste'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Quick List / Paste</span>
        </button>
      </div>

      {/* TAB 1: File Upload */}
      {activeTab === 'upload' && (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
              dragActive 
                ? 'border-indigo-600 bg-indigo-50/60 scale-[0.99]' 
                : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-inner">
              <FolderPlus className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              Drag & Drop your category spreadsheet here
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md">
              Upload CSV, Excel (.xlsx, .xls), or JSON with parent and child categories.
            </p>
            <div className="mt-5">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-500/20 transition-all">
                Browse Category File
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Quick List Paste */}
      {activeTab === 'paste' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-gray-800 text-base">Quick Category List Paste</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Paste category names (one per line) or copy-paste tab-separated columns directly from Excel.
            </p>
          </div>

          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={10}
            placeholder={`Electronics\nSmartphones & Gadgets\nMen Fashion\nWomen Fashion\nHome Appliances\nBeauty & Personal Care`}
            className="w-full font-mono text-xs p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50/50"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {pasteText.trim() ? `${pasteText.trim().split('\n').length} category line(s) detected` : 'Waiting for input...'}
            </span>
            <button
              onClick={handleParsePaste}
              disabled={!pasteText.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Parse & Add to Grid</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: Category Grid Editor */}
      <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${activeTab !== 'table' ? 'hidden' : 'block'}`}>
        {/* Table Toolbar */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleAddEmptyRow}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category Row</span>
            </button>

            {categoryList.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear all categories from the editor?')) setCategoryList([]);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-200 hover:bg-red-100 text-gray-700 hover:text-red-700 rounded-xl font-semibold text-xs transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All ({categoryList.length})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search categories in table..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            {categoryList.length > 0 && (
              <button
                onClick={() => exportToCSV(categoryList, 'current_categories_draft.csv')}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-xs shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {categoryList.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Folder className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-gray-700 text-base">Your bulk category list is empty</h3>
            <p className="text-gray-400 text-xs mt-1 max-w-sm mx-auto">
              Upload a spreadsheet, paste category names, or click "Add Category Row" to start adding categories.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={handleAddEmptyRow}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Row</span>
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs"
              >
                <Upload className="w-4 h-4" />
                <span>Upload File</span>
              </button>
            </div>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto max-h-[600px] border-b border-gray-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-100/80 sticky top-0 z-10 text-gray-600 uppercase font-black tracking-wider text-[11px] border-b border-gray-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 w-12 text-center">Status</th>
                  <th className="py-3 px-3 min-w-[200px]">Category Name *</th>
                  <th className="py-3 px-3 min-w-[160px]">URL Slug</th>
                  <th className="py-3 px-3 min-w-[180px]">Parent Category</th>
                  <th className="py-3 px-3 w-20 text-center">Icon / Emoji</th>
                  <th className="py-3 px-3 min-w-[200px]">Description</th>
                  <th className="py-3 px-3 w-24 text-center">State</th>
                  <th className="py-3 px-3 w-20 text-center">Featured</th>
                  <th className="py-3 px-3 w-20 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map((item, idx) => {
                  const issues = validateCategory(item);
                  const isValid = issues.length === 0;

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-indigo-50/40 transition-colors ${
                        !isValid ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center text-gray-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {isValid ? (
                          <div title="Ready" className="inline-flex text-emerald-500">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div title={issues.join(', ')} className="inline-flex text-rose-500 cursor-help">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateRow(item.id, 'name', e.target.value)}
                          placeholder="e.g. Smart Watches"
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:ring-1 focus:outline-none ${
                            !item.name?.trim() ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-500' : 'border-gray-200 focus:ring-indigo-500'
                          }`}
                        />
                      </td>

                      {/* Slug */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.slug || ''}
                          onChange={(e) => handleUpdateRow(item.id, 'slug', e.target.value)}
                          placeholder="smart-watches"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-mono text-gray-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </td>

                      {/* Parent Category */}
                      <td className="py-2.5 px-3">
                        <select
                          value={item.parentId || ''}
                          onChange={(e) => handleUpdateRow(item.id, 'parentId', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                        >
                          <option value="">-- None (Top Level) --</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Icon */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="text"
                          value={item.icon || '📦'}
                          onChange={(e) => handleUpdateRow(item.id, 'icon', e.target.value)}
                          className="w-12 text-center px-1.5 py-1.5 rounded-lg border border-gray-200 text-base focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </td>

                      {/* Description */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => handleUpdateRow(item.id, 'description', e.target.value)}
                          placeholder="Brief description..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center">
                        <select
                          value={item.status || 'active'}
                          onChange={(e) => handleUpdateRow(item.id, 'status', e.target.value)}
                          className="px-2 py-1 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>

                      {/* Featured */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(item.isFeatured)}
                          onChange={(e) => handleUpdateRow(item.id, 'isFeatured', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleDuplicateRow(idx)}
                            title="Duplicate Row"
                            className="p-1 text-gray-400 hover:text-indigo-600 rounded hover:bg-gray-100 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(item.id)}
                            title="Delete Row"
                            className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Bottom Submission Bar */}
        {categoryList.length > 0 && (
          <div className="p-5 bg-slate-50 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs">
              <span className="font-semibold text-gray-700">
                Total Categories: <span className="font-bold text-gray-900">{totalCount}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <Check className="w-3 h-3" />
                {validCount} Ready to Import
              </span>
              {invalidCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  <AlertTriangle className="w-3 h-3" />
                  {invalidCount} Need Name
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleSubmitBatch}
                disabled={isSubmitting || validCount === 0}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Batch ({uploadProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Import {validCount} Categories Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Result Modal / Summary Banner */}
      {submitResult && (
        <div className={`rounded-2xl p-6 border shadow-lg ${
          submitResult.success 
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950' 
            : 'bg-rose-50/90 border-rose-200 text-rose-950'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                submitResult.success ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                {submitResult.success ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  {submitResult.success 
                    ? `Successfully imported ${submitResult.insertedCount} category(s)!` 
                    : 'Bulk Category Import Failed'}
                </h3>
                <p className="text-sm mt-1 opacity-90">
                  {submitResult.success 
                    ? 'Categories and hierarchies have been updated and cached catalog layouts revalidated.' 
                    : submitResult.message}
                </p>

                {submitResult.failedCount > 0 && (
                  <div className="mt-4 bg-white/80 rounded-xl p-4 border border-rose-200 text-xs space-y-2">
                    <p className="font-bold text-rose-800">
                      {submitResult.failedCount} category(s) had errors:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-rose-700">
                      {submitResult.errors.map((err, i) => (
                        <li key={i}>
                          Row {err.row || '?'}: {err.name || 'Unnamed'} - <span className="font-semibold">{err.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/categories"
                className="px-4 py-2 bg-white text-gray-800 hover:bg-gray-100 rounded-xl font-bold text-xs shadow-sm border border-gray-200 transition-all"
              >
                Go to Categories List
              </Link>
              <button
                onClick={() => setSubmitResult(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
              >
                Import More Categories
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
