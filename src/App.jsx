import React, { useState, useEffect, useMemo } from 'react';
import { 
  Square, 
  Plus, 
  Clock, 
  X,
  Calendar as CalendarIcon,
  PieChart as ChartIcon,
  Tag,
  MoreVertical,
  Activity,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';

const App = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState('schedule');
  const [showAddPage, setShowAddPage] = useState(false);
  const [showNewActivityForm, setShowNewActivityForm] = useState(false);

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

  // Form State for New Activity
  const [newActivity, setNewActivity] = useState({ name: '', icon: '🎯', color: '#3b82f6' });

  // Hourly slots for the timeline (00 to 24)
  const hours = Array.from({ length: 25 }, (_, i) => i);

  // Persistence logic
  useEffect(() => {
    const savedLogs = localStorage.getItem('tracker_logs_v4');
    const savedActivities = localStorage.getItem('tracker_activities_v4');
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedActivities) setActivities(JSON.parse(savedActivities));
  }, []);

  useEffect(() => {
    localStorage.setItem('tracker_logs_v4', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('tracker_activities_v4', JSON.stringify(activities));
  }, [activities]);

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

  const handleAddActivity = (e) => {
    e.preventDefault();
    if (!newActivity.name.trim()) return;
    
    const activity = {
      ...newActivity,
      id: Date.now().toString()
    };
    setActivities(prev => [...prev, activity]);
    setNewActivity({ name: '', icon: '🎯', color: '#3b82f6' });
    setShowNewActivityForm(false);
  };

  const handleDeleteActivity = (id) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
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

  // Statistics Calculation
  const stats = useMemo(() => {
    const totals = filteredLogs.reduce((acc, log) => {
      acc[log.name] = (acc[log.name] || 0) + (log.isActive ? elapsedTime : log.duration);
      return acc;
    }, {});

    const sorted = Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .map(([name, seconds]) => {
        const activity = activities.find(a => a.name === name);
        return { name, seconds, icon: activity?.icon, color: activity?.color };
      });

    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
    return { sorted, grandTotal };
  }, [filteredLogs, activities, elapsedTime]);

  const isToday = scheduleDate === new Date().toISOString().split('T')[0];

  const adjustDate = (days) => {
    const d = new Date(scheduleDate);
    d.setDate(d.getDate() + days);
    setScheduleDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="fixed inset-0 font-sans flex flex-col overflow-hidden" style={{ backgroundColor: '#0A0A0A', color: '#E5E5E5' }}>
      <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet" />
      
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center shrink-0 z-40 border-b" style={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
            <button onClick={() => adjustDate(-1)} className="p-1 hover:bg-white/5 rounded"><ChevronLeft size={18} className="text-gray-500"/></button>
            <div className="text-center">
                <h1 className="text-sm font-black text-white uppercase tracking-wider">
                    {activeTab === 'statistics' ? 'Day Stats' : 
                    new Date(scheduleDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </h1>
                <p className="font-black text-blue-500 uppercase tracking-widest" style={{ fontSize: '9px' }}>
                    {currentSession ? `Tracking: ${currentSession.name}` : 'Overview'}
                </p>
            </div>
            <button onClick={() => adjustDate(1)} className="p-1 hover:bg-white/5 rounded"><ChevronRight size={18} className="text-gray-500"/></button>
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <input 
              type="date" 
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <CalendarIcon size={18} className="text-gray-400" />
          </div>
          <MoreVertical size={18} className="text-gray-500" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        
        {/* SCHEDULE VIEW */}
        {activeTab === 'schedule' && (
          <div className="h-full overflow-y-auto no-scrollbar relative w-full" style={{ scrollBehavior: 'smooth' }}>
            <div className="max-w-md mx-auto w-full relative" style={{ height: '1500px' }}>
              {hours.map(h => (
                <div key={h} className="absolute left-0 right-0 border-t flex items-start px-4" style={{ top: `${h * 60}px`, borderColor: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-gray-600 font-bold -mt-2.5 pr-2" style={{ fontSize: '10px', width: '3rem', backgroundColor: '#0A0A0A' }}>
                    {h.toString().padStart(2, '0')}:00
                  </span>
                </div>
              ))}

              {isToday && (
                <div className="absolute left-0 right-0 flex items-center z-20 pointer-events-none" style={{ top: `${currentTimeMinutes}px` }}>
                  <div className="w-12 text-right pr-2">
                    <span className="text-red-500 font-black bg-red-500/10 px-1 rounded" style={{ fontSize: '9px' }}>
                      NOW
                    </span>
                  </div>
                  <div className="flex-1 h-[1px] bg-red-500/50 relative">
                    <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  </div>
                </div>
              )}

              <div className="absolute top-0 bottom-0 right-4" style={{ left: '4rem' }}>
                {filteredLogs.map((log, idx) => {
                  const startMinutes = getMinutesSinceMidnight(log.startTime);
                  const durationMinutes = log.isActive ? (elapsedTime / 60) : (log.duration / 60);
                  const height = Math.max(durationMinutes, 25);
                  
                  return (
                    <div key={idx} className="absolute left-0 right-0 rounded-xl p-2.5 border shadow-xl flex flex-col justify-center overflow-hidden transition-all"
                      style={{
                        top: `${startMinutes}px`,
                        height: `${height}px`,
                        backgroundColor: log.isActive ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        borderColor: log.isActive ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                        zIndex: log.isActive ? 10 : 1
                      }}>
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center rounded-lg text-white w-5 h-5 text-xs shadow-inner" style={{ backgroundColor: log.color }}>
                            {log.icon}
                          </span>
                          <span className="font-black uppercase tracking-widest text-white truncate" style={{ fontSize: '10px' }}>
                            {log.name}
                          </span>
                        </div>
                        <span className="font-bold text-gray-500 tabular-nums" style={{ fontSize: '9px' }}>
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
              <div className="w-full max-w-sm rounded-[2.5rem] p-10 text-center border shadow-2xl relative overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-pulse" />
                <div className="text-7xl mb-6 drop-shadow-2xl">{currentSession.icon}</div>
                <h2 className="text-3xl font-black mb-1 uppercase tracking-tighter">{currentSession.name}</h2>
                <div className="text-6xl font-mono font-black my-12 text-white tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  {Math.floor(elapsedTime / 3600).toString().padStart(2, '0')}:
                  {Math.floor((elapsedTime % 3600) / 60).toString().padStart(2, '0')}:
                  {(elapsedTime % 60).toString().padStart(2, '0')}
                </div>
                <button 
                  onClick={handleStopTracking}
                  className="w-full bg-red-600 hover:bg-red-700 py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 uppercase tracking-widest text-sm"
                >
                  <Square size={18} fill="white" /> Stop Session
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-700">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <Clock size={32} className="opacity-20" />
                </div>
                <p className="font-black uppercase tracking-widest text-xs">No active session</p>
                <button onClick={() => setShowAddPage(true)} className="mt-4 text-blue-500 font-bold text-sm underline underline-offset-4">Start something new</button>
              </div>
            )}
          </div>
        )}

        {/* TAGS (INVENTORY) TAB */}
        {activeTab === 'tags' && (
          <div className="h-full overflow-y-auto p-6 no-scrollbar">
            <div className="max-w-md mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Activity Inventory</h3>
                <button 
                  onClick={() => setShowNewActivityForm(!showNewActivityForm)}
                  className="text-blue-500 p-1 bg-blue-500/10 rounded-lg"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Add Activity Form */}
              {showNewActivityForm && (
                <div className="mb-8 p-6 rounded-3xl border border-blue-500/30 bg-blue-500/5 animate-in">
                  <form onSubmit={handleAddActivity} className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-[9px] font-black text-gray-500 uppercase">Activity Name</label>
                        <input 
                          autoFocus
                          value={newActivity.name}
                          onChange={(e) => setNewActivity({...newActivity, name: e.target.value})}
                          placeholder="Reading..."
                          className="bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1 w-20">
                        <label className="text-[9px] font-black text-gray-500 uppercase">Emoji</label>
                        <input 
                          value={newActivity.icon}
                          onChange={(e) => setNewActivity({...newActivity, icon: e.target.value})}
                          placeholder="📚"
                          className="bg-black/50 border border-white/10 rounded-xl p-3 text-center text-lg focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-2">
                       <div className="flex items-center gap-2">
                          <label className="text-[9px] font-black text-gray-500 uppercase">Color</label>
                          <input 
                            type="color"
                            value={newActivity.color}
                            onChange={(e) => setNewActivity({...newActivity, color: e.target.value})}
                            className="w-8 h-8 rounded-lg overflow-hidden border-none cursor-pointer bg-transparent"
                          />
                       </div>
                       <div className="flex gap-2">
                          <button 
                            type="button" 
                            onClick={() => setShowNewActivityForm(false)}
                            className="px-4 py-2 text-[10px] font-black text-gray-500 uppercase"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                          >
                            Add Activity
                          </button>
                       </div>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {activities.map(a => (
                  <div key={a.id} className="border p-4 rounded-2xl flex items-center justify-between group transition-colors hover:bg-white/5" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl w-12 h-12 flex items-center justify-center bg-black/40 rounded-xl border border-white/5">{a.icon}</span>
                      <div>
                          <span className="font-black text-sm text-white uppercase tracking-tight">{a.name}</span>
                          <div className="h-1 w-8 rounded-full mt-1" style={{ backgroundColor: a.color }} />
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteActivity(a.id)}
                      className="p-2 text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STATISTICS TAB */}
        {activeTab === 'statistics' && (
          <div className="h-full overflow-y-auto p-6 no-scrollbar">
            <div className="max-w-md mx-auto space-y-6">
                
                {/* Daily Total Card */}
                <div className="bg-white/5 border border-white/5 p-6 rounded-3xl text-center relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
                    <Activity size={24} className="mx-auto mb-2 text-blue-500" />
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Focused Time</p>
                    <h2 className="text-4xl font-black text-white my-1 tabular-nums tracking-tighter">
                        {formatDuration(stats.grandTotal)}
                    </h2>
                </div>

                {/* Distribution List */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Time Breakdown</h3>
                    {stats.sorted.length > 0 ? (
                        stats.sorted.map((item, idx) => (
                            <div key={idx} className="bg-white/2 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{item.icon}</span>
                                        <span className="text-xs font-black uppercase tracking-wider text-white">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400">{formatDuration(item.seconds)}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full transition-all duration-1000 ease-out" 
                                        style={{ 
                                            width: `${(item.seconds / stats.grandTotal) * 100}%`,
                                            backgroundColor: item.color 
                                        }} 
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 opacity-20">
                            <ChartIcon size={48} className="mx-auto mb-2" strokeWidth={1}/>
                            <p className="text-xs font-bold uppercase tracking-widest">No data for this date</p>
                        </div>
                    )}
                </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <footer className="shrink-0 border-t px-6 pt-3 pb-8 z-50" style={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="max-w-md mx-auto flex justify-between items-center relative">
          <button onClick={() => setActiveTab('schedule')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'schedule' ? 'text-blue-500' : 'text-gray-600'}`}>
            <div className={`p-1.5 rounded-xl ${activeTab === 'schedule' ? 'bg-blue-500/10' : ''}`}><CalendarIcon size={20} /></div>
            <span className="font-black uppercase tracking-tighter" style={{ fontSize: '8px' }}>Timeline</span>
          </button>
          <button onClick={() => setActiveTab('tags')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'tags' ? 'text-pink-500' : 'text-gray-600'}`}>
            <div className={`p-1.5 rounded-xl ${activeTab === 'tags' ? 'bg-pink-500/10' : ''}`}><Tag size={20} /></div>
            <span className="font-black uppercase tracking-tighter" style={{ fontSize: '8px' }}>Inventory</span>
          </button>
          
          <button 
            onClick={() => setShowAddPage(true)} 
            className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] -mt-10 border-4 active:scale-90 transition-all active:shadow-none"
            style={{ borderColor: '#0A0A0A' }}
          >
            <Plus size={28} strokeWidth={4} />
          </button>

          <button onClick={() => setActiveTab('current')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'current' ? 'text-indigo-500' : 'text-gray-600'}`}>
            <div className={`p-1.5 rounded-xl ${activeTab === 'current' ? 'bg-indigo-500/10' : ''}`}><Clock size={20} /></div>
            <span className="font-black uppercase tracking-tighter" style={{ fontSize: '8px' }}>Active</span>
          </button>
          <button onClick={() => setActiveTab('statistics')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'statistics' ? 'text-emerald-500' : 'text-gray-600'}`}>
            <div className={`p-1.5 rounded-xl ${activeTab === 'statistics' ? 'bg-emerald-500/10' : ''}`}><ChartIcon size={20} /></div>
            <span className="font-black uppercase tracking-tighter" style={{ fontSize: '8px' }}>Stats</span>
          </button>
        </div>
      </footer>

      {/* START SESSION MODAL */}
      {showAddPage && (
        <div className="fixed inset-0 flex flex-col animate-in" style={{ backgroundColor: '#0A0A0A', zIndex: 100 }}>
          <div className="px-6 pt-12 pb-6 flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Choose Task</h3>
              <p className="text-gray-600 font-bold uppercase tracking-widest mt-1" style={{ fontSize: '10px' }}>Initiate focus period</p>
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
            <div className="grid grid-cols-2 gap-3 pb-12 max-w-md mx-auto w-full">
              {activities.map(a => (
                <button 
                  key={a.id} 
                  onClick={() => handleStartTracking(a.id)} 
                  className="flex flex-col items-center p-8 rounded-[2rem] border active:opacity-50 transition-all group"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}
                >
                  <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">{a.icon}</span>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{a.name}</span>
                </button>
              ))}
              <button 
                  onClick={() => { setShowAddPage(false); setActiveTab('tags'); setShowNewActivityForm(true); }}
                  className="flex flex-col items-center justify-center p-8 rounded-[2rem] border border-dashed border-white/10 active:opacity-50 transition-all"
                >
                  <Plus size={32} className="text-gray-600 mb-2" />
                  <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">New Tag</span>
                </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.25s ease-out forwards; }
        input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
        input[type="color"]::-webkit-color-swatch { border: none; border-radius: 8px; }
      `}} />
    </div>
  );
};

export default App;