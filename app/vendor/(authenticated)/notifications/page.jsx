'use client';

import { useState, useEffect } from 'react';
import { Bell, Loader2, AlertCircle, CheckCircle2, Star, AlertTriangle } from 'lucide-react';

export default function VendorNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/vendor/notifications?page=${page}&limit=20`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setTotalPages(data.pagination.pages);
      } else {
        setError('Failed to load notifications');
      }
    } catch (err) {
      setError('Error fetching notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notifId) => {
    try {
      const res = await fetch('/api/vendor/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationId: notifId, isRead: true })
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600">All your store notifications</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-4 rounded-lg border transition-colors flex gap-4 ${
              notif.is_read
                ? 'bg-gray-50 border-gray-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              notif.type === 'alert' ? 'bg-red-100 text-red-600' :
              notif.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
              notif.type === 'event' ? 'bg-purple-100 text-purple-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {notif.type === 'alert' ? <AlertTriangle className="w-5 h-5" /> :
               notif.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
               notif.type === 'event' ? <Star className="w-5 h-5" /> :
               <Bell className="w-5 h-5" />}
            </div>
            
            <div className="flex items-start justify-between flex-1">
              <div className="flex-1">
                <h3 className={`font-semibold ${notif.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{notif.title}</h3>
                <p className={`text-sm mt-1 ${notif.is_read ? 'text-gray-500' : 'text-gray-700'}`}>{notif.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(notif.created_at).toLocaleString()}
                </p>
              </div>
              {!notif.is_read && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  className="ml-4 p-2 hover:bg-white rounded-lg"
                  title="Mark as read"
                >
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No notifications to display</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
          <p className="text-gray-600 text-sm">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
