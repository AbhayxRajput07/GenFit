import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NutritionData, DailyStats, Theme } from '../types';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronRight,
  Droplets,
  Flame,
  ImagePlus,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Utensils,
  Zap,
  Heart,
} from 'lucide-react';
import { motion } from 'framer-motion';
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
}: {
  value: number;
  color: string;
  size?: number;
  label?: string;
}) {
  const safe = Math.max(0, Math.min(100, value));
  const radius = (size - 20) / 2;
  const circ = 2 * Math.PI * radius;
  const filled = (safe / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f0f0f0" strokeWidth={6} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - filled }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ marginTop: size / 2 - 20 }}>
        <span className="text-2xl font-black text-slate-900">{Math.round(safe)}%</span>
        {label && <span className="text-xs font-semibold text-slate-600 mt-1">{label}</span>}
      </div>
    </div>
  );
}


const NutritionTracker: React.FC<NutritionTrackerProps> = ({ addNutrition, history, stats, updateWater, theme }) => {
  const isPink = theme === 'pink';

  const colors = {
    bgGradient: isPink 
      ? 'from-[#ffeef4] via-[#fff4f8] to-[#fff7fb]' 
      : 'from-[#0a192f] via-[#0f172a] to-[#0a192f]',
    cardBg: isPink ? 'bg-white' : 'bg-[#1e293b]',
    cardBorder: isPink ? 'border-[#f1d9e2]' : 'border-[#334155]',
    textMain: isPink ? 'text-slate-900' : 'text-slate-100',
    textSub: isPink ? 'text-slate-500' : 'text-slate-400',
    textAccent: isPink ? 'text-[#bf5f7e]' : 'text-[#60a5fa]',
    accentPrimary: isPink ? '#db2777' : '#38bdf8',
    iconAccent: isPink ? 'text-[#db2777]' : 'text-[#38bdf8]',
    iconBg: isPink ? 'bg-[#ffe6f2]' : 'bg-blue-900/40',
    buttonBg: isPink ? 'bg-[#db2777]' : 'bg-blue-600',
    buttonHover: isPink ? 'hover:bg-[#be185d]' : 'hover:bg-blue-500',
    inputBg: isPink ? 'bg-white' : 'bg-[#0f172a]',
    inputRing: isPink ? 'ring-[#ffe6f2]' : 'ring-blue-900/30',
    tagBg: isPink ? 'bg-[#ffe8f1]' : 'bg-blue-900/20',
  };
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

  const nutritionScore = useMemo(() => {
    const scoreFromTarget = (current: number, target: number) => {
      const ratio = target === 0 ? 1 : current / target;
      const diff = Math.abs(1 - ratio);
      return Math.max(0, 100 - diff * 100);
    };

    const caloriesScore = scoreFromTarget(totals.kcal, targets.calories);
    const proteinScore = scoreFromTarget(totals.protein, targets.protein);
    const carbsScore = scoreFromTarget(totals.carbs, targets.carbs);
    const fatsScore = scoreFromTarget(totals.fats, targets.fats);
    const hydrationScore = scoreFromTarget(stats.waterMl, targets.water);

    const uniqueFoods = new Set(todayEntries.map((e) => e.foodName.toLowerCase())).size;
    const diversityBonus = Math.min(uniqueFoods * 4, 16);

    const score =
      caloriesScore * 0.2 +
      proteinScore * 0.25 +
      carbsScore * 0.2 +
      fatsScore * 0.2 +
      hydrationScore * 0.15 +
      diversityBonus;

    return Math.round(Math.min(100, score));
  }, [stats.waterMl, targets, todayEntries, totals]);

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
    if (mealTabs.length === 0) {
      setSelectedMealTab('');
      return;
    }
    if (!selectedMealTab || !mealTabs.includes(selectedMealTab)) {
      setSelectedMealTab(mealTabs[0]);
    }
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLogMeal = async () => {
    setError('');
    setSuccess('');
    if (!input.trim() && !imageBase64) {
      setError('Meal text ya meal image me se kam se kam ek chahiye.');
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
          ...result,
          foodName: finalFoodName,
          calories: Number(result.calories || 0),
          protein: Number(result.protein || 0),
          carbs: Number(result.carbs || 0),
          fats: Number(result.fats || 0),
          summary: result.summary || 'AI analyzed meal.',
          timestamp: entryTimestamp
        });

        if (imagePreview) {
          const key = mealKey(finalFoodName, entryTimestamp);
          setMealImages((prev) => ({ ...prev, [key]: imagePreview }));
        }

        setSuccess('Meal successfully scan + log ho gaya.');
        setInput('');
        clearImage();
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
      setError('Scan failed. Clear image try karo ya better meal description do.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const progressWidth = (value: number, target: number) => `${Math.min((value / Math.max(target, 1)) * 100, 100)}%`;

  return (
    <div className={`min-h-screen pb-20 bg-gradient-to-b ${colors.bgGradient} ${colors.textMain}`}>
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-10 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
            <div className={`p-2.5 rounded-2xl ${colors.iconBg} border ${colors.cardBorder}`}>
                <Utensils size={24} className={colors.accentPrimary.startsWith('#') ? '' : colors.accentPrimary} style={{ color: colors.accentPrimary.startsWith('#') ? colors.accentPrimary : undefined }} />
              </div>
              <h1 className={`text-4xl font-bold tracking-tight ${colors.textMain}`}>Nutrition</h1>
            </div>
            <p className={`text-sm ${colors.textSub} ml-16`}>Advanced meal scan and nutrition analytics</p>
          </div>
          <button className={`flex items-center gap-2 text-sm font-semibold ${colors.textSub} hover:${colors.textMain} transition-all px-4 py-2 rounded-xl border ${colors.cardBorder} ${colors.cardBg}`}>
            <Sparkles size={14} /> Re-check
          </button>
        </motion.div>

        {/* Top Metric Bars */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${colors.cardBg} rounded-3xl p-6 border ${colors.cardBorder} shadow-sm`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Protein Balance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold uppercase tracking-wide ${colors.textAccent}`}>Protein Balance</p>
                <span className="text-sm font-bold text-slate-900">{Math.round(proteinBalance)}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(proteinBalance, 100)}%` }}
                  className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-full"
                  transition={{ duration: 1 }}
                />
              </div>
              <p className="text-xs text-slate-500">{totals.protein}g / {targets.protein}g</p>
            </div>

            {/* Hydration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold uppercase tracking-wide ${colors.textAccent}`}>Hydration</p>
                <span className="text-sm font-bold text-slate-900">{Math.round(hydrationBalance)}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(hydrationBalance, 100)}%` }}
                  className="h-full bg-gradient-to-r from-[#06b6d4] to-[#0891b2] rounded-full"
                  transition={{ duration: 1 }}
                />
              </div>
              <p className="text-xs text-slate-500">{stats.waterMl}ml / {targets.water}ml</p>
            </div>

            {/* Carb Balance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold uppercase tracking-wide ${colors.textAccent}`}>Carbohydrates</p>
                <span className="text-sm font-bold text-slate-900">{Math.round(carbBalance)}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(carbBalance, 100)}%` }}
                  className="h-full bg-gradient-to-r from-[#f59e0b] to-[#f97316] rounded-full"
                  transition={{ duration: 1 }}
                />
              </div>
              <p className="text-xs text-slate-500">{totals.carbs}g / {targets.carbs}g</p>
            </div>
          </div>
        </motion.div>

        {/* Status Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className={`${colors.cardBg} rounded-2xl p-4 border ${colors.cardBorder} shadow-sm`}>
            <p className={`text-xs uppercase tracking-wider ${colors.textSub} font-bold mb-1`}>Calories</p>
            <p className={`text-2xl font-bold ${colors.textMain}`}>{totals.kcal}</p>
            <p className={`text-xs ${colors.textSub} mt-1`}>/ {targets.calories} kcal</p>
          </div>

          <div className={`${colors.cardBg} rounded-2xl p-4 border ${colors.cardBorder} shadow-sm`}>
            <p className={`text-xs uppercase tracking-wider ${colors.textSub} font-bold mb-1`}>Protein</p>
            <p className={`text-2xl font-bold ${colors.textMain}`}>{totals.protein}g</p>
            <p className={`text-xs ${colors.textSub} mt-1`}>30% intake</p>
          </div>

          <div className={`${colors.cardBg} rounded-2xl p-4 border ${colors.cardBorder} shadow-sm`}>
            <p className={`text-xs uppercase tracking-wider ${colors.textSub} font-bold mb-1`}>Carbs</p>
            <p className={`text-2xl font-bold ${colors.textMain}`}>{totals.carbs}g</p>
            <p className={`text-xs ${colors.textSub} mt-1`}>40% intake</p>
          </div>

          <div className={`${colors.cardBg} rounded-2xl p-4 border ${colors.cardBorder} shadow-sm`}>
            <p className={`text-xs uppercase tracking-wider ${colors.textSub} font-bold mb-1`}>Fats</p>
            <p className={`text-2xl font-bold ${colors.textMain}`}>{totals.fats}g</p>
            <p className={`text-xs ${colors.textSub} mt-1`}>30% intake</p>
          </div>
        </motion.div>

        {/* Health Snapshot - Circular Rings */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`${colors.cardBg} rounded-3xl p-8 border ${colors.cardBorder} shadow-sm`}
        >
          <h2 className={`text-lg font-bold ${colors.textMain} mb-8 flex items-center gap-2`}>
            <Heart size={20} className={colors.accentPrimary.startsWith('#') ? '' : colors.accentPrimary} style={{ color: colors.accentPrimary.startsWith('#') ? colors.accentPrimary : undefined }} /> Health Snapshot
          </h2>
          <div className="grid grid-cols-3 gap-8 place-items-center">
            <div className="flex flex-col items-center">
              <MetricRing value={proteinBalance} color="#8b5cf6" label="Protein" size={120} />
            </div>
            <div className="flex flex-col items-center">
              <MetricRing value={hydrationBalance} color="#06b6d4" label="Hydration" size={120} />
            </div>
            <div className="flex flex-col items-center">
              <MetricRing value={carbBalance} color="#f59e0b" label="Carbs" size={120} />
            </div>
          </div>
        </motion.div>

        {/* Scan & Upload Section */}
        <div className="grid xl:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${colors.cardBg} rounded-3xl p-6 border ${colors.cardBorder} shadow-sm`}
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className={`text-xs uppercase tracking-wide ${colors.textAccent} font-semibold`}>AI Nutrition Entry</p>
                <h3 className={`text-2xl font-bold ${colors.textMain}`}>Meal Scan</h3>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs ${colors.tagBg} ${colors.textAccent} font-semibold border ${colors.cardBorder}`}>Fast Log</span>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className={`w-full mb-4 p-5 rounded-2xl border ${colors.cardBorder} ${colors.cardBg} ${isPink ? 'bg-gradient-to-r from-white to-[#fff8fb] hover:from-[#fff0f7] hover:to-white' : 'hover:bg-blue-900/10'} transition-colors text-left`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg ${colors.iconBg} border ${colors.cardBorder}`}>
                  <Camera size={20} className={colors.textMain} />
                </div>
                <div>
                  <p className={`font-bold ${colors.textMain}`}>Upload meal image</p>
                  <p className={`text-sm ${colors.textSub} mt-1`}>Auto-detect nutrition in one scan</p>
                </div>
              </div>
            </button>

            <div className="flex flex-col lg:flex-row gap-3 mb-4">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogMeal()}
                placeholder="Enter meal details..."
                className={`flex-1 px-5 py-4 ${colors.inputBg} ${colors.textMain} rounded-xl outline-none border ${colors.cardBorder} focus:ring-4 ${colors.inputRing} font-medium`}
              />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageInput} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`px-5 py-4 rounded-xl ${colors.cardBg} border ${colors.cardBorder} ${colors.textMain} font-semibold flex items-center justify-center gap-2 ${isPink ? 'hover:bg-[#fff4f9]' : 'hover:bg-blue-900/10'} transition-colors`}
              >
                <Upload size={18} />
              </button>
              <button
                onClick={handleLogMeal}
                disabled={isAnalyzing}
                className="bg-[#db2777] text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 border border-[#be185d] hover:bg-[#be185d] transition-all disabled:opacity-50"
              >
                {isAnalyzing ? <Camera size={18} className="animate-pulse" /> : <ImagePlus size={18} />}
                {isAnalyzing ? 'Scanning...' : 'Scan'}
              </button>
            </div>

            {imagePreview && (
              <div className={`rounded-xl border ${colors.cardBorder} p-3 ${isPink ? 'bg-[#fff8fb]' : 'bg-blue-900/5'}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-sm font-bold ${colors.textMain}`}>Preview</p>
                  <button onClick={clearImage} className={`text-xs font-bold ${colors.textSub} flex items-center gap-1 hover:underline`}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
                <img src={imagePreview} alt="Meal preview" className={`w-full h-48 object-cover rounded-lg border ${colors.cardBorder}`} />
              </div>
            )}

            {error && (
              <p className="mt-3 text-sm text-[#C0395A] font-bold flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </p>
            )}
            {success && (
              <p className="mt-3 text-sm text-[#059669] font-bold flex items-center gap-2">
                <CheckCircle2 size={16} /> {success}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-3xl p-6 border border-[#f1d9e2] shadow-sm"
          >
            <h4 className={`text-lg font-bold ${colors.textMain} mb-4 flex items-center gap-2`}>
              <Utensils size={18} /> Meal Details
            </h4>

            <div className="flex flex-wrap gap-2 mb-4">
              {mealTabs.length === 0 ? (
                <span className="text-sm font-medium text-slate-500">Scan a meal to create tabs.</span>
              ) : (
                mealTabs.map((mealName) => (
                  <button
                    key={mealName}
                    onClick={() => setSelectedMealTab(mealName)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${selectedMealTab === mealName ? (isPink ? 'bg-[#ffe8f1] border-[#efc7d6] text-[#bf5f7e]' : 'bg-blue-500/20 border-blue-500/40 text-blue-300') : (isPink ? 'bg-white border-[#efc7d6] text-slate-700 hover:bg-[#fff0f7]' : 'bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800')}`}
                  >
                    {mealName.substring(0, 12)}
                  </button>
                ))
              )}
            </div>

            {selectedMeal ? (
              <div className={`p-4 rounded-2xl border ${colors.cardBorder} ${isPink ? 'bg-[#fff8fb]' : 'bg-blue-900/10'}`}>
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-16 h-16 rounded-xl overflow-hidden border ${colors.cardBorder} ${isPink ? 'bg-[#ffe8f3]' : 'bg-blue-900/20'} shrink-0 flex items-center justify-center`}>
                    {mealImages[mealKey(selectedMeal.foodName, selectedMeal.timestamp)] ? (
                      <img
                        src={mealImages[mealKey(selectedMeal.foodName, selectedMeal.timestamp)]}
                        alt={selectedMeal.foodName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Utensils size={20} className={colors.accentPrimary.startsWith('#') ? '' : colors.accentPrimary} style={{ color: colors.accentPrimary.startsWith('#') ? colors.accentPrimary : undefined }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className={`text-sm font-bold ${colors.textMain} truncate`}>{selectedMeal.foodName}</h5>
                    <p className={`text-xs ${colors.textSub} font-medium mt-0.5`}>
                      {new Date(selectedMeal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-lg border border-[#efc7d6] bg-white p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Calories</p>
                    <p className="text-lg font-bold text-slate-900">{selectedMeal.calories}</p>
                  </div>
                  <div className="rounded-lg border border-[#efc7d6] bg-white p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Protein</p>
                    <p className="text-lg font-bold text-slate-900">{selectedMeal.protein}g</p>
                  </div>
                  <div className="rounded-lg border border-[#efc7d6] bg-white p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Carbs</p>
                    <p className="text-lg font-bold text-slate-900">{selectedMeal.carbs}g</p>
                  </div>
                  <div className="rounded-lg border border-[#efc7d6] bg-white p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Fats</p>
                    <p className="text-lg font-bold text-slate-900">{selectedMeal.fats}g</p>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">{selectedMeal.summary}</p>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-[#efc7d6] bg-white p-6 text-center text-slate-500 text-sm">
                No meal selected yet.
              </div>
            )}
          </motion.div>
        </div>

        {/* Hydration Quick Access */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${colors.cardBg} rounded-3xl p-6 border ${colors.cardBorder} shadow-sm ${colors.textMain}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-xs uppercase tracking-widest ${colors.textAccent} font-semibold`}>Hydration Status</p>
              <p className="text-3xl font-bold mt-1">{stats.waterMl} ml</p>
            </div>
            <div className="text-right">
              <p className={`text-xs uppercase tracking-widest ${colors.textAccent} font-semibold`}>Daily Target</p>
              <p className="text-2xl font-bold mt-1">{targets.water} ml</p>
            </div>
          </div>

          <div className={`h-2 ${colors.tagBg} rounded-full overflow-hidden mb-4`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: progressWidth(stats.waterMl, targets.water) }}
              className={`h-full ${isPink ? 'bg-gradient-to-r from-[#f9a8d4] via-[#f472b6] to-[#db2777]' : 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600'}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => updateWater(250)} className={`py-3 ${colors.cardBg} rounded-xl font-semibold text-sm ${colors.textSub} hover:${colors.textMain} transition-colors border ${colors.cardBorder}`}>
              + 250 ml
            </button>
            <button onClick={() => updateWater(500)} className={`py-3 ${colors.cardBg} rounded-xl font-semibold text-sm ${colors.textSub} hover:${colors.textMain} transition-colors border ${colors.cardBorder}`}>
              + 500 ml
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NutritionTracker;