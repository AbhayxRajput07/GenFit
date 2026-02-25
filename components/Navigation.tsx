import React, { useState } from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Utensils, Activity, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { signupUser, loginUser, logoutUser } from '../services/firebaseAuth';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  user: any;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, user }) => {
  const [showAccount, setShowAccount] = useState(false);
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const navItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewState.ACTIVITY, label: 'Activity', icon: Activity },
    { id: ViewState.NUTRITION, label: 'Nutrition', icon: Utensils },
    { id: ViewState.COACH, label: 'AI Coach', icon: Bot },
  ];

  const handleSubmit = async () => {
    if (!email || !password) return alert("Enter email & password");

    try {
      setLoading(true);

      if (signup) {
        await signupUser(email, password);
        alert("Account created!");
      } else {
        await loginUser(email, password);
        alert("Logged in!");
      }

      setShowAccount(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <nav className="hidden md:flex flex-col w-72 bg-[#fdf6f0] border-r border-black/20 h-screen sticky top-0 p-6">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 rounded-xl bg-pink-200 border border-black/20 flex items-center justify-center shadow-md">
            <Activity className="text-black w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-black">Genfit</h1>
        </div>

        {/* NAV ITEMS */}
        <div className="space-y-4 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl border border-black/20 transition ${
                  isActive
                    ? 'bg-pink-200 text-black shadow-md'
                    : 'bg-white text-gray-700 hover:bg-[#f8eaea]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* ACCOUNT BUTTON */}
        {user ? (
          <button
            onClick={logoutUser}
            className="w-full py-3 rounded-xl bg-red-200 border border-black/20 font-semibold"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => setShowAccount(true)}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-[#fff0f5] border border-black/20 shadow-sm"
          >
            <User className="w-5 h-5" />
            <span className="font-medium text-black">Account</span>
          </button>
        )}
      </nav>

      {/* ACCOUNT MODAL */}
      <AnimatePresence>
        {showAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-10 w-[400px] shadow-2xl border border-black/20 relative"
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                {signup ? 'Create Account' : 'Login'}
              </h2>

              <div className="space-y-4">

                {signup && (
                  <input
                    placeholder="Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full border border-black/20 rounded-xl px-4 py-3 text-black"
                  />
                )}

                <input
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-black/20 rounded-xl px-4 py-3 text-black"
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-black/20 rounded-xl px-4 py-3 text-black"
                />

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-pink-200 border border-black/20 font-semibold hover:bg-pink-300 transition"
                >
                  {loading ? 'Please wait...' : signup ? 'Sign Up' : 'Login'}
                </button>
              </div>

              <p className="text-center text-sm mt-4 text-black">
                {signup ? (
                  <>
                    Already have account?{' '}
                    <span
                      onClick={() => setSignup(false)}
                      className="text-pink-500 cursor-pointer font-semibold"
                    >
                      Login
                    </span>
                  </>
                ) : (
                  <>
                    Don’t have account?{' '}
                    <span
                      onClick={() => setSignup(true)}
                      className="text-pink-500 cursor-pointer font-semibold"
                    >
                      Sign Up
                    </span>
                  </>
                )}
              </p>

              <button
                onClick={() => setShowAccount(false)}
                className="absolute top-4 right-6 text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;