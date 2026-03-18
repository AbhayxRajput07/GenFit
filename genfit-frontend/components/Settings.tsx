import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { ViewState, Theme } from '../types';
import {
    LogOut, Palette, User, Shield, Bell, Globe, HardDrive,
    HelpCircle, Info, Check, ChevronLeft, ChevronRight,
    Mail, Lock, Trash2, Download, ExternalLink, MessageSquare,
    Languages, Database, UserCheck, ShieldCheck, Github, Instagram
} from 'lucide-react';
import { logoutUser } from '../services/firebaseAuth';

interface SettingsProps {
    user: any;
    theme: Theme;
    setTheme: (t: Theme) => void;
    setView: (v: ViewState) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, theme, setTheme, setView }) => {
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const { language, setLanguage, t } = useLanguage();
    const handleLogout = async () => { await logoutUser(); setView(ViewState.DASHBOARD); };
    const isBlue = theme === 'blue';

    const themes: { id: Theme; label: string; gradient: string; desc: string }[] = [
        { id: 'pink', label: 'Baby Pink', gradient: 'from-pink-300 to-rose-300', desc: 'Light & warm' },
        { id: 'blue', label: 'Futuristic Blue', gradient: 'from-blue-500 to-cyan-500', desc: 'Navy & sea blue' },
    ];

    const settingsItems = [
        { id: 'account', icon: User, label: t('settings.sections.account'), desc: 'Manage your personal info' },
        { id: 'notifications', icon: Bell, label: t('settings.sections.notifications'), desc: 'Push & email alerts' },
        { id: 'privacy', icon: Shield, label: t('settings.sections.privacy'), desc: 'Passwords & data' },
        { id: 'language', icon: Globe, label: t('settings.sections.language'), desc: language === 'en' ? 'English (US)' : language === 'hi' ? 'Hindi' : 'Spanish' },
        { id: 'data', icon: HardDrive, label: t('settings.sections.data'), desc: 'Cache & exports' },
        { id: 'help', icon: HelpCircle, label: t('settings.sections.help'), desc: 'FAQ & contact us' },
        { id: 'about', icon: Info, label: t('settings.sections.about'), desc: 'Version 1.0.0' },
    ];

    const accent = isBlue ? 'blue' : 'pink';
    const accentColor = isBlue ? 'text-blue-400' : 'text-pink-500';
    const accentBg = isBlue ? 'bg-blue-500/10' : 'bg-pink-50';
    const borderColor = isBlue ? 'border-blue-500/20' : 'border-gray-100';
    const cardBg = isBlue ? 'bg-[#112240]' : 'bg-white';

    const renderDetail = () => {
        switch (activeTab) {
            case 'account':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className={`p-6 rounded-3xl border ${borderColor} ${cardBg} shadow-sm`}>
                            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <UserCheck className={accentColor} size={20} /> Personal Information
                            </h4>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Display Name</span>
                                    <div className={`p-3 rounded-xl border ${borderColor} ${isBlue ? 'bg-[#0a192f]' : 'bg-gray-50'} flex justify-between items-center`}>
                                        <span className="font-semibold">{user?.displayName || "GenFit User"}</span>
                                        <button className={`${accentColor} text-sm font-bold`}>Edit</button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</span>
                                    <div className={`p-3 rounded-xl border ${borderColor} ${isBlue ? 'bg-[#0a192f]' : 'bg-gray-50'}`}>
                                        <span className="font-semibold">{user?.email}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={`p-6 rounded-3xl border border-red-500/20 ${isBlue ? 'bg-red-500/5' : 'bg-red-50'} shadow-sm`}>
                            <h4 className="text-lg font-bold mb-4 text-red-500 flex items-center gap-2">
                                <Trash2 size={20} /> Danger Zone
                            </h4>
                            <p className="text-sm text-gray-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                            <button className="px-6 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors">Delete Account</button>
                        </div>
                    </motion.div>
                );
            case 'notifications':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        {[
                            { label: 'Push Notifications', desc: 'Alerts for workouts and goals', active: true },
                            { label: 'Email Reports', desc: 'Weekly summary of your progress', active: false },
                            { label: 'Social Updates', desc: 'Stay updated with friend activity', active: true },
                            { label: 'Achievement Badges', desc: 'Notify when you unlock new rewards', active: true },
                        ].map((n, i) => (
                            <div key={i} className={`p-4 rounded-2xl border ${borderColor} ${cardBg} flex items-center justify-between`}>
                                <div>
                                    <span className="font-bold block">{n.label}</span>
                                    <span className="text-xs text-gray-400">{n.desc}</span>
                                </div>
                                <div className={`w-12 h-6 rounded-full relative transition-colors ${n.active ? (isBlue ? 'bg-blue-500' : 'bg-pink-500') : 'bg-gray-300'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${n.active ? 'right-1' : 'left-1'}`} />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                );
            case 'privacy':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <div className={`p-6 rounded-3xl border ${borderColor} ${cardBg} shadow-sm`}>
                            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <ShieldCheck className={accentColor} size={20} /> Security Settings
                            </h4>
                            <button className={`w-full flex items-center justify-between p-4 rounded-xl border ${borderColor} hover:${accentBg} transition mb-3`}>
                                <div className="flex items-center gap-3">
                                    <Lock size={18} />
                                    <span className="font-semibold">Change Password</span>
                                </div>
                                <ChevronRight size={18} />
                            </button>
                            <button className={`w-full flex items-center justify-between p-4 rounded-xl border ${borderColor} hover:${accentBg} transition`}>
                                <div className="flex items-center gap-3">
                                    <Mail size={18} />
                                    <span className="font-semibold">Enable 2FA Authentication</span>
                                </div>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                        <div className={`p-4 rounded-2xl border ${borderColor} ${cardBg} flex items-center justify-between`}>
                            <div>
                                <span className="font-bold block">Private Profile</span>
                                <span className="text-xs text-gray-400">Hide your progress from others</span>
                            </div>
                            <div className={`w-12 h-6 rounded-full bg-gray-300 relative`}>
                                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" />
                            </div>
                        </div>
                    </motion.div>
                );
            case 'language':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
                        {[
                            { label: 'English (US)', id: 'en' },
                            { label: 'Hindi', id: 'hi' },
                            { label: 'Spanish', id: 'es' },
                            { label: 'French', id: 'fr' },
                            { label: 'German', id: 'de' },
                        ].map((l, i) => (
                            <button key={i} 
                                onClick={() => setLanguage(l.id as any)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border ${language === l.id ? (isBlue ? 'border-blue-500 bg-blue-500/10' : 'border-pink-500 bg-pink-50 text-pink-500') : borderColor + ' ' + cardBg} transition`}>
                                <span className="font-bold">{l.label}</span>
                                {language === l.id && <Check size={18} />}
                            </button>
                        ))}
                    </motion.div>
                );
            case 'data':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <div className={`p-6 rounded-3xl border ${borderColor} ${cardBg} shadow-sm text-center`}>
                            <Database className={`mx-auto mb-4 ${accentColor}`} size={40} />
                            <h4 className="text-xl font-bold mb-1">Storage Usage</h4>
                            <p className="text-sm text-gray-500 mb-4">12.4 MB of 100 MB used</p>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                                <div className={`h-full ${isBlue ? 'bg-blue-500' : 'bg-pink-500'}`} style={{ width: '12.4%' }} />
                            </div>
                            <button className={`w-full py-3 rounded-xl font-bold border ${borderColor} hover:${accentBg} transition flex items-center justify-center gap-2`}>
                                <Trash2 size={18} /> Clear App Cache
                            </button>
                        </div>
                        <button className={`w-full flex items-center justify-between p-5 rounded-2xl border ${borderColor} ${cardBg} hover:${accentBg} transition`}>
                            <div className="flex items-center gap-3">
                                <Download size={20} className={accentColor} />
                                <div className="text-left">
                                    <span className="font-bold block">Export My Data</span>
                                    <span className="text-xs text-gray-400">Download your stats as JSON/CSV</span>
                                </div>
                            </div>
                            <ChevronRight size={18} />
                        </button>
                    </motion.div>
                );
            case 'help':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <div className={`p-4 rounded-2xl border ${borderColor} ${cardBg} hover:shadow-md transition cursor-pointer`}>
                            <h4 className="font-bold flex items-center gap-2 mb-1">
                                <MessageSquare size={18} className={accentColor} /> Contact Support
                            </h4>
                            <p className="text-xs text-gray-400">Our team is here 24/7 to help you</p>
                        </div>
                        <div className={`p-4 rounded-2xl border ${borderColor} ${cardBg} hover:shadow-md transition cursor-pointer`}>
                            <h4 className="font-bold flex items-center gap-2 mb-1">
                                <ExternalLink size={18} className={accentColor} /> Help Center
                            </h4>
                            <p className="text-xs text-gray-400">Read our guides and documentation</p>
                        </div>
                        <div className="mt-8">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Frequently Asked Questions</h4>
                            <div className="space-y-3">
                                {['How to track workouts?', 'Resetting my password?', 'Syncing with Apple Health?'].map((q, i) => (
                                    <div key={i} className={`p-4 rounded-xl border ${borderColor} ${cardBg} text-sm font-semibold`}>
                                        {q}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );
            case 'about':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center space-y-6">
                        <div className={`w-28 h-28 mx-auto rounded-[2.5rem] ${isBlue ? 'bg-gradient-to-br from-blue-600 to-cyan-500 shadow-blue-500/30' : 'bg-gradient-to-br from-pink-500 to-rose-400 shadow-pink-500/30'} shadow-2xl flex items-center justify-center p-6 mb-2`}>
                            <img src="/logo-icon.png" alt="GenFit" className="w-full h-full object-contain filter brightness-0 invert" 
                                 onError={(e) => {
                                     (e.target as HTMLImageElement).style.display = 'none';
                                     (e.target as any).parentNode.innerHTML = '<span class="text-white text-4xl font-black">G</span>';
                                 }} 
                            />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black">GenFit</h3>
                            <p className="text-gray-400 font-medium">Elevate Your Life. Every Step Counts.</p>
                        </div>
                        <div className={`p-4 rounded-2xl border ${borderColor} ${cardBg} inline-block px-8`}>
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-1">Version</span>
                            <span className="font-bold text-lg">1.0.0 (Build 240315)</span>
                        </div>
                        <div className="flex justify-center gap-6 pt-4">
                            <a href="https://github.com/AbhayxRajput07" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors">
                                <Github size={24} />
                            </a>
                            <a href="https://instagram.com/yourusername" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
                                <Instagram size={24} />
                            </a>
                            <a href="mailto:rajput.abhay1713@gmail.com" className="text-gray-400 hover:text-red-500 transition-colors">
                                <Mail size={24} />
                            </a>
                        </div>
                        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-tighter">
                            Designed & Engineered with ❤️ by the GenFit Team
                        </p>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`w-full min-h-screen p-6 md:p-12 transition-colors duration-500 ${isBlue ? 'bg-[#0a192f] text-white' : 'bg-gradient-to-br from-white via-rose-50 to-pink-100 text-black'}`}>
            <div className="max-w-4xl mx-auto">
                <AnimatePresence mode="wait">
                    {!activeTab ? (
                        <motion.div key="main" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-4xl font-extrabold tracking-tight">{t('settings.title')}</h2>
                                    <p className={`mt-2 text-lg ${isBlue ? 'text-gray-400' : 'text-gray-500'}`}>{t('settings.subtitle')}</p>
                                </div>
                                <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl border ${borderColor} ${cardBg} shadow-sm`}>
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${isBlue ? 'bg-blue-500 shadow-blue-500/50' : 'bg-pink-500 shadow-pink-500/50'}`} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">System Live</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-2 space-y-6">
                                    {/* Theme Picker */}
                                    <div className={`p-8 rounded-3xl shadow-lg border ${isBlue ? 'bg-[#112240] border-blue-500/20' : 'bg-white border-black/20'}`}>
                                        <h3 className="font-bold flex items-center gap-3 mb-6 text-xl">
                                            <Palette className={isBlue ? 'text-blue-400' : 'text-pink-500'} /> App Theme
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {themes.map(th => (
                                                <button key={th.id} onClick={() => setTheme(th.id)}
                                                    className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 relative ${theme === th.id
                                                        ? (isBlue ? 'border-blue-500 bg-blue-500/10 shadow-lg' : 'border-pink-400 bg-pink-50 shadow-lg')
                                                        : (isBlue ? 'border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5' : 'border-gray-200 hover:border-pink-200 hover:bg-pink-50/50')}`}>
                                                    {theme === th.id && (
                                                        <motion.div layoutId="check" className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${isBlue ? 'bg-blue-500' : 'bg-pink-500'}`}>
                                                            <Check className="w-4 h-4 text-white" />
                                                        </motion.div>
                                                    )}
                                                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${th.gradient} shadow-md border border-white/30`}></div>
                                                    <span className="font-semibold">{th.label}</span>
                                                    <span className={`text-xs ${isBlue ? 'text-gray-500' : 'text-gray-400'}`}>{th.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Settings List */}
                                    <div className={`p-6 rounded-3xl shadow-lg border space-y-1 ${isBlue ? 'bg-[#112240] border-blue-500/20' : 'bg-white border-black/20'}`}>
                                        {settingsItems.map((item, idx) => {
                                            const Icon = item.icon;
                                            return (
                                                <button key={idx} onClick={() => setActiveTab(item.id)} className={`w-full group flex items-center justify-between p-4 rounded-2xl transition-all ${isBlue ? 'hover:bg-blue-500/10' : 'hover:bg-pink-50'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-3 rounded-xl transition-all ${isBlue ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white shadow-blue-500/0 group-hover:shadow-blue-500/40' : 'bg-pink-50 text-pink-500 group-hover:bg-pink-500 group-hover:text-white group-hover:shadow-pink-500/40'} group-hover:shadow-xl`}>
                                                            <Icon size={20} />
                                                        </div>
                                                        <div className="text-left">
                                                            <span className="font-bold block text-lg">{item.label}</span>
                                                            <span className={`text-xs ${isBlue ? 'text-gray-500' : 'text-gray-400'}`}>{item.desc}</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className={`transition-transform group-hover:translate-x-1 ${isBlue ? 'text-gray-500' : 'text-gray-400'}`} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Account Panel */}
                                <div className="space-y-6">
                                    <div className={`p-8 rounded-3xl shadow-lg border flex flex-col items-center text-center ${isBlue ? 'bg-[#112240] border-blue-500/20' : 'bg-white border-black/20'}`}>
                                        <div className={`w-24 h-24 rounded-full mb-4 overflow-hidden shadow-inner p-1 ${isBlue ? 'bg-gradient-to-tr from-blue-500 to-cyan-500' : 'bg-gradient-to-tr from-pink-300 to-rose-300'}`}>
                                            <div className={`w-full h-full rounded-full overflow-hidden ${isBlue ? 'bg-[#0a192f]' : 'bg-white'}`}>
                                                {user ? (
                                                    <img src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${user?.name || user?.email || 'user'}`} alt="avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className={`w-full h-full p-6 ${isBlue ? 'text-gray-600' : 'text-gray-300'}`} />
                                                )}
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold">{user ? user.name || "GenFit User" : "Not Logged In"}</h3>
                                        {user && <p className={`text-sm mb-6 ${isBlue ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>}
                                        {user && (
                                            <button onClick={handleLogout}
                                                className="w-full py-4 px-4 rounded-2xl font-black flex items-center justify-center gap-2 transition border bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:shadow-lg active:scale-95">
                                                <LogOut className="w-5 h-5" /> Sign Out
                                            </button>
                                        )}
                                    </div>
                                    <div className={`p-6 rounded-3xl shadow-lg border ${isBlue ? 'bg-gradient-to-br from-blue-600 to-cyan-700 border-none' : 'bg-gradient-to-br from-pink-500 to-rose-600 border-none'} text-white`}>
                                        <h4 className="font-black text-lg mb-2">GenFit Pro</h4>
                                        <p className="text-sm opacity-80 mb-6">Unlock advanced blueprint analysis and AI nutrition coaching.</p>
                                        <button className="w-full py-3 rounded-2xl bg-white text-black font-black text-sm shadow-xl active:scale-95 transition-transform">Upgrade Now</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                            <button onClick={() => setActiveTab(null)} className={`flex items-center gap-2 font-bold mb-4 opacity-60 hover:opacity-100 transition-opacity`}>
                                <ChevronLeft size={20} /> Back to Settings
                            </button>
                            <div>
                                <h2 className="text-4xl font-extrabold tracking-tight">
                                    {settingsItems.find(i => i.id === activeTab)?.label}
                                </h2>
                                <p className={`mt-2 text-lg ${isBlue ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {settingsItems.find(i => i.id === activeTab)?.desc}
                                </p>
                            </div>
                            <div className="max-w-2xl">
                                {renderDetail()}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Settings;
