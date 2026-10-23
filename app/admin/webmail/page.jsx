'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Send, 
  User, 
  AlignLeft, 
  Loader2, 
  MailCheck, 
  AlertCircle, 
  ExternalLink, 
  Sparkles, 
  FileText, 
  X,
  ShieldCheck,
  Mail,
  Inbox,
  RefreshCw,
  Search,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Phone,
  MessageSquare,
  CornerUpLeft,
  ChevronRight,
  Info
} from 'lucide-react';

const SENDER_EMAIL = 'support@stellarmartbd.com';
const SENDER_NAME = 'StellarMartBD';

const EMAIL_TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Message',
    icon: '✏️',
    subject: '',
    body: ''
  },
  {
    id: 'order_update',
    name: 'Order Update',
    icon: '📦',
    subject: 'Update Regarding Your Order - Stellar Mart BD',
    body: `Dear Customer,

We are writing to update you on your recent order at Stellar Mart BD.

Your order is currently being processed and prepared for swift dispatch. You will receive an SMS and email notification with tracking details as soon as it is handed over to our courier partner.

If you have any questions or require any changes, please feel free to reply to this email or reach us at support@stellarmartbd.com.

Warm regards,
Customer Experience Team
Stellar Mart BD`
  },
  {
    id: 'support_reply',
    name: 'Support Response',
    icon: '💬',
    subject: 'Response to your Inquiry - Stellar Mart BD',
    body: `Dear Customer,

Thank you for reaching out to Stellar Mart BD Support.

Regarding your recent query, we have reviewed your request and would like to inform you that our support team is actively assisting you.

Please let us know if you need any additional information or further assistance. We are always glad to help!

Best regards,
Stellar Mart BD Support Team`
  },
  {
    id: 'promotional_voucher',
    name: 'Special Offer / Coupon',
    icon: '🎁',
    subject: 'Special Surprise: Exclusive Discount Voucher Just For You! 🎉',
    body: `Hello valued shopper,

Thank you for being a part of the Stellar Mart BD family!

As a token of our appreciation, we are delighted to offer you an exclusive discount voucher for your next order on our website:

Coupon Code: SPECIAL10
Discount: 10% OFF on all qualifying products

Visit us today at https://stellarmartbd.com and enjoy premium shopping with the best deals across Bangladesh.

Happy Shopping,
The Stellar Mart BD Team`
  },
  {
    id: 'delivery_notice',
    name: 'Delivery Attempt Notice',
    icon: '🚚',
    subject: 'Delivery Notification for Your Package - Stellar Mart BD',
    body: `Dear Customer,

Our delivery partner is scheduled to attempt delivery for your package today.

Please ensure someone is available at your delivery address to receive the parcel and complete any pending payment (if Cash on Delivery).

If you need to reschedule or share delivery directions, please reply to this email or contact our hotline directly.

Thank you for choosing Stellar Mart BD!

Warm regards,
Logistics Team, Stellar Mart BD`
  }
];

