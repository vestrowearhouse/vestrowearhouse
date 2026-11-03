'use client';

import { useState } from 'react';
import { Plus, X, Tag, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * DynamicAttributeBuilder
 *
 * Props:
 *   attributes: [{ name: string, values: string[] }]
 *   onChange(attributes): called whenever attributes change
 *   disabled?: boolean
 */
export default function DynamicAttributeBuilder({ attributes = [], onChange, disabled = false }) {
  const [newAttrName, setNewAttrName] = useState('');
  const [valueInputs, setValueInputs] = useState({}); // { attrIndex: string }
  const [collapsed, setCollapsed] = useState({});      // { attrIndex: bool }

  const emit = (updated) => onChange?.(updated);

  // ─── Attribute actions ───────────────────────────────────────────────────

  const addAttribute = () => {
    const name = newAttrName.trim();
    if (!name) return;
    if (attributes.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
      alert(`Attribute "${name}" already exists`);
      return;
    }
    emit([...attributes, { name, values: [] }]);
    setNewAttrName('');
  };

  const removeAttribute = (idx) => {
    emit(attributes.filter((_, i) => i !== idx));
  };

  const updateAttrName = (idx, name) => {
    const updated = attributes.map((a, i) => (i === idx ? { ...a, name } : a));
    emit(updated);
  };

  // ─── Value actions ────────────────────────────────────────────────────────

  const addValue = (attrIdx) => {
    const val = (valueInputs[attrIdx] || '').trim();
    if (!val) return;
    const attr = attributes[attrIdx];
    if (attr.values.some((v) => v.toLowerCase() === val.toLowerCase())) {
      alert(`"${val}" already exists in ${attr.name}`);
      return;
    }
    const updated = attributes.map((a, i) =>
      i === attrIdx ? { ...a, values: [...a.values, val] } : a
    );
    emit(updated);
    setValueInputs((prev) => ({ ...prev, [attrIdx]: '' }));
  };

  const removeValue = (attrIdx, valIdx) => {
    const updated = attributes.map((a, i) =>
      i === attrIdx ? { ...a, values: a.values.filter((_, vi) => vi !== valIdx) } : a
    );
    emit(updated);
  };

  const handleValueKeyDown = (e, attrIdx) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addValue(attrIdx);
    }
  };

  const toggleCollapse = (idx) =>
    setCollapsed((prev) => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div className="space-y-3">
      {/* Existing attributes */}
      {attributes.map((attr, attrIdx) => (
        <div
          key={attrIdx}
          className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm"
        >
          {/* Attribute header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
            <Tag className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <input
              type="text"
              value={attr.name}
              onChange={(e) => updateAttrName(attrIdx, e.target.value)}
              disabled={disabled}
              placeholder="Attribute name (e.g. Color)"
              className="flex-1 text-sm font-semibold text-gray-800 bg-transparent border-none outline-none placeholder-gray-400"
            />
            <span className="text-xs text-gray-400 mr-2">
              {attr.values.length} value{attr.values.length !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={() => toggleCollapse(attrIdx)}
              className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
            >
              {collapsed[attrIdx] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeAttribute(attrIdx)}
                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove attribute"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Values */}
          {!collapsed[attrIdx] && (
            <div className="px-4 py-3 space-y-3">
              {/* Value pills */}
              <div className="flex flex-wrap gap-2 min-h-[2rem]">
                {attr.values.length === 0 && (
                  <span className="text-xs text-gray-400 italic">No values yet. Type below and press Enter.</span>
                )}
                {attr.values.map((val, valIdx) => (
                  <span
                    key={valIdx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm font-medium"
                  >
                    {val}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => removeValue(attrIdx, valIdx)}
                        className="text-blue-400 hover:text-blue-700 ml-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {/* Add value input */}
              {!disabled && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={valueInputs[attrIdx] || ''}
                    onChange={(e) =>
                      setValueInputs((prev) => ({ ...prev, [attrIdx]: e.target.value }))
                    }
                    onKeyDown={(e) => handleValueKeyDown(e, attrIdx)}
                    placeholder={`Add ${attr.name} value (press Enter)`}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => addValue(attrIdx)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Quick preset buttons for common standardized SKU attributes */}
      {!disabled && (
        <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 mb-1">
          <span className="font-medium">Quick presets:</span>
          {['Size', 'Color', 'Storage', 'RAM'].map((preset) => {
            const exists = attributes.some((a) => a.name.toLowerCase() === preset.toLowerCase());
            return (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  if (exists) return;
                  emit([...attributes, { name: preset, values: [] }]);
                }}
                disabled={exists}
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                  exists
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300'
                }`}
              >
                + {preset}
              </button>
            );
          })}
        </div>
      )}

      {/* Add new attribute row */}
      {!disabled && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newAttrName}
            onChange={(e) => setNewAttrName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttribute())}
            placeholder="New attribute name (e.g. Size, Color, Storage…)"
            className="flex-1 text-sm border border-dashed border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 placeholder-gray-400"
          />
          <button
            type="button"
            onClick={addAttribute}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Attribute
          </button>
        </div>
      )}
    </div>
  );
}
