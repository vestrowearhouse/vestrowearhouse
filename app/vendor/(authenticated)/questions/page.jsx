'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  HelpCircle, Reply, CheckCircle2, Clock, RefreshCw,
  Search, AlertCircle, MessageSquare, ChevronLeft, ChevronRight
} from 'lucide-react';

function Badge({ status }) {
  const map = {
    pending:  'bg-amber-100 text-amber-700 border-amber-200',
    answered: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

export default function VendorQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [answerModal, setAnswerModal] = useState(null);
  const [answerText, setAnswerText]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [vendorInfo, setVendorInfo]   = useState(null);
  const LIMIT = 15;

  // Load vendor info
  useEffect(() => {
    fetch('/api/vendor/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.vendor) setVendorInfo(d.vendor); })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch questions for vendor's products
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filterStatus) params.set('status', filterStatus);
      if (vendorInfo?.id) params.set('vendor_id', vendorInfo.id);

      const res = await fetch(`/api/vendor/questions?${params}`, { credentials: 'include' });
      const data = await res.json();
      setQuestions(data.questions || []);
      setTotal(data.total || 0);
    } catch {
      setQuestions([]);
    }
    setLoading(false);
  }, [page, filterStatus, vendorInfo]);

  useEffect(() => { if (vendorInfo) load(); }, [load, vendorInfo]);

  const handleAnswer = async () => {
    if (!answerText.trim() || !answerModal) return;
    setSaving(true);
    try {
      await fetch(`/api/vendor/questions/${answerModal.id}/answer`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: answerText.trim(),
          vendor_name: vendorInfo?.shop_name || vendorInfo?.name || 'Store Official',
          vendor_id: vendorInfo?.id,
        }),
      });
      setAnswerModal(null);
      setAnswerText('');
      load();
    } catch (e) {
      alert('Failed to save answer. Please try again.');
    }
    setSaving(false);
  };

  const filtered = questions.filter(q =>
    !search ||
    q.question?.toLowerCase().includes(search.toLowerCase()) ||
    q.asker_name?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = questions.filter(q => q.status === 'pending').length;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-600" />
            Customer Q&amp;A
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Answer customer questions about your products
          </p>
        </div>

        {/* Alert for unanswered */}
        {pendingCount > 0 && (
          <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-sm text-amber-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>
              <strong>{pendingCount}</strong> টি প্রশ্নের উত্তর এখনো দেওয়া হয়নি।
              দ্রুত উত্তর দিলে conversion rate বাড়ে!
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total Questions', val: total, color: 'blue' },
            { label: 'Unanswered', val: pendingCount, color: 'yellow' },
            { label: 'Answered', val: questions.filter(q => q.status === 'answered').length, color: 'green' },
          ].map(s => (
            <div key={s.label} className={`p-3.5 rounded-xl bg-${s.color}-50 border border-${s.color}-100`}>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-800">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
              placeholder="Search questions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="">All</option>
            <option value="pending">Unanswered</option>
            <option value="answered">Answered</option>
          </select>
          <button onClick={load} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No questions yet</p>
              <p className="text-xs mt-1 text-gray-300">Questions from customers will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(q => (
                <div
                  key={q.id}
                  className={`p-4 hover:bg-gray-50/50 transition-colors ${q.status === 'pending' ? 'border-l-4 border-l-amber-400' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                          {q.asker_name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <span className="font-semibold text-sm text-gray-800">{q.asker_name}</span>
                        <Badge status={q.status} />
                        <span className="text-xs text-gray-400">
                          {new Date(q.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Question */}
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">Q</span>
                        <p className="text-sm text-gray-800 font-medium">{q.question}</p>
                      </div>

                      {/* Answer */}
                      {q.answer ? (
                        <div className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg p-2.5">
                          <span className="text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">A</span>
                          <div>
                            <p className="text-xs text-green-800">{q.answer}</p>
                            <p className="text-[10px] text-green-500 mt-1">
                              — {q.answerer}
                              {q.answered_at && ` · ${new Date(q.answered_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-500 italic">⏳ Awaiting your answer...</p>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => { setAnswerModal(q); setAnswerText(q.answer || ''); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
                        q.status === 'pending'
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Reply className="w-3.5 h-3.5" />
                      {q.status === 'pending' ? 'Answer' : 'Edit'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 bg-white">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 bg-white">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Answer Modal */}
      {answerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <h3 className="font-bold text-gray-800 text-lg mb-1 flex items-center gap-2">
              <Reply className="w-5 h-5 text-amber-600" />
              Answer Question
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              From: <strong>{answerModal.asker_name}</strong> ·{' '}
              {new Date(answerModal.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>

            {/* Question display */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 mb-4">
              <p className="text-xs font-semibold text-amber-600 mb-1">Customer Question:</p>
              <p className="text-sm text-gray-800 font-medium">{answerModal.question}</p>
            </div>

            <textarea
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400 resize-none"
              placeholder="Type your answer here... Be helpful and detailed!"
              value={answerText}
              onChange={e => setAnswerText(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              Your answer will show as: <strong>{vendorInfo?.shop_name || 'Store Official'}</strong>
            </p>

            <div className="flex gap-2.5 mt-4">
              <button
                onClick={() => { setAnswerModal(null); setAnswerText(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAnswer}
                disabled={saving || !answerText.trim()}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : '✓ Submit Answer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
