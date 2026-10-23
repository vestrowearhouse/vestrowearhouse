'use client';

import { useState, useEffect } from 'react';
import { Loader2, Send, User, MessageSquare } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function VendorChat() {
  const { user: vendorUser, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [adminUser, setAdminUser] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Fetch Admin User details
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await fetch('/api/messages?getAdmin=true');
        if (res.ok) {
          const data = await res.json();
          setAdminUser(data.adminUser);
        }
      } catch (err) {
        console.error('Failed to fetch admin user', err);
      }
    };
    fetchAdmin();
  }, []);

  // 2. Fetch Messages between Vendor and Admin
  useEffect(() => {
    if (!vendorUser || !adminUser) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/messages?userId=${vendorUser.id}&otherUserId=${adminUser.id}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Failed to fetch messages', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Poll every 10 seconds only when tab is active
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchMessages();
    }, 10000);
    return () => clearInterval(interval);
  }, [vendorUser, adminUser]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !adminUser || !vendorUser) return;
    
    const tempMsg = { 
      id: Date.now(), 
      content: inputMessage, 
      sender_id: vendorUser.id, 
      receiver_id: adminUser.id, 
      created_at: new Date().toISOString() 
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setInputMessage('');

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: vendorUser.id, receiver_id: adminUser.id, content: tempMsg.content })
      });
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  if (authLoading || !adminUser) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center bg-white rounded-xl shadow-sm border border-gray-200">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-gray-50 rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Admin Support</h3>
          <p className="text-xs text-gray-500">Online | Messages auto-delete after 2 days</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">No messages yet</h3>
            <p className="text-sm mt-1">Send a message to Admin Support.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === vendorUser.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-2 ${isMine ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input 
            type="text" 
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            placeholder="Type your message to support..." 
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
          />
          <button 
            type="submit" 
            disabled={!inputMessage.trim()}
            className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
