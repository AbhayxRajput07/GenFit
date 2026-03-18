import React, { useState, useRef } from 'react';
import { NutritionData } from '../types';
import { analyzeFoodEntry } from '../services/geminiService';
import { Loader2, Camera, Plus, AlertCircle } from 'lucide-react';

interface NutritionTrackerProps {
  addNutrition: (data: NutritionData) => void;
  history: NutritionData[];
}

const NutritionTracker: React.FC<NutritionTrackerProps> = ({ addNutrition, history }) => {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSelectedImage(base64String.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!input && !selectedImage) return;

    setIsAnalyzing(true);
    setError('');

    try {
      const result = await analyzeFoodEntry(
        input || "Food from image",
        selectedImage || undefined
      );

      const safeData: NutritionData = {
        foodName: result.foodName || input || "Detected Food",
        calories: Number(result.calories) || 0,
        protein: Number(result.protein) || 0,
        carbs: Number(result.carbs) || 0,
        fats: Number(result.fats) || 0,
        summary: result.summary || "AI estimated nutrition values.",
        timestamp: new Date(),
      };

      addNutrition(safeData);

      setInput('');
      setSelectedImage(null);

    } catch (err) {
      console.error(err);
      setError("AI failed to analyze. Try clearer photo or description.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full min-h-screen px-14 py-12 bg-gradient-to-br from-white via-rose-50 to-pink-100 space-y-10 text-black">

      {/* Header */}
      <header>
        <h2 className="text-4xl font-semibold">AI Nutrition Logger</h2>
        <p className="text-black/70">
          Upload food photo or describe meal ΓÇö AI auto tracks macros.
        </p>
      </header>

      {/* Input Card */}
      <div className="bg-white rounded-3xl border border-black/20 shadow-xl p-6 space-y-5">

        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Describe meal (optional if photo uploaded)ΓÇª"
          className="w-full h-32 border border-black/20 rounded-xl p-4 outline-none resize-none"
        />

        {selectedImage && (
          <img
            src={`data:image/jpeg;base64,${selectedImage}`}
            alt="preview"
            className="h-32 rounded-xl border border-black/20"
          />
        )}

        <div className="flex justify-between items-center">

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-pink-100 border border-black/20 flex gap-2 items-center hover:bg-pink-200"
          >
            <Camera size={16}/> Add Photo
          </button>

          <button
            disabled={isAnalyzing || (!input && !selectedImage)}
            onClick={handleAnalyze}
            className="px-6 py-2 rounded-xl bg-pink-200 border border-black/20 font-semibold flex items-center gap-2 hover:bg-pink-300 transition disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" /> : <Plus />}
            {isAnalyzing ? 'AnalyzingΓÇª' : 'Analyze'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 p-3 rounded-xl flex gap-2 text-red-600">
            <AlertCircle /> {error}
          </div>
        )}
      </div>

      {/* History */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">TodayΓÇÖs Meals</h3>

        {history.length === 0 ? (
          <div className="border border-black/20 rounded-2xl py-10 text-center">
            No meals logged yet.
          </div>
        ) : (
          history.map((item, i) => (
            <div
              key={i}
              className="bg-white border border-black/20 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition"
            >
              <div>
                <p className="font-medium capitalize">{item.foodName}</p>

                {/* SAFE TIME FIX */}
                <p className="text-xs text-black/60">
                  {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <p className="font-semibold">
                {item.calories} kcal
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NutritionTracker;
