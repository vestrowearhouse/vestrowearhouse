'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  Loader2,
  X,
  ShoppingCart,
  Image as ImageIcon,
  Upload,
  ChevronDown,
  Sparkles,
  Layers,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Star,
  CheckCircle2,
  Home,
  Store
} from 'lucide-react';
import DynamicAttributeBuilder from '@/app/components/DynamicAttributeBuilder';
import VariantTable from '@/app/components/VariantTable';
import { cartesianProduct, buildVariants, validateVariants } from '@/lib/variantUtils';
import { deriveCategoryCode, SKU_CATEGORIES_MAP } from '@/lib/skuUtils';
import imageCompression from 'browser-image-compression';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [priceSort, setPriceSort] = useState('none');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [homeFilter, setHomeFilter] = useState('all'); // 'all' | 'featured' | 'newArrival' | 'active' | 'inactive'
  const [togglingMap, setTogglingMap] = useState({}); // tracking active quick toggles
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // SKU Quick Lookup Box state
  const [skuLookupInput, setSkuLookupInput] = useState('');
  const [skuLookupResult, setSkuLookupResult] = useState(null);
  const [skuLookupLoading, setSkuLookupLoading] = useState(false);
  const [skuLookupError, setSkuLookupError] = useState(null);
  const [showSkuLookup, setShowSkuLookup] = useState(false);

  const handleSkuLookup = async (e) => {
    if (e) e.preventDefault();
    const clean = skuLookupInput.trim().toUpperCase();
    if (!clean) return;
    setSkuLookupLoading(true);
    setSkuLookupError(null);
    try {
      const res = await fetch(`/api/admin/sku/lookup?sku=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) {
        setSkuLookupError(data.message || data.error || 'No record found for this SKU');
        setSkuLookupResult(null);
      } else {
        setSkuLookupResult(data);
        setSkuLookupError(null);
      }
    } catch (err) {
      setSkuLookupError('Failed to perform lookup');
    } finally {
      setSkuLookupLoading(false);
    }
  };

  // Reset pagination to page 1 whenever any filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedVendorFilter, stockFilter, priceSort, minPrice, maxPrice, homeFilter]);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
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
    vendor_id: '',
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
  const [imageInput, setImageInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Handle file upload from computer with client-side image compression
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        // Upload directly to Cloudinary via admin media API
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
        const cloudinaryUrl = data.url;

        // Store Cloudinary URL (not base64) in form state
        setFormData(prev => ({
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
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, vendorsRes] = await Promise.all([
        fetch(`/api/products?limit=1000&t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/categories?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/admin/vendors?limit=100`, { cache: 'no-store' }).catch(() => null)
      ]);
      
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      if (vendorsRes && vendorsRes.ok) {
        const vData = await vendorsRes.json();
        setVendors(vData.vendors || []);
      }
      
      setProducts(productsData.products || []);
      setCategories(categoriesData.categories || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      // Supabase UUID fields must receive null instead of empty strings ("")
      const categoryId = formData.category || null;

      // Remove UI-only fields that do not belong in the Supabase products table
      const { tagsInput, category, sellingPrice, regularPrice, stockQuantity, ...cleanFormData } = formData;

      // Keep existing SKU if already set
      let finalSku = formData.sku?.trim() || null;

      // If user provided attributes with values, but variants array is empty, auto-generate variants
      let finalVariants = Array.isArray(formData.variants) ? [...formData.variants] : [];
      if (
        formData.attributes?.some((a) => a.values && a.values.length > 0) &&
        finalVariants.length === 0
      ) {
        const combos = cartesianProduct(formData.attributes);
        if (combos.length > 0) {
          finalVariants = buildVariants(combos, [], formData.name, sellingPrice || 0);
        }
      }

      // Save product with user-specified isActive status
      const productData = {
        ...cleanFormData,
        sku: finalSku,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        sellingPrice: sellingPrice,
        regularPrice: regularPrice,
        stockQuantity: stockQuantity,
        price: sellingPrice,
        oldPrice: regularPrice,
        stock: stockQuantity,
        category: categoryId,
        vendor_id: formData.vendor_id || null,
        attributes: formData.attributes || [],
        variants: finalVariants,
      };
      
      let url = '/api/products';
      let method = 'POST';

      if (editingProduct) {
        const productId = editingProduct.id || editingProduct._id || editingProduct.product_id;
        if (!productId) {
          alert("Error: Product ID is missing! Reload the page.");
          return;
        }
        url = `/api/products/${productId}`;
        method = 'PUT';
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchData();
        alert(editingProduct ? 'Product updated and published!' : 'Product created and published!');
      } else {
        try {
          const errorData = await res.json();
          alert(errorData.error || 'Failed to save product');
        } catch (parseError) {
          if (res.status === 413) {
            alert('Error: Image size is too large! Please upload smaller images or use image URLs.');
          } else {
            alert(`Server Error: ${res.statusText} (${res.status})`);
          }
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) {
      alert("Error: Cannot delete, Product ID is missing.");
      return;
    }
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    // Optimistic UI update: instantly remove from state
    setProducts(prev => prev.filter(p => (p.id || p._id || p.product_id) !== id));

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete on server');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product from server');
      fetchData();
    }
  };

  // 1-Click Status & Homepage quick toggles
  const handleToggleStatus = async (product, field) => {
    const productId = product.id || product._id || product.product_id;
    if (!productId) return;

    const toggleKey = `${productId}_${field}`;
    if (togglingMap[toggleKey]) return;

    const currentVal = Boolean(product[field]);
    const newVal = !currentVal;

    setTogglingMap(prev => ({ ...prev, [toggleKey]: true }));

    // Optimistic UI update
    setProducts(prev => prev.map(p => {
      if ((p.id || p._id || p.product_id) === productId) {
        return { ...p, [field]: newVal };
      }
      return p;
    }));

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newVal })
      });

      if (!res.ok) {
        // Revert on failure
        setProducts(prev => prev.map(p => {
          if ((p.id || p._id || p.product_id) === productId) {
            return { ...p, [field]: currentVal };
          }
          return p;
        }));
        alert(`Failed to update ${field}`);
      }
    } catch (err) {
      console.error('Status toggle error:', err);
      // Revert on failure
      setProducts(prev => prev.map(p => {
        if ((p.id || p._id || p.product_id) === productId) {
          return { ...p, [field]: currentVal };
        }
        return p;
      }));
      alert('Network error updating status');
    } finally {
      setTogglingMap(prev => {
        const next = { ...prev };
        delete next[toggleKey];
        return next;
      });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    
    let catId = '';
    if (product.category) {
      catId = product.category.id || product.category._id || product.category.category_id || (typeof product.category === 'string' ? product.category : '');
    }

    setFormData({
      name: product.name || '',
      nameBn: product.nameBn || '',
      description: product.description || '',
      descriptionBn: product.descriptionBn || '',
      shortDescription: product.shortDescription || '',
      regularPrice: product.regularPrice || product.oldPrice || 0,
      sellingPrice: product.sellingPrice || product.price || 0,
      stockQuantity: product.stockQuantity || product.stock || 0,
      category: catId,
      vendor_id: product.vendor_id || '',
      sku: product.sku || '',
      brand: product.brand || '',
      tags: product.tags || [],
      tagsInput: (product.tags || []).join(', '),
      images: product.images || [],
      featuredImage: product.featuredImage || '',
      isFeatured: product.isFeatured || false,
      isNewArrival: product.isNewArrival || false,
      isBestSeller: product.isBestSeller || false,
      isActive: product.isActive ?? true,
      attributes: Array.isArray(product.attributes) ? product.attributes : [],
      variants: Array.isArray(product.variants) ? product.variants : [],
    });
    setShowModal(true);
  };

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
      vendor_id: '',
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

  // ── Variant helpers ──────────────────────────────────────────────────────
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
    const newVariants = buildVariants(
      combinations,
      formData.variants,
      formData.name,
      formData.sellingPrice || 0
    );
    setFormData((prev) => ({ ...prev, variants: newVariants }));
  };

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
        body: JSON.stringify({ productName: formData.name })
      });
      const data = await res.json();
      if (data.tags) {
        setFormData(prev => ({
          ...prev,
          tagsInput: data.tags,
          tags: data.tags.split(',').map(t => t.trim()).filter(Boolean)
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
          shortDescription: formData.shortDescription
        })
      });
      const data = await res.json();
      if (data.description || data.descriptionBn) {
        setFormData(prev => ({
          ...prev,
          description: data.description || prev.description,
          descriptionBn: data.descriptionBn || prev.descriptionBn
        }));
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error('Failed to generate description:', error);
      alert('AI generation failed.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addImage = () => {
    if (imageInput.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, imageInput.trim()],
        featuredImage: formData.featuredImage || imageInput.trim()
      });
      setImageInput('');
    }
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({
      ...formData,
      images: newImages,
      featuredImage: newImages[0] || ''
    });
  };

  const setAsFeatured = (imageUrl) => {
    setFormData({
      ...formData,
      featuredImage: imageUrl
    });
  };

  const featuredCount = useMemo(() => products.filter(p => (p.isFeatured === true || p.featured === true) && p.isActive !== false).length, [products]);
  const newArrivalsCount = useMemo(() => products.filter(p => p.isNewArrival === true && p.isActive !== false).length, [products]);
  const activeCount = useMemo(() => products.filter(p => p.isActive !== false).length, [products]);
  const inactiveCount = useMemo(() => products.filter(p => p.isActive === false).length, [products]);

  const filteredAndSortedProducts = products.filter(product => {
    // Search by name, SKU, or brand
    const matchesSearch = !searchTerm.trim() ||
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filter
    const prodCatId = typeof product.category === 'object' 
      ? (product.category?.id || product.category?._id) 
      : product.category;
    const matchesCategory = selectedCategory === 'all' || !selectedCategory || prodCatId === selectedCategory;

    // Stock filter
    const stock = Number(product.stockQuantity ?? product.stock ?? 0);
    let matchesStock = true;
    if (stockFilter === 'in_stock') matchesStock = stock > 0;
    else if (stockFilter === 'low_stock') matchesStock = stock > 0 && stock <= 10;
    else if (stockFilter === 'out_of_stock') matchesStock = stock <= 0;

    // Price filters
    const price = Number(product.sellingPrice || product.price || 0);
    const matchesMinPrice = !minPrice || price >= Number(minPrice);
    const matchesMaxPrice = !maxPrice || price <= Number(maxPrice);

    // Home / Status filter
    let matchesHome = true;
    if (homeFilter === 'featured') {
      matchesHome = Boolean(product.isFeatured || product.featured) && product.isActive !== false;
    } else if (homeFilter === 'newArrival') {
      matchesHome = Boolean(product.isNewArrival) && product.isActive !== false;
    } else if (homeFilter === 'active') {
      matchesHome = product.isActive !== false;
    } else if (homeFilter === 'inactive') {
      matchesHome = product.isActive === false;
    }

    // Vendor / Store filter
    let matchesVendor = true;
    if (selectedVendorFilter === 'official') {
      matchesVendor = !product.vendor_id;
    } else if (selectedVendorFilter && selectedVendorFilter !== 'all') {
      matchesVendor = product.vendor_id === selectedVendorFilter;
    }

    return matchesSearch && matchesCategory && matchesStock && matchesMinPrice && matchesMaxPrice && matchesHome && matchesVendor;
  }).sort((a, b) => {
    const priceA = Number(a.sellingPrice || a.price || 0);
    const priceB = Number(b.sellingPrice || b.price || 0);
    if (priceSort === 'price_asc') return priceA - priceB;
    if (priceSort === 'price_desc') return priceB - priceA;
    if (priceSort === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedProducts.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProducts = filteredAndSortedProducts.slice(startIndex, startIndex + pageSize);

  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const hasActiveFilters = homeFilter !== 'all' || selectedCategory !== 'all' || stockFilter !== 'all' || priceSort !== 'none' || minPrice !== '' || maxPrice !== '' || searchTerm.trim() !== '';

  const clearAllFilters = () => {
    setHomeFilter('all');
    setSearchTerm('');
    setSelectedCategory('all');
    setStockFilter('all');
    setPriceSort('none');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Product Management</h1>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 space-y-4 border border-gray-100">
        
        {/* Homepage & Status Quick Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-gray-100">
          <button
            type="button"
            onClick={() => setHomeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              homeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setHomeFilter('featured')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              homeFilter === 'featured'
                ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            Home: Featured ({featuredCount})
          </button>
          <button
            type="button"
            onClick={() => setHomeFilter('newArrival')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              homeFilter === 'newArrival'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Home: New Arrivals ({newArrivalsCount})
          </button>
          <button
            type="button"
            onClick={() => setHomeFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              homeFilter === 'active'
                ? 'bg-gray-800 text-white shadow-sm'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setHomeFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              homeFilter === 'inactive'
                ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-300'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
            Inactive ({inactiveCount})
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
              Total: {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </span>
            <button
              type="button"
              onClick={() => setShowSkuLookup(!showSkuLookup)}
              className={`px-3.5 py-2 border rounded-lg flex items-center gap-2 text-sm font-semibold transition-all whitespace-nowrap shadow-xs ${
                showSkuLookup
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
              }`}
            >
              <span>🔎</span>
              <span>SKU Lookup</span>
            </button>
            <Link
              href="/admin/products/bulk"
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors whitespace-nowrap"
            >
              <span>📥</span>
              Bulk Add Products
            </Link>
            <button 
              onClick={() => { resetForm(); setShowModal(true); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* Dedicated SKU Lookup Box */}
        {showSkuLookup && (
          <div className="p-4 bg-gradient-to-r from-purple-50 via-slate-50 to-blue-50 border border-purple-200 rounded-xl">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>🔎</span> SKU Real-Time Registry Lookup
                </h4>
                <p className="text-xs text-slate-500">
                  Instant lookup: Enter SKU to inspect its category, size, color, vendor, and live stock.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowSkuLookup(false); setSkuLookupResult(null); setSkuLookupError(null); }}
                className="text-xs text-slate-400 hover:text-slate-600 self-end sm:self-auto"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSkuLookup} className="flex gap-2">
              <input
                type="text"
                value={skuLookupInput}
                onChange={(e) => setSkuLookupInput(e.target.value.toUpperCase())}
                placeholder="Enter SKU (e.g. SMBD200001)..."
                className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button
                type="submit"
                disabled={skuLookupLoading || !skuLookupInput.trim()}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {skuLookupLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Lookup SKU
              </button>
            </form>

            {skuLookupError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                ⚠️ {skuLookupError}
              </div>
            )}

            {skuLookupResult && skuLookupResult.found && (
              <div className="mt-3 p-4 bg-white border border-purple-200 rounded-xl shadow-xs">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    {skuLookupResult.product?.image ? (
                      <img src={skuLookupResult.product.image} alt="" className="w-12 h-12 rounded-lg object-cover border" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                          {skuLookupResult.sku}
                        </span>
                        {skuLookupResult.isVariant && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                            Variant: {skuLookupResult.variantKey}
                          </span>
                        )}
                      </div>
                      <h5 className="font-bold text-slate-900 text-sm mt-0.5">
                        {skuLookupResult.product?.name || 'Product'}
                      </h5>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Current Stock</span>
                    <span className={`text-base font-extrabold font-mono ${skuLookupResult.product?.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {skuLookupResult.product?.stock || 0} Units
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block font-medium">Category</span>
                    <span className="font-bold text-slate-800">
                      Code {skuLookupResult.decoded?.categoryCode}: {skuLookupResult.decoded?.categoryName}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block font-medium">Size</span>
                    <span className="font-bold text-slate-800">{skuLookupResult.size || 'No size'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block font-medium">Color</span>
                    <span className="font-bold text-slate-800">{skuLookupResult.color || 'No color'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block font-medium">Vendor</span>
                    <span className="font-bold text-purple-700">
                      {skuLookupResult.vendor?.shop_name || 'StellarMart Official'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 text-sm">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 min-w-[170px]">
            <span className="text-xs font-medium text-gray-500">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id || cat._id} value={cat.id || cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Store / Vendor Filter */}
          <div className="flex items-center gap-1.5 min-w-[180px]">
            <span className="text-xs font-medium text-gray-500">Store:</span>
            <select
              value={selectedVendorFilter}
              onChange={(e) => setSelectedVendorFilter(e.target.value)}
              className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            >
              <option value="all">All Stores & Vendors</option>
              <option value="official">⭐ Stellar Mart Official</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  🏬 {v.shop_name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="flex items-center gap-1.5 min-w-[150px]">
            <span className="text-xs font-medium text-gray-500">Stock:</span>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            >
              <option value="all">All Stock Status</option>
              <option value="in_stock">In Stock (&gt;0)</option>
              <option value="low_stock">Low Stock (≤10)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>

          {/* Price Sorting */}
          <div className="flex items-center gap-1.5 min-w-[170px]">
            <span className="text-xs font-medium text-gray-500">Sort:</span>
            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value)}
              className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            >
              <option value="none">Default Order</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500">Price (৳):</span>
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-20 px-2 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <span className="text-gray-400 text-xs">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-20 px-2 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="ml-auto px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center gap-1 border border-red-200 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No products found matching your filters</p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-3 px-3 py-1.5 text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Image</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Stock</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Home Featured</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">New Arrival</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedProducts.map((product) => {
                const pId = product.id || product._id || product.product_id;
                const isFeaturedToggling = togglingMap[`${pId}_isFeatured`];
                const isNewArrivalToggling = togglingMap[`${pId}_isNewArrival`];
                const isActiveToggling = togglingMap[`${pId}_isActive`];

                return (
                <tr key={pId || Math.random()} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                      {product.featuredImage || product.images?.[0] ? (
                        <img 
                          src={product.featuredImage || product.images[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 line-clamp-1">{product.name}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                      {product.sku ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSkuLookupInput(product.sku);
                            setShowSkuLookup(true);
                            fetch(`/api/admin/sku/lookup?sku=${encodeURIComponent(product.sku)}`)
                              .then(r => r.json())
                              .then(d => { setSkuLookupResult(d); setSkuLookupError(null); })
                              .catch(() => setSkuLookupError('Failed to lookup SKU'));
                          }}
                          className="px-1.5 py-0.5 font-mono font-bold text-[11px] bg-slate-100 hover:bg-purple-100 text-slate-800 hover:text-purple-700 rounded border border-slate-200 transition"
                          title="Click to inspect SKU in Registry"
                        >
                          {product.sku}
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-gray-400">SKU: -</span>
                      )}
                      {product.brand && <span>• {product.brand}</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {product.vendor_id ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          🏬 {product.store_name || vendors.find(v => v.id === product.vendor_id)?.shop_name || 'Vendor Store'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          ⭐ Stellar Mart Official
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {
                      product.category?.name ||
                      categories.find(c => c.id === product.category || c._id === product.category)?.name || 
                      (product.category ? '...' : '-')
                    }
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-gray-900 font-semibold">৳{(product.sellingPrice || product.price || 0).toLocaleString()}</span>
                    {((product.regularPrice || product.oldPrice) > (product.sellingPrice || product.price)) && (
                      <span className="ml-1.5 text-gray-400 line-through text-xs">
                        ৳{(product.regularPrice || product.oldPrice || 0).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {product.stockQuantity > 0 || product.stock > 0 ? (
                      <span className={(product.stockQuantity || product.stock) < 10 ? 'text-orange-600 font-semibold' : 'text-green-600 font-medium'}>
                        {product.stockQuantity || product.stock}
                      </span>
                    ) : (
                      <span className="text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded">Out of Stock</span>
                    )}
                  </td>

                  {/* 1-Click Home: Featured Toggle */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button
                      type="button"
                      disabled={isFeaturedToggling}
                      onClick={() => handleToggleStatus(product, 'isFeatured')}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm ${
                        product.isFeatured
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300'
                      }`}
                      title={product.isFeatured ? "Click to remove from Homepage Featured" : "Click to show in Homepage Featured"}
                    >
                      {isFeaturedToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      ) : (
                        <Star className={`w-3.5 h-3.5 ${product.isFeatured ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
                      )}
                      <span>{product.isFeatured ? 'Featured' : '+ Add'}</span>
                    </button>
                  </td>

                  {/* 1-Click Home: New Arrival Toggle */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button
                      type="button"
                      disabled={isNewArrivalToggling}
                      onClick={() => handleToggleStatus(product, 'isNewArrival')}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm ${
                        product.isNewArrival
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300'
                      }`}
                      title={product.isNewArrival ? "Click to remove from Homepage New Arrivals" : "Click to show in Homepage New Arrivals"}
                    >
                      {isNewArrivalToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      ) : (
                        <Sparkles className={`w-3.5 h-3.5 ${product.isNewArrival ? 'text-emerald-600' : 'text-gray-400'}`} />
                      )}
                      <span>{product.isNewArrival ? 'New' : '+ Add'}</span>
                    </button>
                  </td>

                  {/* 1-Click Status: Active / Inactive */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button
                      type="button"
                      disabled={isActiveToggling}
                      onClick={() => handleToggleStatus(product, 'isActive')}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm ${
                        product.isActive !== false
                          ? 'bg-green-100 text-green-900 border border-green-300 hover:bg-green-200'
                          : 'bg-red-100 text-red-900 border border-red-300 hover:bg-red-200'
                      }`}
                      title={product.isActive !== false ? "Click to Deactivate (Hide from Store & Home)" : "Click to Activate"}
                    >
                      {isActiveToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-600" />
                      ) : (
                        <span className={`w-2 h-2 rounded-full ${product.isActive !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      )}
                      <span>{product.isActive !== false ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(pId)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

        {/* 20 Items Per Page Pagination Footer */}
        {!loading && filteredAndSortedProducts.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/70">
            <div className="text-xs text-gray-600 font-medium">
              Showing <span className="font-bold text-gray-900">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-gray-900">{Math.min(startIndex + pageSize, filteredAndSortedProducts.length)}</span> of{' '}
              <span className="font-bold text-gray-900">{filteredAndSortedProducts.length}</span> products
              {filteredAndSortedProducts.length < products.length && (
                <span className="text-gray-400 ml-1.5">({products.length} total)</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all bg-white shadow-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, idx) => (
                  typeof page === 'number' ? (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20'
                          : 'text-gray-700 hover:bg-white bg-transparent border border-transparent hover:border-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ) : (
                    <span key={idx} className="px-1 text-gray-400 text-xs select-none">...</span>
                  )
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all bg-white shadow-xs"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Store / Vendor Assignment */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-blue-600" />
                  Store / Vendor Attribution
                </label>
                <select
                  value={formData.vendor_id || ''}
                  onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm font-semibold text-slate-800"
                >
                  <option value="">⭐ Stellar Mart Official (Direct / In-House)</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      🏬 {v.shop_name} ({v.owner_name || v.username || 'Vendor'})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {formData.vendor_id 
                    ? `This product will display as sold by "${vendors.find(v => v.id === formData.vendor_id)?.shop_name || 'Selected Vendor'}" with vendor store badge and storefront link.`
                    : 'Default: This product will display as sold directly by "StellarMart Official" with official mall badges.'}
                </p>
              </div>

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name (English) *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name (Bangla)</label>
                  <input
                    type="text"
                    value={formData.nameBn}
                    onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product SKU (Permanent Code)
                  </label>
                  <div className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-800 flex items-center justify-between">
                    <span className="font-bold tracking-wider">{formData.sku || 'Auto-generated on save'}</span>
                    <span className="text-[11px] font-sans px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold">
                      Immutable
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Format: SMBD + Category Code + Serial. Auto-assigned server-side upon saving.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description (Supports HTML) - Appears on right side of product image</label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Bangla)</label>
                <textarea
                  value={formData.descriptionBn}
                  onChange={(e) => setFormData({ ...formData, descriptionBn: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    onChange={(e) => setFormData({ ...formData, regularPrice: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Category (Searchable) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Category *</label>
                  {editingProduct?.sku && !editingProduct.sku.startsWith('stm-') && (
                    <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      🔒 Locked (SKU Assigned)
                    </span>
                  )}
                </div>
                <div className="relative">
                  {/* Hidden input for native HTML5 validation */}
                  <input 
                    type="text" 
                    value={formData.category} 
                    onChange={()=>{}} 
                    required 
                    className="absolute opacity-0 w-full h-1 bottom-0 left-0 pointer-events-none" 
                    tabIndex="-1"
                  />
                  <div
                    className={`w-full px-4 py-2 border ${
                      editingProduct?.sku && !editingProduct.sku.startsWith('stm-')
                        ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                        : isCategoryDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-300'
                    } rounded-lg bg-white flex justify-between items-center cursor-pointer`}
                    onClick={() => {
                      if (editingProduct?.sku && !editingProduct.sku.startsWith('stm-')) return;
                      setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                    }}
                  >
                    <span className={formData.category ? 'text-gray-900 line-clamp-1' : 'text-gray-500'}>
                      {formData.category
                        ? categories.find(c => (c.id || c._id || c.category_id) === formData.category)?.name || 'Unknown Category'
                        : 'Select Category'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isCategoryDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsCategoryDropdownOpen(false)}
                      ></div>
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
                            className={`px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors ${!formData.category ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                            onClick={() => {
                              setFormData({ ...formData, category: '' });
                              setIsCategoryDropdownOpen(false);
                              setCategorySearch('');
                            }}
                          >
                            Select Category
                          </div>
                          {categories
                            .filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
                            .map(cat => {
                      const catId = cat.id || cat._id || cat.category_id;
                      const isSelected = formData.category === catId;
                              return (
                                <div
                          key={catId}
                                  className={`px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
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
                          {categories.filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                            <div className="px-3 py-4 text-sm text-center text-gray-500">
                              No categories found matching "{categorySearch}"
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {formData.category && (() => {
                  const selectedCat = categories.find(c => (c.id || c._id || c.category_id) === formData.category);
                  const derivedCode = deriveCategoryCode(selectedCat);
                  const skuCatInfo = SKU_CATEGORIES_MAP[derivedCode];
                  return (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                      <span className="font-semibold text-slate-700">Derived SKU Category:</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono font-bold rounded">
                        Code {derivedCode}
                      </span>
                      <span>{skuCatInfo?.name || 'General'} ({skuCatInfo?.group || 'Other'})</span>
                    </div>
                  );
                })()}
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
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    tagsInput: e.target.value,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. smartphone, samsung, 5g, best phone"
                />
                <p className="text-xs text-gray-500 mt-1">These tags help your product appear in Google and website search results. Separate multiple tags with a comma.</p>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Add URL
                  </button>
                  <label className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={img} 
                          alt={`Product ${index + 1}`}
                          className={`w-full h-20 object-cover rounded-lg ${formData.featuredImage === img ? 'ring-2 ring-blue-500' : ''}`}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                          {formData.featuredImage !== img && (
                            <button
                              type="button"
                              onClick={() => setAsFeatured(img)}
                              className="p-1 bg-white rounded text-xs text-gray-700"
                            >
                              Set Featured
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-1 bg-red-500 rounded text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {formData.featuredImage === img && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded">Featured</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Add image URLs. Click on an image to set it as featured.</p>
              </div>

              {/* ── Product Variants Section ── */}
              <div className="border border-blue-200 rounded-xl overflow-hidden">
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
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
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
                          <span className="text-xs text-amber-600">← Click "Generate Variants" above</span>
                        )}
                      </div>
                      <VariantTable
                        variants={formData.variants}
                        onChange={handleVariantsChange}
                      />
                    </div>
                  )}
                </div>

                {formData.category && (() => {
                  const selectedCat = categories.find(c => (c.id || c._id || c.category_id) === formData.category);
                  const derivedCode = deriveCategoryCode(selectedCat);
                  const skuCatInfo = SKU_CATEGORIES_MAP[derivedCode];
                  return (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                      <span className="font-semibold text-slate-700">Derived SKU Category:</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono font-bold rounded">
                        Code {derivedCode}
                      </span>
                      <span>{skuCatInfo?.name || 'General'} ({skuCatInfo?.group || 'Other'})</span>
                    </div>
                  );
                })()}
              </div>

              {/* Homepage & Visibility Settings */}
              <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 p-4 rounded-xl border border-blue-100 space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-blue-600" />
                  Homepage & Visibility Settings (হোম পেজ ও স্টোর সেটিংস)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-start gap-2.5 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-amber-400 transition-colors shadow-sm">
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

                  <label className="flex items-start gap-2.5 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-emerald-400 transition-colors shadow-sm">
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

                  <label className="flex items-start gap-2.5 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-blue-400 transition-colors shadow-sm">
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

                  <label className="flex items-start gap-2.5 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-green-400 transition-colors shadow-sm">
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

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
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
