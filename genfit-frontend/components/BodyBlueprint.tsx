import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ActivityData, NutritionData, DailyStats, Theme,
  BodyProfile, ActivityLevel
} from '../types';
import {
  Zap, ShieldCheck, Brain, Utensils, Dumbbell,
  ChevronRight, ChevronLeft, RefreshCcw, Droplets,
  Flame, Target, Scale, Ruler, User, Heart,
  TrendingUp, Award, AlertCircle, CheckCircle, Activity
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// ─── Types ────────────────────────────────────────────
interface BodyBlueprintProps {
  activities: ActivityData[];
  nutrition: NutritionData[];
  stats: DailyStats;
  theme: Theme;
  bodyProfile: BodyProfile | null;
  setBodyProfile: (p: BodyProfile | null) => void;
}

// ─── Helpers ──────────────────────────────────────────
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
    bmi < 18.5 ? { label: 'activity.blueprint.underweight', color: '#3b82f6', bg: '#eff6ff' } :
    bmi < 25   ? { label: 'activity.blueprint.healthy',     color: '#10b981', bg: '#ecfdf5' } :
    bmi < 30   ? { label: 'activity.blueprint.overweight',  color: '#f59e0b', bg: '#fffbeb' } :
                 { label: 'activity.blueprint.obese',       color: '#ef4444', bg: '#fef2f2' };
  return { bmi, bmr, tdee, neuralLoad, hydration, glycemic, fatPct, idealMin, idealMax, bmiStatus };
}

// ─── Sub-components ───────────────────────────────────
function MetricRing({ value, max = 100, color, size = 96 }: { value: number; max?: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (value / max) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={8} />
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={8} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - filled }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </svg>
  );
}

