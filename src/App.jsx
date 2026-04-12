import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Square, 
  Plus, 
  Trash2, 
  Clock, 
  History, 
  Settings, 
  LayoutDashboard,
  X,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  PieChart as ChartIcon,
  Layers
} from 'lucide-react';

const App = () => {
  // State Management - Defaulting to 'today' as the first tab
  const [activeTab, setActiveTab] = useState('today');
  const [activities, setActivities] = useState([
    { id: '1', name: 'Gym', icon: '💪', color: '#3b82f6' },
    { id: '2', name: 'Work', icon: '💻', color: '#8b5cf6' },
    { id: '3', name: 'Reading', icon: '📚', color: '#10b981' },
    { id: '4', name: 'Meditation', icon: '🧘', color: '#f59e0b' },
    { id: '5', name: 'Cooking', icon: '🍳', color: '#ef4444' }
  ]);
  const [logs, setLogs] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Dashboard specific state
  const [dashboardDate, setDashboardDate] = useState(new Date().toISOString().split('T')[0]);

  // Load/Save Logic
  useEffect(() => {
    const savedActivities = localStorage.getItem('tracker_activities');
    const savedLogs = localStorage.getItem('tracker_logs');
    const savedSession = localStorage.getItem('tracker_current_session');
    if (savedActivities) setActivities(JSON.parse(savedActivities));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedSession) setCurrentSession(JSON.parse(savedSession));
  }, []);

  useEffect(() => {
    localStorage.setItem('tracker_activities', JSON.stringify(activities));
    localStorage.setItem('tracker_logs', JSON.stringify(logs));
    localStorage.setItem('tracker_current_session', JSON.stringify(currentSession));
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

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const handleStartTracking = (activityId) => {
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
    setShowModal(false);
  };

  const handleStopTracking = () => {
    if (!currentSession) return;
    const completedSession = {
      ...currentSession,
      endTime: new Date().toISOString(),
      duration: elapsedTime
    };
    setLogs([completedSession, ...logs]);
    setCurrentSession(null);
  };

  // Data Filtering for Selected Date
  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      new Date(log.startTime).toISOString().split('T')[0] === dashboardDate
    );
  }, [logs, dashboardDate]);

  // Pie Chart Data Calculation
  const chartData = useMemo(() => {
    const totals = filteredLogs.reduce((acc, log) => {
      acc[log.name] = (acc[log.name] || 0) + log.duration;
      return acc;
    }, {});

    const totalSeconds = Object.values(totals).reduce((a, b) => a + b, 0);
    
    let cumulativePercent = 0;
    return Object.entries(totals).map(([name, seconds]) => {
      const activity = activities.find(a => a.name === name);
      const percent = (seconds / totalSeconds) * 100;
      const startPercent = cumulativePercent;
      cumulativePercent += percent;
      return { 
        name, 
        seconds, 
        percent, 
        startPercent, 
        color: activity?.color || '#3b82f6',
        icon: activity?.icon
      };
    });
  }, [filteredLogs, activities]);

  // Gantt Chart Calculations
  const ganttBars = useMemo(() => {
    return filteredLogs.map(log => {
      const startDate = new Date(log.startTime);
      const endDate = new Date(log.endTime);
      
      // Calculate percentage of day (0-24h)
      const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
      const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
      
      const left = (startMinutes / (24 * 60)) * 100;
      const width = ((endMinutes - startMinutes) / (24 * 60)) * 100;
      
      return {
        ...log,
        left: `${Math.max(0, left)}%`,
        width: `${Math.max(1, width)}%` // Min 1% width so tiny sessions are visible
      };
    });
  }, [filteredLogs]);

  // SVG Pie Chart Helper
  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 font-sans pb-28 selection:bg-blue-500/30">
      {/* Header */}
      <header className="p-6 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <Clock size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">FocusTrack</h1>
          </div>
          <div className="text-xs font-medium text-neutral-500">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Navigation Tabs - Swapped Today and Dashboard */}
        <div className="flex bg-neutral-900/60 p-1 rounded-2xl border border-white/5">
          {[
            { id: 'today', icon: CalendarIcon, label: 'Today' },
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-300 ${activeTab === tab.id ? 'bg-white/10 text-white shadow-xl' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              <tab.icon size={18} />
              <span className="text-[10px] font-bold uppercase mt-1 tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TODAY TAB - Now First */}
        {activeTab === 'today' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {currentSession ? (
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl shadow-blue-900/20">
                <div className="relative z-10 flex flex-col items-center text-center">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white/90 mb-6">In Progress</span>
                  <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center text-5xl mb-4 shadow-inner ring-1 ring-white/20">
                    {currentSession.icon}
                  </div>
                  <h2 className="text-3xl font-black tracking-tight mb-1">{currentSession.name}</h2>
                  <p className="text-blue-100/60 text-sm font-medium">Started at {new Date(currentSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  
                  <div className="mt-8 mb-10">
                    <p className="text-6xl font-mono font-black tracking-tighter tabular-nums">
                      {Math.floor(elapsedTime / 3600).toString().padStart(2, '0')}:
                      {Math.floor((elapsedTime % 3600) / 60).toString().padStart(2, '0')}:
                      {(elapsedTime % 60).toString().padStart(2, '0')}
                    </p>
                  </div>

                  <button 
                    onClick={handleStopTracking}
                    className="w-full bg-white text-blue-600 hover:bg-neutral-100 py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl"
                  >
                    <Square size={20} fill="currentColor" />
                    STOP TRACKING
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-neutral-900/40 border border-white/5 rounded-[2.5rem] p-8 text-center">
                  <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-neutral-500">
                    <Play size={32} fill="currentColor" className="ml-1" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Ready to start?</h3>
                  <p className="text-neutral-500 text-sm mb-8">Select an activity below to begin recording your time.</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {activities.map(activity => (
                      <button
                        key={activity.id}
                        onClick={() => handleStartTracking(activity.id)}
                        className="flex flex-col items-center p-5 bg-neutral-800/50 rounded-3xl border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                      >
                        <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{activity.icon}</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 group-hover:text-white">{activity.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DASHBOARD TAB - Now Second */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Date Selection */}
            <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <button 
                onClick={() => {
                  const d = new Date(dashboardDate);
                  d.setDate(d.getDate() - 1);
                  setDashboardDate(d.toISOString().split('T')[0]);
                }}
                className="p-2 hover:bg-white/5 rounded-lg text-neutral-500 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex flex-col items-center">
                <input 
                  type="date" 
                  value={dashboardDate}
                  onChange={(e) => setDashboardDate(e.target.value)}
                  className="bg-transparent text-sm font-bold border-none outline-none cursor-pointer text-center text-blue-400"
                />
                <span className="text-[10px] text-neutral-500 font-bold uppercase">Activity Summary</span>
              </div>
              <button 
                onClick={() => {
                  const d = new Date(dashboardDate);
                  d.setDate(d.getDate() + 1);
                  setDashboardDate(d.toISOString().split('T')[0]);
                }}
                className="p-2 hover:bg-white/5 rounded-lg text-neutral-500 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Pie Chart Tile */}
            <div className="bg-neutral-900/40 border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center">
              {chartData.length > 0 ? (
                <>
                  <div className="relative w-64 h-64 mb-10">
                    <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full drop-shadow-2xl">
                      {chartData.map((slice, i) => {
                        const [startX, startY] = getCoordinatesForPercent(slice.startPercent / 100);
                        const [endX, endY] = getCoordinatesForPercent((slice.startPercent + slice.percent) / 100);
                        const largeArcFlag = slice.percent > 50 ? 1 : 0;
                        const pathData = [
                          `M ${startX} ${startY}`,
                          `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                          `L 0 0`,
                        ].join(' ');
                        return <path key={i} d={pathData} fill={slice.color} className="hover:opacity-80 transition-opacity cursor-pointer" />;
                      })}
                      <circle cx="0" cy="0" r="0.65" fill="#0c0c0c" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <ChartIcon size={24} className="text-neutral-700 mb-1" />
                      <p className="text-2xl font-black tracking-tighter">
                        {formatDuration(chartData.reduce((acc, s) => acc + s.seconds, 0))}
                      </p>
                      <p className="text-[8px] font-black text-neutral-600 uppercase tracking-[0.2em]">Daily Total</p>
                    </div>
                  </div>

                  <div className="w-full space-y-3">
                    {chartData.map((slice, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }} />
                          <span className="text-xl">{slice.icon}</span>
                          <span className="text-sm font-bold">{slice.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-bold">{formatDuration(slice.seconds)}</p>
                          <p className="text-[10px] text-neutral-500 font-bold">{Math.round(slice.percent)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-20 flex flex-col items-center opacity-30">
                  <ChartIcon size={48} strokeWidth={1} className="mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest text-center">No activity recorded for this date</p>
                </div>
              )}
            </div>

            {/* 24-Hour Gantt Chart Tile */}
            <div className="bg-neutral-900/40 border border-white/5 rounded-[2.5rem] p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Day Timeline</h3>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-tighter">24-Hour Distribution</p>
                </div>
              </div>

              {filteredLogs.length > 0 ? (
                <div className="space-y-8">
                  <div className="relative h-12 bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                    {/* Time Grid Lines */}
                    {[6, 12, 18].map(hour => (
                      <div 
                        key={hour} 
                        className="absolute top-0 bottom-0 border-l border-white/10 z-0" 
                        style={{ left: `${(hour / 24) * 100}%` }}
                      />
                    ))}
                    
                    {/* Activity Blocks */}
                    {ganttBars.map((bar, idx) => (
                      <div
                        key={idx}
                        className="absolute top-0 bottom-0 rounded-sm z-10 transition-transform hover:scale-y-110 cursor-help"
                        style={{ 
                          left: bar.left, 
                          width: bar.width, 
                          backgroundColor: bar.color,
                          boxShadow: `0 0 10px ${bar.color}44`
                        }}
                        title={`${bar.name}: ${formatDuration(bar.duration)}`}
                      />
                    ))}
                  </div>

                  {/* X-Axis Labels */}
                  <div className="flex justify-between px-1">
                    {['00:00', '06:00', '12:00', '18:00', '23:59'].map((label, i) => (
                      <span key={i} className="text-[8px] font-black text-neutral-600 uppercase tracking-tighter">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center opacity-20">
                  <Layers size={32} strokeWidth={1} className="mb-2" />
                  <p className="text-[10px] font-bold uppercase">Timeline Empty</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-neutral-900/40 border border-white/5 rounded-3xl p-6">
              <h3 className="text-xl font-bold mb-6 px-2">Manage Activities</h3>
              <div className="grid gap-2">
                {activities.map(activity => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{activity.icon}</span>
                      <div>
                        <p className="font-bold text-sm tracking-tight">{activity.name}</p>
                        <div className="w-8 h-1 rounded-full mt-1" style={{ backgroundColor: activity.color }} />
                      </div>
                    </div>
                    <button 
                      onClick={() => setActivities(activities.filter(a => a.id !== activity.id))}
                      className="p-2 text-neutral-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-white/5">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4 px-2">Add New Activity</p>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const name = e.target.name.value;
                  const icon = e.target.icon.value;
                  const color = e.target.color.value;
                  setActivities([...activities, { id: Date.now().toString(), name, icon, color }]);
                  e.target.reset();
                }} className="space-y-3">
                  <div className="flex gap-2">
                    <input name="icon" placeholder="Emoji" maxLength="2" required className="w-14 bg-black/40 border border-white/10 rounded-xl p-3 text-center" />
                    <input name="name" placeholder="Activity Name" required className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 focus:border-blue-500 outline-none" />
                  </div>
                  <div className="flex gap-2">
                    <input name="color" type="color" defaultValue="#3b82f6" className="w-14 h-12 bg-black/40 border border-white/10 rounded-xl p-1 cursor-pointer" />
                    <button type="submit" className="flex-1 bg-blue-600 text-white font-bold rounded-xl py-3 hover:bg-blue-500 transition-all">Add Activity</button>
                  </div>
                </form>
              </div>
            </div>
            
            <div className="px-6 text-center opacity-30">
              <p className="text-[10px] font-bold uppercase tracking-widest">FocusTrack v2.1 • Timeline Edition</p>
            </div>
          </div>
        )}

      </main>

      {/* Persistent Bottom Label for Active Session */}
      {currentSession && activeTab !== 'today' && (
        <div 
          onClick={() => setActiveTab('today')}
          className="fixed bottom-6 left-4 right-4 bg-blue-600 p-4 rounded-2xl flex items-center justify-between shadow-2xl cursor-pointer animate-in slide-in-from-bottom-10 duration-500 z-40 ring-4 ring-black"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentSession.icon}</span>
            <div>
              <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Tracking Now</p>
              <p className="font-bold">{currentSession.name}</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-xl font-mono font-black tabular-nums">
              {Math.floor(elapsedTime / 3600).toString().padStart(2, '0')}:
              {Math.floor((elapsedTime % 3600) / 60).toString().padStart(2, '0')}
            </p>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        input[type="date"]::-webkit-calendar-picker-indicator {
          display: none;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
};

export default App;