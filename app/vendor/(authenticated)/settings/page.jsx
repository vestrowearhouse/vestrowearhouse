'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Save, CheckCircle2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function VendorSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      
      const options = { maxSizeMB: 1, maxWidthOrHeight: 512, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      
      const form = new FormData();
      form.append('file', compressedFile);
      
      const res = await fetch('/api/vendor/upload', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      setSettings(prev => ({ ...prev, logo_url: data.url }));
      showToast('Logo uploaded successfully. Remember to save changes.');
    } catch (err) {
      console.error('Logo upload error:', err);
      showToast('Failed to upload logo', 'error');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vendor/settings', {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      setError('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/vendor/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      
      if (res.ok) {
        showToast('Settings saved successfully!');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch (err) {
      showToast('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600 mb-3" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {settings && (
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Shop Profile Logo */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Shop Logo</h2>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Shop Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Logo</div>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                  disabled={uploadingLogo}
                />
                <p className="text-xs text-gray-500">Recommended size: 256x256px. Max size: 1MB.</p>
              </div>
            </div>
          </div>

          {/* General Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">General Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shop Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={settings.shop_name || ''} 
                  onChange={(e) => setSettings({...settings, shop_name: e.target.value})} 
                  required 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Owner Name</label>
                <input 
                  type="text" 
                  value={settings.owner_name || ''} 
                  onChange={(e) => setSettings({...settings, owner_name: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shop Description</label>
                <textarea 
                  value={settings.description || ''} 
                  onChange={(e) => setSettings({...settings, description: e.target.value})} 
                  rows="3" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none text-sm" 
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Contact Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shop Email <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  value={settings.email || ''} 
                  onChange={(e) => setSettings({...settings, email: e.target.value})} 
                  required 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <input 
                  type="text" 
                  value={settings.phone || ''} 
                  onChange={(e) => setSettings({...settings, phone: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shop Address</label>
                <textarea 
                  value={settings.shop_address || ''} 
                  onChange={(e) => setSettings({...settings, shop_address: e.target.value})} 
                  rows="2" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none text-sm" 
                />
              </div>
            </div>
          </div>

          {/* Store Status Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Store Status Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Store Status</p>
                  <p className="text-sm text-gray-500">Temporarily hide your store from customers</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setSettings({...settings, status: settings.status === 'active' ? 'inactive' : 'active'})}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    settings.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {settings.status === 'active' ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => fetchSettings()}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingLogo}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-semibold flex items-center gap-2 disabled:opacity-75"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
