import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import api from '../services/api';

const WorkspaceAiAssistant = ({ workspaceId }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your Workspace Assistant. I've analyzed all the documents in this workspace. Ask me anything about them!" }
  ]);
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/query-workspace', { workspaceId, query });
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      const msg = err.response?.data?.answer || err.response?.data?.message || "The AI assistant is currently busy. Please try again in a moment.";
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  if (isMinimized) {
    return (
      <button 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-2xl hover:bg-primary-700 transition-all hover:scale-110 z-40 group"
      >
        <Sparkles size={24} className="group-hover:animate-pulse" />
      </button>
    );
  }

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
      <div className="p-4 bg-primary-600 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight">Workspace Assistant</h3>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-medium text-primary-100 uppercase tracking-widest">Always Learning</span>
            </div>
          </div>
        </div>
        <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-white/10 rounded transition">
          <Minimize2 size={18} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-primary-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
            }`}>
              <div className="flex items-center gap-2 mb-1 opacity-70">
                {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                <span className="text-[10px] font-bold uppercase tracking-tighter">{msg.role}</span>
              </div>
              <p className="leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
        <div className="relative">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about workspace docs..."
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl text-sm transition outline-none font-medium"
          />
          <button 
            type="submit" 
            disabled={!query.trim() || loading}
            className="absolute right-2 top-2 p-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 shadow-lg shadow-primary-100"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkspaceAiAssistant;
