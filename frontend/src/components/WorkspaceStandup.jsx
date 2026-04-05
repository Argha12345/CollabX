import React, { useState, useEffect } from 'react';
import { Calendar, Sparkles, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';

const WorkspaceStandup = ({ workspaceId }) => {
  const [standup, setStandup] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const fetchStandup = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/ai/workspace-standup', { workspaceId });
      setStandup(data.standup);
    } catch (err) {
      const msg = err.response?.data?.standup || err.response?.data?.message || "🔄 AI is currently busy. Click refresh to try again.";
      setStandup(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandup();
  }, [workspaceId]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8 transition-all hover:shadow-md">
      <div className="p-4 bg-gradient-to-r from-primary-500 to-indigo-600 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
             <Calendar size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight">AI Daily Pulse</h3>
            <p className="text-[10px] text-primary-100 font-medium uppercase tracking-widest">Automatic Standup Portfolio</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchStandup} 
            disabled={loading}
            className="p-1.5 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
            title="Refresh Analysis"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-white/10 rounded transition-colors">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-6 bg-white relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-primary-50 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={120} />
          </div>
          
          {loading ? (
             <div className="flex flex-col items-center justify-center py-6 gap-3">
                <div className="flex space-x-1.5">
                   <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                   <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                   <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Analyzing Activity Logs...</p>
             </div>
          ) : (
             <div className="prose prose-sm max-w-none text-gray-700 font-medium leading-relaxed animate-in fade-in slide-in-from-top-2 duration-500">
                {standup.split('\n').map((line, i) => (
                  <p key={i} className={line.startsWith('-') ? 'ml-2 border-l-2 border-primary-200 pl-3 py-0.5' : ''}>
                    {line}
                  </p>
                ))}
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceStandup;
