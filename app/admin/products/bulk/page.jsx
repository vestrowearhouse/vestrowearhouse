'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
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
  RefreshCw, 
  ExternalLink, 
  Search,
  Sparkles,
  HelpCircle,
  FileCheck,
  Check,
  ChevronRight,
  Image as ImageIcon,
  X,
  Eye,
  Info,
  Camera,
  Bot,
  Wand2
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { 
  parseUploadedFile, 
  parseTSV, 
  parseCSV, 
  downloadProductSampleCSV, 
  downloadExcelTemplate,
  exportToCSV
} from '@/lib/csvHelper';

export default function BulkProductsPage() {
  const router = useRouter();

  // State
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' | 'upload' | 'table' | 'paste'
  const [productsList, setProductsList] = useState([]);
  const [pasteText, setPasteText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'valid' | 'invalid'
  const [tableSearch, setTableSearch] = useState('');

  // Processing & Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitResult, setSubmitResult] = useState(null);
  const fileInputRef = useRef(null);

  // Image management states
  const [uploadingRowId, setUploadingRowId] = useState(null);
  const [imageModalProduct, setImageModalProduct] = useState(null);
  const [showImageGuide, setShowImageGuide] = useState(true);

  // Fast 1-Click Photo Import State with AI
  const [photoImportCategory, setPhotoImportCategory] = useState('');
  const [photoImportPrice, setPhotoImportPrice] = useState('');
  const [photoImportNotes, setPhotoImportNotes] = useState('');
  const [useAIAnalysis, setUseAIAnalysis] = useState(true);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [photoProcessCount, setPhotoProcessCount] = useState(0);
  const [totalPhotosToProcess, setTotalPhotosToProcess] = useState(0);
  const [aiCurrentStatus, setAiCurrentStatus] = useState('');
  const [aiAnalyzingRowId, setAiAnalyzingRowId] = useState(null);
  const photoInputRef = useRef(null);

  // Bulk Apply in Spreadsheet
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkPrice, setBulkPrice] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
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

  // Helper to validate a product row
  const validateRow = (item) => {
    const issues = [];
    if (!item.name || !String(item.name).trim()) {
      issues.push('Missing product name');
    }
    const price = parseFloat(item.sellingPrice || item.price);
    if (isNaN(price) || price < 0) {
      issues.push('Invalid selling price');
    }
    return issues;
  };

  // Handle uploaded file
  const handleFileUpload = async (file) => {
    if (!file) return;
    try {
      const rows = await parseUploadedFile(file);
      if (!rows || rows.length === 0) {
        alert('Could not parse any rows from this file. Please ensure the file has data and headers.');
        return;
      }

      // Format rows for the grid
      const formatted = rows.map((r, i) => ({
        id: `row-${Date.now()}-${i}`,
        name: r.name || '',
        nameBn: r.nameBn || '',
        sellingPrice: r.sellingPrice !== undefined && r.sellingPrice !== '' ? r.sellingPrice : '',
        regularPrice: r.regularPrice !== undefined && r.regularPrice !== '' ? r.regularPrice : '',
        stockQuantity: r.stockQuantity !== undefined && r.stockQuantity !== '' ? r.stockQuantity : 10,
        category: r.category || '',
        sku: r.sku || '',
        brand: r.brand || '',
        images: r.images || '',
        description: r.description || '',
        shortDescription: r.shortDescription || '',
        tags: r.tags || '',
        isFeatured: String(r.isFeatured).toLowerCase() === 'true' || r.isFeatured === true
      }));

      setProductsList(prev => [...prev, ...formatted]);
      setActiveTab('table');
    } catch (err) {
      console.error('File parsing error:', err);
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

  // Smart Paste Handler
  const handleParsePaste = () => {
    if (!pasteText.trim()) return;
    try {
      let parsed = [];
      if (pasteText.trim().startsWith('[') || pasteText.trim().startsWith('{')) {
        // Try JSON
        const rawJson = JSON.parse(pasteText);
        parsed = Array.isArray(rawJson) ? rawJson : (rawJson.products || [rawJson]);
      } else if (pasteText.includes('\t')) {
        // Tab-separated from Excel/Sheets
        parsed = parseTSV(pasteText);
      } else {
        // CSV formatted text
        parsed = parseCSV(pasteText);
      }

      if (!parsed || parsed.length === 0) {
        alert('Could not recognize product rows from pasted text. Please verify formatting.');
        return;
      }

      const formatted = parsed.map((r, i) => ({
        id: `paste-${Date.now()}-${i}`,
        name: r.name || '',
        nameBn: r.nameBn || '',
        sellingPrice: r.sellingPrice !== undefined && r.sellingPrice !== '' ? r.sellingPrice : '',
        regularPrice: r.regularPrice !== undefined && r.regularPrice !== '' ? r.regularPrice : '',
        stockQuantity: r.stockQuantity !== undefined && r.stockQuantity !== '' ? r.stockQuantity : 10,
        category: r.category || '',
        sku: r.sku || '',
        brand: r.brand || '',
        images: r.images || '',
        description: r.description || '',
        shortDescription: r.shortDescription || '',
        tags: r.tags || '',
        isFeatured: String(r.isFeatured).toLowerCase() === 'true' || r.isFeatured === true
      }));

      setProductsList(prev => [...prev, ...formatted]);
      setPasteText('');
      setActiveTab('table');
    } catch (err) {
      alert('Failed to parse pasted text: ' + err.message);
    }
  };

  // Parse images into normalized array
  const parseImagesToArray = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith('data:image/')) return [trimmed];
      try {
        const p = JSON.parse(trimmed);
        if (Array.isArray(p)) return p.filter(Boolean);
      } catch {}
      return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  // Handle direct file upload from device for a specific product row (uploads to Cloudinary)
  const handleRowImageUpload = async (rowId, files) => {
    if (!files || files.length === 0) return;
    setUploadingRowId(rowId);

    try {
      const uploadedUrls = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append('file', file);
        form.append('folder', 'stellar-mart/products');

        const res = await fetch('/api/admin/media', {
          method: 'POST',
          credentials: 'include',
          body: form,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Upload failed');
        }

        const data = await res.json();
        if (data.url) {
          uploadedUrls.push(data.url);
        }
      }

      setProductsList(prev => prev.map(item => {
        if (item.id === rowId) {
          const existing = parseImagesToArray(item.images);
          return { ...item, images: [...existing, ...uploadedUrls] };
        }
        return item;
      }));
    } catch (err) {
      console.error('Failed to upload images:', err);
      alert('Failed to upload images to Cloudinary: ' + err.message);
    } finally {
      setUploadingRowId(null);
    }
  };

  // Remove single image from row
  const handleRemoveImageFromRow = (rowId, imgIndex) => {
    setProductsList(prev => prev.map(item => {
      if (item.id === rowId) {
        const existing = parseImagesToArray(item.images);
        const filtered = existing.filter((_, idx) => idx !== imgIndex);
        return { ...item, images: filtered };
      }
      return item;
    }));
  };

  // Add image URL to row
  const handleAddUrlToRow = (rowId, url) => {
    if (!url || !url.trim()) return;
    setProductsList(prev => prev.map(item => {
      if (item.id === rowId) {
        const existing = parseImagesToArray(item.images);
        return { ...item, images: [...existing, url.trim()] };
      }
      return item;
    }));
  };

  // Clean filename to human readable product title
  const cleanFileNameToTitle = (filename) => {
    if (!filename) return 'New Product';
    let name = filename.replace(/\.[^/.]+$/, '');
    name = name.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    name = name.split(' ').map(w => w ? (w.charAt(0).toUpperCase() + w.slice(1)) : '').join(' ');
    return name || 'New Product';
  };

  // Handle Fast Multi-Photo Import (No-Pera Method)
  // Handle Fast Multi-Photo Import with optional AI Vision
  const handleFastPhotoImport = async (files) => {
    if (!files || files.length === 0) return;
    setIsProcessingPhotos(true);
    setPhotoProcessCount(0);
    const fileList = Array.from(files);
    setTotalPhotosToProcess(fileList.length);

    try {
      const newRows = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setPhotoProcessCount(i + 1);

        if (useAIAnalysis) {
          setAiCurrentStatus(`ছবি ${i + 1}/${fileList.length}: কম্প্রেস ও অপটিমাইজ হচ্ছে...`);
        }

        let fileToUpload = file;
        try {
          const options = {
            maxSizeMB: 0.25,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
            fileType: 'image/webp'
          };
          fileToUpload = await imageCompression(file, options);
        } catch (e) {
          console.warn('Compression error for', file.name, e);
        }

        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(fileToUpload);
        });

        const fallbackName = cleanFileNameToTitle(file.name);
        let finalProduct = {
          name: fallbackName,
          nameBn: '',
          sellingPrice: photoImportPrice ? String(photoImportPrice) : '',
          regularPrice: photoImportPrice ? String(photoImportPrice) : '',
          stockQuantity: 10,
          category: photoImportCategory || (categories.length > 0 ? categories[0].id : ''),
          sku: '',
          brand: '',
          images: [base64],
          description: '',
          shortDescription: '',
          tags: '',
          isFeatured: false,
          isAiGenerated: false
        };

        // Call AI Vision Analysis if enabled
        if (useAIAnalysis) {
          setAiCurrentStatus(`🤖 AI ছবি ${i + 1}/${fileList.length} স্ক্যান করছে: নাম, ক্যাটাগরি ও দাম তৈরি হচ্ছে...`);
          try {
            const aiRes = await fetch('/api/admin/ai/analyze-product', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image: base64,
                price: photoImportPrice || null,
                notes: photoImportNotes || null,
                categories: categories
              })
            });

            if (aiRes.ok) {
              const aiData = await aiRes.json();
              if (aiData.product) {
                finalProduct = {
                  ...finalProduct,
                  name: aiData.product.name || fallbackName,
                  nameBn: aiData.product.nameBn || '',
                  category: photoImportCategory || aiData.product.category || finalProduct.category,
                  sellingPrice: String(aiData.product.sellingPrice || photoImportPrice || ''),
                  regularPrice: String(aiData.product.regularPrice || photoImportPrice || ''),
                  brand: aiData.product.brand || '',
                  shortDescription: aiData.product.shortDescription || '',
                  tags: aiData.product.tags || '',
                  isAiGenerated: true
                };
              }
            }
          } catch (aiErr) {
            console.warn('AI Vision call fallback to filename:', aiErr);
          }
        }

        newRows.push({
          id: `photo-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
          ...finalProduct
        });
      }

      setProductsList(prev => [...newRows, ...prev]);
      setActiveTab('table');
    } catch (err) {
      console.error('Fast photo import error:', err);
      alert('Error importing photos: ' + err.message);
    } finally {
      setIsProcessingPhotos(false);
      setPhotoProcessCount(0);
      setAiCurrentStatus('');
    }
  };

  // Single Row AI Analyze
  const handleRowAiAnalyze = async (rowId) => {
    const item = productsList.find(p => p.id === rowId);
    if (!item) return;
    const imgs = parseImagesToArray(item.images);
    if (imgs.length === 0) {
      alert('AI স্ক্যান করার জন্য প্রথমে প্রোডাক্টের ছবি দিন (+ Upload এ ক্লিক করে ছবি দিন)');
      return;
    }

    setAiAnalyzingRowId(rowId);
    try {
      const res = await fetch('/api/admin/ai/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imgs[0],
          price: item.sellingPrice || null,
          notes: item.name ? `Current name: ${item.name}` : null,
          categories: categories
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.product) {
          setProductsList(prev => prev.map(p => {
            if (p.id === rowId) {
              return {
                ...p,
                name: data.product.name || p.name,
                nameBn: data.product.nameBn || p.nameBn,
                category: data.product.category || p.category,
                sellingPrice: data.product.sellingPrice !== undefined ? String(data.product.sellingPrice) : p.sellingPrice,
                regularPrice: data.product.regularPrice !== undefined ? String(data.product.regularPrice) : p.regularPrice,
                brand: data.product.brand || p.brand,
                shortDescription: data.product.shortDescription || p.shortDescription,
                tags: data.product.tags || p.tags,
                isAiGenerated: true
              };
            }
            return p;
          }));
        }
      } else {
        const err = await res.json();
        alert('AI Analysis failed: ' + (err.error || 'Server error'));
      }
    } catch (e) {
      console.error('Row AI analyze error:', e);
      alert('AI error: ' + e.message);
    } finally {
      setAiAnalyzingRowId(null);
    }
  };

  // Scan all rows with images using AI
  const handleScanAllRowsWithAi = async () => {
    const rowsWithImages = productsList.filter(p => parseImagesToArray(p.images).length > 0);
    if (rowsWithImages.length === 0) {
      alert('AI স্ক্যান করার জন্য টেবিলে অন্তত একটি প্রোডাক্টের ছবি থাকা প্রয়োজন।');
      return;
    }

    if (!confirm(`টেবিলের ${rowsWithImages.length}টি প্রোডাক্টের ছবি AI দিয়ে স্ক্যান করে নাম, বাংলা নাম ও ক্যাটাগরি তৈরি করতে চান?`)) {
      return;
    }

    setIsBulkAiScanning(true);

    for (const item of rowsWithImages) {
      setAiAnalyzingRowId(item.id);
      try {
        const imgs = parseImagesToArray(item.images);
        const res = await fetch('/api/admin/ai/analyze-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: imgs[0],
            price: item.sellingPrice || null,
            notes: item.name ? `Current: ${item.name}` : null,
            categories: categories
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.product) {
            setProductsList(prev => prev.map(p => {
              if (p.id === item.id) {
                return {
                  ...p,
                  name: data.product.name || p.name,
                  nameBn: data.product.nameBn || p.nameBn,
                  category: data.product.category || p.category,
                  sellingPrice: data.product.sellingPrice !== undefined ? String(data.product.sellingPrice) : p.sellingPrice,
                  regularPrice: data.product.regularPrice !== undefined ? String(data.product.regularPrice) : p.regularPrice,
                  brand: data.product.brand || p.brand,
                  shortDescription: data.product.shortDescription || p.shortDescription,
                  tags: data.product.tags || p.tags,
                  isAiGenerated: true
                };
              }
              return p;
            }));
          }
        }
      } catch (err) {
        console.warn('Error in bulk AI scan for item', item.id, err);
      }
    }

    setAiAnalyzingRowId(null);
    setIsBulkAiScanning(false);
  };

  // Bulk Apply Category to all items in grid
  const handleApplyBulkCategory = () => {
    if (!bulkCategory) {
      alert('অনুগ্রহ করে ড্রপডাউন থেকে একটি ক্যাটাগরি সিলেক্ট করুন');
      return;
    }
    setProductsList(prev => prev.map(p => ({ ...p, category: bulkCategory })));
  };

  // Bulk Apply Price to all items in grid
  const handleApplyBulkPrice = () => {
    const p = parseFloat(bulkPrice);
    if (isNaN(p) || p < 0) {
      alert('অনুগ্রহ করে একটি সঠিক দাম লিখুন');
      return;
    }
    setProductsList(prev => prev.map(item => ({
      ...item,
      sellingPrice: String(p),
      regularPrice: item.regularPrice ? item.regularPrice : String(p)
    })));
  };

  // Add empty row
  const handleAddEmptyRow = () => {
    const newRow = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: '',
      nameBn: '',
      sellingPrice: '',
      regularPrice: '',
      stockQuantity: 10,
      category: categories.length > 0 ? categories[0].id : '',
      sku: '',
      brand: '',
      images: '',
      description: '',
      shortDescription: '',
      tags: '',
      isFeatured: false
    };
    setProductsList(prev => [newRow, ...prev]);
    if (activeTab !== 'table') setActiveTab('table');
  };

  // Update a single cell in the grid
  const handleUpdateRow = (id, field, value) => {
    setProductsList(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Duplicate a row
  const handleDuplicateRow = (index) => {
    const target = productsList[index];
    if (!target) return;
    const duplicated = {
      ...target,
      id: `copy-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: target.name ? `${target.name} (Copy)` : '',
      sku: target.sku ? `${target.sku}-COPY` : ''
    };
    const updated = [...productsList];
    updated.splice(index + 1, 0, duplicated);
    setProductsList(updated);
  };

  // Delete a row
  const handleDeleteRow = (id) => {
    setProductsList(prev => prev.filter(item => item.id !== id));
  };

  // Filtered rows for table view
  const filteredProducts = productsList.filter(item => {
    const issues = validateRow(item);
    const isValid = issues.length === 0;

    if (filterMode === 'valid' && !isValid) return false;
    if (filterMode === 'invalid' && isValid) return false;

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(q);
      const matchSku = item.sku?.toLowerCase().includes(q);
      const matchBrand = item.brand?.toLowerCase().includes(q);
      return matchName || matchSku || matchBrand;
    }
    return true;
  });

  // Count stats
  const totalCount = productsList.length;
  const validCount = productsList.filter(item => validateRow(item).length === 0).length;
  const invalidCount = totalCount - validCount;

  // Submit to Backend API in Batches
  const handleSubmitBatch = async () => {
    if (productsList.length === 0) {
      alert('Please add or upload products first.');
      return;
    }

    if (validCount === 0) {
      alert('No valid products to import. Please ensure at least product name and price are provided.');
      return;
    }

    if (invalidCount > 0) {
      const proceed = confirm(
        `There are ${invalidCount} product(s) with missing required fields (Name or Selling Price).\n\nOnly the ${validCount} valid products will be imported. Do you want to proceed?`
      );
      if (!proceed) return;
    }

    setIsSubmitting(true);
    setUploadProgress(10);

    try {
      // Filter out invalid items for submission
      const validItems = productsList.filter(item => validateRow(item).length === 0);

      // Clean and normalize payloads
      const payloadProducts = validItems.map(item => ({
        name: item.name.trim(),
        nameBn: item.nameBn ? item.nameBn.trim() : null,
        sellingPrice: parseFloat(item.sellingPrice),
        regularPrice: item.regularPrice !== '' ? parseFloat(item.regularPrice) : parseFloat(item.sellingPrice),
        stockQuantity: item.stockQuantity !== '' ? parseInt(item.stockQuantity) : 0,
        category: item.category || null,
        sku: null,
        brand: item.brand ? item.brand.trim() : null,
        images: parseImagesToArray(item.images),
        description: item.description ? item.description.trim() : null,
        shortDescription: item.shortDescription ? item.shortDescription.trim() : null,
        tags: item.tags ? item.tags : [],
        isFeatured: Boolean(item.isFeatured),
        isActive: true
      }));

      setUploadProgress(40);

      const res = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: payloadProducts })
      });

      setUploadProgress(80);
      const data = await res.json();
      setUploadProgress(100);

      if (res.ok && data.success) {
        setSubmitResult({
          success: true,
          total: data.total || payloadProducts.length,
          insertedCount: data.insertedCount || 0,
          failedCount: data.failedCount || 0,
          errors: data.errors || []
        });

        // Remove successfully inserted items from state
        if (data.insertedCount > 0 && (!data.errors || data.errors.length === 0)) {
          setProductsList([]);
        }
      } else {
        setSubmitResult({
          success: false,
          message: data.error || 'Failed to complete bulk product import.',
          errors: data.errors || []
        });
      }
    } catch (err) {
      console.error('Bulk submission error:', err);
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
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <Link href="/admin/dashboard" className="hover:text-white transition-colors">Catalog</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/admin/products" className="hover:text-white transition-colors">Products</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-white">Bulk Add Products</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
              <span>📥</span>
              <span>Bulk Add Products</span>
              <span className="text-xs bg-blue-500/40 text-blue-100 font-bold px-2.5 py-1 rounded-full uppercase border border-blue-400/30">
                PRO Import
              </span>
            </h1>
            <p className="text-blue-100/90 text-sm mt-1 max-w-2xl">
              Import hundreds of products in seconds using CSV/Excel files, smart copy-paste from spreadsheets, or our live batch editor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-sm backdrop-blur-md transition-all border border-white/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Products</span>
            </Link>
          </div>
        </div>

        {/* Quick Template Download Strip */}
        <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-blue-100">
            <HelpCircle className="w-4 h-4 text-blue-300" />
            <span>Need sample format? Download our pre-filled template with field guides:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadProductSampleCSV()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-900 hover:bg-blue-50 rounded-lg font-bold shadow-sm transition-all text-xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-700" />
              <span>Download CSV Template</span>
            </button>
            <button
              onClick={() => downloadExcelTemplate('products')}
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
          onClick={() => setActiveTab('photos')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
            activeTab === 'photos'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
              : 'text-gray-700 hover:text-gray-950 hover:bg-gray-50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>⚡ ছবি দিয়ে সহজ অ্যাড (Easiest)</span>
          <span className="text-[10px] bg-amber-400 text-blue-950 font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
            NO PERA
          </span>
        </button>

        <button
          onClick={() => setActiveTab('table')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all relative ${
            activeTab === 'table'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Spreadsheet Editor</span>
          {productsList.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === 'table' ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {productsList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'upload'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload File (CSV / Excel)</span>
        </button>

        <button
          onClick={() => setActiveTab('paste')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'paste'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Smart Paste / Text</span>
        </button>
      </div>

      {/* TAB 0: 1-Click Fast Photo Import with AI Vision */}
      {activeTab === 'photos' && (
        <div className="bg-white rounded-2xl p-6 md:p-10 border border-gray-100 shadow-sm space-y-6">
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 text-purple-900 rounded-full text-xs font-extrabold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
              <span>স্মার্ট AI ভিশন: ছবি ও দাম দেখে স্বয়ংক্রিয় প্রোডাক্ট তৈরি</span>
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">
              ছবি ও দাম দিন, বাকি সব AI নিজে তৈরি করবে!
            </h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto">
              কোনো এক্সেল ফাইল বা লিঙ্কের ঝামেলা নেই। আপনার প্রোডাক্টের ছবি আপলোড করুন এবং দাম লিখে দিন। আমাদের AI ছবি দেখে আকর্ষণীয় টাইটেল, বাংলা নাম, সঠিক ক্যাটাগরি ও ডেসক্রিপশন বানিয়ে দেবে।
            </p>
          </div>

          {/* AI Input Parameters Card */}
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-purple-50/70 via-indigo-50/70 to-blue-50/70 border border-purple-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between border-b border-purple-100 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600" />
                <span className="font-extrabold text-sm text-purple-950">AI প্রোডাক্ট কনফিগারেশন:</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer bg-white/80 px-3 py-1.5 rounded-xl border border-purple-200 shadow-2xs">
                <input
                  type="checkbox"
                  checked={useAIAnalysis}
                  onChange={(e) => setUseAIAnalysis(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                />
                <span className="text-xs font-bold text-purple-900">
                  {useAIAnalysis ? '🤖 AI Vision সক্রিয় আছে' : 'সাধারণ মোড (শুধু ফাইলের নাম)'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-purple-950 block mb-1">
                  প্রোডাক্টের দাম / Selling Price (BDT):
                </label>
                <input
                  type="number"
                  placeholder="যেমন: 750 (AI এটা সেট করবে)"
                  value={photoImportPrice}
                  onChange={(e) => setPhotoImportPrice(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-white text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-2xs"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  *খালি রাখলে AI নিজে উপযুক্ত বাজারদর বসাবে
                </span>
              </div>

              <div>
                <label className="font-bold text-purple-950 block mb-1">
                  ক্যাটাগরি (ঐচ্ছিক):
                </label>
                <select
                  value={photoImportCategory}
                  onChange={(e) => setPhotoImportCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-white text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-2xs"
                >
                  <option value="">🤖 AI ছবি দেখে ক্যাটাগরি বেছে নেবে (অটো)</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <span className="text-[11px] text-gray-500 mt-1 block">
                  *নির্দিষ্ট কোনো ক্যাটাগরি ফিক্স করতে চাইলে সিলেক্ট করুন
                </span>
              </div>
            </div>

            <div>
              <label className="font-bold text-purple-950 block mb-1">
                অতিরিক্ত নির্দেশ / AI প্রম্পট নোট (ঐচ্ছিক):
              </label>
              <input
                type="text"
                placeholder="যেমন: ১০০% পিওর সুতি শার্ট, স্পেশাল ঈদ অফার বা সাইজ M, L, XL পাওয়া যাবে..."
                value={photoImportNotes}
                onChange={(e) => setPhotoImportNotes(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => !isProcessingPhotos && photoInputRef.current?.click()}
            className={`max-w-2xl mx-auto border-2 border-dashed rounded-3xl p-10 md:p-14 text-center cursor-pointer transition-all flex flex-col items-center justify-center group ${
              isProcessingPhotos 
                ? 'border-purple-400 bg-purple-50/50 cursor-wait' 
                : 'border-purple-300 hover:border-purple-600 bg-gradient-to-b from-purple-50/20 via-indigo-50/20 to-blue-50/30 hover:bg-purple-50/50 shadow-xs hover:shadow-xl'
            }`}
          >
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              disabled={isProcessingPhotos}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  handleFastPhotoImport(e.target.files);
                  e.target.value = '';
                }
              }}
            />

            {isProcessingPhotos ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg animate-pulse">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-purple-950">
                    {useAIAnalysis ? '🤖 AI ছবি বিশ্লেষণ করে প্রোডাক্ট তৈরি করছে...' : 'ছবি অপটিমাইজ হচ্ছে...'}
                  </h3>
                  <p className="text-xs font-semibold text-purple-700">
                    {photoProcessCount} / {totalPhotosToProcess} টি ছবি সম্পন্ন হয়েছে
                  </p>
                  <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                    {aiCurrentStatus || 'অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন, সরাসরি টেবিলে নিয়ে যাবে...'}
                  </p>
                </div>
                <div className="w-48 bg-purple-100 rounded-full h-2 mx-auto overflow-hidden">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${totalPhotosToProcess > 0 ? (photoProcessCount / totalPhotosToProcess) * 100 : 20}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-purple-500/25 group-hover:scale-110 transition-transform">
                  <Wand2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-800">
                    প্রোডাক্টের ছবিগুলো একসাথে সিলেক্ট করুন
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                    আপনার ফোন বা পিসি থেকে ৫টি, ১০টি বা ৫০টি ছবি একবারে দিন। ছবি ও দাম অনুযায়ী AI সাথে সাথে রেডি প্রোডাক্ট তৈরি করে দেবে!
                  </p>
                </div>
                <div>
                  <span className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-extrabold text-sm shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all">
                    <Sparkles className="w-4 h-4" />
                    <span>Select Product Photos (ছবি বাছুন)</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: File Upload Mode */}
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
                ? 'border-blue-600 bg-blue-50/60 scale-[0.99]' 
                : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/50'
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
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-inner">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              Drag & Drop your product spreadsheet here
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md">
              Supports CSV, Excel (<span className="font-semibold text-gray-700">.xlsx, .xls</span>), and JSON files up to 1,000 products per batch.
            </p>
            <div className="mt-5">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all">
                Browse File from Computer
              </span>
            </div>
          </div>

          {/* Supported Format Guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Column Header Guide:
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-red-600">name *</span>
                <p className="text-gray-500 text-[11px] mt-0.5">Product title (English)</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-red-600">sellingPrice *</span>
                <p className="text-gray-500 text-[11px] mt-0.5">Sale/Offer price in BDT</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-gray-700">regularPrice</span>
                <p className="text-gray-500 text-[11px] mt-0.5">MRP / Original price</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-gray-700">stockQuantity</span>
                <p className="text-gray-500 text-[11px] mt-0.5">Stock count (defaults to 10)</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-gray-700">category</span>
                <p className="text-gray-500 text-[11px] mt-0.5">Category name or UUID</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-gray-700">sku</span>
                <p className="text-gray-500 text-[11px] mt-0.5">Unique product code</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-gray-700">brand</span>
                <p className="text-gray-500 text-[11px] mt-0.5">Brand name</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-gray-700">images</span>
                <p className="text-gray-500 text-[11px] mt-0.5">Comma-separated image URLs</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Smart Paste Mode */}
      {activeTab === 'paste' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-gray-800 text-base">Paste Rows from Excel or Google Sheets</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Copy rows and columns directly from Excel or Google Sheets (Ctrl+C) and paste them below (Ctrl+V).
            </p>
          </div>

          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={10}
            placeholder={`Name\tSelling Price\tRegular Price\tStock\tCategory\tSKU\nWireless Mouse\t650\t850\t25\tElectronics\tWM-01\nGaming Keyboard\t1850\t2200\t15\tElectronics\tGK-02`}
            className="w-full font-mono text-xs p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {pasteText.trim() ? `${pasteText.trim().split('\n').length} row(s) detected` : 'Waiting for paste input...'}
            </span>
            <button
              onClick={handleParsePaste}
              disabled={!pasteText.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Parse & Add to Grid</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2 & Core Grid: Spreadsheet Editor */}
      <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${activeTab !== 'table' ? 'hidden' : 'block'}`}>
        {/* Table Toolbar */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleAddEmptyRow}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Row</span>
            </button>

            {productsList.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear all items from the editor?')) setProductsList([]);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-200 hover:bg-red-100 text-gray-700 hover:text-red-700 rounded-xl font-semibold text-xs transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All ({productsList.length})</span>
              </button>
            )}

            {/* Filter pills */}
            <div className="flex items-center bg-gray-200/70 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg transition-all ${filterMode === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
              >
                All ({totalCount})
              </button>
              <button
                onClick={() => setFilterMode('valid')}
                className={`px-3 py-1 rounded-lg transition-all ${filterMode === 'valid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Ready ({validCount})
              </button>
              {invalidCount > 0 && (
                <button
                  onClick={() => setFilterMode('invalid')}
                  className={`px-3 py-1 rounded-lg transition-all ${filterMode === 'invalid' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-600 hover:text-rose-800'}`}
                >
                  Has Issues ({invalidCount})
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search rows in table..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {productsList.length > 0 && (
              <button
                onClick={() => exportToCSV(productsList, 'current_products_draft.csv')}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-xs shadow-xs"
                title="Export current table to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Bulk Quick Setter Toolbar */}
        {productsList.length > 0 && (
          <div className="mx-5 mt-4 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>সব প্রোডাক্টে একসাথে বসান (Bulk Apply):</span>
              </span>
              <select
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-blue-200 bg-white text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- ক্যাটাগরি সিলেক্ট করুন --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleApplyBulkCategory}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-xs"
              >
                ক্যাটাগরি সেট করুন
              </button>

              <div className="h-4 w-px bg-blue-200 hidden sm:block mx-1"></div>

              <input
                type="number"
                placeholder="দাম (৳)"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                className="w-24 px-2.5 py-1.5 rounded-xl border border-blue-200 bg-white text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyBulkPrice}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-xs"
              >
                দাম সেট করুন
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleScanAllRowsWithAi}
                disabled={isBulkAiScanning || isImporting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all disabled:opacity-50"
                title="AI দিয়ে টেবিলের সব প্রোডাক্টের নাম ও ক্যাটাগরি অটো-ফিল করুন"
              >
                {isBulkAiScanning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{isBulkAiScanning ? 'AI স্ক্যান হচ্ছে...' : 'সবগুলোতে AI অটো-ফিল'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('photos')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-bold border border-blue-200 shadow-2xs transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>+ আরও ছবি দিয়ে প্রোডাক্ট যোগ করুন</span>
              </button>
            </div>
          </div>
        )}

        {/* Image Guidelines Banner */}
        {showImageGuide && (
          <div className="mx-5 my-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-950 relative shadow-xs">
            <button
              onClick={() => setShowImageGuide(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
              title="Hide tips"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Camera className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-1.5 pr-6">
                <h4 className="font-extrabold text-sm text-blue-900 flex items-center gap-2">
                  <span>📸 বাল্ক প্রোডাক্টে ছবি যুক্ত করার ৩টি সহজ উপায় (Image Guidelines)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-slate-700">
                  <div className="bg-white/85 backdrop-blur-xs p-3 rounded-xl border border-blue-100 shadow-2xs">
                    <span className="font-bold text-blue-700 block mb-1">১. সরাসরি কম্পিউটার/ফোন থেকে:</span>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      নিচে প্রতিটি প্রোডাক্টের লাইনে থাকা <strong className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">+ Upload</strong> বাটনে ক্লিক করে ডিভাইস থেকে ছবি দিন। ছবি স্বয়ংক্রিয়ভাবে ছোট সাইজে (WebP) কম্প্রেস হয়ে যাবে।
                    </p>
                  </div>
                  <div className="bg-white/85 backdrop-blur-xs p-3 rounded-xl border border-blue-100 shadow-2xs">
                    <span className="font-bold text-blue-700 block mb-1">২. এক্সেল বা CSV ফাইলে লিংক:</span>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      আপনার এক্সেল ফাইলের <strong className="text-slate-800">images</strong> কলামে ছবির লিঙ্ক দিন। একাধিক ছবি হলে কমা (,) দিয়ে আলাদা করুন, যেমন: <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[10px]">url1.jpg, url2.jpg</code>
                    </p>
                  </div>
                  <div className="bg-white/85 backdrop-blur-xs p-3 rounded-xl border border-blue-100 shadow-2xs">
                    <span className="font-bold text-blue-700 block mb-1">৩. ফ্রি ইমেজ হোস্টিং:</span>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      একসাথে ১০০+ ছবি থাকলে <a href="https://imgbb.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">ImgBB</a> বা <a href="https://postimages.org" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">Postimages</a> এ ড্রপ করে ডিরেক্ট লিঙ্কগুলো এক্সেলে বা টেবিল বক্সে বসিয়ে দিতে পারেন।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {productsList.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-gray-700 text-base">Your bulk product list is currently empty</h3>
            <p className="text-gray-400 text-xs mt-1 max-w-sm mx-auto">
              Upload a CSV/Excel file, paste rows from your spreadsheet, or click "Add New Row" to start editing manually.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={handleAddEmptyRow}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-blue-700"
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
          /* Interactive Table */
          <div className="overflow-x-auto max-h-[600px] border-b border-gray-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-100/80 sticky top-0 z-10 text-gray-600 uppercase font-black tracking-wider text-[11px] border-b border-gray-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 w-12 text-center">Status</th>
                  <th className="py-3 px-3 min-w-[200px]">Product Name *</th>
                  <th className="py-3 px-3 min-w-[150px]">Bangla Name</th>
                  <th className="py-3 px-3 min-w-[160px]">Category</th>
                  <th className="py-3 px-3 min-w-[110px]">Selling Price *</th>
                  <th className="py-3 px-3 min-w-[110px]">Regular Price</th>
                  <th className="py-3 px-3 min-w-[90px]">Stock</th>
                  <th className="py-3 px-3 min-w-[110px]">SKU</th>
                  <th className="py-3 px-3 min-w-[110px]">Brand</th>
                  <th className="py-3 px-3 min-w-[280px]">
                    <div className="flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Images / ছবি</span>
                    </div>
                  </th>
                  <th className="py-3 px-3 w-20 text-center">Featured</th>
                  <th className="py-3 px-3 w-20 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((item, idx) => {
                  const issues = validateRow(item);
                  const isValid = issues.length === 0;

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-blue-50/40 transition-colors ${
                        !isValid ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Row index */}
                      <td className="py-2.5 px-3 text-center text-gray-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Status indicator */}
                      <td className="py-2.5 px-3 text-center">
                        {isValid ? (
                          <div title="Ready to import" className="inline-flex text-emerald-500">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div title={issues.join(', ')} className="inline-flex text-rose-500 cursor-help">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      {/* Name (Required) */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateRow(item.id, 'name', e.target.value)}
                          placeholder="e.g. Wireless Mouse"
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:ring-1 focus:outline-none ${
                            !item.name?.trim() ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-500' : 'border-gray-200 focus:ring-blue-500'
                          }`}
                        />
                      </td>

                      {/* Name Bangla */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.nameBn || ''}
                          onChange={(e) => handleUpdateRow(item.id, 'nameBn', e.target.value)}
                          placeholder="বাংলা নাম"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>

                      {/* Category Selector */}
                      <td className="py-2.5 px-3">
                        <select
                          value={item.category || ''}
                          onChange={(e) => handleUpdateRow(item.id, 'category', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                        >
                          <option value="">-- Select Category --</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Selling Price (Required) */}
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          value={item.sellingPrice}
                          onChange={(e) => handleUpdateRow(item.id, 'sellingPrice', e.target.value)}
                          placeholder="0"
                          min="0"
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono focus:ring-1 focus:outline-none ${
                            item.sellingPrice === '' || isNaN(parseFloat(item.sellingPrice)) ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-500' : 'border-gray-200 focus:ring-blue-500'
                          }`}
                        />
                      </td>

                      {/* Regular Price */}
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          value={item.regularPrice}
                          onChange={(e) => handleUpdateRow(item.id, 'regularPrice', e.target.value)}
                          placeholder="0"
                          min="0"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          value={item.stockQuantity}
                          onChange={(e) => handleUpdateRow(item.id, 'stockQuantity', e.target.value)}
                          placeholder="10"
                          min="0"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>

                      {/* SKU */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value="Auto"
                          readOnly
                          disabled
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 text-xs font-mono select-none cursor-not-allowed"
                        />
                      </td>

                      {/* Brand */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.brand || ''}
                          onChange={(e) => handleUpdateRow(item.id, 'brand', e.target.value)}
                          placeholder="Brand"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>

                      {/* Images (Direct Upload or URLs) */}
                      <td className="py-2 px-3">
                        {(() => {
                          const imgList = parseImagesToArray(item.images);
                          const isUploadingThis = uploadingRowId === item.id;

                          return (
                            <div className="flex items-center gap-1.5 min-w-[260px]">
                              {/* Preview thumbnail if images present */}
                              {imgList.length > 0 && (
                                <div 
                                  onClick={() => setImageModalProduct(item)}
                                  title="Click to view and manage photos"
                                  className="relative cursor-pointer shrink-0 group"
                                >
                                  <img 
                                    src={imgList[0]} 
                                    alt="Thumbnail" 
                                    className="w-8 h-8 rounded-lg object-cover border border-gray-200 shadow-2xs group-hover:ring-2 group-hover:ring-blue-500 transition-all bg-gray-100" 
                                  />
                                  {imgList.length > 1 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[9px] font-bold px-1 rounded-full shadow-xs">
                                      +{imgList.length - 1}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Upload from computer button */}
                              <label 
                                className={`cursor-pointer inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 border ${
                                  imgList.length > 0 
                                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200' 
                                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 shadow-2xs'
                                } ${isUploadingThis ? 'opacity-50 pointer-events-none' : ''}`}
                                title="Upload image from computer / mobile"
                              >
                                {isUploadingThis ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                ) : (
                                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                                )}
                                <span>{isUploadingThis ? '...' : (imgList.length === 0 ? '+ Upload' : '+')}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  disabled={isUploadingThis}
                                  onChange={(e) => {
                                    if (e.target.files?.length) {
                                      handleRowImageUpload(item.id, e.target.files);
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </label>

                              {/* URL text input */}
                              <input
                                type="text"
                                value={typeof item.images === 'string' ? item.images : imgList.join(', ')}
                                onChange={(e) => handleUpdateRow(item.id, 'images', e.target.value)}
                                placeholder={imgList.length > 0 ? `${imgList.length} image(s)` : "Paste URL(s)..."}
                                className="w-full px-2 py-1 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                              />

                              {/* Eye button to open photo manager */}
                              {imgList.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setImageModalProduct(item)}
                                  title="Manage product photos"
                                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shrink-0"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Featured Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(item.isFeatured)}
                          onChange={(e) => handleUpdateRow(item.id, 'isFeatured', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* AI Magic wand for single row */}
                          {item.images && item.images.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleRowAiAnalyze(item.id)}
                              disabled={aiAnalyzingRowId === item.id || isBulkAiScanning}
                              title="AI দিয়ে এই প্রোডাক্টের ছবি অ্যানালাইজ করে নাম ও ক্যাটাগরি ফিল করুন"
                              className={`p-1 rounded transition-colors ${
                                aiAnalyzingRowId === item.id
                                  ? 'bg-purple-100 text-purple-600 animate-spin'
                                  : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50'
                              }`}
                            >
                              <Wand2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDuplicateRow(idx)}
                            title="Duplicate Row"
                            className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100 transition-colors"
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
        {productsList.length > 0 && (
          <div className="p-5 bg-slate-50 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs">
              <span className="font-semibold text-gray-700">
                Total Products: <span className="font-bold text-gray-900">{totalCount}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <Check className="w-3 h-3" />
                {validCount} Ready to Import
              </span>
              {invalidCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  <AlertTriangle className="w-3 h-3" />
                  {invalidCount} Need Correction
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleSubmitBatch}
                disabled={isSubmitting || validCount === 0}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Batch ({uploadProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Import {validCount} Products Now</span>
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
                    ? `Successfully imported ${submitResult.insertedCount} product(s)!` 
                    : 'Bulk Product Import Encountered Issues'}
                </h3>
                <p className="text-sm mt-1 opacity-90">
                  {submitResult.success 
                    ? 'All new products have been saved to the database, published to the catalog, and search caches refreshed.' 
                    : submitResult.message}
                </p>

                {submitResult.failedCount > 0 && (
                  <div className="mt-4 bg-white/80 rounded-xl p-4 border border-rose-200 text-xs space-y-2">
                    <p className="font-bold text-rose-800">
                      {submitResult.failedCount} product(s) could not be imported:
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
                href="/admin/products"
                className="px-4 py-2 bg-white text-gray-800 hover:bg-gray-100 rounded-xl font-bold text-xs shadow-sm border border-gray-200 transition-all"
              >
                Go to Products List
              </Link>
              <button
                onClick={() => setSubmitResult(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
              >
                Import More Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Image Manager Modal */}
      {imageModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Manage Images: {imageModalProduct.name || 'Unnamed Product'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Upload from computer/phone or paste direct URLs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImageModalProduct(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Images Grid */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">
                Attached Images ({parseImagesToArray(productsList.find(p => p.id === imageModalProduct.id)?.images || imageModalProduct.images).length}):
              </label>
              
              {(() => {
                const currentItem = productsList.find(p => p.id === imageModalProduct.id) || imageModalProduct;
                const currentImages = parseImagesToArray(currentItem.images);

                if (currentImages.length === 0) {
                  return (
                    <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400 space-y-1">
                      <p className="font-semibold text-gray-500">No images added yet</p>
                      <p>Upload files below or paste image URLs to attach pictures to this product.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
                    {currentImages.map((img, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square bg-gray-50 shadow-2xs">
                        <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                            Main
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImageFromRow(imageModalProduct.id, idx)}
                          title="Remove image"
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md opacity-90 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Upload New Files */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm">
                  {uploadingRowId === imageModalProduct.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Compressing & Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Browse from Computer / Phone</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingRowId === imageModalProduct.id}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        handleRowImageUpload(imageModalProduct.id, e.target.files);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
                <span className="text-xs text-gray-400 font-medium">Auto-compressed to WebP (&lt;250KB)</span>
              </div>

              {/* Add via URL */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-600">Or Add Image URL:</label>
                <div className="flex gap-2">
                  <input
                    id="modal-image-url-input"
                    type="text"
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.target.value.trim();
                        if (val) {
                          handleAddUrlToRow(imageModalProduct.id, val);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('modal-image-url-input');
                      if (input && input.value.trim()) {
                        handleAddUrlToRow(imageModalProduct.id, input.value.trim());
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Add URL
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setImageModalProduct(null)}
                className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
