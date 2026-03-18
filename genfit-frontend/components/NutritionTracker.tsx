import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NutritionData, DailyStats } from '../types';
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
    <div className="min-h-screen pb-20 bg-gradient-to-b from-[#ffeef4] via-[#fff4f8] to-[#fff7fb]">
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-10 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-2xl bg-[#ffe6f2] border border-[#efc7d6]">
                <Utensils size={24} className="text-[#c2185b]" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">Nutrition</h1>
            </div>
            <p className="text-sm text-slate-500 ml-16">Advanced meal scan and nutrition analytics</p>
          </div>
          <button className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-all px-4 py-2 rounded-xl border border-[#efc7d6] bg-white">
            <Sparkles size={14} /> Re-check
          </button>
        </motion.div>

        {/* Top Metric Bars */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 border border-[#f1d9e2] shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Protein Balance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#bf5f7e]">Protein Balance</p>
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
                <p className="text-xs font-semibold uppercase tracking-wide text-[#bf5f7e]">Hydration</p>
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
                <p className="text-xs font-semibold uppercase tracking-wide text-[#bf5f7e]">Carbohydrates</p>
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
          <div className="bg-white rounded-2xl p-4 border border-[#f1d9e2] shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Calories</p>
            <p className="text-2xl font-bold text-slate-900">{totals.kcal}</p>
            <p className="text-xs text-slate-500 mt-1">/ {targets.calories} kcal</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#f1d9e2] shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Protein</p>
            <p className="text-2xl font-bold text-slate-900">{totals.protein}g</p>
            <p className="text-xs text-slate-500 mt-1">30% intake</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#f1d9e2] shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Carbs</p>
            <p className="text-2xl font-bold text-slate-900">{totals.carbs}g</p>
            <p className="text-xs text-slate-500 mt-1">40% intake</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#f1d9e2] shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Fats</p>
            <p className="text-2xl font-bold text-slate-900">{totals.fats}g</p>
            <p className="text-xs text-slate-500 mt-1">30% intake</p>
          </div>
        </motion.div>

        {/* Health Snapshot - Circular Rings */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl p-8 border border-[#f1d9e2] shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
            <Heart size={20} className="text-[#c2185b]" /> Health Snapshot
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
            className="bg-white rounded-3xl p-6 border border-[#f1d9e2] shadow-sm"
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#bf5f7e] font-semibold">AI Nutrition Entry</p>
                <h3 className="text-2xl font-bold text-slate-900">Meal Scan</h3>
              </div>
              <span className="px-3 py-1.5 rounded-full text-xs bg-[#ffe8f1] text-[#bf5f7e] font-semibold border border-[#efc7d6]">Fast Log</span>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full mb-4 p-5 rounded-2xl border border-[#efc7d6] bg-gradient-to-r from-white to-[#fff8fb] hover:from-[#fff0f7] hover:to-white transition-colors text-left"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-[#ffe6f2] border border-[#efc7d6]">
                  <Camera size={20} className="text-slate-900" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Upload meal image</p>
                  <p className="text-sm text-slate-600 mt-1">Auto-detect nutrition in one scan</p>
                </div>
              </div>
            </button>

            <div className="flex flex-col lg:flex-row gap-3 mb-4">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogMeal()}
                placeholder="Enter meal details..."
                className="flex-1 px-5 py-4 bg-white rounded-xl outline-none border border-[#efc7d6] focus:ring-4 ring-[#ffe6f2] font-medium"
              />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageInput} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-4 rounded-xl bg-white border border-[#efc7d6] text-slate-900 font-semibold flex items-center justify-center gap-2 hover:bg-[#fff4f9] transition-colors"
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
              <div className="rounded-xl border border-[#efc7d6] p-3 bg-[#fff8fb]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-slate-900">Preview</p>
                  <button onClick={clearImage} className="text-xs font-bold text-slate-600 flex items-center gap-1 hover:underline">
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
                <img src={imagePreview} alt="Meal preview" className="w-full h-48 object-cover rounded-lg border border-[#efc7d6]" />
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
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
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
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${selectedMealTab === mealName ? 'bg-[#ffe8f1] border-[#efc7d6] text-[#bf5f7e]' : 'bg-white border-[#efc7d6] text-slate-700 hover:bg-[#fff0f7]'}`}
                  >
                    {mealName.substring(0, 12)}
                  </button>
                ))
              )}
            </div>

            {selectedMeal ? (
              <div className="p-4 rounded-2xl border border-[#efc7d6] bg-[#fff8fb]">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#efc7d6] bg-[#ffe8f3] shrink-0 flex items-center justify-center">
                    {mealImages[mealKey(selectedMeal.foodName, selectedMeal.timestamp)] ? (
                      <img
                        src={mealImages[mealKey(selectedMeal.foodName, selectedMeal.timestamp)]}
                        alt={selectedMeal.foodName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Utensils size={20} className="text-[#c2185b]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-sm font-bold text-slate-900 truncate">{selectedMeal.foodName}</h5>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
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
          className="bg-white rounded-3xl p-6 border border-[#f1d9e2] shadow-sm text-slate-900"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#bf5f7e] font-semibold">Hydration Status</p>
              <p className="text-3xl font-bold mt-1">{stats.waterMl} ml</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-[#bf5f7e] font-semibold">Daily Target</p>
              <p className="text-2xl font-bold mt-1">{targets.water} ml</p>
            </div>
          </div>

          <div className="h-2 bg-[#f8dfe8] rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: progressWidth(stats.waterMl, targets.water) }}
              className="h-full bg-gradient-to-r from-[#f9a8d4] via-[#f472b6] to-[#db2777]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => updateWater(250)} className="py-3 bg-white rounded-xl font-semibold text-sm text-slate-700 hover:bg-[#fff1f7] transition-colors border border-[#efc7d6]">
              + 250 ml
            </button>
            <button onClick={() => updateWater(500)} className="py-3 bg-white rounded-xl font-semibold text-sm text-slate-700 hover:bg-[#fff1f7] transition-colors border border-[#efc7d6]">
              + 500 ml
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NutritionTracker;