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
import { Menu } from 'lucide-react';
import { listenAuth } from './services/firebaseAuth';
import LandingPage from "./pages/LandingPage";
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('genfit_theme');
    return (saved as Theme) || 'blue';
  });
  const [user, setUser] = useState<any>(null);
  const [showAuthPage, setShowAuthPage] = useState(false);
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

  const handleEnterApp = () => {
    setShowLanding(false);
    setShowAuthPage(false);
  };

  const handleAuthRedirect = () => {
    setShowLanding(false);
    setShowAuthPage(true);
  };

  const handleLogoutComplete = () => {
    setShowAuthPage(false);
    setShowLanding(true);
    setView(ViewState.DASHBOARD);
    setIsMobileMenuOpen(false);
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

  // Save theme
  useEffect(() => {
    localStorage.setItem('genfit_theme', theme);
  }, [theme]);

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
    // Add theme as key to force re-mount and fresh color evaluation
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard key={theme} stats={stats} activities={activities} nutrition={nutrition} theme={theme} />;

      case ViewState.NUTRITION:
        return (
          <NutritionTracker
            key={theme}
            addNutrition={(i) => setNutrition(prev => [...prev, i])}
            history={nutrition}
            stats={stats}
            updateWater={updateWater}
            theme={theme}
          />
        );

      case ViewState.ACTIVITY:
        return (
          <ActivityTracker
            key={theme}
            addActivity={(i) => setActivities(prev => [...prev, i])}
            activities={activities}
            stats={stats}
            theme={theme}
          />
        );

      case ViewState.COACH:
        return <AICoach key={theme} stats={stats} theme={theme} />;
      
      case ViewState.BODY_BLUEPRINT:
        return (
          <BodyBlueprint 
            key={theme}
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
            key={theme}
            user={user} 
            stats={stats} 
            activities={activities} 
            theme={theme} 
          />
        );

      case ViewState.SETTINGS:
        return (
          <Settings 
            key={theme}
            user={user} 
            theme={theme} 
            setTheme={setTheme} 
            setView={setView} 
            onLogout={handleLogoutComplete}
          />
        );

      default:
        return <Dashboard key={theme} stats={stats} activities={activities} nutrition={nutrition} theme={theme} />;
    }
  };

  // ⭐ Landing page first
  if (showLanding) {
    return (
      <LandingPage
        onEnter={handleEnterApp}
        onAuthRequired={handleAuthRedirect}
        isAuthenticated={!!user}
      />
    );
  }

  if (showAuthPage) {
    return (
      <AuthPage
        onAuthenticated={handleEnterApp}
        onBackToLanding={() => {
          setShowAuthPage(false);
          setShowLanding(true);
        }}
      />
    );
  }

  return (
    <ProtectedRoute
      isAllowed={!!user}
      fallback={
        <LandingPage
          onEnter={handleEnterApp}
          onAuthRequired={handleAuthRedirect}
          isAuthenticated={false}
        />
      }
    >
      <div className="flex min-h-screen w-full bg-[#010101] text-white transition-colors duration-700">
        
        <Navigation 
          currentView={currentView} 
          setView={setView} 
          user={user} 
          theme={theme}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />

        <main className={`flex-1 overflow-y-auto w-full ${theme === 'pink' ? 'pink-theme-view' : ''}`}>

          {/* Mobile header */}
          <div className="md:hidden flex justify-between items-center p-4 border-b border-white/10">
            <h1 className="text-xl font-bold">GenFit.</h1>
            <button onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="w-full h-full">
            {renderView()}
          </div>

        </main>
      </div>
    </ProtectedRoute>
  );
};

export default App;