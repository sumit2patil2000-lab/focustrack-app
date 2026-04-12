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
  Trash2,
  Share2,
  Filter,
  MapPin
} from 'lucide-react';

const App = () => {
  // Helper to get local date string YYYY-MM-DD without UTC offset issues
  const getLocalDateString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

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
  
  // Initialize with the actual machine date
  const [scheduleDate, setScheduleDate] = useState(getLocalDateString());
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);

  // Form State for New Activity
  const [newActivity, setNewActivity] = useState({ name: '', icon: '🎯', color: '#3b82f6' });

  // Persistence logic
  useEffect(() => {
    const savedLogs = localStorage.getItem('tracker_logs_v5');
    const savedActivities = localStorage.getItem('tracker_activities_v5');
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedActivities) setActivities(JSON.parse(savedActivities));
  }, []);

  useEffect(() => {
    localStorage.setItem('tracker_logs_v5', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('tracker_activities_v5', JSON.stringify(activities));
  }, [activities]);

  // Heartbeat: Synchronize app state with actual machine clock every second
  useEffect(() => {
    const syncWithMachineTime = () => {
      const now = new Date();
      const actualToday = getLocalDateString();
      
      // Update red timeline marker
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());

      // If the app is currently displaying what WAS today, but the machine date has changed,
      // update the view automatically so the user is always on the current day.
      setScheduleDate(currentViewDate => {
        // Only auto-jump if the user was on the "old" today. 
        // We don't want to jump if they are explicitly looking at a date in the far past.
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const yesterday = d.toISOString().split('T')[0];

        if (currentViewDate === yesterday) {
          return actualToday;
        }
        return currentViewDate;
      });
    };

    syncWithMachineTime();
    const ticker = setInterval(syncWithMachineTime, 1000); 
    return () => clearInterval(ticker);
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
    const now = new Date();
    
    const newSession = {
      id: Date.now().toString(),
      activityId: activity.id,
      name: activity.name,
      icon: activity.icon,
      color: activity.color,
      startTime: now.toISOString(), // Real machine time
    };

    // If we start a session, ensure the view is on the day the session started
    setScheduleDate(getLocalDateString());
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
    if (h > 0) return `${h} h ${m} m`;
    return `${m} min`;
  };

  const getMinutesSinceMidnight = (isoString) => {
    const date = new Date(isoString);
    return date.getHours() * 60 + date.getMinutes();
  };

  const filteredLogs = useMemo(() => {
    // Check if logs belong to the currently viewed scheduleDate
    const dayLogs = logs.filter(log => {
        const logDate = new Date(log.startTime);
        const logDateStr = new Date(logDate.getTime() - (logDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        return logDateStr === scheduleDate;
    });

    // Inject active session if it matches the current view date
    if (currentSession) {
        const sessionDate = new Date(currentSession.startTime);
        const sessionDateStr = new Date(sessionDate.getTime() - (sessionDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        if (sessionDateStr === scheduleDate) {
            dayLogs.push({ ...currentSession, endTime: new Date().toISOString(), duration: elapsedTime, isActive: true });
        }
    }
    return dayLogs;
  }, [logs, currentSession, elapsedTime, scheduleDate]);

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

  const renderPieChart = () => {
    if (stats.grandTotal === 0) return null;
    
    let cumulativePercent = 0;
    const radius = 80;
    const center = 100;
    
    return (
      <svg viewBox="0 0 200 200" className="w-full max-w-[240px] mx-auto drop-shadow-xl">
        <circle cx={center} cy={center} r={radius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="30" />
        {stats.sorted.map((item, i) => {
          const percent = item.seconds / stats.grandTotal;
          const startAngle = cumulativePercent * 360;
          const endAngle = (cumulativePercent + percent) * 360;
          cumulativePercent += percent;

          const x1 = center + radius * Math.cos((startAngle - 90) * (Math.PI / 180));
          const y1 = center + radius * Math.sin((startAngle - 90) * (Math.PI / 180));
          const x2 = center + radius * Math.cos((endAngle - 90) * (Math.PI / 180));
          const y2 = center + radius * Math.sin((endAngle - 90) * (Math.PI / 180));

          const largeArcFlag = percent > 0.5 ? 1 : 0;
          const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

          const midAngle = (startAngle + endAngle) / 2;
          const iconR = radius;
          const ix = center + iconR * Math.cos((midAngle - 90) * (Math.PI / 180));
          const iy = center + iconR * Math.sin((midAngle - 90) * (Math.PI / 180));

          return (
            <g key={i}>
              <path d={pathData} fill="none" stroke={item.color} strokeWidth="30" strokeLinecap="butt" />
              {percent > 0.05 && (
                <text x={ix} y={iy} fontSize="10" textAnchor="middle" dominantBaseline="middle" className="pointer-events-none select-none">
                  {item.icon}
                </text>
              )}
            </g>
          );
        })}
        <circle cx={center} cy={center} r={radius - 15} fill="#0A0A0A" />
      </svg>
    );
  };

  const isToday = scheduleDate === getLocalDateString();
  const adjustDate = (days) => {
    const d = new Date(scheduleDate);
    d.setDate(d.getDate() + days);
    setScheduleDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="fixed inset-0 font-sans flex flex-col overflow-hidden" style={{ backgroundColor: '#0A0A0A', color: '#E5E5E5' }}>
      <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet" />
      
      <header className="px-6 py-4 flex flex-col gap-4 shrink-0 z-40" style={{ backgroundColor: '#0A0A0A' }}>
        <div className="flex justify-between items-center">
            <h1 className="text-xl font-black text-white">
                {activeTab === 'statistics' ? 'Statistics' : 'Timeline'}
            </h1>
            <div className="flex gap-4">
                <MapPin size={20} className="text-gray-400" />
                <Filter size={20} className="text-gray-400" />
                <MoreVertical size={20} className="text-gray-400" />
            </div>
        </div>

        {activeTab === 'statistics' && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {['Day', 'Week', 'Month', 'Year', 'Custom'].map(t => (
                    <button 
                        key={t}
                        className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${t === 'Day' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 border-white/5 text-gray-400'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>
        )}

        <div className="flex items-center justify-between bg-white/5 rounded-2xl p-1 px-4">
            <button onClick={() => adjustDate(-1)} className="p-2 text-gray-400"><ChevronLeft size={20}/></button>
            <div className="relative group flex items-center gap-2">
                <input 
                    type="date" 
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <span className="text-sm font-black text-white uppercase tracking-wider">
                    {new Date(scheduleDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <CalendarIcon size={14} className="text-blue-500" />
            </div>
            <button onClick={() => adjustDate(1)} className="p-2 text-gray-400"><ChevronRight size={20}/></button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'schedule' && (
          <div className="h-full overflow-y-auto no-scrollbar relative w-full px-4">
            <div className="max-w-md mx-auto w-full relative" style={{ height: '1500px' }}>
              {Array.from({ length: 25 }, (_, i) => i).map(h => (
                <div key={h} className="absolute left-0 right-0 border-t flex items-start" style={{ top: `${h * 60}px`, borderColor: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-gray-600 font-bold -mt-2.5 pr-2" style={{ fontSize: '10px', width: '3rem', backgroundColor: '#0A0A0A' }}>
                    {h.toString().padStart(2, '0')}:00
                  </span>
                </div>
              ))}

              {isToday && (
                <div className="absolute left-0 right-0 flex items-center z-20 pointer-events-none" style={{ top: `${currentTimeMinutes}px` }}>
                  <div className="w-12 text-right pr-2">
                    <span className="text-red-500 font-black bg-red-500/10 px-1 rounded" style={{ fontSize: '9px' }}>NOW</span>
                  </div>
                  <div className="flex-1 h-[1px] bg-red-500/50 relative">
                    <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
                  </div>
                </div>
              )}

              <div className="absolute top-0 bottom-0 right-0" style={{ left: '3.5rem' }}>
                {filteredLogs.map((log, idx) => {
                  const startMinutes = getMinutesSinceMidnight(log.startTime);
                  const durationMinutes = log.isActive ? (elapsedTime / 60) : (log.duration / 60);
                  const height = Math.max(durationMinutes, 30);
                  return (
                    <div key={idx} className="absolute left-0 right-0 rounded-2xl p-3 border shadow-xl flex items-center overflow-hidden transition-all"
                      style={{
                        top: `${startMinutes}px`,
                        height: `${height}px`,
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderColor: 'rgba(255, 255, 255, 0.05)',
                        zIndex: log.isActive ? 10 : 1
                      }}>
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner" style={{ backgroundColor: log.color + '33', border: `1px solid ${log.color}` }}>
                          {log.icon}
                        </div>
                        <div className="flex-1">
                           <p className="font-black text-[11px] text-white uppercase tracking-wider">{log.name}</p>
                           <p className="text-[10px] font-bold text-gray-500">{formatDuration(log.isActive ? elapsedTime : log.duration)}</p>
                        </div>
                        {log.isActive && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="h-full overflow-y-auto p-4 no-scrollbar">
            <div className="max-w-md mx-auto space-y-6">
                <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col items-center">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6">
                        {new Date(scheduleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </h3>
                    <div className="relative w-full aspect-square flex items-center justify-center">
                        {renderPieChart()}
                        <div className="absolute flex flex-col items-center justify-center text-center">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total</p>
                            <p className="text-2xl font-black text-white tabular-nums">{formatDuration(stats.grandTotal)}</p>
                        </div>
                    </div>
                    <button className="mt-8 bg-red-500 hover:bg-red-600 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-red-500/20 active:scale-95 transition-all">
                        <Share2 size={16} /> Share
                    </button>
                </div>

                <div className="space-y-3 pb-8">
                    {stats.sorted.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ backgroundColor: item.color }}>
                                    {item.icon}
                                </div>
                                <span className="text-sm font-black uppercase tracking-wider text-white">{item.name}</span>
                            </div>
                            <span className="text-sm font-bold text-gray-400 tabular-nums">{formatDuration(item.seconds)}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {activeTab === 'tags' && (
          <div className="h-full overflow-y-auto p-6 no-scrollbar">
            <div className="max-w-md mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Inventory</h3>
                <button onClick={() => setShowNewActivityForm(!showNewActivityForm)} className="text-blue-500 p-2 bg-blue-500/10 rounded-xl"><Plus size={20} /></button>
              </div>

              {showNewActivityForm && (
                <div className="mb-6 p-6 rounded-[2rem] border border-blue-500/30 bg-blue-500/5 animate-in">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                        <input value={newActivity.name} onChange={(e) => setNewActivity({...newActivity, name: e.target.value})} placeholder="Activity Name" className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500 outline-none" />
                        <input value={newActivity.icon} onChange={(e) => setNewActivity({...newActivity, icon: e.target.value})} placeholder="Emoji" className="w-16 bg-black/50 border border-white/10 rounded-xl p-3 text-center text-lg outline-none" />
                    </div>
                    <div className="flex justify-between items-center">
                        <input type="color" value={newActivity.color} onChange={(e) => setNewActivity({...newActivity, color: e.target.value})} className="w-12 h-8 rounded-lg cursor-pointer bg-transparent border-none" />
                        <div className="flex gap-2">
                           <button onClick={() => setShowNewActivityForm(false)} className="px-4 text-[10px] font-black uppercase text-gray-500">Cancel</button>
                           <button onClick={() => {
                             if (!newActivity.name) return;
                             setActivities([...activities, { ...newActivity, id: Date.now().toString() }]);
                             setShowNewActivityForm(false);
                             setNewActivity({ name: '', icon: '🎯', color: '#3b82f6' });
                           }} className="bg-blue-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase">Save</button>
                        </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {activities.map(a => (
                  <div key={a.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex items-center justify-center bg-black/40 rounded-2xl text-2xl border border-white/5">{a.icon}</div>
                      <span className="font-black text-sm uppercase tracking-wider">{a.name}</span>
                    </div>
                    <button onClick={() => setActivities(activities.filter(x => x.id !== a.id))} className="p-2 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'current' && (
          <div className="h-full flex flex-col items-center justify-center p-8">
            {currentSession ? (
              <div className="w-full max-w-sm rounded-[3rem] p-12 text-center border shadow-2xl relative bg-white/[0.02] border-white/5">
                <div className="text-8xl mb-6 drop-shadow-2xl">{currentSession.icon}</div>
                <h2 className="text-4xl font-black mb-1 uppercase tracking-tighter">{currentSession.name}</h2>
                <div className="text-6xl font-mono font-black my-12 text-white tabular-nums tracking-tighter">
                  {Math.floor(elapsedTime / 3600).toString().padStart(2, '0')}:
                  {Math.floor((elapsedTime % 3600) / 60).toString().padStart(2, '0')}:
                  {(elapsedTime % 60).toString().padStart(2, '0')}
                </div>
                <button onClick={handleStopTracking} className="w-full bg-red-600 py-6 rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm">
                  <Square size={20} fill="white" /> Stop Session
                </button>
              </div>
            ) : (
              <div className="text-center opacity-20">
                <Clock size={64} className="mx-auto mb-4" />
                <p className="font-black uppercase tracking-widest text-sm">No active session</p>
                <button onClick={() => setShowAddPage(true)} className="mt-4 text-blue-500 font-bold text-sm underline underline-offset-8">Start Tracking</button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="shrink-0 border-t px-6 pt-3 pb-8 z-50" style={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="max-w-md mx-auto flex justify-between items-center relative">
          <button onClick={() => setActiveTab('schedule')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'schedule' ? 'text-white' : 'text-gray-600'}`}>
            <div className={`p-2 rounded-2xl ${activeTab === 'schedule' ? 'bg-red-500 shadow-lg shadow-red-500/20' : ''}`}><CalendarIcon size={20} /></div>
            <span className="font-black uppercase" style={{ fontSize: '8px' }}>Schedule</span>
          </button>
          <button onClick={() => setActiveTab('tags')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'tags' ? 'text-white' : 'text-gray-600'}`}>
            <div className={`p-2 rounded-2xl ${activeTab === 'tags' ? 'bg-orange-500' : ''}`}><Tag size={20} /></div>
            <span className="font-black uppercase" style={{ fontSize: '8px' }}>Activities</span>
          </button>
          
          <button onClick={() => setShowAddPage(true)} className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)] -mt-12 border-8 border-[#0A0A0A] active:scale-90 transition-all">
            <Plus size={32} strokeWidth={4} />
          </button>

          <button onClick={() => setActiveTab('current')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'current' ? 'text-white' : 'text-gray-600'}`}>
            <div className={`p-2 rounded-2xl ${activeTab === 'current' ? 'bg-indigo-500' : ''}`}><Clock size={20} /></div>
            <span className="font-black uppercase" style={{ fontSize: '8px' }}>Timer</span>
          </button>
          <button onClick={() => setActiveTab('statistics')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'statistics' ? 'text-white' : 'text-gray-600'}`}>
            <div className={`p-2 rounded-2xl ${activeTab === 'statistics' ? 'bg-red-500 shadow-lg shadow-red-500/20' : ''}`}><ChartIcon size={20} /></div>
            <span className="font-black uppercase" style={{ fontSize: '8px' }}>Stats</span>
          </button>
        </div>
      </footer>

      {showAddPage && (
        <div className="fixed inset-0 flex flex-col animate-in" style={{ backgroundColor: '#0A0A0A', zIndex: 100 }}>
          <div className="px-8 pt-16 pb-8 flex justify-between items-start">
            <div>
              <h3 className="text-4xl font-black text-white uppercase tracking-tighter">SELECT ACTIVITY</h3>
              <p className="text-gray-600 font-bold uppercase tracking-widest mt-1 text-xs">WHAT ARE YOU DOING NOW?</p>
            </div>
            <button onClick={() => setShowAddPage(false)} className="p-4 text-gray-500"><X size={32}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
            <div className="grid grid-cols-2 gap-4 pb-20 max-w-md mx-auto">
              {activities.map(a => (
                <button key={a.id} onClick={() => handleStartTracking(a.id)} className="flex flex-col items-center p-10 rounded-[2.5rem] border border-white/5 bg-white/[0.03] active:scale-95 transition-all">
                  <span className="text-6xl mb-4">{a.icon}</span>
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
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; }
      `}} />
    </div>
  );
};

export default App;