/**
 * Create Table Modal - UI for creating new database tables
 */

'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const DATA_TYPES = [
  'text', 'varchar', 'integer', 'bigint', 'smallint',
  'boolean', 'date', 'timestamp', 'timestamptz', 'json',
  'jsonb', 'uuid', 'numeric', 'decimal', 'float8'
];

export default function CreateTableModal({ isOpen, onClose, onSubmit, loading = false }) {
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState([
    { name: 'id', type: 'uuid', primaryKey: true, nullable: false, autoIncrement: false, defaultValue: '' }
  ]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const addColumn = () => {
    setColumns([
      ...columns,
      { name: '', type: 'text', primaryKey: false, nullable: true, autoIncrement: false, defaultValue: '' }
    ]);
  };

  const updateColumn = (index, field, value) => {
    const newColumns = [...columns];
    newColumns[index][field] = value;
    setColumns(newColumns);
  };

  const removeColumn = (index) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!tableName.trim()) {
      setError('Table name is required');
      return;
    }

    if (columns.length === 0) {
      setError('At least one column is required');
      return;
    }

    const validColumns = columns.every(col => col.name.trim());
    if (!validColumns) {
      setError('All columns must have a name');
      return;
    }

    const result = await onSubmit({
      tableName: tableName.trim(),
      columns: columns.map(col => ({
        ...col,
        name: col.name.trim()
      }))
    });

    if (result.success) {
      setTableName('');
      setColumns([
        { name: 'id', type: 'uuid', primaryKey: true, nullable: false, autoIncrement: false, defaultValue: '' }
      ]);
      onClose();
    } else {
      setError(result.error || 'Failed to create table');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create New Table</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Table Name */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Table Name
              </label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="e.g., users, products, orders"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-600 mt-1">
                Use lowercase letters, numbers, and underscores only
              </p>
            </div>

            {/* Columns */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-900">
                  Columns
                </label>
                <button
                  type="button"
                  onClick={addColumn}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  Add Column
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {columns.map((column, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {/* Column Name */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Column Name
                        </label>
                        <input
                          type="text"
                          value={column.name}
                          onChange={(e) => updateColumn(index, 'name', e.target.value)}
                          placeholder="e.g., user_id"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>

                      {/* Data Type */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Data Type
                        </label>
                        <select
                          value={column.type}
                          onChange={(e) => updateColumn(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                          {DATA_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {/* Primary Key */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={column.primaryKey}
                          onChange={(e) => updateColumn(index, 'primaryKey', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-700 font-medium">Primary Key</span>
                      </label>

                      {/* Nullable */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={column.nullable}
                          onChange={(e) => updateColumn(index, 'nullable', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-700 font-medium">Nullable</span>
                      </label>

                      {/* Unique */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={column.unique}
                          onChange={(e) => updateColumn(index, 'unique', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-700 font-medium">Unique</span>
                      </label>

                      {/* Auto Increment */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={column.autoIncrement}
                          onChange={(e) => updateColumn(index, 'autoIncrement', e.target.checked)}
                          disabled={column.type !== 'integer' && column.type !== 'bigint' && column.type !== 'smallint'}
                          className="rounded disabled:opacity-50"
                        />
                        <span className="text-xs text-gray-700 font-medium">Auto Inc.</span>
                      </label>
                    </div>

                    {/* Default Value */}
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Default Value (optional)
                      </label>
                      <input
                        type="text"
                        value={column.defaultValue}
                        onChange={(e) => updateColumn(index, 'defaultValue', e.target.value)}
                        placeholder="Leave empty for none"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    {/* Delete Button */}
                    {columns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColumn(index)}
                        className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Table'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
