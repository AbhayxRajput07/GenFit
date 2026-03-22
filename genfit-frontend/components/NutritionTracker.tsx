import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NutritionData, DailyStats, Theme } from '../types';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ImagePlus,
  Sparkles,
  Trash2,
  Upload,
  Utensils,
  Heart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeFoodEntry } from '../services/geminiService';

interface NutritionTrackerProps {
  addNutrition: (data: NutritionData) => void;
  history: NutritionData[];
  stats: DailyStats;
  updateWater: (amount: number) => void;
  theme: Theme;
}

function MetricRing({
  value,
  color,
  size = 120,
  label,
  glowColor,
}: {
  value: number;
  color: string;
  size?: number;
  label?: string;
  glowColor: string;
}) {
  const safe = Math.max(0, Math.min(100, value));
  const radius = (size - 20) / 2;
  const circ = 2 * Math.PI * radius;
  const filled = (safe / 100) * circ;

  return (
    <div className="flex flex-col items-center relative">
      <div className="absolute inset-0 blur-xl opacity-30 rounded-full" style={{ backgroundColor: glowColor, transform: 'scale(0.8)' }} />
      <svg width={size} height={size} className="rotate-[-90deg] relative z-10" style={{ filter: `drop-shadow(0 0 10px ${glowColor})` }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ - filled }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center z-20" style={{ marginTop: size / 2 - 20 }}>
        <span className="text-2xl font-bold tracking-tighter text-white">{Math.round(safe)}%</span>
        {label && <span className="text-[10px] font-bold tracking-widest uppercase text-white/50 mt-1">{label}</span>}
      </div>
    </div>
  );
}

