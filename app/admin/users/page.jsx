'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  Shield, 
  Ban, 
  CheckCircle2, 
  Trash2, 
  Mail, 
  Phone, 
  Loader2, 
  Eye, 
  X, 
  AlertCircle, 
  Download, 
  RefreshCw, 
  Sparkles, 
  Store, 
  ArrowUpRight, 
  Check, 
  Copy, 
  Calendar, 
  UserCheck, 
  UserX, 
  Sliders,
  ShoppingBag
} from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, user: null });
  const [profileDrawer, setProfileDrawer] = useState({ show: false, user: null });
  const [drawerRole, setDrawerRole] = useState('customer');
  const [drawerStatus, setDrawerStatus] = useState('active');
  const [updatingDrawer, setUpdatingDrawer] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch('/api/admin/users?limit=200');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users', error);
      showToast('Error loading users', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCopy = (text, id) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdate = async (id, updateData) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (res.ok) {
        const { user } = await res.json();
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...user } : u));
        if (profileDrawer.user?.id === id) {
          setProfileDrawer(prev => ({ ...prev, user: { ...prev.user, ...user } }));
        }
        showToast(`User status updated to ${updateData.status || updateData.role || 'updated'}`);
      } else {
        showToast('Failed to update user', 'error');
      }
    } catch (error) {
      console.error('Update error:', error);
      showToast('Error updating user', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const confirmDelete = (user) => {
    setDeleteModal({ show: true, user });
  };

  const handleDelete = async () => {
    const user = deleteModal.user;
    if (!user) return;
    setDeleteModal({ show: false, user: null });
    setProcessingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== user.id));
        if (profileDrawer.user?.id === user.id) {
          setProfileDrawer({ show: false, user: null });
        }
        showToast(`User ${user.name || user.email} deleted successfully`);
      } else {
        showToast('Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Error deleting user', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const viewProfile = (user) => {
    setProfileDrawer({ show: true, user });
    setDrawerRole(user.role || 'customer');
    setDrawerStatus(user.status || 'active');
  };

  const handleSaveDrawer = async () => {
    if (!profileDrawer.user) return;
    setUpdatingDrawer(true);
    await handleUpdate(profileDrawer.user.id, {
      role: drawerRole,
      status: drawerStatus
    });
    setUpdatingDrawer(false);
  };

  // Export Users to CSV
  const exportUsersCSV = () => {
    if (users.length === 0) {
      showToast('No user records to export', 'error');
      return;
    }
    const headers = ['User ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Joined Date'];
    const rows = users.map(u => [
      `"${u.id}"`,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.role || 'customer'}"`,
      `"${u.status || 'active'}"`,
      `"${u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stellarmart_users_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    let activeCount = 0;
    let suspendedCount = 0;
    let vendorCount = 0;
    let adminCount = 0;

    users.forEach(u => {
      const status = (u.status || 'active').toLowerCase();
      const role = (u.role || 'customer').toLowerCase();

      if (status === 'active') activeCount++;
      else if (status === 'suspended') suspendedCount++;

      if (role === 'vendor') vendorCount++;
      else if (role === 'admin') adminCount++;
    });

    return {
      total: users.length,
      active: activeCount,
      suspended: suspendedCount,
      vendors: vendorCount,
      admins: adminCount,
      customers: users.length - vendorCount - adminCount
    };
  }, [users]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch = !q || 
        user.name?.toLowerCase().includes(q) || 
        user.email?.toLowerCase().includes(q) ||
        user.phone?.toLowerCase().includes(q);

      const status = (user.status || 'active').toLowerCase();
      const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();

      const role = (user.role || 'customer').toLowerCase();
      const matchesRole = roleFilter === 'all' || role === roleFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[70] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium border animate-in slide-in-from-top duration-200 ${
          toast.type === 'error' 
            ? 'bg-rose-50 text-rose-800 border-rose-200' 
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Community & Identity Directory
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Users & Customers Directory</h1>
            <p className="text-blue-100 text-sm sm:text-base max-w-3xl font-light">
              Audit registered platform customers, vendor merchants, and staff accounts. Monitor user status, assign roles, enforce suspensions, and inspect transaction histories.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              className="p-3 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl backdrop-blur-md transition-all duration-150 flex items-center gap-2 text-xs font-bold"
              title="Sync latest user accounts"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
            <button
              onClick={exportUsersCSV}
              className="px-4 py-3 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl backdrop-blur-md transition-all duration-150 flex items-center gap-2 text-xs font-bold"
              title="Download CSV report"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <Link
              href="/admin/vendors"
              className="px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 rounded-xl font-bold text-xs shadow-md transition-all duration-150 flex items-center gap-1.5"
            >
              <Store className="w-4 h-4" />
              <span>Vendors Hub</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4-Card Executive KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Users */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Registered Users</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{metrics.total}</span>
            <span className="text-xs font-medium text-gray-400">accounts</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Across all store channels</p>
        </div>

        {/* Active Customers */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Customers</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{metrics.active}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/70 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Verified
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{metrics.customers} primary retail shoppers</p>
        </div>

        {/* Vendors / Merchants */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor Merchants</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{metrics.vendors}</span>
            <span className="text-xs font-medium text-gray-400">sellers</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Active multi-vendor accounts</p>
        </div>

        {/* Suspended Accounts */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suspended / Flagged</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">{metrics.suspended}</span>
            <span className="text-xs font-medium text-gray-400">restricted</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Blocked from placing orders</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Controls Bar */}
        <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills & Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Tabs */}
            <div className="inline-flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              {[
                { id: 'all', label: `All (${users.length})` },
                { id: 'active', label: `Active (${metrics.active})` },
                { id: 'suspended', label: `Suspended (${metrics.suspended})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Role Dropdown */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter users by account role"
              className="px-3 py-1.5 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="vendor">Vendors</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-gray-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Loading user directory...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-gray-800">No users match criteria</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                ? 'Try adjusting your search query or clearing active filters.'
                : 'No users registered in the database yet.'}
            </p>
            {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setRoleFilter('all'); }}
                className="mt-4 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Account Role</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Registration Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                  const isProcessing = processingId === user.id;
                  const isSuspended = user.status === 'suspended';
                  const role = (user.role || 'customer').toLowerCase();
                  const initials = user.name ? user.name.slice(0, 2).toUpperCase() : 'U';

                  return (
                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                      {/* User Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border ${
                            role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            role === 'vendor' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                            'bg-gradient-to-tr from-blue-100 to-sky-100 text-blue-700 border-blue-200'
                          }`}>
                            {initials}
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {user.name || 'Unnamed User'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1 font-mono text-[11px] text-gray-600">
                                <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                                {user.email || 'No email'}
                              </span>
                              {user.phone && (
                                <span className="flex items-center gap-1 text-[11px] text-gray-600">
                                  <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                                  {user.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Account Role */}
                      <td className="px-6 py-4">
                        {role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                            <Shield className="w-3.5 h-3.5" />
                            Admin Staff
                          </span>
                        ) : role === 'vendor' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Store className="w-3.5 h-3.5" />
                            Vendor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                            Shopper
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleUpdate(user.id, { status: isSuspended ? 'active' : 'suspended' })}
                          disabled={isProcessing}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all active:scale-95 shadow-xs ${
                            isSuspended 
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title="Click to toggle account status"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                          <span>{isSuspended ? 'Suspended' : 'Active'}</span>
                        </button>
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => viewProfile(user)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Inspect User Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isSuspended ? (
                            <button
                              onClick={() => handleUpdate(user.id, { status: 'active' })}
                              disabled={isProcessing}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Reinstate / Unban Account"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdate(user.id, { status: 'suspended' })}
                              disabled={isProcessing}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                              title="Suspend Account"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => confirmDelete(user)}
                            disabled={isProcessing}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Delete User"
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

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Trash2 className="w-7 h-7 stroke-[1.75]" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-1">Delete Account?</h3>
            <p className="text-gray-500 text-xs mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-gray-800">{deleteModal.user.name || deleteModal.user.email}</span>? This action soft-deletes the user record from active customer access.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setDeleteModal({ show: false, user: null })}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 active:scale-95 font-bold text-xs transition-all shadow-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Drawer Slideout */}
      {profileDrawer.show && profileDrawer.user && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-in fade-in duration-150" 
            onClick={() => setProfileDrawer({ show: false, user: null })} 
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 border-l border-gray-100 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">User Profile Dossier</h2>
                  <p className="text-[11px] text-gray-400">Account details & permission controls</p>
                </div>
              </div>
              <button 
                onClick={() => setProfileDrawer({ show: false, user: null })} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {/* User Avatar & Status */}
              <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-md uppercase">
                  {profileDrawer.user.name?.[0] || 'U'}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-gray-900 leading-tight">
                    {profileDrawer.user.name || 'Unnamed User'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${
                      profileDrawer.user.status === 'suspended' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${profileDrawer.user.status === 'suspended' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      {profileDrawer.user.status || 'active'}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      ID: {profileDrawer.user.id?.slice(0, 8)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Contact Channels</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2.5 text-xs text-gray-700">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-mono">{profileDrawer.user.email || 'N/A'}</span>
                    </div>
                    {profileDrawer.user.email && (
                      <button 
                        onClick={() => handleCopy(profileDrawer.user.email, 'email')}
                        className="text-gray-400 hover:text-blue-600 p-1"
                        title="Copy Email"
                      >
                        {copiedId === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2.5 text-xs text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{profileDrawer.user.phone || 'No phone registered'}</span>
                    </div>
                    {profileDrawer.user.phone && (
                      <button 
                        onClick={() => handleCopy(profileDrawer.user.phone, 'phone')}
                        className="text-gray-400 hover:text-blue-600 p-1"
                        title="Copy Phone"
                      >
                        {copiedId === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Role & Status Management */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Permission & Role Controls</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                      Account Role
                    </label>
                    <select
                      value={drawerRole}
                      onChange={(e) => setDrawerRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="customer">Shopper (Retail Customer)</option>
                      <option value="vendor">Vendor (Merchant Seller)</option>
                      <option value="admin">Administrator (Store Staff)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                      Account Status
                    </label>
                    <select
                      value={drawerStatus}
                      onChange={(e) => setDrawerStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="active">Active (Can Place Orders)</option>
                      <option value="suspended">Suspended (Blocked from Checkout)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSaveDrawer}
                    disabled={updatingDrawer}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {updatingDrawer ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Apply Role & Status Changes</span>
                  </button>
                </div>
              </div>

              {/* Quick Order History Link */}
              <div className="pt-4 border-t border-gray-100">
                <Link
                  href={`/admin/orders?search=${encodeURIComponent(profileDrawer.user.email || profileDrawer.user.name || '')}`}
                  className="w-full py-3 px-4 rounded-xl bg-blue-50 hover:bg-blue-100/70 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-between transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>View Customer Orders in Orders Hub</span>
                  </span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center gap-3">
              <button 
                onClick={() => setProfileDrawer({ show: false, user: null })}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors shadow-xs"
              >
                Dismiss
              </button>
              <button 
                onClick={() => confirmDelete(profileDrawer.user)}
                className="px-4 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl hover:bg-rose-100 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}