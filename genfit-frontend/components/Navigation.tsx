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
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
  currentView,
  setView,
  user,
  theme,
  isMobileMenuOpen = false,
  onCloseMobileMenu,
}) => {
  const { t } = useLanguage();
  const [showAccount, setShowAccount] = useState(false);
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const isPink = theme === 'pink';

  const navUi = {
    shell: isPink
      ? 'border-r border-[#ebd6df] bg-[#f8f4f6] shadow-[10px_0_30px_rgba(221,170,192,0.2)]'
      : 'border-r border-white/5 bg-[#020202]/80 shadow-[10px_0_50px_rgba(0,0,0,0.5)]',
    glow: isPink
      ? 'bg-gradient-to-b from-pink-300/20 to-transparent'
      : 'bg-gradient-to-b from-blue-500/10 to-transparent',
    logoText: isPink ? 'text-slate-800' : 'text-white',
    logoWrap: isPink
      ? 'bg-gradient-to-br from-pink-100 to-rose-100 border border-pink-200/80 shadow-[0_6px_20px_rgba(228,148,181,0.25)]'
      : 'bg-blue-500/10 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]',
    logoIcon: isPink ? 'text-pink-500' : 'text-blue-400',
    itemActive: isPink
      ? 'bg-pink-100 text-pink-600 border-pink-200/80 shadow-[0_6px_18px_rgba(228,148,181,0.16)]'
      : 'bg-blue-500/10 text-white border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
    itemIdle: isPink
      ? 'bg-transparent text-slate-500 hover:text-slate-700 border-transparent hover:bg-pink-50'
      : 'bg-transparent text-white/50 hover:text-white border-transparent hover:bg-white/[0.03]',
    iconActive: isPink ? 'text-pink-500' : 'text-blue-400',
    profileCard: isPink
      ? 'border border-pink-200/70 bg-pink-50 hover:bg-pink-100/70 text-slate-700'
      : 'border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-white',
    profileAvatar: isPink
      ? 'border border-pink-200/80 bg-gradient-to-tr from-pink-200 to-rose-200'
      : 'border border-white/10 bg-gradient-to-tr from-blue-900 to-black',
    profileName: isPink ? 'text-slate-700' : 'text-white/90',
    profileTagline: isPink ? 'text-slate-400' : 'text-white/30',
    authBtn: isPink
      ? 'border border-pink-300/70 bg-pink-100 text-pink-600 hover:bg-pink-200/70 shadow-[0_8px_20px_rgba(228,148,181,0.18)]'
      : 'border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-white shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    authIcon: isPink ? 'text-pink-500' : 'text-blue-300',
    authRing: isPink ? 'border-pink-300/40' : 'border-blue-400/30',
    mobileBackdrop: isPink ? 'bg-black/40 backdrop-blur-sm' : 'bg-black/70 backdrop-blur-md',
    mobileDrawer: isPink
      ? 'border-r border-[#ebd6df] bg-[#f8f4f6] shadow-[16px_0_40px_rgba(221,170,192,0.35)]'
      : 'border-r border-white/10 bg-[#030303] shadow-[20px_0_60px_rgba(0,0,0,0.6)]',
    mobileClose: isPink
      ? 'bg-pink-100 text-slate-500 hover:text-slate-700 hover:bg-pink-200/70'
      : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10',
    mobileActive: isPink
      ? 'bg-pink-100 text-pink-600 border-pink-200/80'
      : 'bg-blue-500/10 text-white border-blue-500/30',
    mobileIdle: isPink
      ? 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-pink-50'
      : 'text-white/70 border-transparent hover:text-white hover:bg-white/[0.03]'
  };

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

  const handleViewChange = (view: ViewState) => {
    setView(view);
    onCloseMobileMenu?.();
  };

  return (
    <>
      {/* PREMIUM DARK NAVY SIDEBAR */}
      <nav className={`hidden md:flex flex-col w-72 h-screen sticky top-0 p-6 transition-colors duration-500 backdrop-blur-2xl z-40 ${navUi.shell}`}>
        
        {/* Animated Background Glow */}
        <div className={`absolute top-0 left-0 w-full h-40 pointer-events-none ${navUi.glow}`} />

        {/* Logo */}
        <div className={`flex items-center gap-4 mb-14 px-2 relative z-10 ${navUi.logoText}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${navUi.logoWrap}`}>
            <Activity className={`w-5 h-5 ${navUi.logoIcon}`} />
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
                onClick={() => handleViewChange(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl border transition-all duration-300 ${
                  isActive
                    ? navUi.itemActive
                    : navUi.itemIdle
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? navUi.iconActive : 'opacity-70'}`} />
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${navUi.profileCard}`}
            >
              <div className={`w-10 h-10 rounded-full overflow-hidden shrink-0 ${navUi.profileAvatar}`}>
                <img src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${user?.name || user?.email || 'user'}`} alt="avatar" className="w-full h-full object-cover opacity-90" />
              </div>
              <div className="text-left flex-1 overflow-hidden">
                <p className={`font-semibold truncate text-sm tracking-wide ${navUi.profileName}`}>{user.name || t('profile.defaults.name')}</p>
                <p className={`text-[10px] font-bold tracking-widest uppercase truncate mt-0.5 ${navUi.profileTagline}`}>{t('nav.settings_tagline') || 'Settings & Theme'}</p>
              </div>
            </button>
          ) : (
            <button 
              onClick={() => setShowAccount(true)}
              className={`group relative w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl transition-all ${navUi.authBtn}`}
            >
              <User className={`w-4 h-4 ${navUi.authIcon}`} />
              <span className="font-bold text-xs tracking-[0.1em] uppercase">{t('auth.switch_login')} / {t('auth.switch_signup')}</span>
              <div className={`absolute inset-0 rounded-2xl border border-transparent transition-colors ${isPink ? 'group-hover:border-pink-300/40' : 'group-hover:border-blue-400/30'}`} />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[90] md:hidden ${navUi.mobileBackdrop}`}
            onClick={onCloseMobileMenu}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className={`w-[86%] max-w-sm h-full p-6 ${navUi.mobileDrawer}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div className={`flex items-center gap-3 ${navUi.logoText}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${navUi.logoWrap}`}>
                    <Activity className={`w-5 h-5 ${navUi.logoIcon}`} />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">GenFit.</h2>
                </div>
                <button
                  onClick={onCloseMobileMenu}
                  className={`p-2 rounded-full transition-colors ${navUi.mobileClose}`}
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleViewChange(item.id)}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-300 ${
                        isActive
                          ? navUi.mobileActive
                          : navUi.mobileIdle
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? navUi.iconActive : 'opacity-80'}`} />
                      <span className="font-medium tracking-wide">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Modal (Premium Glassmorphic) */}
      <AnimatePresence>
        {showAccount && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`fixed inset-0 flex items-center justify-center z-[100] p-4 ${isPink ? 'bg-black/35 backdrop-blur-sm' : 'bg-black/60 backdrop-blur-md'}`}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`rounded-[2.5rem] p-10 w-full max-w-md relative overflow-hidden ${isPink ? 'shadow-[0_18px_46px_rgba(0,0,0,0.28)] border border-pink-300/80 bg-[#fff8fb]' : 'shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10 bg-[#050505]'}`}
            >
              {/* Internal ambient glow */}
              <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] ${isPink ? 'bg-pink-400/20' : 'bg-blue-600/20'}`} />
              <div className={`absolute -bottom-32 -left-32 w-64 h-64 rounded-full blur-[100px] ${isPink ? 'bg-rose-300/20' : 'bg-sky-600/10'}`} />

              <div className="relative z-10">
                <div className="text-center mb-10">
                  <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6 ${isPink ? 'shadow-[0_0_24px_rgba(236,72,153,0.2)] bg-pink-100 border border-pink-200/80' : 'shadow-[0_0_30px_rgba(59,130,246,0.3)] bg-blue-500/10 border border-blue-500/30'}`}>
                    <User className={`w-8 h-8 ${isPink ? 'text-pink-500' : 'text-blue-400'}`} />
                  </div>
                  <h2 className={`text-3xl font-medium tracking-tighter ${isPink ? 'text-[#1f2a44]' : 'text-white'}`}>
                    {signup ? t('auth.join') : t('auth.welcome')}
                  </h2>
                  <p className={`font-light mt-3 text-sm tracking-wide ${isPink ? 'text-[#7d8ca6]' : 'text-white/50'}`}>
                    {signup ? t('auth.signup_desc') : t('auth.login_desc')}
                  </p>
                </div>

                <div className={`mb-8 p-1 rounded-2xl border ${isPink ? 'border-pink-300/80 bg-white' : 'border-white/10 bg-white/[0.03]'}`}>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setSignup(false)}
                      className={`py-3 rounded-xl text-sm font-bold transition-all ${!signup
                        ? (isPink ? 'bg-white text-[#1f2a44] border border-pink-200/80' : 'bg-white/10 text-white')
                        : (isPink ? 'text-[#7d8ca6] hover:bg-pink-50' : 'text-white/60 hover:bg-white/5')}`}
                    >
                      {t('auth.switch_login')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignup(true)}
                      className={`py-3 rounded-xl text-sm font-bold transition-all ${signup
                        ? (isPink ? 'bg-pink-300 text-[#1f2a44] border border-pink-300' : 'bg-blue-600 text-white')
                        : (isPink ? 'text-[#7d8ca6] hover:bg-pink-50' : 'text-white/60 hover:bg-white/5')}`}
                    >
                      {t('auth.switch_signup')}
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  {signup && (
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ml-1 ${isPink ? 'text-[#7d8ca6]' : 'text-white/40'}`}>{t('auth.full_name')}</label>
                      <input 
                        placeholder="John Doe" value={name} onChange={e => setName(e.target.value)}
                        className={`w-full border rounded-2xl px-5 py-4 font-medium focus:outline-none transition-all ${isPink ? 'bg-[#fff3f8] border-pink-200/80 text-[#1f2a44] placeholder-[#9aa7bd] focus:border-pink-400' : 'bg-white/[0.03] border-white/10 text-white placeholder-white/20 focus:border-blue-500/50 focus:bg-white/[0.05]'}`}
                      />
                    </div>
                  )}
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ml-1 ${isPink ? 'text-[#7d8ca6]' : 'text-white/40'}`}>{t('auth.email')}</label>
                    <input 
                      type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                      className={`w-full border rounded-2xl px-5 py-4 font-medium focus:outline-none transition-all ${isPink ? 'bg-[#fff3f8] border-pink-200/80 text-[#1f2a44] placeholder-[#9aa7bd] focus:border-pink-400' : 'bg-white/[0.03] border-white/10 text-white placeholder-white/20 focus:border-blue-500/50 focus:bg-white/[0.05]'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ml-1 ${isPink ? 'text-[#7d8ca6]' : 'text-white/40'}`}>{t('auth.password')}</label>
                    <input 
                      type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                      className={`w-full border rounded-2xl px-5 py-4 font-medium focus:outline-none transition-all ${isPink ? 'bg-[#fff3f8] border-pink-200/80 text-[#1f2a44] placeholder-[#9aa7bd] focus:border-pink-400' : 'bg-white/[0.03] border-white/10 text-white placeholder-white/20 focus:border-blue-500/50 focus:bg-white/[0.05]'}`}
                    />
                  </div>
                  <button 
                    onClick={handleSubmit} disabled={loading}
                    className={`w-full py-4 mt-4 rounded-2xl font-bold text-sm tracking-[0.2em] uppercase transition-all active:scale-95 disabled:opacity-70 ${isPink ? 'text-[#1f2a44] shadow-[0_8px_0px_rgba(0,0,0,0.9)] hover:translate-y-[-1px] bg-gradient-to-r from-pink-300 to-pink-400 border-2 border-[#1f2a44]' : 'text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)] hover:-translate-y-0.5 bg-gradient-to-r from-blue-600 to-blue-500'}`}
                  >
                    {loading ? t('auth.processing') || 'Processing...' : signup ? t('auth.signup_btn') : t('auth.login_btn')}
                  </button>
                </div>

                <div className={`mt-8 pt-8 border-t text-center ${isPink ? 'border-pink-200/70' : 'border-white/5'}`}>
                  <p className={`text-xs font-medium uppercase tracking-widest ${isPink ? 'text-[#7d8ca6]' : 'text-white/40'}`}>
                    {signup ? t('auth.has_account') : t('auth.no_account')}
                    <button 
                      onClick={() => setSignup(!signup)}
                      className={`ml-3 font-bold transition-colors ${isPink ? 'text-pink-500 hover:text-pink-600' : 'text-blue-400 hover:text-blue-300'}`}
                    >
                      {signup ? t('auth.switch_login') : t('auth.switch_signup')}
                    </button>
                  </p>
                </div>

                <button 
                  onClick={() => setShowAccount(false)}
                  className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${isPink ? 'bg-pink-100 text-[#6f7e98] hover:bg-pink-200/70 hover:text-[#1f2a44] border border-pink-200/80' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'}`}
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