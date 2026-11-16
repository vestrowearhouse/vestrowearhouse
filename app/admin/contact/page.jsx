'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Mail, 
  Search, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  X, 
  Loader2, 
  Send, 
  RefreshCw, 
  Download, 
  Sparkles, 
  Inbox, 
  Check, 
  Copy, 
  Calendar, 
  AlertCircle, 
  ArrowUpRight, 
  MessageSquare, 
  Phone,
  FileText,
  ShieldCheck,
  Settings
} from 'lucide-react';

export default function ContactPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [copiedText, setCopiedText] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, message: null });
  const [processingId, setProcessingId] = useState(null);

  // In-App Zoho Reply Modal State
  const [replyModal, setReplyModal] = useState({
    show: false,
    message: null,
    to: '',
    subject: '',
    replyText: '',
    sending: false,
    error: ''
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch('/api/admin/contact?limit=200');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      showToast('Failed to load messages', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCopy = (text, id) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleStatusUpdate = async (id, status) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/contact/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
        if (selectedMessage?.id === id) {
          setSelectedMessage(prev => ({ ...prev, status }));
        }
        showToast(`Message marked as ${status}`);
      } else {
        showToast('Failed to update message status', 'error');
      }
    } catch (error) {
      showToast('Error updating status', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const confirmDelete = (msg) => {
    setDeleteModal({ show: true, message: msg });
  };

  const handleDelete = async () => {
    const msg = deleteModal.message;
    if (!msg) return;
    setDeleteModal({ show: false, message: null });
    setProcessingId(msg.id);
    try {
      const res = await fetch(`/api/admin/contact/${msg.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== msg.id));
        if (selectedMessage?.id === msg.id) setSelectedMessage(null);
        showToast('Message deleted permanently');
      } else {
        showToast('Failed to delete message', 'error');
      }
    } catch (error) {
      showToast('Error deleting message', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Open In-App Zoho Reply Modal
  const openReplyModal = (msg) => {
    const customerName = msg.name || 'Valued Customer';
    const cleanSubject = msg.subject || 'Your inquiry at Vestro Wear House';
    const replySubject = cleanSubject.toLowerCase().startsWith('re:') ? cleanSubject : `Re: ${cleanSubject}`;
    const initialText = `Dear ${customerName},\n\nThank you for reaching out to Vestro Wear House Support.\n\n\n\nWarm regards,\nCustomer Support Team\nVestro Wear House`;

    setReplyModal({
      show: true,
      message: msg,
      to: msg.email || '',
      subject: replySubject,
      replyText: initialText,
      sending: false,
      error: ''
    });
  };

  // Quick reply snippets
  const applyReplySnippet = (type) => {
    if (!replyModal.message) return;
    const name = replyModal.message.name || 'Customer';

    if (type === 'solved') {
      setReplyModal(prev => ({
        ...prev,
        replyText: `Dear ${name},\n\nThank you for reaching out to Vestro Wear House. We have reviewed your inquiry and have resolved the matter.\n\nIf you have any further questions or need additional support, please feel free to reply to this email anytime.\n\nWarm regards,\nCustomer Support Team\nVestro Wear House`
      }));
    } else if (type === 'order') {
      setReplyModal(prev => ({
        ...prev,
        replyText: `Dear ${name},\n\nThank you for getting in touch regarding your order inquiry. Our fulfillment and logistics team is currently reviewing your order status and will provide a detailed update shortly.\n\nThank you for your patience and for shopping with Vestro Wear House.\n\nWarm regards,\nCustomer Support Team\nVestro Wear House`
      }));
    } else if (type === 'details') {
      setReplyModal(prev => ({
        ...prev,
        replyText: `Dear ${name},\n\nThank you for reaching out to us. To assist you as quickly and accurately as possible, could you kindly reply to this email with your order number or registered phone number?\n\nLooking forward to hearing from you.\n\nWarm regards,\nCustomer Support Team\nVestro Wear House`
      }));
    }
  };

  // Send Reply via Zoho
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyModal.to || !replyModal.subject || !replyModal.replyText) return;

    setReplyModal(prev => ({ ...prev, sending: true, error: '' }));

    try {
      const origMsg = replyModal.message;
      const formattedHtml = `
        <div style="font-family: inherit; line-height: 1.6; color: #334155; white-space: pre-wrap;">
          ${replyModal.replyText.replace(/\n/g, '<br/>')}
        </div>
        <br/>
        <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
          <strong style="color: #475569;">--- Original Customer Inquiry ---</strong><br/>
          <strong>From:</strong> ${origMsg.name || 'Anonymous'} &lt;${origMsg.email}&gt;<br/>
          <strong>Subject:</strong> ${origMsg.subject || 'No Subject'}<br/>
          <strong>Date:</strong> ${origMsg.created_at ? new Date(origMsg.created_at).toLocaleString() : 'N/A'}<br/>
          <br/>
          <div style="padding: 12px 16px; background-color: #f8fafc; border-left: 3px solid #3b82f6; border-radius: 6px; font-style: italic; color: #334155;">
            ${(origMsg.message || '').replace(/\n/g, '<br/>')}
          </div>
        </div>
      `;

      const res = await fetch('/api/webmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: replyModal.to.trim(),
          subject: replyModal.subject.trim(),
          message: formattedHtml,
          plainText: replyModal.replyText
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch email via Zoho');
      }

      // Automatically update message status to 'replied'
      await handleStatusUpdate(origMsg.id, 'replied');

      showToast(`Reply sent to ${replyModal.to} via Zoho Mail!`);
      setReplyModal({ show: false, message: null, to: '', subject: '', replyText: '', sending: false, error: '' });
    } catch (err) {
      console.error('Zoho reply error:', err);
      setReplyModal(prev => ({
        ...prev,
        sending: false,
        error: err.message || 'Failed to dispatch reply'
      }));
    }
  };

  // Export CSV
  const exportCSV = () => {
    if (messages.length === 0) {
      showToast('No messages to export', 'error');
      return;
    }
    const headers = ['Sender Name', 'Email', 'Phone', 'Subject', 'Message', 'Status', 'Date'];
    const rows = messages.map(m => [
      `"${(m.name || '').replace(/"/g, '""')}"`,
      `"${m.email || ''}"`,
      `"${m.phone || ''}"`,
      `"${(m.subject || '').replace(/"/g, '""')}"`,
      `"${(m.message || '').replace(/"/g, '""')}"`,
      `"${m.status || 'unread'}"`,
      `"${m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contact_inquiries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    let unreadCount = 0;
    let readCount = 0;
    let repliedCount = 0;

    messages.forEach(m => {
      const st = (m.status || 'unread').toLowerCase();
      if (st === 'unread') unreadCount++;
      else if (st === 'read') readCount++;
      else if (st === 'replied') repliedCount++;
    });

    return {
      total: messages.length,
      unread: unreadCount,
      read: readCount,
      replied: repliedCount
    };
  }, [messages]);

  // Filtered List
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch = !q || 
        m.name?.toLowerCase().includes(q) || 
        m.email?.toLowerCase().includes(q) ||
        m.subject?.toLowerCase().includes(q) ||
        m.message?.toLowerCase().includes(q);

      const st = (m.status || 'unread').toLowerCase();
      const matchesStatus = statusFilter === 'all' || st === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [messages, searchTerm, statusFilter]);

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
              Customer Inquiries & Support Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Contact Messages & Feedback</h1>
            <p className="text-blue-100 text-sm sm:text-base max-w-3xl font-light">
              Review shopper inquiries and support tickets. Reply to customers directly from this panel using Zoho Mail.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => fetchMessages(true)}
              disabled={refreshing}
              className="p-3 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl backdrop-blur-md transition-all duration-150 flex items-center gap-2 text-xs font-bold"
              title="Sync inquiries"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-3 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl backdrop-blur-md transition-all duration-150 flex items-center gap-2 text-xs font-bold"
              title="Download CSV report"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <Link
              href="/admin/webmail"
              className="px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 rounded-xl font-bold text-xs shadow-md transition-all duration-150 flex items-center gap-1.5"
            >
              <Mail className="w-4 h-4" />
              <span>Webmail Hub (Zoho)</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4-Card Executive KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Inquiries */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Inquiries</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Inbox className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{metrics.total}</span>
            <span className="text-xs font-medium text-gray-400">messages</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">All-time contact submissions</p>
        </div>

        {/* Unread Inquiries */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unread Inquiries</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{metrics.unread}</span>
            {metrics.unread > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/70 text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Needs Reply
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Awaiting staff response</p>
        </div>

        {/* Read / In Progress */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Under Review</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{metrics.read}</span>
            <span className="text-xs font-medium text-gray-400">opened</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Reviewed by administrators</p>
        </div>

        {/* Replied / Resolved */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Replied & Resolved</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{metrics.replied}</span>
            <span className="text-xs font-medium text-gray-400">completed</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Direct replies dispatched via Zoho</p>
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
              placeholder="Search by sender name, email, or subject..."
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

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              {[
                { id: 'all', label: `All (${messages.length})` },
                { id: 'unread', label: `Unread (${metrics.unread})` },
                { id: 'read', label: `Read (${metrics.read})` },
                { id: 'replied', label: `Replied (${metrics.replied})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg transition-all ${
                    statusFilter === tab.id
                      ? 'bg-white text-gray-900 shadow-sm font-bold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-gray-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Loading customer messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-gray-800">No contact messages</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'No inquiries match your active filter. Try adjusting your search query.'
                : 'Customer inquiries submitted via the Contact page will appear here.'}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                className="mt-4 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                Clear active filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Sender Info</th>
                  <th className="px-6 py-4">Subject & Inquiry</th>
                  <th className="px-6 py-4">Received Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMessages.map((msg) => {
                  const isUnread = msg.status === 'unread';
                  const isReplied = msg.status === 'replied';
                  const initials = msg.name ? msg.name.slice(0, 2).toUpperCase() : 'U';

                  return (
                    <tr 
                      key={msg.id} 
                      className={`hover:bg-blue-50/30 transition-colors group cursor-pointer ${isUnread ? 'bg-blue-50/20' : ''}`}
                      onClick={() => {
                        setSelectedMessage(msg);
                        if (isUnread) handleStatusUpdate(msg.id, 'read');
                      }}
                    >
                      {/* Status */}
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        {isUnread ? (
                          <button
                            onClick={() => handleStatusUpdate(msg.id, 'read')}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold hover:bg-amber-100 transition-colors shadow-2xs"
                            title="Click to mark as read"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Unread
                          </button>
                        ) : isReplied ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Replied
                          </span>
                        ) : (
                          <button
                            onClick={() => handleStatusUpdate(msg.id, 'unread')}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-medium hover:bg-slate-200 transition-colors"
                            title="Click to mark as unread"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            Read
                          </button>
                        )}
                      </td>

                      {/* Sender */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                            isUnread ? 'bg-blue-600 text-white border-blue-700 shadow-xs' : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <p className={`font-bold text-gray-900 ${isUnread ? 'text-blue-900' : ''}`}>
                              {msg.name || 'Anonymous'}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">{msg.email}</p>
                            {msg.phone && <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{msg.phone}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Subject & Preview */}
                      <td className="px-6 py-4 max-w-md">
                        <p className={`font-bold text-gray-900 truncate ${isUnread ? 'text-blue-900' : ''}`}>
                          {msg.subject || 'No Subject Specified'}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {msg.message || 'No message content'}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-gray-500 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{msg.created_at ? new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedMessage(msg);
                              if (isUnread) handleStatusUpdate(msg.id, 'read');
                            }}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Read Message"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Reply via Zoho Modal Button */}
                          <button
                            onClick={() => openReplyModal(msg)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all group-hover:scale-105"
                            title="Reply via Zoho Mail"
                          >
                            <Send className="w-4 h-4 text-blue-600" />
                          </button>

                          <button
                            onClick={() => confirmDelete(msg)}
                            disabled={processingId === msg.id}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Delete Message"
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

      {/* Message Inspection Dossier Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">Inquiry Dossier</h2>
                  <p className="text-xs text-gray-500">
                    Received {selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleString() : ''}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMessage(null)} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Sender Info Card */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">From Sender</p>
                  <p className="font-bold text-gray-900 text-base">{selectedMessage.name}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                    <span className="font-mono flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {selectedMessage.email}
                    </span>
                    {selectedMessage.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {selectedMessage.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => handleCopy(selectedMessage.email, 'modal-email')}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    {copiedText === 'modal-email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Email</span>
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Subject</p>
                <p className="font-extrabold text-gray-900 text-base">{selectedMessage.subject || 'No Subject'}</p>
              </div>

              {/* Message Content */}
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5">Inquiry Content</p>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {selectedMessage.status !== 'replied' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedMessage.id, 'replied')}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Replied
                    </button>
                  )}
                  {selectedMessage.status === 'unread' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedMessage.id, 'read')}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Reply via Zoho Mail Button */}
                  <button
                    onClick={() => {
                      const msg = selectedMessage;
                      setSelectedMessage(null);
                      openReplyModal(msg);
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Reply via Zoho Mail
                  </button>
                  <button
                    onClick={() => {
                      const msg = selectedMessage;
                      setSelectedMessage(null);
                      confirmDelete(msg);
                    }}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Delete Message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-App Zoho Mail Reply Modal */}
      {replyModal.show && replyModal.message && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Reply via Zoho Mail</h3>
                  <p className="text-xs text-blue-100">Send direct response to {replyModal.message.name || replyModal.to}</p>
                </div>
              </div>
              <button 
                onClick={() => setReplyModal(prev => ({ ...prev, show: false }))} 
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="zoho-reply-form" onSubmit={handleSendReply} className="p-6 overflow-y-auto space-y-4">
              {/* Error Notice */}
              {replyModal.error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="block font-bold">Failed to send reply</strong>
                    <span className="mt-0.5 block leading-relaxed">{replyModal.error}</span>
                  </div>
                </div>
              )}

              {/* To & Subject Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={replyModal.to}
                    onChange={(e) => setReplyModal(prev => ({ ...prev, to: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={replyModal.subject}
                    onChange={(e) => setReplyModal(prev => ({ ...prev, subject: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Original Inquiry Preview Collapsible */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer Inquiry:</span>
                <p className="text-slate-700 italic max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  "{replyModal.message.message}"
                </p>
              </div>

              {/* Quick Response Templates */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Quick Snippets:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyReplySnippet('solved')}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    ✓ Issue Solved
                  </button>
                  <button
                    type="button"
                    onClick={() => applyReplySnippet('order')}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    📦 Order Update
                  </button>
                  <button
                    type="button"
                    onClick={() => applyReplySnippet('details')}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    ℹ️ Need More Info
                  </button>
                </div>
              </div>

              {/* Reply Body */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Your Reply Message
                </label>
                <textarea
                  rows={8}
                  value={replyModal.replyText}
                  onChange={(e) => setReplyModal(prev => ({ ...prev, replyText: e.target.value }))}
                  required
                  placeholder="Type your reply to the customer..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-xs font-normal leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y"
                />
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Sent via official Zoho SMTP
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReplyModal(prev => ({ ...prev, show: false }))}
                  className="px-4 py-2 bg-gray-200/80 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="zoho-reply-form"
                  disabled={replyModal.sending || !replyModal.replyText || !replyModal.to}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {replyModal.sending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Reply...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Reply via Zoho</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.message && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Trash2 className="w-7 h-7 stroke-[1.75]" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-1">Delete Message?</h3>
            <p className="text-gray-500 text-xs mb-6 leading-relaxed">
              Are you sure you want to permanently delete this message from <span className="font-bold text-gray-800">{deleteModal.message.name || deleteModal.message.email}</span>?
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setDeleteModal({ show: false, message: null })}
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
    </div>
  );
}