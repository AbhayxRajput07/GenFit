import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ActivityData, NutritionData, DailyStats, Theme,
  BodyProfile, ActivityLevel
} from '../types';
import {
  Zap, ShieldCheck, Brain, Droplets,
  Flame, Target, Scale, Ruler, User, Heart,
  TrendingUp, Award, AlertCircle, CheckCircle, Activity, ChevronRight, ChevronLeft, RefreshCcw, Dumbbell, Utensils
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface BodyBlueprintProps {
  activities: ActivityData[];
  nutrition: NutritionData[];
  stats: DailyStats;
  theme: Theme;
  bodyProfile: BodyProfile | null;
  setBodyProfile: (p: BodyProfile | null) => void;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};

function calcTelemetry(p: BodyProfile, activities: ActivityData[], nutrition: NutritionData[]) {
  const h = p.height / 100;
  const bmi = p.weight / (h * h);
  let bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age;
  bmr = p.gender === 'male' ? bmr + 5 : bmr - 161;
  const tdee = bmr * ACTIVITY_MULTIPLIERS[p.activityLevel];
  const totalMins = activities.reduce((s, a) => s + a.durationMinutes, 0);
  const totalCarbs = nutrition.reduce((s, n) => s + n.carbs, 0);
  const totalCals = nutrition.reduce((s, n) => s + n.calories, 0);
  const neuralLoad = Math.min(100, (totalMins / 120) * 100);
  const hydration = Math.max(20, 100 - totalMins / 15 - (totalCals / 1000) * 5);
  const glycemic = Math.min(100, (totalCarbs / 250) * 100);
  const fatPct = bmi * 1.2 + 0.23 * p.age - (p.gender === 'male' ? 16.2 : 5.4);
  const idealMin = 20 * h * h;
  const idealMax = 25 * h * h;
  const bmiStatus =
    bmi < 18.5 ? { label: 'activity.blueprint.underweight', color: '#38bdf8' } :
    bmi < 25   ? { label: 'activity.blueprint.healthy',     color: '#34d399' } :
    bmi < 30   ? { label: 'activity.blueprint.overweight',  color: '#fbbf24' } :
                 { label: 'activity.blueprint.obese',       color: '#f87171' };
  return { bmi, bmr, tdee, neuralLoad, hydration, glycemic, fatPct, idealMin, idealMax, bmiStatus };
}

function MetricRing({ value, max = 100, color, size = 96 }: { value: number; max?: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(max, value)) / max) * circ;
  return (
    <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 blur-xl opacity-30 rounded-full" style={{ backgroundColor: color, transform: 'scale(0.8)' }} />
        <svg width={size} height={size} className="rotate-[-90deg] relative z-10" style={{ filter: `drop-shadow(0 0 10px ${color}80)` }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
          <motion.circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={8} strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - filled }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
    </div>
  );
}

