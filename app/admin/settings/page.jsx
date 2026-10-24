'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Settings, 
  Save, 
  Loader2, 
  Globe, 
  Mail, 
  Image as ImageIcon, 
  Share2, 
  CheckCircle2, 
  Smartphone, 
  Zap, 
  Layers,
  Upload,
  ExternalLink,
  PhoneCall,
  MapPin
} from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    site_name: 'StellarMartBD',
    site_tagline: 'Your Trusted Online Shopping Destination in Bangladesh',
    email: 'support@stellarmartbd.com',
    phone: '+880 1606-069754',
    address: 'House #12, Road #5, Dhanmondi, Dhaka, Bangladesh',
    logo_url: 'https://i.postimg.cc/CxQSCP22/Whats-App-Image-2026-04-29-at-9-49-48-PM.jpg',
    facebook_url: 'https://www.facebook.com/stellarmartbd',
    instagram_url: 'https://www.instagram.com/stellarmartbd',
    youtube_url: 'https://www.youtube.com/@stellarmartbd'
  });

  const [quickChannelsEnabled, setQuickChannelsEnabled] = useState(true);
  const [quickChannelsList, setQuickChannelsList] = useState([]);
  const [togglingChannels, setTogglingChannels] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [settingsRes, channelsRes] = await Promise.all([
        fetch(`/api/admin/settings?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/admin/quick-channels?t=${Date.now()}`, { cache: 'no-store' })
      ]);
      const data = await settingsRes.json();
      const loaded = data?.settings || data;
      if (loaded && typeof loaded === 'object') {
        setFormData(prev => ({ ...prev, ...loaded }));
      }
      if (channelsRes.ok) {
        const channelsData = await channelsRes.json();
        if (channelsData.config) {
          setQuickChannelsEnabled(channelsData.config.enabled !== false);
          setQuickChannelsList(channelsData.config.channels || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleQuickChannels = async () => {
    const nextState = !quickChannelsEnabled;
    setTogglingChannels(true);
    try {
      const res = await fetch('/api/admin/quick-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: nextState,
          channels: quickChannelsList
        })
      });
      if (res.ok) {
        setQuickChannelsEnabled(nextState);
        setMessage({
          text: nextState
            ? '✓ Mobile Shortcut Icons are now VISIBLE on the homepage!'
            : '✓ Mobile Shortcut Icons are now HIDDEN from the homepage!',
          type: 'success'
        });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
      } else {
        setMessage({ text: 'Failed to update shortcut icons status.', type: 'error' });
      }
    } catch (e) {
      setMessage({ text: 'Network error occurred.', type: 'error' });
    } finally {
      setTogglingChannels(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);
    data.append('folder', 'stellar-mart/logo');

    setUploadingLogo(true);
    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: data
      });
      if (res.ok) {
        const result = await res.json();
        if (result.url) {
          setFormData(prev => ({ ...prev, logo_url: result.url }));
          setMessage({ text: 'Logo uploaded successfully to Cloudinary! Remember to save.', type: 'success' });
        }
      } else {
        alert('Failed to upload logo');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      alert('Error uploading logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ text: 'Settings updated successfully!', type: 'success' });
      } else {
        setMessage({ text: data.error || 'Failed to update settings.', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Network error occurred.', type: 'error' });
    } finally {
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-gray-500">
        <Loader2 className="w-9 h-9 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium">Loading system configurations...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Page Header with Quick Save */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">System Settings</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
              Live Config
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Manage global website branding, homepage modules, contact hotlines, and social profiles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm flex items-center gap-2 disabled:opacity-70 transition shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Alert / Notification Banner */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-sm">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ── 1. Homepage Modules & Section Visibility (Full Width Card) ── */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200/80">
          <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Homepage Modules & Section Visibility</h2>
              <p className="text-xs text-gray-500">Show or hide specific promotional and navigation blocks from the website homepage</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick Channels Shortcut Icons */}
            <div className="flex flex-col justify-between p-4 bg-gray-50/80 hover:bg-gray-50 rounded-xl border border-gray-200/80 transition">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900">Mobile Shortcut Icons</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    quickChannelsEnabled 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}>
                    {quickChannelsEnabled ? '✓ Visible on Home' : '✕ Hidden from Home'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Controls the 10-icon shortcut grid (Mega Deals, Low Price, Flash Sale, etc.) on the mobile homepage.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-200/60">
                <Link 
                  href="/admin/quick-channels" 
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  Configure Icons &rarr;
                </Link>

                <button
                  type="button"
                  disabled={togglingChannels}
                  onClick={handleToggleQuickChannels}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 ${
                    quickChannelsEnabled
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {togglingChannels ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : quickChannelsEnabled ? (
                    'Hide from Home'
                  ) : (
                    'Show on Home'
                  )}
                </button>
              </div>
            </div>

            {/* Flash Sale Module Link */}
            <div className="flex flex-col justify-between p-4 bg-gray-50/80 hover:bg-gray-50 rounded-xl border border-gray-200/80 transition">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-gray-900">Flash Sale Countdown Section</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Active Module
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Controls the live countdown timer, discount campaigns, and flash sale cards shown on the homepage.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-200/60">
                <span className="text-xs text-gray-400">Homepage Banner Slot</span>
                <Link 
                  href="/admin/flash-sale" 
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 transition shadow-2xs"
                >
                  Manage Flash Sale &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Balanced 2-Column Responsive Layout (Full Width Desktop Grid) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ── Column 1: General Info & Branding ── */}
          <div className="space-y-6">
            
            {/* General Settings */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200/80">
              <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">General Information</h2>
                  <p className="text-xs text-gray-500">Site title, branding name, and search tagline</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Site Name</label>
                  <input 
                    type="text" 
                    name="site_name" 
                    value={formData.site_name} 
                    onChange={handleChange} 
                    className="w-full px-3.5 py-2.5 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition" 
                    placeholder="e.g. StellarMartBD" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Site Tagline</label>
                  <input 
                    type="text" 
                    name="site_tagline" 
                    value={formData.site_tagline} 
                    onChange={handleChange} 
                    className="w-full px-3.5 py-2.5 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition" 
                    placeholder="e.g. Your Premium E-commerce Partner" 
                  />
                </div>
              </div>
            </div>

            {/* Branding & Logo */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200/80">
              <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Branding & Logo</h2>
                  <p className="text-xs text-gray-500">Website navbar header logo image</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Logo URL</label>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                      {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>{uploadingLogo ? 'Uploading...' : 'Upload New Logo'}</span>
                    </button>
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      onChange={handleLogoUpload} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                  <input 
                    type="url" 
                    name="logo_url" 
                    value={formData.logo_url} 
                    onChange={handleChange} 
                    className="w-full px-3.5 py-2.5 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition font-mono text-xs" 
                    placeholder="https://example.com/logo.png" 
                  />
                </div>

                {formData.logo_url && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Live Logo Preview</span>
                      <span className="text-xs text-gray-400">Renders directly in header navbar</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs shrink-0 max-w-[180px]">
                      <img 
                        src={formData.logo_url} 
                        alt="Logo Preview" 
                        className="max-h-12 max-w-full object-contain mx-auto" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── Column 2: Contact Details & Social Links ── */}
          <div className="space-y-6">
            
            {/* Contact Details */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200/80">
              <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Contact Details & Hotlines</h2>
                  <p className="text-xs text-gray-500">Displayed in footer, contact page, and order help</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" /> Support Email
                    </label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      className="w-full px-3.5 py-2.5 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition" 
                      placeholder="support@stellarmartbd.com" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-gray-400" /> Phone & WhatsApp
                    </label>
                    <input 
                      type="text" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleChange} 
                      className="w-full px-3.5 py-2.5 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition font-medium" 
                      placeholder="+880 1606-069754" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> Office / Store Address
                  </label>
                  <textarea 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    rows="3" 
                    className="w-full px-3.5 py-2.5 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition resize-none" 
                    placeholder="House #12, Road #5, Dhanmondi, Dhaka, Bangladesh"
                  />
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200/80">
              <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4">
                <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Social Media Channels</h2>
                  <p className="text-xs text-gray-500">Official social links shown on website footer</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Facebook Page</label>
                  <input 
                    type="url" 
                    name="facebook_url" 
                    value={formData.facebook_url} 
                    onChange={handleChange} 
                    className="w-full px-3.5 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none transition font-mono text-xs" 
                    placeholder="https://www.facebook.com/stellarmartbd" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Instagram Profile</label>
                  <input 
                    type="url" 
                    name="instagram_url" 
                    value={formData.instagram_url} 
                    onChange={handleChange} 
                    className="w-full px-3.5 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none transition font-mono text-xs" 
                    placeholder="https://www.instagram.com/stellarmartbd" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">YouTube Channel</label>
                  <input 
                    type="url" 
                    name="youtube_url" 
                    value={formData.youtube_url} 
                    onChange={handleChange} 
                    className="w-full px-3.5 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none transition font-mono text-xs" 
                    placeholder="https://www.youtube.com/@stellarmartbd" 
                  />
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ── Bottom Save Action Bar ── */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-500">
            Click <strong>Save All Settings</strong> to publish changes across the storefront instantly.
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70 transition shadow-sm"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>{saving ? 'Saving System Settings...' : 'Save All Settings'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}