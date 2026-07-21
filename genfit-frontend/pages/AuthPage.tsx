import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { signupUser, loginUser, signInWithGoogle } from '../services/firebaseAuth';

type AuthPageProps = {
  onAuthenticated: () => void;
  onBackToLanding: () => void;
};

const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated, onBackToLanding }) => {
  const { t } = useLanguage();
  const [signup, setSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return alert(t('auth.errors.auth_fail'));
    if (signup && !name.trim()) return alert(t('auth.errors.enter_name'));

    try {
      setLoading(true);
      if (signup) {
        await signupUser(name.trim(), email, password);
        alert(t('auth.errors.account_created'));
      } else {
        await loginUser(email, password);
        alert(t('auth.errors.logged_in'));
      }

      onAuthenticated();
    } catch (err: any) {
      alert(err.message || t('auth.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      alert(t('auth.errors.logged_in'));
      onAuthenticated();
    } catch (err: any) {
      alert(err.message || t('auth.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#010101] text-white px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md relative overflow-hidden rounded-[2.5rem] p-10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10 bg-[#050505]">
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] bg-blue-600/20" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full blur-[100px] bg-sky-600/10" />

        <div className="relative z-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)] bg-blue-500/10 border border-blue-500/30">
              <span className="text-blue-400 text-2xl font-bold">G</span>
            </div>
            <h1 className="text-3xl font-medium tracking-tighter text-white">
              {signup ? t('auth.join') : t('auth.welcome')}
            </h1>
            <p className="font-light mt-3 text-sm tracking-wide text-white/50">
              {signup ? t('auth.signup_desc') : t('auth.login_desc')}
            </p>
          </div>

          <div className="mb-8 p-1 rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setSignup(false)}
                className={`py-3 rounded-xl text-sm font-bold transition-all ${!signup ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'}`}
              >
                {t('auth.switch_login')}
              </button>
              <button
                type="button"
                onClick={() => setSignup(true)}
                className={`py-3 rounded-xl text-sm font-bold transition-all ${signup ? 'bg-blue-600 text-white' : 'text-white/60 hover:bg-white/5'}`}
              >
                {t('auth.switch_signup')}
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {signup && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 ml-1 text-white/40">{t('auth.full_name')}</label>
                <input
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-2xl px-5 py-4 font-medium focus:outline-none transition-all bg-white/[0.03] border-white/10 text-white placeholder-white/20 focus:border-blue-500/50 focus:bg-white/[0.05]"
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 ml-1 text-white/40">{t('auth.email')}</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-2xl px-5 py-4 font-medium focus:outline-none transition-all bg-white/[0.03] border-white/10 text-white placeholder-white/20 focus:border-blue-500/50 focus:bg-white/[0.05]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 ml-1 text-white/40">{t('auth.password')}</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-2xl px-5 py-4 font-medium focus:outline-none transition-all bg-white/[0.03] border-white/10 text-white placeholder-white/20 focus:border-blue-500/50 focus:bg-white/[0.05]"
              />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-sm tracking-[0.16em] uppercase transition-all active:scale-95 disabled:opacity-70 border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
            >
              {loading ? t('auth.processing') || 'Processing...' : 'Sign in with Google'}
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 mt-4 rounded-2xl font-bold text-sm tracking-[0.2em] uppercase transition-all active:scale-95 disabled:opacity-70 text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)] hover:-translate-y-0.5 bg-gradient-to-r from-blue-600 to-blue-500"
            >
              {loading ? t('auth.processing') || 'Processing...' : signup ? t('auth.signup_btn') : t('auth.login_btn')}
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-white/40">
              {signup ? t('auth.has_account') : t('auth.no_account')}
              <button
                onClick={() => setSignup(!signup)}
                className="ml-3 font-bold transition-colors text-blue-400 hover:text-blue-300"
              >
                {signup ? t('auth.switch_login') : t('auth.switch_signup')}
              </button>
            </p>
            <button
              type="button"
              onClick={onBackToLanding}
              className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors"
            >
              Back to Landing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;