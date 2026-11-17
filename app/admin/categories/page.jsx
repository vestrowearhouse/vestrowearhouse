'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import React from 'react';
import Link from 'next/link';
import { 
  Plus,
  Edit,
  Trash2,
  Folder,
  ArrowRight,
  Loader2,
  X,
  Layout,
  Save,
  Sparkles,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Filter
} from 'lucide-react';

// --- Helper Functions ---
const generateSlug = (name) => {
  if (!name) return '';
  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  return cleaned || `cat-${Date.now().toString(36)}`;
};

// --- API Functions ---
const api = {
  fetchCategories: async () => {
    const res = await fetch(`/api/categories?nested=true&t=${Date.now()}`, { 
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch categories');
    }
    const data = await res.json();
    return data.categories || [];
  },
  createCategory: async (category) => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create category');
    return data;
  },
  updateCategory: async (id, category) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update category');
    return data;
  },
  deleteCategory: async (id) => {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete category');
    return data;
  },
};

// --- Components ---

const CategoryModal = ({ category, categories, onSave, onCancel, isSaving = false }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    parent_id: category?.parent_id || null,
    status: category?.status || 'active',
    sort_order: category?.sort_order ?? 0,
    icon: category?.icon || '📦',
    iconType: category?.icon_type || 'emoji',
    image: category?.image || '',
    customCode: category?.custom_code || '',
    isFeatured: category?.isFeatured || false,
  });
  const [isSlugCustom, setIsSlugCustom] = useState(Boolean(category?.slug));
  const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);

  const handleGenerateAIIcons = async () => {
    if (!formData.name) {
      alert("Please enter a Category Name first.");
      return;
    }
    setIsGeneratingIcon(true);
    try {
      const res = await fetch('/api/ai/category-icon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryName: formData.name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      
      setFormData(prev => ({
        ...prev,
        icon: data.emoji || prev.icon,
        customCode: data.customCode || prev.customCode,
        iconType: data.customCode ? 'custom' : 'emoji'
      }));
    } catch (err) {
      console.error(err);
      alert('Error generating icons: ' + err.message);
    } finally {
      setIsGeneratingIcon(false);
    }
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: newName,
      slug: isSlugCustom ? prev.slug : generateSlug(newName)
    }));
  };

  const handleSlugChange = (e) => {
    setIsSlugCustom(true);
    setFormData(prev => ({
      ...prev,
      slug: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalSlug = (formData.slug || '').trim() || generateSlug(formData.name);
    const dataToSave = {
      ...formData,
      slug: finalSlug,
      parent_id: (formData.parent_id === 'null' || formData.parent_id === '') ? null : formData.parent_id,
    };
    onSave(dataToSave);
  };

  const renderCategoryOptions = (cats, level = 0) => {
    let options = [];
    cats.forEach(cat => {
      const catId = cat.id || cat._id;
      if (category && category.id === catId) return;
      
      options.push(
        <option key={catId} value={catId}>
          {'--'.repeat(level)} {level > 0 && '→'} {cat.name}
        </option>
      );
      if (cat.subcategories) {
        options = options.concat(renderCategoryOptions(cat.subcategories, level + 1));
      }
    });
    return options;
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-100 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{category ? 'Edit Category' : 'Create New Category'}</h2>
            <p className="text-sm text-gray-500 mt-1">Organize your product hierarchy</p>
          </div>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="e.g. Men's Fashion, Electronics"
              value={formData.name}
              onChange={handleNameChange}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">URL Slug <span className="text-red-500">*</span></label>
              <button
                type="button"
                onClick={() => {
                  setIsSlugCustom(false);
                  setFormData(prev => ({ ...prev, slug: generateSlug(prev.name) }));
                }}
                className="text-xs text-black hover:underline font-medium"
              >
                Auto-generate
              </button>
            </div>
            <input
              type="text"
              value={formData.slug}
              onChange={handleSlugChange}
              placeholder="e.g. electronics or smart-watch"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all font-mono text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              ক্যাটাগরির নামের সাথে স্বয়ংক্রিয়ভাবে তৈরি হয়, অথবা আপনি নিজের পছন্দমতো ইংরেজি/বাংলা স্লাগ লিখতে পারেন।
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
            <select
              value={formData.parent_id || 'null'}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
            >
              <option value="null">None (Root Category)</option>
              {renderCategoryOptions(categories)}
            </select>
          </div>
          
          {/* Icon/Design Options */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <div className="flex gap-4">
                {['emoji', 'image', 'custom'].map(type => (
                  <label key={type} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="iconType"
                      value={type}
                      checked={formData.iconType === type}
                      onChange={(e) => setFormData({ ...formData, iconType: e.target.value })}
                      className="w-4 h-4 text-black border-gray-300 focus:ring-black/10 focus:border-black"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 capitalize">
                      {type === 'custom' ? 'Custom Code' : type}
                    </span>
                  </label>
                ))}
              </div>
              
              <button 
                type="button" 
                onClick={handleGenerateAIIcons}
                disabled={isGeneratingIcon}
                className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium px-3 py-1.5 rounded flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {isGeneratingIcon ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Generate with AI
              </button>
            </div>

            {formData.iconType === 'emoji' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emoji Icon</label>
                <input
                  type="text"
                  placeholder="e.g. 📱, 💻, 👗"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Windows এ উইন্ডোজ বাটন + ফুলস্টপ (Win + .) চাপলে ইমোজি কীবোর্ড আসবে।</p>
              </div>
            )}

            {formData.iconType === 'image' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/image.png"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Paste a link to your custom category picture.</p>
                {formData.image && (
                  <div className="mt-2 w-16 h-16 border rounded-lg overflow-hidden bg-white">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}

            {formData.iconType === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom HTML/JSX Code</label>
                <textarea
                  rows="4"
                  placeholder='<div style="background: red; width: 100%; height: 100%;">...</div>'
                  value={formData.customCode}
                  onChange={(e) => setFormData({ ...formData, customCode: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Paste your custom SVG or HTML code here.</p>
              </div>
            )}
          </div>
          <div className="flex items-center mt-2 mb-4">
            <input
              type="checkbox"
              id="isFeatured"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black/10 focus:border-black"
            />
            <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
              Show in "Shop by Category" on Homepage
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
            <button 
              type="button" 
              onClick={onCancel} 
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving || !formData.name.trim()}
              className="px-6 py-2.5 text-sm font-medium text-white bg-black hover:bg-neutral-800 shadow-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {category ? 'Update Category' : 'Save Category'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CategoryRow = ({ category, level = 0, onEdit, onDelete, renderChildren = false }) => {
  const indent = level * 28;
  return (
    <>
      <div className="flex items-center text-sm py-3.5 px-6 border-b border-gray-100 hover:bg-neutral-100/40 transition-colors group">
        <div className="w-1/2 flex items-center" style={{ paddingLeft: `${indent}px` }}>
          {level === 0 ? (
            <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center mr-3 shrink-0 text-base">
              {category.icon || <Folder size={16} className="text-black" />}
            </div>
          ) : (
            <div className="flex items-center mr-2 text-gray-400 shrink-0">
              <ArrowRight size={14} className="mr-1.5" />
              {category.icon && <span className="mr-1 text-sm">{category.icon}</span>}
            </div>
          )}
          <div className="min-w-0">
            <span className={`block truncate ${level === 0 ? 'font-bold text-gray-900 text-sm' : 'font-medium text-gray-700 text-sm'}`}>
              {category.name}
            </span>
            {category.parentName && (
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                Parent: {category.parentName}
              </span>
            )}
          </div>
        </div>
        <div className="w-1/4 text-gray-500 font-mono text-xs truncate pr-2">/{category.slug}</div>
        <div className="w-1/4">
          <span className={`px-2.5 py-1 text-xs font-semibold uppercase rounded-full ${
            category.status === 'active' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}>
            {category.status || 'active'}
          </span>
        </div>
        <div className="w-1/4 flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(category)} className="p-2 text-black hover:bg-neutral-200 rounded-lg transition-colors" title="Edit">
            <Edit size={16} />
          </button>
          <button onClick={() => onDelete(category.id || category._id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {renderChildren && category.subcategories && category.subcategories.map(sub => (
        <CategoryRow key={sub.id || sub._id} category={sub} level={level + 1} onEdit={onEdit} onDelete={onDelete} renderChildren={renderChildren} />
      ))}
    </>
  );
};

const SearchableCategorySelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.id === value);
  const filteredOptions = options.filter(o => (o.name || '').toLowerCase().includes((search || '').toLowerCase()));

  return (
    <div ref={wrapperRef} className="relative w-full text-xs">
      <div 
        className="w-full border border-gray-300 rounded p-1.5 flex justify-between items-center cursor-pointer bg-white overflow-hidden"
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
      >
        <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis w-[calc(100%-14px)]">{selectedOption ? selectedOption.name : '- Empty -'}</span>
        <ChevronDown size={12} className="text-gray-400 shrink-0" />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg">
          <div className="p-1.5 border-b border-gray-100 sticky top-0 bg-white">
            <div className="flex items-center gap-1 bg-gray-50 rounded px-1.5 py-1">
              <Search size={10} className="text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                className="w-full bg-transparent outline-none border-none text-xs"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto">
            <div 
              className="p-1.5 hover:bg-gray-50 cursor-pointer text-gray-500"
              onClick={() => { onChange(''); setIsOpen(false); }}
            >
              - Empty -
            </div>
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
              <div 
                key={opt.id}
                className={`p-1.5 hover:bg-gray-50 cursor-pointer ${opt.id === value ? 'bg-neutral-100 text-black' : ''}`}
                onClick={() => { onChange(opt.id); setIsOpen(false); }}
              >
                {'--'.repeat(opt.level)} {opt.name}
              </div>
            )) : (
              <div className="p-1.5 text-gray-400 text-center italic">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CategoryLayoutManager = ({ categories }) => {
  const [layout, setLayout] = useState({ pc: Array(12).fill(null), mobile: Array(6).fill(null) });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const res = await fetch('/api/admin/categories/layout');
        if (res.ok) {
          const data = await res.json();
          if (data.layout) setLayout(data.layout);
        }
      } catch (err) {
        console.error('Error fetching layout:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/categories/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout })
      });
      if (res.ok) {
        alert('Homepage category layout saved successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save layout');
      }
    } catch (err) {
      alert('Failed to save layout');
    } finally {
      setSaving(false);
    }
  };

  const [editingSlot, setEditingSlot] = useState(null);
  const [slotFormData, setSlotFormData] = useState({ iconType: 'emoji', icon: '', image: '', customCode: '' });
  const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);

  const updateSlotId = (type, index, id) => {
    setLayout(prev => {
      const newArr = [...(prev?.[type] || [])];
      const current = typeof newArr[index] === 'object' && newArr[index] !== null ? { ...newArr[index] } : { id: newArr[index] || null };
      current.id = id === '' ? null : id;
      newArr[index] = current;
      return { ...prev, [type]: newArr };
    });
  };

  const openSlotEditor = (type, index) => {
    const current = layout?.[type]?.[index];
    const data = typeof current === 'object' && current !== null ? current : { id: current || null };
    setSlotFormData({
      iconType: data.iconType || 'emoji',
      icon: data.icon || '',
      image: data.image || '',
      customCode: data.customCode || ''
    });
    setEditingSlot({ type, index, id: data.id });
  };

  const saveSlotEditor = () => {
    setLayout(prev => {
      const newArr = [...(prev?.[editingSlot.type] || [])];
      const current = typeof newArr[editingSlot.index] === 'object' && newArr[editingSlot.index] !== null 
        ? { ...newArr[editingSlot.index] } 
        : { id: newArr[editingSlot.index] || null };
        
      newArr[editingSlot.index] = { ...current, ...slotFormData, hasOverride: true };
      return { ...prev, [editingSlot.type]: newArr };
    });
    setEditingSlot(null);
  };

  const handleGenerateAIIcons = async () => {
    const catId = editingSlot?.id;
    const cat = flattenCats.find(c => c.id === catId);
    if (!cat?.name) {
      alert("Category not found");
      return;
    }
    setIsGeneratingIcon(true);
    try {
      const res = await fetch('/api/ai/category-icon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryName: cat.name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      
      setSlotFormData(prev => ({
        ...prev,
        icon: data.emoji || prev.icon,
        customCode: data.customCode || prev.customCode,
        iconType: data.customCode ? 'custom' : 'emoji'
      }));
    } catch (err) {
      console.error(err);
      alert('Error generating icons: ' + err.message);
    } finally {
      setIsGeneratingIcon(false);
    }
  };

  const flattenCats = [];
  const flatten = (cats, level = 0) => {
    if (!Array.isArray(cats)) return;
    cats.forEach(c => {
      flattenCats.push({ ...c, level });
      if (c.subcategories) flatten(c.subcategories, level + 1);
    });
  };
  flatten(categories);

  if (loading) return <div className="p-4 text-center text-sm text-gray-500">Loading layout configuration...</div>;

  const renderSlot = (type, index) => {
    const current = layout?.[type]?.[index];
    const id = typeof current === 'object' && current !== null ? current.id : current;
    const hasOverride = typeof current === 'object' && current !== null && current.hasOverride;

    return (
      <div key={`${type}-${index}`} className={`bg-gray-50 border ${hasOverride ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200'} rounded-lg p-2 flex flex-col gap-1 items-center justify-center text-xs relative group`}>
        <div className="flex justify-between w-full items-center">
          <span className="text-gray-400 font-medium text-[10px]">Slot {index + 1}</span>
          {id && (
            <button 
              onClick={() => openSlotEditor(type, index)}
              className="text-purple-600 hover:bg-purple-100 p-1 rounded transition-colors"
              title="Customize Slot Icon"
            >
              <Edit size={12} />
            </button>
          )}
        </div>
        <SearchableCategorySelect
          value={id || ''}
          onChange={(newId) => updateSlotId(type, index, newId)}
          options={flattenCats}
        />
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 relative">
      {editingSlot && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white border border-gray-100 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Customize Slot Icon</h2>
                <p className="text-sm text-gray-500 mt-1">Override the default category icon for this specific grid box.</p>
              </div>
              <button onClick={() => setEditingSlot(null)} className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <div className="flex gap-4">
                    {['emoji', 'image', 'custom'].map(type => (
                      <label key={type} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="slotIconType"
                          value={type}
                          checked={slotFormData.iconType === type}
                          onChange={(e) => setSlotFormData({ ...slotFormData, iconType: e.target.value })}
                          className="w-4 h-4 text-black border-gray-300 focus:ring-black/10 focus:border-black"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700 capitalize">
                          {type === 'custom' ? 'Custom Code' : type}
                        </span>
                      </label>
                    ))}
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={handleGenerateAIIcons}
                    disabled={isGeneratingIcon}
                    className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium px-3 py-1.5 rounded flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingIcon ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Generate with AI
                  </button>
                </div>

                {slotFormData.iconType === 'emoji' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emoji Icon</label>
                    <input
                      type="text"
                      placeholder="e.g. 📱, 💻, 👗"
                      value={slotFormData.icon}
                      onChange={(e) => setSlotFormData({ ...slotFormData, icon: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                    />
                  </div>
                )}

                {slotFormData.iconType === 'image' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/image.png"
                      value={slotFormData.image}
                      onChange={(e) => setSlotFormData({ ...slotFormData, image: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                    />
                  </div>
                )}

                {slotFormData.iconType === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom HTML/JSX Code</label>
                    <textarea
                      rows="4"
                      placeholder='<svg>...</svg>'
                      value={slotFormData.customCode}
                      onChange={(e) => setSlotFormData({ ...slotFormData, customCode: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all font-mono text-sm"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setEditingSlot(null)} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="button" onClick={saveSlotEditor} className="px-6 py-2.5 text-sm font-medium text-white bg-black hover:bg-neutral-800 shadow-sm rounded-lg transition-colors flex items-center gap-2">
                  Apply Override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Layout size={20} className="text-black" />
            Homepage Category Grid Layout
          </h2>
          <p className="text-sm text-gray-500 mt-1">Configure which categories appear in the "Shop by Category" boxes.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Layout
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-2">Desktop / PC Layout (2x6 Grid)</h3>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, i) => renderSlot('pc', i))}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-2">Mobile Layout (2x3 Grid)</h3>
          <div className="grid grid-cols-3 gap-2 sm:max-w-md">
            {Array.from({ length: 6 }).map((_, i) => renderSlot('mobile', i))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [sortBy, setSortBy] = useState('sort_order');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Flatten categories in DFS order to preserve hierarchical relations
  const allFlatCategories = [];
  const flattenDFS = (cats, level = 0, parentName = '') => {
    if (!Array.isArray(cats)) return;
    cats.forEach(c => {
      allFlatCategories.push({ ...c, level, parentName });
      if (c.subcategories && c.subcategories.length > 0) {
        flattenDFS(c.subcategories, level + 1, c.name);
      }
    });
  };
  flattenDFS(categories);

  // Filter and sort categories
  const filteredAndSortedCategories = allFlatCategories.filter(cat => {
    const matchesSearch = !searchTerm.trim() ||
      cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.slug?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || !statusFilter || (cat.status || 'active').toLowerCase() === statusFilter.toLowerCase();

    let matchesLevel = true;
    if (levelFilter === 'root') matchesLevel = cat.level === 0;
    else if (levelFilter === 'sub') matchesLevel = cat.level > 0;

    return matchesSearch && matchesStatus && matchesLevel;
  }).sort((a, b) => {
    if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
    if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, levelFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedCategories.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCategories = filteredAndSortedCategories.slice(startIndex, startIndex + pageSize);

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

  const hasActiveFilters = statusFilter !== 'all' || levelFilter !== 'all' || sortBy !== 'sort_order' || searchTerm.trim() !== '';

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setLevelFilter('all');
    setSortBy('sort_order');
    setCurrentPage(1);
  };

  const handleOpenModal = (category = null) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditingCategory(null);
    setShowModal(false);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (data) => {
    setIsSaving(true);
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, data);
      } else {
        await api.createCategory(data);
      }
      handleCloseModal();
      await loadCategories();
    } catch (error) {
      console.error(error.message);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const removeCategoryRecursively = (cats, idToRemove) => {
    return (cats || [])
      .filter(c => c.id !== idToRemove)
      .map(c => ({
        ...c,
        subcategories: c.subcategories ? removeCategoryRecursively(c.subcategories, idToRemove) : []
      }));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure? This action cannot be undone.')) {
      // Optimistic UI update: instantly remove from state
      setCategories(prev => removeCategoryRecursively(prev, id));
      try {
        await api.deleteCategory(id);
      } catch (error) {
        console.error(error.message);
        alert(`Error: ${error.message}`);
        await loadCategories();
      }
    }
  };

  return (
    <div>
      {showModal && (
        <CategoryModal
          category={editingCategory}
          categories={categories}
          onSave={handleSave}
          onCancel={handleCloseModal}
          isSaving={isSaving}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-sm text-gray-500 mt-1">Organize and manage your store's product categories</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/categories/bulk"
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm"
          >
            <span>📑</span>
            Bulk Add Categories
          </Link>
          <button
            onClick={() => handleOpenModal()}
            className="bg-black text-white font-medium py-2.5 px-5 rounded-lg shadow-sm hover:bg-neutral-800 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={18} />
            Add New Category
          </button>
        </div>
      </div>

      <CategoryLayoutManager categories={categories} />

      {/* Categories Toolbar & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search category by name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
              Total Categories: {allFlatCategories.length}
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 text-sm">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 min-w-[150px]">
            <span className="text-xs font-medium text-gray-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:ring-2 focus:ring-black/10 focus:border-black focus:bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-1.5 min-w-[160px]">
            <span className="text-xs font-medium text-gray-500">Hierarchy:</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:ring-2 focus:ring-black/10 focus:border-black focus:bg-white"
            >
              <option value="all">All Categories</option>
              <option value="root">Root Categories Only</option>
              <option value="sub">Subcategories Only</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-1.5 min-w-[160px]">
            <span className="text-xs font-medium text-gray-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:ring-2 focus:ring-black/10 focus:border-black focus:bg-white"
            >
              <option value="sort_order">Sort Order (Default)</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="newest">Newest First</option>
            </select>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center text-xs uppercase text-gray-500 font-bold bg-gray-50 p-4 border-b border-gray-200 tracking-wider">
          <div className="w-1/2">Category Name & Hierarchy</div>
          <div className="w-1/4">Slug</div>
          <div className="w-1/4">Status</div>
          <div className="w-1/4 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-14">
            <Loader2 className="animate-spin text-black" size={36} />
          </div>
        ) : filteredAndSortedCategories.length === 0 ? (
          <div className="text-center p-16 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Folder size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No categories found</h3>
            <p className="text-gray-500 mb-4">
              {hasActiveFilters ? "Try adjusting your search or filters." : "Get started by creating your first product category."}
            </p>
            {hasActiveFilters ? (
              <button onClick={clearAllFilters} className="text-black font-medium hover:underline flex items-center gap-1 text-sm">
                <RotateCcw size={14} /> Clear all filters
              </button>
            ) : (
              <button onClick={() => handleOpenModal()} className="text-black font-medium hover:underline flex items-center gap-1 text-sm">
                <Plus size={16} /> Create Category
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {paginatedCategories.map(category => (
              <CategoryRow 
                key={category.id || category._id} 
                category={category} 
                level={category.level || 0}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
                renderChildren={false}
              />
            ))}
          </div>
        )}

        {/* 20 Items Per Page Pagination Footer */}
        {!loading && filteredAndSortedCategories.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/70">
            <div className="text-xs text-gray-600 font-medium">
              Showing <span className="font-bold text-gray-900">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-gray-900">{Math.min(startIndex + pageSize, filteredAndSortedCategories.length)}</span> of{' '}
              <span className="font-bold text-gray-900">{filteredAndSortedCategories.length}</span> categories
              {filteredAndSortedCategories.length < allFlatCategories.length && (
                <span className="text-gray-400 ml-1.5">({allFlatCategories.length} total)</span>
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
                          ? 'bg-black text-white shadow-sm ring-2 ring-black/20'
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
    </div>
  );
}
