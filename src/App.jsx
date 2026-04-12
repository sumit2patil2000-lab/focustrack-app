import React, { useState, useEffect, useMemo } from 'react';
import { 
  Square, 
  Plus, 
  Clock, 
  X,
  Calendar as CalendarIcon,
  PieChart as ChartIcon,
  Tag,
  Share2,
  Filter,
  MoreVertical,
  MapPin
} from 'lucide-react';

const App = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState('schedule');
  const [showAddPage, setShowAddPage] = useState(false);

  // Core Data State
  const [activities, setActivities] = useState([
    { id: '1', name: 'Sleep', icon: '☁️', color: '#3b82f6' },
    { id: '2', name: 'Wake Up', icon: '☀️', color: '#f59e0b' },
    { id: '3', name: 'Work', icon: '💼', color: '#a855f7' },
    { id: '4', name: 'Eating', icon: '🍴', color: '#f97316' },
    { id: '5', name: 'TV', icon: '📺', color: '#ec4899' },
    { id: '6', name: 'Training', icon: '🏃', color: '#10b981' },
    { id: '7', name: 'Studying', icon: '👓', color: '#6366f1' }
  ]);
  const [logs, setLogs] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);

  // Hourly slots for the timeline (00 to 24)
  const hours = Array.from({ length: 25 }, (_, i) => i);

  // Persistence logic
  useEffect(() => {
    const savedLogs = localStorage.getItem('tracker_logs');
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  useEffect(() => {
    localStorage.setItem('tracker_logs', JSON.stringify(logs));
  }, [logs]);

  // Timer logic
  useEffect(() => {
    let interval;
    if (currentSession) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const start = new Date(currentSession.startTime).getTime();
        setElapsedTime(Math.floor((now - start) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [currentSession]);

  const handleStartTracking = (activityId) => {
    if (currentSession) handleStopTracking();

    const activity = activities.find(a => a.id === activityId);
    const newSession = {
      id: Date.now().toString(),
      activityId: activity.id,
      name: activity.name,
      icon: activity.icon,
      color: activity.color,
      startTime: new Date().toISOString(),
    };
    setCurrentSession(newSession);
    setShowAddPage(false);
    setActiveTab('current');
  };

  const handleStopTracking = () => {
    if (!currentSession) return;
    const now = new Date();
    const completedSession = {
      ...currentSession,
      endTime: now.toISOString(),
      duration: elapsedTime
    };
    setLogs(prev => [completedSession, ...prev]);
    setCurrentSession(null);
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  };

  const formatClockTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Filter logs for the current selected date
  const filteredLogs = useMemo(() => {
    return logs.filter(log => log.startTime.startsWith(scheduleDate));
  }, [logs, scheduleDate]);

  return (
    <div className="fixed inset-0 bg-[#121212] text-[#E5E5E5] font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 bg-[#121212] border-b border-white/5 flex justify-between items-center shrink-0 z-40">
        <div>
          <h1 className="text-lg font-bold text-white uppercase tracking-tight">
            {activeTab === 'statistics' ? 'Statistics' : 
             new Date(scheduleDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </h1>
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
            {currentSession ? `Current: ${currentSession.name}` : 'Ready to start'}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <input 
              type="date" 
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <CalendarIcon size={20} className="text-blue-500" />
          </div>
          <MoreVertical size={20} className="text-neutral-500" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        
        {/* SCHEDULE VIEW - SCROLLABLE */}
        {activeTab === 'schedule' && (
          <div className="h-full overflow-y-auto pt-4 pb-32 no-scrollbar">
            <div className="max-w-md mx-auto px-4 relative">
              {/* Hour Labels Column */}
              <div className="absolute left-4 top-0 bottom-0 w-12 flex flex-col pointer-events-none">
                {hours.map(h => (
                  <div key={h} className="h-20 text-[11px] font-bold text-neutral-600 flex items-start pt-1">
                    {h.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Vertical Timeline Divider */}
              <div className="absolute left-16 top-0 bottom-0 w-[1px] bg-white/5" />

              {/* Activity Blocks Layer */}
              <div className="ml-16 relative">
                {filteredLogs.map((log, idx) => (
                  <div key={idx} className="mb-4 bg-white/5 border border-white/5 rounded-2xl p-4 flex justify-between items-center transition-all">
                    <div className="flex flex-col gap-2">
                      <div className="px-3 py-1 rounded-full text-white text-[10px] font-black flex items-center gap-2" style={{ backgroundColor: log.color }}>
                        <span>{log.icon}</span>
                        <span className="uppercase tracking-widest">{log.name}</span>
                      </div>
                      <span className="text-[11px] font-bold text-neutral-500">
                        {formatClockTime(log.startTime)} — {formatClockTime(log.endTime)}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-neutral-300">
                      {formatDuration(log.duration)}
                    </div>
                  </div>
                ))}
                
                {filteredLogs.length === 0 && (
                  <div className="h-40 flex items-center justify-center text-neutral-600 text-sm font-bold">
                    No logs for this day
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CURRENT TAB */}
        {activeTab === 'current' && (
          <div className="h-full flex flex-col items-center justify-center p-8">
            {currentSession ? (
              <div className="w-full max-w-sm bg-white/5 rounded-[3rem] p-10 text-center border border-white/5 shadow-2xl">
                <div className="text-8xl mb-6">{currentSession.icon}</div>
                <h2 className="text-3xl font-black mb-1">{currentSession.name}</h2>
                <div className="text-6xl font-mono font-black my-12 text-blue-500 tabular-nums">
                  {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:
                  {(elapsedTime % 60).toString().padStart(2, '0')}
                </div>
                <button 
                  onClick={handleStopTracking}
                  className="w-full bg-red-500 hover:bg-red-600 py-5 rounded-3xl font-black flex items-center justify-center gap-3 shadow-xl transition-colors uppercase"
                >
                  <Square size={20} fill="white" /> Stop Session
                </button>
              </div>
            ) : (
              <div className="text-center opacity-40">
                <Clock size={64} className="mx-auto mb-4" />
                <p className="font-bold">No activity in progress</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <footer className="shrink-0 bg-[#121212] border-t border-white/5 px-6 pt-3 pb-8 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <button onClick={() => setActiveTab('schedule')} className={`flex flex-col items-center gap-1 ${activeTab === 'schedule' ? 'text-blue-500' : 'text-neutral-600'}`}>
            <CalendarIcon size={22} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Schedule</span>
          </button>
          <button onClick={() => setActiveTab('tags')} className={`flex flex-col items-center gap-1 ${activeTab === 'tags' ? 'text-pink-500' : 'text-neutral-600'}`}>
            <Tag size={22} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Tags</span>
          </button>
          
          <button 
            onClick={() => setShowAddPage(true)} 
            className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-2xl -mt-12 border-[6px] border-[#121212] active:scale-95 transition-transform"
          >
            <Plus size={32} strokeWidth={3} />
          </button>

          <button onClick={() => setActiveTab('current')} className={`flex flex-col items-center gap-1 ${activeTab === 'current' ? 'text-indigo-500' : 'text-neutral-600'}`}>
            <Clock size={22} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Current</span>
          </button>
          <button onClick={() => setActiveTab('statistics')} className={`flex flex-col items-center gap-1 ${activeTab === 'statistics' ? 'text-red-500' : 'text-neutral-600'}`}>
            <ChartIcon size={22} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Stats</span>
          </button>
        </div>
      </footer>

      {/* START SESSION MODAL - FIXED Z-INDEX & BACKGROUND */}
      {showAddPage && (
        <div className="fixed inset-0 bg-[#121212] z-[100] flex flex-col animate-in fade-in slide-in-from-bottom duration-300">
          <div className="px-6 pt-12 pb-6 border-b border-white/5 flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Select Activity</h3>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">What are you working on?</p>
            </div>
            <button 
              onClick={() => setShowAddPage(false)} 
              className="w-12 h-12 bg-white/5 text-neutral-400 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            >
              <X size={24}/>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
            <div className="grid grid-cols-2 gap-4 pb-12">
              {activities.map(a => (
                <button 
                  key={a.id} 
                  onClick={() => handleStartTracking(a.id)} 
                  className="flex flex-col items-center p-8 bg-white/5 rounded-[2.5rem] border border-white/5 active:bg-white/10 active:border-blue-500/50 transition-all group"
                >
                  <span className="text-5xl mb-4 group-active:scale-110 transition-transform">{a.icon}</span>
                  <span className="text-xs font-black text-white uppercase tracking-widest">{a.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-in { animation: fade-in 0.2s ease-out, slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}} />
    </div>
  );
};

export default App;