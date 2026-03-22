import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Target, Zap, Heart, Flame, Medal, Crown,
  Droplets, Moon, CheckCircle2, X, Camera, TrendingUp,
  Activity, Award, Lock, Share2, BarChart2, Star
} from 'lucide-react';
import { DailyStats, ActivityData, Theme } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ProfileProps {
  user: any;
  stats: DailyStats;
  activities: ActivityData[];
  theme: Theme;
}

const AVATAR_SEEDS = ['Cuddle', 'Snuggles', 'Angel', 'Cookie', 'Sasha', 'Mittens', 'Leo', 'Max', 'Bella', 'Charlie', 'Luna', 'Milo'];

// ── Minimal SVG Ring ──────────────────────────────────
function Ring({ pct, color, size = 80, stroke = 7 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, pct)) / 100) * circ;
  return (
    <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 blur-xl opacity-20 rounded-full" style={{ backgroundColor: color, transform: 'scale(0.8)' }} />
        <svg width={size} height={size} className="-rotate-90 relative z-10" style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
            strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - filled }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
    </div>
  );
}

export default function Profile({ user, stats, activities }: ProfileProps) {
  const { t } = useLanguage();
  const [avatar, setAvatar] = useState(() => localStorage.getItem('userAvatar') || 'Cuddle');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { localStorage.setItem('userAvatar', avatar); }, [avatar]);

  const ACHIEVEMENTS = [
    { id: 1, title: t('profile.achievement_list.step.title'),    desc: t('profile.achievement_list.step.desc'),    emoji: '🥇', color: '#fbbf24', unlocked: true  },
    { id: 2, title: t('profile.achievement_list.streak.title'),  desc: t('profile.achievement_list.streak.desc'),  emoji: '🔥', color: '#f87171', unlocked: true  },
    { id: 3, title: t('profile.achievement_list.hero.title'),    desc: t('profile.achievement_list.hero.desc'),    emoji: '💧', color: '#38bdf8', unlocked: true  },
    { id: 4, title: t('profile.achievement_list.warrior.title'), desc: t('profile.achievement_list.warrior.desc'), emoji: '🏆', color: '#a78bfa', unlocked: false },
    { id: 5, title: t('profile.achievement_list.champion.title'),desc: t('profile.achievement_list.champion.desc'),emoji: '🌙', color: '#818cf8', unlocked: false },
    { id: 6, title: t('profile.achievement_list.star.title'),    desc: t('profile.achievement_list.star.desc'),    emoji: '🥗', color: '#34d399', unlocked: false },
  ];

  const displayName = user?.displayName || t('profile.defaults.name');
  const email = user?.email || t('profile.defaults.bio');

  const weeklyBurn = activities.reduce((s, a) => s + a.caloriesBurned, 0);
  const totalMins = activities.reduce((s, a) => s + a.durationMinutes, 0);

  const statCards = [
    { label: t('common.workouts'),   val: activities.length, unit: t('common.sessions'), icon: Zap,      color: '#fbbf24', pct: Math.min(100, activities.length * 10) },
    { label: t('common.kcal_burned'),val: weeklyBurn,         unit: t('common.kcal'),     icon: Flame,    color: '#f87171', pct: Math.min(100, (weeklyBurn / 500) * 100) },
    { label: t('common.steps'),      val: stats.steps,         unit: t('common.steps').toLowerCase(),    icon: TrendingUp,color:'#34d399', pct: Math.min(100, (stats.steps / 10000) * 100) },
    { label: t('common.sleep'),      val: stats.sleepHours,    unit: t('dashboard.stats.sleep').split(' ')[1]?.toLowerCase() === 'sleep' ? 'hrs' : (t('dashboard.stats.sleep').split(' ')[1] || 'hrs'),    icon: Moon,     color: '#a78bfa', pct: Math.min(100, (stats.sleepHours / 8) * 100) },
  ];

  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;

  return (
    <div className="w-full min-h-screen bg-[#010101] text-white px-4 md:px-8 lg:px-12 py-8 md:py-12 overflow-x-hidden selection:bg-blue-500/30 pb-20">

      {/* ── Ambient Glow ── */}
      <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col gap-8 md:gap-10">

        {/* ── HERO BANNER ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#030303] shadow-2xl">
          
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-blue-500/5 to-transparent opacity-50 pointer-events-none" />

          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white/5"
              style={{ width: 120 + i * 80, height: 120 + i * 80, top: '50%', right: '-20px', transform: `translateY(-50%)` }} />
          ))}

          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
            {/* Avatar */}
            <button onClick={() => setShowModal(true)} className="group relative shrink-0 focus:outline-none">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] bg-[#050505] border border-white/10 p-2 shadow-[0_0_30px_rgba(59,130,246,0.2)] group-hover:scale-105 group-hover:border-blue-500/50 transition-all duration-500">
                <img
                  src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${avatar}`}
                  className="w-full h-full object-cover rounded-[1.5rem] bg-white/5"
                  alt="Avatar"
                />
              </div>
              <div className="absolute -bottom-3 -right-3 bg-blue-600 p-3 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-blue-400 group-hover:scale-110 group-hover:rotate-12 transition-transform">
                <Camera size={18} className="text-white" />
              </div>
            </button>

            {/* Name & Info */}
            <div className="text-center md:text-left flex-1 min-w-0">
              <div className="flex items-center gap-4 justify-center md:justify-start mb-3">
                <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white truncate">{displayName}</h1>
                <div className="bg-gradient-to-r from-amber-400/20 to-yellow-500/10 border border-amber-400/30 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5 shadow-[0_0_15px_rgba(251,191,36,0.15)] shrink-0">
                  <Crown size={14} className="text-amber-400" /> {t('common.pro')}
                </div>
              </div>
              <p className="text-white/50 text-sm tracking-wide font-light mb-6">{email}</p>
              
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {[
                  { icon: Flame,  label: t('common.streak'), val: '🔥' },
                  { icon: Trophy, label: t('common.level'),       val: '🏆' },
                  { icon: Award,  label: `${unlockedCount} ${t('common.badges')}`, val: '⭐' },
                ].map(b => (
                  <div key={b.label} className="bg-[#050505] border border-white/10 px-5 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white hover:border-white/20 transition-all cursor-default">
                    <span className="text-lg drop-shadow-md">{b.val}</span> {b.label}
                  </div>
                ))}
              </div>
            </div>

            {/* XP / Progress */}
            <div className="bg-[#050505] border border-white/5 rounded-3xl p-8 w-full md:w-auto min-w-[240px] shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl pointer-events-none" />
              <div className="relative z-10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-4">{t('common.xp_progress')}</p>
                  <div className="text-5xl font-medium tracking-tighter text-white mb-2">2,480 <span className="text-xl font-bold tracking-widest text-white/20 ml-1">XP</span></div>
                  <p className="text-[11px] font-bold tracking-widest uppercase text-white/40 mb-5">{t('common.level_status').replace('{total}', '3,000').replace('{next}', '6')}</p>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden shadow-inner">
                    <motion.div className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                      initial={{ width: 0 }} animate={{ width: '82%' }} transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-3 text-right">{t('common.percent_there').replace('{percent}', '82')}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── WEEKLY STATS ── */}
        <div>
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-xl font-medium tracking-tight text-white flex items-center gap-3">
              <BarChart2 size={24} className="text-indigo-400" /> {t('common.weekly_overview')}
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {statCards.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-[#030303] border border-white/5 rounded-[2rem] p-6 shadow-xl hover:border-white/10 transition-colors flex flex-col items-center gap-5 relative overflow-hidden group">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity blur-2xl" style={{ backgroundColor: s.color }} />
                <div className="relative z-10 pt-2">
                  <Ring pct={s.pct} color={s.color} size={90} stroke={6} />
                  <div className="absolute inset-0 flex items-center justify-center pt-2">
                    <s.icon size={22} style={{ color: s.color }} />
                  </div>
                </div>
                <div className="text-center relative z-10 w-full">
                  <p className="text-3xl font-medium tracking-tighter text-white mb-1">{s.val}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-white/50">{s.unit}</p>
                  <div className="h-[1px] w-8 bg-white/10 mx-auto my-2 rounded-full" />
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── ACTIVITY + HEALTH QUICK STATS ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-[#030303] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <h2 className="text-xl font-medium tracking-tight text-white mb-8 flex items-center gap-3">
            <Activity size={24} className="text-sky-400" /> {t('common.health_snapshot')}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: t('common.calories_in'),    val: `${stats.caloriesIn}`,   unit: t('common.kcal'),  color: '#fbbf24', icon: '🍽️' },
              { label: t('common.calories_out'),   val: `${stats.caloriesOut}`,  unit: t('common.kcal'),  color: '#f87171', icon: '⚡' },
              { label: t('common.water_intake'),   val: `${(stats.waterMl / 1000).toFixed(1)}`, unit: 'L', color: '#38bdf8', icon: '💧' },
              { label: t('common.active_minutes'), val: `${totalMins}`,          unit: t('common.min'),   color: '#34d399', icon: '🏃' },
            ].map(item => (
              <div key={item.label} className="rounded-[1.5rem] p-6 border border-white/5 bg-[#050505] hover:bg-white/[0.02] hover:border-white/10 transition-all group">
                <div className="text-3xl mb-4 drop-shadow-lg group-hover:scale-110 transition-transform origin-left">{item.icon}</div>
                <p className="text-2xl font-medium tracking-tighter text-white mb-1">
                  {item.val} <span className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">{item.unit}</span>
                </p>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{item.label}</p>
                <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full rounded-full" style={{ width: '60%', background: item.color, boxShadow: `0 0 10px ${item.color}80` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── ACHIEVEMENTS ── */}
        <div>
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-xl font-medium tracking-tight text-white flex items-center gap-3">
              <Crown size={24} className="text-amber-400" /> {t('profile.achievements')}
              <span className="ml-3 text-[10px] font-bold tracking-widest uppercase text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.1)]">
                {unlockedCount}/{ACHIEVEMENTS.length} {t('common.unlocked')}
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ACHIEVEMENTS.map((ach, i) => (
              <motion.div key={ach.id}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
                className={`relative rounded-[2rem] p-6 border transition-all group overflow-hidden ${ach.unlocked
                  ? 'bg-[#030303] border-white/10 hover:border-white/20 hover:bg-[#050505] shadow-xl'
                  : 'bg-[#020202] border-white/5 opacity-50 grayscale'}`}>
                {ach.unlocked && <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500" style={{ backgroundColor: ach.color }} />}
                
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition-all shrink-0 shadow-inner"
                    style={ach.unlocked ? { background: ach.color + '15', border: `1px solid ${ach.color}30`, boxShadow: `inset 0 0 20px ${ach.color}10` } : { background: '#ffffff05', border: '1px solid #ffffff10' }}>
                    {ach.emoji}
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="font-medium tracking-tight text-white truncate">{ach.title}</p>
                      {ach.unlocked
                        ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        : <Lock size={14} className="text-white/30 shrink-0" />}
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed font-light line-clamp-2">{ach.desc}</p>
                  </div>
                </div>
                {ach.unlocked && (
                  <div className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border"
                    style={{ background: ach.color + '10', color: ach.color, borderColor: ach.color + '20' }}>
                    {t('common.unlocked')}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── MOTIVATIONAL BANNER ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-[2.5rem] p-10 text-center border border-white/5 bg-[#030303]/80 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
          
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-500/5 to-transparent opacity-50 pointer-events-none" />
          
          <div className="relative z-10">
              <p className="text-5xl mb-6 drop-shadow-2xl opacity-90 group-hover:scale-110 transition-transform origin-bottom">💪</p>
              <h3 className="text-2xl font-medium tracking-tight text-white mb-3">{t('profile.motivation').replace('{name}', displayName.split(' ')[0])}</h3>
              <p className="text-sm text-white/50 max-w-lg mx-auto font-light leading-relaxed mb-8">{t('profile.motivation_desc')}</p>
              <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-[11px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer bg-gradient-to-r from-blue-600 to-sky-500 shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-blue-400/50">
                <Share2 size={16} /> {t('common.share_progress')}
              </div>
          </div>
        </motion.div>

      </div>

      {/* ── AVATAR PICKER MODAL ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#050505] rounded-[2.5rem] p-10 w-full max-w-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">

              <div className="absolute top-[-50%] right-[-50%] w-[100%] h-[100%] rounded-full blur-[100px] opacity-10 bg-blue-500 pointer-events-none" />

              <button onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 p-3 rounded-xl border border-white/5 text-white/40 hover:text-white hover:bg-white/5 transition-all focus:outline-none">
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-5 mb-8 relative z-10">
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                  <Camera size={24} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-medium tracking-tight text-white">{t('profile.avatar.title')}</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">{t('profile.avatar.subtitle')}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-4 gap-4 relative z-10">
                {AVATAR_SEEDS.map(seed => {
                  const active = avatar === seed;
                  return (
                    <button key={seed} onClick={() => { setAvatar(seed); setTimeout(() => setShowModal(false), 300); }}
                      className={`relative aspect-square rounded-[1.5rem] p-2.5 transition-all duration-300 border bg-[#030303] ${active
                        ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.2)] scale-105 z-10'
                        : 'border-white/5 hover:border-white/20 hover:bg-white/5 hover:scale-105'}`}>
                      <img src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${seed}`} alt={seed} className="w-full h-full object-cover filter saturate-150 drop-shadow-md" />
                      {active && (
                        <div className="absolute -top-2 -right-2 rounded-xl p-1.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] border border-blue-300">
                          <CheckCircle2 size={16} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