export default function WebmailPage() {
  // Top-level View Mode: 'inbox' | 'compose'
  const [currentView, setCurrentView] = useState('inbox');

  // ==================== INBOX STATE ====================
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unread' | 'replied'
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, message: null });
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState(null);

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

  // ==================== COMPOSE STATE ====================
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: ''
  });
  const [composeMode, setComposeMode] = useState('compose'); // 'compose' | 'preview'
  const [sendStatus, setSendStatus] = useState('idle'); // 'idle' | 'sending' | 'success' | 'error'
  const [sendErrorMessage, setSendErrorMessage] = useState('');
  const [sendSuccessMessage, setSendSuccessMessage] = useState('');

  // Toast Helper
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch Inbox Messages
  const fetchMessages = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoadingMessages(true);
    try {
      const res = await fetch('/api/admin/contact?limit=250');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load inbox messages:', error);
      showToast('Failed to load incoming messages', 'error');
    } finally {
      setLoadingMessages(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Filtered Messages
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      const matchesSearch = 
        (msg.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (msg.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (msg.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (msg.message || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'unread' && (!msg.status || msg.status === 'unread')) ||
        (statusFilter === 'replied' && msg.status === 'replied');

      return matchesSearch && matchesStatus;
    });
  }, [messages, searchTerm, statusFilter]);

  const unreadCount = useMemo(() => {
    return messages.filter(m => !m.status || m.status === 'unread').length;
  }, [messages]);

  const repliedCount = useMemo(() => {
    return messages.filter(m => m.status === 'replied').length;
  }, [messages]);

  // Copy to clipboard
  const handleCopy = (text, id) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Mark message status
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
        showToast(`Marked as ${status}`);
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating status', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Delete message
  const handleDeleteMessage = async () => {
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
    } catch (err) {
      console.error(err);
      showToast('Error deleting message', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Open Reply Modal for a Message
  const openReplyModal = (msg) => {
    const customerName = msg.name || 'Valued Customer';
    const cleanSubject = msg.subject || 'Your inquiry at Stellar Mart BD';
    const replySubject = cleanSubject.toLowerCase().startsWith('re:') ? cleanSubject : `Re: ${cleanSubject}`;
    const initialText = `Dear ${customerName},\n\nThank you for reaching out to Stellar Mart BD Support.\n\n\n\nWarm regards,\nCustomer Support Team\nStellar Mart BD`;

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

  // Apply Quick Reply Snippet
  const applyReplySnippet = (type) => {
    if (!replyModal.message) return;
    const name = replyModal.message.name || 'Customer';

    if (type === 'solved') {
      setReplyModal(prev => ({
        ...prev,
        replyText: `Dear ${name},\n\nThank you for reaching out to Stellar Mart BD. We have reviewed your inquiry and have resolved the matter.\n\nIf you have any further questions or need additional support, please feel free to reply to this email anytime.\n\nWarm regards,\nCustomer Support Team\nStellar Mart BD`
      }));
    } else if (type === 'order') {
      setReplyModal(prev => ({
        ...prev,
        replyText: `Dear ${name},\n\nThank you for getting in touch regarding your order inquiry. Our fulfillment and logistics team is currently reviewing your order status and will provide a detailed update shortly.\n\nThank you for your patience and for shopping with Stellar Mart BD.\n\nWarm regards,\nCustomer Support Team\nStellar Mart BD`
      }));
    } else if (type === 'details') {
      setReplyModal(prev => ({
        ...prev,
        replyText: `Dear ${name},\n\nThank you for reaching out to us. To assist you as quickly and accurately as possible, could you kindly reply to this email with your order number or registered phone number?\n\nLooking forward to hearing from you.\n\nWarm regards,\nCustomer Support Team\nStellar Mart BD`
      }));
    }
  };

  // Send Reply via Zoho SMTP
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
          <strong>From:</strong> ${origMsg?.name || 'Anonymous'} &lt;${origMsg?.email || ''}&gt;<br/>
          <strong>Subject:</strong> ${origMsg?.subject || 'No Subject'}<br/>
          <strong>Date:</strong> ${origMsg?.created_at ? new Date(origMsg.created_at).toLocaleString() : 'N/A'}<br/>
          <br/>
          <div style="padding: 12px 16px; background-color: #f8fafc; border-left: 3px solid #3b82f6; border-radius: 6px; font-style: italic; color: #334155;">
            ${(origMsg?.message || '').replace(/\n/g, '<br/>')}
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

      if (origMsg?.id) {
        await handleStatusUpdate(origMsg.id, 'replied');
      }

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

  // Compose Template Selection
  const handleTemplateSelect = (template) => {
    if (template.id === 'blank') {
      setFormData(prev => ({ ...prev, subject: '', message: '' }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      subject: template.subject,
      message: template.body
    }));
  };

  // Send Fresh Compose Email
  const handleSendCompose = async (e) => {
    e.preventDefault();
    if (!formData.to || !formData.subject || !formData.message) return;

    setSendStatus('sending');
    setSendErrorMessage('');
    setSendSuccessMessage('');

    try {
      const formattedHtml = `
        <div style="font-family: inherit; line-height: 1.6; color: #334155; white-space: pre-wrap;">
          ${formData.message.replace(/\n/g, '<br/>')}
        </div>
      `;

      const res = await fetch('/api/webmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.to.trim(),
          subject: formData.subject.trim(),
          message: formattedHtml,
          plainText: formData.message
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch email');
      }

      setSendStatus('success');
      setSendSuccessMessage(`Email sent successfully to ${formData.to} via Zoho Mail!`);
      setFormData({ to: '', subject: '', message: '' });
      setComposeMode('compose');

      setTimeout(() => {
        setSendStatus('idle');
        setSendSuccessMessage('');
      }, 6000);
    } catch (error) {
      console.error(error);
      setSendStatus('error');
      setSendErrorMessage(error.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-3 sm:px-4 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm font-semibold text-white animate-in slide-in-from-bottom-3 ${
          toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Zoho Mail Connected (100% Free Integration)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Mail className="w-7 h-7 text-sky-300" />
              Webmail Hub & Inbox
            </h1>
            <p className="text-blue-100 text-sm sm:text-base max-w-2xl font-light">
              আপনার ওয়েবসাইটের ইনবক্স থেকে সরাসরি কাস্টমারদের ইনকামিং মেসেজ পড়ুন এবং জোহো মেইল (<span className="font-semibold text-white">{SENDER_EMAIL}</span>) দিয়ে ফ্রি-তে সরাসরি রিপ্লাই দিন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Sender Badge */}
            <div className="px-4 py-2.5 bg-emerald-500/20 text-emerald-100 rounded-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold border border-emerald-400/30 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{SENDER_EMAIL}</span>
            </div>

            {/* Direct Open Zoho Mail Link */}
            <Link
              href="https://mail.zoho.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Zoho.com</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Mode Navigation (Inbox vs Compose) */}
      <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="inline-flex gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setCurrentView('inbox')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              currentView === 'inbox'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>📥 Inbox (ইনবক্স)</span>
            {unreadCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                currentView === 'inbox' ? 'bg-white text-blue-700' : 'bg-rose-500 text-white'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('compose')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              currentView === 'compose'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>📤 Compose & Send (মেইল পাঠান)</span>
          </button>
        </div>

        {currentView === 'inbox' && (
          <button
            type="button"
            onClick={() => fetchMessages(true)}
            disabled={refreshing}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* ======================= VIEW: INBOX ===================== */}
      {/* ========================================================= */}
      {currentView === 'inbox' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Quick Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Received</p>
                <h3 className="text-2xl font-black text-gray-900 mt-0.5">{messages.length}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unread / Pending</p>
                <h3 className="text-2xl font-black text-amber-600 mt-0.5">{unreadCount}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Replied via Zoho</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{repliedCount}</h3>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by sender, email, subject..."
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
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

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({messages.length})
              </button>

              <button
                onClick={() => setStatusFilter('unread')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'unread'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Unread ({unreadCount})
              </button>

              <button
                onClick={() => setStatusFilter('replied')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'replied'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Replied ({repliedCount})
              </button>
            </div>
          </div>

          {/* Messages List / Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {loadingMessages ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm font-semibold text-gray-500">Loading incoming messages...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
                  <Inbox className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-gray-800">No Messages Found</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                  {searchTerm 
                    ? `No messages matched "${searchTerm}". Try a different keyword.`
                    : 'There are no incoming messages in your Webmail Inbox at this time.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredMessages.map((msg) => {
                  const isUnread = !msg.status || msg.status === 'unread';
                  const isReplied = msg.status === 'replied';

                  return (
                    <div
                      key={msg.id}
                      className={`p-4 sm:p-5 transition-all hover:bg-blue-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isUnread ? 'bg-sky-50/30 font-medium' : 'bg-white'
                      }`}
                    >
                      {/* Sender Info & Snippet */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-extrabold shrink-0 shadow-xs ${
                          isUnread 
                            ? 'bg-blue-600 text-white' 
                            : isReplied 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {(msg.name || 'C').charAt(0).toUpperCase()}
                        </div>

                        {/* Text Block */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-extrabold text-sm text-gray-900 truncate">
                              {msg.name || 'Anonymous User'}
                            </span>

                            {/* Status Badge */}
                            {isUnread ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                Unread
                              </span>
                            ) : isReplied ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" />
                                Replied
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                                Read
                              </span>
                            )}

                            <span className="text-[11px] text-gray-400 ml-auto">
                              {msg.created_at ? new Date(msg.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : ''}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-1.5">
                            <span className="font-mono text-gray-700 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {msg.email}
                            </span>
                            {msg.phone && (
                              <span className="font-mono text-gray-700 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-gray-400" />
                                {msg.phone}
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-gray-800 truncate mb-1">
                            {msg.subject || '(No Subject)'}
                          </h4>

                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {msg.message}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                        {/* Read Full Message Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => setSelectedMessage(msg)}
                          className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5"
                          title="View Message Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-600" />
                          <span>View</span>
                        </button>

                        {/* Reply via Zoho Mail Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => openReplyModal(msg)}
                          className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                          title="Send Reply via Zoho Mail"
                        >
                          <CornerUpLeft className="w-3.5 h-3.5 text-blue-600" />
                          <span>Reply via Zoho</span>
                        </button>

                        {/* Mark Read/Replied Toggle */}
                        {isUnread ? (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(msg.id, 'read')}
                            disabled={processingId === msg.id}
                            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                            title="Mark as Read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        ) : null}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setDeleteModal({ show: true, message: msg })}
                          className="p-2 rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
                          title="Delete message"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Free Sync Tip Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-5 sm:p-6 text-gray-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-blue-950">
                  How incoming messages work (100% Free Forever)
                </h4>
                <p className="text-xs text-blue-900/80 leading-relaxed max-w-3xl">
                  ১. আপনার ওয়েবসাইটের Contact Form এবং যেকোনো কাস্টমার ইনকোয়ারি সরাসরি এই ইনবক্সে জমা হয়।<br/>
                  ২. আপনি এখান থেকেই <strong className="text-blue-950">Reply via Zoho</strong> বাটনে ক্লিক করে সরাসরি <code className="bg-white/80 px-1 py-0.5 rounded text-blue-900 font-mono text-[11px] font-bold">support@stellarmartbd.com</code> থেকে ফ্রি-তে গ্রাহককে রিপ্লাই পাঠাতে পারবেন।<br/>
                  ৩. এছাড়াও যদি সরাসরি Zoho-তে আসা মেইল অটোমেটিক এখানে আনতে চান, Zoho Mail Settings &gt; Email Forwarding থেকে আপনার ইনবাউন্ড ওয়েবহুকে <code className="bg-white/80 px-1 py-0.5 rounded text-blue-900 font-mono text-[11px]">https://www.stellarmartbd.com/api/webhooks/inbound-email</code> ফরওয়ার্ড করতে পারেন।
                </p>
              </div>
            </div>

            <Link
              href="https://mail.zoho.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 transition-all"
            >
              <span>Zoho Mail Login</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ====================== VIEW: COMPOSE ==================== */}
      {/* ========================================================= */}
      {currentView === 'compose' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Success Notification */}
          {sendStatus === 'success' && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-2xl flex items-center gap-3 shadow-xs animate-in slide-in-from-top-2">
              <MailCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-sm">Email Dispatched Successfully!</h3>
                <p className="text-xs text-emerald-700 mt-0.5">{sendSuccessMessage}</p>
              </div>
              <button onClick={() => setSendStatus('idle')} className="text-emerald-500 hover:text-emerald-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error Notification */}
          {sendStatus === 'error' && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-4 rounded-2xl flex items-start gap-3 shadow-xs animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-sm">Failed to Send Email</h3>
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{sendErrorMessage}</p>
              </div>
              <button onClick={() => setSendStatus('idle')} className="text-rose-400 hover:text-rose-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Template Quick Selector Bar */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Quick Templates
              </span>
              <span className="text-[11px] text-gray-400">Click a template to populate the message</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {EMAIL_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleTemplateSelect(tmpl)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 active:scale-95 text-xs font-semibold text-gray-700 transition-all flex items-center gap-1.5"
                >
                  <span>{tmpl.icon}</span>
                  <span>{tmpl.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Composer Box */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Composer Header Bar */}
            <div className="bg-gray-50/80 border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800 text-sm">New Outgoing Message</span>
                <span className="text-gray-300">|</span>
                <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  From: <strong className="text-gray-700">{SENDER_EMAIL}</strong>
                </span>
              </div>

              {/* Mode Switcher (Compose vs Preview) */}
              <div className="inline-flex bg-gray-200/70 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setComposeMode('compose')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    composeMode === 'compose' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Compose
                </button>
                <button
                  type="button"
                  onClick={() => setComposeMode('preview')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    composeMode === 'preview' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Live Preview
                </button>
              </div>
            </div>

            {composeMode === 'compose' ? (
              <form onSubmit={handleSendCompose} className="p-6 space-y-5">
                {/* Recipient Field */}
                <div>
                  <label className="flex items-center text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    <User className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    Recipient Email <span className="text-rose-500 ml-1">*</span>
                  </label>
                  <input
                    type="email"
                    name="to"
                    value={formData.to}
                    onChange={(e) => setFormData(p => ({ ...p, to: e.target.value }))}
                    placeholder="customer@example.com"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-gray-900 font-medium placeholder-gray-400"
                  />
                </div>

                {/* Subject Field */}
                <div>
                  <label className="flex items-center text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    <AlignLeft className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    Subject Line <span className="text-rose-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))}
                    placeholder="e.g. Update regarding your order #1234"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-gray-900 font-medium placeholder-gray-400"
                  />
                </div>

                {/* Message Body Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Message Content <span className="text-rose-500 ml-1">*</span>
                    </label>
                    <span className="text-[11px] text-gray-400">
                      {formData.message.length} characters
                    </span>
                  </div>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                    rows={11}
                    placeholder="Write your email here..."
                    required
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-gray-900 font-normal leading-relaxed resize-y placeholder-gray-400"
                  />
                </div>

                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Protected by TLS/SSL SMTP via Zoho Mail</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setComposeMode('preview')}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Preview
                    </button>

                    <button
                      type="submit"
                      disabled={sendStatus === 'sending' || !formData.to || !formData.subject || !formData.message}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white px-7 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {sendStatus === 'sending' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending via Zoho...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Live Email Preview */
              <div className="p-6 bg-gray-50/50">
                <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
                  {/* Preview Email Header */}
                  <div className="bg-gradient-to-r from-blue-700 to-sky-600 p-6 text-white text-left flex items-center gap-3">
                    <img
                      src="/icons/icon-192x192.png"
                      alt="Stellar Mart BD"
                      className="w-11 h-11 rounded-xl bg-white p-0.5 object-contain border border-white/40 shadow-xs"
                    />
                    <div>
                      <h3 className="text-xl font-black tracking-tight m-0">Stellar Mart BD</h3>
                      <p className="text-xs text-blue-100 font-light mt-0.5">Customer Care & Support</p>
                    </div>
                  </div>

                  {/* Preview Metadata */}
                  <div className="p-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-600 space-y-1">
                    <div><strong>To:</strong> {formData.to || '(Recipient email)'}</div>
                    <div><strong>From:</strong> {SENDER_NAME} &lt;{SENDER_EMAIL}&gt;</div>
                    <div><strong>Subject:</strong> {formData.subject || '(Subject line)'}</div>
                  </div>

                  {/* Preview Body */}
                  <div className="p-6 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap min-h-[160px]">
                    {formData.message || '(Message body is currently blank)'}
                  </div>

                  {/* Preview Footer */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500">
                    <p className="m-0 font-medium">This email was sent from {SENDER_NAME} ({SENDER_EMAIL})</p>
                    <p className="text-[11px] text-gray-400 mt-1">Dhaka, Bangladesh • stellarmartbd.com</p>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setComposeMode('compose')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                  >
                    ← Back to Editing Message
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ================= MODAL: MESSAGE VIEWER ================= */}
      {/* ========================================================= */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-base">
                  {(selectedMessage.name || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">{selectedMessage.name || 'Anonymous User'}</h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedMessage.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-2xl">
                <div>
                  <span className="font-bold text-gray-400 uppercase tracking-wider block text-[10px]">Subject</span>
                  <span className="font-bold text-gray-800 mt-0.5 block">{selectedMessage.subject || '(No Subject)'}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-400 uppercase tracking-wider block text-[10px]">Received On</span>
                  <span className="text-gray-700 mt-0.5 block">
                    {selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
                {selectedMessage.phone && (
                  <div>
                    <span className="font-bold text-gray-400 uppercase tracking-wider block text-[10px]">Phone Number</span>
                    <span className="font-mono text-gray-800 mt-0.5 block">{selectedMessage.phone}</span>
                  </div>
                )}
                <div>
                  <span className="font-bold text-gray-400 uppercase tracking-wider block text-[10px]">Status</span>
                  <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide ${
                    selectedMessage.status === 'replied' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : (!selectedMessage.status || selectedMessage.status === 'unread')
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedMessage.status || 'unread'}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-gray-400 uppercase tracking-wider block text-[10px] mb-2">Message Body</span>
                <div className="bg-gray-50/70 p-5 rounded-2xl text-sm text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-200/60 font-normal">
                  {selectedMessage.message}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {(!selectedMessage.status || selectedMessage.status === 'unread') && (
                  <button
                    onClick={() => handleStatusUpdate(selectedMessage.id, 'read')}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Mark as Read
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const msg = selectedMessage;
                    setSelectedMessage(null);
                    openReplyModal(msg);
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all"
                >
                  <CornerUpLeft className="w-3.5 h-3.5" />
                  <span>Reply via Zoho Mail</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ================= MODAL: ZOHO IN-APP REPLY ============== */}
      {/* ========================================================= */}
      {replyModal.show && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  Zoho Mail Dispatch
                </div>
                <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                  <span>Reply to {replyModal.message?.name || 'Customer'}</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Sending from official address: <strong className="text-gray-800">{SENDER_EMAIL}</strong>
                </p>
              </div>
              <button
                onClick={() => setReplyModal(prev => ({ ...prev, show: false }))}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error in modal */}
            {replyModal.error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{replyModal.error}</span>
              </div>
            )}

            {/* Quick Snippets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Quick Reply Snippets
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyReplySnippet('solved')}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200/80"
                >
                  ✅ Issue Resolved
                </button>
                <button
                  type="button"
                  onClick={() => applyReplySnippet('order')}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200/80"
                >
                  📦 Order Update
                </button>
                <button
                  type="button"
                  onClick={() => applyReplySnippet('details')}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-200/80"
                >
                  🔍 Need Phone/Order ID
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSendReply} className="space-y-3.5 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={replyModal.to}
                  onChange={(e) => setReplyModal(prev => ({ ...prev, to: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={replyModal.subject}
                  onChange={(e) => setReplyModal(prev => ({ ...prev, subject: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Your Response Message
                </label>
                <textarea
                  rows={6}
                  value={replyModal.replyText}
                  onChange={(e) => setReplyModal(prev => ({ ...prev, replyText: e.target.value }))}
                  required
                  placeholder="Type your response here..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-normal focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                />
              </div>

              {/* Quoted original message snippet */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-xs text-gray-600">
                <span className="font-bold text-[11px] text-gray-500 block mb-1">
                  Quoting Original Inquiry in Footer:
                </span>
                <p className="line-clamp-2 italic text-gray-500">
                  &ldquo;{replyModal.message?.message}&rdquo;
                </p>
              </div>

              {/* Modal Actions */}
              <div className="border-t border-gray-100 pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReplyModal(prev => ({ ...prev, show: false }))}
                  disabled={replyModal.sending}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={replyModal.sending || !replyModal.to || !replyModal.replyText}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {replyModal.sending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending via Zoho...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Reply</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ================= MODAL: CONFIRM DELETE ================= */}
      {/* ========================================================= */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Delete Message?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete this message from &ldquo;{deleteModal.message?.name || 'Customer'}&rdquo;? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ show: false, message: null })}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteMessage}
                disabled={processingId === deleteModal.message?.id}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
