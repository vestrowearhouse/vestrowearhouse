'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, User, Headset, ShoppingBag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function AIChatbot() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('ai'); // 'ai' | 'human' | 'closed'
  const [productContext, setProductContext] = useState(null); // { id, name }
  const [messages, setMessages] = useState([
    { role: 'model', content: 'Hello! I am here to provide **StellarmartBD AI Support**. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Initialize Session ID & Load History ──
  useEffect(() => {
    let savedId = sessionStorage.getItem('stellarmart_chat_session_id');
    if (!savedId) {
      savedId = 'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
      sessionStorage.setItem('stellarmart_chat_session_id', savedId);
    }
    setSessionId(savedId);

    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/chat/session?sessionId=${savedId}`);
        if (res.ok) {
          const data = await res.json();
          setSessionStatus(data.status || 'ai');
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          }
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };

    loadHistory();
  }, []);

  // ── Scroll to bottom on updates ──
  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // ── Polling for live support messages ──
  useEffect(() => {
    if (sessionStatus !== 'human' || !isOpen || !sessionId) return;

    const interval = setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/chat/session?sessionId=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSessionStatus(data.status || 'human');
          
          if (data.messages && data.messages.length > 0) {
            const mapped = data.messages.map(m => ({
              role: m.role === 'model' ? 'model' : m.role === 'admin' ? 'admin' : 'user',
              content: m.content
            }));
            
            setMessages(prev => {
              // Only update state if length or content changes to prevent loops
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
  }, [sessionStatus, isOpen, sessionId]);

  // ── Listen to custom window event for page context questions ──
  useEffect(() => {
    const handleOpenWithProduct = (e) => {
      const { productId, productName } = e.detail;
      setIsOpen(true);
      setProductContext({ id: productId, name: productName });
      
      setMessages(prev => {
        // Prevent duplicate greetings
        const hasProductGreeting = prev.some(m => m.content.includes(productName));
        if (hasProductGreeting) return prev;
        
        return [
          ...prev,
          { role: 'model', content: `Hello! I see you are asking about "${productName}". How can I help you with it?` }
        ];
      });
    };

    window.addEventListener('open-ai-chat-with-product', handleOpenWithProduct);
    return () => window.removeEventListener('open-ai-chat-with-product', handleOpenWithProduct);
  }, []);

  // ── Request Support Agent ──
  const handleTalkToHuman = async () => {
    if (isLoading || !sessionId) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'talk_to_human',
          sessionId: sessionId
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSessionStatus('human');
        setMessages(prev => [
          ...prev,
          { role: 'admin', content: '[System] Customer requested live agent support.' },
          { role: 'model', content: 'I am connecting you with a live support agent. They will reply here shortly.' }
        ]);
      }
    } catch (error) {
      console.error('Failed to request human agent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Submit message ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage.content,
          sessionId: sessionId,
          productId: productContext ? productContext.id : null,
          userId: user ? (user.id || user._id) : null
        })
      });

      const data = await response.json();
      
      if (response.ok && data.text) {
        setMessages(prev => [
          ...prev,
          { 
            role: data.status === 'human' ? 'model' : 'model', 
            content: data.text 
          }
        ]);
        if (data.status) {
          setSessionStatus(data.status);
        }
      } else {
        setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error. Please try again later.' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I could not connect to the server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Do not render floating chatbot on checkout or order tracking pages to avoid blocking action buttons & details
  if (pathname === '/checkout' || pathname?.startsWith('/orders')) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-40">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Toggle AI Chatbot"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-xl transition-transform hover:scale-110 flex items-center justify-center relative group"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
            Need Help? Chat here
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 overflow-hidden flex flex-col border border-gray-100 transition-all origin-bottom-right" style={{ height: '500px' }}>
          {/* Header */}
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600">
                {sessionStatus === 'human' ? <Headset className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  {sessionStatus === 'human' ? 'Live Support' : 'AI Support'}
                </h3>
                <p className="text-xs text-blue-200">
                  {sessionStatus === 'human' ? 'Connecting to Agent' : 'StellarmartBD AI'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {sessionStatus === 'ai' && (
                <button
                  onClick={handleTalkToHuman}
                  disabled={isLoading}
                  className="bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-full border border-blue-500/30 transition-all flex items-center gap-1"
                >
                  Talk to Human
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-blue-700 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const isAdmin = msg.role === 'admin';
              
              if (isAdmin && msg.content.startsWith('[System]')) {
                return (
                  <div key={idx} className="flex justify-center my-2">
                    <span className="text-[11px] font-semibold bg-gray-200 text-gray-600 px-3 py-1 rounded-full border border-gray-300">
                      {msg.content.replace('[System] ', '')}
                    </span>
                  </div>
                );
              }

              return (
                <div 
                  key={idx} 
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-end gap-2 max-w-[80%]">
                    {!isUser && (
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 text-[10px] font-bold">
                        {isAdmin ? <Headset className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                      </div>
                    )}
                    <div 
                      className={`rounded-2xl px-4 py-2.5 text-sm overflow-hidden ${
                        isUser 
                          ? 'bg-blue-600 text-white rounded-br-sm' 
                          : isAdmin
                          ? 'bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-bl-sm shadow-sm'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {isUser || isAdmin ? (
                        msg.content.startsWith('[System]') ? msg.content : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )
                      ) : (
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({node, href, children, ...props}) => {
                              const isInternal = href && (href.startsWith('/') || href.startsWith('#'));
                              const isProduct = href && href.startsWith('/product');
                              return (
                                <a 
                                  {...props} 
                                  href={href}
                                  onClick={(e) => {
                                    if (isInternal && href.startsWith('/')) {
                                      e.preventDefault();
                                      router.push(href);
                                    }
                                  }}
                                  className={isProduct ? "text-blue-600 hover:text-blue-800 font-bold underline inline-block" : "text-blue-600 hover:text-blue-800 underline font-medium"}
                                  target={isInternal ? "_self" : "_blank"} 
                                  rel={isInternal ? undefined : "noopener noreferrer"}
                                >
                                  {children}
                                </a>
                              );
                            },
                            p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0 leading-relaxed" />,
                            ul: ({node, ...props}) => <ul {...props} className="list-disc pl-4 mb-2 space-y-1" />,
                            ol: ({node, ...props}) => <ol {...props} className="list-decimal pl-4 mb-2 space-y-1" />,
                            li: ({node, ...props}) => <li {...props} className="mb-1" />,
                            strong: ({node, ...props}) => <strong {...props} className="font-semibold text-gray-900" />,
                            img: ({node, src, alt, ...props}) => {
                              if (!src) return null;

                              const handleImageClick = async (e) => {
                                // If inside an <a> tag that has a valid link
                                const parentLink = e.currentTarget.closest('a');
                                if (parentLink && parentLink.getAttribute('href')) {
                                  const href = parentLink.getAttribute('href');
                                  if (href.startsWith('/')) {
                                    e.preventDefault();
                                    router.push(href);
                                    return;
                                  }
                                }

                                // Standalone image clicked (e.g. from existing chat history)
                                e.preventDefault();
                                e.stopPropagation();

                                // 1. Try finding a /product/[slug] in the current message content
                                const productLinks = msg.content?.match(/\/product\/[a-zA-Z0-9_-]+/g);
                                if (productLinks && productLinks.length > 0) {
                                  router.push(productLinks[0]);
                                  return;
                                }

                                // 2. If alt text exists, find product by name
                                if (alt && alt.trim() && alt.toLowerCase() !== 'product') {
                                  try {
                                    const cleanName = alt.replace(/[#*_-]/g, '').trim();
                                    const res = await fetch(`/api/products?search=${encodeURIComponent(cleanName)}&limit=1`);
                                    if (res.ok) {
                                      const data = await res.json();
                                      const found = data?.products?.[0];
                                      if (found?.slug) {
                                        router.push(`/product/${found.slug}`);
                                        return;
                                      }
                                    }
                                  } catch (err) {
                                    console.error('Error finding product for image click:', err);
                                  }
                                  // Fallback to search
                                  router.push(`/search?q=${encodeURIComponent(alt.trim())}`);
                                  return;
                                }

                                // 3. Fallback to shop
                                router.push('/shop');
                              };

                              return (
                                <span 
                                  onClick={handleImageClick}
                                  role="button"
                                  tabIndex={0}
                                  title="Click to view product details"
                                  className="block mt-2 mb-2 relative group cursor-pointer inline-block overflow-hidden rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-500 transition-all duration-200"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={src}
                                    alt={alt || 'Product'}
                                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl transition-transform duration-200 group-hover:scale-105"
                                    crossOrigin="anonymous"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                  <span className="absolute inset-0 bg-blue-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none rounded-xl">
                                    <span className="bg-white/95 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                      View ↗
                                    </span>
                                  </span>
                                </span>
                              );
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

          {/* Input Area */}
          <div className="p-3 border-t border-gray-100 bg-white">
            <form onSubmit={handleSubmit} className="flex gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={sessionStatus === 'human' ? 'Type message to agent...' : 'Ask AI anything...'}
                className="flex-1 bg-gray-100 text-sm rounded-full pl-4 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50"
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
      )}
    </div>
  );
}