function StatPill({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 bg-white/60 backdrop-blur rounded-2xl px-4 py-3 border border-white/80">
      <div className="p-2 rounded-xl" style={{ background: color + '18' }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

// ─── Onboarding ───────────────────────────────────────
function Onboarding({ theme, onSave }: { theme: Theme; onSave: (p: BodyProfile) => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Partial<BodyProfile>>({
    gender: 'male', age: 25, height: 175, weight: 70, activityLevel: 'moderate',
  });

  const { t } = useLanguage();
  const accent = theme === 'pink' ? '#e879a0' : '#6366f1';
  const accentLight = theme === 'pink' ? '#fdf2f8' : '#eef2ff';

  const steps = [
    t('activity.blueprint.onboarding.identity'),
    t('activity.blueprint.onboarding.biometrics'),
    t('activity.blueprint.onboarding.lifestyle')
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: theme === 'pink' ? 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)' : 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #c7d2fe 100%)' }}>

      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-40"
          style={{ background: accent }} />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: accent }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-lg bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/80 border border-white p-10">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl" style={{ background: accentLight }}>
            <Target size={28} style={{ color: accent }} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">{t('activity.blueprint.title')}</h1>
            <p className="text-sm text-slate-400">Step {step + 1} of {steps.length} — {steps[step]}</p>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex gap-2 mb-10">
          {steps.map((_, i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-500"
              style={{ background: i <= step ? accent : '#e2e8f0' }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h2 className="text-lg font-bold text-slate-700">{t('activity.blueprint.onboarding.who')}</h2>
              <div className="grid grid-cols-2 gap-4">
                {(['male', 'female'] as const).map(g => (
                  <button key={g} onClick={() => setForm({ ...form, gender: g })}
                    className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${form.gender === g ? 'border-current scale-[1.02] shadow-lg' : 'border-slate-100 hover:border-slate-200'}`}
                    style={{ borderColor: form.gender === g ? accent : undefined, background: form.gender === g ? accentLight : 'white' }}>
                    <span className="text-4xl">{g === 'male' ? '🧑' : '👩'}</span>
                    <span className="text-sm font-bold capitalize text-slate-700">{g}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm font-semibold text-slate-600">Age</label>
                  <span className="text-sm font-bold" style={{ color: accent }}>{form.age} years</span>
                </div>
                <input type="range" min={15} max={90} value={form.age}
                  onChange={e => setForm({ ...form, age: +e.target.value })}
                  className="w-full accent-current h-2" style={{ color: accent }} />
              </div>
              <button onClick={() => setStep(1)}
                className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 10px 30px ${accent}40` }}>
                {t('common.workouts')} <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h2 className="text-lg font-bold text-slate-700">Your measurements</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Height', key: 'height', unit: 'cm', min: 120, max: 230, icon: Ruler },
                  { label: 'Weight', key: 'weight', unit: 'kg', min: 30, max: 250, icon: Scale },
                ].map(({ label, key, unit, min, max, icon: Ic }) => (
                  <div key={key} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Ic size={16} className="text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 mb-1">{(form as any)[key]} <span className="text-sm font-normal text-slate-400">{unit}</span></div>
                    <input type="range" min={min} max={max} value={(form as any)[key]}
                      onChange={e => setForm({ ...form, [key]: +e.target.value })}
                      className="w-full h-1.5" style={{ accentColor: accent }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold flex items-center justify-center gap-2 hover:border-slate-200 transition-all">
                  <ChevronLeft size={18} /> Back
                </button>
                <button onClick={() => setStep(2)}
                  className="flex-[2] py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 8px 20px ${accent}40` }}>
                  Continue <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-lg font-bold text-slate-700">Activity level</h2>
              {([ 
                ['sedentary',  '🪑', 'Sedentary',    'Little or no exercise'],
                ['light',      '🚶', 'Lightly Active','1–3 days/week'],
                ['moderate',   '🏃', 'Moderately Active','3–5 days/week'],
                ['active',     '⚡', 'Very Active',   '6–7 days/week'],
                ['very_active','🔥', 'Extra Active',  'Athlete / physical job'],
              ] as const).map(([val, emoji, label, desc]) => (
                <button key={val} onClick={() => setForm({ ...form, activityLevel: val as ActivityLevel })}
                  className={`w-full px-5 py-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${form.activityLevel === val ? 'scale-[1.01]' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                  style={form.activityLevel === val ? { borderColor: accent, background: accentLight } : {}}>
                  <span className="text-2xl">{emoji}</span>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                  {form.activityLevel === val && <CheckCircle size={18} className="ml-auto" style={{ color: accent }} />}
                </button>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold flex items-center justify-center gap-2 hover:border-slate-200 transition-all">
                  <ChevronLeft size={18} /> Back
                </button>
                <button onClick={() => onSave(form as BodyProfile)}
                  className="flex-[2] py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 10px 30px ${accent}40` }}>
                  <Zap size={18} /> Generate Blueprint
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
  if (!bodyProfile) return <Onboarding theme={theme} onSave={setBodyProfile} />;

  const telemetry = calcTelemetry(bodyProfile, activities, nutrition);
  const accent = theme === 'pink' ? '#e879a0' : '#6366f1';
  const accent2 = theme === 'pink' ? '#f472b6' : '#818cf8';
  const accentLight = theme === 'pink' ? '#fdf2f8' : '#eef2ff';
  const bgGrad = theme === 'pink'
    ? 'linear-gradient(145deg, #fff5fb 0%, #fce7f3 40%, #f3f4f6 100%)'
    : 'linear-gradient(145deg, #f8faff 0%, #e0e7ff 40%, #f3f4f6 100%)';

  const metrics = [
    { label: 'BMI',          val: telemetry.bmi.toFixed(1),             sub: t(telemetry.bmiStatus.label), color: telemetry.bmiStatus.color, icon: Scale },
    { label: 'BMR',          val: `${telemetry.bmr.toFixed(0)} kcal`,   sub: t('dashboard.stats.calories'),  color: '#f59e0b',          icon: Flame },
    { label: t('activity.stats.intensity'), val: `${telemetry.tdee.toFixed(0)} kcal`,  sub: t('activity.blueprint.subtitle'),color: accent,            icon: Zap },
    { label: t('activity.blueprint.hydration'), val: `${telemetry.fatPct.toFixed(1)}%`,    sub: t('common.health_snapshot'),         color: '#10b981',          icon: User },
  ];

  const rings = [
    { label: t('activity.blueprint.neural_load'),  val: telemetry.neuralLoad,  color: '#a78bfa', icon: Brain },
    { label: t('activity.blueprint.hydration'),    val: telemetry.hydration,   color: '#38bdf8', icon: Droplets },
    { label: t('activity.blueprint.glycemic'),     val: telemetry.glycemic,    color: '#fb923c', icon: TrendingUp },
  ];

  const corrections: { text: string; type: 'warn' | 'ok' }[] = [];
  if (telemetry.bmi > 25) corrections.push({ type: 'warn', text: `Aim for ${(telemetry.tdee - 400).toFixed(0)} kcal/day to lose weight safely.` });
  if (telemetry.bmi < 18.5) corrections.push({ type: 'warn', text: 'Increase caloric intake to build healthy mass.' });
  if (telemetry.neuralLoad > 65) corrections.push({ type: 'warn', text: 'High activity load — schedule 1 rest day this week.' });
  if (telemetry.hydration < 60) corrections.push({ type: 'warn', text: 'Hydration is low. Drink 2–3 L of water today.' });
  if (corrections.length === 0) corrections.push({ type: 'ok', text: 'All vitals look excellent! Maintain your current routine.' });

  const protocols = [
    { icon: Utensils, title: t('activity.blueprint.nutrition_p'), color: '#10b981', text: `Target ${(telemetry.tdee).toFixed(0)} kcal with 40% carbs, 30% protein, 30% fats. Prioritise whole foods.` },
    { icon: Dumbbell, title: t('activity.blueprint.training_p'),  color: '#6366f1', text: `${bodyProfile.activityLevel === 'sedentary' ? '3× weekly strength training to boost BMR.' : 'Mix Zone-2 cardio with progressive overload for optimal results.'}` },
    { icon: Droplets, title: t('activity.blueprint.recovery_p'),  color: '#38bdf8', text: 'Aim for 7–9 hours of sleep. Include 10-min stretching after every workout.' },
  ];

  return (
    <div className="min-h-screen pb-16" style={{ background: bgGrad }}>

      {/* ── Top Decorative Blobs ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[120px] opacity-30" style={{ background: accent }} />
        <div className="absolute top-1/2 -left-32 w-72 h-72 rounded-full blur-[100px] opacity-20" style={{ background: accent2 }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-10 space-y-8">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-2xl" style={{ background: accentLight }}>
                <Target size={22} style={{ color: accent }} />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-800">{t('activity.blueprint.title')}</h1>
            </div>
            <p className="text-sm text-slate-400 ml-14">
              {bodyProfile.gender === 'male' ? '👤' : '👩'} {bodyProfile.age} yrs · {bodyProfile.height} cm · {bodyProfile.weight} kg
            </p>
          </div>
          <button onClick={() => setBodyProfile(null)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-all px-4 py-2 rounded-xl hover:bg-white/60">
            <RefreshCcw size={15} /> {t('activity.blueprint.rescan')}
          </button>
        </motion.div>

        {/* ── BMI Status Banner ── */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="rounded-3xl p-6 flex items-center justify-between gap-6 border backdrop-blur-xl"
          style={{ background: `${telemetry.bmiStatus.color}12`, borderColor: `${telemetry.bmiStatus.color}30` }}>
          <div className="flex items-center gap-5">
            <div className="relative">
              <MetricRing value={telemetry.bmi < 30 ? telemetry.bmi * 3.33 : 100} color={telemetry.bmiStatus.color} size={88} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-black" style={{ color: telemetry.bmiStatus.color }}>{telemetry.bmi.toFixed(1)}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: telemetry.bmiStatus.color }}>{t('activity.blueprint.bmi_status')}</p>
              <h2 className="text-2xl font-black text-slate-800">{t(telemetry.bmiStatus.label)}</h2>
              <p className="text-sm text-slate-500">{t('activity.blueprint.ideal_range')}: {telemetry.idealMin.toFixed(0)}–{telemetry.idealMax.toFixed(0)} kg</p>
            </div>
          </div>
          <div className="hidden sm:grid grid-cols-2 gap-3">
            <StatPill icon={Flame} label="BMR" value={`${telemetry.bmr.toFixed(0)} kcal`} color="#f59e0b" />
            <StatPill icon={Zap}   label="TDEE" value={`${telemetry.tdee.toFixed(0)} kcal`} color={accent} />
            <StatPill icon={Ruler} label={t('activity.blueprint.onboarding.biometrics').split('/')[0]} value={`${bodyProfile.height} cm`} color="#6366f1" />
            <StatPill icon={Scale} label={t('activity.blueprint.onboarding.biometrics').split('/')[1]} value={`${bodyProfile.weight} kg`} color="#10b981" />
          </div>
        </motion.div>

        {/* ── Core Metric Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
              className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 border border-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl" style={{ background: m.color + '15' }}>
                  <m.icon size={16} style={{ color: m.color }} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.label}</span>
              </div>
              <p className="text-xl font-black text-slate-800">{m.val}</p>
              <p className="text-xs text-slate-400 mt-0.5">{m.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Biometric Rings Row ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white shadow-sm">
          <h3 className="text-base font-black text-slate-700 mb-6 flex items-center gap-2">
            <Activity size={18} style={{ color: accent }} /> {t('common.health_snapshot')}
          </h3>
          <div className="grid grid-cols-3 gap-6">
            {rings.map((r, i) => (
              <div key={r.label} className="flex flex-col items-center gap-3">
                <div className="relative">
                  <MetricRing value={r.val} color={r.color} size={100} />
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <r.icon size={18} style={{ color: r.color }} />
                    <span className="text-sm font-black text-slate-700">{r.val.toFixed(0)}%</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-500 text-center">{r.label}</p>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: r.color }}
                    initial={{ width: 0 }} animate={{ width: `${r.val}%` }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 + i * 0.1 }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Bottom Two Columns ── */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Clinical Insights */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            className="bg-white/70 backdrop-blur-xl rounded-3xl p-7 border border-white shadow-sm">
            <h3 className="text-base font-black text-slate-700 mb-5 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500" /> {t('activity.blueprint.insights')}
            </h3>
            <div className="space-y-3">
              {corrections.map((c, i) => (
                <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl ${c.type === 'ok' ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
                  {c.type === 'ok'
                    ? <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                    : <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />}
                  <p className="text-sm text-slate-700 leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>

            {/* Mini body profile badge */}
            <div className="mt-5 p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center gap-4">
              <div className="text-4xl">{bodyProfile.gender === 'male' ? '🧑' : '👩'}</div>
              <div className="flex-1">
                <p className="text-sm font-black text-slate-700">
                  {bodyProfile.age} y · {bodyProfile.height} cm · {bodyProfile.weight} kg
                </p>
                <p className="text-xs text-slate-400 capitalize">
                  {bodyProfile.activityLevel.replace('_', ' ')} activity level
                </p>
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (telemetry.bmi / 35) * 100)}%`, background: telemetry.bmiStatus.color }} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black" style={{ color: telemetry.bmiStatus.color }}>{telemetry.bmi.toFixed(1)}</p>
                <p className="text-[10px] text-slate-400 font-semibold">BMI</p>
              </div>
            </div>
          </motion.div>

          {/* Prescription Protocols */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}
            className="bg-white/70 backdrop-blur-xl rounded-3xl p-7 border border-white shadow-sm">
            <h3 className="text-base font-black text-slate-700 mb-5 flex items-center gap-2">
              <Award size={18} style={{ color: accent }} /> {t('activity.blueprint.protocols')}
            </h3>
            <div className="space-y-4">
              {protocols.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-white transition-all cursor-default group">
                  <div className="p-3 rounded-2xl shrink-0 group-hover:scale-110 transition-transform" style={{ background: p.color + '18' }}>
                    <p.icon size={20} style={{ color: p.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 mb-1">{p.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{p.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Body Composition Footer Card ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="rounded-3xl p-8 border text-white relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent2} 100%)` }}>
          <div className="absolute inset-0 opacity-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="absolute rounded-full border border-white"
                style={{ width: 80 + i * 60, height: 80 + i * 60, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
            ))}
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">{t('activity.blueprint.summary')}</p>
              <h3 className="text-3xl font-black">Est. Body Fat: {telemetry.fatPct.toFixed(1)}%</h3>
              <p className="text-white/70 text-sm mt-1">{t('activity.blueprint.ideal_range')}: {telemetry.idealMin.toFixed(0)}–{telemetry.idealMax.toFixed(0)} kg</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Current',  val: `${bodyProfile.weight} kg`, icon: Scale },
                { label: 'Target',   val: `${((telemetry.idealMin + telemetry.idealMax) / 2).toFixed(0)} kg`, icon: Target },
                { label: 'Deficit',  val: `${Math.abs(bodyProfile.weight - (telemetry.idealMin + telemetry.idealMax) / 2).toFixed(0)} kg`, icon: TrendingUp },
                { label: 'Fat Est',  val: `${telemetry.fatPct.toFixed(1)}%`, icon: Heart },
              ].map(s => (
                <div key={s.label} className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 flex items-center gap-3">
                  <s.icon size={16} className="text-white/70 shrink-0" />
                  <div>
                    <p className="text-[10px] text-white/60 font-semibold">{s.label}</p>
                    <p className="text-sm font-black">{s.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

