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
import { DailyStats, ActivityData, NutritionData, Theme } from '../types';
import { Flame, Footprints, Moon, Activity, Edit, Sparkles, Zap, Droplets, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardProps {
  stats: DailyStats;
  activities: ActivityData[];
  nutrition: NutritionData[];
  theme: Theme;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, activities, nutrition, theme }) => {
  const isBlue = theme === 'blue';
  const isPink = theme === 'pink';

  // Theme-aware colors
  const colors = {
    bgGradient: isBlue 
      ? 'from-[#f3f7ff] via-[#edf3ff] to-[#e7efff]' 
      : 'from-[#fff3f8] via-[#fff7fb] to-[#fdf2f8]',
    cardBg: isBlue ? 'bg-white/75 backdrop-blur-xl' : 'bg-white/80 backdrop-blur-xl',
    cardBorder: isBlue ? 'border-[#dbe6ff]' : 'border-[#f4dce8]',
    textMain: isBlue ? 'text-slate-800' : 'text-slate-800',
    textSub: isBlue ? 'text-slate-500' : 'text-slate-500',
    textAccent: isBlue ? 'text-[#4f67d7]' : 'text-[#c7568a]',
    accentPrimary: isBlue ? '#60a5fa' : '#ec4899',
    accentSecondary: isBlue ? '#818cf8' : '#f472b6',
    accentTertiary: isBlue ? '#38bdf8' : '#fb7185',
    progressBarBg: isBlue ? '#e6edff' : '#fbe4ef',
    iconAccent: isBlue ? 'text-[#5b74de]' : 'text-[#d9468f]',
    buttonBg: isBlue ? 'bg-[#5b74de]' : 'bg-[#d9468f]',
    buttonHover: isBlue ? 'hover:bg-[#4f67d7]' : 'hover:bg-[#be3e7d]',
    tagBg: isBlue ? 'bg-[#f5f8ff]' : 'bg-[#fff2f8]',
    tagBorder: isBlue ? 'border-[#dbe6ff]' : 'border-[#f4dce8]',
    chartGrid: isBlue ? '#dbe6ff' : '#f3dce7',
    tooltipBg: '#ffffff',
    tooltipBorder: isBlue ? '#dbe6ff' : '#f4dce8',
  };

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

  const COLORS = [colors.accentPrimary, colors.accentSecondary, colors.accentTertiary];

  const StatCard = ({ title, value, unit, goal, icon: Icon, color }: any) => {
    const safeGoal = goal > 0 ? goal : 1;
    const percent = Math.min((value / safeGoal) * 100, 100);
    return (
      <motion.div
        whileHover={{ y: -4 }}
        className={`${colors.cardBg} p-6 rounded-3xl shadow-sm border ${colors.cardBorder} relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 p-4 opacity-[0.09] text-slate-400">
          <Icon size={58} />
        </div>
        <div className="relative z-10">
          <p className={`text-xs font-semibold uppercase tracking-wide ${colors.textAccent} mb-1`}>{title}</p>
          <div className="flex items-baseline gap-2 mb-3">
            <h3 className={`text-3xl font-bold ${colors.textMain}`}>{value}</h3>
            <span className={`text-xs font-semibold ${colors.textSub} uppercase`}>{unit}</span>
          </div>
          <div className={`h-2 w-full ${colors.progressBarBg} rounded-full overflow-hidden`}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              className="h-full"
              style={{ backgroundColor: color || colors.accentPrimary }}
            />
          </div>
          <p className={`text-[11px] font-medium ${colors.textSub} mt-2`}>Goal: {goal} {unit}</p>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`w-full min-h-screen px-4 md:px-8 lg:px-10 py-8 bg-gradient-to-b ${colors.bgGradient} ${colors.textMain}`}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className={colors.iconAccent} size={18} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${colors.textAccent}`}>Daily Overview</span>
          </div>
          <h2 className={`text-3xl md:text-5xl font-bold tracking-tight ${colors.textMain}`}>Your Fitness Dashboard</h2>
          <p className={`text-sm ${colors.textSub} mt-1`}>Track goals, progress trends, and recent performance in one place.</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className={`p-4 rounded-2xl ${colors.cardBg} border ${colors.cardBorder} ${isPink ? 'hover:bg-[#fff0f7]' : 'hover:bg-[#eef3ff]'} transition-all shadow-sm`}
        >
          <Edit size={20} className={colors.textAccent} />
        </button>
      </motion.div>

      {/* Highlight Strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.02 }}
        className={`mb-7 ${colors.cardBg} border ${colors.cardBorder} rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}
      >
        <div>
          <p className={`text-sm ${colors.textAccent} font-semibold`}>Today at a glance</p>
          <h3 className={`text-2xl font-bold mt-1 ${colors.textMain}`}>{totalDuration} min activity • {totalBurn} kcal burned</h3>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className={`px-3 py-1.5 rounded-lg ${colors.tagBg} border ${colors.tagBorder} ${colors.textAccent} font-semibold`}>{todayActivities.length} sessions</span>
          <span className={`px-3 py-1.5 rounded-lg ${colors.cardBg} border ${colors.tagBorder} ${colors.textSub} font-semibold`}>Water: {stats.waterMl} ml</span>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Core Metrics */}
        <div className="xl:col-span-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Steps" value={stats.steps} unit="steps" goal={goals.steps} icon={Footprints} color={colors.accentPrimary} />
          <StatCard title="Calories Out" value={stats.caloriesOut} unit="kcal" goal={goals.calories} icon={Flame} color={isPink ? '#f43f5e' : '#3b82f6'} />
          <StatCard title="Sleep" value={stats.sleepHours} unit="hrs" goal={goals.sleep} icon={Moon} color={isPink ? '#ec4899' : '#8b5cf6'} />
          <StatCard title="Hydration" value={stats.waterMl} unit="ml" goal={stats.waterTarget} icon={Droplets} color={isPink ? '#e11d48' : '#0ea5e9'} />
        </div>

        {/* Left Section */}
        <div className="xl:col-span-8 space-y-6">
          <div className={`${colors.cardBg} p-5 md:p-6 rounded-3xl shadow-sm border ${colors.cardBorder}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-3">
              <h3 className={`text-xl font-bold ${colors.textMain}`}>Weight Trend</h3>
              <div className={`flex gap-2 text-xs font-semibold p-1 ${colors.tagBg} rounded-lg border ${colors.tagBorder}`}>
                <button className={`px-3 py-1 rounded-md ${colors.cardBg} ${colors.textMain}`}>Weight</button>
                <button className={`px-3 py-1 rounded-md ${colors.textAccent}`}>BMI</button>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightData}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.accentPrimary} stopOpacity={0.28}/>
                      <stop offset="95%" stopColor={colors.accentPrimary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke={colors.chartGrid} vertical={false} />
                  <Tooltip 
                    contentStyle={{ 
                        borderRadius: '12px', 
                        border: `1px solid ${colors.tooltipBorder}`, 
                        boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                        backgroundColor: colors.tooltipBg,
                        color: colors.textMain
                    }} 
                    itemStyle={{ color: colors.textMain }}
                  />
                  <Area type="monotone" dataKey="weight" stroke={colors.accentPrimary} strokeWidth={3.5} fillOpacity={1} fill="url(#colorWeight)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 600, fill: isPink ? '#b0728f' : '#6f86d9'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: isPink ? '#b0728f' : '#6f86d9'}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${colors.cardBg} p-5 md:p-6 rounded-3xl shadow-sm border ${colors.cardBorder}`}>
               <h3 className={`text-lg font-bold mb-5 ${colors.textMain}`}>Macro Split</h3>
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
                       <p className={`text-sm font-bold ${colors.textAccent}`}>{m.value}%</p>
                       <p className={`text-[11px] font-semibold ${colors.textSub} uppercase`}>{m.name}</p>
                    </div>
                  ))}
               </div>
            </div>

            <div className={`${colors.cardBg} ${colors.textMain} p-5 md:p-6 rounded-3xl shadow-sm border ${colors.cardBorder} relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-8 opacity-15 text-slate-400">
                  <Trophy size={80} />
               </div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${colors.textAccent} mb-2`}>Milestone Progress</p>
               <h3 className={`text-2xl md:text-3xl font-bold mb-4 ${colors.textMain}`}>Unstoppable Streak</h3>
              <p className={`text-sm leading-relaxed ${colors.textSub} mb-6 max-w-xs`}>
                 You are building a strong routine. Keep consistency this week to unlock a fresh performance badge.
               </p>
              <button className={`${colors.buttonBg} text-white px-6 py-3 rounded-xl font-bold text-sm ${colors.buttonHover} transition-all`}>
                 Claim Reward
              </button>
            </div>
          </div>

          <div className={`${colors.cardBg} p-5 md:p-6 rounded-3xl shadow-sm border ${colors.cardBorder}`}>
            <h3 className={`text-xl font-bold mb-5 ${colors.textMain}`}>Weekly Burn Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={burnByDay}>
                  <CartesianGrid strokeDasharray="4 4" stroke={colors.chartGrid} vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 600, fill: isPink ? '#b0728f' : '#6f86d9'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: isPink ? '#b0728f' : '#6f86d9'}} />
                  <Tooltip
                    cursor={{ fill: isPink ? '#ffe9f3' : '#eef3ff' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: `1px solid ${colors.tooltipBorder}`,
                      backgroundColor: colors.tooltipBg,
                      color: colors.textMain
                    }}
                    itemStyle={{ color: colors.textMain }}
                  />
                  <Bar dataKey="burn" radius={[8, 8, 0, 0]} fill={colors.accentPrimary} barSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Rail */}
        <div className="xl:col-span-4 space-y-6">
           <div className={`${colors.cardBg} p-5 md:p-6 rounded-3xl shadow-sm border ${colors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${colors.textMain}`}>Recent Activities</h3>
              <div className="space-y-4">
                 {recentActivities.map((a, i) => (
                    <div key={i} className={`flex justify-between items-center p-4 ${colors.tagBg} border ${colors.tagBorder} rounded-2xl`}>
                       <div className="flex items-center gap-3">
                          <Activity size={16} className={colors.iconAccent} />
                          <div>
                            <p className={`text-sm font-semibold ${colors.textMain}`}>{a.type}</p>
                            <p className={`text-xs ${colors.textSub}`}>{a.durationMinutes} min</p>
                          </div>
                       </div>
                       <p className={`text-base font-bold ${colors.textMain}`}>{a.caloriesBurned} <span className={`text-[10px] ${colors.textSub}`}>kcal</span></p>
                    </div>
                 ))}
                 {recentActivities.length === 0 && <p className={`text-center py-8 text-sm ${colors.textSub}`}>No activities logged yet.</p>}
              </div>
           </div>

           <div className={`p-5 md:p-6 border ${colors.tagBorder} rounded-3xl ${colors.tagBg}`}>
              <div className="flex items-center gap-3 mb-4">
                 <Zap className={colors.iconAccent} size={20} />
                 <p className={`text-sm font-bold uppercase tracking-wide ${colors.textAccent}`}>AI Insight</p>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">
                Sleep quality dropped slightly versus last week. Try a fixed bedtime for 3 days to improve recovery and workout output.
              </p>
           </div>

           <div className={`${colors.cardBg} p-5 md:p-6 rounded-3xl shadow-sm border ${colors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-3 ${colors.textMain}`}>Quick Goal Health</h3>
              <div className="space-y-2 text-sm text-slate-700">
                <p>Steps Progress: <span className="font-semibold">{Math.min(Math.round((stats.steps / goals.steps) * 100), 100)}%</span></p>
                <p>Calories Progress: <span className="font-semibold">{Math.min(Math.round((stats.caloriesOut / goals.calories) * 100), 100)}%</span></p>
                <p>Sleep Progress: <span className="font-semibold">{Math.min(Math.round((stats.sleepHours / goals.sleep) * 100), 100)}%</span></p>
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
              className={`${colors.cardBg} p-8 rounded-3xl shadow-xl w-full max-w-md border ${colors.cardBorder}`}
            >
              <h3 className={`text-2xl font-bold mb-6 ${colors.textMain}`}>Edit Goals</h3>
              <div className="space-y-5">
                {[['Steps', 'steps'], ['Calories', 'calories'], ['Sleep', 'sleep'], ['Heart', 'heart']].map(([l, k]: any) => (
                  <div key={k}>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${colors.textAccent} mb-2 ml-1`}>{l}</p>
                    <input
                      type="number"
                      value={goals[k]}
                      onChange={e => setGoals({ ...goals, [k]: Number(e.target.value) })}
                      className={`w-full px-4 py-3 ${colors.cardBg} ${colors.textMain} rounded-xl font-semibold outline-none border ${colors.cardBorder} focus:ring-2 ${isPink ? 'ring-pink-200' : 'ring-indigo-200'}`}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setEditing(false)}
                className={`w-full py-3 mt-6 ${colors.buttonBg} text-white rounded-xl font-semibold ${colors.buttonHover} transition-all`}
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