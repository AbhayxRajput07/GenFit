import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import NutritionTracker from './components/NutritionTracker';
import ActivityTracker from './components/ActivityTracker';
import AICoach from './components/AICoach';
import { ViewState, DailyStats, ActivityData, NutritionData, Theme } from './types';
import BodyBlueprint from './components/BodyBlueprint';
import Profile from './components/Profile';
import Settings from './components/Settings';
import { Menu, X } from 'lucide-react';
import { listenAuth } from './services/firebaseAuth';
import LandingPage from "./pages/LandingPage";

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('pink');
  const [user, setUser] = useState<any>(null);
  const [bodyProfile, setBodyProfile] = useState<any>(() => {
    const saved = localStorage.getItem('bodyProfile');
    return saved ? JSON.parse(saved) : null;
  });

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
    stepsGoal: 10000,
    caloriesIn: 0,
    caloriesOut: 450,
    calorieGoal: 2500,
    waterMl: 1250,
    waterTarget: 3000,
    sleepHours: 7.5,
  });

  const updateWater = (amount: number) => {
    setStats(prev => ({ ...prev, waterMl: prev.waterMl + amount }));
  };

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

  // Save body profile
  useEffect(() => {
    localStorage.setItem('bodyProfile', JSON.stringify(bodyProfile));
  }, [bodyProfile]);

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
            stats={stats}
            updateWater={updateWater}
          />
        );

      case ViewState.ACTIVITY:
        return (
          <ActivityTracker
            addActivity={(i) => setActivities(prev => [...prev, i])}
            activities={activities}
            stats={stats}
          />
        );

      case ViewState.COACH:
        return <AICoach stats={stats} theme={theme} />;
      
      case ViewState.BODY_BLUEPRINT:
        return (
          <BodyBlueprint 
            activities={activities} 
            nutrition={nutrition} 
            stats={stats} 
            theme={theme} 
            bodyProfile={bodyProfile} 
            setBodyProfile={setBodyProfile} 
          />
        );

      case ViewState.PROFILE:
        return (
          <Profile 
            user={user} 
            stats={stats} 
            activities={activities} 
            theme={theme} 
          />
        );

      case ViewState.SETTINGS:
        return (
          <Settings 
            user={user} 
            theme={theme} 
            setTheme={setTheme} 
            setView={setView} 
          />
        );

      default:
        return <Dashboard stats={stats} activities={activities} nutrition={nutrition} />;
    }
  };

  // ⭐ Landing page first
  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <div className={`flex min-h-screen w-full bg-gradient-to-br transition-colors duration-700 ${theme === 'pink' ? 'from-white via-rose-50 to-pink-100' : 'from-[#0a192f] via-[#0f172a] to-[#0a192f]'} text-black`}>
      
      <Navigation 
        currentView={currentView} 
        setView={setView} 
        user={user} 
        theme={theme}
      />

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