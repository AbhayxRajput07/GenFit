import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { ViewState, Theme } from '../types';
import {
    LogOut, Palette, User, Shield, Bell, Globe, HardDrive,
    HelpCircle, Info, Check, ChevronLeft, ChevronRight,
    Mail, Lock, Trash2, Download, ExternalLink, MessageSquare,
    Database, UserCheck, ShieldCheck, Github, Instagram, Zap, Settings as SettingsIcon, Crown
} from 'lucide-react';
import { logoutUser } from '../services/firebaseAuth';

interface SettingsProps {
    user: any;
    theme: Theme;
    setTheme: (t: Theme) => void;
    setView: (v: ViewState) => void;
    onLogout?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, theme, setTheme, setView, onLogout }) => {
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const { language, setLanguage, t } = useLanguage();
    const handleLogout = async () => {
        await logoutUser();
        onLogout?.();
    };
    const isPink = theme === 'pink';

    const themes: { id: Theme; label: string; gradient: string; desc: string }[] = [
        { id: 'pink', label: 'Baby Pink', gradient: 'from-rose-300 to-pink-400', desc: 'Light & warm' },
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

    const renderDetail = () => {
        switch (activeTab) {
            case 'account':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="p-8 rounded-[2rem] border border-white/5 bg-[#030303] shadow-lg">
                            <h4 className="text-lg font-medium mb-6 flex items-center gap-3 text-white">
                                <UserCheck className="text-blue-400" size={24} /> Personal Information
                            </h4>
                            <div className="space-y-6">
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-2">Display Name</span>
                                    <div className="p-4 rounded-xl border border-white/5 bg-[#050505] flex justify-between items-center transition-all hover:bg-white/5 cursor-pointer group">
                                        <span className="font-semibold text-white tracking-wide">{user?.displayName || "GenFit User"}</span>
                                        <button className="text-[10px] uppercase tracking-widest text-white/30 font-bold group-hover:text-blue-400 transition-colors">Edit</button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-2">Email Address</span>
                                    <div className="p-4 rounded-xl border border-white/5 bg-[#050505]">
                                        <span className="font-semibold text-white tracking-wide">{user?.email || "user@genfit.app"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 rounded-[2rem] border border-rose-500/10 bg-rose-500/5 shadow-lg">
                            <h4 className="text-lg font-medium mb-4 text-rose-500 flex items-center gap-3">
                                <Trash2 size={24} /> Danger Zone
                            </h4>
                            <p className="text-sm text-white/40 font-light leading-relaxed mb-6">Once you delete your account, there is no going back. Please be certain. All telemetry and biometric data will be permanently wiped from the servers.</p>
                            <button className="px-6 py-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 font-bold text-[11px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                                Terminate Account
                            </button>
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
                            <div key={i} className={`p-6 rounded-[1.5rem] border transition-all ${n.active ? 'border-white/10 bg-[#050505]' : 'border-white/5 bg-[#030303]'} flex items-center justify-between group`}>
                                <div>
                                    <span className="font-medium text-white tracking-wide block mb-1">{n.label}</span>
                                    <span className="text-xs text-white/40 font-light tracking-wide">{n.desc}</span>
                                </div>
                                <div className={`w-12 h-6 rounded-full relative transition-colors ${n.active ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/10'} cursor-pointer`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${n.active ? 'right-1' : 'left-1'}`} />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                );
            case 'privacy':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="p-8 rounded-[2rem] border border-white/5 bg-[#030303] shadow-lg">
                            <h4 className="text-lg font-medium mb-6 flex items-center gap-3 text-white">
                                <ShieldCheck className="text-blue-400" size={24} /> Security Matrix
                            </h4>
                            <button className="w-full flex items-center justify-between p-5 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-[#050505] transition-all mb-4 group">
                                <div className="flex items-center gap-4">
                                    <Lock size={20} className="text-white/50 group-hover:text-blue-400 transition-colors" />
                                    <span className="font-semibold text-white tracking-wide">Change Password</span>
                                </div>
                                <ChevronRight size={18} className="text-white/20 group-hover:text-white/60 transition-colors" />
                            </button>
                            <button className="w-full flex items-center justify-between p-5 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-[#050505] transition-all group">
                                <div className="flex items-center gap-4">
                                    <Mail size={20} className="text-white/50 group-hover:text-blue-400 transition-colors" />
                                    <span className="font-semibold text-white tracking-wide">Enable 2FA Authentication</span>
                                </div>
                                <ChevronRight size={18} className="text-white/20 group-hover:text-white/60 transition-colors" />
                            </button>
                        </div>
                        <div className="p-6 rounded-[1.5rem] border border-white/5 bg-[#030303] flex items-center justify-between">
                            <div>
                                <span className="font-medium text-white tracking-wide block mb-1">Private Profile</span>
                                <span className="text-xs text-white/40 font-light">Hide your progress telemetry from the global network</span>
                            </div>
                            <div className="w-12 h-6 rounded-full bg-white/10 relative cursor-pointer">
                                <div className="absolute top-1 left-1 w-4 h-4 bg-white/50 rounded-full" />
                            </div>
                        </div>
                    </motion.div>
                );
            case 'language':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        {[
                            { label: 'English (US)', id: 'en' },
                            { label: 'Hindi', id: 'hi' },
                            { label: 'Spanish', id: 'es' },
                            { label: 'French', id: 'fr' },
                            { label: 'German', id: 'de' },
                        ].map((l, i) => (
                            <button key={i} 
                                onClick={() => setLanguage(l.id as any)}
                                className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] border transition-all ${language === l.id ? 'border-blue-500/50 bg-blue-500/10 text-white shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-white/5 bg-[#030303] text-white/60 hover:text-white hover:bg-white/5'}`}>
                                <span className={`font-medium tracking-wide ${language === l.id ? 'font-bold' : ''}`}>{l.label}</span>
                                {language === l.id && <Check size={20} className="text-blue-400" />}
                            </button>
                        ))}
                    </motion.div>
                );
            case 'data':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="p-8 rounded-[2rem] border border-white/5 bg-[#030303] shadow-lg text-center relative overflow-hidden">
                            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
                            <div className="relative z-10">
                                <Database className="mx-auto mb-5 text-blue-400 drop-shadow-lg" size={48} />
                                <h4 className="text-2xl font-medium tracking-tight text-white mb-2">Storage Usage</h4>
                                <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-6">12.4 MB allocated</p>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-8 shadow-inner">
                                    <div className="h-full bg-gradient-to-r from-blue-600 to-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]" style={{ width: '12.4%' }} />
                                </div>
                                <button className="w-full py-4 rounded-xl font-bold border border-white/5 bg-[#050505] text-white/60 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest active:scale-95">
                                    <Trash2 size={16} /> Clear App Cache
                                </button>
                            </div>
                        </div>
                        <button className="w-full flex items-center justify-between p-6 rounded-[2rem] border border-white/5 bg-[#030303] hover:bg-[#050505] hover:border-white/10 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 transition-transform">
                                    <Download size={22} className="text-blue-400" />
                                </div>
                                <div className="text-left">
                                    <span className="font-medium text-white block mb-1">Export Telemetry Data</span>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/30">Download stats as JSON/CSV</span>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-white/20 group-hover:text-white/60 transition-colors" />
                        </button>
                    </motion.div>
                );
            case 'help':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <div className="p-6 rounded-[1.5rem] border border-white/5 bg-[#030303] hover:border-white/10 hover:bg-[#050505] transition-all cursor-pointer group">
                            <h4 className="font-medium flex items-center gap-3 mb-2 text-white">
                                <MessageSquare size={20} className="text-blue-400 group-hover:scale-110 transition-transform" /> Contact Support
                            </h4>
                            <p className="text-xs text-white/40 font-light ml-8">Our core team is here 24/7 to resolve technical anomalies.</p>
                        </div>
                        <div className="p-6 rounded-[1.5rem] border border-white/5 bg-[#030303] hover:border-white/10 hover:bg-[#050505] transition-all cursor-pointer group">
                            <h4 className="font-medium flex items-center gap-3 mb-2 text-white">
                                <ExternalLink size={20} className="text-blue-400 group-hover:scale-110 transition-transform" /> Documentation Center
                            </h4>
                            <p className="text-xs text-white/40 font-light ml-8">Review system guides and advanced metric manuals.</p>
                        </div>
                        <div className="mt-10">
                            <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-5 px-2">Knowledge Base Core</h4>
                            <div className="space-y-3">
                                {['How to calibrate workouts?', 'Resetting biometric profiles?', 'Syncing external data sources?'].map((q, i) => (
                                    <div key={i} className="p-5 rounded-[1.5rem] border border-white/5 bg-[#050505] text-sm font-medium tracking-wide text-white/80 hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer flex justify-between items-center group">
                                        {q}
                                        <ChevronRight size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );
            case 'about':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center space-y-8 py-4">
                        <div className="relative mx-auto w-32 h-32 group">
                            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full group-hover:bg-blue-500/30 transition-colors" />
                            <div className="w-full h-full rounded-[2.5rem] bg-[#050505] border border-white/10 shadow-2xl flex items-center justify-center p-6 relative z-10 transition-transform group-hover:scale-105 duration-500">
                                <Zap className="w-full h-full text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] fill-blue-500/20" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black tracking-tight text-white mb-2 tracking-[0.1em]">GENFIT<span className="text-blue-500 text-5xl">.</span></h3>
                            <p className="text-white/40 font-light tracking-widest uppercase text-xs">Maximum Potential Unlocked</p>
                        </div>
                        <div className="p-5 rounded-2xl border border-white/5 bg-[#030303] inline-block px-10">
                            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 block mb-2">Build Configuration</span>
                            <span className="font-bold text-lg text-white tracking-wide">v2.0.0-beta</span>
                        </div>
                        <div className="flex justify-center gap-8 pt-6">
                            <a href="https://github.com/AbhayxRajput07" target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl border border-white/5 bg-[#030303] text-white/40 hover:text-white hover:border-white/20 hover:scale-110 transition-all">
                                <Github size={20} />
                            </a>
                            <a href="https://instagram.com/yourusername" target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl border border-white/5 bg-[#030303] text-white/40 hover:text-sky-400 hover:border-sky-500/30 hover:scale-110 transition-all shadow-none hover:shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                                <Instagram size={20} />
                            </a>
                            <a href="mailto:rajput.abhay1713@gmail.com" className="p-3 rounded-xl border border-white/5 bg-[#030303] text-white/40 hover:text-rose-400 hover:border-rose-500/30 hover:scale-110 transition-all shadow-none hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                                <Mail size={20} />
                            </a>
                        </div>
                        <p className="text-[9px] text-white/20 font-bold uppercase tracking-[0.2em] pt-4">
                            System Engineered by Abhay Rajput
                        </p>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`w-full min-h-screen px-4 md:px-8 lg:px-12 py-8 md:py-12 overflow-x-hidden pb-20 ${isPink ? 'bg-[#f6edf2] text-[#1f2a44] selection:bg-pink-200/70' : 'bg-[#010101] text-white selection:bg-blue-500/30'}`}>
            {/* ── Ambient Glow ── */}
            <div className={`fixed top-[-20%] right-[-10%] w-[50vw] h-[50vw] blur-[150px] rounded-full pointer-events-none ${isPink ? 'bg-pink-300/25' : 'bg-blue-600/10'}`} />
            <div className={`fixed bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] blur-[150px] rounded-full pointer-events-none ${isPink ? 'bg-rose-300/20' : 'bg-sky-600/5'}`} />

            <div className="max-w-6xl mx-auto relative z-10">
                <AnimatePresence mode="wait">
                    {!activeTab ? (
                        <motion.div key="main" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
                            <div className="flex justify-between items-end mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl shadow-lg hidden md:block ${isPink ? 'bg-white border border-pink-200/80' : 'bg-[#030303] border border-white/10'}`}>
                                        <SettingsIcon size={24} className={isPink ? 'text-pink-500' : 'text-white'} />
                                    </div>
                                    <div>
                                        <h2 className={`text-4xl md:text-5xl font-medium tracking-tight mb-2 ${isPink ? 'text-black' : 'text-white'}`}>{t('settings.title')}</h2>
                                        <p className={`text-sm font-light tracking-wide ${isPink ? 'text-[#5f6d87]' : 'text-white/50'}`}>{t('settings.subtitle')}</p>
                                    </div>
                                </div>
                                <div className={`hidden lg:flex items-center gap-3 px-4 py-2.5 rounded-xl border ${isPink ? 'border-pink-200/80 bg-white' : 'border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.05)]'}`}>
                                    <div className={`w-2 h-2 rounded-full ${isPink ? 'bg-pink-400' : 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]'}`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isPink ? 'text-[#8c98ae]' : 'text-emerald-400/80'}`}>System Live</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Theme Picker */}
                                    <div className={`p-8 md:p-10 rounded-[2.5rem] shadow-2xl border relative overflow-hidden ${isPink ? 'bg-white border-[#e8d4dd] shadow-[0_12px_28px_rgba(225,178,199,0.2)]' : 'border-white/5 bg-[#030303]'}`}>
                                        <div className={`absolute top-0 right-0 p-10 pointer-events-none ${isPink ? 'opacity-10 text-pink-300' : 'opacity-5'}`}>
                                            <Palette size={120} />
                                        </div>
                                        <h3 className={`font-medium tracking-tight flex items-center gap-3 mb-8 text-2xl relative z-10 ${isPink ? 'text-black' : 'text-white'}`}>
                                            <Palette className={isPink ? 'text-pink-500' : 'text-blue-400'} size={24} /> App Theme
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
                                            {themes.map(th => (
                                                <button
                                                    key={th.id}
                                                    onClick={() => setTheme(th.id)}
                                                    className={`p-6 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-4 relative text-left ${theme === th.id
                                                        ? th.id === 'pink'
                                                            ? (isPink ? 'border-pink-400 bg-pink-50 shadow-[0_10px_22px_rgba(236,72,153,0.15)]' : 'border-rose-300/50 bg-rose-300/10 shadow-[0_0_30px_rgba(244,114,182,0.15)]')
                                                            : 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                                                        : (isPink ? 'border-[#e8d4dd] bg-white hover:border-pink-200 hover:bg-pink-50' : 'border-white/10 bg-[#050505] hover:border-white/20 hover:bg-white/[0.03]')
                                                    }`}
                                                >
                                                    {theme === th.id && (
                                                        <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center ${th.id === 'pink' ? 'bg-rose-400 shadow-[0_0_10px_rgba(244,114,182,0.5)]' : (isPink ? 'bg-blue-500 shadow-none' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]')}`}>
                                                            <Check className="w-3.5 h-3.5 text-white" />
                                                        </div>
                                                    )}
                                                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${th.gradient} ${th.id === 'pink' ? 'shadow-[0_0_20px_rgba(244,114,182,0.3)]' : 'shadow-[0_0_20px_rgba(56,189,248,0.3)]'} border-2 border-white/20`}></div>
                                                    <div className="text-center">
                                                        <span className={`font-bold block mb-1 tracking-wide ${isPink ? 'text-black' : 'text-white'}`}>{th.label}</span>
                                                        <span className={`text-[10px] uppercase font-bold tracking-widest ${isPink ? 'text-[#7f8ca3]' : (theme === th.id ? 'text-white/70' : 'text-white/50')}`}>{th.desc}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Settings List */}
                                    <div className={`p-6 md:p-8 rounded-[2.5rem] shadow-2xl border space-y-2 ${isPink ? 'bg-white border-[#e8d4dd] shadow-[0_12px_28px_rgba(225,178,199,0.2)]' : 'border-white/5 bg-[#030303]'}`}>
                                        {settingsItems.map((item, idx) => {
                                            const Icon = item.icon;
                                            return (
                                                <button key={idx} onClick={() => setActiveTab(item.id)} className={`w-full group flex items-center justify-between p-5 rounded-[1.5rem] transition-all border border-transparent ${isPink ? 'hover:bg-pink-50 hover:border-pink-100' : 'hover:bg-white/[0.03] hover:border-white/10'}`}>
                                                    <div className="flex items-center gap-5">
                                                        <div className={`p-3.5 rounded-xl transition-all border shadow-lg ${isPink ? 'border-pink-100 bg-pink-50 group-hover:bg-pink-100 group-hover:border-pink-200 group-hover:text-pink-500 text-pink-400' : 'border-white/5 bg-[#050505] group-hover:bg-blue-500/10 group-hover:border-blue-500/30 group-hover:text-blue-400 text-white/70'}`}>
                                                            <Icon size={20} />
                                                        </div>
                                                        <div className="text-left">
                                                            <span className={`font-medium tracking-wide block text-lg mb-0.5 ${isPink ? 'text-black' : 'text-white'}`}>{item.label}</span>
                                                            <span className={`text-[11px] font-bold uppercase tracking-widest ${isPink ? 'text-[#9aa7bd]' : 'text-white/30'}`}>{item.desc}</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className={`transition-transform group-hover:translate-x-1 ${isPink ? 'text-[#9aa7bd] group-hover:text-[#7f8ca3]' : 'text-white/20 group-hover:text-white/60'}`} size={20} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Account Panel */}
                                <div className="space-y-8">
                                    <div className={`p-10 rounded-[2.5rem] shadow-2xl border flex flex-col items-center text-center relative overflow-hidden group ${isPink ? 'bg-white border-[#e8d4dd] shadow-[0_12px_28px_rgba(225,178,199,0.2)]' : 'border-white/5 bg-[#030303]'}`}>
                                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl pointer-events-none ${isPink ? 'bg-pink-300/15' : 'bg-blue-500/5'}`} />
                                        <div className="relative z-10 w-full flex flex-col items-center">
                                            <div className={`w-28 h-28 rounded-full mb-6 overflow-hidden p-1.5 border shadow-[0_0_30px_rgba(0,0,0,0.08)] ${isPink ? 'bg-pink-50 border-pink-200/80' : 'bg-[#050505] border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]'}`}>
                                                <div className={`w-full h-full rounded-full overflow-hidden border ${isPink ? 'bg-white border-pink-200/70' : 'bg-[#030303] border-white/10'}`}>
                                                    {user ? (
                                                        <img src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${user?.name || user?.email || 'user'}`} alt="avatar" className="w-full h-full object-cover filter saturate-150" />
                                                    ) : (
                                                        <User className={`w-full h-full p-6 ${isPink ? 'text-pink-300' : 'text-white/20'}`} />
                                                    )}
                                                </div>
                                            </div>
                                            <h3 className={`text-2xl font-medium tracking-tight mb-1 ${isPink ? 'text-black' : 'text-white'}`}>{user ? user.displayName || "GenFit User" : "Offline"}</h3>
                                            {user && <p className={`text-xs font-light tracking-widest mb-8 ${isPink ? 'text-[#6f7e98]' : 'text-white/40'}`}>{user.email}</p>}
                                            {user && (
                                                <button onClick={handleLogout}
                                                    className={`w-full py-4 rounded-[1.5rem] font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 ${isPink ? 'border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white' : 'border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500 hover:text-white hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]'}`}>
                                                    <LogOut className="w-4 h-4" /> Sign Out
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className={`p-8 rounded-[2.5rem] border text-white relative overflow-hidden ${isPink ? 'shadow-[0_12px_30px_rgba(236,72,153,0.25)] border-pink-300/50 bg-gradient-to-br from-pink-500 to-rose-500' : 'shadow-[0_0_40px_rgba(59,130,246,0.15)] border-blue-400/30 bg-gradient-to-br from-blue-900/40 to-[#030303]'}`}>
                                        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full ${isPink ? 'bg-pink-200/35' : 'bg-sky-500/20'}`} />
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Crown size={20} className="text-amber-400" />
                                                <h4 className="font-bold text-xl tracking-tight text-white">GenFit <span className={isPink ? 'text-white/90' : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500'}>PRO</span></h4>
                                            </div>
                                            <p className={`text-[13px] font-light mb-6 leading-relaxed ${isPink ? 'text-white/90' : 'text-white/60'}`}>
                                                Unlock maximum biometric analysis and unrestricted AI coaching capabilities.
                                            </p>
                                            <button className={`w-full py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all ${isPink ? 'bg-white text-black shadow-[0_8px_20px_rgba(0,0,0,0.2)] hover:bg-pink-50' : 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-gray-100'}`}>
                                                Upgrade Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 max-w-4xl mx-auto">
                            <button onClick={() => setActiveTab(null)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors mb-2 border border-transparent hover:border-white/10 py-2 px-3 rounded-lg hover:bg-white/5">
                                <ChevronLeft size={16} /> Return to Main Menu
                            </button>
                            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                    {React.createElement(settingsItems.find(i => i.id === activeTab)?.icon || SettingsIcon, { size: 28, className: "text-blue-400" })}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-medium tracking-tight text-white mb-1">
                                        {settingsItems.find(i => i.id === activeTab)?.label}
                                    </h2>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">
                                        {settingsItems.find(i => i.id === activeTab)?.desc}
                                    </p>
                                </div>
                            </div>
                            <div className="max-w-3xl">
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
