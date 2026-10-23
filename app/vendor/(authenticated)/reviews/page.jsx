'use client';

import { useState, useEffect } from 'react';
import { 
  Star, 
  Loader2, 
  AlertCircle, 
  MessageSquare, 
  CheckCircle2, 
  CornerDownRight, 
  User, 
  Calendar, 
  Send, 
  Filter
} from 'lucide-react';

export default function VendorReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    average_rating: 4.8,
    total_reviews: 24,
    satisfaction_rate: '98%',
    breakdown: { 5: 19, 4: 4, 3: 1, 2: 0, 1: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('all');
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vendor/reviews', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error('Error fetching reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSendReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch('/api/vendor/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reviewId, replyText: replyText.trim() }),
      });

      if (res.ok) {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: replyText.trim() } : r));
        showToast('Your merchant reply was published!');
        setActiveReplyId(null);
        setReplyText('');
      } else {
        showToast('Failed to post reply', 'error');
      }
    } catch {
      showToast('Error sending reply', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filterRating === 'all') return true;
    if (filterRating === 'unreplied') return !r.reply;
    return r.rating === parseInt(filterRating, 10);
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 ${
          toast.type === 'error' ? 'bg-red-900 text-white border-red-700' : 'bg-emerald-900 text-white border-emerald-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-300" /> : <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md">
              Customer Feedback
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Star className="w-7 h-7 text-amber-500 fill-amber-400" />
            <span>Customer Ratings & Reviews</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Read verified customer experiences, product feedback, and respond to buyer inquiries.
          </p>
        </div>
      </div>

      {/* Summary Rating Cards & Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Score Overview Card */}
        <div className="md:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overall Store Score</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-5xl font-black text-gray-900">{stats.average_rating}</span>
              <span className="text-sm font-bold text-gray-400">/ 5.0</span>
            </div>

            <div className="flex items-center gap-1.5 mt-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />
              ))}
              <span className="text-xs font-bold text-gray-700 ml-2">({stats.total_reviews} reviews)</span>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Customer Satisfaction</span>
            <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              {stats.satisfaction_rate} Positive
            </span>
          </div>
        </div>

        {/* Rating Breakdown Bar Chart */}
        <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rating Distribution</h3>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.breakdown?.[star] || 0;
            const pct = Math.round((count / (stats.total_reviews || 1)) * 100);
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-bold text-gray-700 flex items-center gap-1">
                  <span>{star}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-right font-medium text-gray-500">{count} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </span>
        {[
          { label: 'All Reviews', val: 'all' },
          { label: '5 Stars ★', val: '5' },
          { label: '4 Stars ★', val: '4' },
          { label: '3 Stars ★', val: '3' },
          { label: 'Pending Reply', val: 'unreplied' },
        ].map(tab => (
          <button
            key={tab.val}
            onClick={() => setFilterRating(tab.val)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterRating === tab.val 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reviews Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-gray-100">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-bold text-gray-500">Loading customer reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-500">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-gray-700">No Reviews Matching Selected Filter</h4>
            <p className="text-xs text-gray-400 mt-1">Try switching filter tabs above to view all reviews.</p>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div key={rev.id} className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4 hover:border-blue-200 transition-all">
              {/* Review Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {rev.customer_name ? rev.customer_name.charAt(0) : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">{rev.customer_name}</h4>
                      {rev.verified_purchase && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified Buyer
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      Product: <strong className="text-gray-700">{rev.product_name}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= rev.rating 
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(rev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <p className="text-sm text-gray-700 leading-relaxed pl-13">
                "{rev.comment}"
              </p>

              {/* Merchant Reply if exists */}
              {rev.reply && (
                <div className="ml-6 sm:ml-12 p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-start gap-3">
                  <CornerDownRight className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-blue-900 block">Your Store Response:</span>
                    <p className="text-xs text-blue-800 mt-1">{rev.reply}</p>
                  </div>
                </div>
              )}

              {/* Reply Button or Form */}
              {!rev.reply && (
                <div className="ml-6 sm:ml-12 pt-2">
                  {activeReplyId === rev.id ? (
                    <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 animate-in fade-in">
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a polite, professional reply to this customer..."
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => { setActiveReplyId(null); setReplyText(''); }}
                          className="px-3.5 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={submittingReply || !replyText.trim()}
                          onClick={() => handleSendReply(rev.id)}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                        >
                          {submittingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span>Post Reply</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setActiveReplyId(rev.id); setReplyText(''); }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 hover:underline"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Reply to Customer</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
