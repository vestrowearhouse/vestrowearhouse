'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Store, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Check, 
  Globe, 
  Tag, 
  Building2, 
  RefreshCw,
  Info
} from 'lucide-react';

const CATEGORIES = [
  'Fashion & Apparel',
  'Electronics & Gadgets',
  'Health & Beauty',
  'Home & Kitchen',
  'Groceries & Organic',
  'Sports & Fitness',
  'Books & Stationery',
  'Jewelry & Accessories',
  'Automotive & Hardware',
  'General Merchandise'
];

const DIVISIONS = [
  'Dhaka',
  'Chattogram',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Rangpur',
  'Mymensingh'
];

export default function AddVendorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    // Store Info
    shop_name: '',
    username: '',
    category: 'Fashion & Apparel',
    description: '',
    logo_url: '',
    
    // Owner & Contact
    owner_name: '',
    email: '',
    phone: '',
    alt_phone: '',
    
    // Location
    shop_address: '',
    city: 'Dhaka',
    postal_code: '',
    
    // Settings & Status
    status: 'active',
    verification_badge: true,
    password: '',
  });

  const showToastMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    setFormData(prev => {
      const next = { ...prev, [name]: val };
      // Auto-generate username/slug from shop name if not manually edited
      if (name === 'shop_name' && !prev.manuallySetUsername) {
        next.username = value
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 30);
      }
      return next;
    });
    setError('');
  };

  // Generate strong initial password
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let generated = 'Stellar@';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: generated }));
    navigator.clipboard?.writeText(generated);
    setCopiedPass(true);
    showToastMsg('Strong password generated & copied to clipboard!');
    setTimeout(() => setCopiedPass(false), 2500);
  };

  // Quick Demo Fill for Fast Testing
  const fillSampleData = () => {
    const rand = Math.floor(100 + Math.random() * 900);
    setFormData({
      shop_name: `Stellar Apex Store ${rand}`,
      username: `stellar-apex-${rand}`,
      category: 'Fashion & Apparel',
      description: 'Official flagship merchant offering authentic premium apparel, footwear, and accessories with nationwide fast delivery.',
      logo_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop&q=80',
      owner_name: 'Mahfuz Rahman',
      email: `merchant${rand}@stellarmartbd.com`,
      phone: `01712${rand}456`,
      alt_phone: `01911${rand}789`,
      shop_address: 'Level 4, Block C, Jamuna Future Park, Kuril',
      city: 'Dhaka',
      postal_code: '1229',
      status: 'active',
      verification_badge: true,
      password: `Vendor#${rand}Secure!`,
      manuallySetUsername: true
    });
    showToastMsg('Demo vendor details filled!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.shop_name.trim()) throw new Error('Store/Shop Name is required.');
      if (!formData.owner_name.trim()) throw new Error('Owner Full Name is required.');
      if (!formData.email.trim()) throw new Error('Email Address is required.');
      if (!formData.password) throw new Error('Initial Password is required.');

      // Combine full address
      const fullAddress = [
        formData.shop_address.trim(),
        formData.city,
        formData.postal_code ? `Postal: ${formData.postal_code}` : null
      ].filter(Boolean).join(', ');

      const payload = {
        shop_name: formData.shop_name.trim(),
        owner_name: formData.owner_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        username: formData.username.trim() || formData.shop_name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        shop_address: fullAddress || formData.shop_address.trim(),
        description: formData.description.trim(),
        logo_url: formData.logo_url.trim(),
        status: formData.status,
        verification_badge: formData.verification_badge,
        is_verified: formData.verification_badge,
      };

      const res = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create vendor');
      }

      setSuccess(`Merchant store "${formData.shop_name}" has been created successfully!`);
      showToastMsg('Vendor created! Redirecting to vendors list...', 'success');

      setTimeout(() => {
        router.push('/admin/vendors');
      }, 1600);
    } catch (err) {
      setError(err.message || 'Failed to create vendor account');
      showToastMsg(err.message || 'Creation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl border text-sm font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 ${
          toast.type === 'error' 
            ? 'bg-red-900/95 text-white border-red-700' 
            : 'bg-emerald-900/95 text-white border-emerald-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-300" /> : <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/vendors" 
            className="p-2.5 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-600 transition-all hover:scale-105 active:scale-95"
            title="Back to Vendors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
                Merchant Onboarding
              </span>
              <span className="text-xs text-gray-400">• New Store Creation</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Add New Vendor Partner</h1>
            <p className="text-sm text-gray-500">Configure store details, merchant credentials, and partner badges.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fillSampleData}
            className="px-3.5 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-1.5"
            title="Pre-fill with sample demo details"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Fill Demo Data</span>
          </button>
          <Link
            href="/admin/vendors"
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 shadow-sm animate-shake">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <div className="text-sm">
            <p className="font-semibold">Creation Error</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <div className="text-sm">
            <p className="font-semibold">Success</p>
            <p className="text-xs text-emerald-700 mt-0.5">{success}</p>
          </div>
        </div>
      )}

      {/* Main Content: Form (Left) + Live Card Preview (Right) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Column */}
        <div className="lg:col-span-8 space-y-6">

          {/* Section 1: Store Branding & Identity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Store Profile & Branding</h3>
                <p className="text-xs text-gray-500">Public shop information displayed to marketplace customers.</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Shop / Store Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="shop_name"
                      value={formData.shop_name}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Apex Lifestyle BD"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Store Handle / Slug
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={(e) => {
                        handleChange(e);
                        setFormData(p => ({ ...p, manuallySetUsername: true }));
                      }}
                      placeholder="e.g. apex-lifestyle"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-mono text-xs"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Unique store identifier in URLs.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Primary Category
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Store Logo / Avatar Image URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      name="logo_url"
                      value={formData.logo_url}
                      onChange={handleChange}
                      placeholder="https://... (direct image URL)"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Store Bio / Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Short introduction about this merchant, their specialty products, return policy, and brand story..."
                  className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Owner & Contact Credentials */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Merchant Owner & Direct Contacts</h3>
                <p className="text-xs text-gray-500">Contact person responsible for store operations & orders.</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Owner Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="owner_name"
                      value={formData.owner_name}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Tanvir Hossain"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Login Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="vendor@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Vendor uses this email to log in at /vendor.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Primary Phone / Mobile <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="01XXXXXXXXX"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    WhatsApp / Support Hotline
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      name="alt_phone"
                      value={formData.alt_phone}
                      onChange={handleChange}
                      placeholder="01XXXXXXXXX (optional)"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Physical Address & Location */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Physical Store Address & Region</h3>
                <p className="text-xs text-gray-500">Pick-up location, shop outlet address, and delivery zone.</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Detailed Shop Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    name="shop_address"
                    rows={2}
                    value={formData.shop_address}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Shop #204, 2nd Floor, Shimanto Square, Road 2, Dhanmondi"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    City / Division
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  >
                    {DIVISIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Postal / Zip Code
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    placeholder="e.g. 1205"
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Security, Access & Badges */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Security & Store Status</h3>
                <p className="text-xs text-gray-500">Access credentials and marketplace trust badges.</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Initial Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Secure Password</span>
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter or generate initial password"
                    className="w-full pl-10 pr-24 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-mono"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {formData.password && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(formData.password);
                          setCopiedPass(true);
                          setTimeout(() => setCopiedPass(false), 2000);
                          showToastMsg('Password copied!');
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="Copy Password"
                      >
                        {copiedPass ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>The vendor can use this password immediately at the login portal.</span>
                </p>
              </div>

              {/* Status and Verified Partner Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Account Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium"
                  >
                    <option value="active">🟢 Active (Immediate Selling Access)</option>
                    <option value="pending">🟡 Pending (Review & Approval)</option>
                    <option value="suspended">🔴 Suspended (Temporarily Frozen)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">Verified Partner Badge</span>
                      <span className="text-[11px] text-gray-500">Official blue checkmark</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="verification_badge"
                      checked={formData.verification_badge}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/admin/vendors"
              className="px-6 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Merchant...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save & Onboard Vendor</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Store Card Preview */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
            <span>Live Store Card Preview</span>
            <span className="text-blue-600 font-bold">Real-time</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {/* Store Cover Header */}
            <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-600 relative p-4 flex items-end">
              <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm ${
                formData.status === 'active' 
                  ? 'bg-emerald-500 text-white' 
                  : formData.status === 'suspended'
                  ? 'bg-red-500 text-white'
                  : 'bg-amber-400 text-gray-900'
              }`}>
                {formData.status}
              </span>
            </div>

            {/* Avatar & Store Info */}
            <div className="p-5 pt-0 relative">
              <div className="-mt-10 mb-3 flex items-end justify-between">
                <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-md bg-white overflow-hidden flex items-center justify-center text-gray-400 font-bold text-xl">
                  {formData.logo_url ? (
                    <img 
                      src={formData.logo_url} 
                      alt="Store Logo" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-blue-600 bg-blue-50 w-full h-full flex items-center justify-center uppercase">
                      {formData.shop_name ? formData.shop_name.charAt(0) : 'S'}
                    </span>
                  )}
                </div>

                {formData.verification_badge && (
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-200/60 flex items-center gap-1 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Verified Store
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-bold text-gray-900 text-lg leading-tight flex items-center gap-1.5">
                  {formData.shop_name || 'Store Name Preview'}
                </h4>
                <p className="text-xs text-blue-600 font-mono mt-0.5">
                  @{formData.username || 'store-handle'}
                </p>
                <div className="mt-2 inline-block bg-gray-100 text-gray-700 text-[11px] font-medium px-2 py-0.5 rounded-md">
                  {formData.category}
                </div>
              </div>

              <p className="text-xs text-gray-600 mt-3 line-clamp-2 leading-relaxed">
                {formData.description || 'No description provided yet. Brief merchant overview will show here.'}
              </p>

              {/* Contact meta */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="font-medium text-gray-800 truncate">{formData.owner_name || 'Owner Name'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{formData.email || 'vendor@example.com'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span>{formData.phone || '+880 1XXXXXXXXX'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{formData.shop_address ? `${formData.shop_address}, ${formData.city}` : `${formData.city}, Bangladesh`}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                <span>StellarMart Merchant Partner</span>
                <span>ID: Auto-assigned</span>
              </div>
            </div>
          </div>

          {/* Quick Tips Box */}
          <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-amber-800">
              <Info className="w-4 h-4 text-amber-600" />
              <span>Admin Onboarding Note</span>
            </p>
            <p className="text-amber-700/90 leading-relaxed text-[11px]">
              Upon creation, the vendor account is automatically provisioned in both the <strong>Vendors</strong> directory and <strong>Users</strong> authorization database. The merchant can immediately log in at <code>/vendor</code> using the registered email and password.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
