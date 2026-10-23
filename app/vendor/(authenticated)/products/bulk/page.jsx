'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  HelpCircle,
  FileCheck,
  Check,
  Package
} from 'lucide-react';
import {
  parseUploadedFile,
  parseCSV,
  downloadProductSampleCSV,
  downloadExcelTemplate
} from '@/lib/csvHelper';

export default function VendorBulkProductsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'table' | 'paste'
  const [productsList, setProductsList] = useState([]);
  const [pasteText, setPasteText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    try {
      showToast('Processing file...', 'success');
      const parsed = await parseUploadedFile(file);
      if (parsed && parsed.length > 0) {
        // Map to standard product items
        const normalized = parsed.map((item, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          name: item.name || item.title || item['Product Name'] || item['Product Title'] || '',
          price: parseFloat(item.price || item.sellingPrice || item['Price'] || 0) || '',
          original_price: parseFloat(item.original_price || item.regularPrice || item['Regular Price'] || 0) || '',
          stock: parseInt(item.stock || item.stockQuantity || item['Stock'] || 0) || 10,
          category: item.category || item['Category'] || 'General',
          sku: item.sku || item['SKU'] || '',
          description: item.description || item['Description'] || '',
          image: item.image || item.image_url || item['Image URL'] || '',
          isValid: Boolean(item.name || item.title) && Boolean(item.price)
        }));

        setProductsList(prev => [...prev, ...normalized]);
        setActiveTab('table');
        showToast(`Imported ${normalized.length} products to editor!`);
      } else {
        showToast('No valid product rows found in file', 'error');
      }
    } catch (err) {
      console.error('File parsing error:', err);
      showToast('Error reading file. Please check template format.', 'error');
    }
  };

  const handlePasteProcess = () => {
    if (!pasteText.trim()) return;
    try {
      const parsed = parseCSV(pasteText.trim());
      if (parsed && parsed.length > 0) {
        const normalized = parsed.map((item, idx) => ({
          id: `item-paste-${Date.now()}-${idx}`,
          name: item.name || item.title || '',
          price: parseFloat(item.price) || '',
          original_price: parseFloat(item.original_price || item.regularPrice) || '',
          stock: parseInt(item.stock) || 10,
          category: item.category || 'General',
          sku: item.sku || '',
          description: item.description || '',
          image: item.image || '',
          isValid: Boolean(item.name || item.title) && Boolean(item.price)
        }));

        setProductsList(prev => [...prev, ...normalized]);
        setPasteText('');
        setActiveTab('table');
        showToast(`Parsed ${normalized.length} items from clipboard!`);
      } else {
        showToast('Could not parse clipboard text. Please ensure comma-separated values.', 'error');
      }
    } catch {
      showToast('Failed to parse pasted text', 'error');
    }
  };

  const handleRowChange = (id, field, value) => {
    setProductsList(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          updated.isValid = Boolean(updated.name?.trim()) && Boolean(Number(updated.price) > 0);
          return updated;
        }
        return item;
      })
    );
  };

  const handleDeleteRow = (id) => {
    setProductsList(prev => prev.filter(item => item.id !== id));
  };

  const handleAddBlankRow = () => {
    setProductsList(prev => [
      ...prev,
      {
        id: `blank-${Date.now()}`,
        name: '',
        price: '',
        original_price: '',
        stock: 10,
        category: 'General',
        sku: '',
        description: '',
        image: '',
        isValid: false
      }
    ]);
    setActiveTab('table');
  };

  const handleBatchSubmit = async () => {
    const validItems = productsList.filter(p => p.name?.trim() && Number(p.price) > 0);
    if (validItems.length === 0) {
      showToast('No valid products to submit. Please ensure name and price are set.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/vendor/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ products: validItems })
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitResult({
          success: true,
          count: data.count || validItems.length,
          message: data.message || `Successfully published ${validItems.length} products to store!`
        });
        setProductsList([]);
      } else {
        showToast(data.error || 'Failed to submit batch products', 'error');
      }
    } catch (err) {
      console.error('Batch upload error:', err);
      showToast('Network error during batch upload', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = productsList.filter(p => p.name?.trim() && Number(p.price) > 0).length;
  const invalidCount = productsList.length - validCount;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 ${
          toast.type === 'error' ? 'bg-red-900 text-white border-red-700' : 'bg-emerald-900 text-white border-emerald-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-300" /> : <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/vendor/products"
              className="text-xs font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Products</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-indigo-600" />
            <span>Bulk Product Import</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload multiple products at once using Excel or CSV spreadsheets, or paste rows directly.
          </p>
        </div>

        {/* Template Downloads */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => downloadProductSampleCSV()}
            className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Sample CSV</span>
          </button>
          <button
            onClick={() => downloadExcelTemplate()}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-xs transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Excel Template (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'upload' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload File</span>
        </button>

        <button
          onClick={() => setActiveTab('table')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'table' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Spreadsheet Editor ({productsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('paste')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'paste' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Copy-Paste CSV Text</span>
        </button>
      </div>

      {/* Tab 1: Upload Dropzone */}
      {activeTab === 'upload' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
          }}
          className={`p-12 sm:p-16 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer bg-white ${
            dragActive ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99]' : 'border-gray-200 hover:border-indigo-400'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls, .tsv"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-sm">
            <Upload className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-black text-gray-900">
            Click to upload or drag & drop spreadsheet
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md">
            Supports Excel (.xlsx, .xls), CSV, or TSV files up to 25MB. Download the template above for best results.
          </p>
        </div>
      )}

      {/* Tab 2: Copy-Paste Text Area */}
      {activeTab === 'paste' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Paste Comma-Separated Values (CSV)</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Copy tabular data from Google Sheets or Excel and paste it here.
            </p>
          </div>

          <textarea
            rows={8}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="title,price,stock,category,sku&#10;Wireless Earbuds,1500,25,Electronics,EAR-01&#10;Casual Cotton Shirt,850,50,Fashion,SHT-02"
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          />

          <div className="flex justify-end">
            <button
              onClick={handlePasteProcess}
              disabled={!pasteText.trim()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
            >
              Parse & Load into Editor
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Table Editor */}
      {productsList.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-500">
                Total Rows: <strong className="text-gray-900">{productsList.length}</strong>
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Valid: {validCount}
              </span>
              {invalidCount > 0 && (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Needs Attention: {invalidCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddBlankRow}
                className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>

              <button
                onClick={handleBatchSubmit}
                disabled={isSubmitting || validCount === 0}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                <span>Publish {validCount} Products</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">#</th>
                  <th className="py-3 px-4 font-bold">Product Name *</th>
                  <th className="py-3 px-4 font-bold">Selling Price (৳) *</th>
                  <th className="py-3 px-4 font-bold">Regular Price (৳)</th>
                  <th className="py-3 px-4 font-bold">Stock</th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold">SKU</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {productsList.map((item, idx) => (
                  <tr key={item.id} className={!item.isValid ? 'bg-amber-50/30' : 'hover:bg-gray-50/50'}>
                    <td className="py-2 px-4 text-gray-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleRowChange(item.id, 'name', e.target.value)}
                        placeholder="Required: Product Name"
                        className="w-full px-2.5 py-1.5 bg-transparent border border-transparent hover:border-gray-300 focus:border-indigo-500 focus:bg-white rounded-lg outline-none transition-all font-semibold"
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="number"
                        min="1"
                        value={item.price}
                        onChange={(e) => handleRowChange(item.id, 'price', e.target.value)}
                        placeholder="৳ Price"
                        className="w-24 px-2.5 py-1.5 bg-transparent border border-transparent hover:border-gray-300 focus:border-indigo-500 focus:bg-white rounded-lg outline-none transition-all font-bold text-gray-900"
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="number"
                        min="0"
                        value={item.original_price}
                        onChange={(e) => handleRowChange(item.id, 'original_price', e.target.value)}
                        placeholder="৳ Regular"
                        className="w-24 px-2.5 py-1.5 bg-transparent border border-transparent hover:border-gray-300 focus:border-indigo-500 focus:bg-white rounded-lg outline-none transition-all text-gray-500"
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="number"
                        min="0"
                        value={item.stock}
                        onChange={(e) => handleRowChange(item.id, 'stock', e.target.value)}
                        className="w-20 px-2.5 py-1.5 bg-transparent border border-transparent hover:border-gray-300 focus:border-indigo-500 focus:bg-white rounded-lg outline-none transition-all"
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => handleRowChange(item.id, 'category', e.target.value)}
                        className="w-28 px-2.5 py-1.5 bg-transparent border border-transparent hover:border-gray-300 focus:border-indigo-500 focus:bg-white rounded-lg outline-none transition-all"
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={item.sku}
                        onChange={(e) => handleRowChange(item.id, 'sku', e.target.value)}
                        placeholder="SKU-XXX"
                        className="w-24 px-2.5 py-1.5 bg-transparent border border-transparent hover:border-gray-300 focus:border-indigo-500 focus:bg-white rounded-lg outline-none transition-all font-mono"
                      />
                    </td>
                    <td className="py-2 px-4 text-right">
                      <button
                        onClick={() => handleDeleteRow(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {submitResult && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-gray-100 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900">Upload Complete!</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {submitResult.message}
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/vendor/products"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-indigo-500/20"
              >
                Go to Products List
              </Link>
              <button
                onClick={() => setSubmitResult(null)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all"
              >
                Upload More Products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
