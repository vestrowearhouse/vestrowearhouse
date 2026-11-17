'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon, 
  Loader2, 
  X, 
  Upload, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Check,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [failedImages, setFailedImages] = useState({});
  const [deleteModal, setDeleteModal] = useState({ show: false, banner: null });
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    link: '',
    position: 0,
    status: 'active'
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadBanners = useCallback(async (showFullLoader = true) => {
    if (showFullLoader) setLoading(true);
    try {
      const res = await fetch('/api/banners?admin=true');
      const data = await res.json();
      setBanners(data.banners || []);
    } catch (error) {
      console.error('Failed to load banners:', error);
      showToast('Failed to load banners', 'error');
    } finally {
      if (showFullLoader) setLoading(false);
    }
  }, []);

  useEffect(() => { loadBanners(); }, [loadBanners]);

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title || '',
        image: banner.image || '',
        link: banner.link || '',
        position: banner.position !== undefined ? banner.position : 0,
        status: banner.status || 'active'
      });
    } else {
      setEditingBanner(null);
      setFormData({ title: '', image: '', link: '', position: 0, status: 'active' });
    }
    setShowModal(true);
  };

  // Ultra-Fast Image Upload with Client-Side Compression
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      let fileToUpload = file;

      // Compress client-side if file is larger than 150KB
      if (file.size > 150 * 1024) {
        try {
          const options = {
            maxSizeMB: 0.45, // ~450KB max (crisp HD banners, tiny file size)
            maxWidthOrHeight: 1800,
            useWebWorker: true,
            initialQuality: 0.88
          };
          fileToUpload = await imageCompression(file, options);
        } catch (compressionErr) {
          console.warn('Image compression skipped/fallback to raw file:', compressionErr);
        }
      }

      const uploadData = new FormData();
      uploadData.append('file', fileToUpload, file.name);

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: uploadData
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormData(prev => ({ ...prev, image: data.url }));
        showToast('Image uploaded successfully!');
      } else {
        showToast(data.error || 'Failed to upload image', 'error');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      showToast('Image upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Instant Add / Edit Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) {
      showToast('Please provide a banner image URL or upload one', 'error');
      return;
    }

    if (saving) return;
    setSaving(true);

    try {
      const url = editingBanner ? `/api/banners/${editingBanner.id}` : '/api/banners';
      const method = editingBanner ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();

      if (res.ok) {
        setShowModal(false);
        showToast(editingBanner ? 'Banner updated successfully!' : 'Banner created successfully!');
        
        // Optimistically update local state immediately without full-screen loading spinner
        if (editingBanner && data.banner) {
          setBanners(prev => prev.map(b => b.id === editingBanner.id ? data.banner : b));
        } else if (data.banner) {
          setBanners(prev => {
            const updated = [...prev, data.banner];
            return updated.sort((a, b) => (a.position || 0) - (b.position || 0));
          });
        } else {
          loadBanners(false);
        }
      } else {
        showToast(data.error || 'Failed to save banner', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Error saving banner', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Instant 1-Click Status Toggle (Active / Inactive)
  const handleToggleStatus = async (banner) => {
    const newStatus = banner.status === 'active' ? 'inactive' : 'active';
    
    // Optimistic UI update
    setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, status: newStatus } : b));
    showToast(`Banner marked as ${newStatus}`);

    try {
      const res = await fetch(`/api/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        // Rollback on error
        setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, status: banner.status } : b));
        showToast('Failed to update status', 'error');
      }
    } catch (err) {
      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, status: banner.status } : b));
      showToast('Error updating status', 'error');
    }
  };

  // Instant Optimistic Deletion
  const handleDeleteConfirm = async () => {
    const banner = deleteModal.banner;
    if (!banner) return;

    setDeleteModal({ show: false, banner: null });

    // Store backup for rollback in case of network error
    const previousBanners = [...banners];

    // Optimistically remove from state instantly
    setBanners(prev => prev.filter(b => b.id !== banner.id));
    showToast('Banner deleted successfully');

    try {
      const res = await fetch(`/api/banners/${banner.id}`, { method: 'DELETE' });
      if (!res.ok) {
        // Rollback if server returned failure
        setBanners(previousBanners);
        showToast('Failed to delete banner on server', 'error');
      }
    } catch (error) {
      console.error(error);
      setBanners(previousBanners);
      showToast('Error deleting banner', 'error');
    }
  };

  const handleSyncBanners = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/fix-banners');
      const data = await res.json();
      if (data.success) {
        await loadBanners(false);
        showToast(`Banners synchronized! Migrated ${data.migratedCount || 0} banner(s).`);
      } else {
        showToast(data.error || 'Failed to sync banners', 'error');
      }
    } catch (err) {
      console.error('Failed to sync banners:', err);
      showToast('Error synchronizing banners', 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm font-semibold text-white animate-in slide-in-from-bottom-3 ${
          toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Banners Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage homepage hero slider and side promotional banners with lightning-fast updates.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleSyncBanners} 
            disabled={syncing}
            className="bg-white border border-neutral-200 text-neutral-700 py-2.5 px-4 rounded-lg flex items-center gap-2 hover:bg-neutral-50 active:scale-95 transition text-xs font-bold shadow-2xs disabled:opacity-50 uppercase tracking-wider"
            title="Migrate external banner images to permanent storage"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin text-black' : ''} />
            <span>{syncing ? 'Syncing...' : 'Sync Storage'}</span>
          </button>
          
          <button 
            onClick={() => handleOpenModal()} 
            className="bg-black hover:bg-neutral-800 active:scale-95 text-white py-2.5 px-5 rounded-lg flex items-center gap-2 transition font-bold text-xs uppercase tracking-wider shadow-xs"
          >
            <Plus size={16} /> 
            <span>Add Banner</span>
          </button>
        </div>
      </div>

      {/* Banners Table */}
      <div className="bg-white rounded-2xl shadow-2xs border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-black" size={32} />
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Loading banners...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80 text-gray-500 text-[11px] uppercase font-bold tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">Image</th>
                  <th className="py-3.5 px-4">Info & Placement</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {banners.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-12 text-gray-500 text-sm">
                      No banners found. Click &ldquo;Add Banner&rdquo; to create your first homepage banner!
                    </td>
                  </tr>
                ) : banners.map(banner => (
                  <tr key={banner.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 w-44">
                      <div className="w-36 h-20 bg-gray-100 rounded-xl overflow-hidden relative border border-gray-200/80 flex items-center justify-center shadow-xs">
                        {banner.image && !failedImages[banner.id] ? (
                          <img 
                            src={banner.image} 
                            alt={banner.title || 'Banner'} 
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            loading="lazy"
                            className="w-full h-full object-cover" 
                            onError={() => setFailedImages(prev => ({ ...prev, [banner.id]: true }))}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-gray-400 p-2">
                            <ImageIcon size={20} />
                            <span className="text-[10px] mt-0.5 font-medium">Image failed</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <p className="font-extrabold text-sm text-gray-900">{banner.title || 'Untitled Banner'}</p>
                      
                      <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-700">Placement:</span>
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 font-medium text-[11px]">
                            {banner.position === 100 
                              ? 'Right Side (Top)' 
                              : banner.position === 200 
                              ? 'Right Side (Bottom)' 
                              : `Main Slider (Order: ${banner.position || 0})`}
                          </span>
                        </div>

                        {banner.link && (
                          <div className="flex items-center gap-1 font-mono text-[11px] text-neutral-600 truncate max-w-md">
                            <LinkIcon size={12} className="shrink-0 text-gray-400" />
                            <span className="truncate">{banner.link}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Instant 1-Click Status Toggle */}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(banner)}
                        className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full transition-all active:scale-95 ${
                          banner.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${banner.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        <span>{banner.status === 'active' ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    {/* Action Buttons */}
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button 
                          onClick={() => handleOpenModal(banner)} 
                          className="p-2 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors" 
                          title="Edit banner"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteModal({ show: true, banner })} 
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" 
                          title="Delete banner"
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
        )}
      </div>

      {/* Modal: Add / Edit Banner */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-base font-extrabold text-gray-900">
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                disabled={saving}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Image Input + Fast Compressed Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Banner Image <span className="text-rose-500">*</span>
                </label>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    required 
                    value={formData.image} 
                    onChange={e => setFormData({...formData, image: e.target.value})} 
                    className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition" 
                    placeholder="Paste image URL (https://...)" 
                  />
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    {uploading ? <Loader2 size={14} className="animate-spin text-blue-600" /> : <Upload size={14} />}
                    <span>{uploading ? 'Compressing...' : 'Upload'}</span>
                  </button>
                </div>

                {/* Live Preview */}
                {formData.image && (
                  <div className="mt-2.5 p-2 bg-gray-50 border border-gray-200/80 rounded-2xl">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 px-1 mb-1.5">
                      <span>Image Preview:</span>
                      <a 
                        href={formData.image} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        Open full <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="w-full h-36 bg-gray-200/80 rounded-xl overflow-hidden relative flex items-center justify-center border border-gray-200">
                      <img 
                        src={formData.image} 
                        alt="Preview" 
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement.innerHTML = '<span class="text-xs text-rose-500 font-medium">Failed to load preview image URL.</span>';
                        }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-gray-400 mt-1.5">
                  💡 Tip: Images are automatically compressed to HD WebP before uploading for instant speed.
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Title (Optional)
                </label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition" 
                  placeholder="e.g. Mega Summer Sale"
                />
              </div>

              {/* Target Link */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Target Link (Optional)
                </label>
                <input 
                  type="text" 
                  value={formData.link} 
                  onChange={e => setFormData({...formData, link: e.target.value})} 
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition" 
                  placeholder="/shop or https://..." 
                />
              </div>

              {/* Placement & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Placement
                  </label>
                  <select 
                    value={
                      formData.position === 100 ? 'side_top' : 
                      formData.position === 200 ? 'side_bottom' : 'main_slider'
                    } 
                    onChange={e => {
                      let newPos = formData.position;
                      if (e.target.value === 'side_top') newPos = 100;
                      else if (e.target.value === 'side_bottom') newPos = 200;
                      else if (newPos >= 100) newPos = 0;
                      setFormData({...formData, position: newPos});
                    }} 
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  >
                    <option value="main_slider">Main Slider</option>
                    <option value="side_top">Right Side (Top)</option>
                    <option value="side_bottom">Right Side (Bottom)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})} 
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {formData.position < 100 && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Slider Order (0, 1, 2...)
                    </label>
                    <input 
                      type="number" 
                      min="0" 
                      max="99"
                      value={formData.position} 
                      onChange={e => setFormData({...formData, position: parseInt(e.target.value) || 0})} 
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition" 
                    />
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  disabled={saving}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving || !formData.image}
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-black hover:bg-neutral-800 active:scale-95 text-white rounded-lg transition shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingBanner ? 'Update Banner' : 'Save Banner'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Delete Banner?</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Are you sure you want to remove &ldquo;{deleteModal.banner?.title || 'this banner'}&rdquo;? It will disappear from the homepage immediately.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button 
                type="button" 
                onClick={() => setDeleteModal({ show: false, banner: null })}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}