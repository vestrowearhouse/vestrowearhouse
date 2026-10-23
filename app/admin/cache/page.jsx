'use client';

import { useState } from 'react';
import { Trash2, Globe, Database, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function CachePage() {
  const [loadingType, setLoadingType] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleClearCache = async (action, path = '') => {
    setLoadingType(action);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, path }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: data.message, type: 'success' });
      } else {
        setMessage({ text: data.error || 'Failed to clear cache.', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Network error occurred.', type: 'error' });
    } finally {
      setLoadingType(null);
      setTimeout(() => setMessage({ text: '', type: '' }), 5000); // 5 sec পর মেসেজ গায়েব
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Cache & Performance</h1>
        <p className="text-gray-500">Manage your application cache to ensure users see the latest updates.</p>
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clear All Cache */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg"><Trash2 className="w-6 h-6" /></div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">Clear Entire Site Cache</h3>
              <p className="text-sm text-gray-500">Purges everything. Useful after massive product or settings updates.</p>
            </div>
          </div>
          <button 
            onClick={() => handleClearCache('clear_all')}
            disabled={loadingType === 'clear_all'}
            className="w-full mt-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex justify-center items-center gap-2 disabled:opacity-70 transition-colors"
          >
            {loadingType === 'clear_all' ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Purge All Cache'}
          </button>
        </div>

        {/* Clear Products/Home Cache */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Globe className="w-6 h-6" /></div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">Clear Homepage Cache</h3>
              <p className="text-sm text-gray-500">Clears the main homepage only. Use after changing banners or featured items.</p>
            </div>
          </div>
          <button 
            onClick={() => handleClearCache('clear_path', '/')}
            disabled={loadingType === 'clear_path'}
            className="w-full mt-2 py-2.5 px-4 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-medium rounded-lg flex justify-center items-center gap-2 disabled:opacity-70 transition-colors"
          >
            {loadingType === 'clear_path' ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Refresh Homepage'}
          </button>
        </div>
      </div>
    </div>
  );
}