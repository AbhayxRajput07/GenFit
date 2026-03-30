import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Target, Zap, Heart, Flame, Medal, Crown,
  Droplets, Moon, CheckCircle2, X, Camera, TrendingUp,
  Activity, Award, Lock, Share2, BarChart2, Star, Copy, Download, MessageCircle, Instagram, Link2
} from 'lucide-react';
import { DailyStats, ActivityData, Theme } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { toPng } from 'html-to-image';

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

export default function Profile({ user, stats, activities, theme }: ProfileProps) {
  const { t } = useLanguage();
  const [avatar, setAvatar] = useState(() => localStorage.getItem('userAvatar') || 'Cuddle');
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const isPink = theme === 'pink';

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
  const hydrationGoalMl = 2000;
  const hydrationAchieved = stats.waterMl >= hydrationGoalMl;
  const hydrationLiters = (stats.waterMl / 1000).toFixed(1);

  const shareTitle = `GenFit Progress: ${displayName}`;
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://genfit.app';
  const shareDate = new Date().toLocaleDateString('en-GB');
  const firstName = displayName.split(' ')[0] || displayName;
  const greetingTitle = weeklyBurn >= 3000 ? 'Fitness Champion' : weeklyBurn >= 1800 ? 'Strong Momentum' : 'Progress in Motion';
  const greetingSubline = `Hey ${firstName}, ready to crush your goals!`;
  const shareCaption = [
    `Verified GenFit update from ${displayName}`,
    `${greetingTitle} - ${greetingSubline}`,
    `Workouts: ${activities.length}`,
    `Calories Burned: ${weeklyBurn} kcal`,
    `Steps: ${stats.steps}`,
    `Sleep: ${stats.sleepHours} hrs`,
    `Achievements: ${unlockedCount}/${ACHIEVEMENTS.length}`,
    `#GenFit #FitnessJourney #HealthTech`
  ].join('\n');
  const shortShareCaption = `${greetingTitle} | ${displayName} just hit a new GenFit milestone.`;

  useEffect(() => {
    if (!shareFeedback) return;
    const timer = window.setTimeout(() => setShareFeedback(''), 2500);
    return () => window.clearTimeout(timer);
  }, [shareFeedback]);

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(`${shareCaption}\n${shareUrl}`);
      setShareFeedback('Caption copied.');
    } catch {
      setShareFeedback('Could not copy caption.');
    }
  };

  const getShareCardPng = async (): Promise<string> => {
    if (!shareCardRef.current) throw new Error('Share card unavailable');
    return toPng(shareCardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: isPink ? '#f8edf3' : '#edf3ff'
    });
  };

  const downloadShareCard = async () => {
    setIsSharing(true);
    try {
      const pngData = await getShareCardPng();
      const link = document.createElement('a');
      link.download = `genfit-progress-${Date.now()}.png`;
      link.href = pngData;
      link.click();
      setShareFeedback('Share card downloaded.');
    } catch {
      setShareFeedback('Unable to generate share card.');
    } finally {
      setIsSharing(false);
    }
  };

  const getShareCardFile = async (): Promise<File> => {
    const pngData = await getShareCardPng();
    const blob = await (await fetch(pngData)).blob();
    return new File([blob], 'genfit-progress.png', { type: 'image/png' });
  };

  const shareNatively = async () => {
    setIsSharing(true);
    try {
      const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
      if (!nav.share) {
        await copyCaption();
        return;
      }

      const file = await getShareCardFile();

      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ title: shareTitle, text: shortShareCaption, files: [file] });
      } else {
        await nav.share({ title: shareTitle, text: `${shortShareCaption}\n${shareUrl}`, url: shareUrl });
      }
      setShareFeedback('Shared successfully.');
    } catch {
      setShareFeedback('Share cancelled or unavailable.');
    } finally {
      setIsSharing(false);
    }
  };

  const shareWhatsApp = async () => {
    setIsSharing(true);
    try {
      const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
      if (nav.share) {
        const file = await getShareCardFile();
        if (nav.canShare && nav.canShare({ files: [file] })) {
          await nav.share({
            title: 'Share to WhatsApp',
            text: 'Sharing my verified GenFit progress card',
            files: [file]
          });
          setShareFeedback('Select WhatsApp in share options.');
          return;
        }
      }

      await downloadShareCard();
      const text = encodeURIComponent(`Sharing my GenFit progress card.\n${shareUrl}`);
      window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
      setShareFeedback('Card downloaded. Attach it in WhatsApp.');
    } catch {
      setShareFeedback('Unable to share to WhatsApp right now.');
    } finally {
      setIsSharing(false);
    }
  };

  const prepareInstagramShare = async () => {
    await downloadShareCard();
    await copyCaption();
    setShareFeedback('Card downloaded + caption copied for Instagram.');
  };

  return (
    <div className={`w-full min-h-screen px-4 md:px-8 lg:px-12 py-8 md:py-12 overflow-x-hidden pb-20 ${isPink ? 'bg-[#f6edf2] text-[#1f2a44] selection:bg-pink-200/70' : 'bg-[#eef4ff] text-[#1f2a44] selection:bg-blue-200/70'}`}>

      {/* ── Ambient Glow ── */}
      <div className={`fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] blur-[150px] rounded-full pointer-events-none ${isPink ? 'bg-pink-300/25' : 'bg-blue-300/25'}`} />
      <div className={`fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] blur-[150px] rounded-full pointer-events-none ${isPink ? 'bg-rose-300/25' : 'bg-indigo-300/20'}`} />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col gap-8 md:gap-10">

        {/* ── HERO BANNER ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className={`relative rounded-[2.5rem] overflow-hidden border shadow-2xl ${isPink ? 'border-pink-300/30 bg-gradient-to-r from-[#ec4fa2] to-[#e88abb]' : 'border-[#b9cff7] bg-gradient-to-r from-[#5f90f4] to-[#86b2ff]'}`}>
          
          <div className={`absolute inset-0 pointer-events-none ${isPink ? 'bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-80' : 'bg-gradient-to-br from-indigo-500/20 via-blue-500/5 to-transparent opacity-50'}`} />

          {/* Decorative circles */}
          <div className={`absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl ${isPink ? 'bg-pink-200/30' : 'bg-blue-500/10'}`} />
          <div className={`absolute -bottom-12 -left-12 w-48 h-48 rounded-full blur-3xl ${isPink ? 'bg-rose-200/25' : 'bg-indigo-500/10'}`} />
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`absolute rounded-full border ${isPink ? 'border-white/20' : 'border-white/5'}`}
              style={{ width: 120 + i * 80, height: 120 + i * 80, top: '50%', right: '-20px', transform: `translateY(-50%)` }} />
          ))}

          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
            {/* Avatar */}
            <button onClick={() => setShowModal(true)} className="group relative shrink-0 focus:outline-none">
              <div className={`w-32 h-32 md:w-40 md:h-40 rounded-[2rem] p-2 group-hover:scale-105 transition-all duration-500 ${isPink ? 'bg-white/90 border border-white/70 shadow-[0_8px_26px_rgba(255,255,255,0.35)] group-hover:border-white' : 'bg-white/90 border border-white/70 shadow-[0_8px_26px_rgba(219,233,255,0.45)] group-hover:border-white'}`}>
                <img
                  src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${avatar}`}
                  className={`w-full h-full object-cover rounded-[1.5rem] ${isPink ? 'bg-white' : 'bg-white'}`}
                  alt="Avatar"
                />
              </div>
              <div className={`absolute -bottom-3 -right-3 p-3 rounded-2xl group-hover:scale-110 group-hover:rotate-12 transition-transform ${isPink ? 'bg-white text-pink-500 shadow-[0_8px_20px_rgba(0,0,0,0.18)] border border-pink-200/80' : 'bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-blue-400'}`}>
                <Camera size={18} className={isPink ? 'text-pink-500' : 'text-white'} />
              </div>
            </button>

            {/* Name & Info */}
            <div className="text-center md:text-left flex-1 min-w-0">
              <div className="flex items-center gap-4 justify-center md:justify-start mb-3">
                <h1 className={`text-4xl md:text-5xl font-medium tracking-tight truncate ${isPink ? 'text-white' : 'text-white'}`}>{displayName}</h1>
                <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0 ${isPink ? 'bg-white/20 border border-white/30 text-white shadow-none' : 'bg-gradient-to-r from-amber-400/20 to-yellow-500/10 border border-amber-400/30 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]'}`}>
                  <Crown size={14} className="text-amber-400" /> {t('common.pro')}
                </div>
              </div>
              <p className={`text-sm tracking-wide font-light mb-6 ${isPink ? 'text-white/80' : 'text-white/50'}`}>{email}</p>
              
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {[
                  { icon: Flame,  label: t('common.streak'), val: '🔥' },
                  { icon: Trophy, label: t('common.level'),       val: '🏆' },
                  { icon: Award,  label: `${unlockedCount} ${t('common.badges')}`, val: '⭐' },
                ].map(b => (
                  <div key={b.label} className={`px-5 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest transition-all cursor-default ${isPink ? 'bg-white/20 border border-white/30 text-white hover:bg-white/25' : 'bg-white/20 border border-white/35 text-white hover:bg-white/25'}`}>
                    <span className="text-lg drop-shadow-md">{b.val}</span> {b.label}
                  </div>
                ))}
              </div>
            </div>

            {/* XP / Progress */}
            <div className={`rounded-3xl p-8 w-full md:w-auto min-w-[240px] shadow-xl relative overflow-hidden group transition-colors ${isPink ? 'bg-white/15 border border-white/30 hover:bg-white/20' : 'bg-white/20 border border-white/35 hover:bg-white/25'}`}>
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl pointer-events-none ${isPink ? 'bg-white/20' : 'bg-white/30'}`} />
              <div className="relative z-10">
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${isPink ? 'text-white/80' : 'text-blue-400'}`}>{t('common.xp_progress')}</p>
                  <div className={`text-5xl font-medium tracking-tighter mb-2 ${isPink ? 'text-white' : 'text-white'}`}>2,480 <span className={`text-xl font-bold tracking-widest ml-1 ${isPink ? 'text-white/70' : 'text-white/70'}`}>XP</span></div>
                  <p className={`text-[11px] font-bold tracking-widest uppercase mb-5 ${isPink ? 'text-white/70' : 'text-white/75'}`}>{t('common.level_status').replace('{total}', '3,000').replace('{next}', '6')}</p>
                  <div className={`h-2 rounded-full overflow-hidden shadow-inner ${isPink ? 'bg-white/35' : 'bg-white/40'}`}>
                    <motion.div className={`h-full rounded-full ${isPink ? 'bg-white shadow-none' : 'bg-gradient-to-r from-blue-600 to-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]'}`}
                      initial={{ width: 0 }} animate={{ width: '82%' }} transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-3 text-right ${isPink ? 'text-white/75' : 'text-white/80'}`}>{t('common.percent_there').replace('{percent}', '82')}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── WEEKLY STATS ── */}
        <div>
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className={`text-xl font-medium tracking-tight flex items-center gap-3 ${isPink ? 'text-[#1f2a44]' : 'text-[#1f2a44]'}`}>
              <BarChart2 size={24} className={isPink ? 'text-pink-500' : 'text-blue-600'} /> {t('common.weekly_overview')}
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {statCards.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className={`border rounded-[2rem] p-6 shadow-xl transition-colors flex flex-col items-center gap-5 relative overflow-hidden group ${isPink ? 'bg-white border-[#ead5de] hover:border-[#e0bfce]' : 'bg-white border-[#d6e4ff] hover:border-[#b7cdf7]'}`}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity blur-2xl" style={{ backgroundColor: s.color }} />
                <div className="relative z-10 pt-2">
                  <Ring pct={s.pct} color={s.color} size={90} stroke={6} />
                  <div className="absolute inset-0 flex items-center justify-center pt-2">
                    <s.icon size={22} style={{ color: s.color }} />
                  </div>
                </div>
                <div className="text-center relative z-10 w-full">
                  <p className={`text-3xl font-medium tracking-tighter mb-1 ${isPink ? 'text-[#1f2a44]' : 'text-[#1f2a44]'}`}>{s.val}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isPink ? 'text-[#7f8ca3]' : 'text-[#6e83aa]'}`}>{s.unit}</p>
                  <div className={`h-[1px] w-8 mx-auto my-2 rounded-full ${isPink ? 'bg-[#e3ebf4]' : 'bg-[#d6e4ff]'}`} />
                  <p className={`text-[9px] font-bold uppercase tracking-[0.2em] ${isPink ? 'text-[#9aa7bd]' : 'text-[#8297bc]'}`}>{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── ACTIVITY + HEALTH QUICK STATS ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className={`border rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden ${isPink ? 'bg-[#f8f2f6] border-[#ead5de]' : 'bg-[#f4f8ff] border-[#d7e4ff]'}`}>
          <h2 className={`text-xl font-medium tracking-tight mb-8 flex items-center gap-3 ${isPink ? 'text-[#1f2a44]' : 'text-[#1f2a44]'}`}>
            <Activity size={24} className={isPink ? 'text-pink-500' : 'text-blue-600'} /> {t('common.health_snapshot')}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: t('common.calories_in'),    val: `${stats.caloriesIn}`,   unit: t('common.kcal'),  color: '#fbbf24', icon: '🍽️' },
              { label: t('common.calories_out'),   val: `${stats.caloriesOut}`,  unit: t('common.kcal'),  color: '#f87171', icon: '⚡' },
              { label: t('common.water_intake'),   val: `${(stats.waterMl / 1000).toFixed(1)}`, unit: 'L', color: '#38bdf8', icon: '💧' },
              { label: t('common.active_minutes'), val: `${totalMins}`,          unit: t('common.min'),   color: '#34d399', icon: '🏃' },
            ].map(item => (
              <div key={item.label} className={`rounded-[1.5rem] p-6 border transition-all group ${isPink ? 'border-[#ead5de] bg-white hover:bg-pink-50 hover:border-[#e0bfce]' : 'border-[#d6e4ff] bg-white hover:bg-[#f4f8ff] hover:border-[#b7cdf7]'}`}>
                <div className="text-3xl mb-4 drop-shadow-lg group-hover:scale-110 transition-transform origin-left">{item.icon}</div>
                <p className={`text-2xl font-medium tracking-tighter mb-1 ${isPink ? 'text-[#1f2a44]' : 'text-[#1f2a44]'}`}>
                  {item.val} <span className={`text-[10px] uppercase tracking-widest font-bold ml-1 ${isPink ? 'text-[#9aa7bd]' : 'text-[#8297bc]'}`}>{item.unit}</span>
                </p>
                <p className={`text-[9px] font-bold uppercase tracking-widest ${isPink ? 'text-[#8c98ae]' : 'text-[#6f86ad]'}`}>{item.label}</p>
                <div className={`mt-4 h-1 rounded-full overflow-hidden shadow-inner ${isPink ? 'bg-[#e5edf5]' : 'bg-[#dbe8ff]'}`}>
                  <div className="h-full rounded-full" style={{ width: '60%', background: item.color, boxShadow: `0 0 10px ${item.color}80` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── ACHIEVEMENTS ── */}
        <div>
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className={`text-xl font-medium tracking-tight flex items-center gap-3 ${isPink ? 'text-[#1f2a44]' : 'text-[#1f2a44]'}`}>
              <Crown size={24} className={isPink ? 'text-pink-500' : 'text-blue-600'} /> {t('profile.achievements')}
              <span className={`ml-3 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-xl ${isPink ? 'text-pink-600 bg-pink-100 border border-pink-200/70 shadow-none' : 'text-blue-700 bg-blue-100 border border-blue-200/80'}`}>
                {unlockedCount}/{ACHIEVEMENTS.length} {t('common.unlocked')}
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ACHIEVEMENTS.map((ach, i) => (
              <motion.div key={ach.id}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
                className={`relative rounded-[2rem] p-6 border transition-all group overflow-hidden ${isPink
                  ? ach.unlocked
                    ? 'bg-white border-pink-200/70 hover:border-pink-300/80 hover:bg-pink-50 shadow-[0_10px_24px_rgba(225,178,199,0.2)]'
                    : 'bg-pink-50 border-pink-100 opacity-80'
                  : ach.unlocked
                    ? 'bg-white border-[#d6e4ff] hover:border-[#b7cdf7] hover:bg-[#f6f9ff] shadow-[0_10px_24px_rgba(126,156,219,0.2)]'
                    : 'bg-[#eff5ff] border-[#d6e4ff] opacity-80'}`}>
                {ach.unlocked && <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500" style={{ backgroundColor: ach.color }} />}
                
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition-all shrink-0 shadow-inner"
                    style={ach.unlocked ? { background: ach.color + '15', border: `1px solid ${ach.color}30`, boxShadow: `inset 0 0 20px ${ach.color}10` } : { background: '#ffffff80', border: '1px solid #d6e4ff' }}>
                    {ach.emoji}
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className={`font-medium tracking-tight truncate ${isPink ? 'text-[#1f2a44]' : 'text-[#1f2a44]'}`}>{ach.title}</p>
                      {ach.unlocked
                        ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        : <Lock size={14} className={`shrink-0 ${isPink ? 'text-pink-300' : 'text-[#93a9cf]'}`} />}
                    </div>
                    <p className={`text-xs leading-relaxed font-light line-clamp-2 ${isPink ? 'text-[#7c8ca5]' : 'text-[#6f86ad]'}`}>{ach.desc}</p>
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
          className={`rounded-[2.5rem] p-10 text-center border backdrop-blur-2xl shadow-2xl relative overflow-hidden group ${isPink ? 'border-pink-200/60 bg-gradient-to-r from-[#ec4fa2] to-[#e88abb]' : 'border-[#b9cff7] bg-gradient-to-r from-[#5f90f4] to-[#86b2ff]'}`}>
          
          <div className={`absolute inset-0 pointer-events-none ${isPink ? 'bg-gradient-to-r from-white/10 via-transparent to-white/5 opacity-80' : 'bg-gradient-to-r from-blue-600/10 via-indigo-500/5 to-transparent opacity-50'}`} />
          
          <div className="relative z-10">
              <p className="text-5xl mb-6 drop-shadow-2xl opacity-90 group-hover:scale-110 transition-transform origin-bottom">💪</p>
              <h3 className="text-2xl font-medium tracking-tight text-white mb-3">{t('profile.motivation').replace('{name}', displayName.split(' ')[0])}</h3>
              <p className={`text-sm max-w-lg mx-auto font-light leading-relaxed mb-8 ${isPink ? 'text-white/85' : 'text-white/85'}`}>{t('profile.motivation_desc')}</p>
              <button
                onClick={() => setShowShareModal(true)}
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${isPink ? 'text-pink-600 bg-white shadow-[0_10px_24px_rgba(0,0,0,0.15)] border border-white' : 'text-blue-700 bg-white shadow-[0_10px_24px_rgba(0,0,0,0.12)] border border-white'}`}
              >
                <Share2 size={16} /> {t('common.share_progress')}
              </button>
          </div>
        </motion.div>

      </div>

      {/* ── SHARE PROGRESS MODAL ── */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 14 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 14 }}
              className={`rounded-[2.2rem] w-full max-w-3xl border p-8 md:p-10 relative overflow-hidden ${isPink ? 'bg-[#fff8fb] border-pink-200/80 shadow-[0_16px_36px_rgba(215,170,192,0.35)]' : 'bg-[#f5f9ff] border-[#d6e4ff] shadow-[0_16px_36px_rgba(125,154,220,0.25)]'}`}>

              <button
                onClick={() => setShowShareModal(false)}
                className={`absolute top-6 right-6 p-2.5 rounded-xl border transition-all ${isPink ? 'border-pink-200/80 text-[#8c98ae] hover:text-[#1f2a44] hover:bg-pink-50' : 'border-[#d6e4ff] text-[#6f86ad] hover:text-[#1f2a44] hover:bg-blue-50'}`}
                aria-label="Close share modal"
              >
                <X size={18} />
              </button>

              <div className="mb-6 pr-12">
                <h3 className={`text-2xl font-medium tracking-tight ${isPink ? 'text-[#1f2a44]' : 'text-[#1f2a44]'}`}>Share Progress</h3>
                <p className={`mt-2 text-sm ${isPink ? 'text-[#6f7e98]' : 'text-[#6f86ad]'}`}>
                  Share a polished progress snapshot with your friends on Instagram, WhatsApp, or any supported app.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div
                  ref={shareCardRef}
                  className={`rounded-[2rem] p-6 border relative overflow-hidden w-full max-w-[360px] aspect-[9/16] mx-auto ${isPink ? 'bg-[#f4ecef] border-[#e1d2d8] shadow-[0_18px_40px_rgba(194,163,176,0.25)]' : 'bg-[#edf3ff] border-[#d4e2ff] shadow-[0_18px_40px_rgba(125,154,220,0.25)]'}`}
                >
                  {isPink ? (
                    <div className="relative z-10 h-full flex flex-col items-center text-center px-1 justify-between">
                      <div className="w-full">
                        <p className="text-[#151827] text-[11px] font-medium mt-1">Celebrate your journey towards fitness success!</p>

                        <div className="mt-3 relative w-full max-w-[300px] mx-auto">
                          <div className="absolute -left-4 top-5 w-20 h-9 bg-[#e9c7d1] rotate-[-38deg] opacity-75" />

                          <div className="relative mx-auto w-full border-[12px] border-[#c190a2] rounded-[1.4rem] bg-[#f2d7df] p-2.5">
                            <div className="rounded-[0.9rem] border-[3px] border-[#bf8da0] min-h-[200px] bg-[#edccd6] flex flex-col items-center justify-center px-3 py-3">
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#bf8da0]/25 border border-[#bf8da0]/50 text-[#583848] text-[9px] font-bold tracking-[0.14em] uppercase">
                                <CheckCircle2 size={11} /> Verified User
                              </div>
                              <p className="mt-2 text-[#583848] text-[9px] font-black uppercase tracking-[0.18em]">Achievement Highlight</p>
                              <div className="mt-2 w-full rounded-xl bg-white/55 border border-[#d9afbf] px-3 py-2.5">
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-[#f7e7a8] to-[#f2cf67] border border-[#e4bd56] text-[#5f4300] text-[8px] font-black uppercase tracking-widest">
                                  <Medal size={10} /> Golden Badge
                                </div>
                                <div className="mt-2 flex items-center justify-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-[#bf8da0]/25 border border-[#bf8da0]/40 flex items-center justify-center">
                                    <Droplets size={14} className="text-[#7a5263]" />
                                  </div>
                                  <p className="text-[#1f2a44] text-[14px] font-bold">Drink 2L Water</p>
                                </div>
                                <p className="mt-1.5 text-[#6f5360] text-[10px] font-semibold">Today: {hydrationLiters}L / 2.0L</p>
                                <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-[#6f5360]">
                                  <CheckCircle2 size={11} className={hydrationAchieved ? 'text-emerald-600' : 'text-amber-600'} />
                                  <span>{hydrationAchieved ? 'You achieved your 2L hydration goal today.' : 'Hydration goal is in progress today.'}</span>
                                </div>
                                <div className="mt-1.5 h-2 rounded-full bg-[#d9b9c5] overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${hydrationAchieved ? 'bg-[#5ea2d7]' : 'bg-[#bf8da0]'}`}
                                    style={{ width: `${Math.min(100, (stats.waterMl / hydrationGoalMl) * 100)}%` }}
                                  />
                                </div>
                                <div className={`mt-1.5 inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${hydrationAchieved ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                                  {hydrationAchieved ? 'Achieved' : 'In Progress'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="w-full pb-1">
                        <h4 className="text-[#101018] text-[36px] leading-[1] font-medium [font-family:Georgia,'Times_New_Roman',serif]">
                          You're on your
                          <br />
                          way to greatness!
                        </h4>
                        <p className="mt-2 text-[#252736] text-[13px] font-medium">Keep pushing, you've got this!</p>

                        <div className="mt-4 bg-[#bf8da0] rounded-full px-8 py-3 min-w-[210px] inline-block">
                          <p className="text-[#111827] text-[14px] font-medium tracking-tight">
                            created by <span className="font-black">GenFit</span>
                          </p>
                        </div>

                        <p className="mt-2 text-[#7b6872] text-[9px] font-semibold">{shareDate} • {displayName}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 h-full flex flex-col items-center text-center px-1 justify-between">
                      <div className="w-full">
                        <p className="text-[#0f2345] text-[11px] font-medium mt-1">Celebrate your journey towards fitness success!</p>

                        <div className="mt-3 relative w-full max-w-[300px] mx-auto">
                          <div className="absolute -left-4 top-5 w-20 h-9 bg-[#d8e6ff] rotate-[-38deg] opacity-90" />

                          <div className="relative mx-auto w-full border-[12px] border-[#7fa8ff] rounded-[1.4rem] bg-[#dce9ff] p-2.5">
                            <div className="rounded-[0.9rem] border-[3px] border-[#7399ee] min-h-[200px] bg-[#e9f1ff] flex flex-col items-center justify-center px-3 py-3">
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#d9e6ff] border border-[#a7c0f5] text-[#244a8d] text-[9px] font-bold tracking-[0.14em] uppercase">
                                <CheckCircle2 size={11} /> Verified User
                              </div>
                              <p className="mt-2 text-[#244a8d] text-[9px] font-black uppercase tracking-[0.18em]">Achievement Highlight</p>
                              <div className="mt-2 w-full rounded-xl bg-white/80 border border-[#b9cff7] px-3 py-2.5">
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-[#f7e7a8] to-[#f2cf67] border border-[#e4bd56] text-[#5f4300] text-[8px] font-black uppercase tracking-widest">
                                  <Medal size={10} /> Golden Badge
                                </div>
                                <div className="mt-2 flex items-center justify-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-[#dbe8ff] border border-[#a9c0ef] flex items-center justify-center">
                                    <Droplets size={14} className="text-[#325fa8]" />
                                  </div>
                                  <p className="text-[#1f2a44] text-[14px] font-bold">Drink 2L Water</p>
                                </div>
                                <p className="mt-1.5 text-[#4a5f82] text-[10px] font-semibold">Today: {hydrationLiters}L / 2.0L</p>
                                <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-[#4a5f82]">
                                  <CheckCircle2 size={11} className={hydrationAchieved ? 'text-emerald-600' : 'text-amber-600'} />
                                  <span>{hydrationAchieved ? 'You achieved your 2L hydration goal today.' : 'Hydration goal is in progress today.'}</span>
                                </div>
                                <div className="mt-1.5 h-2 rounded-full bg-[#c9daf8] overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${hydrationAchieved ? 'bg-[#3a8bd6]' : 'bg-[#6f95dc]'}`}
                                    style={{ width: `${Math.min(100, (stats.waterMl / hydrationGoalMl) * 100)}%` }}
                                  />
                                </div>
                                <div className={`mt-1.5 inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${hydrationAchieved ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                                  {hydrationAchieved ? 'Achieved' : 'In Progress'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="w-full pb-1">
                        <h4 className="text-[#101a32] text-[36px] leading-[1] font-medium [font-family:Georgia,'Times_New_Roman',serif]">
                          You're on your
                          <br />
                          way to greatness!
                        </h4>
                        <p className="mt-2 text-[#243a63] text-[13px] font-medium">Keep pushing, you've got this!</p>

                        <div className="mt-4 bg-[#7f9fe0] rounded-full px-8 py-3 min-w-[210px] inline-block">
                          <p className="text-[#0f1b33] text-[14px] font-medium tracking-tight">
                            created by <span className="font-black">GenFit</span>
                          </p>
                        </div>

                        <p className="mt-2 text-[#61779f] text-[9px] font-semibold">{shareDate} • {displayName}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    onClick={shareNatively}
                    disabled={isSharing}
                    className={`w-full py-3.5 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${isPink ? 'border-pink-200/80 bg-pink-50 text-pink-600 hover:bg-pink-100' : 'border-[#d6e4ff] bg-white text-blue-700 hover:bg-blue-50'} ${isSharing ? 'opacity-60' : ''}`}
                  >
                    <Share2 size={16} /> Share Now
                  </button>
                  <button
                    onClick={shareWhatsApp}
                    disabled={isSharing}
                    className={`w-full py-3.5 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${isPink ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' : 'border-[#d6e4ff] bg-white text-blue-700 hover:bg-blue-50'} ${isSharing ? 'opacity-60' : ''}`}
                  >
                    <MessageCircle size={16} /> Share to WhatsApp
                  </button>
                  <button
                    onClick={prepareInstagramShare}
                    disabled={isSharing}
                    className={`w-full py-3.5 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${isPink ? 'border-pink-200/80 bg-white text-[#1f2a44] hover:bg-pink-50' : 'border-[#d6e4ff] bg-white text-blue-700 hover:bg-blue-50'} ${isSharing ? 'opacity-60' : ''}`}
                  >
                    <Instagram size={16} /> Prepare for Instagram
                  </button>
                  <button
                    onClick={copyCaption}
                    className={`w-full py-3.5 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${isPink ? 'border-pink-200/80 bg-white text-[#4f5f7c] hover:bg-pink-50' : 'border-[#d6e4ff] bg-white text-[#4f6b9a] hover:bg-blue-50'}`}
                  >
                    <Copy size={16} /> Copy Caption
                  </button>
                  <button
                    onClick={downloadShareCard}
                    disabled={isSharing}
                    className={`w-full py-3.5 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${isPink ? 'border-pink-200/80 bg-white text-[#4f5f7c] hover:bg-pink-50' : 'border-[#d6e4ff] bg-white text-[#4f6b9a] hover:bg-blue-50'} ${isSharing ? 'opacity-60' : ''}`}
                  >
                    <Download size={16} /> Download Card
                  </button>
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-3.5 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${isPink ? 'border-pink-200/80 bg-white text-[#4f5f7c] hover:bg-pink-50' : 'border-[#d6e4ff] bg-white text-[#4f6b9a] hover:bg-blue-50'}`}
                  >
                    <Link2 size={16} /> Open GenFit
                  </a>
                  {shareFeedback && (
                    <p className={`text-xs font-semibold px-3 py-2 rounded-lg ${isPink ? 'bg-pink-50 text-pink-600 border border-pink-200/80' : 'bg-blue-50 text-blue-700 border border-blue-200/80'}`}>
                      {shareFeedback}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AVATAR PICKER MODAL ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`rounded-[2.5rem] p-10 w-full max-w-2xl border relative overflow-hidden ${isPink ? 'bg-[#fff8fb] border-pink-200/80 shadow-[0_12px_32px_rgba(215,170,192,0.3)]' : 'bg-[#f5f9ff] border-[#d6e4ff] shadow-[0_12px_32px_rgba(125,154,220,0.25)]'}`}>

              <div className={`absolute top-[-50%] right-[-50%] w-[100%] h-[100%] rounded-full blur-[100px] opacity-10 pointer-events-none ${isPink ? 'bg-pink-400' : 'bg-blue-500'}`} />

              <button onClick={() => setShowModal(false)}
                className={`absolute top-6 right-6 p-3 rounded-xl border transition-all focus:outline-none ${isPink ? 'border-pink-200/80 text-[#8c98ae] hover:text-[#1f2a44] hover:bg-pink-50' : 'border-[#d6e4ff] text-[#6f86ad] hover:text-[#1f2a44] hover:bg-blue-50'}`}>
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-5 mb-8 relative z-10">
                <div className={`p-4 rounded-2xl ${isPink ? 'bg-pink-100 border border-pink-200/80 shadow-[0_8px_20px_rgba(236,72,153,0.15)]' : 'bg-blue-500/10 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]'}`}>
                  <Camera size={24} className={isPink ? 'text-pink-500' : 'text-blue-400'} />
                </div>
                <div>
                  <h2 className={`text-2xl font-medium tracking-tight ${isPink ? 'text-[#1f2a44]' : 'text-[#1f2a44]'}`}>{t('profile.avatar.title')}</h2>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isPink ? 'text-[#8c98ae]' : 'text-[#7b92bb]'}`}>{t('profile.avatar.subtitle')}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-4 gap-4 relative z-10">
                {AVATAR_SEEDS.map(seed => {
                  const active = avatar === seed;
                  return (
                    <button key={seed} onClick={() => { setAvatar(seed); setTimeout(() => setShowModal(false), 300); }}
                      className={`relative aspect-square rounded-[1.5rem] p-2.5 transition-all duration-300 border ${isPink ? 'bg-white' : 'bg-white'} ${active
                        ? (isPink ? 'border-pink-400/60 shadow-[0_0_30px_rgba(236,72,153,0.2)] scale-105 z-10' : 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.2)] scale-105 z-10')
                        : (isPink ? 'border-pink-200/70 hover:border-pink-300/80 hover:bg-pink-50 hover:scale-105' : 'border-[#d6e4ff] hover:border-[#b7cdf7] hover:bg-blue-50 hover:scale-105')}`}>
                      <img src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${seed}`} alt={seed} className="w-full h-full object-cover filter saturate-150 drop-shadow-md" />
                      {active && (
                        <div className={`absolute -top-2 -right-2 rounded-xl p-1.5 ${isPink ? 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)] border border-pink-300' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] border border-blue-300'}`}>
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
