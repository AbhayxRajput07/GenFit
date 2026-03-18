import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import NutritionTracker from './components/NutritionTracker';
import ActivityTracker from './components/ActivityTracker';
import AICoach from './components/AICoach';
import { ViewState, DailyStats, ActivityData, NutritionData } from './types';
import { Menu, X } from 'lucide-react';
import { listenAuth } from './services/firebaseAuth';
import LandingPage from "./pages/LandingPage";

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // ⭐ Landing page toggle
  const [showLanding, setShowLanding] = useState(true);

  // 🔥 Activities persistent storage
  const [activities, setActivities] = useState<ActivityData[]>(() => {
    const saved = localStorage.getItem('activities');
    return saved ? JSON.parse(saved) : [];
  });

  // 🔥 Nutrition persistent storage
  const [nutrition, setNutrition] = useState<NutritionData[]>(() => {
    const saved = localStorage.getItem('nutrition');
    return saved ? JSON.parse(saved) : [];
  });

  // 🔥 Daily stats
  const [stats, setStats] = useState<DailyStats>({
    steps: 8432,
    caloriesIn: 0,
    caloriesOut: 450,
    waterMl: 1250,
    sleepHours: 7.5,
  });

  // Firebase auth listener
  useEffect(() => {
    const unsub = listenAuth((u: any) => setUser(u));
    return () => unsub();
  }, []);

  // Save activities
  useEffect(() => {
    localStorage.setItem('activities', JSON.stringify(activities));
  }, [activities]);

  // Save nutrition
  useEffect(() => {
    localStorage.setItem('nutrition', JSON.stringify(nutrition));
  }, [nutrition]);

  // Auto stats calculation
  useEffect(() => {
    const totalCaloriesIn = nutrition.reduce((a, c) => a + c.calories, 0);
    const activityBurn = activities.reduce((a, c) => a + c.caloriesBurned, 0);

    setStats(prev => ({
      ...prev,
      caloriesIn: totalCaloriesIn,
      caloriesOut: 450 + activityBurn,
    }));
  }, [nutrition, activities]);

  const renderView = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard stats={stats} activities={activities} nutrition={nutrition} />;

      case ViewState.NUTRITION:
        return (
          <NutritionTracker
            addNutrition={(i) => setNutrition(prev => [...prev, i])}
            history={nutrition}
          />
        );

      case ViewState.ACTIVITY:
        return (
          <ActivityTracker
            addActivity={(i) => setActivities(prev => [...prev, i])}
            activities={activities}
          />
        );

      case ViewState.COACH:
        return <AICoach stats={stats} />;

      default:
        return <Dashboard stats={stats} activities={activities} nutrition={nutrition} />;
    }
  };

  // ⭐ Landing page first
  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-white via-rose-50 to-pink-100 text-black">
      
      <Navigation currentView={currentView} setView={setView} user={user} />

      <main className="flex-1 overflow-y-auto w-full">

        {/* Mobile header */}
        <div className="md:hidden flex justify-between items-center p-4">
          <h1 className="text-xl font-bold">Genfit</h1>
          <button onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-6">
            <button onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-8 h-8 text-black" />
            </button>
          </div>
        )}

        <div className="w-full h-full">
          {renderView()}
        </div>

      </main>
    </div>
  );
};

export default App;