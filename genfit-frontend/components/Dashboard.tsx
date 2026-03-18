import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';
import { DailyStats, ActivityData, NutritionData } from '../types';
import { Flame, Footprints, Moon, Activity, Edit, Sparkles, Zap, Droplets, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardProps {
  stats: DailyStats;
  activities: ActivityData[];
  nutrition: NutritionData[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, activities, nutrition }) => {
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('fitnessGoals');
    return saved
      ? JSON.parse(saved)
      : { steps: 10000, calories: 800, sleep: 8, heart: 80 };
  });

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem('fitnessGoals', JSON.stringify(goals));
  }, [goals]);

  const weightData = [
    { day: 'Mon', weight: 70.2 }, { day: 'Tue', weight: 70.1 },
    { day: 'Wed', weight: 69.9 }, { day: 'Thu', weight: 69.8 },
    { day: 'Fri', weight: 69.6 }, { day: 'Sat', weight: 69.5 },
    { day: 'Sun', weight: 69.3 },
  ];

  const today = new Date().toDateString();
  const todayActivities = activities.filter(a => new Date(a.timestamp).toDateString() === today);
  const totalDuration = todayActivities.reduce((sum, item) => sum + item.durationMinutes, 0);
  const totalBurn = todayActivities.reduce((sum, item) => sum + item.caloriesBurned, 0);

  const recentActivities = [...activities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 4);

  const burnByDay = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const dayKey = date.toDateString();
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      burn: activities
        .filter(item => new Date(item.timestamp).toDateString() === dayKey)
        .reduce((sum, item) => sum + item.caloriesBurned, 0)
    };
  });

  const totalProtein = nutrition.reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = nutrition.reduce((sum, item) => sum + item.carbs, 0);
  const totalFats = nutrition.reduce((sum, item) => sum + item.fats, 0);
  const totalMacros = totalProtein + totalCarbs + totalFats;

  const macroData = [
    { name: 'Protein', value: totalMacros > 0 ? Math.round((totalProtein / totalMacros) * 100) : 30 },
    { name: 'Carbs', value: totalMacros > 0 ? Math.round((totalCarbs / totalMacros) * 100) : 50 },
    { name: 'Fats', value: totalMacros > 0 ? Math.round((totalFats / totalMacros) * 100) : 20 },
  ];

  const COLORS = ['#db2777', '#f472b6', '#f9a8d4'];

  const StatCard = ({ title, value, unit, goal, icon: Icon, color }: any) => {
    const safeGoal = goal > 0 ? goal : 1;
    const percent = Math.min((value / safeGoal) * 100, 100);
    return (
      <motion.div
        whileHover={{ y: -4 }}
        className="bg-white p-6 rounded-3xl shadow-sm border border-[#f1d9e2] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-[0.08]">
          <Icon size={58} />
        </div>
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#bf5f7e] mb-1">{title}</p>
          <div className="flex items-baseline gap-2 mb-3">
            <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
            <span className="text-xs font-semibold text-slate-500 uppercase">{unit}</span>
          </div>
          <div className="h-2 w-full bg-[#f8dfe8] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              className="h-full"
              style={{ backgroundColor: color || '#db2777' }}
            />
          </div>
          <p className="text-[11px] font-medium text-slate-500 mt-2">Goal: {goal} {unit}</p>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full min-h-screen px-4 md:px-8 lg:px-10 py-8 bg-gradient-to-b from-[#ffeef4] via-[#fff4f8] to-[#fff7fb] text-slate-900">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-[#db2777]" size={18} />
            <span className="text-xs font-semibold uppercase tracking-wide text-[#bf5f7e]">Daily Overview</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Your Fitness Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Track goals, progress trends, and recent performance in one place.</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="p-4 rounded-2xl bg-white border border-[#f1d9e2] hover:bg-[#ffe8f1] transition-all shadow-sm"
        >
          <Edit size={20} className="text-[#bf5f7e]" />
        </button>
      </motion.div>

      {/* Highlight Strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.02 }}
        className="mb-7 bg-white border border-[#f1d9e2] rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
      >
        <div>
          <p className="text-sm text-[#bf5f7e] font-semibold">Today at a glance</p>
          <h3 className="text-2xl font-bold mt-1">{totalDuration} min activity • {totalBurn} kcal burned</h3>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="px-3 py-1.5 rounded-lg bg-[#ffe8f1] border border-[#efc7d6] text-[#bf5f7e] font-semibold">{todayActivities.length} sessions</span>
          <span className="px-3 py-1.5 rounded-lg bg-white border border-[#efc7d6] text-slate-600 font-semibold">Water: {stats.waterMl} ml</span>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Core Metrics */}
        <div className="xl:col-span-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Steps" value={stats.steps} unit="steps" goal={goals.steps} icon={Footprints} color="#db2777" />
          <StatCard title="Calories Out" value={stats.caloriesOut} unit="kcal" goal={goals.calories} icon={Flame} color="#f43f5e" />
          <StatCard title="Sleep" value={stats.sleepHours} unit="hrs" goal={goals.sleep} icon={Moon} color="#ec4899" />
          <StatCard title="Hydration" value={stats.waterMl} unit="ml" goal={stats.waterTarget} icon={Droplets} color="#e11d48" />
        </div>

        {/* Left Section */}
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-[#f1d9e2]">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-3">
              <h3 className="text-xl font-bold">Weight Trend</h3>
              <div className="flex gap-2 text-xs font-semibold p-1 bg-[#ffe8f1] rounded-lg border border-[#efc7d6]">
                <button className="px-3 py-1 rounded-md bg-white text-slate-700">Weight</button>
                <button className="px-3 py-1 rounded-md text-[#bf5f7e]">BMI</button>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightData}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#db2777" stopOpacity={0.28}/>
                      <stop offset="95%" stopColor="#db2777" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#efd7e2" vertical={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #efc7d6', boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }} 
                  />
                  <Area type="monotone" dataKey="weight" stroke="#db2777" strokeWidth={3.5} fillOpacity={1} fill="url(#colorWeight)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 600, fill: '#a46d84'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#a46d84'}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-[#f1d9e2]">
               <h3 className="text-lg font-bold mb-5">Macro Split</h3>
               <div className="h-60">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={macroData} innerRadius={58} outerRadius={82} paddingAngle={5} dataKey="value">
                       {macroData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index]} />
                       ))}
                     </Pie>
                   </PieChart>
                 </ResponsiveContainer>
               </div>
               <div className="flex justify-around mt-3">
                  {macroData.map((m, i) => (
                    <div key={i} className="text-center">
                       <p className="text-sm font-bold text-[#bf5f7e]">{m.value}%</p>
                       <p className="text-[11px] font-semibold text-slate-500 uppercase">{m.name}</p>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-white text-slate-900 p-5 md:p-6 rounded-3xl shadow-sm border border-[#f1d9e2] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-15">
                  <Trophy size={80} />
               </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#bf5f7e] mb-2">Milestone Progress</p>
               <h3 className="text-2xl md:text-3xl font-bold mb-4">Unstoppable Streak</h3>
              <p className="text-sm leading-relaxed text-slate-600 mb-6 max-w-xs">
                 You are building a strong routine. Keep consistency this week to unlock a fresh performance badge.
               </p>
              <button className="bg-[#db2777] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#be185d] transition-all">
                 Claim Reward
               </button>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-[#f1d9e2]">
            <h3 className="text-xl font-bold mb-5">Weekly Burn Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={burnByDay}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#efd7e2" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 600, fill: '#a46d84'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#a46d84'}} />
                  <Tooltip
                    cursor={{ fill: '#ffe9f3' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #efc7d6',
                      backgroundColor: '#fff'
                    }}
                  />
                  <Bar dataKey="burn" radius={[8, 8, 0, 0]} fill="#db2777" barSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Rail */}
        <div className="xl:col-span-4 space-y-6">
           <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-[#f1d9e2]">
              <h3 className="text-lg font-bold mb-4">Recent Activities</h3>
              <div className="space-y-4">
                 {recentActivities.map((a, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-[#fff1f7] border border-[#efc7d6] rounded-2xl">
                       <div className="flex items-center gap-3">
                          <Activity size={16} className="text-[#db2777]" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{a.type}</p>
                            <p className="text-xs text-slate-500">{a.durationMinutes} min</p>
                          </div>
                       </div>
                       <p className="text-base font-bold text-slate-900">{a.caloriesBurned} <span className="text-[10px] text-slate-500">kcal</span></p>
                    </div>
                 ))}
                 {recentActivities.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No activities logged yet.</p>}
              </div>
           </div>

           <div className="p-5 md:p-6 border border-[#efc7d6] rounded-3xl bg-[#fff1f7]">
              <div className="flex items-center gap-3 mb-4">
                 <Zap className="text-[#db2777]" size={20} />
                 <p className="text-sm font-bold uppercase tracking-wide text-[#bf5f7e]">AI Insight</p>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">
                Sleep quality dropped slightly versus last week. Try a fixed bedtime for 3 days to improve recovery and workout output.
              </p>
           </div>

           <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-[#f1d9e2]">
              <h3 className="text-lg font-bold mb-3">Quick Goal Health</h3>
              <div className="space-y-2 text-sm">
                <p className="text-slate-700">Steps Progress: <span className="font-semibold">{Math.min(Math.round((stats.steps / goals.steps) * 100), 100)}%</span></p>
                <p className="text-slate-700">Calories Progress: <span className="font-semibold">{Math.min(Math.round((stats.caloriesOut / goals.calories) * 100), 100)}%</span></p>
                <p className="text-slate-700">Sleep Progress: <span className="font-semibold">{Math.min(Math.round((stats.sleepHours / goals.sleep) * 100), 100)}%</span></p>
              </div>
           </div>
        </div>
      </div>

      {/* Goals Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-[#f1d9e2]"
            >
              <h3 className="text-2xl font-bold mb-6">Edit Goals</h3>
              <div className="space-y-5">
                {[['Steps', 'steps'], ['Calories', 'calories'], ['Sleep', 'sleep'], ['Heart', 'heart']].map(([l, k]: any) => (
                  <div key={k}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#bf5f7e] mb-2 ml-1">{l}</p>
                    <input
                      type="number"
                      value={goals[k]}
                      onChange={e => setGoals({ ...goals, [k]: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-white rounded-xl font-semibold outline-none border border-[#efc7d6] focus:ring-2 ring-pink-200"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setEditing(false)}
                className="w-full py-3 mt-6 bg-[#db2777] text-white rounded-xl font-semibold hover:bg-[#be185d] transition-all"
              >
                Save Goals
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;