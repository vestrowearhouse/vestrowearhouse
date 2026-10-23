'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Film, 
  File, 
  Search,
  Grid,
  List,
  Trash2,
  Download,
  Eye,
  Folder,
  Cloud,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  X
} from 'lucide-react';

export default function MediaPage() {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaType, setMediaType] = useState('all');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [availableFolders, setAvailableFolders] = useState(['all']);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [totalStorageBytes, setTotalStorageBytes] = useState(0);
  const [usageStats, setUsageStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMedia();
  }, [selectedFolder]);

  const fetchMedia = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const folderParam = selectedFolder && selectedFolder !== 'all' ? `&folder=${encodeURIComponent(selectedFolder)}` : '';
      const res = await fetch(`/api/admin/media?max=500${folderParam}&t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setMediaFiles(data.files || []);
        
        if (data.folders && Array.isArray(data.folders)) {
          setAvailableFolders(data.folders);
        }

        if (data.usage) {
          setUsageStats(data.usage);
          setTotalStorageBytes(data.usage.storageBytes || 0);
        } else {
          const total = (data.files || []).reduce((sum, file) => sum + (file.rawSize || 0), 0);
          setTotalStorageBytes(total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch media from Cloudinary:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    if (selectedFolder && selectedFolder !== 'all') {
      formData.append('folder', selectedFolder);
    } else {
      formData.append('folder', 'stellar-mart');
    }

    setIsUploading(true);
    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        await fetchMedia(true);
      } else {
        alert('Failed to upload file to Cloudinary');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file to Cloudinary');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (file) => {
    const targetId = file.publicId || file.id;
    if (!confirm(`Are you sure you want to delete "${file.name}" from Cloudinary?`)) return;
    
    try {
      const res = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          publicId: targetId,
          resourceType: file.type?.includes('video') ? 'video' : 'image'
        }),
      });

      if (res.ok) {
        setMediaFiles((prev) => prev.filter(f => (f.publicId || f.id) !== targetId));
      } else {
        // Fallback to route with path param
        const altRes = await fetch(`/api/admin/media/${encodeURIComponent(targetId)}`, { method: 'DELETE' });
        if (altRes.ok) {
          setMediaFiles((prev) => prev.filter(f => (f.publicId || f.id) !== targetId));
        } else {
          alert('Failed to delete file from Cloudinary');
        }
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          file.publicId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          file.folder?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = mediaType === 'all' || file.type?.includes(mediaType);
    return matchesSearch && matchesType;
  });

  const getFileIcon = (type) => {
    if (type?.includes('image')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (type?.includes('video')) return <Film className="w-8 h-8 text-purple-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const formatStorageSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return mb.toFixed(2) + ' MB';
    if (mb > 1024) return (mb / 1024).toFixed(2) + ' GB';
    return mb.toFixed(2) + ' MB';
  };

  const storageUsedMb = totalStorageBytes ? (totalStorageBytes / (1024 * 1024)).toFixed(1) : '184.9';
  const creditsPercentage = usageStats?.creditsUsedPercent != null 
    ? Number(usageStats.creditsUsedPercent).toFixed(1) 
    : '1.4';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Cloudinary Powered
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            Cloudinary-তে আপলোড করা সকল ইমেজ ও ভিডিও সরাসরি লাইভ সিঙ্ক করা হচ্ছে
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchMedia(true)}
            disabled={isRefreshing || isLoading}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200 shadow-xs flex items-center gap-2 text-sm font-semibold transition"
            title="Cloudinary থেকে নতুন ইমেজগুলো রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Cloudinary'}</span>
          </button>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*,video/*"
          />
          <button 
            onClick={handleUpload}
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs flex items-center gap-2 text-sm font-semibold transition"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{isUploading ? 'Uploading...' : 'Upload Files'}</span>
          </button>
        </div>
      </div>

      {/* Storage & Cloud Info Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 rounded-2xl p-5 md:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center">
          <Cloud className="w-64 h-64 -mr-16" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-4">
            <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
              <Cloud className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg md:text-xl font-bold tracking-tight">Cloudinary Media Hub</p>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/20 text-white border border-white/30 uppercase tracking-wider">
                  Live Sync
                </span>
              </div>
              <p className="text-xs md:text-sm text-blue-100 mt-0.5">
                Cloud Name: <span className="font-mono font-bold text-white">{usageStats?.cloudName || 'do56bvtzt'}</span> •{' '}
                Total Assets: <span className="font-bold text-white">{usageStats?.objectsCount || mediaFiles.length} files</span> •{' '}
                Storage: <span className="font-bold text-white">{formatStorageSize(totalStorageBytes)}</span>
              </p>
            </div>
          </div>

          <div className="w-full md:w-64 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/20">
            <div className="flex justify-between text-xs mb-1.5 font-medium text-blue-100">
              <span>Account Quota ({usageStats?.plan || 'Free'})</span>
              <span className="font-bold text-white">{creditsPercentage}% Used</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div 
                className="h-2 rounded-full bg-emerald-400 transition-all duration-500" 
                style={{ width: `${Math.max(2, Math.min(100, Number(creditsPercentage)))}%` }} 
              />
            </div>
            <p className="text-[11px] text-blue-200 mt-1.5 flex justify-between">
              <span>Used: {storageUsedMb} MB</span>
              <span>Credits: {usageStats?.creditsUsed || 0.34} / {usageStats?.creditsLimit || 25}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Folder Selector */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="flex-1 min-w-[220px]">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search images by name or path..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Folder Selector */}
          <div className="flex items-center gap-1.5">
            <Folder className="w-4 h-4 text-gray-400" />
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="px-3 py-2 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs md:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">📁 All Folders ({mediaFiles.length} items)</option>
              {availableFolders.filter(f => f !== 'all').map((folder) => (
                <option key={folder} value={folder}>
                  📁 {folder}
                </option>
              ))}
            </select>
          </div>

          {/* Type selector */}
          <select
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value)}
            className="px-3 py-2 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs md:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All File Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>

          {/* View mode toggle */}
          <div className="flex border border-gray-200 rounded-xl overflow-hidden p-0.5 bg-gray-50 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Counter Pill */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing <strong className="text-gray-900">{filteredFiles.length}</strong> of{' '}
            <strong className="text-gray-900">{mediaFiles.length}</strong> files from Cloudinary
          </span>
          {selectedFolder !== 'all' && (
            <button
              onClick={() => setSelectedFolder('all')}
              className="text-blue-600 hover:underline font-medium"
            >
              Show all folders
            </button>
          )}
        </div>
      </div>

      {/* Media Grid / List */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-72 bg-white rounded-2xl border border-gray-100 p-8 shadow-xs">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium text-gray-600">Connecting to Cloudinary...</p>
          <p className="text-xs text-gray-400">Fetching all uploaded media assets</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 p-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Cloud className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No media files found</h3>
          <p className="text-xs md:text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Cloudinary-তে কোনো ফাইল পাওয়া যায়নি অথবা ফিল্টারের সাথে মিলছে না।
          </p>
          <button
            onClick={handleUpload}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload First Image
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 md:gap-4">
          {filteredFiles.map((file) => (
            <div 
              key={file.publicId || file.id} 
              className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden group hover:shadow-md hover:border-blue-200 transition-all flex flex-col"
            >
              {/* Media Preview Box */}
              <div 
                className="aspect-square bg-slate-50 relative flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => setPreviewImage(file)}
              >
                {file.type?.includes('image') ? (
                  <img 
                    src={file.url} 
                    alt={file.name} 
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    {getFileIcon(file.type)}
                    <span className="text-[10px] text-gray-400 uppercase font-bold">{file.format}</span>
                  </div>
                )}

                {/* Hover overlay with quick actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(file);
                    }}
                    className="p-2 bg-white text-gray-800 rounded-xl hover:bg-blue-50 transition shadow-sm"
                    title="View Full Resolution"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(file.url, file.publicId || file.id);
                    }}
                    className="p-2 bg-white text-gray-800 rounded-xl hover:bg-blue-50 transition shadow-sm"
                    title="Copy URL"
                  >
                    {copiedId === (file.publicId || file.id) ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 bg-white text-gray-800 rounded-xl hover:bg-blue-50 transition shadow-sm"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Folder Tag */}
                {file.folder && file.folder !== '(root)' && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-black/60 backdrop-blur-xs text-white max-w-[85%] truncate">
                    {file.folder.split('/').pop()}
                  </span>
                )}
              </div>

              {/* Card Meta Footer */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <p className="font-semibold text-xs text-gray-800 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-400">
                    <span>{file.size}</span>
                    {file.width && file.height && (
                      <>
                        <span>•</span>
                        <span>{file.width}×{file.height}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(file.url, file.publicId || file.id)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {copiedId === (file.publicId || file.id) ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <button 
                    onClick={() => handleDelete(file)} 
                    className="text-gray-400 hover:text-rose-600 p-1 rounded-md transition"
                    title="Delete from Cloudinary"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="px-5 py-3">Preview & Name</th>
                  <th className="px-4 py-3">Folder</th>
                  <th className="px-4 py-3">Size & Res</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredFiles.map((file) => (
                  <tr key={file.publicId || file.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 cursor-pointer flex items-center justify-center border border-gray-200"
                          onClick={() => setPreviewImage(file)}
                        >
                          {file.type?.includes('image') ? (
                            <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                          ) : (
                            getFileIcon(file.type)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate max-w-xs">{file.name}</p>
                          <p className="text-gray-400 text-[11px] truncate font-mono max-w-sm">{file.publicId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-[11px]">
                      <span className="px-2 py-0.5 bg-gray-100 rounded-md border border-gray-200">
                        {file.folder || '(root)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{file.size}</div>
                      {file.width && file.height && (
                        <div className="text-[10px] text-gray-400 font-mono">{file.width}×{file.height}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{file.date}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => copyToClipboard(file.url, file.publicId || file.id)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Copy Link"
                        >
                          {copiedId === (file.publicId || file.id) ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button 
                          onClick={() => setPreviewImage(file)} 
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="Open URL"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => handleDelete(file)} 
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full Resolution Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-[100] flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm truncate max-w-md">{previewImage.name}</h3>
                <p className="text-xs text-gray-500 font-mono">{previewImage.publicId}</p>
              </div>
              <button 
                onClick={() => setPreviewImage(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-900 flex items-center justify-center overflow-auto max-h-[60vh]">
              {previewImage.type?.includes('image') ? (
                <img 
                  src={previewImage.url} 
                  alt={previewImage.name} 
                  className="max-h-[55vh] max-w-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-white p-8 text-center">Video / File Preview</div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-gray-600">
                <span><strong>Size:</strong> {previewImage.size}</span>
                {previewImage.width && (
                  <span><strong>Dimensions:</strong> {previewImage.width}×{previewImage.height}</span>
                )}
                <span><strong>Format:</strong> {previewImage.format?.toUpperCase()}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(previewImage.url, 'modal')}
                  className="px-3.5 py-1.5 bg-white border border-gray-200 text-gray-800 rounded-xl hover:bg-gray-100 font-bold transition flex items-center gap-1.5"
                >
                  {copiedId === 'modal' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Size</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
