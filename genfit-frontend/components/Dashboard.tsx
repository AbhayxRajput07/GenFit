import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DailyStats, ActivityData, NutritionData, Theme } from '../types';
import {
  Zap, Moon, Utensils, Footprints, Play, Sparkles, Dumbbell, Activity
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

interface DashboardProps {
  stats: DailyStats;
  activities: ActivityData[];
  nutrition: NutritionData[];
  theme: Theme;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const AI_INSIGHTS = [
  "You're 84% more likely to stay consistent when you sleep before midnight. Tonight, try resting 30 min earlier.",
  "Your physical activity is trending upward this week. You are on track to exceed your goals.",
  "Your protein intake has been slightly below optimal. Consider a protein-rich snack post-workout.",
  "Rest and recovery are just as important as the workout. Your body responds best to balanced cycles.",
  "You've hit your daily targets 4 days in a row. Small, consistent steps build lasting habits."
];

const CircleRing: React.FC<{ pct: number; size?: number; strokeWidth?: number; color?: string; bgStroke?: string; lineCap?: 'round' | 'square'; dropShadow?: string }> = ({
  pct, size = 64, strokeWidth = 5, color = '#3b82f6', bgStroke = 'rgba(255,255,255,0.05)', lineCap = 'round', dropShadow
}) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', filter: dropShadow }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bgStroke} strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap={lineCap}
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
    </svg>
  );
};

/* --- Metric Card — theme-aware ------------------------------------------------ */
interface MetricProps {
  label: string;
  value: string;
  unit: string;
  pct: number;
  Icon: any;
  shadowColor: string;
  baseColor: string;
  ringColor: string;
  isPink: boolean;
}

