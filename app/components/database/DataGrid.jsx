/**
 * Data Grid - Clean Read-Only table view for database rows
 */

'use client';

import { ChevronUp, ChevronDown, ShieldCheck } from 'lucide-react';

export default function DataGrid({
  columns = [],
  rows = [],
  loading = false,
  totalCount = 0,
  currentPage = 1,
  pageSize = 100,
  onPageChange,
  onSort,
  sortBy = null,
  sortOrder = 'asc'
}) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading && rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-gray-500 mb-2 font-medium">No records found in this table</p>
        <span className="text-xs text-gray-400">Read-only table explorer</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50/70">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold border border-slate-200">
            <ShieldCheck size={14} className="text-slate-500" />
            Read-Only Grid
          </span>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount} rows
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100/90 border-b border-gray-200 sticky top-0 z-10 backdrop-blur-xs">
            <tr>
              <th className="w-12 p-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
              {columns.map(col => (
                <th
                  key={col}
                  onClick={() => onSort?.(col)}
                  className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hover:bg-gray-200/70 cursor-pointer select-none transition-colors border-r border-gray-200/50 last:border-r-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{col}</span>
                    {sortBy === col && (
                      <span className="text-blue-600 shrink-0">
                        {sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="hover:bg-blue-50/50 transition-colors"
              >
                <td className="w-12 p-3 text-center text-xs font-mono text-gray-400 select-none">
                  {((currentPage - 1) * pageSize) + rowIdx + 1}
                </td>
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className="p-3 text-xs text-gray-800 max-w-xs truncate border-r border-gray-100 last:border-r-0 font-mono"
                    title={typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '')}
                  >
                    <span className="block truncate">
                      {typeof row[col] === 'object'
                        ? JSON.stringify(row[col])
                        : String(row[col] ?? '')}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50/80 text-xs">
        <div className="text-gray-600 font-medium">
          Page {currentPage} of {totalPages || 1}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-gray-700 shadow-xs"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-gray-700 shadow-xs"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
