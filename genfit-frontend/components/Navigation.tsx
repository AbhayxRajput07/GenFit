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
  const isBlue = theme === 'blue';

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
      <nav className={`hidden md:flex flex-col w-72 border-r h-screen sticky top-0 p-6 transition-colors duration-500 ${isBlue ? 'bg-[#0a192f] border-blue-500/20' : 'bg-[#ffeef4] border-[#f1d9e2]'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm ${isBlue ? 'bg-blue-900/50 border-blue-500/30' : 'bg-[#ffe8f1] border-[#efc7d6]'}`}>
            <Activity className={`w-5 h-5 ${isBlue ? 'text-blue-400' : 'text-pink-500'}`} />
          </div>
          <h1 className={`text-2xl font-bold ${isBlue ? 'text-white' : 'text-gray-800'}`}>Genfit</h1>
        </div>

        {/* Nav Items */}
        <div className="space-y-3 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button key={item.id} onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl border transition-all ${isActive
                  ? (isBlue ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-md' : 'bg-[#ffe8f1] text-[#bf5f7e] border-[#efc7d6] shadow-sm')
                  : (isBlue ? 'bg-transparent text-gray-400 hover:text-blue-300 hover:bg-blue-500/10 border-transparent' : 'bg-transparent text-gray-600 hover:text-[#bf5f7e] hover:bg-[#fff1f7] border-transparent')
                }`}>
                <Icon className="w-5 h-5" />{item.label}
              </button>
            );
          })}
        </div>

        {/* Account */}
        {user ? (
          <button onClick={() => setView(ViewState.SETTINGS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition ${isBlue ? 'bg-[#112240] border-blue-500/20 text-white hover:bg-[#1a365d]' : 'bg-white border-[#efc7d6] text-gray-700 hover:bg-[#fff1f7]'}`}>
            <div className={`w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/30 ${isBlue ? 'bg-gradient-to-tr from-blue-500 to-cyan-500' : 'bg-gradient-to-tr from-pink-300 to-rose-300'}`}>
              <img src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${user?.name || user?.email || 'user'}`} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div className="text-left flex-1 overflow-hidden">
              <p className="font-bold truncate text-sm leading-tight">{user.name || t('profile.defaults.name')}</p>
              <p className="text-xs opacity-60 truncate leading-tight mt-0.5">{t('nav.settings_tagline') || 'Settings & Theme'}</p>
            </div>
          </button>
        ) : (
          <button onClick={() => setShowAccount(true)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border shadow-sm transition ${isBlue ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-400' : 'bg-[#db2777] text-white border-[#be185d] hover:bg-[#be185d]'}`}>
            <User className="w-5 h-5" /><span className="font-bold text-sm tracking-wide">{t('auth.switch_login')} / {t('auth.switch_signup')}</span>
          </button>
        )}
      </nav>

      {/* Account Modal */}
      <AnimatePresence>
        {showAccount && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`rounded-[2rem] p-8 w-full max-w-md shadow-2xl border relative overflow-hidden ${isBlue ? 'bg-[#112240] border-blue-500/20' : 'bg-[#fff8ef] border-[#f1d9e2]'}`}>
              <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-2xl ${isBlue ? 'bg-blue-500/10' : 'bg-[#ffd6e8]/60'}`}></div>
              <div className={`absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-2xl ${isBlue ? 'bg-cyan-500/10' : 'bg-[#ffe8f1]/70'}`}></div>

              <div className="relative z-10">
                  <div className="text-center mb-8">
                  <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg ${isBlue ? 'bg-gradient-to-tr from-blue-500 to-cyan-500' : 'bg-gradient-to-tr from-pink-400 to-rose-400'}`}>
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h2 className={`text-3xl font-extrabold tracking-tight ${isBlue ? 'text-white' : 'text-gray-800'}`}>
                    {signup ? t('auth.join') : t('auth.welcome')}
                  </h2>
                  <p className={`font-medium mt-2 text-sm ${isBlue ? 'text-gray-400' : 'text-gray-500'}`}>
                    {signup ? t('auth.signup_desc') : t('auth.login_desc')}
                  </p>
                </div>

                <div className="space-y-4">
                  {signup && (
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wide mb-1 ml-1 ${isBlue ? 'text-gray-400' : 'text-gray-500'}`}>{t('auth.full_name')}</label>
                      <input placeholder="John Doe" value={name} onChange={e => setName(e.target.value)}
                        className={`w-full border rounded-2xl px-5 py-3.5 font-medium focus:outline-none transition-all ${isBlue ? 'bg-[#0a192f] border-blue-500/30 text-white placeholder-gray-500 focus:border-blue-400' : 'bg-white border-[#efc7d6] focus:border-[#db2777]'}`} />
                    </div>
                  )}
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wide mb-1 ml-1 ${isBlue ? 'text-gray-400' : 'text-gray-500'}`}>{t('auth.email')}</label>
                    <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                      className={`w-full border rounded-2xl px-5 py-3.5 font-medium focus:outline-none transition-all ${isBlue ? 'bg-[#0a192f] border-blue-500/30 text-white placeholder-gray-500 focus:border-blue-400' : 'bg-white border-[#efc7d6] focus:border-[#db2777]'}`} />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wide mb-1 ml-1 ${isBlue ? 'text-gray-400' : 'text-gray-500'}`}>{t('auth.password')}</label>
                    <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                      className={`w-full border rounded-2xl px-5 py-3.5 font-medium focus:outline-none transition-all ${isBlue ? 'bg-[#0a192f] border-blue-500/30 text-white placeholder-gray-500 focus:border-blue-400' : 'bg-white border-[#efc7d6] focus:border-[#db2777]'}`} />
                  </div>
                  <button onClick={handleSubmit} disabled={loading}
                    className={`w-full py-4 mt-2 rounded-2xl text-white font-bold text-lg shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 ${isBlue ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-[#db2777] to-[#be185d]'}`}>
                    {loading ? t('auth.processing') || 'Processing...' : signup ? t('auth.signup_btn') : t('auth.login_btn')}
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200/20 text-center">
                  <p className={`text-sm font-medium ${isBlue ? 'text-gray-400' : 'text-gray-500'}`}>
                    {signup ? t('auth.has_account') : t('auth.no_account')}
                    <button onClick={() => setSignup(!signup)}
                      className={`ml-2 font-bold transition-colors px-3 py-1.5 rounded-lg ${isBlue ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20' : 'text-[#bf5f7e] bg-[#fff1f7] hover:bg-[#ffe8f1]'}`}>
                      {signup ? t('auth.switch_login') : t('auth.switch_signup')}
                    </button>
                  </p>
                </div>

                <button onClick={() => setShowAccount(false)}
                  className={`absolute top-6 right-6 p-2 rounded-full transition-colors active:scale-95 ${isBlue ? 'bg-blue-900/50 hover:bg-blue-800/50 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}>
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