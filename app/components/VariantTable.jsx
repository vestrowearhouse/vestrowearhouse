'use client';

import { useState } from 'react';
import { ImageIcon, X, Upload, AlertCircle } from 'lucide-react';

/**
 * VariantTable
 *
 * Props:
 *   variants: Array of variant objects
 *   onChange(variants): called on any change
 *   disabled?: boolean
 */
export default function VariantTable({ variants = [], onChange, disabled = false }) {
  const [imageUrlInputs, setImageUrlInputs] = useState({}); // { variantIdx: string }

  const emit = (updated) => onChange?.(updated);

  const updateVariant = (idx, field, value) => {
    const updated = variants.map((v, i) =>
      i === idx ? { ...v, [field]: value } : v
    );
    emit(updated);
  };

  const addImageUrl = (idx) => {
    const url = (imageUrlInputs[idx] || '').trim();
    if (!url) return;
    const current = variants[idx].images || [];
    updateVariant(idx, 'images', [...current, url]);
    setImageUrlInputs((prev) => ({ ...prev, [idx]: '' }));
  };

  const removeImage = (variantIdx, imgIdx) => {
    const current = variants[variantIdx].images || [];
    updateVariant(variantIdx, 'images', current.filter((_, i) => i !== imgIdx));
  };

  const handleFileUpload = async (e, variantIdx) => {
    const files = e.target.files;
    if (!files?.length) return;
    const file = files[0];
    e.target.value = '';

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Try admin media endpoint first, fallback to vendor upload endpoint
      let res = await fetch('/api/admin/media', { method: 'POST', body: formData });
      if (!res.ok) {
        formData.set('file', file);
        res = await fetch('/api/vendor/upload', { method: 'POST', credentials: 'include', body: formData });
      }
      
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          const current = variants[variantIdx].images || [];
          updateVariant(variantIdx, 'images', [...current, data.url]);
        }
      }
    } catch (err) {
      console.error('Variant image upload failed:', err);
    }
  };

  if (variants.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
        <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500 font-medium">No variants generated yet.</p>
        <p className="text-xs text-gray-400 mt-1">Add attributes above and click "Generate Variants".</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-left">
            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide w-1/4">Combination</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">SKU</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Price (৳)</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Discount (৳)</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Stock</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Images</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {variants.map((variant, idx) => {
            const comboLabel = Object.entries(variant.combination || {})
              .map(([k, v]) => `${k}: ${v}`)
              .join(' · ');

            return (
              <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                {/* Combination label */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(variant.combination || {}).map(([k, v]) => (
                      <span
                        key={k}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700"
                      >
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </td>

                {/* SKU */}
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={variant.sku || ''}
                    onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                    disabled={disabled}
                    placeholder="SKU"
                    className="w-full min-w-[100px] text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </td>

                {/* Price */}
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={variant.price ?? ''}
                    onChange={(e) => updateVariant(idx, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={disabled}
                    placeholder="0"
                    min="0"
                    className="w-full min-w-[80px] text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </td>

                {/* Discount Price */}
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={variant.discountPrice ?? ''}
                    onChange={(e) => updateVariant(idx, 'discountPrice', e.target.value === '' ? null : Number(e.target.value))}
                    disabled={disabled}
                    placeholder="Optional"
                    min="0"
                    className="w-full min-w-[80px] text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </td>

                {/* Stock */}
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={variant.stock ?? ''}
                    onChange={(e) => updateVariant(idx, 'stock', e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={disabled}
                    placeholder="0"
                    min="0"
                    className="w-full min-w-[60px] text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <select
                    value={variant.status || 'active'}
                    onChange={(e) => updateVariant(idx, 'status', e.target.value)}
                    disabled={disabled}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </td>

                {/* Images */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1.5 min-w-[160px]">
                    {/* Existing images */}
                    {(variant.images || []).length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {(variant.images || []).map((img, imgIdx) => (
                          <div key={imgIdx} className="relative group/img">
                            <img
                              src={img}
                              alt={`variant-${idx}-img-${imgIdx}`}
                              className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                              onError={(e) => { e.target.src = 'https://placehold.co/40x40/e5e7eb/9ca3af?text=?'; }}
                            />
                            {!disabled && (
                              <button
                                type="button"
                                onClick={() => removeImage(idx, imgIdx)}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add image row */}
                    {!disabled && (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={imageUrlInputs[idx] || ''}
                          onChange={(e) => setImageUrlInputs((prev) => ({ ...prev, [idx]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl(idx))}
                          placeholder="Image URL"
                          className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
                        />
                        <button
                          type="button"
                          onClick={() => addImageUrl(idx)}
                          title="Add URL"
                          className="p-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                        </button>
                        <label className="p-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer" title="Upload file">
                          <Upload className="w-3.5 h-3.5" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, idx)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
