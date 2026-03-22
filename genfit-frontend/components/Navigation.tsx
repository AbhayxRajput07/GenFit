import React, { useState } from 'react';
import { ViewState, Theme } from '../types';
import { LayoutDashboard, Utensils, Activity, Bot, User, X, UserRound, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { signupUser, loginUser } from '../services/firebaseAuth';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  user: any;
  theme: Theme;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, user, theme }) => {
  const { t } = useLanguage();
  const [showAccount, setShowAccount] = useState(false);
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const navItems = [
    { id: ViewState.DASHBOARD, label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: ViewState.ACTIVITY, label: t('nav.activity'), icon: Activity },
    { id: ViewState.NUTRITION, label: t('nav.nutrition'), icon: Utensils },
    { id: ViewState.COACH, label: t('nav.coach'), icon: Bot },
    { id: ViewState.BODY_BLUEPRINT, label: t('nav.blueprint'), icon: UserRound },
    { id: ViewState.PROFILE, label: t('nav.profile'), icon: User },
    { id: ViewState.SETTINGS, label: t('nav.settings'), icon: Settings },
  ];

  const handleSubmit = async () => {
    if (!email || !password) return alert(t('auth.errors.auth_fail'));
    if (signup && !name.trim()) return alert(t('auth.errors.enter_name'));
    try {
      setLoading(true);
      if (signup) { await signupUser(name.trim(), email, password); alert(t('auth.errors.account_created')); }
      else { await loginUser(email, password); alert(t('auth.errors.logged_in')); }
      setShowAccount(false);
    } catch (err: any) { alert(err.message || t('auth.errors.generic')); }
    finally { setLoading(false); }
  };

  return (
    <>
      {/* PREMIUM DARK NAVY SIDEBAR */}
      <nav className="hidden md:flex flex-col w-72 border-r border-white/5 h-screen sticky top-0 p-6 transition-colors duration-500 bg-[#020202]/80 backdrop-blur-2xl shadow-[10px_0_50px_rgba(0,0,0,0.5)] z-40">
        
        {/* Animated Background Glow */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-4 mb-14 px-2 relative z-10 text-white">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">GenFit.</h1>
        </div>

        {/* Nav Items */}
        <div className="space-y-2 flex-1 relative z-10">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl border transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-500/10 text-white border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                    : 'bg-transparent text-white/50 hover:text-white border-transparent hover:bg-white/[0.03]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'opacity-70'}`} />
                <span className={`font-medium tracking-wide ${isActive ? '' : 'font-light'}`}>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Premium Account Widget */}
        <div className="relative z-10 pt-6">
          {user ? (
            <button 
              onClick={() => setView(ViewState.SETTINGS)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-white"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10 bg-gradient-to-tr from-blue-900 to-black">
                <img src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${user?.name || user?.email || 'user'}`} alt="avatar" className="w-full h-full object-cover opacity-90" />
              </div>
              <div className="text-left flex-1 overflow-hidden">
                <p className="font-semibold truncate text-sm tracking-wide text-white/90">{user.name || t('profile.defaults.name')}</p>
                <p className="text-[10px] font-bold tracking-widest uppercase text-white/30 truncate mt-0.5">{t('nav.settings_tagline') || 'Settings & Theme'}</p>
              </div>
            </button>
          ) : (
            <button 
              onClick={() => setShowAccount(true)}
              className="group relative w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.15)]"
            >
              <User className="w-4 h-4 text-blue-300" />
              <span className="font-bold text-xs tracking-[0.1em] uppercase">{t('auth.switch_login')} / {t('auth.switch_signup')}</span>
              <div className="absolute inset-0 rounded-2xl border border-blue-400/0 group-hover:border-blue-400/30 transition-colors" />
            </button>
          )}
        </div>
      </nav>

      {/* Account Modal (Premium Glassmorphic) */}
      <AnimatePresence>
        {showAccount && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="rounded-[2.5rem] p-10 w-full max-w-md shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10 bg-[#050505] relative overflow-hidden"
            >
              {/* Internal ambient glow */}
              <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] bg-blue-600/20" />
              <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full blur-[100px] bg-sky-600/10" />

              <div className="relative z-10">
                <div className="text-center mb-10">
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)] bg-blue-500/10 border border-blue-500/30">
                    <User className="w-8 h-8 text-blue-400" />
                  </div>
                  <h2 className="text-3xl font-medium tracking-tighter text-white">
                    {signup ? t('auth.join') : t('auth.welcome')}
                  </h2>
                  <p className="font-light mt-3 text-sm text-white/50 tracking-wide">
                    {signup ? t('auth.signup_desc') : t('auth.login_desc')}
                  </p>
                </div>

                <div className="space-y-5">
                  {signup && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 ml-1 text-white/40">{t('auth.full_name')}</label>
                      <input 
                        placeholder="John Doe" value={name} onChange={e => setName(e.target.value)}
                        className="w-full border rounded-2xl px-5 py-4 font-medium focus:outline-none transition-all bg-white/[0.03] border-white/10 text-white placeholder-white/20 focus:border-blue-500/50 focus:bg-white/[0.05]" 
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 ml-1 text-white/40">{t('auth.email')}</label>
                    <input 
                      type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full border rounded-2xl px-5 py-4 font-medium focus:outline-none transition-all bg-white/[0.03] border-white/10 text-white placeholder-white/20 focus:border-blue-500/50 focus:bg-white/[0.05]" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 ml-1 text-white/40">{t('auth.password')}</label>
                    <input 
                      type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full border rounded-2xl px-5 py-4 font-medium focus:outline-none transition-all bg-white/[0.03] border-white/10 text-white placeholder-white/20 focus:border-blue-500/50 focus:bg-white/[0.05]" 
                    />
                  </div>
                  <button 
                    onClick={handleSubmit} disabled={loading}
                    className="w-full py-4 mt-4 rounded-2xl text-white font-bold text-sm tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)] hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 bg-gradient-to-r from-blue-600 to-blue-500"
                  >
                    {loading ? t('auth.processing') || 'Processing...' : signup ? t('auth.signup_btn') : t('auth.login_btn')}
                  </button>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 text-center">
                  <p className="text-xs font-medium text-white/40 uppercase tracking-widest">
                    {signup ? t('auth.has_account') : t('auth.no_account')}
                    <button 
                      onClick={() => setSignup(!signup)}
                      className="ml-3 font-bold transition-colors text-blue-400 hover:text-blue-300"
                    >
                      {signup ? t('auth.switch_login') : t('auth.switch_signup')}
                    </button>
                  </p>
                </div>

                <button 
                  onClick={() => setShowAccount(false)}
                  className="absolute top-6 right-6 p-2 rounded-full transition-colors bg-white/5 hover:bg-white/10 text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;