/**
 * Data Grid - Spreadsheet-like table view for database rows
 */

'use client';

import { useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, Trash2, Plus, Edit2 } from 'lucide-react';

export default function DataGrid({
  columns = [],
  rows = [],
  loading = false,
  totalCount = 0,
  currentPage = 1,
  pageSize = 100,
  onPageChange,
  onSort,
  onAddRow,
  onEditRow,
  onDeleteRow,
  sortBy = null,
  sortOrder = 'asc'
}) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());

  const handleCellEdit = (rowIndex, colName, value) => {
    setEditingCell({ rowIndex, colName });
    setEditValue(value);
  };

  const handleCellSave = (rowIndex, colName) => {
    onEditRow?.(rowIndex, colName, editValue);
    setEditingCell(null);
  };

  const toggleRowSelection = (rowIndex) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowIndex)) {
        newSet.delete(rowIndex);
      } else {
        newSet.add(rowIndex);
      }
      return newSet;
    });
  };

  const toggleAllRows = () => {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map((_, i) => i)));
    }
  };

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
        <p className="text-gray-500 mb-4">No data in this table</p>
        <button
          onClick={onAddRow}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Add Row
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <button
            onClick={onAddRow}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Add Row
          </button>
          {selectedRows.size > 0 && (
            <>
              <span className="text-sm text-gray-600">
                {selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => {
                  if (window.confirm(`Delete ${selectedRows.size} row(s)?`)) {
                    Array.from(selectedRows).forEach(rowIndex => {
                      onDeleteRow?.(rowIndex);
                    });
                    setSelectedRows(new Set());
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 text-sm rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </>
          )}
        </div>

        <div className="text-sm text-gray-600">
          {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto border-b border-gray-200">
        <table className="w-full border-collapse bg-white">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="w-12 p-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.size === rows.length && rows.length > 0}
                  onChange={toggleAllRows}
                  className="rounded cursor-pointer"
                />
              </th>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="p-3 text-left text-xs font-semibold text-gray-700 bg-gray-100 border-b border-gray-200 hover:bg-gray-200 transition-colors cursor-pointer min-w-max"
                  onClick={() => onSort?.(col)}
                >
                  <div className="flex items-center gap-2">
                    <span>{col}</span>
                    {sortBy === col && (
                      sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
              <th className="w-20 p-3 text-center text-xs font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                  selectedRows.has(rowIdx) ? 'bg-blue-100' : ''
                }`}
              >
                <td className="w-12 p-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(rowIdx)}
                    onChange={() => toggleRowSelection(rowIdx)}
                    className="rounded cursor-pointer"
                  />
                </td>
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className="p-3 text-sm text-gray-800 max-w-xs truncate cursor-cell border-gray-200"
                    onDoubleClick={() => handleCellEdit(rowIdx, col, row[col])}
                  >
                    {editingCell?.rowIndex === rowIdx && editingCell?.colName === col ? (
                      <input
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellSave(rowIdx, col)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCellSave(rowIdx, col);
                          if (e.key === 'Escape') setEditingCell(null);
                        }}
                        className="w-full px-2 py-1 border border-blue-500 rounded text-sm"
                      />
                    ) : (
                      <span className="block truncate">
                        {typeof row[col] === 'object'
                          ? JSON.stringify(row[col])
                          : String(row[col] ?? '')}
                      </span>
                    )}
                  </td>
                ))}
                <td className="w-20 p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEditRow?.(rowIdx)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="Edit row"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this row?')) {
                          onDeleteRow?.(rowIdx);
                        }
                      }}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Delete row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => onPageChange?.(parseInt(e.target.value))}
            className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-lg text-center"
          />
          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
