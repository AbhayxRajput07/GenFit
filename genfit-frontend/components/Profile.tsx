import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Star, Target, Zap, Heart, Flame, Medal, Crown,
  Droplets, Moon, CheckCircle2, X, Camera, TrendingUp,
  Activity, Award, Lock, Share2, Edit3, BarChart2
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
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color + '20'} strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
        transition={{ duration: 1.3, ease: 'easeOut' }}
      />
    </svg>
  );
}

export default function Profile({ user, stats, activities, theme }: ProfileProps) {
  const { t } = useLanguage();
  const [avatar, setAvatar] = useState(() => localStorage.getItem('userAvatar') || 'Cuddle');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { localStorage.setItem('userAvatar', avatar); }, [avatar]);

  const ACHIEVEMENTS = [
    { id: 1, title: t('profile.achievement_list.step.title'),    desc: t('profile.achievement_list.step.desc'),    emoji: '🥇', color: '#f59e0b', bg: '#fffbeb', unlocked: true  },
    { id: 2, title: t('profile.achievement_list.streak.title'),  desc: t('profile.achievement_list.streak.desc'),  emoji: '🔥', color: '#ef4444', bg: '#fef2f2', unlocked: true  },
    { id: 3, title: t('profile.achievement_list.hero.title'),    desc: t('profile.achievement_list.hero.desc'),    emoji: '💧', color: '#3b82f6', bg: '#eff6ff', unlocked: true  },
    { id: 4, title: t('profile.achievement_list.warrior.title'), desc: t('profile.achievement_list.warrior.desc'), emoji: '🏆', color: '#8b5cf6', bg: '#f5f3ff', unlocked: false },
    { id: 5, title: t('profile.achievement_list.champion.title'),desc: t('profile.achievement_list.champion.desc'),emoji: '🌙', color: '#6366f1', bg: '#eef2ff', unlocked: false },
    { id: 6, title: t('profile.achievement_list.star.title'),    desc: t('profile.achievement_list.star.desc'),    emoji: '🥗', color: '#10b981', bg: '#ecfdf5', unlocked: false },
  ];

  const accent = theme === 'pink' ? '#ec4899' : '#6366f1';
  const accent2 = theme === 'pink' ? '#f9a8d4' : '#a5b4fc';
  const accentLight = theme === 'pink' ? '#fdf2f8' : '#eef2ff';
  const bg = theme === 'pink'
    ? 'linear-gradient(150deg, #fff5fb 0%, #fce7f3 40%, #f8fafc 100%)'
    : 'linear-gradient(150deg, #f8faff 0%, #e0e7ff 40%, #f8fafc 100%)';

  const displayName = user?.displayName || t('profile.defaults.name');
  const email = user?.email || t('profile.defaults.bio');

  const weeklyBurn = activities.reduce((s, a) => s + a.caloriesBurned, 0);
  const totalMins = activities.reduce((s, a) => s + a.durationMinutes, 0);

  const statCards = [
    { label: t('common.workouts'),   val: activities.length, unit: t('common.sessions'), icon: Zap,      color: '#f59e0b', pct: Math.min(100, activities.length * 10) },
    { label: t('common.kcal_burned'),val: weeklyBurn,         unit: t('common.kcal'),     icon: Flame,    color: '#ef4444', pct: Math.min(100, (weeklyBurn / 500) * 100) },
    { label: t('common.steps'),      val: stats.steps,         unit: t('common.steps').toLowerCase(),    icon: TrendingUp,color:'#10b981', pct: Math.min(100, (stats.steps / 10000) * 100) },
    { label: t('common.sleep'),      val: stats.sleepHours,    unit: t('dashboard.stats.sleep').split(' ')[1]?.toLowerCase() === 'sleep' ? 'hrs' : (t('dashboard.stats.sleep').split(' ')[1] || 'hrs'),    icon: Moon,     color: '#8b5cf6', pct: Math.min(100, (stats.sleepHours / 8) * 100) },
  ];

  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;

  return (
    <div className="min-h-screen pb-20" style={{ background: bg }}>

      {/* ── Ambient Blobs ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-25"
          style={{ background: accent }} />
        <div className="absolute bottom-20 -left-32 w-80 h-80 rounded-full blur-[100px] opacity-15"
          style={{ background: accent2 }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-5 pt-10 space-y-8">

        {/* ── HERO BANNER ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[2.5rem] overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent2} 100%)` }}>

          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/10" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white/10"
              style={{ width: 120 + i * 80, height: 120 + i * 80, top: '50%', right: '-20px', transform: `translateY(-50%)` }} />
          ))}

          <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <button onClick={() => setShowModal(true)} className="group relative shrink-0 focus:outline-none">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-white p-1.5 shadow-2xl shadow-black/20 group-hover:scale-105 transition-transform duration-300">
                <img
                  src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${avatar}`}
                  className="w-full h-full object-cover rounded-2xl"
                  alt="Avatar"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-2xl shadow-lg border-2 border-white group-hover:scale-110 transition-transform"
                style={{ borderColor: accent }}>
                <Camera size={14} style={{ color: accent }} />
              </div>
            </button>

            {/* Name & Info */}
            <div className="text-white text-center md:text-left flex-1">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">{displayName}</h1>
                <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <Crown size={12} className="text-yellow-300" /> {t('common.pro')}
                </div>
              </div>
              <p className="text-white/70 font-medium mb-5">{email}</p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {[
                  { icon: Flame,  label: t('common.streak'), val: '🔥' },
                  { icon: Trophy, label: t('common.level'),       val: '🏆' },
                  { icon: Award,  label: `${unlockedCount} ${t('common.badges')}`, val: '⭐' },
                ].map(b => (
                  <div key={b.label} className="bg-white/15 backdrop-blur-sm border border-white/25 px-4 py-2 rounded-2xl flex items-center gap-2 text-sm font-bold">
                    <span>{b.val}</span> {b.label}
                  </div>
                ))}
              </div>
            </div>

            {/* XP / Progress */}
            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-3xl p-6 text-white text-center w-full md:w-auto min-w-[180px]">
              <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3">{t('common.xp_progress')}</p>
              <div className="text-4xl font-black mb-1">2,480</div>
              <p className="text-xs text-white/60 mb-4 font-medium">{t('common.level_status').replace('{total}', '3,000').replace('{next}', '6')}</p>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div className="h-full bg-white rounded-full"
                  initial={{ width: 0 }} animate={{ width: '82%' }} transition={{ duration: 1.2, ease: 'easeOut' }} />
              </div>
              <p className="text-xs text-white/60 mt-2">{t('common.percent_there').replace('{percent}', '82')}</p>
            </div>
          </div>
        </motion.div>

        {/* ── WEEKLY STATS ── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <BarChart2 size={20} style={{ color: accent }} /> {t('common.weekly_overview')}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
                className="bg-white/75 backdrop-blur-xl border border-white rounded-3xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col items-center gap-3">
                <div className="relative">
                  <Ring pct={s.pct} color={s.color} size={72} stroke={6} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <s.icon size={18} style={{ color: s.color }} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-slate-800">{s.val}</p>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.unit}</p>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── ACTIVITY + HEALTH QUICK STATS ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white/75 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-sm">
          <h2 className="text-base font-black text-slate-700 mb-5 flex items-center gap-2">
            <Activity size={18} style={{ color: accent }} /> {t('common.health_snapshot')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t('common.calories_in'),    val: `${stats.caloriesIn}`,   unit: t('common.kcal'),  color: '#f59e0b', icon: '🍽️' },
              { label: t('common.calories_out'),   val: `${stats.caloriesOut}`,  unit: t('common.kcal'),  color: '#ef4444', icon: '⚡' },
              { label: t('common.water_intake'),   val: `${(stats.waterMl / 1000).toFixed(1)}`, unit: 'L', color: '#3b82f6', icon: '💧' },
              { label: t('common.active_minutes'), val: `${totalMins}`,          unit: t('common.min'),   color: '#10b981', icon: '🏃' },
            ].map(item => (
              <div key={item.label} className="rounded-2xl p-4 border border-slate-100 bg-slate-50 hover:bg-white transition-all">
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-xl font-black text-slate-800">
                  {item.val} <span className="text-xs font-semibold text-slate-400">{item.unit}</span>
                </p>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">{item.label}</p>
                <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: '60%', background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── ACHIEVEMENTS ── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Crown size={20} className="text-yellow-500" /> {t('profile.achievements')}
              <span className="ml-2 text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                {unlockedCount}/{ACHIEVEMENTS.length} {t('common.unlocked')}
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACHIEVEMENTS.map((ach, i) => (
              <motion.div key={ach.id}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.06 }}
                className={`relative rounded-3xl p-5 border transition-all group ${ach.unlocked
                  ? 'bg-white/75 backdrop-blur-xl border-white hover:shadow-md hover:-translate-y-0.5'
                  : 'bg-slate-50/50 border-slate-100 opacity-60'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shrink-0"
                    style={{ background: ach.bg, border: `2px solid ${ach.color}20` }}>
                    {ach.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-slate-800 text-sm">{ach.title}</p>
                      {ach.unlocked
                        ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        : <Lock size={13} className="text-slate-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 leading-snug">{ach.desc}</p>
                  </div>
                </div>
                {ach.unlocked && (
                  <div className="absolute top-3 right-3 text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
                    style={{ background: ach.color + '15', color: ach.color }}>
                    {t('common.unlocked')}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── MOTIVATIONAL BANNER ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-3xl p-7 text-center border border-white bg-white/60 backdrop-blur-xl shadow-sm">
          <p className="text-4xl mb-3">💪</p>
          <h3 className="text-xl font-black text-slate-800 mb-2">{t('profile.motivation').replace('{name}', displayName.split(' ')[0])}</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">{t('profile.motivation_desc')}</p>
          <div className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})`, boxShadow: `0 8px 20px ${accent}30` }}>
            <Share2 size={16} /> {t('common.share_progress')}
          </div>
        </motion.div>

      </div>

      {/* ── AVATAR PICKER MODAL ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white/95 backdrop-blur-2xl rounded-[2rem] p-8 w-full max-w-xl border border-white shadow-2xl relative overflow-hidden">

              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl opacity-20" style={{ background: accent }} />

              <button onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 p-2 rounded-2xl bg-slate-100 hover:bg-red-50 transition-colors text-slate-400 hover:text-red-400">
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-2xl" style={{ background: accentLight }}>
                  <Camera size={20} style={{ color: accent }} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">{t('profile.avatar.title')}</h2>
                  <p className="text-xs text-slate-400">{t('profile.avatar.subtitle')}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {AVATAR_SEEDS.map(seed => {
                  const active = avatar === seed;
                  return (
                    <button key={seed} onClick={() => { setAvatar(seed); setTimeout(() => setShowModal(false), 250); }}
                      className={`relative aspect-square rounded-2xl p-2 transition-all duration-200 border-2 ${active
                        ? 'scale-105 shadow-lg'
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100 hover:scale-105'}`}
                      style={active ? { borderColor: accent, background: accentLight } : {}}>
                      <img src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${seed}`} alt={seed} className="w-full h-full" />
                      {active && (
                        <div className="absolute -top-1.5 -right-1.5 rounded-full p-0.5 bg-white shadow-md">
                          <CheckCircle2 size={14} style={{ color: accent }} />
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
