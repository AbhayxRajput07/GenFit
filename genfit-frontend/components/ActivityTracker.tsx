import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ActivityData, DailyStats, Theme } from '../types';
import { Plus, Clock, BarChart3, TrendingUp, Trophy, Activity, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface ActivityTrackerProps {
  addActivity: (activity: ActivityData) => void;
  activities: ActivityData[];
  stats: DailyStats;
  theme: Theme;
}

const workoutOptions = [
  { name: 'Running',          icon: '🏃', category: 'Cardio',         color: '#ef4444' },
  { name: 'Walking',          icon: '🚶', category: 'Low Intensity',  color: '#06b6d4' },
  { name: 'Cycling',          icon: '🚴', category: 'Cardio',         color: '#f97316' },
  { name: 'Gym Workout',      icon: '🏋️', category: 'Strength',       color: '#8b5cf6' },
  { name: 'HIIT',             icon: '🔥', category: 'High Intensity', color: '#ec4899' },
  { name: 'Yoga',             icon: '🧘', category: 'Wellness',       color: '#10b981' },
  { name: 'Basketball',       icon: '🏀', category: 'Sports',         color: '#f59e0b' },
  { name: 'Swimming',         icon: '🏊', category: 'Cardio',         color: '#0ea5e9' },
  { name: 'Jump Rope',        icon: '🪢', category: 'Cardio',         color: '#f97316' },
  { name: 'Rowing',           icon: '🚣', category: 'Cardio',         color: '#0284c7' },
  { name: 'Stair Climber',    icon: '🪜', category: 'Cardio',         color: '#f43f5e' },
  { name: 'Elliptical',       icon: '🔄', category: 'Cardio',         color: '#0ea5e9' },
  { name: 'Sprint Intervals', icon: '⚡', category: 'High Intensity', color: '#ef4444' },
  { name: 'Football',         icon: '🏈', category: 'Sports',         color: '#ea580c' },
  { name: 'Tennis',           icon: '🎾', category: 'Sports',         color: '#84cc16' },
  { name: 'Boxing',           icon: '🥊', category: 'Combat',         color: '#dc2626' },
  { name: 'Meditation Walk',  icon: '🚶', category: 'Wellness',       color: '#22c55e' },
  { name: 'Deadlift',         icon: '🏋️', category: 'Strength',       color: '#6d28d9' },
  { name: 'Squats',           icon: '🏋️', category: 'Strength',       color: '#7c3aed' },
  { name: 'Bench Press',      icon: '🏋️', category: 'Strength',       color: '#8b5cf6' },
  { name: 'Hiking',           icon: '🥾', category: 'Outdoor',        color: '#16a34a' },
];

const ActivityTracker: React.FC<ActivityTrackerProps> = ({ addActivity, activities, stats, theme }) => {
  const isPink = theme === 'pink';

  const [type, setType]           = useState('');
  const [duration, setDuration]   = useState('');
  const [intensity, setIntensity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [exerciseQuery, setExerciseQuery]           = useState('');
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const exerciseSearchRef = useRef<HTMLDivElement | null>(null);

  const todayStr = new Date().toDateString();

  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((day, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayStr = d.toDateString();
      const dailyBurn = activities
        .filter(a => new Date(a.timestamp).toDateString() === dayStr)
        .reduce((acc, curr) => acc + curr.caloriesBurned, 0);
      return { name: day, burn: dailyBurn || 0 };
    });
  }, [activities]);

  const todayActivities     = activities.filter(a => new Date(a.timestamp).toDateString() === todayStr);
  const totalDurationToday  = todayActivities.reduce((a, c) => a + c.durationMinutes, 0);
  const totalCaloriesToday  = todayActivities.reduce((a, c) => a + c.caloriesBurned, 0);

  const visibleExercises = useMemo(() => {
    const query = exerciseQuery.trim().toLowerCase();
    if (!query) return workoutOptions;
    return workoutOptions.filter(
      e => e.name.toLowerCase().includes(query) || e.category.toLowerCase().includes(query)
    );
  }, [exerciseQuery]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!exerciseSearchRef.current) return;
      if (!exerciseSearchRef.current.contains(event.target as Node)) setShowExerciseSearch(false);
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const saveActivity = () => {
    if (!type || !duration) return;
    const cal = intensity === 'High' ? 12 : intensity === 'Medium' ? 8 : 4;
    addActivity({
      id: Date.now().toString(),
      type,
      durationMinutes: Number(duration),
      caloriesBurned: Number(duration) * cal,
      intensity,
      timestamp: new Date(),
    });
    setType(''); setDuration(''); setExerciseQuery('');
  };

  // ── colour tokens ──────────────────────────────────────────────────────────
  const accent        = isPink ? '#ec4899' : '#0ea5e9';
  const accentLight   = isPink ? 'rgba(236,72,153,0.12)' : 'rgba(14,165,233,0.12)';
  const accentBorder  = isPink ? 'rgba(236,72,153,0.35)' : 'rgba(14,165,233,0.35)';
  const barGrad0      = isPink ? '#ec4899' : '#0ea5e9';
  const barGrad1      = isPink ? '#f472b6' : '#2563eb';
  const barGradA0     = isPink ? '#f9a8d4' : '#38bdf8';
  const barGradA1     = isPink ? '#ec4899' : '#3b82f6';

  return (
    <div className={`w-full min-h-screen px-4 md:px-8 lg:px-12 py-8 md:py-12 overflow-x-hidden ${isPink ? 'bg-[#f6edf2] text-[#1f2a44] selection:bg-pink-200/70' : 'bg-[#06142d] text-white selection:bg-blue-500/30'}`}>

      {/* Ambient Glow */}
      <div className={`fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] blur-[150px] rounded-full pointer-events-none ${isPink ? 'bg-pink-300/20' : 'bg-blue-600/15'}`} />

      <div className="relative w-full max-w-[1400px] mx-auto flex flex-col gap-8 md:gap-10">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className={`p-3 rounded-2xl border ${isPink ? 'bg-pink-100 border-pink-200/80 shadow-[0_0_20px_rgba(236,72,153,0.15)]' : 'bg-sky-500/10 border-sky-500/30 shadow-[0_0_20px_rgba(14,165,233,0.2)]'}`}>
                <Activity size={28} className={isPink ? 'text-pink-500' : 'text-sky-400'} />
              </div>
              <h1 className={`text-5xl lg:text-6xl font-medium tracking-tighter ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>Activity</h1>
            </div>
            <p className={`text-sm font-light tracking-wide ml-[72px] ${isPink ? 'text-[#7d8ca6]' : 'text-white/50'}`}>Kinematic logging and intensity distribution.</p>
          </div>

          <button className={`flex items-center gap-2 text-xs font-bold tracking-widest transition-all px-5 py-3 rounded-xl border uppercase ${isPink ? 'text-pink-500 border-pink-200/80 bg-white hover:bg-pink-50 shadow-[0_4px_12px_rgba(236,72,153,0.08)]' : 'text-sky-400 hover:text-white hover:bg-white/10 border-white/10 bg-white/5'}`}>
            <TrendingUp size={16} /> Weekly Summary
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Log Session Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className={`p-8 rounded-[2.5rem] border shadow-2xl relative overflow-hidden ${isPink ? 'bg-white border-[#e8d4dd] shadow-[0_16px_36px_rgba(225,178,199,0.18)]' : 'bg-[#071733] border-blue-300/10'}`}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isPink ? 'text-pink-500' : 'text-sky-400'}`}>Initiate Protocol</p>
                  <h3 className={`text-3xl font-medium tracking-tight ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>Log Session</h3>
                </div>
                <div className={`p-2.5 rounded-full border ${isPink ? 'bg-pink-50 border-pink-200/80' : 'bg-white/5 border-white/10'}`}>
                  <Target className={isPink ? 'text-pink-400' : 'text-white/50'} size={20} />
                </div>
              </div>

              {/* Fast-select chips */}
              <div className="mb-8">
                <div className="flex flex-wrap gap-3">
                  {workoutOptions.slice(0, 7).map((opt) => {
                    const active = type === opt.name;
                    return (
                      <button
                        key={opt.name}
                        onClick={() => { setType(opt.name); setExerciseQuery(opt.name); }}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center gap-2 ${
                          active
                            ? isPink
                              ? 'bg-pink-50 text-pink-500 border-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.15)]'
                              : 'bg-sky-500/10 text-sky-300 border-sky-500/40 shadow-[0_0_15px_rgba(14,165,233,0.2)]'
                            : isPink
                              ? 'bg-[#fff8fb] border-[#e8d4dd] text-[#7d8ca6] hover:text-[#1f2a44] hover:bg-pink-50 hover:border-pink-200'
                              : 'bg-white/[0.02] border-white/5 text-white/50 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        <span className="text-lg">{opt.icon}</span>
                        {opt.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

                {/* Type search */}
                <div className="relative md:col-span-1" ref={exerciseSearchRef}>
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ml-1 ${isPink ? 'text-[#9aa7bd]' : 'text-white/30'}`}>Type</label>
                  <input
                    type="text"
                    value={exerciseQuery}
                    onChange={(e) => { setExerciseQuery(e.target.value); setShowExerciseSearch(true); }}
                    onFocus={() => setShowExerciseSearch(true)}
                    placeholder="Search..."
                    className={`w-full px-5 py-4 rounded-2xl outline-none border transition-all font-medium text-sm ${
                      isPink
                        ? 'bg-white text-[#1f2a44] border-[#e8d4dd] placeholder-[#c0b8c4] focus:border-pink-300 focus:bg-pink-50'
                        : 'bg-[#050505] text-white border-white/10 placeholder-white/20 focus:border-sky-500/50 focus:bg-white/[0.05]'
                    }`}
                  />
                  <AnimatePresence>
                    {showExerciseSearch && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`absolute z-30 mt-2 w-[300px] rounded-2xl border shadow-2xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar ${isPink ? 'border-pink-200/80 bg-white' : 'border-blue-300/20 bg-[#0b2044]'}`}
                      >
                        {visibleExercises.length === 0 ? (
                          <div className={`px-5 py-4 text-sm ${isPink ? 'text-[#9aa7bd]' : 'text-white/40'}`}>No protocols found</div>
                        ) : (
                          visibleExercises.map((exercise) => (
                            <button
                              key={exercise.name} type="button"
                              onClick={() => { setType(exercise.name); setExerciseQuery(exercise.name); setShowExerciseSearch(false); }}
                              className={`w-full px-5 py-3 text-left flex items-center gap-4 transition-colors ${
                                type === exercise.name
                                  ? isPink ? 'bg-pink-50 text-pink-500' : 'bg-sky-500/20 text-sky-300'
                                  : isPink ? 'text-[#1f2a44] hover:bg-pink-50' : 'bg-transparent text-white hover:bg-white/5'
                              }`}
                            >
                              <span className="text-xl">{exercise.icon}</span>
                              <span className="font-semibold text-sm truncate">{exercise.name}</span>
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Duration */}
                <div className="md:col-span-1">
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ml-1 ${isPink ? 'text-[#9aa7bd]' : 'text-white/30'}`}>Duration (Min)</label>
                  <input
                    type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 45"
                    className={`w-full px-5 py-4 rounded-2xl outline-none border transition-all font-medium text-sm ${
                      isPink
                        ? 'bg-white text-[#1f2a44] border-[#e8d4dd] placeholder-[#c0b8c4] focus:border-pink-300 focus:bg-pink-50'
                        : 'bg-[#050505] text-white border-white/10 placeholder-white/20 focus:border-sky-500/50 focus:bg-white/[0.05]'
                    }`}
                  />
                </div>

                {/* Intensity */}
                <div className="md:col-span-1">
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ml-1 ${isPink ? 'text-[#9aa7bd]' : 'text-white/30'}`}>Intensity</label>
                  <select
                    value={intensity} onChange={(e) => setIntensity(e.target.value as any)}
                    className={`w-full px-5 py-4 rounded-2xl outline-none border transition-all font-medium text-sm cursor-pointer appearance-none ${
                      isPink
                        ? 'bg-white text-[#1f2a44] border-[#e8d4dd] focus:border-pink-300 focus:bg-pink-50'
                        : 'bg-[#050505] text-white border-white/10 focus:border-sky-500/50 focus:bg-white/[0.05]'
                    }`}
                  >
                    <option value="Low">Low - Base</option>
                    <option value="Medium">Medium - Tempo</option>
                    <option value="High">High - Max</option>
                  </select>
                </div>
              </div>

              {/* Confirm row */}
              <div className={`flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t ${isPink ? 'border-[#e8d4dd]' : 'border-white/5'}`}>
                <div className="flex-1">
                  {type && duration && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                      <div className={`w-1.5 h-8 rounded-full ${isPink ? 'bg-pink-400' : 'bg-sky-500'}`} />
                      <div>
                        <p className={`text-[10px] uppercase tracking-widest font-bold mb-0.5 ${isPink ? 'text-[#9aa7bd]' : 'text-white/30'}`}>Projected Output</p>
                        <p className={`text-2xl font-bold leading-none ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>
                          {Number(duration) * (intensity === 'High' ? 12 : intensity === 'Medium' ? 8 : 4)}{' '}
                          <span className={`text-sm ${isPink ? 'text-pink-500' : 'text-sky-400'}`}>KCAL</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                <button
                  onClick={saveActivity} disabled={!type || !duration}
                  className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:grayscale active:scale-95 text-white ${
                    isPink
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-[0_0_30px_rgba(236,72,153,0.4)] border border-pink-300'
                      : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:shadow-[0_0_30px_rgba(14,165,233,0.4)]'
                  }`}
                >
                  <Plus size={18} /> Confirm
                </button>
              </div>
            </motion.div>

            {/* ── Quick Stats Grid ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Today's Duration", val: totalDurationToday, unit: 'm',    hover: isPink ? 'hover:text-pink-500' : 'hover:text-blue-500',  bg: isPink ? 'bg-white border-[#e8d4dd] hover:border-pink-200' : 'bg-white border-[#d6e3f8] hover:border-[#b9cff0]' },
                { label: 'Calories Output',  val: totalCaloriesToday, unit: 'kcal', hover: isPink ? 'hover:text-pink-500' : 'hover:text-sky-500',   bg: isPink ? 'bg-[#fff8fb] border-[#ecd4e0] hover:border-pink-200' : 'bg-[#eaf3ff] border-[#c9dbf6] hover:border-[#aecaef]' },
                { label: 'Total Sessions',   val: todayActivities.length, unit: '', hover: '',                                                       bg: isPink ? 'bg-white border-[#e8d4dd] hover:border-pink-200' : 'bg-white border-[#d6e3f8] hover:border-[#b9cff0]' },
                { label: 'Max Intensity',    val: todayActivities.length > 0 ? (todayActivities.some(a => a.intensity === 'High') ? 'High' : 'Med') : '-', unit: '', hover: '', bg: isPink ? 'bg-[#fff8fb] border-[#ecd4e0] hover:border-pink-200' : 'bg-[#eaf3ff] border-[#c9dbf6] hover:border-[#aecaef]' },
              ].map((s, i) => (
                <div key={i} className={`p-6 rounded-2xl border flex flex-col justify-between overflow-hidden relative group transition-colors shadow-[0_10px_24px_rgba(38,72,133,0.08)] ${s.bg}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#6f83a4] mb-2">{s.label}</p>
                  <div className="flex items-end gap-1">
                    <span className={`text-3xl font-bold text-[#1f2a44] transition-colors ${s.hover}`}>{s.val}</span>
                    {s.unit && <span className="text-sm font-medium text-[#8fa2c1] pb-1">{s.unit}</span>}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* ── Weekly Trajectory Chart ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className={`p-8 rounded-[2rem] border shadow-xl ${isPink ? 'bg-[#fff8fb] border-[#ecd4e0]' : 'bg-[#eaf3ff] border-[#c9dbf6]'}`}>
              <h2 className="text-xl font-medium text-[#1f2a44] mb-8 tracking-tight flex items-center gap-3">
                <BarChart3 size={20} className={isPink ? 'text-pink-500' : 'text-blue-500'} /> Output Trajectory
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={barGrad0} stopOpacity={1} />
                        <stop offset="100%" stopColor={barGrad1} stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="barGradActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={barGradA0} stopOpacity={1} />
                        <stop offset="100%" stopColor={barGradA1} stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isPink ? 'rgba(236,72,153,0.08)' : 'rgba(31,42,68,0.08)'} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#5f759a', fontWeight: 'bold' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#5f759a', fontWeight: 'bold' }} />
                    <Tooltip
                      cursor={{ fill: isPink ? 'rgba(236,72,153,0.06)' : 'rgba(59,130,246,0.08)' }}
                      contentStyle={{ borderRadius: '16px', border: isPink ? '1px solid #e8d4dd' : '1px solid rgba(95,117,154,0.25)', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(10px)', boxShadow: isPink ? '0 12px 28px rgba(236,72,153,0.12)' : '0 12px 28px rgba(38,72,133,0.14)' }}
                      itemStyle={{ color: isPink ? '#ec4899' : '#1f3f6f', fontWeight: 600 }}
                    />
                    <Bar dataKey="burn" radius={[6, 6, 0, 0]} barSize={40}>
                      {weeklyData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === 6 ? 'url(#barGradActive)' : 'url(#barGrad)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: Today's Log ── */}
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className={`p-8 rounded-[2.5rem] border shadow-xl flex flex-col h-full max-h-[800px] ${isPink ? 'bg-white border-[#e8d4dd]' : 'bg-white border-[#d6e3f8]'}`}>
              <h4 className="text-xl font-medium tracking-tight text-[#1f2a44] mb-6 flex items-center gap-3">
                <Clock size={20} className={isPink ? 'text-pink-400' : 'text-[#6f83a4]'} /> Today's Log
              </h4>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {todayActivities.length === 0 ? (
                  <div className="text-center py-20 flex flex-col items-center">
                    <div className={`p-4 rounded-full border mb-4 ${isPink ? 'bg-pink-50 border-pink-200/80' : 'bg-[#eaf3ff] border-[#c9dbf6]'}`}>
                      <Activity className={isPink ? 'text-pink-400' : 'text-[#6f83a4]'} />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#7286a6]">System Idle</p>
                  </div>
                ) : (
                  todayActivities.map((activity, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      key={activity.id}
                      className={`group p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                        isPink
                          ? 'border-[#ecd4e0] bg-[#fff8fb] hover:bg-white hover:border-pink-200'
                          : 'border-[#d8e5f8] bg-[#edf4ff] hover:bg-white hover:border-[#bfd5f5]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl group-hover:scale-110 transition-transform ${isPink ? 'bg-white border-[#ecd4e0]' : 'bg-white border-[#d8e5f8]'}`}>
                          {workoutOptions.find(o => o.name === activity.type)?.icon || '🏃'}
                        </div>
                        <div>
                          <p className="font-medium text-[#1f2a44] text-sm">{activity.type}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] font-bold text-[#7286a6] uppercase tracking-widest">{activity.durationMinutes}m</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest"
                              style={{ color: activity.intensity === 'High' ? '#ef4444' : activity.intensity === 'Medium' ? (isPink ? '#ec4899' : '#38bdf8') : '#a3e635' }}>
                              {activity.intensity}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg transition-colors ${isPink ? 'text-[#1f2a44] group-hover:text-pink-500' : 'text-[#1f2a44] group-hover:text-sky-500'}`}>{activity.caloriesBurned}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#7286a6]">KCAL</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ActivityTracker;