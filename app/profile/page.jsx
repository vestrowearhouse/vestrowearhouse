"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { X, Upload, Loader2, MapPin, LogOut, Package, User, Settings, AlertTriangle, CheckCircle, Bell, Star, Lock, KeyRound, Eye, EyeOff, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

export default function UserProfile() {
  const [edit, setEdit] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const { user, logout, loading, isCheckingAuth, checkAuth } = useAuth();
  const { cart, removeFromCart, updateQuantity } = useCart();
  const router = useRouter();
  
  const [profileUser, setProfileUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  
  // New states for added features
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ street: "", city: "", phone: "" });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  // Account Deletion States
  const [deleteStep, setDeleteStep] = useState(0); // 0: Default, 1: OTP Sent
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Change Password States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  
  // Logout Modal States
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutStatus, setLogoutStatus] = useState(null); // 'success', 'error', or null

  // Form state for profile edit
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: ""
  });
  
  // State for dynamic support settings
  const [supportSettings, setSupportSettings] = useState({ 
    email: "support@vestrowearhouse.com", 
    whatsapp: "+880 1345-447500" 
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !isCheckingAuth && !user) {
      router.push("/login");
      return;
    }
    
    if (user) {
      // Fetch user profile and orders from API
      fetchProfileData();
      fetchNotifications();
    }
  }, [user, loading, isCheckingAuth, router]);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const res = await fetch('/api/user/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationAsRead = async (notificationId, currentStatus) => {
    if (currentStatus) return; // already read
    
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    
    try {
      await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notificationId })
      });
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const parseAddressString = (addr) => {
    if (!addr) return "";
    if (typeof addr === "string") return addr;
    if (typeof addr === "object") {
      if (addr.street && addr.city) return `${addr.street}, ${addr.city}`;
      return addr.street || addr.city || addr.full || "";
    }
    return String(addr);
  };

  const fetchProfileData = async () => {
    try {
      setLoadingProfile(true);
      const res = await fetch(`/api/user/profile?t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch profile');
      }
      
      const data = await res.json();
      setProfileUser(data.user);
      setOrders(data.orders || []);
      
      // Update form data with properly formatted address and phone
      const addrString = parseAddressString(data.user?.address);
      setFormData({
        name: data.user?.name || "",
        phone: data.user?.phone || "",
        address: addrString
      });
    } catch (error) {
      console.error('[Profile] Error fetching profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Keep form data in sync with user if fields are initially empty
  useEffect(() => {
    if (user && !edit) {
      const addrString = parseAddressString(user.address);
      setFormData(prev => ({
        name: prev.name || user.name || "",
        phone: prev.phone || user.phone || "",
        address: prev.address || addrString || ""
      }));
    }
  }, [user, edit]);

  // Fetch support settings from database (cached)
  useEffect(() => {
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem('vestro_settings_cache') || sessionStorage.getItem('stellar_settings_cache') : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setSupportSettings({
          email: parsed.contactEmail || parsed.email || "support@vestrowearhouse.com",
          whatsapp: parsed.whatsappNumber || parsed.whatsapp_url || parsed.contactPhone || parsed.phone || "+880 1345-447500"
        });
        return;
      } catch(e) {}
    }

    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data?.settings) {
          try { sessionStorage.setItem('vestro_settings_cache', JSON.stringify(data.settings)); } catch(e) {}
          setSupportSettings({
            email: data.settings.contactEmail || data.settings.email || "support@vestrowearhouse.com",
            whatsapp: data.settings.whatsappNumber || data.settings.whatsapp_url || data.settings.contactPhone || data.settings.phone || "+880 1345-447500"
          });
        }
      })
      .catch(err => console.error("Failed to load settings", err));
  }, []);

  // 🔥 Expanded menu like real eCommerce
  const tabs = [
    { key: "profile", label: "My Profile" },
    { key: "orders", label: "My Orders" },
    { key: "addresses", label: "Addresses" },
    { key: "notifications", label: "Notifications" },
    { key: "support", label: "Support" },
    { key: "settings", label: "Settings" },
    { key: "cart", label: "View Cart" },
  ];

  // 🔥 ENHANCED LOGOUT SYSTEM
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setLogoutStatus(null);
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    setLogoutStatus(null);

    try {
      // 1. Call AuthContext logout (clears state + calls API)
      const result = await logout();
      
      if (!result.success) {
        console.warn('[Profile] Logout returned error, continuing anyway:', result.error);
      }
      
      // 2. Set success status
      setLogoutStatus('success');

      // 3. Brief delay to show success message
      await new Promise(resolve => setTimeout(resolve, 300));

      // 4. Redirect immediately
      window.location.href = '/';
      
    } catch (error) {
      console.error('[Profile] Logout error:', error);
      setLogoutStatus('error');
      setIsLoggingOut(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
    setLogoutStatus(null);
    setIsLoggingOut(false);
  };

  // 1. Profile Picture Upload Handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Instant UI Preview
    setAvatarPreview(URL.createObjectURL(file));
    setIsUploading(true);
    
    const formPayload = new FormData();
    formPayload.append("avatar", file);

    try {
      // আপনার Supabase Storage API কল এখানে হবে
      const res = await fetch("/api/user/avatar", { method: "POST", body: formPayload });
      const data = await res.json();
      if(data.success) {
        alert("Profile picture updated!");
        if(checkAuth) checkAuth();
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // 2. Save Profile Data
  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update profile");
      }
      setEdit(false);
      alert("Profile updated successfully!");
      await fetchProfileData();
      if (checkAuth) await checkAuth();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // 3. Save New Address
  const handleSaveAddress = async () => {
    try {
      const res = await fetch("/api/user/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newAddress)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save address");
      }
      setIsAddingAddress(false);
      alert("New address added successfully!");
      const formatted = newAddress.street + (newAddress.city ? ", " + newAddress.city : "");
      setFormData(prev => ({ 
        ...prev, 
        address: formatted,
        phone: newAddress.phone || prev.phone
      }));
      setNewAddress({ street: "", city: "", phone: "" });
      await fetchProfileData();
      if (checkAuth) await checkAuth();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save address");
    }
  };

  // 4. Request Account Deletion OTP
  const handleRequestDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/auth/request-delete-otp", { 
        method: "POST",
        credentials: "include" 
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteStep(1);
        alert(data.message || "A 6-digit confirmation code has been sent to your email!");
      } else {
        alert(data.error || "Failed to send verification code. Please try again.");
      }
    } catch (err) {
      console.error("Delete OTP request failed:", err);
      alert("Network error. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // 5. Confirm Account Deletion
  const handleConfirmDelete = async () => {
    if (!deleteOtp || !deleteOtp.trim()) {
      alert("Please enter the 6-digit verification code");
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/auth/confirm-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ otp: deleteOtp.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Account deleted permanently!");
        window.location.href = '/';
      } else {
        alert(data.error || "Invalid verification code!");
      }
    } catch (err) {
      console.error("Confirm delete failed:", err);
      alert("Network error. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // 6. Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'All fields are required.' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordMessage({ type: 'error', text: 'New password must be different from current password.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(passwordForm)
      });
      const data = await res.json();

      if (res.ok) {
        setPasswordMessage({ type: 'success', text: data.message || 'Password changed successfully!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordMessage({ type: '', text: '' });
        }, 2200);
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password.' });
      }
    } catch (err) {
      console.error('Change password error:', err);
      setPasswordMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setPasswordLoading(false);
    }
  };
  
  useEffect(() => {
    if (activeTab === "orders" && orders.length === 0) {
      setLoadingOrders(true);
      fetch("/api/orders")
        .then((res) => res.json())
        .then((data) => {
          if (data.orders) setOrders(data.orders);
        })
        .catch((err) => console.error("Failed to load orders", err))
        .finally(() => setLoadingOrders(false));
    }
  }, [activeTab]);

  if (loading || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Sidebar */}
        <div className="bg-white rounded-2xl shadow-md border-0 p-6 h-fit">
          <div className="flex flex-col items-center text-center">
            
            {/* Profile Picture with Upload System */}
            <div className="relative w-24 h-24 mb-3 group cursor-pointer">
              <div className="w-full h-full rounded-full ring-2 ring-indigo-500 overflow-hidden bg-gray-100 flex items-center justify-center text-3xl font-bold text-indigo-500">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                ) : avatarPreview || user?.photoURL || user?.avatar ? (
                  <img src={avatarPreview || user?.photoURL || user?.avatar} alt={user?.name || "User"} className="w-full h-full object-cover" />
                ) : (
                  (user?.name || "U").charAt(0).toUpperCase()
                )}
              </div>
              
              {/* Upload Overlay */}
              <label htmlFor="avatarUpload" className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">Change</span>
              </label>
              <input type="file" id="avatarUpload" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>

            <h2 className="text-lg font-semibold">{user?.name || "User"}</h2>
            <p className="text-xs text-gray-500">{user?.email}</p>

            {/* Profile Progress */}
            {(() => {
              let score = 0;
              if (formData.name || user?.name) score += 25;
              if (user?.email) score += 25;
              if (formData.phone || user?.phone) score += 25;
              if (formData.address || user?.address) score += 25;
              return (
                <div className="w-full mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Profile Complete</span>
                    <span className="text-indigo-600 font-medium">{score}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500" 
                      style={{ width: `${score}%` }} 
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Menu */}
          <div className="mt-6 space-y-2">
            {tabs.map((tab) => {
              const unreadCount = tab.key === 'notifications' ? notifications.filter(n => !n.is_read).length : 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all duration-200 flex items-center justify-between ${
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.key === 'notifications' && unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}

            <button 
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
              className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >

              {/* Profile */}
              {activeTab === "profile" && (
                <div className="bg-white rounded-2xl shadow-md border-0 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Profile Information</h3>
                    {edit ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEdit(false)} 
                          disabled={savingProfile}
                          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSaveProfile} 
                          disabled={savingProfile}
                          className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {savingProfile ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setEdit(true)} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors shadow-sm">
                        Edit Profile
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ProfileField 
                      label="Full Name" 
                      value={formData.name} 
                      edit={edit} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      placeholder="e.g. John Doe"
                    />
                    <ProfileField 
                      label="Email" 
                      value={user?.email || ""} 
                      edit={edit} 
                      disabled={true} 
                    />
                    <ProfileField 
                      label="Phone" 
                      value={formData.phone} 
                      edit={edit} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                      placeholder="e.g. 01847853867"
                    />
                    <ProfileField 
                      label="Address" 
                      value={formData.address} 
                      edit={edit} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})} 
                      placeholder="e.g. House 12, Road 5, Mirpur, Dhaka"
                    />
                  </div>
                </div>
              )}

              {/* Orders */}
              {activeTab === "orders" && (
                <div className="bg-white rounded-2xl shadow-md border-0 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Order Statistics</h3>

                  {loadingOrders ? (
                     <div className="animate-pulse flex gap-4 mb-6"><div className="h-24 bg-gray-200 rounded-xl flex-1"></div><div className="h-24 bg-gray-200 rounded-xl flex-1"></div><div className="h-24 bg-gray-200 rounded-xl flex-1"></div></div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <StatCard title="Total" value={orders.length} color="blue" />
                      <StatCard title="Success" value={orders.filter(o => ['confirmed', 'processing', 'shipped', 'delivered'].includes((o.status || o.orderStatus || '').toLowerCase())).length} color="green" />
                      <StatCard title="Failed" value={orders.filter(o => (o.status || o.orderStatus || '').toLowerCase() === 'cancelled').length} color="red" />
                    </div>
                  )}

                  <div className="mt-8 border-t border-gray-100 pt-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Recent Orders</h4>
                    {orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.map(order => (
                          <div 
                            key={order._id || order.id} 
                            onClick={() => setSelectedOrder(order)}
                            className="border border-gray-100 rounded-xl p-4 flex justify-between items-center bg-gray-50/50 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <div>
                              <p className="font-semibold text-gray-800">Order #{order.orderNumber || (order._id ? order._id.substring(0, 8).toUpperCase() : "N/A")}</p>
                              <p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <p className="font-bold text-indigo-600">৳ {order.total?.toLocaleString()}</p>
                              <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider inline-block mt-1 ${
                                ['confirmed', 'processing', 'shipped', 'delivered'].includes((order.status || order.orderStatus || '').toLowerCase()) ? 'bg-green-100 text-green-700' :
                                (order.status || order.orderStatus || '').toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {['confirmed', 'processing', 'shipped', 'delivered'].includes((order.status || order.orderStatus || '').toLowerCase()) ? 'Success' :
                                 (order.status || order.orderStatus || '').toLowerCase() === 'cancelled' ? 'Failed' : (order.status || order.orderStatus || 'Pending')}
                              </span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/orders/${order.orderNumber || order.id || order._id}`);
                                }}
                                className="mt-3 text-xs font-semibold px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                              >
                                View full Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-xl">No orders found.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Addresses */}
              {activeTab === "addresses" && (
                <div className="bg-white rounded-2xl shadow-md border-0 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Saved Addresses</h3>
                  {formData.address || parseAddressString(user?.address) ? (
                    <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 mb-4">
                      <p className="font-medium text-gray-800">Home Address</p>
                      <p className="text-sm text-gray-600 mt-1">{formData.address || parseAddressString(user?.address)}</p>
                      {(formData.phone || user?.phone) && (
                        <p className="text-xs text-gray-500 mt-1">Phone: {formData.phone || user?.phone}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">No addresses saved yet.</p>
                  )}
                  
                  {!isAddingAddress ? (
                    <button onClick={() => setIsAddingAddress(true)} className="px-5 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md hover:bg-indigo-100 transition-colors">
                      + Add New Address
                    </button>
                  ) : (
                    <div className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
                      <h4 className="font-semibold text-sm mb-3">Add New Address</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-500">Street Address</label>
                          <input type="text" value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-md text-sm" placeholder="House 12, Road 5..." />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">City</label>
                            <input type="text" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-md text-sm" placeholder="Dhaka" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Phone</label>
                            <input type="text" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-md text-sm" placeholder="017..." />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={handleSaveAddress} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
                            Save to Database
                          </button>
                          <button onClick={() => setIsAddingAddress(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Notifications */}
              {activeTab === "notifications" && (
                <div className="bg-white rounded-2xl shadow-md border-0 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                    <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                      {notifications.filter(n => !n.is_read).length} Unread
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {loadingNotifications ? (
                      <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 bg-gray-50 rounded-xl text-sm text-gray-500 text-center border border-gray-100">
                        <div className="text-4xl mb-3 opacity-50">📭</div>
                        No notifications to show.
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className={`p-4 rounded-xl border ${notification.is_read ? 'bg-white border-gray-100' : 'bg-indigo-50/30 border-indigo-100'} transition-colors cursor-pointer relative overflow-hidden`}
                          onClick={() => markNotificationAsRead(notification.id, notification.is_read)}
                        >
                          {!notification.is_read && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                          )}
                          <div className="flex gap-4">
                            <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                              notification.type === 'alert' ? 'bg-red-100 text-red-600' :
                              notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                              notification.type === 'event' ? 'bg-purple-100 text-purple-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {notification.type === 'alert' ? <AlertTriangle className="w-5 h-5" /> :
                               notification.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                               notification.type === 'event' ? <Star className="w-5 h-5" /> :
                               <Bell className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className={`font-semibold ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                                  {notification.title}
                                </h4>
                                <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                                  {new Date(notification.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className={`text-sm ${notification.is_read ? 'text-gray-500' : 'text-gray-700'}`}>
                                {notification.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Support */}
              {activeTab === "support" && (
                <div className="bg-white rounded-2xl shadow-md border-0 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Support</h3>
                  <p className="text-sm text-gray-500 mb-6">Need help with your orders or account? Our support team is available 24/7.</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a 
                  href={`https://wa.me/${String(supportSettings.whatsapp).replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#25D366] rounded-xl hover:bg-[#1ebd5b] transition-colors shadow-sm w-full sm:w-auto"
                    >
                      <span className="text-xl">💬</span> WhatsApp Support
                    </a>
                    <a 
                      href={`mailto:${supportSettings.email}`} 
                      className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors w-full sm:w-auto"
                    >
                      <span className="text-xl">✉️</span> Email Support
                    </a>
                  </div>
                </div>
              )}

              {/* Settings */}
              {activeTab === "settings" && (
                <div className="bg-white rounded-2xl shadow-md border-0 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Account Password</h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Update your password to keep your account safe and secure.</p>
                    </div>
                    {!showPasswordModal && (
                      <button 
                        type="button"
                        onClick={() => { setShowPasswordModal(true); setPasswordMessage({ type: '', text: '' }); }}
                        className="px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 w-fit"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Change Password</span>
                      </button>
                    )}
                  </div>

                  {/* Inline Change Password Card / Form */}
                  {showPasswordModal && (
                    <form onSubmit={handleChangePassword} className="p-5 sm:p-6 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                          <Lock className="w-4 h-4 text-indigo-600" />
                          <span>Change Your Password</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setShowPasswordModal(false); setPasswordMessage({ type: '', text: '' }); }}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {passwordMessage.text && (
                        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                          passwordMessage.type === 'success' 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {passwordMessage.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          )}
                          <span>{passwordMessage.text}</span>
                        </div>
                      )}

                      {/* Current Password */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Current Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            placeholder="Enter your current password"
                            className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          New Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="At least 6 characters"
                            className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Must be at least 6 characters long</p>
                      </div>

                      {/* Confirm New Password */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Confirm New Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Re-enter your new password"
                            className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="submit"
                          disabled={passwordLoading}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-60 flex-1 sm:flex-initial"
                        >
                          {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                          <span>Update Password</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowPasswordModal(false); setPasswordMessage({ type: '', text: '' }); }}
                          className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                  
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h4 className="text-red-600 font-bold mb-2">Danger Zone</h4>
                    <p className="text-xs text-gray-500 mb-4">Deleting your account will permanently erase your data from Supabase database. This action cannot be undone.</p>
                    
                    {deleteStep === 0 ? (
                      <button onClick={handleRequestDelete} disabled={deleteLoading} className="px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2">
                        {deleteLoading && <Loader2 className="w-4 h-4 animate-spin"/>} Delete Account Permanently
                      </button>
                    ) : (
                      <div className="p-5 border border-red-200 bg-red-50/80 rounded-2xl max-w-sm w-full">
                        <p className="text-sm font-bold text-red-900 mb-1">Confirmation Required</p>
                        <p className="text-xs text-red-700 mb-3 leading-relaxed">
                          We've sent a 6-digit verification code to your email <strong>({user?.email})</strong>. Enter it below to confirm.
                        </p>
                        <input 
                          type="text" 
                          value={deleteOtp} 
                          onChange={(e) => setDeleteOtp(e.target.value)} 
                          placeholder="Enter 6-digit Code" 
                          maxLength={6}
                          className="w-full px-3 py-2.5 border-2 border-red-300 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 font-mono tracking-widest text-center font-bold bg-white"
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={handleConfirmDelete} 
                            disabled={deleteLoading || !deleteOtp.trim()} 
                            className="px-4 py-2.5 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 font-bold flex-1 text-center transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                          >
                            {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>Confirm & Delete</span>
                          </button>
                          <button 
                            onClick={() => setDeleteStep(0)} 
                            className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 text-sm rounded-xl hover:bg-gray-50 font-medium transition"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="mt-3 text-center">
                          <button 
                            type="button" 
                            onClick={handleRequestDelete} 
                            disabled={deleteLoading}
                            className="text-xs text-red-700 hover:text-red-900 font-semibold underline transition"
                          >
                            {deleteLoading ? 'Sending...' : "Didn't receive code? Resend Code"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
          
              {/* Cart */}
              {activeTab === "cart" && (
                <div className="bg-white rounded-2xl shadow-md border-0 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">My Cart Items</h3>
                    <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                      {cart?.items?.length || 0} Items
                    </span>
                  </div>

                  {cart?.items?.length > 0 ? (
                    <div className="space-y-4">
                      {cart.items.map((item) => {
                        const product = item.product;
                        if (!product) return null;
                        const productId = product._id || product.id || item.productId || item.id;
                        const variantSku = item.variantSku || item.variantData?.variantSku || null;
                        const itemKey = `${productId}-${variantSku || index}`;
                        const price = item.variantPrice || product.sellingPrice || product.price || 0;
                        const image = item.variantData?.variantImage || product.featuredImage || (product.images && product.images[0]) || product.image || '/placeholder.png';

                        return (
                          <div key={itemKey} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow bg-gray-50/50">
                            <div className="w-20 h-20 relative flex-shrink-0 bg-white rounded-lg overflow-hidden border border-gray-100">
                              <img src={image} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-800 text-sm md:text-base truncate pr-4">{product.name}</h4>
                              <p className="text-indigo-600 font-bold mt-1">৳ {Number(price).toLocaleString()}</p>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
                                <button 
                                  onClick={() => updateQuantity(productId, item.quantity - 1, variantSku)}
                                  disabled={item.quantity <= 1}
                                  className="w-6 h-6 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded shadow-sm text-gray-600 disabled:opacity-50"
                                >
                                  -
                                </button>
                                <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(productId, item.quantity + 1, variantSku)}
                                  className="w-6 h-6 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded shadow-sm text-gray-600"
                                >
                                  +
                                </button>
                              </div>
                              <button 
                                onClick={() => removeFromCart(productId, variantSku)}
                                className="text-xs text-red-500 font-medium hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      <div className="pt-4 border-t border-gray-100 mt-6">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-600 font-medium">Subtotal</span>
                          <span className="text-xl font-bold text-indigo-600">৳ {cart?.total?.toLocaleString()}</span>
                        </div>
                        <button 
                          onClick={() => router.push("/checkout")}
                          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                        >
                          Proceed to Checkout
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100 mt-4">
                      <div className="text-5xl mb-3">🛒</div>
                      <p className="text-gray-500 mb-4 font-medium">Your cart is currently empty</p>
                      <button 
                        onClick={() => router.push("/shop")}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                      >
                        Start Shopping
                      </button>
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 🔥 Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl"
            >
              <button onClick={() => setSelectedOrder(null)} className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-700" />
              </button>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                📦 Order Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-xl text-sm border border-gray-100">
                <div><p className="text-gray-500 mb-1">Order ID</p><p className="font-bold text-indigo-600">#{selectedOrder.orderNumber || (selectedOrder._id?.substring(0,8).toUpperCase())}</p></div>
                <div><p className="text-gray-500 mb-1">Ordered By</p><p className="font-bold">{user?.name || "Customer"}</p></div>
                <div className="md:col-span-2"><p className="text-gray-500 mb-1">Shipping Address</p><p className="font-medium flex items-start gap-1"><MapPin className="w-4 h-4 text-gray-400 mt-0.5" />{selectedOrder.shipping_address?.address || selectedOrder.shipping_address?.street || "No address provided"}, {selectedOrder.shipping_address?.district || selectedOrder.shipping_address?.city}</p></div>
              </div>
              
              <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Items Ordered</h3>
              <div className="space-y-3 mb-6">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-md border border-gray-200" />}
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{item.name || item.product?.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} × ৳{item.price || item.product?.price}</p>
                      </div>
                    </div>
                    <div className="font-bold text-gray-800">৳{((item.price || item.product?.price || 0) * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-xl space-y-2 text-sm border border-indigo-100">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>৳{(selectedOrder.subtotal || selectedOrder.total - (selectedOrder.shipping_cost || 100)).toLocaleString()}</span></div>
                <div className="flex justify-between text-gray-600"><span>Shipping Fee</span><span>৳{selectedOrder.shipping_cost || selectedOrder.shipping || 100}</span></div>
                <div className="flex justify-between font-bold text-lg text-indigo-700 pt-2 border-t border-indigo-200 mt-2"><span>Total Cost</span><span>৳{(selectedOrder.total || 0).toLocaleString()}</span></div>
              </div>
              
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOGOUT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={cancelLogout}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            >
              {logoutStatus === 'success' ? (
                // Success State
                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Logged Out Successfully</h2>
                  <p className="text-gray-600 text-sm mb-6">
                    You have been safely logged out. Redirecting to home...
                  </p>
                  <div className="flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  </div>
                </div>
              ) : logoutStatus === 'error' ? (
                // Error State
                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <AlertTriangle className="w-16 h-16 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Logout Error</h2>
                  <p className="text-gray-600 text-sm mb-6">
                    An error occurred while logging out. Please try again.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={cancelLogout}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={performLogout}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : (
                // Confirmation State
                <div>
                  <div className="mb-6 flex justify-center">
                    <div className="p-4 bg-red-50 rounded-full">
                      <LogOut className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Confirm Logout</h2>
                  <p className="text-gray-600 text-sm mb-8 text-center">
                    Are you sure you want to logout? You'll need to login again to access your account.
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">Tip:</span> Your cart and wishlist will be saved for your next visit.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={cancelLogout}
                      disabled={isLoggingOut}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={performLogout}
                      disabled={isLoggingOut}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoggingOut ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Logging out...
                        </>
                      ) : (
                        <>
                          <LogOut className="w-4 h-4" />
                          Yes, Logout
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 🔥 Reusable components
function ProfileField({ label, value, edit, disabled = false, onChange, placeholder = "" }) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      {edit && !disabled ? (
        <input 
          value={value || ""} 
          onChange={onChange} 
          placeholder={placeholder || `Enter your ${label.toLowerCase()}`}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-shadow" 
        />
      ) : (
        <p className={`font-medium px-3 py-2 rounded-md min-h-[38px] flex items-center border border-transparent ${value ? 'text-gray-800 bg-gray-50' : 'text-gray-400 bg-gray-50 italic text-sm'}`}>
          {value || "Not set yet"}
        </p>
      )}
    </div>
  );
}

function StatCard({ title, value, color }) {
  const styles = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-500",
    green: "bg-green-50 text-green-600",
        red: "bg-red-50 text-red-600",
  };

  return (
    <div className={`p-4 rounded-xl text-center ${styles[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium opacity-80 mt-1">{title}</p>
    </div>
  );
}