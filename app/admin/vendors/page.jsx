'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Store, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Copy, 
  Check, 
  Loader2, 
  X, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  RefreshCw, 
  ExternalLink, 
  Package, 
  ShoppingBag, 
  Key, 
  User, 
  Building, 
  BadgeCheck,
  Power
} from 'lucide-react';

export default function VendorsManagement() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'suspended' | 'verified'
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState(null);

  // Modals state
  const [selectedVendor, setSelectedVendor] = useState(null); // for View Details modal
  const [editModal, setEditModal] = useState({ isOpen: false, vendor: null, isSaving: false });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, vendor: null, isDeleting: false });
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    shop_name: '',
    owner_name: '',
    email: '',
    phone: '',
    shop_address: '',
    description: '',
    status: 'active',
    verification_badge: false,
    new_password: ''
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchVendors = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/admin/vendors?limit=100', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors || []);
      } else {
        showToast('Failed to fetch vendors', 'error');
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      showToast('Error loading vendors list', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Copy helper
  const handleCopy = (text, id) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Vendor ID copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered vendors list
  const filteredVendors = useMemo(() => {
    return vendors.filter(vendor => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = 
        !term ||
        (vendor.shop_name || '').toLowerCase().includes(term) ||
        (vendor.owner_name || '').toLowerCase().includes(term) ||
        (vendor.email || '').toLowerCase().includes(term) ||
        (vendor.phone && String(vendor.phone).includes(term)) ||
        (vendor.id || '').toLowerCase().includes(term);

      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && vendor.status === 'active') ||
        (statusFilter === 'suspended' && vendor.status === 'suspended') ||
        (statusFilter === 'verified' && (vendor.verification_badge || vendor.is_verified));

      return matchesSearch && matchesStatus;
    });
  }, [vendors, searchTerm, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = vendors.length;
    const active = vendors.filter(v => v.status === 'active').length;
    const suspended = vendors.filter(v => v.status === 'suspended' || v.status === 'pending').length;
    const verified = vendors.filter(v => v.verification_badge || v.is_verified).length;
    return { total, active, suspended, verified };
  }, [vendors]);

  // Instant 1-Click Status Toggle
  const handleToggleStatus = async (vendor) => {
    const newStatus = vendor.status === 'active' ? 'suspended' : 'active';
    setStatusUpdatingId(vendor.id);

    // Optimistic UI update
    setVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, status: newStatus } : v));
    showToast(`Vendor "${vendor.shop_name}" status set to ${newStatus}`);

    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        // Rollback
        setVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, status: vendor.status } : v));
        showToast('Failed to update vendor status', 'error');
      }
    } catch (err) {
      setVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, status: vendor.status } : v));
      showToast('Error updating status', 'error');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Open Edit Modal
  const openEditModal = (vendor) => {
    setEditModal({
      isOpen: true,
      vendor,
      isSaving: false
    });
    setEditForm({
      shop_name: vendor.shop_name || '',
      owner_name: vendor.owner_name || '',
      email: vendor.email || '',
      phone: vendor.phone ? String(vendor.phone) : '',
      shop_address: vendor.shop_address || '',
      description: vendor.description || '',
      status: vendor.status || 'active',
      verification_badge: Boolean(vendor.verification_badge || vendor.is_verified),
      new_password: ''
    });
  };

  // Submit Edit Form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const vendor = editModal.vendor;
    if (!vendor) return;

    setEditModal(prev => ({ ...prev, isSaving: true }));

    const payload = {
      shop_name: editForm.shop_name,
      owner_name: editForm.owner_name,
      email: editForm.email,
      phone: editForm.phone,
      shop_address: editForm.shop_address,
      description: editForm.description,
      status: editForm.status,
      verification_badge: editForm.verification_badge,
      is_verified: editForm.verification_badge
    };

    if (editForm.new_password && editForm.new_password.trim().length >= 4) {
      payload.password = editForm.new_password.trim();
    }

    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.vendor) {
        setVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, ...data.vendor } : v));
        setEditModal({ isOpen: false, vendor: null, isSaving: false });
        showToast('Vendor profile updated successfully!');
      } else {
        showToast(data.error || 'Failed to update vendor', 'error');
        setEditModal(prev => ({ ...prev, isSaving: false }));
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating vendor profile', 'error');
      setEditModal(prev => ({ ...prev, isSaving: false }));
    }
  };

  // Execute Deletion
  const handleDeleteConfirm = async () => {
    const vendor = deleteModal.vendor;
    if (!vendor) return;

    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    // Store backup in case rollback is required
    const previousVendors = [...vendors];

    // Optimistically remove from list immediately
    setVendors(prev => prev.filter(v => v.id !== vendor.id));
    setDeleteModal({ isOpen: false, vendor: null, isDeleting: false });
    showToast(`Vendor "${vendor.shop_name}" deleted successfully.`);

    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        // Rollback
        setVendors(previousVendors);
        showToast(data.error || 'Failed to delete vendor on server', 'error');
      }
    } catch (err) {
      console.error(err);
      setVendors(previousVendors);
      showToast('Error deleting vendor', 'error');
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Store className="w-7 h-7 text-blue-600" />
            <span>Vendors Management</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage multivendor merchant accounts, view full vendor IDs, update profiles, or suspend/delete access.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchVendors(true)}
            disabled={refreshing}
            className="px-3.5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
            title="Refresh vendors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link 
            href="/admin/vendors/add" 
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> 
            <span>Add New Vendor</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Vendors</p>
            <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Stores</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{stats.active}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Suspended / Inactive</p>
            <h3 className="text-2xl font-black text-amber-600 mt-0.5">{stats.suspended}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <BadgeCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Verified Partners</p>
            <h3 className="text-2xl font-black text-sky-600 mt-0.5">{stats.verified}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by shop, owner, email, phone, or ID..." 
            className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({stats.total})
          </button>

          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Active ({stats.active})
          </button>

          <button
            onClick={() => setStatusFilter('suspended')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'suspended'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Suspended ({stats.suspended})
          </button>

          <button
            onClick={() => setStatusFilter('verified')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'verified'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
            }`}
          >
            Verified ({stats.verified})
          </button>
        </div>
      </div>

      {/* Vendors Table Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-gray-500">Loading vendors directory...</p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-800">No Vendors Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              {searchTerm 
                ? `No vendor accounts matched "${searchTerm}". Try a different search keyword.`
                : 'No vendor stores registered yet. Click "+ Add New Vendor" to create one.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80 text-gray-500 text-[11px] uppercase font-bold tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-5">Shop Details & Vendor ID</th>
                  <th className="py-3.5 px-5">Owner Contact</th>
                  <th className="py-3.5 px-5 text-center">Status & Verification</th>
                  <th className="py-3.5 px-5 text-center">Joined Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVendors.map(vendor => {
                  const isVerified = Boolean(vendor.verification_badge || vendor.is_verified);
                  const isActive = vendor.status === 'active';

                  return (
                    <tr key={vendor.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* Shop Details & Copyable ID */}
                      <td className="p-5">
                        <div className="flex items-start gap-3.5">
                          {/* Store Avatar / Logo */}
                          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-700 flex items-center justify-center font-black text-sm shrink-0 overflow-hidden shadow-xs">
                            {vendor.logo_url ? (
                              <img src={vendor.logo_url} alt={vendor.shop_name} className="w-full h-full object-cover" />
                            ) : (
                              (vendor.shop_name || 'V').charAt(0).toUpperCase()
                            )}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-sm text-gray-900 truncate">
                                {vendor.shop_name}
                              </span>

                              {isVerified && (
                                <span title="Verified Merchant">
                                  <BadgeCheck className="w-4 h-4 text-sky-500 shrink-0" />
                                </span>
                              )}
                            </div>

                            {/* Full Copyable Vendor ID */}
                            <div className="inline-flex items-center gap-1.5 bg-gray-100/80 hover:bg-gray-200/80 px-2 py-0.5 rounded-md font-mono text-[11px] text-gray-600 transition-colors">
                              <span className="font-semibold text-gray-400">ID:</span>
                              <span className="truncate max-w-[120px] sm:max-w-[160px]">{vendor.id}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(vendor.id, vendor.id)}
                                className="text-gray-400 hover:text-blue-600 transition-colors ml-0.5"
                                title="Copy Full Vendor ID"
                              >
                                {copiedId === vendor.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>

                            {vendor.shop_address && (
                              <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate max-w-xs">
                                <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                <span className="truncate">{vendor.shop_address}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Owner Contact Info */}
                      <td className="p-5">
                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-gray-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span>{vendor.owner_name}</span>
                          </p>

                          {vendor.email && (
                            <div className="flex items-center gap-1 text-gray-600 font-mono text-[11px]">
                              <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                              <a href={`mailto:${vendor.email}`} className="hover:text-blue-600 truncate max-w-[170px]">
                                {vendor.email}
                              </a>
                            </div>
                          )}

                          {vendor.phone && (
                            <div className="flex items-center gap-1 text-gray-600 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                              <a href={`tel:${vendor.phone}`} className="hover:text-blue-600">
                                {vendor.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status & 1-Click Toggle */}
                      <td className="p-5 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(vendor)}
                            disabled={statusUpdatingId === vendor.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200'
                            }`}
                            title="Click to toggle status"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                            <span>{statusUpdatingId === vendor.id ? 'Updating...' : (isActive ? 'Active' : 'Suspended')}</span>
                          </button>

                          {isVerified ? (
                            <span className="text-[10px] font-semibold text-sky-600 flex items-center gap-0.5">
                              <BadgeCheck className="w-3 h-3" /> Verified Partner
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-gray-400">Standard Partner</span>
                          )}
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="p-5 text-center text-xs text-gray-500">
                        <div className="inline-flex items-center gap-1 font-mono text-[11px]">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>
                            {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View Full Profile */}
                          <button
                            type="button"
                            onClick={() => setSelectedVendor(vendor)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="View Vendor Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Profile */}
                          <button
                            type="button"
                            onClick={() => openEditModal(vendor)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Edit Vendor Profile"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Account */}
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ isOpen: true, vendor, isDeleting: false })}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Delete Vendor Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* ================= MODAL: VIEW VENDOR DETAILS ============ */}
      {/* ========================================================= */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-lg">
                  {selectedVendor.logo_url ? (
                    <img src={selectedVendor.logo_url} alt={selectedVendor.shop_name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    (selectedVendor.shop_name || 'V').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg text-gray-900">{selectedVendor.shop_name}</h3>
                    {(selectedVendor.verification_badge || selectedVendor.is_verified) && (
                      <BadgeCheck className="w-5 h-5 text-sky-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Merchant Account</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVendor(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vendor Full ID Pill */}
            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Full Vendor UUID / ID</span>
                <span className="font-mono text-xs text-gray-900 font-bold break-all">{selectedVendor.id}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(selectedVendor.id, selectedVendor.id)}
                className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                {copiedId === selectedVendor.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 p-3.5 rounded-2xl">
                <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Owner Name</span>
                <span className="font-bold text-gray-900 text-sm mt-0.5 block">{selectedVendor.owner_name}</span>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-2xl">
                <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Status</span>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${
                  selectedVendor.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedVendor.status || 'active'}
                </span>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-2xl">
                <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Email Address</span>
                <span className="font-mono text-gray-900 mt-0.5 block">{selectedVendor.email || 'N/A'}</span>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-2xl">
                <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Phone Number</span>
                <span className="font-mono text-gray-900 mt-0.5 block">{selectedVendor.phone || 'N/A'}</span>
              </div>

              {selectedVendor.shop_address && (
                <div className="bg-gray-50 p-3.5 rounded-2xl sm:col-span-2">
                  <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Store Address</span>
                  <span className="text-gray-800 mt-0.5 block">{selectedVendor.shop_address}</span>
                </div>
              )}

              {selectedVendor.description && (
                <div className="bg-gray-50 p-3.5 rounded-2xl sm:col-span-2">
                  <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Store Description</span>
                  <p className="text-gray-700 mt-0.5 leading-relaxed">{selectedVendor.description}</p>
                </div>
              )}

              <div className="bg-gray-50 p-3.5 rounded-2xl sm:col-span-2 flex items-center justify-between text-gray-500">
                <span>Registration Date:</span>
                <span className="font-mono font-bold text-gray-700">
                  {selectedVendor.created_at ? new Date(selectedVendor.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="border-t border-gray-100 pt-4 flex flex-wrap items-center justify-end gap-2.5">
              <Link
                href={`/admin/vendor-products`}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Vendor Products</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  const v = selectedVendor;
                  setSelectedVendor(null);
                  openEditModal(v);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ================= MODAL: EDIT VENDOR PROFILE ============ */}
      {/* ========================================================= */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Edit Vendor Profile</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {editModal.vendor?.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditModal({ isOpen: false, vendor: null, isSaving: false })}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Shop Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.shop_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, shop_name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Owner Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.owner_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, owner_name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Store Address
                </label>
                <input
                  type="text"
                  value={editForm.shop_address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, shop_address: e.target.value }))}
                  placeholder="e.g. Shop #42, Block B, Dhaka"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Account Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={editForm.verification_badge}
                      onChange={(e) => setEditForm(prev => ({ ...prev, verification_badge: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Verified Partner Badge ⭐</span>
                  </label>
                </div>
              </div>

              {/* Password Reset (Optional) */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Reset Password <span className="text-gray-400 font-normal lowercase">(leave empty if unchanged)</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={editForm.new_password}
                    onChange={(e) => setEditForm(prev => ({ ...prev, new_password: e.target.value }))}
                    placeholder="Enter new password (min 4 chars)"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-100 pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, vendor: null, isSaving: false })}
                  disabled={editModal.isSaving}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editModal.isSaving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {editModal.isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ================= MODAL: CONFIRM DELETE VENDOR ========== */}
      {/* ========================================================= */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-gray-900">Delete Vendor Account?</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Are you sure you want to permanently delete vendor &ldquo;<strong className="text-gray-800">{deleteModal.vendor?.shop_name}</strong>&rdquo;?
              </p>
              <div className="mt-2 bg-gray-50 p-2 rounded-xl border border-gray-200/80 font-mono text-[11px] text-gray-600 break-all">
                ID: {deleteModal.vendor?.id}
              </div>
              <p className="text-[11px] text-rose-600 mt-2 font-medium">
                This will delete the vendor profile, linked store access, and products.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, vendor: null, isDeleting: false })}
                disabled={deleteModal.isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteModal.isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition disabled:opacity-50"
              >
                {deleteModal.isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}