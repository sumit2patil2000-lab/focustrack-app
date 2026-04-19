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
  ChevronLeft,
  ChevronRight,
  Trash2,
  Share2,
  Filter,
  MapPin,
  Edit3
} from 'lucide-react';

const App = () => {
  // --- UTILS ---
  const getLocalDateString = (date = new Date()) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  // --- STATE WITH AUTOMATIC DATA MIGRATION ---
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('tracker_data_logs') || 
                  localStorage.getItem('tracker_logs_v6') || 
                  localStorage.getItem('tracker_logs_v5');
    return saved ? JSON.parse(saved) : [];
  });

  const [activities, setActivities] = useState(() => {
    const defaultActs = [
      { id: '1', name: 'Sleep', icon: '☁️', color: '#3b82f6' },
      { id: '2', name: 'Work', icon: '💼', color: '#a855f7' },
      { id: '3', name: 'Training', icon: '🏃', color: '#10b981' },
      { id: '4', name: 'Eating', icon: '🍴', color: '#f97316' },
      { id: '5', name: 'Reading', icon: '📚', color: '#6366f1' }
    ];
    const saved = localStorage.getItem('tracker_data_acts') || 
                  localStorage.getItem('tracker_acts_v6') || 
                  localStorage.getItem('tracker_activities_v5');
    return saved ? JSON.parse(saved) : defaultActs;
  });

  const [currentSession, setCurrentSession] = useState(() => {
    const saved = localStorage.getItem('tracker_data_session') || 
                  localStorage.getItem('tracker_session_v6') || 
                  localStorage.getItem('tracker_current_session_v5');
    return saved ? JSON.parse(saved) : null;
  });

  // UI State
  const [activeTab, setActiveTab] = useState('schedule');
  const [showAddPage, setShowAddPage] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showNewActivityForm, setShowNewActivityForm] = useState(false);
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [scheduleDate, setScheduleDate] = useState(getLocalDateString());
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);

  // Form States
  const [manualForm, setManualForm] = useState({ activityId: '', start: '', end: '' });
  const [newActivity, setNewActivity] = useState({ name: '', icon: '🎯', color: '#3b82f6' });

  // --- PERSISTENCE ---
  // Now we strictly save to the permanent "tracker_data_" keys to never lose data again
  useEffect(() => {
    localStorage.setItem('tracker_data_logs', JSON.stringify(logs));
    localStorage.setItem('tracker_data_acts', JSON.stringify(activities));
    localStorage.setItem('tracker_data_session', JSON.stringify(currentSession));
  }, [logs, activities, currentSession]);

  // --- TIMER & CLOCK SYNC ---
  useEffect(() => {
    const sync = () => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
      
      if (currentSession) {
        const start = new Date(currentSession.startTime).getTime();
        const diff = Math.floor((now.getTime() - start) / 1000);
        setElapsedTime(diff > 0 ? diff : 0);
      }
    };
    sync();
    const ticker = setInterval(sync, 1000);
    return () => clearInterval(ticker);
  }, [currentSession]);

  // --- HANDLERS ---
  const handleStartTracking = (activityId) => {
    if (currentSession) handleStopTracking();
    const activity = activities.find(a => a.id === activityId);
    const session = {
      id: Date.now().toString(),
      activityId: activity.id,
      name: activity.name,
      icon: activity.icon,
      color: activity.color,
      startTime: new Date().toISOString(),
    };
    setCurrentSession(session);
    setElapsedTime(0);
    setShowAddPage(false);
    setActiveTab('current');
  };

  const handleStopTracking = () => {
    if (!currentSession) return;
    const now = new Date();
    const start = new Date(currentSession.startTime).getTime();
    const duration = Math.floor((now.getTime() - start) / 1000);

    const newLog = { ...currentSession, endTime: now.toISOString(), duration };
    setLogs(prev => [newLog, ...prev]);
    setCurrentSession(null);
    setElapsedTime(0);
  };

  const handleManualSave = () => {
    if (!manualForm.activityId || !manualForm.start || !manualForm.end) return;
    const activity = activities.find(a => a.id === manualForm.activityId);
    const start = new Date(manualForm.start);
    const end = new Date(manualForm.end);
    const duration = Math.floor((end - start) / 1000);

    if (duration <= 0) return;

    const manualLog = {
      id: Date.now().toString(),
      activityId: activity.id,
      name: activity.name,
      icon: activity.icon,
      color: activity.color,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration
    };

    setLogs(prev => [manualLog, ...prev]);
    setShowManualEntry(false);
    setManualForm({ activityId: '', start: '', end: '' });
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const getMinutesSinceMidnight = (isoString) => {
    const d = new Date(isoString);
    return d.getHours() * 60 + d.getMinutes();
  };

  // --- MEMOS ---
  const filteredLogs = useMemo(() => {
    return logs.filter(log => log.startTime.split('T')[0] === scheduleDate);
  }, [logs, scheduleDate]);

  const stats = useMemo(() => {
    const totals = filteredLogs.reduce((acc, log) => {
      acc[log.name] = (acc[log.name] || 0) + log.duration;
      return acc;
    }, {});
    const sorted = Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .map(([name, seconds]) => ({ 
        name, 
        seconds, 
        icon: activities.find(a => a.name === name)?.icon,
        color: activities.find(a => a.name === name)?.color 
      }));
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    return { sorted, total };
  }, [filteredLogs, activities]);

  // --- RENDER HELPERS ---
  const renderPieChart = () => {
    if (stats.total === 0) return <div className="text-gray-600 text-xs font-bold uppercase tracking-widest">No Data</div>;
    let cumulative = 0;
    return (
      <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-2xl">
        <circle cx="100" cy="100" r="80" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="25" />
        {stats.sorted.map((item, i) => {
          const percent = item.seconds / stats.total;
          const startAngle = cumulative * 360;
          const endAngle = (cumulative + percent) * 360;
          cumulative += percent;
          const x1 = 100 + 80 * Math.cos((startAngle - 90) * (Math.PI / 180));
          const y1 = 100 + 80 * Math.sin((startAngle - 90) * (Math.PI / 180));
          const x2 = 100 + 80 * Math.cos((endAngle - 90) * (Math.PI / 180));
          const y2 = 100 + 80 * Math.sin((endAngle - 90) * (Math.PI / 180));
          const largeArc = percent > 0.5 ? 1 : 0;
          return (
            <path key={i} d={`M ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2}`} fill="none" stroke={item.color} strokeWidth="25" />
          );
        })}
        <circle cx="100" cy="100" r="65" fill="#0A0A0A" />
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0A0A0A] text-[#E5E5E5] font-sans overflow-hidden">
      <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet" />
      
      {/* Header */}
      <header className="p-6 shrink-0 bg-[#0A0A0A] z-40 relative">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-black text-white uppercase tracking-tighter">
            {activeTab === 'schedule' ? 'Timeline' : activeTab === 'statistics' ? 'Analytics' : 'Settings'}
          </h1>
          <div className="flex gap-4 items-center">
            <button onClick={() => setShowManualEntry(true)} className="p-2 bg-white/5 rounded-xl text-blue-400">
              <Edit3 size={20} />
            </button>
            <MoreVertical size={20} className="text-gray-600" />
          </div>
        </div>

        <div className="flex items-center justify-between bg-white/5 rounded-2xl p-1 px-4">
          <button onClick={() => {
            const d = new Date(scheduleDate);
            d.setDate(d.getDate() - 1);
            setScheduleDate(getLocalDateString(d));
          }} className="p-2 text-gray-500"><ChevronLeft size={20}/></button>
          <div className="text-sm font-black text-white uppercase tracking-widest">
            {new Date(scheduleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <button onClick={() => {
            const d = new Date(scheduleDate);
            d.setDate(d.getDate() + 1);
            setScheduleDate(getLocalDateString(d));
          }} className="p-2 text-gray-500"><ChevronRight size={20}/></button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'schedule' && (
          <div className="h-full overflow-y-auto no-scrollbar p-4">
            <div className="max-w-md mx-auto relative" style={{ height: '1440px' }}>
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="absolute left-0 right-0 border-t border-white/5 flex" style={{ top: `${i * 60}px`, height: '60px' }}>
                  <span className="text-[10px] font-bold text-gray-700 -mt-2.5 bg-[#0A0A0A] pr-2">{i}:00</span>
                </div>
              ))}
              
              {scheduleDate === getLocalDateString() && (
                <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center" style={{ top: `${currentTimeMinutes}px` }}>
                  <div className="w-12 h-[1px] bg-red-500/50" />
                  <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                  <div className="flex-1 h-[1px] bg-red-500/50" />
                </div>
              )}

              <div className="absolute top-0 bottom-0 right-0" style={{ left: '3rem' }}>
                {filteredLogs.map(log => {
                  const top = getMinutesSinceMidnight(log.startTime);
                  const height = Math.max(log.duration / 60, 35);
                  return (
                    <div key={log.id} className="absolute left-0 right-0 rounded-2xl p-3 border border-white/10 flex items-center gap-3 overflow-hidden shadow-lg"
                      style={{ top: `${top}px`, height: `${height}px`, backgroundColor: log.color + '15' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: log.color + '30' }}>{log.icon}</div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-white truncate">{log.name}</p>
                        <p className="text-[9px] font-bold text-gray-500">{formatDuration(log.duration)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="h-full overflow-y-auto p-6 no-scrollbar">
            <div className="max-w-md mx-auto flex flex-col items-center">
              <div className="bg-white/5 w-full rounded-[3rem] p-10 flex flex-col items-center mb-8 border border-white/5">
                <div className="relative flex items-center justify-center mb-6">
                  {renderPieChart()}
                  <div className="absolute text-center">
                    <p className="text-[10px] font-black text-gray-600 uppercase">Total</p>
                    <p className="text-2xl font-black text-white">{formatDuration(stats.total)}</p>
                  </div>
                </div>
              </div>
              <div className="w-full space-y-3">
                {stats.sorted.map((item, i) => (
                  <div key={i} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: item.color }}>{item.icon}</div>
                      <span className="text-sm font-black uppercase">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-400">{formatDuration(item.seconds)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'current' && (
          <div className="h-full flex flex-col items-center justify-center p-8">
            {currentSession ? (
              <div className="w-full max-w-sm bg-white/5 p-12 rounded-[4rem] text-center border border-white/10 shadow-2xl">
                <div className="text-8xl mb-8 drop-shadow-2xl">{currentSession.icon}</div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">{currentSession.name}</h2>
                <div className="text-6xl font-mono font-black my-12 tabular-nums tracking-tighter">
                  {Math.floor(elapsedTime / 3600).toString().padStart(2, '0')}:
                  {Math.floor((elapsedTime % 3600) / 60).toString().padStart(2, '0')}:
                  {(elapsedTime % 60).toString().padStart(2, '0')}
                </div>
                <button onClick={handleStopTracking} className="w-full bg-red-600 py-6 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all">
                  Stop Session
                </button>
              </div>
            ) : (
              <div className="text-center opacity-20 flex flex-col items-center">
                <Clock size={64} className="mb-4" />
                <p className="font-black uppercase tracking-widest text-sm">Waiting for action</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tags' && (
          <div className="h-full overflow-y-auto p-6 no-scrollbar">
            <div className="max-w-md mx-auto space-y-4">
               {activities.map(a => (
                 <div key={a.id} className="bg-white/5 p-4 rounded-2xl flex items-center justify-between group border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-black/40 rounded-2xl flex items-center justify-center text-2xl border border-white/5">{a.icon}</div>
                      <span className="font-black uppercase text-sm tracking-wider">{a.name}</span>
                    </div>
                    <button onClick={() => setActivities(activities.filter(x => x.id !== a.id))} className="text-gray-600 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                 </div>
               ))}
               <button onClick={() => setShowNewActivityForm(true)} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-gray-500 font-black uppercase tracking-widest text-xs hover:border-blue-500/50 hover:text-blue-500 transition-all">
                 + Add New Activity
               </button>
            </div>
          </div>
        )}
      </main>

      {/* Navigation Footer */}
      <footer className="shrink-0 bg-[#0A0A0A] border-t border-white/5 px-6 pt-4 pb-10 relative z-40">
        <div className="max-w-md mx-auto flex justify-between items-center relative">
          <button onClick={() => setActiveTab('schedule')} className={`flex flex-col items-center gap-1 ${activeTab === 'schedule' ? 'text-blue-500' : 'text-gray-600'}`}>
            <CalendarIcon size={20} />
            <span className="text-[8px] font-black uppercase">Schedule</span>
          </button>
          <button onClick={() => setActiveTab('tags')} className={`flex flex-col items-center gap-1 ${activeTab === 'tags' ? 'text-blue-500' : 'text-gray-600'}`}>
            <Tag size={20} />
            <span className="text-[8px] font-black uppercase">Tags</span>
          </button>
          <button onClick={() => setShowAddPage(true)} className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center -mt-12 shadow-2xl border-8 border-[#0A0A0A] active:scale-90 transition-all">
            <Plus size={32} strokeWidth={4} />
          </button>
          <button onClick={() => setActiveTab('current')} className={`flex flex-col items-center gap-1 ${activeTab === 'current' ? 'text-blue-500' : 'text-gray-600'}`}>
            <Clock size={20} />
            <span className="text-[8px] font-black uppercase">Timer</span>
          </button>
          <button onClick={() => setActiveTab('statistics')} className={`flex flex-col items-center gap-1 ${activeTab === 'statistics' ? 'text-blue-500' : 'text-gray-600'}`}>
            <ChartIcon size={20} />
            <span className="text-[8px] font-black uppercase">Stats</span>
          </button>
        </div>
      </footer>

      {/* MODALS: Fixed z-index and solid background to prevent merging */}
      {showAddPage && (
        <div className="fixed inset-0 bg-[#0A0A0A] p-8 flex flex-col animate-in" style={{ zIndex: 999 }}>
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">New Entry</h2>
            <button onClick={() => setShowAddPage(false)} className="text-gray-500"><X size={32}/></button>
          </div>
          <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto no-scrollbar">
            {activities.map(a => (
              <button key={a.id} onClick={() => handleStartTracking(a.id)} className="bg-white/5 p-10 rounded-[2.5rem] flex flex-col items-center border border-white/5 active:scale-95 transition-all">
                <span className="text-6xl mb-4">{a.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{a.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showManualEntry && (
        <div className="fixed inset-0 bg-[#0A0A0A] p-8 flex flex-col justify-center animate-in" style={{ zIndex: 999 }}>
          <div className="max-w-md mx-auto w-full space-y-6">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Manual Entry</h2>
            <select className="w-full bg-[#111111] text-white p-4 rounded-2xl border border-white/10 outline-none" 
              onChange={(e) => setManualForm({...manualForm, activityId: e.target.value})}>
              <option value="">Choose Activity</option>
              {activities.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
            </select>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 px-2">Start Time</label>
              <input type="datetime-local" className="w-full bg-[#111111] text-white p-4 rounded-2xl border border-white/10 outline-none"
                onChange={(e) => setManualForm({...manualForm, start: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 px-2">End Time</label>
              <input type="datetime-local" className="w-full bg-[#111111] text-white p-4 rounded-2xl border border-white/10 outline-none"
                onChange={(e) => setManualForm({...manualForm, end: e.target.value})} />
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setShowManualEntry(false)} className="flex-1 py-4 font-black uppercase text-xs text-gray-500">Cancel</button>
              <button onClick={handleManualSave} className="flex-1 py-4 bg-blue-600 rounded-2xl font-black uppercase text-xs shadow-xl">Save Record</button>
            </div>
          </div>
        </div>
      )}

      {showNewActivityForm && (
        <div className="fixed inset-0 bg-[#0A0A0A] p-8 flex flex-col justify-center animate-in" style={{ zIndex: 999 }}>
          <div className="max-w-md mx-auto w-full space-y-6">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Create Tag</h2>
            <div className="flex gap-4">
              <input placeholder="Emoji" className="w-20 bg-[#111111] text-white p-4 rounded-2xl border border-white/10 text-center text-2xl outline-none"
                value={newActivity.icon} onChange={e => setNewActivity({...newActivity, icon: e.target.value})} />
              <input placeholder="Activity Name" className="flex-1 bg-[#111111] text-white p-4 rounded-2xl border border-white/10 outline-none"
                value={newActivity.name} onChange={e => setNewActivity({...newActivity, name: e.target.value})} />
            </div>
            <div className="flex items-center gap-4 bg-[#111111] p-4 rounded-2xl border border-white/10">
              <span className="text-[10px] font-black uppercase text-gray-500">Color Profile</span>
              <input type="color" className="bg-transparent border-none w-12 h-8" 
                value={newActivity.color} onChange={e => setNewActivity({...newActivity, color: e.target.value})} />
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setShowNewActivityForm(false)} className="flex-1 py-4 font-black uppercase text-xs text-gray-500">Cancel</button>
              <button onClick={() => {
                setActivities([...activities, { ...newActivity, id: Date.now().toString() }]);
                setShowNewActivityForm(false);
                setNewActivity({ name: '', icon: '🎯', color: '#3b82f6' });
              }} className="flex-1 py-4 bg-blue-600 rounded-2xl font-black uppercase text-xs">Create</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.2s ease-out forwards; }
        input[type="datetime-local"] { color-scheme: dark; }
      `}} />
    </div>
  );
};

export default App;