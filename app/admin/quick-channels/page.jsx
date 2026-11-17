'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  Sparkles, 
  Tag, 
  Shirt, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  Ticket, 
  Truck, 
  Bot, 
  Gift, 
  ShoppingBag, 
  Heart, 
  Percent, 
  Watch, 
  Headphones, 
  Star, 
  Award, 
  Compass, 
  Search, 
  Grid, 
  Package, 
  Clock, 
  CreditCard, 
  Layers,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Eye
} from 'lucide-react';

const ICON_MAP = {
  Flame,
  Sparkles,
  Tag,
  Shirt,
  ShieldCheck,
  Zap,
  Smartphone,
  Ticket,
  Truck,
  Bot,
  Gift,
  ShoppingBag,
  Heart,
  Percent,
  Watch,
  Headphones,
  Star,
  Award,
  Compass,
  Search,
  Grid,
  Package,
  Clock,
  CreditCard,
  Layers,
};

const COLOR_PRESETS = [
  { label: 'Amber Orange', bg: 'from-amber-400 to-orange-500', swatch: 'bg-gradient-to-br from-amber-400 to-orange-500' },
  { label: 'Golden Yellow', bg: 'from-yellow-400 to-amber-500', swatch: 'bg-gradient-to-br from-yellow-400 to-amber-500' },
  { label: 'Rose Pink', bg: 'from-pink-400 to-rose-500', swatch: 'bg-gradient-to-br from-pink-400 to-rose-500' },
  { label: 'Vibrant Purple', bg: 'from-purple-500 to-indigo-500', swatch: 'bg-gradient-to-br from-purple-500 to-indigo-500' },
  { label: 'Royal Blue', bg: 'from-blue-600 to-indigo-700', swatch: 'bg-gradient-to-br from-blue-600 to-indigo-700' },
  { label: 'Electric Red', bg: 'from-red-500 to-rose-600', swatch: 'bg-gradient-to-br from-red-500 to-rose-600' },
  { label: 'Sky Cyan', bg: 'from-sky-400 to-blue-600', swatch: 'bg-gradient-to-br from-sky-400 to-blue-600' },
  { label: 'Fuchsia Magenta', bg: 'from-fuchsia-500 to-pink-500', swatch: 'bg-gradient-to-br from-fuchsia-500 to-pink-500' },
  { label: 'Emerald Green', bg: 'from-emerald-400 to-green-600', swatch: 'bg-gradient-to-br from-emerald-400 to-green-600' },
  { label: 'AI Neon Blue', bg: 'from-blue-500 to-cyan-500', swatch: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
  { label: 'Dark Slate', bg: 'from-slate-700 to-gray-900', swatch: 'bg-gradient-to-br from-slate-700 to-gray-900' },
];

export default function AdminQuickChannelsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [enabled, setEnabled] = useState(true);
  const [channels, setChannels] = useState([]);
  const [defaultChannels, setDefaultChannels] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/quick-channels?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.config) {
        setEnabled(data.config.enabled !== false);
        setChannels(data.config.channels || []);
      }
      if (data.defaultChannels) {
        setDefaultChannels(data.defaultChannels);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to load configuration', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (overrideEnabled) => {
    const isEnabled = typeof overrideEnabled === 'boolean' ? overrideEnabled : enabled;
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });

      const res = await fetch('/api/admin/quick-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: isEnabled,
          channels
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (typeof overrideEnabled === 'boolean') setEnabled(overrideEnabled);
        setMessage({ 
          text: isEnabled 
            ? '✓ Shortcut Icons are now VISIBLE on the homepage! Changes are live.' 
            : '✓ Shortcut Icons are now HIDDEN from the homepage! Changes are live.', 
          type: 'success' 
        });
        setTimeout(() => setMessage({ text: '', type: '' }), 6000);
      } else {
        setMessage({ text: data.error || 'Failed to save configuration.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to save configuration.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all channels to default 10 Daraz-style items? Any custom channels will be replaced.')) {
      setChannels(defaultChannels.length > 0 ? defaultChannels : [
        { id: 'mega-deals', name: 'Mega Deals', icon: 'Flame', bg: 'from-amber-400 to-orange-500', href: '/shop?featured=true', actionType: 'link', enabled: true },
        { id: 'low-price', name: 'Low Price', icon: 'Tag', bg: 'from-yellow-400 to-amber-500', href: '/shop?sort=price-asc', actionType: 'link', enabled: true },
        { id: 'beauty-finds', name: 'Beauty Finds', icon: 'Sparkles', bg: 'from-pink-400 to-rose-500', href: '/categories', actionType: 'link', enabled: true },
        { id: 'fashion-look', name: 'Fashion Look', icon: 'Shirt', bg: 'from-purple-500 to-indigo-500', href: '/categories', actionType: 'link', enabled: true },
        { id: 'stellar-mall', name: 'StellarMall', icon: 'ShieldCheck', bg: 'from-blue-600 to-indigo-700', href: '/shop', actionType: 'link', enabled: true },
        { id: 'flash-sale', name: 'Flash Sale', icon: 'Zap', bg: 'from-red-500 to-rose-600', href: '#mobile-flash-sale', actionType: 'link', enabled: true },
        { id: 'electronics', name: 'Electronics', icon: 'Smartphone', bg: 'from-sky-400 to-blue-600', href: '/categories', actionType: 'link', enabled: true },
        { id: 'vouchers', name: 'Vouchers', icon: 'Ticket', bg: 'from-fuchsia-500 to-pink-500', href: '/profile', actionType: 'link', enabled: true },
        { id: 'free-delivery', name: 'Free Delivery', icon: 'Truck', bg: 'from-emerald-400 to-green-600', href: '/shop', actionType: 'link', enabled: true },
        { id: 'ai-support', name: 'AI Support', icon: 'Bot', bg: 'from-blue-500 to-cyan-500', href: '#ai-chat', actionType: 'ai-chat', enabled: true }
      ]);
      setMessage({ text: 'Defaults restored. Click "Save Changes" to apply.', type: 'info' });
    }
  };

  const handleAddChannel = () => {
    const newId = 'channel-' + Date.now();
    const newChannel = {
      id: newId,
      name: 'New Channel',
      icon: 'Tag',
      bg: 'from-blue-600 to-indigo-700',
      href: '/shop',
      actionType: 'link',
      enabled: true
    };
    setChannels([...channels, newChannel]);
    setEditingId(newId);
  };

  const handleUpdateChannel = (id, fields) => {
    setChannels(channels.map(c => c.id === id ? { ...c, ...fields } : c));
  };

  const handleDeleteChannel = (id) => {
    setChannels(channels.filter(c => c.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= channels.length) return;
    const newChannels = [...channels];
    const temp = newChannels[index];
    newChannels[index] = newChannels[targetIndex];
    newChannels[targetIndex] = temp;
    setChannels(newChannels);
  };

  const renderIcon = (iconName, className = 'w-5 h-5') => {
    const Component = ICON_MAP[iconName];
    if (Component) return <Component className={className} />;
    return <span className="text-base leading-none">{iconName || '🔘'}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-gray-600">Loading Quick Channels config...</p>
        </div>
      </div>
    );
  }

  const activeChannels = channels.filter(c => c.enabled !== false);

  return (
    <div className="min-h-screen bg-gray-50/60 pb-28 pt-4 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Home Quick Icons (Shortcut Channels)</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Control whether the 10 shortcut icons (Mega Deals, Low Price, Flash Sale, etc.) appear on the mobile homepage, or customize their icons and links.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-gray-500" />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message.text && (
        <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 shadow-sm border ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : message.type === 'info'
            ? 'bg-blue-50 text-blue-800 border-blue-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      {/* Main Grid: Settings & Channels + Live Mobile Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Settings & Channel Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Master Switch Card */}
          <div className={`p-5 rounded-2xl shadow-sm border transition-all ${
            enabled ? 'bg-white border-blue-200 ring-2 ring-blue-50' : 'bg-gray-50 border-gray-300'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900">Homepage Visibility (Mobile Shortcut Icons)</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    enabled 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    {enabled ? '✓ ACTIVE (Visible)' : '✕ DISABLED (Hidden)'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Controls whether the 10 shortcut icons (Mega Deals, Low Price, Flash Sale, Vouchers, etc.) appear below the banner on the mobile homepage.
                </p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(!enabled)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                    enabled 
                      ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : enabled ? (
                    'Turn OFF (Hide from Home)'
                  ) : (
                    'Turn ON (Show on Home)'
                  )}
                </button>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={enabled} 
                    onChange={(e) => handleSave(e.target.checked)} 
                    disabled={saving}
                    className="sr-only peer" 
                  />
                  <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {!enabled && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>This section is currently <strong>completely hidden</strong> from the mobile homepage. Turn it ON whenever you wish to display it again.</span>
              </div>
            )}
          </div>

          {/* Channels List Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Channel Shortcuts ({channels.length})</h2>
              <p className="text-xs text-gray-500">Drag/reorder or edit each individual channel card below.</p>
            </div>
            <button
              onClick={handleAddChannel}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <Plus className="w-4 h-4" /> Add Channel
            </button>
          </div>

          {/* Channel Cards */}
          <div className="space-y-3">
            {channels.map((channel, index) => {
              const isEditing = editingId === channel.id;
              const bgClass = channel.bg?.startsWith('from-') ? `bg-gradient-to-br ${channel.bg}` : channel.bg || 'bg-blue-600';

              return (
                <div 
                  key={channel.id}
                  className={`bg-white rounded-xl shadow-sm border transition-all ${
                    isEditing ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200/80 hover:border-gray-300'
                  }`}
                >
                  {/* Channel Header Row */}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Icon preview */}
                      <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
                        {renderIcon(channel.icon, 'w-5 h-5')}
                      </div>
                      
                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-900 truncate">{channel.name || 'Untitled'}</h3>
                          {!channel.enabled && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Hidden</span>
                          )}
                          {channel.actionType === 'ai-chat' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-full border border-cyan-200">AI Chat</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate font-mono mt-0.5">
                          {channel.actionType === 'ai-chat' ? 'Triggers AI Chatbot' : channel.href || '/shop'}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Reorder, Edit, Delete */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0}
                        title="Move Up"
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMove(index, 1)}
                        disabled={index === channels.length - 1}
                        title="Move Down"
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(isEditing ? null : channel.id)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                          isEditing ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isEditing ? 'Done' : 'Edit'}
                      </button>
                      <button
                        onClick={() => handleDeleteChannel(channel.id)}
                        title="Delete Channel"
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Edit Form */}
                  {isEditing && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-4 rounded-b-xl">
                      
                      {/* Name & Active Toggle */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Channel Label</label>
                          <input
                            type="text"
                            value={channel.name}
                            onChange={(e) => handleUpdateChannel(channel.id, { name: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                            placeholder="e.g. Mega Deals"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                          <button
                            type="button"
                            onClick={() => handleUpdateChannel(channel.id, { enabled: channel.enabled === false ? true : false })}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                              channel.enabled !== false 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                : 'bg-gray-100 text-gray-600 border-gray-300'
                            }`}
                          >
                            {channel.enabled !== false ? '✓ Enabled' : '✕ Hidden'}
                          </button>
                        </div>
                      </div>

                      {/* Action Type & Target Link */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Action Type</label>
                          <select
                            value={channel.actionType || 'link'}
                            onChange={(e) => handleUpdateChannel(channel.id, { actionType: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                          >
                            <option value="link">Normal URL Link</option>
                            <option value="ai-chat">Open AI Support Chat</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            {channel.actionType === 'ai-chat' ? 'Action Anchor' : 'Destination URL'}
                          </label>
                          <input
                            type="text"
                            value={channel.href || ''}
                            disabled={channel.actionType === 'ai-chat'}
                            onChange={(e) => handleUpdateChannel(channel.id, { href: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white disabled:bg-gray-100 disabled:text-gray-500"
                            placeholder="/shop or /categories or #mobile-flash-sale"
                          />
                        </div>
                      </div>

                      {/* Quick URL Presets */}
                      {channel.actionType !== 'ai-chat' && (
                        <div>
                          <span className="text-[11px] font-bold text-gray-500 block mb-1.5">Quick Link Presets:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: 'Shop All', url: '/shop' },
                              { label: 'Featured Deals', url: '/shop?featured=true' },
                              { label: 'Low Price', url: '/shop?sort=price-asc' },
                              { label: 'Categories Page', url: '/categories' },
                              { label: 'Flash Sale Section', url: '#mobile-flash-sale' },
                              { label: 'Customer Profile', url: '/profile' },
                            ].map((preset) => (
                              <button
                                key={preset.url}
                                type="button"
                                onClick={() => handleUpdateChannel(channel.id, { href: preset.url })}
                                className="text-[11px] px-2.5 py-1 bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 rounded-md font-medium text-gray-600 transition-colors"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Color Preset Palette */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Background Gradient Theme</label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {COLOR_PRESETS.map((preset) => {
                            const isSelected = channel.bg === preset.bg;
                            return (
                              <button
                                key={preset.bg}
                                type="button"
                                onClick={() => handleUpdateChannel(channel.id, { bg: preset.bg })}
                                className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                                  isSelected ? 'border-blue-600 ring-2 ring-blue-200 bg-white shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-md ${preset.swatch} flex-shrink-0 shadow-xs`} />
                                <span className="text-[10px] font-medium text-gray-700 truncate">{preset.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Icon Selector */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Select Icon</label>
                        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-white rounded-lg border border-gray-200">
                          {Object.keys(ICON_MAP).map((iconKey) => {
                            const IconComponent = ICON_MAP[iconKey];
                            const isSelected = channel.icon === iconKey;
                            return (
                              <button
                                key={iconKey}
                                type="button"
                                onClick={() => handleUpdateChannel(channel.id, { icon: iconKey })}
                                title={iconKey}
                                className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
                                  isSelected 
                                    ? 'bg-blue-50 text-blue-700 border-blue-500 shadow-sm ring-1 ring-blue-400' 
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <IconComponent className="w-5 h-5" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Live Mobile Customer Preview (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                <Eye className="w-4 h-4 text-blue-600" />
                Live Customer Mobile Preview
              </div>
              <span className="text-[11px] font-semibold text-gray-400">Updates in Real-Time</span>
            </div>

            {/* Mobile Phone Mockup */}
            <div className="mx-auto max-w-[340px] bg-white rounded-[36px] p-3 shadow-2xl border-4 border-gray-800 relative">
              {/* Phone Speaker Notch */}
              <div className="w-24 h-4 bg-gray-800 mx-auto rounded-b-xl mb-3 flex items-center justify-center">
                <div className="w-8 h-1 bg-gray-600 rounded-full" />
              </div>

              {/* Mobile Canvas */}
              <div className="bg-[#f4f5f8] rounded-2xl p-2 min-h-[460px] flex flex-col justify-start">
                
                {/* Mock Navbar */}
                <div className="bg-white px-3 py-2 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between mb-2.5">
                  <span className="text-xs font-black text-black flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" /> StellarMartBD
                  </span>
                  <div className="flex gap-1">
                    <span className="w-4 h-4 rounded bg-gray-100 inline-block" />
                    <span className="w-4 h-4 rounded bg-gray-100 inline-block" />
                  </div>
                </div>

                {/* Mock Top Banner */}
                <div className="w-full aspect-[2/1] rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 relative overflow-hidden shadow-xs mb-2.5 flex items-end p-2 text-white">
                  <div>
                    <span className="text-[8px] font-bold uppercase text-yellow-300">SPECIAL OFFER</span>
                    <h4 className="text-[11px] font-extrabold leading-tight">Mega Deals Live</h4>
                  </div>
                </div>

                {/* The Live Channels Section Being Edited */}
                {enabled ? (
                  <div className="bg-white p-2.5 rounded-xl shadow-xs border border-gray-100 mb-3">
                    <div className="grid grid-cols-5 gap-y-3 gap-x-1">
                      {activeChannels.map((ch, idx) => {
                        const bgClass = ch.bg?.startsWith('from-') ? `bg-gradient-to-br ${ch.bg}` : ch.bg || 'bg-blue-600';
                        return (
                          <div key={ch.id || idx} className="flex flex-col items-center">
                            <div className={`w-9 h-9 rounded-xl ${bgClass} flex items-center justify-center text-white shadow-xs`}>
                              {renderIcon(ch.icon, 'w-4 h-4 stroke-[2.2]')}
                            </div>
                            <span className="text-[8px] font-medium text-gray-700 text-center leading-tight mt-1 line-clamp-1 w-full px-0.5">
                              {ch.name || 'Channel'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Micro Channel Indicator */}
                    <div className="flex justify-center mt-2 pt-0.5">
                      <span className="w-4 h-0.5 bg-[#f85606] rounded-full inline-block mr-1"></span>
                      <span className="w-1.5 h-0.5 bg-gray-200 rounded-full inline-block"></span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-100 border border-dashed border-gray-300 rounded-xl text-center mb-3">
                    <span className="text-[11px] text-gray-400 font-semibold">Quick Channels Section is Disabled</span>
                  </div>
                )}

                {/* Mock Next Section (Flash Sale) */}
                <div className="bg-white p-2 rounded-xl shadow-xs border border-gray-100 opacity-60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-extrabold text-gray-900">Flash⚡Sale</span>
                    <span className="text-[8px] font-bold text-[#f85606]">Shop More &gt;</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg" />
                    <div className="w-14 h-14 bg-gray-100 rounded-lg" />
                  </div>
                </div>

              </div>

              {/* Home indicator bar */}
              <div className="w-28 h-1 bg-gray-400 rounded-full mx-auto mt-2" />
            </div>

          </div>
        </div>

      </div>

      {/* Sticky Bottom Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
            <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            Section is: <strong className={enabled ? 'text-emerald-700' : 'text-gray-700'}>{enabled ? 'Active (Visible)' : 'Disabled (Hidden)'}</strong>
            <span className="hidden sm:inline">| {activeChannels.length} active channel shortcuts</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save All Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