function StatPill({ icon: Icon, label, value, color, isPink = false }: { icon: React.ElementType; label: string; value: string; color: string; isPink?: boolean }) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl px-5 py-4 border ${isPink ? 'bg-white border-[#e8d4dd]' : 'bg-[#030303] border-blue-300/10'}`}>
      <div className="p-2.5 rounded-xl border" style={{ background: color + '15', borderColor: color + '30' }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${isPink ? 'text-[#9aa7bd]' : 'text-white/40'}`}>{label}</p>
        <p className={`text-sm font-black ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
}

function Onboarding({ onSave, theme }: { onSave: (p: BodyProfile) => void; theme: Theme }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Partial<BodyProfile>>({ gender: 'male', age: 25, height: 175, weight: 70, activityLevel: 'moderate' });
  const { t } = useLanguage();
  const steps = [ t('activity.blueprint.onboarding.identity'), t('activity.blueprint.onboarding.biometrics'), t('activity.blueprint.onboarding.lifestyle') ];
  const isPink = theme === 'pink';

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 overflow-hidden relative ${isPink ? 'bg-[#f6edf2] text-[#1f2a44]' : 'bg-[#06142d] text-white selection:bg-blue-500/30'}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] blur-[150px] rounded-full ${isPink ? 'bg-pink-300/20' : 'bg-blue-600/15'}`} />
        <div className={`absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] blur-[150px] rounded-full ${isPink ? 'bg-rose-300/20' : 'bg-indigo-600/15'}`} />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className={`relative w-full max-w-lg backdrop-blur-2xl rounded-[2.5rem] border p-10 ${isPink ? 'bg-[#fbf7f9]/95 border-[#e9d6df] shadow-[0_16px_36px_rgba(215,170,192,0.25)]' : 'bg-[#030303] border-blue-300/10 shadow-2xl'}`}>

        <div className="flex items-center gap-5 mb-10">
          <div className={`p-4 rounded-2xl ${isPink ? 'bg-pink-100 border border-pink-200/80 shadow-[0_8px_20px_rgba(236,72,153,0.15)]' : 'bg-blue-500/10 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]'}`}>
            <Target size={28} className={isPink ? 'text-pink-500' : 'text-blue-400'} />
          </div>
          <div>
            <h1 className={`text-3xl font-medium tracking-tight ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>{t('activity.blueprint.title')}</h1>
            <p className={`text-[10px] font-bold tracking-widest uppercase mt-1 ${isPink ? 'text-[#9aa7bd]' : 'text-white/40'}`}>Phase {step + 1} / {steps.length} — {steps[step]}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-10">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 relative overflow-hidden ${isPink ? 'bg-pink-100' : 'bg-white/10'}`}>
              {i <= step && <motion.div layoutId="step" className={`absolute inset-0 rounded-full ${isPink ? 'bg-pink-500 shadow-[0_0_10px_#ec4899]' : 'bg-blue-500 shadow-[0_0_10px_#3b82f6]'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <h2 className={`text-xl font-medium ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>{t('activity.blueprint.onboarding.who')}</h2>
              <div className="grid grid-cols-2 gap-4">
                {(['male', 'female'] as const).map(g => (
                  <button key={g} onClick={() => setForm({ ...form, gender: g })}
                    className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-4 ${form.gender === g
                      ? isPink
                        ? 'border-pink-300/70 bg-pink-100 shadow-[0_0_20px_rgba(236,72,153,0.15)] scale-[1.02]'
                        : 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.1)] scale-[1.02]'
                      : isPink
                        ? 'border-[#ead5de] bg-white hover:border-pink-200 hover:bg-pink-50'
                        : 'border-blue-300/10 bg-[#030303] hover:border-blue-400/30 hover:bg-[#0b0b0b]'}`}>
                    <span className="text-4xl">{g === 'male' ? '🧑' : '👩'}</span>
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${form.gender === g ? (isPink ? 'text-pink-500' : 'text-blue-300') : (isPink ? 'text-[#8190a7]' : 'text-white/50')}`}>{g}</span>
                  </button>
                ))}
              </div>
              <div className={`space-y-4 p-6 rounded-3xl border ${isPink ? 'bg-white border-[#ead5de]' : 'bg-[#030303] border-blue-300/10'}`}>
                <div className="flex justify-between items-end">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${isPink ? 'text-[#9aa7bd]' : 'text-white/40'}`}>Chronological Age</label>
                  <span className={`text-xl font-bold ${isPink ? 'text-pink-500' : 'text-blue-300'}`}>{form.age} <span className={`text-xs tracking-widest ${isPink ? 'text-[#9aa7bd]' : 'text-white/40'}`}>YRS</span></span>
                </div>
                <input type="range" min={15} max={90} value={form.age} onChange={e => setForm({ ...form, age: +e.target.value })} className="w-full h-2 rounded-full cursor-pointer appearance-none bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_#60a5fa]" />
              </div>
              <button onClick={() => setStep(1)} className={`w-full py-5 rounded-[1.5rem] font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4 ${isPink ? 'text-white bg-gradient-to-r from-pink-500 to-rose-500 shadow-[0_0_30px_rgba(236,72,153,0.3)] border border-pink-300/60' : 'text-white bg-gradient-to-r from-blue-600 to-sky-500 shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-blue-400/50'}`}>
                Initialize <ChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <h2 className={`text-xl font-medium ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>Biometric Calibration</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Height', key: 'height', unit: 'cm', min: 120, max: 230, icon: Ruler },
                  { label: 'Weight', key: 'weight', unit: 'kg', min: 30, max: 250, icon: Scale },
                ].map(({ label, key, unit, min, max, icon: Ic }) => (
                  <div key={key} className={`rounded-3xl p-6 border ${isPink ? 'bg-white border-[#ead5de]' : 'bg-[#030303] border-blue-300/10'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg border ${isPink ? 'bg-pink-50 border-pink-100' : 'bg-blue-500/10 border-blue-500/30'}`}><Ic size={16} className={isPink ? 'text-[#8190a7]' : 'text-blue-300'} /></div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isPink ? 'text-[#9aa7bd]' : 'text-white/40'}`}>{label}</span>
                    </div>
                    <div className="mb-4">
                        <span className={`text-3xl font-black ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>{(form as any)[key]}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ml-2 ${isPink ? 'text-[#9aa7bd]' : 'text-white/40'}`}>{unit}</span>
                    </div>
                    <input type="range" min={min} max={max} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: +e.target.value })} className="w-full h-1.5 rounded-full cursor-pointer appearance-none bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:rounded-full" />
                  </div>
                ))}
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setStep(0)} className={`w-16 py-5 rounded-[1.5rem] border flex items-center justify-center transition-all ${isPink ? 'border-[#ead5de] bg-white text-[#90a0b6] hover:bg-pink-50 hover:text-[#1f2a44]' : 'border-blue-300/10 bg-[#030303] text-white/60 hover:bg-[#0b0b0b] hover:text-white'}`}>
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => setStep(2)} className={`flex-1 py-5 rounded-[1.5rem] font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all ${isPink ? 'text-white bg-gradient-to-r from-pink-500 to-rose-500 shadow-[0_0_30px_rgba(236,72,153,0.3)] border border-pink-300/60' : 'text-white bg-gradient-to-r from-blue-600 to-sky-500 shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-blue-400/50'}`}>
                  Calibrate <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className={`text-xl font-medium mb-6 ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>Activity Level Matrix</h2>
              {([ 
                ['sedentary',  '🪑', 'Sedentary',    'Little or no exercise'],
                ['light',      '🚶', 'Lightly Active','1–3 days/week'],
                ['moderate',   '🏃', 'Moderately Active','3–5 days/week'],
                ['active',     '⚡', 'Very Active',   '6–7 days/week'],
                ['very_active','🔥', 'Extra Active',  'Athlete / physical job'],
              ] as const).map(([val, emoji, label, desc]) => (
                <button key={val} onClick={() => setForm({ ...form, activityLevel: val as ActivityLevel })}
                  className={`w-full px-6 py-4 rounded-[1.5rem] border transition-all flex items-center gap-5 ${form.activityLevel === val
                    ? isPink
                      ? 'border-pink-300/70 bg-pink-100 shadow-[0_0_20px_rgba(236,72,153,0.15)] scale-[1.02]'
                      : 'border-sky-500/50 bg-sky-500/10 shadow-[0_0_20px_rgba(14,165,233,0.15)] scale-[1.02]'
                    : isPink
                      ? 'border-[#ead5de] bg-white hover:border-pink-200 hover:bg-pink-50 text-left'
                      : 'border-blue-300/10 bg-[#030303] hover:border-blue-400/30 hover:bg-[#0b0b0b] text-left'}`}>
                  <span className="text-2xl drop-shadow-lg">{emoji}</span>
                  <div className="text-left flex-1 min-w-0 pt-0.5">
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${form.activityLevel === val ? (isPink ? 'text-pink-500' : 'text-sky-300') : (isPink ? 'text-[#1f2a44]' : 'text-white')}`}>{label}</p>
                    <p className={`text-[10px] font-bold tracking-widest uppercase truncate ${isPink ? 'text-[#9aa7bd]' : 'text-white/40'}`}>{desc}</p>
                  </div>
                  {form.activityLevel === val && <CheckCircle size={18} className={`shrink-0 ${isPink ? 'text-pink-500' : 'text-sky-400'}`} />}
                </button>
              ))}
              <div className="flex gap-4 pt-6">
                <button onClick={() => setStep(1)} className={`w-16 py-5 rounded-[1.5rem] border flex items-center justify-center transition-all ${isPink ? 'border-[#ead5de] bg-white text-[#90a0b6] hover:bg-pink-50 hover:text-[#1f2a44]' : 'border-blue-300/10 bg-[#030303] text-white/60 hover:bg-[#0b0b0b] hover:text-white'}`}>
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => onSave(form as BodyProfile)} className={`flex-1 py-5 rounded-[1.5rem] font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all ${isPink ? 'text-white bg-gradient-to-r from-pink-500 to-rose-500 shadow-[0_0_30px_rgba(236,72,153,0.3)] border border-pink-300/60' : 'text-white bg-gradient-to-r from-blue-600 to-sky-500 shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-blue-400/50'}`}>
                  <Zap size={16} /> Generate Blueprint
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Main HUD ─────────────────────────────────────────
export default function BodyBlueprint({ activities, nutrition, stats, theme, bodyProfile, setBodyProfile }: BodyBlueprintProps) {
  const { t } = useLanguage();
  const isPink = theme === 'pink';
  if (!bodyProfile) return <Onboarding onSave={setBodyProfile} theme={theme} />;

  const telemetry = calcTelemetry(bodyProfile, activities, nutrition);

  const metrics = [
    { label: 'BMI',          val: telemetry.bmi.toFixed(1),             sub: t(telemetry.bmiStatus.label), color: telemetry.bmiStatus.color, icon: Scale },
    { label: 'BMR',          val: `${telemetry.bmr.toFixed(0)} kcal`,   sub: t('dashboard.stats.calories'),  color: '#fbbf24',          icon: Flame },
    { label: t('activity.stats.intensity'), val: `${telemetry.tdee.toFixed(0)} kcal`,  sub: t('activity.blueprint.subtitle'),color: '#38bdf8',            icon: Zap },
    { label: t('activity.blueprint.hydration'), val: `${telemetry.fatPct.toFixed(1)}%`,    sub: t('common.health_snapshot'),         color: '#34d399',          icon: User },
  ];

  const rings = [
    { label: t('activity.blueprint.neural_load'),  val: telemetry.neuralLoad,  color: '#a78bfa', icon: Brain },
    { label: t('activity.blueprint.hydration'),    val: telemetry.hydration,   color: '#38bdf8', icon: Droplets },
    { label: t('activity.blueprint.glycemic'),     val: telemetry.glycemic,    color: '#fbbf24', icon: TrendingUp },
  ];

  const corrections: { text: string; type: 'warn' | 'ok' }[] = [];
  if (telemetry.bmi > 25) corrections.push({ type: 'warn', text: `Aim for ${(telemetry.tdee - 400).toFixed(0)} kcal/day to lose weight safely.` });
  if (telemetry.bmi < 18.5) corrections.push({ type: 'warn', text: 'Increase caloric intake to build healthy mass.' });
  if (telemetry.neuralLoad > 65) corrections.push({ type: 'warn', text: 'High activity load — schedule 1 rest day this week.' });
  if (telemetry.hydration < 60) corrections.push({ type: 'warn', text: 'Hydration is low. Drink 2–3 L of water today.' });
  if (corrections.length === 0) corrections.push({ type: 'ok', text: 'All vitals look excellent! Maintain your current routine.' });

  const protocols = [
    { icon: Utensils, title: t('activity.blueprint.nutrition_p'), color: '#34d399', text: `Target ${(telemetry.tdee).toFixed(0)} kcal with 40% carbs, 30% protein, 30% fats. Formulate nutrient-dense inputs.` },
    { icon: Dumbbell, title: t('activity.blueprint.training_p'),  color: '#818cf8', text: `${bodyProfile.activityLevel === 'sedentary' ? 'Initiate 3× weekly hypertrophy program to elevate BMR.' : 'Mix Zone-2 output with intensive progressive overload for maximal adaptation.'}` },
    { icon: Droplets, title: t('activity.blueprint.recovery_p'),  color: '#38bdf8', text: 'Enforce 7–9 hours biometric rest phase. Inject 10-min mobility matrix post-session.' },
  ];

  return (
    <div className={`w-full min-h-screen px-4 md:px-8 lg:px-12 py-8 md:py-12 overflow-x-hidden ${isPink ? 'bg-[#f6edf2] text-[#1f2a44]' : 'bg-[#06142d] text-white selection:bg-blue-500/30'}`}>
      
      {/* ── Ambient Glow ── */}
      <div className={`fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] blur-[150px] rounded-full pointer-events-none ${isPink ? 'bg-pink-300/20' : 'bg-blue-600/15'}`} />
      <div className={`fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] blur-[150px] rounded-full pointer-events-none ${isPink ? 'bg-rose-300/20' : 'bg-indigo-600/15'}`} />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col gap-8 md:gap-10">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className={`p-3 rounded-2xl ${isPink ? 'bg-pink-100 border border-pink-200/80 shadow-[0_8px_20px_rgba(236,72,153,0.16)]' : 'bg-blue-500/10 border border-blue-500/25 shadow-[0_8px_22px_rgba(59,130,246,0.2)]'}`}>
                <Target size={28} className={isPink ? 'text-pink-500' : 'text-blue-500'} />
              </div>
              <h1 className={`text-5xl lg:text-6xl font-medium tracking-tighter ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>{t('activity.blueprint.title')}</h1>
            </div>
            <p className={`text-sm font-light tracking-wide ml-[72px] flex items-center gap-2 ${isPink ? 'text-[#75829b]' : 'text-white/50'}`}>
              <span className="text-lg">{bodyProfile.gender === 'male' ? '🧑' : '👩'}</span> {bodyProfile.age} YRS <span className={isPink ? 'text-[#c5cfdd]' : 'text-white/20'}>|</span> {bodyProfile.height} CM <span className={isPink ? 'text-[#c5cfdd]' : 'text-white/20'}>|</span> {bodyProfile.weight} KG
            </p>
          </div>
          <button onClick={() => setBodyProfile(null)} className={`flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-all px-5 py-3 rounded-xl border ${isPink ? 'text-[#75829b] hover:text-[#1f2a44] hover:bg-pink-50 border-[#e8d4dd] bg-white' : 'text-blue-300 hover:text-white hover:bg-blue-500/15 border-blue-300/20 bg-blue-500/5'}`}>
            <RefreshCcw size={14} /> {t('activity.blueprint.rescan')}
          </button>
        </motion.div>

        {/* ── BMI Status Banner ── */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className={`rounded-[2.5rem] p-8 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-10 border shadow-2xl relative overflow-hidden ${isPink ? 'bg-[#f8f4f6]' : 'bg-[#030303]'}`}
          style={{ borderColor: `${telemetry.bmiStatus.color}40` }}>
          <div className="absolute inset-0 bg-gradient-to-r opacity-5" style={{ backgroundImage: `linear-gradient(to right, ${telemetry.bmiStatus.color}, transparent)` }} />
          
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 sm:gap-8 relative z-10 w-full lg:w-auto">
            <div className={`shrink-0 p-2 rounded-full shadow-2xl relative ${isPink ? 'bg-white' : 'bg-[#050505]'}`}>
              <MetricRing value={telemetry.bmi < 30 ? telemetry.bmi * 3.33 : 100} color={telemetry.bmiStatus.color} size={110} />
              <div className="absolute inset-0 flex items-center justify-center pt-2">
                <span className="text-2xl font-black" style={{ color: telemetry.bmiStatus.color }}>{telemetry.bmi.toFixed(1)}</span>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: telemetry.bmiStatus.color }}>{t('activity.blueprint.bmi_status')}</p>
              <h2 className={`text-4xl font-medium tracking-tight mb-2 ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>{t(telemetry.bmiStatus.label)}</h2>
              <p className={`text-[11px] font-bold uppercase tracking-widest ${isPink ? 'text-[#8c98ae]' : 'text-white/50'}`}>{t('activity.blueprint.ideal_range')} <br className="sm:hidden" /><span className={isPink ? 'text-[#1f2a44] sm:ml-2' : 'text-white sm:ml-2'}>{telemetry.idealMin.toFixed(0)}KG — {telemetry.idealMax.toFixed(0)}KG</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-4 relative z-10 w-full lg:w-auto flex-1 max-w-xl">
            <StatPill icon={Flame} label="Metabolic Base" value={`${telemetry.bmr.toFixed(0)} KCAL`} color="#fbbf24" isPink={isPink} />
            <StatPill icon={Zap}   label="Total Output" value={`${telemetry.tdee.toFixed(0)} KCAL`} color="#38bdf8" isPink={isPink} />
            <StatPill icon={Ruler} label="Height Core" value={`${bodyProfile.height} CM`} color="#818cf8" isPink={isPink} />
            <StatPill icon={Scale} label="Mass Anchor" value={`${bodyProfile.weight} KG`} color="#34d399" isPink={isPink} />
          </div>
        </motion.div>

        {/* ── Core Metric Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
              className={`rounded-[2rem] p-6 border relative overflow-hidden group transition-colors shadow-xl ${isPink ? 'bg-white border-[#e8d4dd] hover:border-[#e1c0cf]' : 'bg-[#030303] border-blue-300/10 hover:border-blue-400/30'}`}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity blur-2xl" style={{ backgroundColor: m.color }} />
              <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex items-center justify-between mb-8">
                    <div className={`p-2.5 rounded-xl border ${isPink ? 'border-[#ead5de] bg-pink-50' : 'border-blue-500/30 bg-blue-500/10'}`}>
                      <m.icon size={20} style={{ color: m.color }} />
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-[0.2em] text-right ${isPink ? 'text-[#9aa7bd]' : 'text-white/40'}`}>{m.label}</span>
                  </div>
                  <div>
                    <p className={`text-3xl font-medium tracking-tighter mb-1 ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>{m.val}</p>
                    <p className={`text-[10px] font-bold tracking-widest uppercase truncate ${isPink ? 'text-[#8c98ae]' : 'text-white/40'}`}>{m.sub}</p>
                  </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Biometric Rings Row ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={`rounded-[2.5rem] p-8 md:p-10 border shadow-2xl relative overflow-hidden ${isPink ? 'bg-[#f8f4f6] border-[#e8d4dd]' : 'bg-[#030303] border-blue-300/10'}`}>
          <h3 className={`text-xl font-medium tracking-tight mb-10 flex items-center gap-3 ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>
            <Activity size={24} className={isPink ? 'text-pink-500' : 'text-blue-500'} /> Telemetry Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {rings.map((r, i) => (
              <div key={r.label} className={`flex flex-col items-center gap-5 p-6 rounded-3xl border relative ${isPink ? 'bg-white border-[#ead5de]' : 'bg-[#050505] border-blue-300/10'}`}>
                <div className="relative">
                  <MetricRing value={r.val} color={r.color} size={130} />
                  <div className="absolute inset-0 flex items-center justify-center flex-col z-20" style={{ marginTop: '0px'}}>
                    <r.icon size={20} style={{ color: r.color }} className="mb-1" />
                    <span className={`text-2xl font-bold tracking-tighter ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>{r.val.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="w-full">
                    <p className={`text-[11px] font-bold uppercase tracking-widest text-center mb-3 ${isPink ? 'text-[#8c98ae]' : 'text-white/40'}`}>{r.label}</p>
                    <div className={`w-full h-1 rounded-full overflow-hidden ${isPink ? 'bg-[#e5edf5]' : 'bg-white/10'}`}>
                      <motion.div className="h-full rounded-full" style={{ background: r.color }} initial={{ width: 0 }} animate={{ width: `${r.val}%` }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 + i * 0.1 }} />
                    </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Bottom Two Columns ── */}
        <div className="grid lg:grid-cols-2 gap-6 pb-12">

          {/* Clinical Insights */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className={`rounded-[2.5rem] p-8 md:p-10 border shadow-2xl flex flex-col h-full ${isPink ? 'bg-[#f8f4f6] border-[#e8d4dd]' : 'bg-[#030303] border-blue-300/10'}`}>
            <h3 className={`text-xl font-medium tracking-tight mb-8 flex items-center gap-3 ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>
              <ShieldCheck size={24} className="text-emerald-400" /> Diagnostic Output
            </h3>
            
            <div className="space-y-4 flex-1">
              {corrections.map((c, i) => (
                <div key={i} className={`flex items-start gap-4 p-5 rounded-2xl border ${c.type === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                  {c.type === 'ok'
                    ? <CheckCircle size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                    : <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />}
                  <p className={`text-sm tracking-wide font-medium leading-relaxed ${c.type === 'ok' ? 'text-emerald-900' : 'text-amber-900'}`}>{c.text}</p>
                </div>
              ))}
            </div>

            {/* Mini body profile badge */}
            <div className={`mt-8 p-6 rounded-3xl border flex items-center gap-6 ${isPink ? 'border-[#ead5de] bg-white' : 'border-blue-300/10 bg-[#050505]'}`}>
              <div className="text-5xl drop-shadow-2xl">{bodyProfile.gender === 'male' ? '🧑' : '👩'}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold tracking-wide truncate mb-1 ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>
                  {bodyProfile.age} YRS <span className={isPink ? 'text-[#c5cfdd] mx-1' : 'text-white/30 mx-1'}>•</span> {bodyProfile.height} CM <span className={isPink ? 'text-[#c5cfdd] mx-1' : 'text-white/30 mx-1'}>•</span> {bodyProfile.weight} KG
                </p>
                <p className={`text-[10px] uppercase font-bold tracking-widest ${isPink ? 'text-pink-500' : 'text-sky-400'}`}>
                  {bodyProfile.activityLevel.replace('_', ' ')}
                </p>
                <div className={`mt-4 h-1 rounded-full overflow-hidden ${isPink ? 'bg-[#e5edf5]' : 'bg-white/10'}`}>
                  <div className="h-full rounded-full shadow-[0_0_10px_currentColor]" style={{ width: `${Math.min(100, (telemetry.bmi / 35) * 100)}%`, background: telemetry.bmiStatus.color }} />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-black tracking-tighter" style={{ color: telemetry.bmiStatus.color }}>{telemetry.bmi.toFixed(1)}</p>
                <p className={`text-[10px] tracking-widest font-bold uppercase mt-1 ${isPink ? 'text-[#9aa7bd]' : 'text-white/40'}`}>BMI INDEX</p>
              </div>
            </div>
          </motion.div>

          {/* Prescription Protocols */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
            className={`rounded-[2.5rem] p-8 md:p-10 border shadow-2xl flex flex-col h-full ${isPink ? 'bg-[#f8f4f6] border-[#e8d4dd]' : 'bg-[#030303] border-blue-300/10'}`}>
            <h3 className={`text-xl font-medium tracking-tight mb-8 flex items-center gap-3 ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>
              <Award size={24} className={isPink ? 'text-pink-500' : 'text-blue-500'} /> Prescribed Protocols
            </h3>
            <div className="space-y-4 flex-1">
              {protocols.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                  className={`flex gap-5 p-6 rounded-[2rem] border transition-all cursor-default group relative overflow-hidden ${isPink ? 'border-[#ead5de] bg-white hover:bg-pink-50 hover:border-[#e6c3d2]' : 'border-blue-300/10 bg-[#050505] hover:bg-[#0b0b0b] hover:border-blue-400/30'}`}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500" style={{ backgroundColor: p.color }} />
                  <div className={`p-4 rounded-2xl shrink-0 group-hover:scale-110 transition-transform border shadow-lg relative z-10 ${isPink ? 'bg-pink-50 border-pink-100' : 'bg-blue-500/10 border-blue-500/30'}`}>
                    <p.icon size={22} style={{ color: p.color }} />
                  </div>
                  <div className="relative z-10 flex-1 pt-1 space-y-2">
                    <p className={`text-sm font-bold tracking-widest uppercase flex items-center gap-3 ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>
                       {p.title}
                       <span className={`h-[1px] flex-1 bg-gradient-to-r ${isPink ? 'from-[#d6dfec] to-transparent' : 'from-[#c9dcf5] to-transparent'}`} />
                    </p>
                    <p className={`text-[13px] leading-relaxed font-light ${isPink ? 'text-[#61708b]' : 'text-white/60'}`}>{p.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
