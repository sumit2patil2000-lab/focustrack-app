import React, { useState, useEffect, useMemo } from 'react';
import { 
  Square, 
  Plus, 
  Trash2, 
  Clock, 
  X,
  Calendar as CalendarIcon,
  PieChart as ChartIcon,
  Tag,
  Share2,
  ChevronLeft,
  ChevronRight,
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

  // Persistence
  useEffect(() => {
    const savedActivities = localStorage.getItem('focus_activities_v3');
    const savedLogs = localStorage.getItem('focus_logs_v3');
    const savedSession = localStorage.getItem('focus_current_session_v3');
    if (savedActivities) setActivities(JSON.parse(savedActivities));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedSession) setCurrentSession(JSON.parse(savedSession));
  }, []);

  useEffect(() => {
    localStorage.setItem('focus_activities_v3', JSON.stringify(activities));
    localStorage.setItem('focus_logs_v3', JSON.stringify(logs));
    localStorage.setItem('focus_current_session_v3', JSON.stringify(currentSession));
  }, [activities, logs, currentSession]);

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
      color: activity.color || '#3b82f6',
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
    setLogs(prev => [completedSession, ...prev].sort((a,b) => new Date(b.startTime) - new Date(a.startTime)));
    setCurrentSession(null);
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} h ${m} m`;
    return `${m} min`;
  };

  const formatClockTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatHourLabel = (hour) => {
    const h = hour % 12 || 12;
    return h.toString().padStart(2, '0');
  };

  // Data Processing for Schedule and Stats
  const dailyTimelineItems = useMemo(() => {
    const dayLogs = logs.filter(log => new Date(log.startTime).toISOString().split('T')[0] === scheduleDate);
    if (currentSession && new Date(currentSession.startTime).toISOString().split('T')[0] === scheduleDate) {
      dayLogs.push({ ...currentSession, endTime: new Date().toISOString(), duration: elapsedTime, isActive: true });
    }
    return dayLogs.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [logs, currentSession, elapsedTime, scheduleDate]);

  const statsSummary = useMemo(() => {
    const totals = dailyTimelineItems.reduce((acc, log) => {
      acc[log.name] = (acc[log.name] || 0) + (log.isActive ? elapsedTime : log.duration);
      return acc;
    }, {});
    
    const totalSeconds = Object.values(totals).reduce((a, b) => a + b, 0);
    
    return Object.entries(totals).map(([name, seconds]) => {
      const activity = activities.find(a => a.name === name);
      return {
        name,
        seconds,
        color: activity?.color || '#3b82f6',
        icon: activity?.icon,
        percent: totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0
      };
    }).sort((a, b) => b.seconds - a.seconds);
  }, [dailyTimelineItems, activities, elapsedTime]);

  // Donut chart path helper
  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#E5E5E5] font-sans pb-32">
      {/* Tailwind CDN injection for local preview compatibility */}
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      
      {/* Dynamic Header */}
      <header className="px-6 pt-10 pb-4 border-b border-white/5 bg-[#121212]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white">
              {activeTab === 'statistics' ? 'Statistics' : 
               new Date(scheduleDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </h1>
            {activeTab === 'statistics' ? null : (
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                {currentSession ? `Current: ${currentSession.name}` : 'Ready to start'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {activeTab === 'statistics' ? (
              <>
                <MapPin size={18} className="text-neutral-400" />
                <Filter size={18} className="text-neutral-400" />
                <MoreVertical size={18} className="text-neutral-400" />
              </>
            ) : (
              <div className="relative">
                <input 
                  type="date" 
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-8 h-8 opacity-0 absolute inset-0 z-10 cursor-pointer"
                />
                <CalendarIcon size={20} className="text-blue-500" />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4">
        
        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <div className="space-y-4 relative pl-12 min-h-[500px]">
            {/* Hour Scale */}
            <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between py-4 text-[11px] font-bold text-neutral-600">
              {[0, 3, 6, 9, 12, 15, 18, 21, 0].map((h, i) => (
                <span key={i} className="h-0 flex items-center">{formatHourLabel(h)}:00</span>
              ))}
            </div>

            <div className="absolute left-[2.85rem] top-4 bottom-4 w-[2px] bg-white/5" />
            
            <div className="space-y-3">
              {dailyTimelineItems.length === 0 ? (
                <div className="text-center py-20 text-neutral-600">No logs today</div>
              ) : (
                dailyTimelineItems.map((item, idx) => (
                  <div key={idx} className={`relative p-4 rounded-2xl border transition-all ${item.isActive ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/5'}`}>
                    <div className="absolute left-[-2.08rem] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-[#121212] bg-neutral-800" 
                         style={{ backgroundColor: item.isActive ? item.color : '#404040' }}/>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-full text-white text-[10px] font-black flex items-center gap-1.5 shadow-lg" style={{ backgroundColor: item.color }}>
                          <span>{item.icon}</span>
                          <span className="uppercase tracking-widest">{item.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500 tabular-nums">
                          {formatClockTime(item.startTime)} — {formatClockTime(item.endTime)}
                        </span>
                      </div>
                      <span className="text-xs font-bold tabular-nums">
                        {item.isActive ? formatDuration(elapsedTime) : formatDuration(item.duration)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STATISTICS TAB */}
        {activeTab === 'statistics' && (
          <div className="animate-in fade-in duration-500 space-y-4 pb-10">
            {/* Filter Pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
              {['Day', 'Week', 'Month', 'Year', 'Custom'].map(f => (
                <button key={f} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${f === 'Day' ? 'bg-red-500 text-white' : 'bg-white/5 text-neutral-400'}`}>
                  {f}
                </button>
              ))}
            </div>

            {/* Date Selector */}
            <div className="flex items-center justify-between bg-white/5 rounded-2xl p-2 px-4">
              <ChevronLeft size={20} className="text-neutral-500" />
              <span className="text-sm font-bold">{new Date(scheduleDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <ChevronRight size={20} className="text-neutral-500" />
            </div>

            {/* Main Stats Card */}
            <div className="bg-white rounded-[2.5rem] p-6 text-neutral-900 shadow-xl overflow-hidden relative">
              <h4 className="text-center font-bold mb-6">{new Date(scheduleDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</h4>
              
              {/* Donut Chart */}
              <div className="relative w-64 h-64 mx-auto mb-8">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {statsSummary.length > 0 ? (() => {
                    let cumulativePercent = 0;
                    return statsSummary.map((slice, i) => {
                      const start = cumulativePercent;
                      cumulativePercent += slice.percent;
                      const end = cumulativePercent;
                      
                      const startAngle = (start / 100) * 360;
                      const endAngle = (end / 100) * 360;
                      
                      return (
                        <path 
                          key={i}
                          d={describeArc(50, 50, 40, startAngle, endAngle)}
                          fill="none"
                          stroke={slice.color}
                          strokeWidth="15"
                          className="transition-all duration-1000"
                        />
                      );
                    });
                  })() : (
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="15" />
                  )}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-40 h-40 bg-white rounded-full flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Total</span>
                    <span className="text-2xl font-black tabular-nums">
                      {formatDuration(statsSummary.reduce((acc, s) => acc + s.seconds, 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Share Button */}
              <button className="absolute bottom-6 right-6 bg-red-500 text-white px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                <Share2 size={16} /> Share
              </button>
            </div>

            {/* List View of activities */}
            <div className="bg-white rounded-[2.5rem] p-6 text-neutral-900 space-y-4">
              {statsSummary.map((item, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: item.color }}>
                      {item.icon}
                    </div>
                    <span className="font-bold text-sm">{item.name}</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-neutral-500 tabular-nums">
                    {formatDuration(item.seconds)}
                  </span>
                </div>
              ))}
              {statsSummary.length === 0 && <p className="text-center text-neutral-400 py-4 italic">No data logged yet</p>}
            </div>
          </div>
        )}

        {/* CURRENT ACTIVITY TAB */}
        {activeTab === 'current' && (
          <div className="flex flex-col items-center justify-center pt-12 animate-in fade-in zoom-in-95 duration-300">
            {currentSession ? (
              <div className="w-full bg-white/5 rounded-[3rem] p-10 text-white text-center border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(elapsedTime % 60) / 60 * 100}%` }} />
                </div>
                <div className="text-8xl mb-6 drop-shadow-2xl">{currentSession.icon}</div>
                <h2 className="text-3xl font-black mb-1 tracking-tight text-white">{currentSession.name}</h2>
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.2em] mb-12">Tracking In Progress</p>
                
                <div className="text-6xl font-mono font-black mb-12 tracking-tighter tabular-nums text-blue-500">
                  {Math.floor(elapsedTime / 3600).toString().padStart(2, '0')}:
                  {Math.floor((elapsedTime % 3600) / 60).toString().padStart(2, '0')}:
                  {(elapsedTime % 60).toString().padStart(2, '0')}
                </div>
                <button onClick={handleStopTracking} className="w-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all py-5 rounded-3xl font-black flex items-center justify-center gap-3 shadow-xl shadow-red-500/20 text-lg uppercase tracking-wider">
                  <Square size={22} fill="white" /> Stop
                </button>
              </div>
            ) : (
              <div className="text-center py-20 bg-white/5 rounded-[3rem] w-full border border-dashed border-white/10 flex flex-col items-center">
                <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                  <Clock size={32} className="text-neutral-600" />
                </div>
                <p className="text-neutral-500 font-bold text-lg">Nothing is running</p>
                <p className="text-xs text-neutral-600 mt-2 font-medium">Tap the center button to start an activity</p>
              </div>
            )}
          </div>
        )}

        {/* TAGS TAB */}
        {activeTab === 'tags' && (
          <div className="animate-in fade-in duration-300 space-y-6 pb-10">
            <div className="grid grid-cols-2 gap-3">
              {activities.map(a => (
                <div key={a.id} className="bg-white/5 border border-white/5 p-4 rounded-3xl flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{a.icon}</span>
                    <span className="font-bold text-sm">{a.name}</span>
                  </div>
                  <button onClick={() => setActivities(activities.filter(act => act.id !== a.id))} className="p-2 text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Bottom Nav */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#121212]/95 backdrop-blur-xl border-t border-white/5 px-4 pt-3 pb-10 z-40">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1 relative items-center">
          <button onClick={() => setActiveTab('schedule')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'schedule' ? 'text-blue-500' : 'text-neutral-600'}`}>
            <CalendarIcon size={20} className="mb-1" strokeWidth={activeTab === 'schedule' ? 3 : 2} />
            <span className="text-[10px] font-black uppercase tracking-tighter">Schedule</span>
          </button>
          <button onClick={() => setActiveTab('tags')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'tags' ? 'text-pink-500' : 'text-neutral-600'}`}>
            <Tag size={20} className="mb-1" strokeWidth={activeTab === 'tags' ? 3 : 2} />
            <span className="text-[10px] font-black uppercase tracking-tighter">Tags</span>
          </button>
          <div className="flex justify-center -mt-10">
            <button onClick={() => setShowAddPage(true)} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-[0_10px_40px_rgba(239,68,68,0.4)] active:scale-90 transition-transform z-50 border-[6px] border-[#121212]">
              <Plus size={32} strokeWidth={4} />
            </button>
          </div>
          <button onClick={() => setActiveTab('current')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'current' ? 'text-indigo-500' : 'text-neutral-600'}`}>
            <Clock size={20} className="mb-1" strokeWidth={activeTab === 'current' ? 3 : 2} />
            <span className="text-[10px] font-black uppercase tracking-tighter">Current</span>
          </button>
          <button onClick={() => setActiveTab('statistics')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'statistics' ? 'text-red-500' : 'text-neutral-600'}`}>
            <ChartIcon size={20} className="mb-1" strokeWidth={activeTab === 'statistics' ? 3 : 2} />
            <span className="text-[10px] font-black uppercase tracking-tighter">Stats</span>
          </button>
        </div>
      </footer>

      {/* Select Activity Modal */}
      {showAddPage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex flex-col justify-end">
          <div className="bg-[#1C1C1E] rounded-t-[3rem] p-8 max-w-md mx-auto w-full shadow-2xl animate-in slide-in-from-bottom duration-400">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-white">Start Session</h3>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em]">Select activity</p>
              </div>
              <button onClick={() => setShowAddPage(false)} className="p-4 bg-white/5 text-neutral-400 rounded-full hover:bg-white/10 transition-colors">
                <X size={24}/>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pb-10 no-scrollbar">
              {activities.map(a => (
                <button 
                  key={a.id} 
                  onClick={() => handleStartTracking(a.id)} 
                  className="flex flex-col items-center p-8 bg-white/5 rounded-[2.5rem] border border-white/5 active:bg-blue-500/20 active:border-blue-500/40 transition-all group"
                >
                  <span className="text-5xl mb-4 group-active:scale-110 transition-transform">{a.icon}</span>
                  <span className="text-sm font-black text-white/90">{a.name}</span>
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
        @keyframes zoom-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-in { animation-duration: 0.3s; animation-timing-function: ease-out; animation-fill-mode: forwards; }
        .fade-in { animation-name: fade-in; }
        .zoom-in-95 { animation-name: zoom-in; }
        .slide-in-from-bottom { animation-name: slide-up; }
      `}} />
    </div>
  );
};

export default App;