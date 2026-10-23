'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Package,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  Trash2,
  CheckCircle2,
  Edit3,
  ExternalLink,
  X,
  FileSpreadsheet,
  Layers,
  Upload,
  ChevronDown,
  Sparkles,
  Star,
  Home,
  Store
} from 'lucide-react';
import DynamicAttributeBuilder from '@/app/components/DynamicAttributeBuilder';
import VariantTable from '@/app/components/VariantTable';
import { cartesianProduct, buildVariants, generateStmSku } from '@/lib/variantUtils';

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendorShopName, setVendorShopName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [restockingProduct, setRestockingProduct] = useState(null);
  const [newStockValue, setNewStockValue] = useState(0);
  const [isSavingStock, setIsSavingStock] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Modal & Form State (Hubohu Admin Panel)
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageInput, setImageInput] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    nameBn: '',
    description: '',
    descriptionBn: '',
    shortDescription: '',
    regularPrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    category: '',
    sku: '',
    brand: '',
    tags: [],
    tagsInput: '',
    images: [],
    featuredImage: '',
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    isActive: true,
    attributes: [],
    variants: [],
  });

  const showToast = (msg, type = 'success') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleQuickRestock = async (e) => {
    e.preventDefault();
    if (!restockingProduct) return;
    setIsSavingStock(true);
    try {
      const res = await fetch(`/api/vendor/products/${restockingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ stock: Number(newStockValue) })
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === restockingProduct.id ? { ...p, stock: Number(newStockValue), stockQuantity: Number(newStockValue) } : p));
        showToast(`Stock updated to ${newStockValue} for "${restockingProduct.name}"!`);
        setRestockingProduct(null);
      } else {
        showToast('Failed to update stock', 'error');
      }
    } catch {
      showToast('Network error while updating stock', 'error');
    } finally {
      setIsSavingStock(false);
    }
  };

  const fetchProducts = async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      else setLoading(true);

      const [res, catRes, profileRes] = await Promise.all([
        fetch('/api/vendor/products', { credentials: 'include' }),
        fetch(`/api/categories?status=active&t=${Date.now()}`, { cache: 'no-store' }),
        fetch('/api/vendor/profile', { cache: 'no-store' }).catch(() => null)
      ]);

      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Failed to load products', 'error');
      }

      if (catRes.ok) {
        const cData = await catRes.json();
        setCategories(cData.categories || []);
      }

      if (profileRes && profileRes.ok) {
        const pData = await profileRes.json();
        if (pData?.shop_name) setVendorShopName(pData.shop_name);
      }
    } catch (err) {
      showToast('Error loading products', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (productId, productName) => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This cannot be undone.`)) return;

    setDeletingId(productId);
    try {
      const res = await fetch(`/api/vendor/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        showToast(`Product "${productName}" deleted successfully.`);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Failed to delete product', 'error');
      }
    } catch (err) {
      showToast('Error deleting product', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Image Upload handler (Cloudinary via /api/vendor/upload)
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const form = new FormData();
        form.append('file', file);

        const res = await fetch('/api/vendor/upload', {
          method: 'POST',
          credentials: 'include',
          body: form,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Upload failed');
        }

        const data = await res.json();
        const cloudinaryUrl = data.url;

        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, cloudinaryUrl],
          featuredImage: prev.featuredImage || cloudinaryUrl,
        }));
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Image upload failed: ' + error.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const addImage = () => {
    const url = imageInput.trim();
    if (!url) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, url],
      featuredImage: prev.featuredImage || url,
    }));
    setImageInput('');
  };

  const removeImage = (index) => {
    setFormData((prev) => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages,
        featuredImage: prev.featuredImage === prev.images[index] ? (newImages[0] || '') : prev.featuredImage,
      };
    });
  };

  const setAsFeatured = (img) => {
    setFormData((prev) => ({ ...prev, featuredImage: img }));
  };

  // Variant Helpers
  const handleAttributesChange = (updatedAttributes) => {
    setFormData((prev) => ({ ...prev, attributes: updatedAttributes }));
  };

  const handleVariantsChange = (updatedVariants) => {
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const generateVariants = () => {
    const combinations = cartesianProduct(formData.attributes);
    if (combinations.length === 0) {
      alert('Please add at least one attribute with values first.');
      return;
    }
    const baseSku = formData.sku?.trim() ? formData.sku.trim().toLowerCase() : generateStmSku('stm');
    const newVariants = buildVariants(
      combinations,
      formData.variants,
      formData.name,
      formData.sellingPrice || 0,
      baseSku
    );
    setFormData((prev) => ({ ...prev, variants: newVariants, sku: prev.sku || baseSku }));
  };

  // AI Helpers
  const generateAITags = async () => {
    if (!formData.name) {
      alert('Please enter a product name first!');
      return;
    }
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/admin/ai/generate-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: formData.name }),
      });
      const data = await res.json();
      if (data.tags) {
        setFormData((prev) => ({
          ...prev,
          tagsInput: data.tags,
          tags: data.tags.split(',').map((t) => t.trim()).filter(Boolean),
        }));
      }
    } catch (error) {
      console.error('Failed to generate tags:', error);
      alert('AI generation failed.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const generateAIDescription = async () => {
    if (!formData.name) {
      alert('Please enter a product name first!');
      return;
    }
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/admin/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.name,
          brand: formData.brand,
          shortDescription: formData.shortDescription,
        }),
      });
      const data = await res.json();
      if (data.description || data.descriptionBn) {
        setFormData((prev) => ({
          ...prev,
          description: data.description || prev.description,
          descriptionBn: data.descriptionBn || prev.descriptionBn,
        }));
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error('Failed to generate description:', error);
      alert('AI description generation failed.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Form Reset and Edit Handlers
  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      nameBn: '',
      description: '',
      descriptionBn: '',
      shortDescription: '',
      regularPrice: 0,
      sellingPrice: 0,
      stockQuantity: 0,
      category: '',
      sku: '',
      brand: '',
      tags: [],
      tagsInput: '',
      images: [],
      featuredImage: '',
      isFeatured: false,
      isNewArrival: false,
      isBestSeller: false,
      isActive: true,
      attributes: [],
      variants: [],
    });
    setImageInput('');
  };

  const handleEdit = (product) => {
    setEditingProduct(product);

    let catId = '';
    if (product.category) {
      catId = typeof product.category === 'object'
        ? (product.category.id || product.category._id || product.category.category_id)
        : product.category;
    }

    setFormData({
      name: product.name || '',
      nameBn: product.nameBn || '',
      description: product.description || '',
      descriptionBn: product.descriptionBn || '',
      shortDescription: product.shortDescription || '',
      regularPrice: product.regularPrice || product.original_price || product.oldPrice || 0,
      sellingPrice: product.sellingPrice || product.price || 0,
      stockQuantity: product.stockQuantity || product.stock || 0,
      category: catId || '',
      sku: product.sku || '',
      brand: product.brand || '',
      tags: Array.isArray(product.tags) ? product.tags : [],
      tagsInput: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      images: Array.isArray(product.images) ? product.images : [],
      featuredImage: product.featuredImage || (product.images && product.images[0]) || '',
      isFeatured: Boolean(product.isFeatured || product.featured),
      isNewArrival: Boolean(product.isNewArrival),
      isBestSeller: Boolean(product.isBestSeller),
      isActive: product.isActive !== undefined ? product.isActive : (product.status ? product.status === 'active' : true),
      attributes: Array.isArray(product.attributes) ? product.attributes : [],
      variants: Array.isArray(product.variants) ? product.variants : [],
    });

    setShowModal(true);
  };

  // Submit Handler for Add / Edit Modal
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    if (!formData.name.trim()) {
      alert('Product Name is required!');
      return;
    }
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      alert('Please provide a valid Selling Price.');
      return;
    }

    setIsSaving(true);
    try {
      const categoryId = formData.category || null;
      const { tagsInput, category, sellingPrice, regularPrice, stockQuantity, ...cleanFormData } = formData;

      // Ensure SKU follows stm-0000 format
      let finalSku = formData.sku?.trim() ? formData.sku.trim().toLowerCase() : generateStmSku('stm');

      // If user provided attributes with values, but variants array is empty, auto-generate variants
      let finalVariants = Array.isArray(formData.variants) ? [...formData.variants] : [];
      if (
        formData.attributes?.some((a) => a.values && a.values.length > 0) &&
        finalVariants.length === 0
      ) {
        const combos = cartesianProduct(formData.attributes);
        if (combos.length > 0) {
          finalVariants = buildVariants(combos, [], formData.name, parseFloat(sellingPrice) || 0, finalSku);
        }
      }

      const productData = {
        ...cleanFormData,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        sellingPrice: parseFloat(sellingPrice) || 0,
        regularPrice: parseFloat(regularPrice) || parseFloat(sellingPrice) || 0,
        stockQuantity: parseInt(stockQuantity) || 0,
        price: parseFloat(sellingPrice) || 0,
        oldPrice: parseFloat(regularPrice) || parseFloat(sellingPrice) || 0,
        original_price: parseFloat(regularPrice) || parseFloat(sellingPrice) || 0,
        stock: parseInt(stockQuantity) || 0,
        category: categoryId,
        sku: finalSku,
        brand: formData.brand?.trim() || '',
        tags: formData.tags || [],
        images: formData.images || [],
        featuredImage: formData.featuredImage || (formData.images && formData.images[0]) || '',
        attributes: formData.attributes || [],
        variants: finalVariants,
        isFeatured: Boolean(formData.isFeatured),
        isNewArrival: Boolean(formData.isNewArrival),
        isBestSeller: Boolean(formData.isBestSeller),
      };

      let url = '/api/vendor/products';
      let method = 'POST';

      if (editingProduct) {
        const productId = editingProduct.id || editingProduct._id || editingProduct.product_id;
        url = `/api/vendor/products/${productId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchProducts();
        showToast(editingProduct ? 'Product updated successfully!' : 'Product created and published!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = products.filter((p) => {
    // Tab filter
    const stockQty = Number(p.stock || p.stockQuantity || 0);
    if (filterTab === 'in_stock' && stockQty <= 0) return false;
    if (filterTab === 'low_stock' && (stockQty <= 0 || stockQty > 5)) return false;
    if (filterTab === 'out_of_stock' && stockQty > 0) return false;
    if (filterTab === 'pending' && p.approval_status !== 'pending') return false;

    // Search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const nameMatch = p.name?.toLowerCase().includes(term);
      const skuMatch = p.sku?.toLowerCase().includes(term);
      const catMatch = typeof p.category === 'string' ? p.category.toLowerCase().includes(term) : false;
      return nameMatch || skuMatch || catMatch;
    }
    return true;
  });

  const inStockCount = products.filter(p => (Number(p.stock || p.stockQuantity || 0)) > 0).length;
  const lowStockCount = products.filter(p => {
    const s = Number(p.stock || p.stockQuantity || 0);
    return s > 0 && s <= 5;
  }).length;
  const outOfStockCount = products.filter(p => (Number(p.stock || p.stockQuantity || 0)) <= 0).length;
  const pendingCount = products.filter(p => p.approval_status === 'pending').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 ${
          toastMsg.type === 'error' ? 'bg-red-900 text-white border-red-700' : 'bg-emerald-900 text-white border-emerald-700'
        }`}>
          {toastMsg.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-300" /> : <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
          <span>{toastMsg.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
              Catalog Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-blue-600" />
            <span>My Store Products</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your store catalog inventory, update prices, monitor stock quantities, and view product status.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => fetchProducts(true)}
            disabled={isRefreshing}
            className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 active:scale-95 border border-gray-200 rounded-xl font-bold text-xs text-gray-700 transition-all flex items-center gap-2 disabled:opacity-50"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <Link
            href="/vendor/products/bulk"
            className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs transition-all flex items-center gap-2"
            title="Batch Upload Products via CSV or Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>Bulk Import</span>
          </Link>

          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards (5-col Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Listings</span>
          <h3 className="text-2xl font-black text-gray-900 mt-2">{products.length}</h3>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">In Stock</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-2">{inStockCount}</h3>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Low Stock (&le; 5)</span>
            {lowStockCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
          </div>
          <h3 className="text-2xl font-black text-amber-600 mt-2">{lowStockCount}</h3>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Out of Stock</span>
          <h3 className="text-2xl font-black text-red-500 mt-2">{outOfStockCount}</h3>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Under Review</span>
          <h3 className="text-2xl font-black text-amber-600 mt-2">{pendingCount}</h3>
        </div>
      </div>

      {/* Search & Tabs Controls */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product name, SKU, or category..."
            className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: `All (${products.length})` },
            { id: 'in_stock', label: `In Stock (${inStockCount})` },
            { id: 'low_stock', label: `⚠️ Low Stock (${lowStockCount})` },
            { id: 'out_of_stock', label: `Out of Stock (${outOfStockCount})` },
            { id: 'pending', label: `Pending Review (${pendingCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-xs font-bold text-gray-400">Loading catalog...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No products found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
              {searchTerm
                ? `No items match "${searchTerm}". Try a different term or clear filters.`
                : 'Get started by publishing your first product to your store catalog.'}
            </p>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Product</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-4 px-6">Product Details</th>
                  <th className="py-4 px-4">Price</th>
                  <th className="py-4 px-4">Stock Status</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Approval Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filtered.map((product) => {
                  const stock = product.stock || product.stockQuantity || 0;
                  const isDeleting = deletingId === product.id;

                  return (
                    <tr key={product.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* Product Thumbnail & Title */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                            {product.featuredImage || (product.images && product.images[0]) ? (
                              <img
                                src={product.featuredImage || product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-[240px]">
                            <h4 className="font-bold text-gray-900 truncate text-xs">{product.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              {product.sku && (
                                <span className="text-[10px] text-gray-400 font-mono">SKU: {product.sku}</span>
                              )}
                              <Link
                                href={`/product/${product.slug || product.id}`}
                                target="_blank"
                                className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                              >
                                <span>Preview</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="py-4 px-4">
                        <span className="font-black text-gray-900 text-sm">
                          ৳{Number(product.sellingPrice || product.price || 0).toLocaleString()}
                        </span>
                        {(product.regularPrice || product.original_price) &&
                          Number(product.regularPrice || product.original_price) > Number(product.sellingPrice || product.price || 0) && (
                            <span className="text-[11px] text-gray-400 line-through block">
                              ৳{Number(product.regularPrice || product.original_price).toLocaleString()}
                            </span>
                          )}
                      </td>

                      {/* Stock Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          stock > 10
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                            : stock > 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
                            : 'bg-red-50 text-red-700 border border-red-200/50'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            stock > 10 ? 'bg-emerald-500' : stock > 0 ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                          {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-[11px] font-medium">
                          {typeof product.category === 'object'
                            ? product.category?.name
                            : (categories.find(c => (c.id || c._id || c.category_id) === product.category)?.name || product.category || 'General')}
                        </span>
                      </td>

                      {/* Approval Status */}
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          product.approval_status === 'approved' || product.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                            : product.approval_status === 'rejected'
                            ? 'bg-red-50 text-red-700 border border-red-200/50'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                        }`}>
                          {product.approval_status || product.status || 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setRestockingProduct(product);
                              setNewStockValue(Number(stock || 0));
                            }}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Quick Restock Inventory"
                          >
                            <Layers className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Product (Modal)"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            disabled={isDeleting}
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Product"
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

      {/* Quick Restock Modal */}
      {restockingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Inventory Update</span>
                <h3 className="text-base font-black text-gray-900 mt-0.5 truncate max-w-[280px]">
                  {restockingProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setRestockingProduct(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickRestock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Set Available Stock Quantity
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={newStockValue}
                    onChange={(e) => setNewStockValue(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-base font-black text-gray-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Quick Add Stock Units:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 25, 50].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => setNewStockValue(prev => Number(prev || 0) + inc)}
                      className="py-1.5 bg-gray-100 hover:bg-amber-100 hover:text-amber-800 text-gray-700 rounded-xl text-xs font-bold transition-all border border-gray-200"
                    >
                      +{inc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRestockingProduct(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingStock}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingStock ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Hubohu Admin Panel Product Add/Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 animate-in zoom-in-95">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                {editingProduct ? 'Edit Product (পণ্য সম্পাদনা)' : 'Add New Product (নতুন পণ্য যুক্ত করুন)'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Store / Vendor Attribution */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-0.5 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-blue-600" />
                    Store Attribution (দোকান পরিচিতি)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    This product will be published under your verified storefront:{' '}
                    <span className="font-semibold text-slate-800">"{vendorShopName || 'My Store'}"</span>.
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg border border-blue-200 flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                  <Store className="w-3.5 h-3.5 text-blue-600" />
                  {vendorShopName || 'Active Store'}
                </span>
              </div>

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name (English) *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name (Bangla)</label>
                  <input
                    type="text"
                    value={formData.nameBn}
                    onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU (e.g. stm-0001)</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="stm-0001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description (Supports HTML) - Appears on right side of product image
                </label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                  rows={3}
                  placeholder="Enter a short description or HTML here... e.g. <ul><li>Feature 1</li></ul>"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Description (English)</label>
                  <button
                    type="button"
                    onClick={generateAIDescription}
                    disabled={isGeneratingAI}
                    className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-colors disabled:opacity-70"
                  >
                    {isGeneratingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-purple-500" />}
                    {isGeneratingAI ? 'Generating...' : 'AI Generate Description'}
                  </button>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Bangla)</label>
                <textarea
                  value={formData.descriptionBn}
                  onChange={(e) => setFormData({ ...formData, descriptionBn: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                  rows={3}
                />
              </div>

              {/* Pricing */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Regular Price *</label>
                  <input
                    type="number"
                    value={formData.regularPrice}
                    onChange={(e) => setFormData({ ...formData, regularPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                    min="0"
                  />
                </div>
              </div>

              {/* Category (Searchable Custom Dropdown) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.category}
                    onChange={() => {}}
                    required
                    className="absolute opacity-0 w-full h-1 bottom-0 left-0 pointer-events-none"
                    tabIndex="-1"
                  />
                  <div
                    className={`w-full px-4 py-2 border ${
                      isCategoryDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-300'
                    } rounded-lg bg-white flex justify-between items-center cursor-pointer text-sm`}
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  >
                    <span className={formData.category ? 'text-gray-900 line-clamp-1' : 'text-gray-500'}>
                      {formData.category
                        ? categories.find((c) => (c.id || c._id || c.category_id) === formData.category)?.name || 'Unknown Category'
                        : 'Select Category'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isCategoryDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsCategoryDropdownOpen(false)}></div>
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                        <div className="p-2 border-b bg-gray-50">
                          <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="Search category name..."
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                          <div
                            className={`px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors ${
                              !formData.category ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'
                            }`}
                            onClick={() => {
                              setFormData({ ...formData, category: '' });
                              setIsCategoryDropdownOpen(false);
                              setCategorySearch('');
                            }}
                          >
                            Select Category
                          </div>
                          {categories
                            .filter((cat) => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
                            .map((cat) => {
                              const catId = cat.id || cat._id || cat.category_id;
                              const isSelected = formData.category === catId;
                              return (
                                <div
                                  key={catId}
                                  className={`px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors ${
                                    isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'
                                  }`}
                                  onClick={() => {
                                    setFormData({ ...formData, category: catId });
                                    setIsCategoryDropdownOpen(false);
                                    setCategorySearch('');
                                  }}
                                >
                                  {cat.name}
                                </div>
                              );
                            })}
                          {categories.filter((cat) => cat.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                            <div className="px-3 py-4 text-sm text-center text-gray-500">
                              No categories found matching "{categorySearch}"
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* SEO Tags */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">SEO Tags / Keywords (Comma separated)</label>
                  <button
                    type="button"
                    onClick={generateAITags}
                    disabled={isGeneratingAI}
                    className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-colors disabled:opacity-70"
                  >
                    {isGeneratingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-purple-500" />}
                    {isGeneratingAI ? 'Generating...' : 'AI Generate Tags'}
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.tagsInput !== undefined ? formData.tagsInput : formData.tags.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tagsInput: e.target.value,
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                  placeholder="e.g. smartphone, samsung, 5g, best phone"
                />
                <p className="text-xs text-gray-500 mt-1">
                  These tags help your product appear in Google and website search results. Separate multiple tags with a comma.
                </p>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                    placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Add URL
                  </button>
                  <label className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2 cursor-pointer text-sm font-medium transition-colors">
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
                        <img
                          src={img}
                          alt={`Product ${index + 1}`}
                          className={`w-full h-full object-cover ${formData.featuredImage === img ? 'ring-2 ring-blue-500' : ''}`}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                          {formData.featuredImage !== img && (
                            <button
                              type="button"
                              onClick={() => setAsFeatured(img)}
                              className="px-2 py-0.5 bg-white rounded text-[10px] font-semibold text-gray-800 shadow"
                            >
                              Featured
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-1 bg-red-500 rounded text-white shadow hover:bg-red-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {formData.featuredImage === img && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded shadow">
                            Featured
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Add image URLs or upload files. Click on an image to set it as featured.
                </p>
              </div>

              {/* ── Product Variants Section (Hubohu Admin Panel) ── */}
              <div className="border border-blue-200 rounded-xl overflow-hidden shadow-xs">
                <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-800">Product Variants</h3>
                    <p className="text-xs text-gray-500">Define sizes, colors, storage options or any custom attributes</p>
                  </div>
                  {formData.attributes.length > 0 && (
                    <button
                      type="button"
                      onClick={generateVariants}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Generate Variants
                    </button>
                  )}
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Step 1 — Define Attributes</p>
                    <DynamicAttributeBuilder
                      attributes={formData.attributes}
                      onChange={handleAttributesChange}
                    />
                  </div>
                  {formData.attributes.some((a) => a.values.length > 0) && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-gray-600">Step 2 — Edit Variant Details</p>
                        {formData.variants.length === 0 && (
                          <span className="text-xs text-amber-600 font-semibold">← Click "Generate Variants" above</span>
                        )}
                      </div>
                      <VariantTable
                        variants={formData.variants}
                        onChange={handleVariantsChange}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Homepage & Visibility Settings (Hubohu Admin Panel) */}
              <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 p-4 rounded-xl border border-blue-100 space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-blue-600" />
                  Homepage & Visibility Settings (হোম পেজ ও স্টোর সেটিংস)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-start gap-2.5 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-amber-400 transition-colors shadow-xs">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        Featured on Home (হোম পেজ ফিচার্ড)
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">হোম পেজের 'Featured Products' সেকশনে দেখাবে</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-emerald-400 transition-colors shadow-xs">
                    <input
                      type="checkbox"
                      checked={formData.isNewArrival}
                      onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        New Arrival (হোম পেজ নতুন কালেকশন)
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">হোম পেজের 'New Arrivals' সেকশনে দেখাবে</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-blue-400 transition-colors shadow-xs">
                    <input
                      type="checkbox"
                      checked={formData.isBestSeller}
                      onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-900">
                        Best Seller (সেরা বিক্রিত পণ্য)
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">পণ্যটিতে 'Best Seller' ব্যাজ প্রদর্শন করবে</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-green-400 transition-colors shadow-xs">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${formData.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        Product Status: {formData.isActive ? 'Active (সক্রিয়)' : 'Inactive (লুকানো)'}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {formData.isActive ? 'পণ্যটি ওয়েবসাইট ও শপে সবার জন্য সক্রিয়' : 'পণ্যটি ওয়েবসাইট থেকে সাময়িকভাবে লুকানো থাকবে'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || uploading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSaving ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
