'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, RefreshCw, Loader2, User, Headset, Sparkles, 
  MessageSquare, Clock, Search, ShieldCheck, XCircle, CheckCircle
} from 'lucide-react';

export default function AdminSupportDashboard() {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyInput, setReplyInput] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('human'); // 'human' | 'all'
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch all chat sessions
  const fetchSessions = useCallback(async (silent = false) => {
    if (!silent) setLoadingSessions(true);
    try {
      const res = await fetch('/api/admin/chat/sessions', {
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      if (!silent) setLoadingSessions(false);
    }
  }, []);

  // Fetch messages for selected session
  const fetchMessages = useCallback(async (sessionId, silent = false) => {
    if (!sessionId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/session?sessionId=${sessionId}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, []);

  // Poll for sessions list and currently selected chat updates (only when tab is active)
  useEffect(() => {
    fetchSessions();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchSessions(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  useEffect(() => {
    if (!selectedSessionId) return;
    const currentSession = sessions.find(s => s.id === selectedSessionId);
    if (!currentSession) return;
    
    fetchMessages(currentSession.session_token);
    
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchMessages(currentSession.session_token, true);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [selectedSessionId, sessions, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send admin reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyInput.trim() || sending || !selectedSessionId) return;

    setSending(true);
    const content = replyInput.trim();
    setReplyInput('');

    try {
      const res = await fetch('/api/admin/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          content
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Optimistic update
        setMessages(prev => [
          ...prev,
          { role: 'admin', content, created_at: new Date().toISOString() }
        ]);
        fetchSessions(true);
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSending(false);
    }
  };

  // Close session (switch back to AI / Resolve)
  const handleResolveSession = async (sessionToken, sessionId) => {
    try {
      const res = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionToken,
          action: 'resolve'
        })
      });
      fetchSessions();
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to resolve session:', err);
    }
  };

  // Filter and search sessions
  const filteredSessions = sessions.filter(sess => {
    const matchesSearch = 
      sess.session_token?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sess.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sess.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sess.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (filterTab === 'human') {
      return matchesSearch && sess.status === 'human';
    }
    return matchesSearch;
  });

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  return (
    <div className="flex h-[calc(100vh-140px)] bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Left panel: Sessions list */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        {/* Search & Header */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Headset className="w-5 h-5 text-blue-600" />
              Live Support
            </h1>
            <button 
              onClick={() => fetchSessions()} 
              disabled={loadingSessions}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingSessions ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chat or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 p-1">
          <button
            onClick={() => setFilterTab('human')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterTab === 'human' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⏳ Waiting (Human)
          </button>
          <button
            onClick={() => setFilterTab('all')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterTab === 'all' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Sessions
          </button>
        </div>

        {/* Sessions list scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {loadingSessions && sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <span className="text-xs text-gray-400">Loading chats...</span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <MessageSquare className="w-10 h-10 text-gray-300 mb-2" />
              <h3 className="text-sm font-semibold text-gray-700">No support requests</h3>
              <p className="text-xs text-gray-400 mt-1">There are no sessions waiting for assistance right now.</p>
            </div>
          ) : (
            filteredSessions.map((sess) => {
              const isSelected = sess.id === selectedSessionId;
              const hasUser = sess.user;
              const sessionName = hasUser ? sess.user.name : `Guest (${sess.session_token.slice(5, 12)})`;
              const sessionEmail = hasUser ? sess.user.email : 'Anonymous';
              
              return (
                <div
                  key={sess.id}
                  onClick={() => setSelectedSessionId(sess.id)}
                  className={`p-4 cursor-pointer transition-colors relative flex items-start gap-3 ${
                    isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-gray-50 bg-white'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                    sess.session_type === 'vendor' 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {sess.session_type === 'vendor' ? 'V' : 'C'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-900 truncate">{sessionName}</p>
                      <span className="text-[10px] text-gray-400">
                        {sess.updated_at ? new Date(sess.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate mb-1">{sessionEmail}</p>
                    
                    {sess.lastMessage ? (
                      <p className={`text-xs truncate ${
                        sess.lastMessage.sender === 'user' ? 'font-semibold text-gray-800' : 'text-gray-400'
                      }`}>
                        {sess.lastMessage.sender === 'user' ? 'User: ' : 'Agent: '}{sess.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No messages yet</p>
                    )}
                  </div>
                  
                  {sess.status === 'human' && (
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse flex-shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel: Messages viewport */}
      <div className="flex-1 bg-white flex flex-col">
        {selectedSessionId && selectedSession ? (
          <>
            {/* Header info */}
            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  {selectedSession.user ? selectedSession.user.name : `Guest (${selectedSession.session_token.substring(0, 10)})`}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedSession.session_type === 'vendor' 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedSession.session_type === 'vendor' ? 'Vendor Account' : 'Customer'}
                  </span>
                </h2>
                <p className="text-xs text-gray-500">
                  ID: {selectedSession.id} | Status: {selectedSession.status === 'human' ? '⏳ Waiting for Agent' : '🤖 AI Assisted'}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleResolveSession(selectedSession.session_token, selectedSession.id)}
                  className="px-3 py-1.5 border border-green-200 text-green-700 hover:bg-green-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Resolve Chat
                </button>
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">No messages in this conversation.</div>
              ) : (
                messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  const isAdmin = msg.role === 'admin';
                  
                  if (isAdmin && msg.content.startsWith('[System]')) {
                    return (
                      <div key={idx} className="flex justify-center my-2">
                        <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                          {msg.content.replace('[System] ', '')}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={idx} 
                      className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        isUser 
                          ? 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm' 
                          : isAdmin
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-br-sm'
                      }`}>
                        <div className="flex justify-between items-center gap-4 mb-0.5">
                          <span className="text-[10px] font-bold opacity-60">
                            {isUser ? 'User' : isAdmin ? 'You (Agent)' : 'AI Assistant'}
                          </span>
                          <span className="text-[9px] opacity-40">
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input field */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendReply} className="flex gap-2">
                <input
                  type="text"
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder="Type a support reply to the user..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!replyInput.trim() || sending}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2 text-sm font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-blue-100 disabled:bg-gray-400 disabled:shadow-none transition-all"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-500 shadow-inner">
              <Headset className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-gray-700">No chat selected</h2>
            <p className="text-xs text-gray-400 mt-1 text-center max-w-sm">Select a conversation from the sidebar list to interact in real-time with users and vendors.</p>
          </div>
        )}
      </div>
    </div>
  );
}
