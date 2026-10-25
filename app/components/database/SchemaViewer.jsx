/**
 * Schema Viewer - Table structure viewer (Read-Only)
 */

'use client';

import { ShieldCheck } from 'lucide-react';

export default function SchemaViewer({
  tableName = '',
  columns = [],
  loading = false
}) {
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold border border-slate-200">
          <ShieldCheck size={14} className="text-slate-500" />
          Read-Only Schema
        </span>
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
                  Primary Key
                </th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 font-mono">
                    {col.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium font-mono">
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
                      <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                        {col.defaultValue}
                      </code>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {col.primaryKey ? (
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                        Yes
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