const PremiumMetricCard: React.FC<MetricProps> = ({ label, value, unit, pct, Icon, shadowColor, baseColor, ringColor, isPink }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className={`group relative p-7 rounded-[2rem] border transition-all duration-500 overflow-hidden shadow-2xl flex flex-col justify-between ${
      isPink
        ? 'border-[#e8d4dd] bg-white hover:bg-pink-50 hover:border-pink-200'
        : 'border-white/5 bg-[#030303] hover:bg-[#050505]'
    }`}
  >
    <div className={`absolute -inset-0.5 bg-gradient-to-br ${baseColor} opacity-0 group-hover:opacity-10 transition-opacity duration-700 blur-2xl`} />

    <div className="relative z-10 flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl border group-hover:scale-110 transition-transform duration-500 ${
          isPink
            ? 'bg-pink-50 border-pink-200/80 shadow-[0_0_15px_rgba(236,72,153,0.1)]'
            : `bg-white/[0.03] border-white/5 shadow-[0_0_15px_${shadowColor}]`
        }`}>
          <Icon size={18} className={isPink ? 'text-pink-500' : 'text-white'} />
        </div>
        <p className={`font-medium text-sm tracking-wide uppercase ${isPink ? 'text-[#9aa7bd]' : 'text-white/50'}`}>{label}</p>
      </div>
      <p className={`text-sm font-bold ${isPink ? 'text-[#9aa7bd]' : 'text-white/40'}`}>{Math.round(pct)}%</p>
    </div>

    <div className="relative z-10 flex items-end justify-between">
      <div>
        <span className={`text-4xl font-bold tracking-tighter ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>{value}</span>
        <span className={`ml-1.5 flex-1 text-sm font-medium ${isPink ? 'text-[#9aa7bd]' : 'text-white/50'}`}>{unit}</span>
      </div>

      <div className="relative flex items-center justify-center w-10 h-10">
        <CircleRing
          pct={pct} size={40} strokeWidth={4} color={ringColor}
          bgStroke={isPink ? 'rgba(236,72,153,0.12)' : 'rgba(255,255,255,0.05)'}
          dropShadow={`drop-shadow(0 0 8px ${ringColor}80)`}
        />
      </div>
    </div>

  </motion.div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats, activities, nutrition, theme }) => {
  const isPink = theme === 'pink';
  const today = new Date().toDateString();
  const todayActivities = activities.filter(a => new Date(a.timestamp).toDateString() === today);
  const todayCalories = nutrition.filter(n => new Date(n.timestamp ?? Date.now()).toDateString() === today)
    .reduce((s, n) => s + n.calories, 0);

  const recentActivities = [...activities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  const weekData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); const key = d.toDateString();
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      burn: activities.filter(a => new Date(a.timestamp).toDateString() === key).reduce((s, a) => s + a.caloriesBurned, 0),
    };
  });

  const stepsScore = Math.min((stats.steps / stats.stepsGoal) * 100, 100);
  const sleepScore = Math.min((stats.sleepHours / 8) * 100, 100);
  const calScore = Math.min((todayCalories / stats.calorieGoal) * 100, 100);
  const todayScore = Math.round((stepsScore + sleepScore + calScore) / 3);

  const [insightIdx] = useState(() => Math.floor(Math.random() * AI_INSIGHTS.length));
  const insight = AI_INSIGHTS[insightIdx];

  // Quick action buttons
  const quickActions = isPink
    ? [
        { label: 'Log Workout', Icon: Play,    cls: 'hover:border-pink-300 hover:bg-pink-100 hover:shadow-[0_0_20px_rgba(236,72,153,0.15)] text-pink-500' },
        { label: 'Add Meal',    Icon: Utensils, cls: 'hover:border-pink-300 hover:bg-pink-100 hover:shadow-[0_0_20px_rgba(236,72,153,0.15)] text-pink-500' },
        { label: 'Add Water',   Icon: Zap,      cls: 'hover:border-rose-300 hover:bg-rose-50  hover:shadow-[0_0_20px_rgba(251,113,133,0.15)] text-rose-500' },
        { label: 'Log Sleep',   Icon: Moon,     cls: 'hover:border-pink-300 hover:bg-pink-100 hover:shadow-[0_0_20px_rgba(236,72,153,0.15)] text-pink-500' },
      ]
    : [
        { label: 'Log Workout', Icon: Play,    cls: 'hover:border-blue-500/50 hover:bg-blue-500/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] text-blue-400' },
        { label: 'Add Meal',    Icon: Utensils, cls: 'hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] text-emerald-400' },
        { label: 'Add Water',   Icon: Zap,      cls: 'hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] text-cyan-400' },
        { label: 'Log Sleep',   Icon: Moon,     cls: 'hover:border-sky-500/50 hover:bg-sky-500/10 hover:shadow-[0_0_20px_rgba(14,165,233,0.2)] text-sky-400' },
      ];

  return (
    <div className={`w-full min-h-screen px-4 md:px-8 lg:px-12 py-8 md:py-12 overflow-x-hidden ${isPink ? 'bg-[#f6edf2] text-[#1f2a44] selection:bg-pink-200/70' : 'bg-[#010101] text-white selection:bg-blue-500/30'}`}>
      <div className={`fixed top-[-20%] right-[-10%] w-[50vw] h-[50vw] blur-[150px] rounded-full pointer-events-none ${isPink ? 'bg-pink-300/20' : 'bg-blue-600/10'}`} />

      <div className="relative w-full max-w-[1400px] mx-auto flex flex-col gap-8 md:gap-10">
        <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-4 relative z-10">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
              className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full mb-6 border ${isPink ? 'border-pink-200/80 bg-pink-50 shadow-[0_0_20px_rgba(236,72,153,0.12)]' : 'border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.2)]'}`}
            >
              <span className={`w-2 h-2 rounded-full animate-pulse ${isPink ? 'bg-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.55)]' : 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'}`} />
              <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${isPink ? 'text-pink-500' : 'text-cyan-300'}`}>Live Sync Active</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
              className={`text-5xl md:text-6xl lg:text-[70px] font-medium tracking-tighter mb-4 drop-shadow-xl ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}
            >
              {getGreeting()}, <span className={`text-transparent bg-clip-text ${isPink ? 'bg-gradient-to-r from-pink-500 to-rose-500' : 'bg-gradient-to-r from-blue-300 to-sky-500'}`}>Abhay</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.3 }}
              className={`text-lg font-light max-w-2xl tracking-wide ${isPink ? 'text-[#7d8ca6]' : 'text-white/50'}`}
            >
              Neural synchronization complete. Here's your master dashboard overview.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
            className={`w-full xl:w-[450px] p-6 rounded-3xl border backdrop-blur-xl flex gap-5 items-start shadow-2xl group ${isPink ? 'border-pink-200/80 bg-white/90 text-[#1f2a44]' : 'border-white/10 bg-[#050505]/80 text-white'}`}
          >
            <div className={`p-3 rounded-2xl flex-shrink-0 border group-hover:scale-110 transition-transform duration-500 ${isPink ? 'bg-pink-100 text-pink-500 border-pink-200/80 shadow-[0_0_15px_rgba(236,72,153,0.12)]' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]'}`}>
              <Sparkles size={24} />
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ${isPink ? 'text-[#9aa7bd]' : 'text-white/40'}`}>Smart Insight</p>
              <p className={`text-sm leading-relaxed font-light ${isPink ? 'text-[#1f2a44]/80' : 'text-white/80'}`}>{insight}</p>
            </div>
          </motion.div>
        </section>

        {/* ── METRIC CARDS ── */}
        <motion.section variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
          {/* System Health ring */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`group p-7 rounded-[2rem] border flex flex-col justify-center items-center relative overflow-hidden shadow-2xl ${isPink ? 'border-[#e8d4dd] bg-white hover:bg-pink-50 hover:border-pink-200' : 'border-white/5 bg-gradient-to-br from-[#050505] to-[#020202]'}`}
          >
            <div className={`absolute inset-0 blur-[50px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-700 ${isPink ? 'bg-pink-300/10' : 'bg-blue-500/10'}`} />
            <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-6 relative z-10 ${isPink ? 'text-[#9aa7bd]' : 'text-white/50'}`}>System Health</p>
            <div className="relative mb-5 z-10">
              <CircleRing pct={todayScore} size={130} strokeWidth={8} color={isPink ? '#ec4899' : '#3b82f6'} bgStroke={isPink ? 'rgba(236,72,153,0.12)' : 'rgba(255,255,255,0.05)'} dropShadow={isPink ? 'drop-shadow(0 0 15px rgba(236,72,153,0.35))' : 'drop-shadow(0 0 15px rgba(59,130,246,0.5))'} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold tracking-tighter ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>{todayScore}</span>
              </div>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.1em] uppercase relative z-10 transition-colors ${isPink ? 'bg-pink-50 border border-pink-200/80 text-pink-500 group-hover:border-pink-300 group-hover:bg-pink-100' : 'bg-white/5 border border-white/10 text-white/70 group-hover:border-blue-500/30 group-hover:bg-blue-500/10'}`}>
              {todayScore >= 80 ? 'Optimal' : todayScore >= 60 ? 'Stable' : 'Critical'}
            </div>
          </motion.div>

          <PremiumMetricCard isPink={isPink}
            label="Activity" value={stats.steps.toLocaleString()} unit="steps" pct={stepsScore} Icon={Footprints}
            baseColor={isPink ? 'from-pink-500/0 via-pink-500/10 to-transparent' : 'from-blue-500/0 via-blue-500/10 to-transparent'}
            shadowColor={isPink ? 'rgba(236,72,153,0.35)' : 'rgba(59,130,246,0.5)'} ringColor={isPink ? '#ec4899' : '#3b82f6'}
          />
          <PremiumMetricCard isPink={isPink}
            label="Sleep" value={`${stats.sleepHours}`} unit="hrs" pct={sleepScore} Icon={Moon}
            baseColor={isPink ? 'from-rose-500/0 via-rose-500/10 to-transparent' : 'from-sky-500/0 via-sky-500/10 to-transparent'}
            shadowColor={isPink ? 'rgba(251,113,133,0.35)' : 'rgba(14,165,233,0.5)'} ringColor={isPink ? '#fb7185' : '#0ea5e9'}
          />
          <PremiumMetricCard isPink={isPink}
            label="Nutrition" value={`${todayCalories}`} unit="kcal" pct={calScore} Icon={Utensils}
            baseColor={isPink ? 'from-pink-500/0 via-pink-500/10 to-transparent' : 'from-cyan-500/0 via-cyan-500/10 to-transparent'}
            shadowColor={isPink ? 'rgba(236,72,153,0.35)' : 'rgba(6,182,212,0.5)'} ringColor={isPink ? '#ec4899' : '#22d3ee'}
          />
        </motion.section>

        {/* ── QUICK ACTIONS ── */}
        <motion.section variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          {quickActions.map((action, i) => (
            <motion.button
              key={i} variants={itemVariants} whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className={`p-5 rounded-2xl border flex items-center justify-center gap-3 transition-colors duration-300 font-bold text-xs tracking-widest uppercase group ${action.cls} ${
                isPink
                  ? 'border-[#e8d4dd] bg-white text-pink-400'
                  : 'border-white/5 bg-[#030303] text-white/70'
              }`}
            >
              <action.Icon size={18} className="transition-transform group-hover:scale-110" />
              <span>{action.label}</span>
            </motion.button>
          ))}
        </motion.section>

        {/* ── CHART + LOGS ── */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          
          {/* Activity Output Chart */}
          <motion.div variants={itemVariants} className={`lg:col-span-2 p-8 rounded-[2rem] border shadow-2xl ${isPink ? 'border-[#e8d4dd] bg-white' : 'border-white/5 bg-[#030303]'}`}>
            <div className="flex items-center justify-between mb-10">
              <h3 className={`text-xl font-medium tracking-tight ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>Activity Output</h3>
              <select className={`text-xs font-bold tracking-widest uppercase rounded-lg px-3 py-1.5 outline-none cursor-pointer transition-colors ${isPink ? 'bg-pink-50 border border-pink-200/80 text-pink-500 hover:bg-pink-100' : 'bg-white/5 border border-white/10 text-white/70 hover:text-white'}`}>
                <option className={isPink ? 'bg-white' : 'bg-[#050505]'}>This Week</option>
                <option className={isPink ? 'bg-white' : 'bg-[#050505]'}>Last Week</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isPink ? '#ec4899' : '#3b82f6'} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={isPink ? '#ec4899' : '#3b82f6'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isPink ? 'rgba(236,72,153,0.08)' : 'rgba(255,255,255,0.05)'} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isPink ? '#9aa7bd' : '#64748b', fontWeight: 'bold' }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isPink ? '#9aa7bd' : '#64748b', fontWeight: 'bold' }} dx={-10} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: isPink ? '1px solid #e8d4dd' : '1px solid rgba(255,255,255,0.1)',
                      background: isPink ? 'rgba(255,248,251,0.97)' : 'rgba(5,5,5,0.9)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: isPink ? '0 20px 40px rgba(236,72,153,0.12)' : '0 20px 40px rgba(0,0,0,0.8)',
                      color: isPink ? '#1f2a44' : '#fff'
                    }}
                    itemStyle={{ color: isPink ? '#ec4899' : '#60a5fa', fontWeight: 600 }}
                  />
                  <Area
                    type="monotone" dataKey="burn"
                    stroke={isPink ? '#ec4899' : '#3b82f6'} strokeWidth={4}
                    fill="url(#chartGrad)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: isPink ? '#f472b6' : '#93c5fd' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* System Logs */}
          <motion.div variants={itemVariants} className={`p-8 rounded-[2rem] border shadow-2xl flex flex-col ${isPink ? 'border-[#e8d4dd] bg-white' : 'border-white/5 bg-[#030303]'}`}>
            <h3 className={`text-xl font-medium tracking-tight mb-8 ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>System Logs</h3>
            <div className="flex-1 overflow-auto pr-2 custom-scrollbar space-y-4">
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-50">
                  <div className={`p-4 rounded-2xl border mb-4 ${isPink ? 'bg-pink-50 border-pink-200/80' : 'bg-white/5 border-white/10'}`}>
                    <Activity size={24} className={isPink ? 'text-pink-300' : 'text-white/50'} />
                  </div>
                  <p className={`text-xs font-bold tracking-widest uppercase ${isPink ? 'text-[#9aa7bd]' : 'text-white/50'}`}>No Data Synced</p>
                </div>
              ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                  {recentActivities.map((a, i) => (
                    <motion.div key={i} variants={itemVariants}
                      className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                        isPink
                          ? 'border-[#e8d4dd] bg-pink-50/50 hover:bg-pink-50 hover:border-pink-200'
                          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                      }`}>
                      <div className={`p-3 rounded-xl flex-shrink-0 border group-hover:scale-110 transition-transform ${isPink ? 'bg-pink-100 text-pink-500 border-pink-200/80' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        <Dumbbell size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>{a.type}</p>
                        <p className={`text-[10px] font-bold tracking-widest uppercase mt-1 ${isPink ? 'text-[#9aa7bd]' : 'text-white/40'}`}>{a.durationMinutes} minutes</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${isPink ? 'text-pink-500' : 'text-blue-400'}`}>{a.caloriesBurned}</p>
                        <p className={`text-[9px] font-bold tracking-[0.2em] ${isPink ? 'text-[#9aa7bd]' : 'text-white/30'}`}>KCAL</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>

        <div className="h-12" />
      </div>
    </div>
  );
};

export default Dashboard;
