'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Loader2,
  X,
  Upload,
  ChevronDown,
  Sparkles,
  Layers,
  RefreshCw,
  Star,
  CheckCircle2,
  Home,
  Store,
  Search,
  Edit
} from 'lucide-react';
import DynamicAttributeBuilder from '@/app/components/DynamicAttributeBuilder';
import VariantTable from '@/app/components/VariantTable';
import { cartesianProduct, buildVariants } from '@/lib/variantUtils';
import { deriveCategoryCode, SKU_CATEGORIES_MAP } from '@/lib/skuUtils';

export default function VendorEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id;

  const [categories, setCategories] = useState([]);
  const [vendorShopName, setVendorShopName] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
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

  useEffect(() => {
    fetchInitialData();
  }, [productId]);

  const fetchInitialData = async () => {
    try {
      const [catRes, profileRes, productRes] = await Promise.all([
        fetch(`/api/categories?status=active&t=${Date.now()}`, { cache: 'no-store' }),
        fetch('/api/vendor/profile', { cache: 'no-store' }).catch(() => null),
        productId ? fetch(`/api/vendor/products/${productId}`, { credentials: 'include', cache: 'no-store' }) : null
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }

      if (profileRes && profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData?.shop_name) {
          setVendorShopName(profileData.shop_name);
        }
      }

      if (productRes && productRes.ok) {
        const prodData = await productRes.json();
        const p = prodData.product;
        if (p) {
          let catId = '';
          if (p.category) {
            catId = typeof p.category === 'object' ? (p.category.id || p.category._id || p.category.category_id) : p.category;
          }

          setFormData({
            name: p.name || '',
            nameBn: p.nameBn || '',
            description: p.description || '',
            descriptionBn: p.descriptionBn || '',
            shortDescription: p.shortDescription || '',
            regularPrice: p.regularPrice || p.original_price || p.oldPrice || 0,
            sellingPrice: p.sellingPrice || p.price || 0,
            stockQuantity: p.stockQuantity || p.stock || 0,
            category: catId || '',
            sku: p.sku || '',
            brand: p.brand || '',
            tags: Array.isArray(p.tags) ? p.tags : [],
            tagsInput: Array.isArray(p.tags) ? p.tags.join(', ') : '',
            images: Array.isArray(p.images) ? p.images : [],
            featuredImage: p.featuredImage || (p.images && p.images[0]) || '',
            isFeatured: Boolean(p.isFeatured || p.featured),
            isNewArrival: Boolean(p.isNewArrival),
            isBestSeller: Boolean(p.isBestSeller),
            isActive: p.isActive !== undefined ? p.isActive : (p.status ? p.status === 'active' : true),
            attributes: Array.isArray(p.attributes) ? p.attributes : [],
            variants: Array.isArray(p.variants) ? p.variants : [],
          });
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setPageLoading(false);
    }
  };

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

  // Variant helpers
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

  // Submit Handler
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

      // Keep existing permanent SKU unchanged
      let finalSku = formData.sku?.trim() || null;

      // If user provided attributes with values, but variants array is empty, auto-generate variants
      let finalVariants = Array.isArray(formData.variants) ? [...formData.variants] : [];
      if (
        formData.attributes?.some((a) => a.values && a.values.length > 0) &&
        finalVariants.length === 0
      ) {
        const combos = cartesianProduct(formData.attributes);
        if (combos.length > 0) {
          finalVariants = buildVariants(combos, [], formData.name, parseFloat(sellingPrice) || 0);
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

      const res = await fetch(`/api/vendor/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        alert('Product updated successfully!');
        router.push('/vendor/products');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-6">
      {/* Top Breadcrumb & Return Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/vendor/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products List
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Store:</span>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5" />
            {vendorShopName || 'My Store'}
          </span>
        </div>
      </div>

      {/* Main Card with Exact Admin Panel Layout and Design */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between bg-white">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Edit Product (পণ্য সম্পাদনা করুন)
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Update product details, pricing, variants, and visibility identical to admin catalog.
            </p>
          </div>
          <Link
            href="/vendor/products"
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Store / Vendor Attribution */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-blue-600" />
                Store Attribution (দোকান পরিচিতি)
              </label>
              <p className="text-xs text-slate-500">
                This product belongs to your verified store:{' '}
                <span className="font-bold text-slate-800">"{vendorShopName || 'Your Store'}"</span>.
              </p>
            </div>
            <span className="px-3.5 py-1.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-xl border border-blue-200 flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
              <Store className="w-4 h-4 text-blue-600" />
              {vendorShopName || 'Verified Store'}
            </span>
          </div>

          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name (English) *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name (Bangla)
              </label>
              <input
                type="text"
                value={formData.nameBn}
                onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product SKU (অনন্য কোড)
              </label>
              <div className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-800 flex items-center justify-between">
                <span className="font-bold tracking-wider">{formData.sku || 'Auto-generated on save'}</span>
                <span className="text-[11px] font-sans px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold">
                  Immutable
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                SKU is permanent and cannot be modified once created.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              rows={3}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Bangla)</label>
            <textarea
              value={formData.descriptionBn}
              onChange={(e) => setFormData({ ...formData, descriptionBn: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                min="0"
              />
            </div>
          </div>

          {/* Category (Searchable Custom Dropdown) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Category *</label>
              {formData.sku && !formData.sku.startsWith('stm-') && (
                <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  🔒 Locked (SKU Assigned)
                </span>
              )}
            </div>
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
                  formData.sku && !formData.sku.startsWith('stm-')
                    ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                    : isCategoryDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-300'
                } rounded-lg bg-white flex justify-between items-center cursor-pointer`}
                onClick={() => {
                  if (formData.sku && !formData.sku.startsWith('stm-')) return;
                  setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                }}
              >
                <span className={formData.category ? 'text-gray-900 line-clamp-1 text-sm' : 'text-gray-500 text-sm'}>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 mt-2">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
                    <img
                      src={img}
                      alt={`Product ${index + 1}`}
                      className={`w-full h-full object-cover ${formData.featuredImage === img ? 'ring-2 ring-blue-500' : ''}`}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                      {formData.featuredImage !== img && (
                        <button
                          type="button"
                          onClick={() => setAsFeatured(img)}
                          className="px-2 py-1 bg-white rounded text-[11px] font-semibold text-gray-800 hover:bg-gray-100 shadow"
                        >
                          Featured
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-1.5 bg-red-500 hover:bg-red-600 rounded text-white shadow"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {formData.featuredImage === img && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded shadow">
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

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Link
              href="/vendor/products"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving || uploading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? 'Updating Product...' : 'Update & Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
