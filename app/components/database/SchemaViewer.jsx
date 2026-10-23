/**
 * Schema Viewer - Table structure and column management
 */

'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';

const DATA_TYPES = [
  'text', 'varchar', 'integer', 'bigint', 'smallint',
  'boolean', 'date', 'timestamp', 'timestamptz', 'json',
  'jsonb', 'uuid', 'numeric', 'decimal', 'float8'
];

export default function SchemaViewer({
  tableName = '',
  columns = [],
  loading = false,
  onAddColumn,
  onDeleteColumn,
  onUpdateColumn
}) {
  const [editingColumn, setEditingColumn] = useState(null);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumn, setNewColumn] = useState({
    name: '',
    type: 'text',
    nullable: true,
    unique: false,
    defaultValue: ''
  });

  const handleAddColumn = async () => {
    if (!newColumn.name.trim()) {
      alert('Column name is required');
      return;
    }

    const result = await onAddColumn({
      ...newColumn,
      name: newColumn.name.trim()
    });

    if (result.success) {
      setNewColumn({
        name: '',
        type: 'text',
        nullable: true,
        unique: false,
        defaultValue: ''
      });
      setShowAddColumn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600">Loading schema...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{tableName}</h2>
          <p className="text-xs text-gray-600 mt-1">{columns.length} column{columns.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowAddColumn(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Add Column
        </button>
      </div>

      {/* Columns Table */}
      <div className="flex-1 overflow-y-auto">
        {columns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-gray-500">
            <p>No columns found</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-100">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-100">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-100">
                  Nullable
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-100">
                  Unique
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-100">
                  Default
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-100">
                  Primary
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 bg-gray-100">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {col.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {col.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {col.nullable ? (
                      <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs font-medium">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {col.unique ? (
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {col.defaultValue ? (
                      <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {col.defaultValue}
                      </code>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {col.primaryKey ? (
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                        Yes
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditingColumn(idx)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="Edit column"
                      >
                        <Edit2 size={16} />
                      </button>
                      {!col.primaryKey && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete column "${col.name}"?`)) {
                              onDeleteColumn(col.name);
                            }
                          }}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Delete column"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Column Modal */}
      {showAddColumn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Add Column</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Column Name
                </label>
                <input
                  type="text"
                  value={newColumn.name}
                  onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })}
                  placeholder="e.g., email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Data Type
                </label>
                <select
                  value={newColumn.type}
                  onChange={(e) => setNewColumn({ ...newColumn, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {DATA_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newColumn.nullable}
                    onChange={(e) => setNewColumn({ ...newColumn, nullable: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Nullable</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newColumn.unique}
                    onChange={(e) => setNewColumn({ ...newColumn, unique: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Unique</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Default Value (optional)
                </label>
                <input
                  type="text"
                  value={newColumn.defaultValue}
                  onChange={(e) => setNewColumn({ ...newColumn, defaultValue: e.target.value })}
                  placeholder="Leave empty for none"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddColumn(false);
                  setNewColumn({
                    name: '',
                    type: 'text',
                    nullable: true,
                    unique: false,
                    defaultValue: ''
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddColumn}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Column
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
