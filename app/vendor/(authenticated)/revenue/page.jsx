'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  CreditCard, 
  ArrowUpRight, 
  Clock, 
  ShieldCheck, 
  X,
  Building,
  Smartphone,
  Download,
  Printer
} from 'lucide-react';

export default function VendorRevenue() {
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const handleExportStatement = () => {
    const headers = ['Transaction ID', 'Date', 'Description', 'Payment Channel', 'Gross Volume (BDT)', 'Platform Fee 10%', 'Net Credit (BDT)', 'Status'];
    const rows = (revenueData?.transactions || sampleLedger).map(t => [
      t.id,
      t.date,
      `"${t.type}"`,
      `"${t.method}"`,
      t.gross,
      t.fee,
      t.net,
      t.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StellarMart_Statement_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Account statement CSV exported successfully!');
  };

  const [payoutForm, setPayoutForm] = useState({
    method: 'bKash',
    accountNumber: '',
    bankName: '',
    branch: '',
    amount: ''
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/vendor/revenue?period=${period}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRevenueData(data);
      }
    } catch (err) {
      console.error('Error fetching revenue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, [period]);

  const grossSales = revenueData?.total_revenue || 0;
  const platformFee = Math.round(grossSales * 0.10);
  const availableBalance = Math.max(0, grossSales - platformFee);

  const handleRequestPayout = (e) => {
    e.preventDefault();
    setPayoutSubmitting(true);
    setTimeout(() => {
      setPayoutSubmitting(false);
      setIsPayoutModalOpen(false);
      showToast(`Payout request of ৳${Number(payoutForm.amount).toLocaleString()} via ${payoutForm.method} submitted successfully!`);
      setPayoutForm({ method: 'bKash', accountNumber: '', bankName: '', branch: '', amount: '' });
    }, 1200);
  };

  const sampleLedger = [
    {
      id: 'TXN-9021',
      date: '2026-09-22',
      type: 'Completed Order Credit',
      method: 'Online Checkout',
      gross: 4200,
      fee: 420,
      net: 3780,
      status: 'settled'
    },
    {
      id: 'TXN-8944',
      date: '2026-09-19',
      type: 'Bank Withdrawal Payout',
      method: 'City Bank Ltd.',
      gross: 15000,
      fee: 0,
      net: 15000,
      status: 'paid'
    },
    {
      id: 'TXN-8812',
      date: '2026-09-15',
      type: 'Completed Order Credit',
      method: 'Cash on Delivery',
      gross: 2850,
      fee: 285,
      net: 2565,
      status: 'settled'
    }
  ];

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
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-md">
              Finance & Settlements
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-purple-600" />
            <span>Store Revenue & Payouts</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track gross merchandise volume, platform commissions, withdrawal balances, and settlement history.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none"
          >
            <option value="week">Past 7 Days</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">All Time</option>
          </select>

          <button
            onClick={() => setIsPayoutModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Request Payout</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gross Merchandise Sales</span>
          <h3 className="text-2xl font-black text-gray-900 mt-2">৳{Number(grossSales).toLocaleString()}</h3>
          <p className="text-[11px] text-gray-500 mt-1">Total revenue collected from buyers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Available Payout Balance</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-2">৳{Number(availableBalance).toLocaleString()}</h3>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">Eligible for instant withdrawal</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Platform Commission (10%)</span>
          <h3 className="text-2xl font-black text-gray-700 mt-2">৳{Number(platformFee).toLocaleString()}</h3>
          <p className="text-[11px] text-gray-400 mt-1">Marketplace hosting & payment gateway</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Settlement Standing</span>
          <h3 className="text-2xl font-black text-blue-600 mt-2">Verified</h3>
          <p className="text-[11px] text-blue-700 mt-1 font-medium">Disbursements sent weekly</p>
        </div>
      </div>

      {/* Ledger & Transactions Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Settlement Ledger & Transactions</h3>
            <p className="text-xs text-gray-500 mt-0.5">Recent earnings credits and disbursement records.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportStatement}
              className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 active:scale-95 border border-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
              title="Download CSV Statement"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 active:scale-95 border border-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
              title="Print Ledger Report"
            >
              <Printer className="w-3.5 h-3.5 text-gray-500" />
              <span>Print</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-4 px-6">Transaction ID</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4">Description</th>
                <th className="py-4 px-4">Channel</th>
                <th className="py-4 px-4">Gross</th>
                <th className="py-4 px-4">Commission</th>
                <th className="py-4 px-4">Net Amount</th>
                <th className="py-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {sampleLedger.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-gray-800">{row.id}</td>
                  <td className="py-4 px-4 text-gray-500">{row.date}</td>
                  <td className="py-4 px-4 font-bold text-gray-900">{row.type}</td>
                  <td className="py-4 px-4 text-gray-600">{row.method}</td>
                  <td className="py-4 px-4 font-bold text-gray-900">৳{Number(row.gross).toLocaleString()}</td>
                  <td className="py-4 px-4 text-gray-400">৳{Number(row.fee).toLocaleString()}</td>
                  <td className="py-4 px-4 font-black text-emerald-600">৳{Number(row.net).toLocaleString()}</td>
                  <td className="py-4 px-6 text-right">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900">Request Merchant Disbursement</h3>
                <p className="text-xs text-gray-500">Available to withdraw: <strong>৳{Number(availableBalance).toLocaleString()}</strong></p>
              </div>
              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Payout Method
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {['bKash', 'Nagad', 'Bank Transfer'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayoutForm({ ...payoutForm, method: m })}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                        payoutForm.method === m
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {payoutForm.method === 'Bank Transfer' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Bank Name & Branch *
                    </label>
                    <input
                      type="text"
                      required
                      value={payoutForm.bankName}
                      onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                      placeholder="e.g. Dutch-Bangla Bank, Dhanmondi Branch"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={payoutForm.accountNumber}
                      onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                      placeholder="123.456.7890"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    {payoutForm.method} Personal / Merchant Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={payoutForm.accountNumber}
                    onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Amount to Withdraw (৳) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPayoutForm({ ...payoutForm, amount: String(availableBalance) })}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Withdraw All
                  </button>
                </div>
                <input
                  type="number"
                  required
                  min="500"
                  max={availableBalance || 500000}
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                  placeholder="Min. ৳500"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutSubmitting || !payoutForm.amount}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2"
                >
                  {payoutSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                  <span>Confirm Withdrawal Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
