import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ActivityData, DailyStats } from '../types';
import { Plus, Clock, BarChart3, TrendingUp, Flame, Trophy, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface ActivityTrackerProps {
  addActivity: (activity: ActivityData) => void;
  activities: ActivityData[];
  stats: DailyStats;
}

const workoutOptions = [
  { name: 'Running', icon: '🏃', category: 'Cardio', color: '#ef4444' },
  { name: 'Walking', icon: '🚶', category: 'Low Intensity', color: '#06b6d4' },
  { name: 'Cycling', icon: '🚴', category: 'Cardio', color: '#f97316' },
  { name: 'Gym Workout', icon: '🏋️', category: 'Strength', color: '#8b5cf6' },
  { name: 'HIIT', icon: '🔥', category: 'High Intensity', color: '#ec4899' },
  { name: 'Yoga', icon: '🧘', category: 'Wellness', color: '#10b981' },
  { name: 'Basketball', icon: '🏀', category: 'Sports', color: '#f59e0b' },
  { name: 'Swimming', icon: '🏊', category: 'Cardio', color: '#0ea5e9' },
  { name: 'Jump Rope', icon: '🪢', category: 'Cardio', color: '#f97316' },
  { name: 'Rowing', icon: '🚣', category: 'Cardio', color: '#0284c7' },
  { name: 'Stair Climber', icon: '🪜', category: 'Cardio', color: '#f43f5e' },
  { name: 'Elliptical', icon: '🔄', category: 'Cardio', color: '#0ea5e9' },
  { name: 'Sprint Intervals', icon: '⚡', category: 'High Intensity', color: '#ef4444' },
  { name: 'Football', icon: '🏈', category: 'Sports', color: '#ea580c' },
  { name: 'Cricket', icon: '🏏', category: 'Sports', color: '#22c55e' },
  { name: 'Tennis', icon: '🎾', category: 'Sports', color: '#84cc16' },
  { name: 'Badminton', icon: '🏸', category: 'Sports', color: '#14b8a6' },
  { name: 'Volleyball', icon: '🏐', category: 'Sports', color: '#f59e0b' },
  { name: 'Table Tennis', icon: '🏓', category: 'Sports', color: '#22d3ee' },
  { name: 'Boxing', icon: '🥊', category: 'Combat', color: '#dc2626' },
  { name: 'Kickboxing', icon: '🦵', category: 'Combat', color: '#ef4444' },
  { name: 'MMA Training', icon: '🥋', category: 'Combat', color: '#b91c1c' },
  { name: 'Karate', icon: '🥋', category: 'Combat', color: '#f43f5e' },
  { name: 'Pilates', icon: '🧘', category: 'Wellness', color: '#10b981' },
  { name: 'Stretching', icon: '🤸', category: 'Wellness', color: '#34d399' },
  { name: 'Meditation Walk', icon: '🚶', category: 'Wellness', color: '#22c55e' },
  { name: 'Dance Fitness', icon: '💃', category: 'Cardio', color: '#ec4899' },
  { name: 'Zumba', icon: '🕺', category: 'Cardio', color: '#f97316' },
  { name: 'Aerobics', icon: '🎵', category: 'Cardio', color: '#06b6d4' },
  { name: 'CrossFit', icon: '🏋️', category: 'High Intensity', color: '#7c3aed' },
  { name: 'Circuit Training', icon: '🔁', category: 'High Intensity', color: '#8b5cf6' },
  { name: 'Deadlift', icon: '🏋️', category: 'Strength', color: '#6d28d9' },
  { name: 'Squats', icon: '🏋️', category: 'Strength', color: '#7c3aed' },
  { name: 'Bench Press', icon: '🏋️', category: 'Strength', color: '#8b5cf6' },
  { name: 'Shoulder Press', icon: '🏋️', category: 'Strength', color: '#9333ea' },
  { name: 'Pull Ups', icon: '💪', category: 'Strength', color: '#a855f7' },
  { name: 'Push Ups', icon: '💪', category: 'Strength', color: '#c026d3' },
  { name: 'Lunges', icon: '🦵', category: 'Strength', color: '#7c3aed' },
  { name: 'Core Workout', icon: '🧱', category: 'Strength', color: '#9333ea' },
  { name: 'Plank', icon: '🧍', category: 'Strength', color: '#6d28d9' },
  { name: 'Hiking', icon: '🥾', category: 'Outdoor', color: '#16a34a' },
  { name: 'Trail Running', icon: '🏔️', category: 'Outdoor', color: '#15803d' },
  { name: 'Skating', icon: '⛸️', category: 'Outdoor', color: '#0284c7' },
  { name: 'Skiing', icon: '⛷️', category: 'Outdoor', color: '#0ea5e9' },
  { name: 'Skateboarding', icon: '🛹', category: 'Outdoor', color: '#0f766e' },
  { name: 'Mountain Biking', icon: '🚵', category: 'Outdoor', color: '#ea580c' }
];

const ActivityTracker: React.FC<ActivityTrackerProps> = ({ addActivity, activities, stats }) => {
  const [type, setType] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const exerciseSearchRef = useRef<HTMLDivElement | null>(null);

  const todayStr = new Date().toDateString();

  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map((day, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayStr = d.toDateString();
      const dailyBurn = activities
        .filter(a => new Date(a.timestamp).toDateString() === dayStr)
        .reduce((acc, curr) => acc + curr.caloriesBurned, 0);
      return { name: day, burn: dailyBurn || 0 };
    });
    return data;
  }, [activities]);

  const todayActivities = activities.filter(a => new Date(a.timestamp).toDateString() === todayStr);
  const totalDurationToday = todayActivities.reduce((a, c) => a + c.durationMinutes, 0);
  const totalCaloriesToday = todayActivities.reduce((a, c) => a + c.caloriesBurned, 0);
  const visibleExercises = useMemo(() => {
    const query = exerciseQuery.trim().toLowerCase();
    if (!query) return workoutOptions;
    return workoutOptions.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(query) || exercise.category.toLowerCase().includes(query)
    );
  }, [exerciseQuery]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!exerciseSearchRef.current) return;
      if (!exerciseSearchRef.current.contains(event.target as Node)) {
        setShowExerciseSearch(false);
      }
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
    setType('');
    setDuration('');
  };

  const categories = ['All', 'Cardio', 'Strength', 'Sports', 'Wellness'];

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-[#ffeef4] via-[#fff4f8] to-[#fff7fb]">
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-10 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-[#ffe8f1] border border-[#efc7d6]">
                <Activity size={24} className="text-[#bf5f7e]" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">Activity</h1>
            </div>
            <p className="text-sm text-slate-500 ml-16">Track workouts, monitor intensity, and burn calories</p>
          </div>
          <button className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-all px-4 py-2 rounded-lg border border-[#efc7d6] bg-white shadow-sm">
            <TrendingUp size={14} /> Stats
          </button>
        </motion.div>

        {/* Quick Entry Section - Top Priority */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="bg-white rounded-2xl p-6 border border-[#f1d9e2] shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#bf5f7e] uppercase tracking-wide">Quick Entry</p>
              <h3 className="text-3xl font-bold text-slate-900">Select Activity</h3>
            </div>
            <span className="px-3 py-1 rounded-md text-sm bg-[#ffe8f1] text-[#bf5f7e] font-semibold border border-[#efc7d6]">Fast</span>
          </div>

          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {workoutOptions.slice(0, 8).map((opt) => (
                <button
                  key={opt.name}
                  onClick={() => setType(opt.name)}
                  className={`px-4 py-3 rounded-lg text-sm font-semibold border transition-all flex items-center gap-2 ${
                    type === opt.name
                      ? 'bg-[#db2777] text-white border-[#be185d] shadow-sm'
                      : 'bg-white border-[#efc7d6] text-slate-700 hover:border-[#efc7d6] hover:bg-[#fff1f7]'
                  }`}
                >
                  <span className="text-base">{opt.icon}</span>
                  {opt.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="relative" ref={exerciseSearchRef}>
              <input
                type="text"
                value={exerciseQuery}
                onChange={(e) => {
                  setExerciseQuery(e.target.value);
                  setShowExerciseSearch(true);
                }}
                onFocus={() => setShowExerciseSearch(true)}
                placeholder="Search exercise..."
                className="w-full px-5 py-3 bg-[#fffdf9] rounded-lg outline-none border border-[#e7d9de] focus:ring-4 ring-pink-100 text-base"
              />
              {showExerciseSearch && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border border-[#efc7d6] bg-white shadow-lg max-h-64 overflow-y-auto">
                  {visibleExercises.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-500">No exercises found</div>
                  ) : (
                    visibleExercises.map((exercise) => (
                      <button
                        key={exercise.name}
                        type="button"
                        onClick={() => {
                          setType(exercise.name);
                          setExerciseQuery(exercise.name);
                          setShowExerciseSearch(false);
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between gap-3 border-b border-[#f8dde8] last:border-b-0 hover:bg-[#fff4f8] transition-colors ${
                          type === exercise.name ? 'bg-[#ffe9f3]' : 'bg-white'
                        }`}
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="text-lg">{exercise.icon}</span>
                          <span className="font-semibold text-slate-800 truncate">{exercise.name}</span>
                        </span>
                        <span className="text-xs font-semibold text-[#bf5f7e] shrink-0">{exercise.category}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 mb-4">
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Duration (min)"
              className="flex-1 px-5 py-4 bg-[#fffdf9] rounded-lg outline-none border border-[#e7d9de] focus:ring-4 ring-pink-100 text-base"
            />
            <select
              value={intensity}
              onChange={(e) => setIntensity(e.target.value as any)}
              className="px-5 py-4 rounded-lg bg-[#fffdf9] border border-[#e7d9de] font-semibold outline-none text-slate-900"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <button
              onClick={saveActivity}
              disabled={!type || !duration}
              className="bg-[#db2777] text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 border border-[#be185d] hover:bg-[#be185d] transition-all disabled:opacity-50"
            >
              <Plus size={18} />
              Add
            </button>
          </div>

          {type && duration && (
            <div className="p-4 rounded-lg border border-[#f0cddd] bg-[#fff1f7]">
              <p className="text-sm text-[#bf5f7e] mb-1">Estimated Calories Burned</p>
              <p className="text-2xl font-bold text-slate-900">{Number(duration) * (intensity === 'High' ? 12 : intensity === 'Medium' ? 8 : 4)} kcal</p>
            </div>
          )}
        </motion.div>

        {/* Stat Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-white rounded-xl p-4 border border-[#f1d9e2] shadow-sm">
            <p className="text-sm text-[#bf5f7e] font-semibold mb-1">Today's Duration</p>
            <p className="text-2xl font-bold text-slate-900">{totalDurationToday}</p>
            <p className="text-xs text-slate-500 mt-1">minutes</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-[#f1d9e2] shadow-sm">
            <p className="text-sm text-[#bf5f7e] font-semibold mb-1">Calories Burned</p>
            <p className="text-2xl font-bold text-slate-900">{totalCaloriesToday}</p>
            <p className="text-xs text-slate-500 mt-1">kcal</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-[#f1d9e2] shadow-sm">
            <p className="text-sm text-[#bf5f7e] font-semibold mb-1">Sessions Today</p>
            <p className="text-2xl font-bold text-slate-900">{todayActivities.length}</p>
            <p className="text-xs text-slate-500 mt-1">workouts</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-[#f1d9e2] shadow-sm">
            <p className="text-sm text-[#bf5f7e] font-semibold mb-1">Avg Intensity</p>
            <p className="text-2xl font-bold text-slate-900">{todayActivities.length > 0 ? (todayActivities.filter(a => a.intensity === 'High').length / todayActivities.length * 100).toFixed(0) : 0}%</p>
            <p className="text-xs text-slate-500 mt-1">high intensity</p>
          </div>
        </motion.div>

        {/* Weekly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-[#f1d9e2] shadow-sm"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-[#db2777]" /> Weekly Activity Overview
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <defs>
                  <linearGradient id="weeklyBurnGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f472b6" stopOpacity={0.95} />
                    <stop offset="95%" stopColor="#db2777" stopOpacity={0.75} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#efd7e2" vertical={false} />
                <XAxis dataKey="name" stroke="#caa2b4" axisLine={{ strokeWidth: 1.2 }} tickLine={false} />
                <YAxis stroke="#caa2b4" axisLine={{ strokeWidth: 1.2 }} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#ffe9f3' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #efc7d6',
                    backgroundColor: '#fff',
                    fontWeight: 700
                  }}
                />
                <Bar dataKey="burn" radius={[10, 10, 0, 0]} barSize={52}>
                  {weeklyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 6 ? '#be185d' : 'url(#weeklyBurnGradient)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Activity History Section */}
        <div className="grid grid-cols-1 gap-6">

          {/* Activity History */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-6 border border-[#f1d9e2] shadow-sm"
          >
            <h4 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock size={18} /> Today's Workouts
            </h4>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {todayActivities.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-black/40 bg-white p-6 text-center text-slate-500 text-sm">
                  No workouts yet today. Log your first workout!
                </div>
              ) : (
                todayActivities.map((activity, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={activity.id}
                    className="p-4 rounded-xl border border-[#efd7e2] bg-[#fff1f7] hover:bg-white transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-white border border-[#efc7d6] flex items-center justify-center text-xl shrink-0">
                          {workoutOptions.find(o => o.name === activity.type)?.icon || '🏃'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{activity.type}</p>
                          <div className="flex gap-2 mt-1 text-xs">
                            <span className="font-semibold text-slate-600">{activity.durationMinutes}m</span>
                            <span
                              className={`font-bold ${
                                activity.intensity === 'High'
                                  ? 'text-[#be185d]'
                                  : activity.intensity === 'Medium'
                                  ? 'text-[#db2777]'
                                  : 'text-[#f472b6]'
                              }`}
                            >
                              {activity.intensity}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xl font-bold text-slate-900">{activity.caloriesBurned}</p>
                        <p className="text-xs text-slate-500 font-semibold">kcal</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-6 border border-[#f1d9e2] shadow-sm text-slate-900"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-[#bf5f7e] font-semibold">Your Achievement</p>
              <h2 className="text-3xl font-bold mt-2">Keep it Going!</h2>
            </div>
            <Trophy size={32} className="text-[#db2777]" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#fff1f7] border border-[#efc7d6]">
              <p className="text-sm text-slate-600 mb-1">Total Distance</p>
              <p className="text-2xl font-bold text-slate-900">{todayActivities.length > 0 ? (totalDurationToday * 0.1).toFixed(1) : 0} km</p>
            </div>
            <div className="p-4 rounded-xl bg-[#fff1f7] border border-[#efc7d6]">
              <p className="text-sm text-slate-600 mb-1">Max Intensity</p>
              <p className="text-2xl font-bold text-slate-900">{todayActivities.length > 0 ? (todayActivities.some(a => a.intensity === 'High') ? 'High' : 'Medium') : 'None'}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#fff1f7] border border-[#efc7d6]">
              <p className="text-sm text-slate-600 mb-1">Active Days</p>
              <p className="text-2xl font-bold text-slate-900">{Math.floor(totalDurationToday / 30)}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ActivityTracker;