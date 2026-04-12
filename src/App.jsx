import React, { useState, useEffect, useMemo } from 'react';
import { 
  Square, 
  Plus, 
  Clock, 
  X,
  Calendar as CalendarIcon,
  PieChart as ChartIcon,
  Tag,
  MoreVertical
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
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);

  // Hourly slots for the timeline (00 to 24)
  const hours = Array.from({ length: 25 }, (_, i) => i);

  // Persistence logic
  useEffect(() => {
    const savedLogs = localStorage.getItem('tracker_logs_v4');
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  useEffect(() => {
    localStorage.setItem('tracker_logs_v4', JSON.stringify(logs));
  }, [logs]);

  // Current Time Marker Logic
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    };
    updateTime();
    const int = setInterval(updateTime, 60000);
    return () => clearInterval(int);
  }, []);

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
    setLogs(prev => [...prev, completedSession]);
    setCurrentSession(null);
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  };

  const getMinutesSinceMidnight = (isoString) => {
    const date = new Date(isoString);
    return date.getHours() * 60 + date.getMinutes();
  };

  const filteredLogs = useMemo(() => {
    const dayLogs = logs.filter(log => log.startTime.startsWith(scheduleDate));
    if (currentSession && currentSession.startTime.startsWith(scheduleDate)) {
      dayLogs.push({ ...currentSession, endTime: new Date().toISOString(), duration: elapsedTime, isActive: true });
    }
    return dayLogs;
  }, [logs, currentSession, elapsedTime, scheduleDate]);

  const isToday = scheduleDate === new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 font-sans flex flex-col overflow-hidden" style={{ backgroundColor: '#121212', color: '#E5E5E5' }}>
      {/* Fallback Tailwind Stylesheet */}
      <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet" />
      
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center shrink-0 z-40 border-b" style={{ backgroundColor: '#121212', borderColor: 'rgba(255,255,255,0.05)' }}>
        <div>
          <h1 className="text-lg font-bold text-white uppercase tracking-tight">
            {activeTab === 'statistics' ? 'Statistics' : 
             new Date(scheduleDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </h1>
          <p className="font-black text-gray-500 uppercase tracking-widest" style={{ fontSize: '10px' }}>
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
          <MoreVertical size={20} className="text-gray-500" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        
        {/* SCHEDULE VIEW */}
        {activeTab === 'schedule' && (
          <div className="h-full overflow-y-auto no-scrollbar relative w-full" style={{ scrollBehavior: 'smooth' }}>
            <div className="max-w-md mx-auto w-full relative" style={{ height: '1500px' }}>
              {hours.map(h => (
                <div key={h} className="absolute left-0 right-0 border-t flex items-start px-4" style={{ top: `${h * 60}px`, borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-gray-500 font-bold -mt-2 pr-2" style={{ fontSize: '11px', width: '3rem', backgroundColor: '#121212' }}>
                    {h.toString().padStart(2, '0')}:00
                  </span>
                </div>
              ))}

              {isToday && (
                <div className="absolute left-0 right-0 flex items-center z-20 pointer-events-none" style={{ top: `${currentTimeMinutes}px` }}>
                  <div className="w-12 text-right pr-2">
                    <span className="text-red-500 font-bold bg-red-500/10 px-1 rounded" style={{ fontSize: '10px' }}>
                      {Math.floor(currentTimeMinutes / 60).toString().padStart(2, '0')}:{Math.floor(currentTimeMinutes % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex-1 h-[2px] bg-red-500 relative">
                    <div className="absolute -left-1.5 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                  </div>
                </div>
              )}

              <div className="absolute top-0 bottom-0 right-4" style={{ left: '4rem' }}>
                {filteredLogs.map((log, idx) => {
                  const startMinutes = getMinutesSinceMidnight(log.startTime);
                  const durationMinutes = log.isActive ? (elapsedTime / 60) : (log.duration / 60);
                  const height = Math.max(durationMinutes, 30);
                  
                  return (
                    <div key={idx} className="absolute left-0 right-0 rounded-xl p-3 border shadow-lg flex flex-col justify-center overflow-hidden transition-all"
                      style={{
                        top: `${startMinutes}px`,
                        height: `${height}px`,
                        backgroundColor: log.isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        borderColor: log.isActive ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.05)',
                        zIndex: log.isActive ? 10 : 1
                      }}>
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center rounded-full text-white w-6 h-6 text-sm" style={{ backgroundColor: log.color }}>
                            {log.icon}
                          </span>
                          <span className="font-bold uppercase tracking-widest text-white truncate" style={{ fontSize: '11px' }}>
                            {log.name}
                          </span>
                        </div>
                        <span className="font-bold text-gray-400" style={{ fontSize: '10px' }}>
                          {formatDuration(log.isActive ? elapsedTime : log.duration)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CURRENT TAB */}
        {activeTab === 'current' && (
          <div className="h-full flex flex-col items-center justify-center p-8">
            {currentSession ? (
              <div className="w-full max-w-sm rounded-3xl p-10 text-center border shadow-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="text-6xl mb-6">{currentSession.icon}</div>
                <h2 className="text-3xl font-black mb-1">{currentSession.name}</h2>
                <div className="text-5xl font-mono font-black my-12 text-blue-500 tabular-nums tracking-tighter">
                  {Math.floor(elapsedTime / 3600).toString().padStart(2, '0')}:
                  {Math.floor((elapsedTime % 3600) / 60).toString().padStart(2, '0')}:
                  {(elapsedTime % 60).toString().padStart(2, '0')}
                </div>
                <button 
                  onClick={handleStopTracking}
                  className="w-full bg-red-500 hover:bg-red-600 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-colors uppercase"
                >
                  <Square size={20} fill="white" /> Stop Session
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <Clock size={64} className="mx-auto mb-4 opacity-50" />
                <p className="font-bold">No activity in progress</p>
              </div>
            )}
          </div>
        )}

        {/* TAGS TAB */}
        {activeTab === 'tags' && (
          <div className="h-full overflow-y-auto p-6 max-w-md mx-auto">
            <div className="grid grid-cols-2 gap-4">
              {activities.map(a => (
                <div key={a.id} className="border p-4 rounded-2xl flex items-center justify-between" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{a.icon}</span>
                    <span className="font-bold text-sm text-white">{a.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STATISTICS TAB */}
        {activeTab === 'statistics' && (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500">
            <ChartIcon size={64} className="mb-4 opacity-30" />
            <h2 className="text-xl font-bold text-white mb-2">Analytics</h2>
            <p className="max-w-xs text-sm">Detailed charts and time distribution analysis will appear here.</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <footer className="shrink-0 border-t px-6 pt-3 pb-8 z-50" style={{ backgroundColor: '#121212', borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="max-w-md mx-auto flex justify-between items-center relative">
          <button onClick={() => setActiveTab('schedule')} className={`flex flex-col items-center gap-1 ${activeTab === 'schedule' ? 'text-blue-500' : 'text-gray-500'}`}>
            <CalendarIcon size={22} />
            <span className="font-black uppercase tracking-tighter" style={{ fontSize: '9px' }}>Schedule</span>
          </button>
          <button onClick={() => setActiveTab('tags')} className={`flex flex-col items-center gap-1 ${activeTab === 'tags' ? 'text-pink-500' : 'text-gray-500'}`}>
            <Tag size={22} />
            <span className="font-black uppercase tracking-tighter" style={{ fontSize: '9px' }}>Tags</span>
          </button>
          
          <button 
            onClick={() => setShowAddPage(true)} 
            className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-2xl -mt-12 border-4 active:scale-95 transition-transform"
            style={{ borderColor: '#121212' }}
          >
            <Plus size={32} strokeWidth={3} />
          </button>

          <button onClick={() => setActiveTab('current')} className={`flex flex-col items-center gap-1 ${activeTab === 'current' ? 'text-indigo-500' : 'text-gray-500'}`}>
            <Clock size={22} />
            <span className="font-black uppercase tracking-tighter" style={{ fontSize: '9px' }}>Current</span>
          </button>
          <button onClick={() => setActiveTab('statistics')} className={`flex flex-col items-center gap-1 ${activeTab === 'statistics' ? 'text-red-500' : 'text-gray-500'}`}>
            <ChartIcon size={22} />
            <span className="font-black uppercase tracking-tighter" style={{ fontSize: '9px' }}>Stats</span>
          </button>
        </div>
      </footer>

      {/* START SESSION MODAL */}
      {showAddPage && (
        <div className="fixed inset-0 flex flex-col animate-in" style={{ backgroundColor: '#121212', zIndex: 100 }}>
          <div className="px-6 pt-12 pb-6 border-b flex justify-between items-center" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Select Activity</h3>
              <p className="text-gray-500 font-bold uppercase tracking-widest mt-1" style={{ fontSize: '10px' }}>What are you working on?</p>
            </div>
            <button 
              onClick={() => setShowAddPage(false)} 
              className="w-12 h-12 text-gray-400 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <X size={24}/>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
            <div className="grid grid-cols-2 gap-4 pb-12 max-w-md mx-auto w-full">
              {activities.map(a => (
                <button 
                  key={a.id} 
                  onClick={() => handleStartTracking(a.id)} 
                  className="flex flex-col items-center p-8 rounded-3xl border active:opacity-50 transition-all"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)' }}
                >
                  <span className="text-5xl mb-4">{a.icon}</span>
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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-in { animation: fadeIn 0.2s ease-out forwards; }
      `}} />
    </div>
  );
};

export default App;