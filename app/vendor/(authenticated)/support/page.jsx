'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Store, HelpCircle, User, Headset, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function VendorSupportPage() {
  const [messages, setMessages] = useState([
    { role: 'admin', content: 'Hello! I am a StellarmartBD Administrator. How can I help you with your shop settings, commissions, payouts, or order fulfillment today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    try {
      const res = await fetch(`/api/vendor/support`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages([
            { role: 'admin', content: 'Hello! I am a StellarmartBD Administrator. How can I help you with your shop settings, commissions, payouts, or order fulfillment today?' },
            ...data.messages
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling for live support messages
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/vendor/support`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            const mapped = [
              { role: 'admin', content: 'Hello! I am a StellarmartBD Administrator. How can I help you with your shop settings, commissions, payouts, or order fulfillment today?' },
              ...data.messages
            ];
            
            setMessages(prev => {
              if (prev.length !== mapped.length || JSON.stringify(prev) !== JSON.stringify(mapped)) {
                return mapped;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.error('Error polling chat messages:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'vendor', content: input.trim() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/vendor/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage.content,
        })
      });

      if (!response.ok) {
        setMessages(prev => [...prev, { role: 'admin', content: 'Sorry, I encountered an error sending your message. Please try again.' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'admin', content: 'Sorry, I could not connect to the server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link href="/vendor/dashboard" className="p-2 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 shadow-sm">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-blue-600" />
            Help Desk & Admin Support
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Learn about store guidelines or chat directly with the management team.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Chat Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-[520px]">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <Headset className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Admin Live Support</h3>
                <p className="text-xs text-blue-100">Typical reply time: Under 24 hours</p>
              </div>
            </div>
          </div>

          {/* Messages viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {isInitialLoad ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isUser = msg.role === 'vendor' || msg.role === 'user';
                const isAdmin = msg.role === 'admin';
                
                return (
                  <div 
                    key={idx} 
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex items-end gap-2 max-w-[80%]">
                      {!isUser && (
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-700 text-[10px] font-bold">
                          A
                        </div>
                      )}
                      <div 
                        className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          isUser 
                            ? 'bg-blue-600 text-white rounded-br-sm' 
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <div className="p-3 border-t border-gray-100 bg-white">
            <form onSubmit={handleSubmit} className="flex gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type message to Admin..."
                className="flex-1 bg-gray-100 text-sm rounded-full pl-4 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 text-white rounded-full w-8 flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Guidelines Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              Quick Vendor Guide
            </h2>
            
            <div className="space-y-4 text-xs text-gray-600">
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                <span className="font-bold text-blue-800 block mb-1">💰 Platform Commission</span>
                StellarMartBD charges a flat 10% commission fee on each successfully completed order.
              </div>

              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                <span className="font-bold text-blue-800 block mb-1">🚚 Shipping Fulfillment</span>
                Vendors must process, pack, and hand over the packages to our logistics partner within 2 business days of order receipt.
              </div>

              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                <span className="font-bold text-blue-800 block mb-1">🗓️ Weekly Payouts</span>
                Earnings are processed and transferred every Friday to your linked bank account or mobile financial services (bKash/Nagad), given your balance is above 500 BDT.
              </div>

              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                <span className="font-bold text-blue-800 block mb-1">🔍 Verification & Review</span>
                Sellers are expected to maintain an average score above 4 stars. High customer dispute rates or suspensions may result in account auditing.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
