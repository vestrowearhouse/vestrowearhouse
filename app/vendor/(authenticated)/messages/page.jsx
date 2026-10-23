'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  Reply,
  CheckCircle2,
  Clock,
  User,
  ShoppingBag,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Inbox
} from 'lucide-react';

export default function VendorMessagesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // all, pending, replied
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vendor/messages', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const list = data.inquiries || [];
        setInquiries(list);
        if (list.length > 0 && !selectedInquiry) {
          setSelectedInquiry(list[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      showToast('Failed to load inquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedInquiry || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/vendor/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          inquiryId: selectedInquiry.id,
          replyText: replyText.trim()
        })
      });

      if (res.ok) {
        const updatedList = inquiries.map(item => {
          if (item.id === selectedInquiry.id) {
            return {
              ...item,
              status: 'replied',
              is_read: true,
              reply: replyText.trim()
            };
          }
          return item;
        });

        setInquiries(updatedList);
        setSelectedInquiry(prev => ({
          ...prev,
          status: 'replied',
          is_read: true,
          reply: replyText.trim()
        }));
        setReplyText('');
        showToast('Reply dispatched to customer successfully!');
      } else {
        showToast('Failed to deliver reply', 'error');
      }
    } catch (err) {
      console.error('Reply error:', err);
      showToast('Error sending reply', 'error');
    } finally {
      setSending(false);
    }
  };

  const quickTemplates = [
    'Yes, this item is 100% genuine and covered by 1-year brand warranty.',
    'This product is in stock and ready for same-day handover to courier.',
    'Delivery inside Dhaka takes 24-48 hours, and outside Dhaka 2-4 days.',
    'Thank you for reaching out! We can offer a special 10% coupon for bulk orders.'
  ];

  const filteredInquiries = inquiries.filter(item => {
    if (filterTab === 'pending' && item.status !== 'pending') return false;
    if (filterTab === 'replied' && item.status !== 'replied') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = item.customer_name?.toLowerCase().includes(q);
      const matchSubject = item.subject?.toLowerCase().includes(q);
      const matchProduct = item.product_title?.toLowerCase().includes(q);
      const matchContent = item.content?.toLowerCase().includes(q);
      return matchName || matchSubject || matchProduct || matchContent;
    }
    return true;
  });

  const pendingCount = inquiries.filter(i => i.status === 'pending').length;
  const repliedCount = inquiries.filter(i => i.status === 'replied').length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 transition-all ${
          toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          {toast.msg}
        </div>
      )}

      {/* Top Banner / KPIs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-blue-600" />
            Customer Inquiries & Messages
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Direct pre-sale questions, product inquiries, and buyer requests
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMessages}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Inquiries</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{inquiries.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Awaiting Reply</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Resolved & Replied</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{repliedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content: Split Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Column: Inquiry List */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          {/* Search & Tabs */}
          <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by customer, subject, product..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
              />
            </div>

            <div className="flex gap-1.5 p-1 bg-gray-200/60 rounded-lg text-xs font-medium">
              <button
                onClick={() => setFilterTab('all')}
                className={`flex-1 py-1.5 rounded-md transition-all ${filterTab === 'all' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'}`}
              >
                All ({inquiries.length})
              </button>
              <button
                onClick={() => setFilterTab('pending')}
                className={`flex-1 py-1.5 rounded-md transition-all ${filterTab === 'pending' ? 'bg-white text-amber-700 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setFilterTab('replied')}
                className={`flex-1 py-1.5 rounded-md transition-all ${filterTab === 'replied' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Replied ({repliedCount})
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs">Loading conversations...</span>
              </div>
            ) : filteredInquiries.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <MessageSquare className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-semibold">No inquiries found</p>
              </div>
            ) : (
              filteredInquiries.map((item) => {
                const isSelected = selectedInquiry?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedInquiry(item)}
                    className={`p-4 cursor-pointer transition-all hover:bg-blue-50/40 ${
                      isSelected ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                          {item.customer_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{item.customer_name}</p>
                          <p className="text-[10px] text-gray-400">{item.customer_email}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        item.status === 'replied'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700 animate-pulse'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-gray-800 mt-2 line-clamp-1">
                      {item.subject}
                    </p>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                      {item.content}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-gray-100/80 flex items-center justify-between text-[10px] text-gray-400">
                      <span className="flex items-center gap-1 text-gray-600 truncate max-w-[180px]">
                        <ShoppingBag className="w-3 h-3 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{item.product_title}</span>
                      </span>
                      <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Inquiry Details & Reply Box */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          {selectedInquiry ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-gray-900">{selectedInquiry.subject}</h2>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      selectedInquiry.status === 'replied' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedInquiry.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">{selectedInquiry.customer_name}</span>
                    <span>•</span>
                    <span>{selectedInquiry.customer_email}</span>
                    <span>•</span>
                    <span>{new Date(selectedInquiry.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Product Context Banner */}
              <div className="px-4 py-2.5 bg-blue-50/50 border-b border-blue-100/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-blue-900 font-medium">
                  <ShoppingBag className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Referenced Item: <strong className="font-semibold text-blue-950">{selectedInquiry.product_title}</strong></span>
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-200">
                  Pre-Sale Inquiry
                </span>
              </div>

              {/* Message Thread Body */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gray-50/20">
                {/* Customer Message */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {selectedInquiry.customer_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-200/80 shadow-sm max-w-xl">
                      <p className="text-xs font-semibold text-gray-500 mb-1">{selectedInquiry.customer_name}</p>
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{selectedInquiry.content}</p>
                    </div>
                  </div>
                </div>

                {/* Existing Reply if any */}
                {selectedInquiry.reply && (
                  <div className="flex items-start gap-3 justify-end">
                    <div className="flex-1 flex justify-end">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 rounded-2xl rounded-tr-none shadow-sm max-w-xl">
                        <div className="flex items-center gap-1.5 text-blue-100 text-xs font-semibold mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Official Merchant Reply</span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-line text-white">{selectedInquiry.reply}</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      You
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Composer Form */}
              <div className="p-4 border-t border-gray-100 bg-white space-y-3">
                {/* Quick Templates */}
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Quick Responses (Click to insert):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickTemplates.map((template, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReplyText(template)}
                        className="text-[10px] px-2.5 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-transparent rounded-full text-gray-600 transition-all font-medium text-left truncate max-w-[260px]"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <form onSubmit={handleSendReply} className="space-y-2">
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={`Reply to ${selectedInquiry.customer_name}...`}
                      className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">
                      Replies are sent directly to customer via email and in-app message
                    </span>
                    <button
                      type="submit"
                      disabled={!replyText.trim() || sending}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                    >
                      {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Send Reply
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
              <Inbox className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-600">Select an inquiry to view details</p>
              <p className="text-xs text-gray-400 mt-1">You will be able to review customer queries and post replies</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
