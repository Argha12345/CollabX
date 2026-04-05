import React, { useState, useEffect, useContext } from 'react';
import { Timer, Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { SocketContext } from '../context/SocketContext';

const FlowTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const { socket } = useContext(SocketContext);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={`flex items-center gap-3 px-4 py-1.5 rounded-2xl border transition-all duration-500 ${isActive ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-200' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
          <Timer size={16} className={isActive ? 'animate-pulse' : ''} />
        </div>
        <span className="font-black text-sm tabular-nums tracking-tight">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        <button onClick={toggleTimer} className={`p-1.5 rounded-lg transition-colors ${isActive ? 'hover:bg-white/20' : 'hover:bg-white shadow-sm hover:text-primary-600'}`}>
          {isActive ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button onClick={resetTimer} className={`p-1.5 rounded-lg transition-colors ${isActive ? 'hover:bg-white/20' : 'hover:bg-white shadow-sm hover:text-gray-900'}`}>
          <RotateCcw size={14} />
        </button>
      </div>

      {isActive && (
         <div className="flex items-center gap-1 animate-in fade-in zoom-in ml-1 border-l border-white/20 pl-2">
            <Zap size={12} className="text-yellow-300" />
            <span className="text-[9px] font-bold uppercase tracking-tighter leading-none">Flow State Active</span>
         </div>
      )}
    </div>
  );
};

export default FlowTimer;
