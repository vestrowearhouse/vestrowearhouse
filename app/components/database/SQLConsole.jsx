/**
 * SQL Console - SQL editor and query runner
 */

'use client';

import { useState } from 'react';
import { Play, Copy, Trash2 } from 'lucide-react';

export default function SQLConsole({ loading = false, onExecute }) {
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async () => {
    if (!query.trim()) {
      setError('Please enter a SQL query');
      return;
    }

    setIsExecuting(true);
    setError('');
    setResult(null);

    const response = await onExecute(query);
    setIsExecuting(false);

    if (response.success) {
      setResult(response.data);
    } else {
      setError(response.error || 'Error executing query');
    }
  };

  const copyQuery = () => {
    navigator.clipboard.writeText(query);
  };

  const clearQuery = () => {
    setQuery('');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Editor */}
      <div className="flex-1 flex flex-col min-h-0 border-b border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">SQL Query</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={copyQuery}
              className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              title="Copy query"
            >
              <Copy size={18} />
            </button>
            <button
              onClick={clearQuery}
              className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              title="Clear query"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your SQL query here..."
          className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none border-0"
          style={{ fontFamily: 'Monaco, Courier New, monospace' }}
        />

        {/* Execute Button */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            {query.length} characters
          </div>
          <button
            onClick={handleExecute}
            disabled={isExecuting || loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play size={18} />
            {isExecuting ? 'Executing...' : 'Execute Query'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 flex flex-col min-h-0 border-t border-gray-200">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Results</h3>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">Error</p>
              <p className="text-sm text-red-700 mt-1 font-mono whitespace-pre-wrap break-words">
                {error}
              </p>
            </div>
          )}

          {result && !error && (
            <div>
              {Array.isArray(result) ? (
                <div className="overflow-x-auto">
                  {result.length > 0 ? (
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-gray-300 bg-gray-100">
                          {Object.keys(result[0]).map(key => (
                            <th
                              key={key}
                              className="p-2 text-left font-semibold text-gray-900 border-r border-gray-300 last:border-r-0"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.map((row, idx) => (
                          <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                            {Object.values(row).map((val, colIdx) => (
                              <td
                                key={colIdx}
                                className="p-2 text-gray-700 border-r border-gray-200 last:border-r-0 font-mono max-w-xs truncate"
                                title={String(val)}
                              >
                                {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-600">{result.length} rows returned</p>
                  )}
                  <p className="text-xs text-gray-500 mt-4">
                    {result.length} row{result.length !== 1 ? 's' : ''} returned
                  </p>
                </div>
              ) : (
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm text-gray-900 font-mono">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          )}

          {!error && !result && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p>Run a query to see results here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
