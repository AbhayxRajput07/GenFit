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

/* ─── Premium Deep Navy Metric Card ───────────────────────────────────────────────── */
interface MetricProps {
  label: string;
  value: string;
  unit: string;
  pct: number;
  Icon: any;
  shadowColor: string;
  baseColor: string;
  ringColor: string;
}

const PremiumMetricCard: React.FC<MetricProps> = ({ label, value, unit, pct, Icon, shadowColor, baseColor, ringColor }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="group relative p-7 rounded-[2rem] border border-white/5 bg-[#030303] hover:bg-[#050505] transition-all duration-500 overflow-hidden shadow-2xl flex flex-col justify-between"
  >
    {/* Hover Glow */}
    <div className={`absolute -inset-0.5 bg-gradient-to-br ${baseColor} opacity-0 group-hover:opacity-10 transition-opacity duration-700 blur-2xl`} />

    <div className="relative z-10 flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl bg-white/[0.03] border border-white/5 shadow-[0_0_15px_${shadowColor}] group-hover:scale-110 transition-transform duration-500`}>
          <Icon size={18} className="text-white" />
        </div>
        <p className="font-medium text-sm text-white/50 tracking-wide uppercase">{label}</p>
      </div>
      <p className="text-sm font-bold text-white/40">{Math.round(pct)}%</p>
    </div>
    
    <div className="relative z-10 flex items-end justify-between">
      <div>
        <span className="text-4xl font-bold tracking-tighter text-white">{value}</span>
        <span className="ml-1.5 flex-1 text-sm font-medium text-white/50">{unit}</span>
      </div>
      
      {/* Clean elegant mini progress ring */}
      <div className="relative flex items-center justify-center w-10 h-10">
         <CircleRing pct={pct} size={40} strokeWidth={4} color={ringColor} bgStroke="rgba(255,255,255,0.05)" dropShadow={`drop-shadow(0 0 8px ${ringColor}80)`} />
      </div>
    </div>
    
  </motion.div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats, activities, nutrition }) => {
  const today = new Date().toDateString();
  const todayActivities = activities.filter(a => new Date(a.timestamp).toDateString() === today);
  const totalBurn = todayActivities.reduce((s, a) => s + a.caloriesBurned, 0);
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

  return (
    <div className="w-full min-h-screen bg-[#010101] text-white px-4 md:px-8 lg:px-12 py-8 md:py-12 overflow-x-hidden selection:bg-blue-500/30">
      
      {/* Ambient Dashboard Background Glow */}
      <div className="fixed top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-[1400px] mx-auto flex flex-col gap-8 md:gap-10">
        
        {/* HERO SECTION */}
        <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-4 relative z-10">
          <div className="flex-1">
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full mb-6 border border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-300 uppercase">Live Sync Active</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-[70px] font-medium tracking-tighter mb-4 text-white drop-shadow-xl"
            >
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-sky-500">Abhay</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.3 }}
              className="text-lg font-light max-w-2xl text-white/50 tracking-wide"
            >
              Neural synchronization complete. Here's your master dashboard overview.
            </motion.p>
          </div>
          
          {/* AI Insight Pill */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full xl:w-[450px] p-6 rounded-3xl border border-white/10 bg-[#050505]/80 backdrop-blur-xl flex gap-5 items-start shadow-2xl group"
          >
            <div className="p-3 rounded-2xl flex-shrink-0 bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)] group-hover:scale-110 transition-transform duration-500">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-white/40">Smart Insight</p>
              <p className="text-sm leading-relaxed font-light text-white/80">{insight}</p>
            </div>
          </motion.div>
        </section>

        {/* METRICS ROW */}
        <motion.section variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
          {/* Overall Health Score */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group p-7 rounded-[2rem] border border-white/5 bg-gradient-to-br from-[#050505] to-[#020202] flex flex-col justify-center items-center relative overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 bg-blue-500/10 blur-[50px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
            
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-6 text-white/50 relative z-10">System Health</p>
            
            <div className="relative mb-5 z-10">
              <CircleRing pct={todayScore} size={130} strokeWidth={8} color="#3b82f6" dropShadow="drop-shadow(0 0 15px rgba(59,130,246,0.5))" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold tracking-tighter text-white">{todayScore}</span>
              </div>
            </div>
            
            <div className="px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.1em] uppercase bg-white/5 border border-white/10 text-white/70 relative z-10 group-hover:border-blue-500/30 group-hover:bg-blue-500/10 transition-colors">
              {todayScore >= 80 ? 'Optimal' : todayScore >= 60 ? 'Stable' : 'Critical'}
            </div>
          </motion.div>

          <PremiumMetricCard
            label="Activity" value={stats.steps.toLocaleString()} unit="steps" pct={stepsScore} Icon={Footprints}
            baseColor="from-blue-500/0 via-blue-500/10 to-transparent" shadowColor="rgba(59,130,246,0.5)" ringColor="#3b82f6"
          />
          <PremiumMetricCard
            label="Sleep" value={`${stats.sleepHours}`} unit="hrs" pct={sleepScore} Icon={Moon}
            baseColor="from-sky-500/0 via-sky-500/10 to-transparent" shadowColor="rgba(14,165,233,0.5)" ringColor="#0ea5e9"
          />
          <PremiumMetricCard
            label="Nutrition" value={`${todayCalories}`} unit="kcal" pct={calScore} Icon={Utensils}
            baseColor="from-cyan-500/0 via-cyan-500/10 to-transparent" shadowColor="rgba(6,182,212,0.5)" ringColor="#22d3ee"
          />
        </motion.section>

        {/* QUICK ACTIONS */}
        <motion.section variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          {[
            { label: 'Log Workout', Icon: Play, hoverBase: 'hover:border-blue-500/50 hover:bg-blue-500/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] text-blue-400' },
            { label: 'Add Meal', Icon: Utensils, hoverBase: 'hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] text-emerald-400' },
            { label: 'Add Water', Icon: Zap, hoverBase: 'hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] text-cyan-400' },
            { label: 'Log Sleep', Icon: Moon, hoverBase: 'hover:border-sky-500/50 hover:bg-sky-500/10 hover:shadow-[0_0_20px_rgba(14,165,233,0.2)] text-sky-400' },
          ].map((action, i) => (
            <motion.button
              key={i} variants={itemVariants} whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className={`p-5 rounded-2xl border border-white/5 bg-[#030303] flex items-center justify-center gap-3 transition-colors duration-300 font-bold text-xs tracking-widest uppercase text-white/70 ${action.hoverBase} group`}
            >
              <action.Icon size={18} className="transition-transform group-hover:scale-110" />
              <span>{action.label}</span>
            </motion.button>
          ))}
        </motion.section>

        {/* CHARTS & LOGS */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          <motion.div variants={itemVariants} className="lg:col-span-2 p-8 rounded-[2rem] border border-white/5 bg-[#030303] shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-medium tracking-tight text-white">Activity Output</h3>
              <select className="text-xs font-bold tracking-widest uppercase bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 outline-none cursor-pointer text-white/70 hover:text-white transition-colors">
                <option className="bg-[#050505]">This Week</option>
                <option className="bg-[#050505]">Last Week</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dx={-10} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)' }}
                    itemStyle={{ color: '#60a5fa', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="burn" stroke="#3b82f6" strokeWidth={4} fill="url(#chartGrad)" activeDot={{ r: 6, strokeWidth: 0, fill: '#93c5fd', className: 'drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Recent Logs */}
          <motion.div variants={itemVariants} className="p-8 rounded-[2rem] border border-white/5 bg-[#030303] shadow-2xl flex flex-col">
            <h3 className="text-xl font-medium tracking-tight text-white mb-8">System Logs</h3>
            <div className="flex-1 overflow-auto pr-2 custom-scrollbar space-y-4">
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-50">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
                    <Activity size={24} className="text-white/50" />
                  </div>
                  <p className="text-xs font-bold tracking-widest uppercase text-white/50">No Data Synced</p>
                </div>
              ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                  {recentActivities.map((a, i) => (
                    <motion.div key={i} variants={itemVariants} className="group flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all">
                      <div className="p-3 rounded-xl flex-shrink-0 bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                      <Dumbbell size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white truncate">{a.type}</p>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mt-1">{a.durationMinutes} minutes</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-blue-400">{a.caloriesBurned}</p>
                      <p className="text-[9px] font-bold tracking-[0.2em] text-white/30">KCAL</p>
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