const NutritionTracker: React.FC<NutritionTrackerProps> = ({ addNutrition, history, stats, updateWater }) => {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [mealImages, setMealImages] = useState<Record<string, string>>({});
  const [selectedMealTab, setSelectedMealTab] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const todayStr = new Date().toDateString();
  const todayEntries = history.filter(n => new Date(n.timestamp).toDateString() === todayStr);

  const totals = useMemo(() => {
    return todayEntries.reduce((acc, curr) => ({
      kcal: acc.kcal + curr.calories,
      protein: acc.protein + curr.protein,
      carbs: acc.carbs + curr.carbs,
      fats: acc.fats + curr.fats
    }), { kcal: 0, protein: 0, carbs: 0, fats: 0 });
  }, [todayEntries]);

  const targets = useMemo(() => {
    const calories = Math.max(stats.calorieGoal, 2500);
    return {
      calories,
      protein: Math.round((calories * 0.3) / 4),
      carbs: Math.round((calories * 0.4) / 4),
      fats: Math.round((calories * 0.3) / 9),
      water: stats.waterTarget || 2000,
    };
  }, [stats.calorieGoal, stats.waterTarget]);

  const proteinBalance = (totals.protein / Math.max(targets.protein, 1)) * 100;
  const hydrationBalance = (stats.waterMl / Math.max(targets.water, 1)) * 100;
  const carbBalance = (totals.carbs / Math.max(targets.carbs, 1)) * 100;

  const mealKey = (foodName: string, timestamp: Date | string | number) => `${foodName}__${new Date(timestamp).getTime()}`;

  const mealTabs = useMemo(() => {
    return Array.from(new Set(todayEntries.map((entry) => entry.foodName))).slice(0, 8);
  }, [todayEntries]);

  const selectedMeal = useMemo(() => {
    if (!selectedMealTab) return todayEntries[todayEntries.length - 1] || null;
    const matching = todayEntries.filter((entry) => entry.foodName === selectedMealTab);
    return matching[matching.length - 1] || null;
  }, [selectedMealTab, todayEntries]);

  useEffect(() => {
    if (mealTabs.length === 0) { setSelectedMealTab(''); return; }
    if (!selectedMealTab || !mealTabs.includes(selectedMealTab)) setSelectedMealTab(mealTabs[0]);
  }, [mealTabs, selectedMealTab]);

  const uploadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const parts = result.split(',');
      if (parts.length > 1) {
        setImageBase64(parts[1]);
        setImagePreview(result);
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadImage(file);
  };

  const clearImage = () => {
    setImageBase64(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLogMeal = async () => {
    setError(''); setSuccess('');
    if (!input.trim() && !imageBase64) {
      setError('Meal text ya image necessary hai.');
      return;
    }
    setIsAnalyzing(true);
    try {
      const prompt = input.trim() || 'Meal scanned from image';
      const result = await analyzeFoodEntry(prompt, imageBase64 || undefined);
      if (result) {
        const entryTimestamp = new Date();
        const finalFoodName = result.foodName || 'Scanned Meal';
        addNutrition({
          ...result, foodName: finalFoodName, calories: Number(result.calories || 0),
          protein: Number(result.protein || 0), carbs: Number(result.carbs || 0),
          fats: Number(result.fats || 0), summary: result.summary || 'AI analyzed meal.',
          timestamp: entryTimestamp
        });
        if (imagePreview) {
          const key = mealKey(finalFoodName, entryTimestamp);
          setMealImages((prev) => ({ ...prev, [key]: imagePreview }));
        }
        setSuccess('Meal verified & logged successfully.');
        setInput(''); clearImage();
      }
    } catch (error) {
      setError('Scan failed. Try a clearer image or better description.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const progressWidth = (value: number, target: number) => `${Math.min((value / Math.max(target, 1)) * 100, 100)}%`;

  return (
    <div className="w-full min-h-screen bg-[#010101] text-white px-4 md:px-8 lg:px-12 py-8 md:py-12 overflow-x-hidden selection:bg-emerald-500/30">
      
      {/* Ambient Glow */}
      <div className="fixed top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-[1400px] mx-auto flex flex-col gap-8 md:gap-10">
        
        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Utensils size={28} className="text-emerald-400" />
              </div>
              <h1 className="text-5xl lg:text-6xl font-medium tracking-tighter text-white">Nutrition</h1>
            </div>
            <p className="text-sm font-light text-white/50 tracking-wide ml-[72px]">Advanced AI-driven meal scanning & metabolic tracking.</p>
          </div>
          
          <button className="flex items-center gap-2 text-xs font-bold tracking-widest text-emerald-400 hover:text-white hover:bg-white/10 transition-all px-5 py-3 rounded-xl border border-white/10 bg-white/5 uppercase">
            <Sparkles size={16} /> Re-check Base
          </button>
        </motion.div>

        {/* METRICS OVERVIEW STRIP */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          {[
            { label: 'Calories', val: totals.kcal, target: targets.calories, unit: 'kcal', color: 'text-white' },
            { label: 'Protein', val: totals.protein, target: '30% intake', unit: 'g', color: 'text-emerald-400' },
            { label: 'Carbs', val: totals.carbs, target: '40% intake', unit: 'g', color: 'text-sky-400' },
            { label: 'Fats', val: totals.fats, target: '30% intake', unit: 'g', color: 'text-amber-400' },
          ].map((m, i) => (
            <div key={i} className="p-6 rounded-2xl bg-[#030303] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">{m.label}</p>
              <div className="flex items-end gap-1">
                <p className={`text-3xl font-bold ${m.color}`}>{m.val}</p>
                <p className="text-sm font-medium text-white/30 pb-1">{m.unit}</p>
              </div>
              <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase mt-2">{m.target}</p>
            </div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 relative z-10">
          
          {/* LEFT: Scan & Upload Section */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2 space-y-8">
            
            <div className="p-8 rounded-[2.5rem] bg-[#030303] border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Optical Recognition</p>
                  <h3 className="text-3xl font-medium tracking-tight text-white">Meal Scan</h3>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-widest uppercase">Live AI</div>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full mb-6 p-6 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all text-left group"
              >
                <div className="flex items-center gap-5">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <Camera size={28} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white tracking-tight">Capture Meal Image</p>
                    <p className="text-sm text-white/50 tracking-wide mt-1">Metabolic extraction via computer vision.</p>
                  </div>
                </div>
              </button>

              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <input
                  value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogMeal()}
                  placeholder="Or manually describe your meal..."
                  className="flex-1 px-6 py-5 bg-[#050505] text-white rounded-2xl outline-none border border-white/10 focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all font-medium text-sm placeholder-white/20"
                />
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageInput} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-5 rounded-2xl bg-[#050505] border border-white/10 text-white/70 hover:text-white font-semibold flex items-center justify-center hover:bg-white/5 transition-colors"
                >
                  <Upload size={20} />
                </button>
                <button
                  onClick={handleLogMeal} disabled={isAnalyzing}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-5 rounded-2xl font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:grayscale hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-95 border border-emerald-400/50 min-w-[180px]"
                >
                  {isAnalyzing ? <Camera size={18} className="animate-pulse" /> : <ImagePlus size={18} />}
                  {isAnalyzing ? 'Extracting...' : 'Log Meal'}
                </button>
              </div>

              <AnimatePresence>
                {imagePreview && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="rounded-2xl border border-white/10 p-4 bg-white/[0.02] mt-6 relative overflow-hidden group">
                    <button onClick={clearImage} className="absolute top-6 right-6 p-2 rounded-xl bg-black/60 backdrop-blur-md text-white/70 hover:text-white border border-white/10 hover:bg-rose-500/80 transition-colors z-10">
                      <Trash2 size={16} />
                    </button>
                    <img src={imagePreview} alt="Meal preview" className="w-full h-64 object-cover rounded-xl border border-white/5" />
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <p className="mt-4 text-xs tracking-wide text-rose-400 font-bold flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20"><AlertCircle size={16} /> {error}</p>}
              {success && <p className="mt-4 text-xs tracking-wide text-emerald-400 font-bold flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"><CheckCircle2 size={16} /> {success}</p>}
            </div>

            {/* Hydration Interface */}
            <div className="p-8 rounded-[2.5rem] bg-[#030303] border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-1">Fluid Intake</p>
                  <div className="flex items-baseline gap-2">
                     <p className="text-4xl font-bold tracking-tighter text-white">{stats.waterMl}</p>
                     <p className="text-sm font-medium text-white/40">/ {targets.water} ml</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button onClick={() => updateWater(250)} className="px-6 py-4 bg-white/[0.03] rounded-2xl font-bold text-xs tracking-widest text-white/70 hover:text-white hover:bg-blue-500/20 hover:border-blue-500/50 transition-all border border-white/5">+ 250 ML</button>
                  <button onClick={() => updateWater(500)} className="px-6 py-4 bg-white/[0.03] rounded-2xl font-bold text-xs tracking-widest text-white/70 hover:text-white hover:bg-blue-500/20 hover:border-blue-500/50 transition-all border border-white/5">+ 500 ML</button>
                </div>
              </div>

              <div className="h-3 bg-white/5 rounded-full overflow-hidden relative z-10">
                <motion.div initial={{ width: 0 }} animate={{ width: progressWidth(stats.waterMl, targets.water) }} className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" transition={{ duration: 1 }} />
              </div>
            </div>
            
          </motion.div>

          {/* RIGHT: Selected Meal Details & Snapshot */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-8">
            
            <div className="p-8 rounded-[2.5rem] bg-[#030303] border border-white/5 shadow-2xl overflow-hidden">
              <h4 className="text-xl font-medium tracking-tight text-white mb-6 flex items-center gap-3">
                <Heart size={20} className="text-rose-400" /> Biometric Impact
              </h4>
              <div className="flex flex-col gap-8 pb-3">
                <MetricRing value={proteinBalance} color="#34d399" glowColor="rgba(52,211,153,0.5)" label="Protein Synthesis" size={140} />
                <div className="grid grid-cols-2 gap-4">
                  <MetricRing value={carbBalance} color="#38bdf8" glowColor="rgba(56,189,248,0.5)" label="Glycogen" size={100} />
                  <MetricRing value={hydrationBalance} color="#818cf8" glowColor="rgba(129,140,248,0.5)" label="Hydration" size={100} />
                </div>
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-[#030303] border border-white/5 shadow-2xl">
              <div className="flex flex-wrap gap-2 mb-6">
                {mealTabs.length === 0 ? (
                  <span className="text-[10px] font-bold tracking-widest uppercase text-white/30">No scans available.</span>
                ) : (
                  mealTabs.map((mealName) => (
                    <button
                      key={mealName} onClick={() => setSelectedMealTab(mealName)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase border transition-all ${
                        selectedMealTab === mealName ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-transparent border-white/10 text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {mealName.substring(0, 15)}
                    </button>
                  ))
                )}
              </div>

              {selectedMeal ? (
                <div className="p-6 rounded-2xl bg-[#050505] border border-white/5">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-white/5 shrink-0 flex items-center justify-center shadow-lg">
                      {mealImages[mealKey(selectedMeal.foodName, selectedMeal.timestamp)] ? (
                        <img src={mealImages[mealKey(selectedMeal.foodName, selectedMeal.timestamp)]} alt={selectedMeal.foodName} className="w-full h-full object-cover" />
                      ) : (
                        <Utensils size={24} className="text-white/30" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <h5 className="text-base font-bold text-white truncate">{selectedMeal.foodName}</h5>
                      <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase mt-1">
                        {new Date(selectedMeal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      { l: 'Calories', v: selectedMeal.calories, u: '', c: 'text-white' },
                      { l: 'Protein', v: selectedMeal.protein, u: 'g', c: 'text-emerald-400' },
                      { l: 'Carbs', v: selectedMeal.carbs, u: 'g', c: 'text-sky-400' },
                      { l: 'Fats', v: selectedMeal.fats, u: 'g', c: 'text-amber-400' },
                    ].map(st => (
                      <div key={st.l} className="rounded-xl border border-white/5 bg-[#030303] p-3 text-center">
                        <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">{st.l}</p>
                        <p className={`text-lg font-bold leading-none ${st.c}`}>{st.v}<span className="text-xs">{st.u}</span></p>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-white/60 leading-relaxed font-light">{selectedMeal.summary}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-[#050505] p-8 text-center flex flex-col items-center opacity-50">
                  <Utensils size={32} className="text-white/30 mb-4" />
                  <p className="text-[10px] font-bold tracking-widest uppercase text-white/50">Awaiting visual input</p>
                </div>
              )}
            </div>
            
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default NutritionTracker;