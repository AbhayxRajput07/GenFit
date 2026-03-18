import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Square, Navigation, Zap, Radio, Target, 
  Settings, Wifi, ShieldCheck, Activity, Cpu, Clock
} from 'lucide-react';
import { Theme } from '../types';

interface GeolocationTrackerProps {
  onSessionComplete: (distance: number, calories: number, duration: number) => void;
  theme: Theme;
}

const GeolocationTracker: React.FC<GeolocationTrackerProps> = ({ onSessionComplete, theme }) => {
    const [isTracking, setIsTracking] = useState(false);
    const [distance, setDistance] = useState(0); 
    const [duration, setDuration] = useState(0); 
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [signalStrength, setSignalStrength] = useState(0);
    const watchId = useRef<number | null>(null);
    const lastPosition = useRef<{ lat: number, lng: number } | null>(null);
    const timerInterval = useRef<NodeJS.Timeout | null>(null);
    
    const isBlue = theme === 'blue';

    const themeStyles = useMemo(() => {
        if (isBlue) return {
            accent: 'text-indigo-400',
            border: 'border-indigo-500/30',
            bg: 'bg-slate-900/40',
            glow: 'shadow-[0_0_20px_rgba(79,70,229,0.3)]',
            progress: 'bg-indigo-500'
        };
        return {
            accent: 'text-rose-600',
            border: 'border-rose-900/30',
            bg: 'bg-white',
            glow: 'shadow-[0_0_20px_rgba(219,39,119,0.15)]',
            progress: 'bg-rose-600'
        };
    }, [isBlue]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
            if (timerInterval.current) clearInterval(timerInterval.current);
        };
    }, []);

    const startTracking = () => {
        if (!navigator.geolocation) {
            setPermissionError("GPS_HARDWARE_NOT_FOUND");
            return;
        }

        setPermissionError(null);
        setIsTracking(true);
        setDistance(0);
        setDuration(0);

        timerInterval.current = setInterval(() => {
            if (!isMounted.current) return;
            setDuration(prev => prev + 1);
            setSignalStrength(Math.floor(Math.random() * 40) + 60);
        }, 1000);

        watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
                if (!isMounted.current) return;
                const { latitude: lat, longitude: lng } = pos.coords;
                if (lastPosition.current) {
                    const dist = calculateDistance(
                        lastPosition.current.lat, 
                        lastPosition.current.lng, 
                        lat, 
                        lng
                    );
                    if (dist > 0.005) { 
                        setDistance(prev => prev + dist);
                    }
                }
                lastPosition.current = { lat, lng };
            },
            () => {
                if (!isMounted.current) return;
                setPermissionError("GEOLOCATION_SYNC_FAILED");
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const stopTracking = () => {
        if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        if (timerInterval.current) clearInterval(timerInterval.current);
        
        const caloriesBurned = Math.floor(distance * 65);
        if (distance > 0.01) {
            onSessionComplete(distance, caloriesBurned, Math.floor(duration / 60));
        }
        
        setIsTracking(false);
        lastPosition.current = null;
        setSignalStrength(0);
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; 
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    return (
        <div className={`p-12 rounded-none border-2 ${themeStyles.border} ${themeStyles.bg} relative overflow-hidden group`}>
            {/* Background Scanner Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>

            <div className="relative z-10 flex justify-between items-start mb-12">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 flex items-center justify-center border-2 ${themeStyles.border} rotate-45`}>
                        <Target className={`-rotate-45 ${themeStyles.accent}`} size={20} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Mission_Control</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${isTracking ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`}></span>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                                {isTracking ? 'SYNC_ACTIVE' : 'IDLE_WAIT'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`w-1.5 h-4 ${i <= (signalStrength / 25) ? (isBlue ? 'bg-indigo-400' : 'bg-rose-600') : 'bg-current opacity-10'}`}></div>
                        ))}
                    </div>
                    <span className="text-[8px] font-black opacity-30 monospace">SAT_RECEPTION: {signalStrength}%</span>
                </div>
            </div>

            {/* Main HUD Ring Visualization */}
            <div className="relative h-72 flex items-center justify-center mb-12">
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-64 h-64 -rotate-90">
                        <circle cx="128" cy="128" r="120" fill="none" className="stroke-current opacity-5" strokeWidth="1" />
                        <motion.circle 
                            cx="128" cy="128" r="120" fill="none" 
                            className={`stroke-current ${themeStyles.accent}`} 
                            strokeWidth="4" 
                            strokeLinecap="round"
                            initial={{ strokeDasharray: "0 754" }}
                            animate={{ strokeDasharray: isTracking ? "565 754" : "0 754" }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            style={{ filter: `drop-shadow(0 0 10px currentColor)` }}
                        />
                    </svg>
                </div>
                
                <div className="text-center group-hover:scale-110 transition-transform duration-700">
                    <motion.p 
                        key={distance}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-7xl font-black font-mono tracking-tighter"
                    >
                        {distance.toFixed(2)}
                    </motion.p>
                    <p className="text-xs font-black uppercase tracking-[0.4em] opacity-40">Kilo_Units</p>
                </div>

                {/* Tactical Corners */}
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`absolute w-6 h-6 border-t-2 border-l-2 ${themeStyles.border}`} style={{
                        top: i < 2 ? '0' : 'auto', bottom: i >= 2 ? '0' : 'auto',
                        left: i % 2 === 0 ? '0' : 'auto', right: i % 2 !== 0 ? '0' : 'auto',
                        transform: `rotate(${i * 90}deg)`
                    }}></div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-6 relative z-10 mb-8">
                <div className={`p-6 border-2 ${themeStyles.border} bg-current/5`}>
                    <div className="flex items-center gap-2 mb-2 opacity-40">
                        <Clock size={12} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Temporal_Sync</span>
                    </div>
                    <p className="text-3xl font-black font-mono tracking-tight">{formatTime(duration)}</p>
                </div>
                <div className={`p-6 border-2 ${themeStyles.border} bg-current/5`}>
                    <div className="flex items-center gap-2 mb-2 opacity-40">
                        <Zap size={12} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Energy_Burn</span>
                    </div>
                    <p className="text-3xl font-black font-mono tracking-tight">
                        {Math.floor(distance * 65)}<span className="text-xs opacity-40 ml-1">KCAL</span>
                    </p>
                </div>
            </div>

            {/* Diagnostics Bar */}
            <div className="relative h-6 bg-current/5 border-2 border-current opacity-10 mb-10 overflow-hidden">
                <motion.div 
                    animate={{ x: ['100%', '-100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className={`absolute inset-0 w-24 ${isBlue ? 'bg-indigo-400' : 'bg-rose-600'} opacity-30`}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[8px] font-black uppercase tracking-[0.8em]">SYSTEM_DIAGNOSTICS_RUNNING</span>
                </div>
            </div>

            <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={isTracking ? stopTracking : startTracking}
                className={`w-full py-6 rounded-none font-black text-2xl italic uppercase tracking-[0.3em] flex items-center justify-center gap-6 transition-all shadow-2xl relative overflow-hidden
                    ${isTracking 
                        ? 'bg-rose-600 text-white' 
                        : 'bg-stone-900 text-white border-2 border-stone-700'}`}
            >
                {isTracking ? (
                    <>
                        <Square size={24} fill="currentColor" />
                        <span>ABORT_TRACK</span>
                    </>
                ) : (
                    <>
                        <Play size={24} fill="currentColor" />
                        <span>INITIATE_GPS_LAUNCH</span>
                    </>
                )}
            </motion.button>

        </div>
    );
};

export default GeolocationTracker;
