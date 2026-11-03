'use client';

import { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Calendar,
  Filter,
  Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('30');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    orders: []
  });
  const [loading, setLoading] = useState(true);

  const reportTypes = [
    { id: 'sales', name: 'Sales Report', icon: TrendingUp, description: 'Track sales performance and revenue' },
    { id: 'products', name: 'Product Report', icon: BarChart3, description: 'Product performance and inventory' },
    { id: 'customers', name: 'Customer Report', icon: FileText, description: 'Customer acquisition and retention' },
    { id: 'categories', name: 'Category Report', icon: PieChart, description: 'Category-wise performance' },
  ];

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?days=${dateRange === 'custom' ? 30 : dateRange}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (type) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('StellarMartBD Admin Report', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Report Type: ${type.toUpperCase()}`, 14, 32);
    doc.text(`Date Range: Last ${dateRange} days`, 14, 40);
    doc.text(`Generated At: ${new Date().toLocaleString()}`, 14, 48);

    if (type === 'sales') {
      doc.text(`Total Revenue: Tk ${stats.totalRevenue.toFixed(2)}`, 14, 60);
      doc.text(`Total Orders: ${stats.totalOrders}`, 14, 68);
      doc.text(`Average Order Value: Tk ${stats.averageOrderValue.toFixed(2)}`, 14, 76);
      doc.text(`Conversion Rate: ${stats.conversionRate}%`, 14, 84);

      if (stats.orders && stats.orders.length > 0) {
        doc.autoTable({
          startY: 95,
          head: [['Order ID', 'Date', 'Status', 'Amount (Tk)']],
          body: stats.orders.slice(0, 50).map(o => [
            o.id.substring(0, 8),
            new Date(o.created_at).toLocaleDateString(),
            o.status || 'Completed',
            Number(o.total ?? o.total_amount ?? 0).toFixed(2)
          ]),
        });
      }
    } else {
      doc.text('Detailed data for this report type is under development.', 14, 60);
    }

    doc.save(`StellarMartBD_${type}_Report.pdf`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-gray-500">Generate and download various reports</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {reportTypes.map((report) => (
          <div key={report.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <report.icon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-lg">{report.name}</h3>
                  {report.id !== 'sales' && (
                    <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-medium border border-amber-200">
                      Under Development
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mb-4">{report.description}</p>
                <div className="flex gap-2">
                  {report.id === 'sales' ? (
                    <button 
                      onClick={() => generatePDF(report.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Under Development
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl shadow-sm p-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}
        <h2 className="text-lg font-semibold mb-4">Quick Summary (Last {dateRange} days)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold">৳{stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-500">Average Order Value</p>
            <p className="text-2xl font-bold">৳{stats.averageOrderValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-500">Conversion Rate</p>
            <p className="text-2xl font-bold">{stats.conversionRate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
