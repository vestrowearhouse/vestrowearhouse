'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Star, MessageSquare, CheckCircle2, XCircle, Trash2,
  Reply, Filter, Search, RefreshCw, ChevronLeft, ChevronRight,
  Eye, Clock, User, Package, AlertCircle
} from 'lucide-react';

const STATUS_COLORS = {
  approved: 'bg-green-100 text-green-700 border-green-200',
  pending:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  answered: 'bg-blue-100 text-blue-700 border-blue-200',
};

function StarRow({ rating, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`${sz} ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </div>
  );
}

function Badge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────
// REVIEWS TAB
// ──────────────────────────────────────────────────────────────
function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (filterStatus) params.set('status', filterStatus);
    const res = await fetch(`/api/admin/reviews?${params}`);
    const data = await res.json();
    setReviews(data.reviews || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const updateReview = async (id, updates) => {
    setSaving(true);
    await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setSaving(false);
    load();
  };

  const deleteReview = async (id) => {
    if (!confirm('এই review টি delete করবেন?')) return;
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    load();
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await updateReview(replyModal.id, { admin_reply: replyText.trim() });
    setReplyModal(null);
    setReplyText('');
  };

  const filtered = reviews.filter(r =>
    !search || r.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.comment?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
            placeholder="Search reviews..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white"
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={load} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total', val: total, color: 'blue' },
          { label: 'Pending', val: reviews.filter(r => r.status === 'pending').length, color: 'yellow' },
          { label: 'Approved', val: reviews.filter(r => r.status === 'approved').length, color: 'green' },
        ].map(s => (
          <div key={s.label} className={`p-3 rounded-xl bg-${s.color}-50 border border-${s.color}-100`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-800">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No reviews found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(rev => (
            <div key={rev.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm text-gray-800">{rev.customer_name}</span>
                    {rev.verified_purchase && (
                      <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full font-medium">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                      </span>
                    )}
                    <Badge status={rev.status} />
                    <StarRow rating={rev.rating} />
                  </div>
                  <p className="text-sm text-gray-700 mb-1 line-clamp-2">{rev.comment}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(rev.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' · Product ID: '}{rev.product_id?.slice(0,8)}...
                  </p>
                  {rev.admin_reply && (
                    <div className="mt-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-xs font-semibold text-blue-700 mb-0.5">Admin Reply:</p>
                      <p className="text-xs text-blue-800">{rev.admin_reply}</p>
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div className="flex gap-1.5 flex-shrink-0">
                  {rev.status !== 'approved' && (
                    <button
                      title="Approve"
                      onClick={() => updateReview(rev.id, { status: 'approved' })}
                      className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  {rev.status !== 'rejected' && (
                    <button
                      title="Reject"
                      onClick={() => updateReview(rev.id, { status: 'rejected' })}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    title="Reply"
                    onClick={() => { setReplyModal(rev); setReplyText(rev.admin_reply || ''); }}
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                  <button
                    title="Delete"
                    onClick={() => deleteReview(rev.id)}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-gray-800 mb-1">Reply to Review</h3>
            <p className="text-xs text-gray-500 mb-3">by {replyModal.customer_name}</p>
            <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm text-gray-700 italic">
              "{replyModal.comment}"
            </div>
            <textarea
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              placeholder="Type your reply..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setReplyModal(null); setReplyText(''); }}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={saving || !replyText.trim()}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// QUESTIONS TAB
// ──────────────────────────────────────────────────────────────
function QuestionsTab() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [answerModal, setAnswerModal] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [saving, setSaving] = useState(false);
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (filterStatus) params.set('status', filterStatus);
    const res = await fetch(`/api/admin/questions?${params}`);
    const data = await res.json();
    setQuestions(data.questions || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const updateQuestion = async (id, updates) => {
    setSaving(true);
    await fetch(`/api/admin/questions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setSaving(false);
    load();
  };

  const deleteQuestion = async (id) => {
    if (!confirm('এই question টি delete করবেন?')) return;
    await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
    load();
  };

  const handleAnswer = async () => {
    if (!answerText.trim()) return;
    await updateQuestion(answerModal.id, {
      answer: answerText.trim(),
      answerer: 'StellarMart Official',
      answered_by: 'admin',
    });
    setAnswerModal(null);
    setAnswerText('');
  };

  const filtered = questions.filter(q =>
    !search ||
    q.question?.toLowerCase().includes(search.toLowerCase()) ||
    q.asker_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / LIMIT);
  const pendingCount = questions.filter(q => q.status === 'pending').length;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
            placeholder="Search questions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white"
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="answered">Answered</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={load} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total', val: total, color: 'blue' },
          { label: 'Unanswered', val: pendingCount, color: 'yellow' },
          { label: 'Answered', val: questions.filter(q => q.status === 'answered').length, color: 'green' },
        ].map(s => (
          <div key={s.label} className={`p-3 rounded-xl bg-${s.color}-50 border border-${s.color}-100`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-800">{s.val}</p>
          </div>
        ))}
      </div>

      {pendingCount > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span><strong>{pendingCount}</strong> টি প্রশ্নের উত্তর এখনো দেওয়া হয়নি।</span>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No questions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => (
            <div key={q.id} className={`bg-white border rounded-xl p-4 shadow-sm transition-shadow hover:shadow-md ${q.status === 'pending' ? 'border-amber-200' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm text-gray-800">{q.asker_name}</span>
                    <Badge status={q.status} />
                  </div>
                  <p className="text-sm text-gray-800 font-medium mb-1">Q: {q.question}</p>
                  <p className="text-xs text-gray-400 mb-2">
                    {new Date(q.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' · Product: '}{q.product_id?.slice(0,8)}...
                  </p>

                  {q.answer ? (
                    <div className="p-2.5 bg-green-50 border border-green-100 rounded-lg">
                      <p className="text-xs font-semibold text-green-700 mb-0.5">
                        A: {q.answerer} {q.answered_by === 'vendor' ? '(Vendor)' : '(Admin)'}
                      </p>
                      <p className="text-xs text-green-800">{q.answer}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 italic">— No answer yet</p>
                  )}
                </div>
                {/* Actions */}
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    title="Answer"
                    onClick={() => { setAnswerModal(q); setAnswerText(q.answer || ''); }}
                    className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                  {q.status !== 'rejected' && (
                    <button
                      title="Reject"
                      onClick={() => updateQuestion(q.id, { status: 'rejected' })}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    title="Delete"
                    onClick={() => deleteQuestion(q.id)}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Answer Modal */}
      {answerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-gray-800 mb-1">Answer Question</h3>
            <p className="text-xs text-gray-500 mb-3">by {answerModal.asker_name}</p>
            <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm text-gray-700 font-medium">
              Q: {answerModal.question}
            </div>
            <textarea
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              placeholder="Type your answer..."
              value={answerText}
              onChange={e => setAnswerText(e.target.value)}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setAnswerModal(null); setAnswerText(''); }}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAnswer}
                disabled={saving || !answerText.trim()}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Submit Answer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────────────────────
export default function ReviewsQAAdminPage() {
  const [activeTab, setActiveTab] = useState('reviews');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reviews & Q&A Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer reviews and product questions from here</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white border border-gray-200 rounded-xl mb-6 w-fit shadow-sm">
          {[
            { key: 'reviews', label: 'Customer Reviews', icon: Star },
            { key: 'questions', label: 'Product Q&A', icon: MessageSquare },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {activeTab === 'reviews' ? <ReviewsTab /> : <QuestionsTab />}
        </div>
      </div>
    </div>
  );
}
