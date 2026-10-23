'use client';

import { useState, useEffect } from 'react';
import { Loader2, Send, User, Search, MessageSquare, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminChat() {
  const { user: adminUser, loading: authLoading } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [search, setSearch] = useState('');
  
  const [messages, setMessages] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  // 1. Fetch All Vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await fetch('/api/messages?fetchAllVendors=true');
        if (res.ok) {
          const data = await res.json();
          setVendors(data.vendors || []);
          setFilteredVendors(data.vendors || []);
        }
      } catch (err) {
        console.error('Failed to fetch vendors', err);
      }
    };
    fetchVendors();
  }, []);

  // Filter vendors
  useEffect(() => {
    if (!search.trim()) {
      setFilteredVendors(vendors);
    } else {
      setFilteredVendors(vendors.filter(v => 
        v.name?.toLowerCase().includes(search.toLowerCase()) || 
        v.email?.toLowerCase().includes(search.toLowerCase())
      ));
    }
  }, [search, vendors]);

  // 2. Fetch Messages for Selected Vendor
  useEffect(() => {
    if (!adminUser || !selectedVendor) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/messages?userId=${adminUser.id}&otherUserId=${selectedVendor.id}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Failed to fetch messages', err);
      } finally {
        setLoadingMessages(false);
      }
    };
    
    fetchMessages();
    
    // Poll every 10 seconds only when tab is active
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchMessages();
    }, 10000);
    return () => clearInterval(interval);
  }, [adminUser, selectedVendor]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedVendor || !adminUser) return;
    
    const tempMsg = { 
      id: Date.now(), 
      content: inputMessage, 
      sender_id: adminUser.id, 
      receiver_id: selectedVendor.id, 
      created_at: new Date().toISOString() 
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setInputMessage('');

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: adminUser.id, receiver_id: selectedVendor.id, content: tempMsg.content })
      });
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center bg-white rounded-xl shadow-sm border border-gray-200">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Sidebar - Vendor List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Vendor Messaging</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendors..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredVendors.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Store className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No vendors found</p>
            </div>
          ) : (
            filteredVendors.map((vendor) => (
              <div 
                key={vendor.id} 
                onClick={() => setSelectedVendor(vendor)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors flex items-center gap-3 ${selectedVendor?.id === vendor.id ? 'bg-white border-l-4 border-l-blue-600 shadow-sm' : ''}`}
              >
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  {vendor.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{vendor.name}</h3>
                  <p className="text-xs text-gray-500">{vendor.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-2/3 flex flex-col bg-white">
        {selectedVendor ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedVendor.name}</h3>
                  <p className="text-xs text-gray-500">Vendor Account | Messages auto-delete after 2 days</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-sm">No recent messages with this vendor.</p>
                </div>
              ) : messages.map((msg) => {
                const isMine = msg.sender_id === adminUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMine ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'}`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Box */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  placeholder={`Message ${selectedVendor.name}...`} 
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
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
            <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Select a Vendor</h3>
            <p className="text-sm mt-1">Choose a vendor from the list to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
