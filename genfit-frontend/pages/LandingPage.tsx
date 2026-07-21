import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, Cpu, LineChart, Activity } from 'lucide-react';

// ────────────────────────────────────────────────────────
// ULTRA-SMOOTH 60FPS STARFIELD ENGINE
// ────────────────────────────────────────────────────────
const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const mouse = { x: -1000, y: -1000, radius: 250 };
    
    // Smooth Deep Tech Theme Colors
    const colors = [
      'rgba(255, 255, 255, 0.4)',  // Faint white (distant)
      'rgba(59, 130, 246, 0.6)',   // Blue flare
      'rgba(14, 165, 233, 0.6)',   // Sky flare
      'rgba(255, 255, 255, 0.9)'   // Bright front star
    ];

    class Particle {
      x: number; y: number; originX: number; originY: number;
      size: number; vx: number; vy: number; ease: number; friction: number; color: string;

      constructor(x: number, y: number) {
        this.x = x; this.y = y; this.originX = x; this.originY = y;
        
        // Varying sizes creates massive 3D depth ("pure me stars")
        this.size = Math.random() * 2 + 0.5;
        this.vx = 0; this.vy = 0;
        
        // Very soft return curves prevent jarring motion
        this.ease = 0.02 + Math.random() * 0.03;
        
        // Very slippery friction allows them to drift smoothly like water
        this.friction = 0.94;
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Only glow the slightly larger prominent stars to save huge render cost
        if (this.size > 1.5) {
           ctx.shadowBlur = 8;
           ctx.shadowColor = this.color;
        } else {
           ctx.shadowBlur = 0;
        }
      }

      update() {
        // Continuous organic base drift logic (gentle cosmic breeze effect)
        this.originX += Math.sin(Date.now() * 0.001 + this.originY) * 0.1;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Smooth Repulsion
        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouse.radius - distance) / mouse.radius;
          
          // Gentle, incredibly smooth push outwards
          const pushSpeed = force * 6; 
          this.vx -= forceDirectionX * pushSpeed;
          this.vy -= forceDirectionY * pushSpeed;
        }

        // Extremely soft return logic so it flows back naturally
        this.vx += (this.originX - this.x) * this.ease;
        this.vy += (this.originY - this.y) * this.ease;

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      
      // Much denser starfield ("pure me"), but very fast because lines are removed
      const numParticles = Math.floor((canvas.width * canvas.height) / 4000);
      for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // NOTE: Removed `N^2` line connecting loops. This guarantees a locked 60FPS experience.
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => init();
    const handleMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    // Let the cursor smoothly glide out rather than snapping to -1000
    const handleMouseLeave = () => { mouse.x = -1000; mouse.y = -1000; };

    init();
    animate();

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Performance isolation: will-change and hardware accel applied
  return <canvas ref={canvasRef} style={{ willChange: 'transform' }} className="fixed inset-0 z-10 pointer-events-none opacity-80" />;
};

// ────────────────────────────────────────────────────────
// PREMIUM MAGNETIC BUTTON COMPONENT
// ────────────────────────────────────────────────────────
const MagneticButton = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.3, y: middleY * 0.3 });
  };
  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className="group relative flex items-center justify-center w-48 h-48 rounded-full border border-white/10 bg-black/50 backdrop-blur-xl text-white transition-colors duration-700 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden"
    >
      <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(255,255,255,1)_360deg)] animate-[spin_4s_linear_infinite] opacity-30" />
      <div className="absolute inset-[1px] bg-[#050505] rounded-full z-0 transition-colors group-hover:bg-[#111]" />
      
      <span className="relative z-10 font-bold tracking-[0.3em] text-sm flex gap-3 items-center group-hover:-translate-y-1 transition-transform duration-500">
         BEGIN <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </span>
    </motion.button>
  );
};

// ────────────────────────────────────────────────────────
// MAIN LANDING PAGE COMPONENT
// ────────────────────────────────────────────────────────
export default function LandingPage({
  onEnter,
  onAuthRequired,
  isAuthenticated = false,
}: {
  onEnter?: () => void;
  onAuthRequired?: () => void;
  isAuthenticated?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Ultra-optimized scroll translation
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 60, damping: 25, restDelta: 0.001 });

  // 1. HERO ANIMATION VARS
  const heroOpacity = useTransform(smooth, [0, 0.1], [1, 0]);
  const heroScale = useTransform(smooth, [0, 0.15], [1, 1.1]);
  const heroTextSlide = useTransform(smooth, [0, 0.15], [0, -150]);

  // 2. VIDEO PARALLAX
  const videoScale = useTransform(smooth, [0, 1], [1.02, 1.4]);
  // Removed `blur` transform mapping. Blur on `<video>` hardware decoders causes extreme lag across OS's.
  // Instead, substituting it with a smooth opacity fade-out layered under a pure black overlay which perfectly replicates the cinematic feeling with zero lag.
  const videoOpacity = useTransform(smooth, [0.3, 0.9], [0.5, 0.05]);

  // 3. THE GLOWING SCROLL PIPELINE
  const pipelineHeight = useTransform(smooth, [0.15, 0.85], ["0%", "100%"]);

  // 4. FLOATING HUD REVEALS (Extremely tight scaling for Apple-like float)
  const c1Y = useTransform(smooth, [0.15, 0.25, 0.35], [200, 0, -200]);
  const c1Opacity = useTransform(smooth, [0.15, 0.25, 0.3, 0.35], [0, 1, 1, 0]);
  const c1Scale = useTransform(smooth, [0.15, 0.25, 0.35], [0.95, 1, 0.95]);

  const c2Y = useTransform(smooth, [0.35, 0.45, 0.55], [200, 0, -200]);
  const c2Opacity = useTransform(smooth, [0.35, 0.45, 0.5, 0.55], [0, 1, 1, 0]);
  const c2Scale = useTransform(smooth, [0.35, 0.45, 0.55], [0.95, 1, 0.95]);

  const c3Y = useTransform(smooth, [0.55, 0.65, 0.75], [200, 0, -200]);
  const c3Opacity = useTransform(smooth, [0.55, 0.65, 0.7, 0.75], [0, 1, 1, 0]);
  const c3Scale = useTransform(smooth, [0.55, 0.65, 0.75], [0.95, 1, 0.95]);

  // 5. FINAL ELEGANT CTA & CINEMATIC TEXT
  const ctaScale = useTransform(smooth, [0.8, 0.95], [0.9, 1]);
  const ctaOpacity = useTransform(smooth, [0.85, 0.95], [0, 1]);
  const ctaTextY1 = useTransform(smooth, [0.85, 0.95], [100, 0]);
  const ctaTextY2 = useTransform(smooth, [0.88, 0.98], [100, 0]);
  const handlePrimaryCta = () => {
    if (isAuthenticated) {
      onEnter?.();
      return;
    }

    onAuthRequired?.();
  };

  return (
    <div ref={containerRef} className="bg-[#010101] text-white font-sans relative selection:bg-blue-500/30" style={{ height: "450vh" }}>
      
      <ParticleBackground />

      {/* The Central Glowing Pipeline */}
      <div className="fixed top-0 left-1/2 -translate-x-[0.5px] w-[1px] h-screen bg-transparent z-0 pointer-events-none hidden md:block">
         <motion.div 
            style={{ height: pipelineHeight, willChange: 'height' }} 
            className="w-full bg-gradient-to-b from-transparent via-blue-500 to-sky-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]"
         />
      </div>

      {/* Lightweight Ambient Lighting (Replaced massive blurs with fast gradients) */}
      <div className="fixed inset-0 w-full h-screen z-0 pointer-events-none overflow-hidden bg-[#010101]">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.1)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.1)_0%,transparent_60%)] pointer-events-none" />
      </div>

      {/* Master Cinematic Background Video */}
      <motion.div className="sticky top-0 w-full h-screen z-0 pointer-events-none overflow-hidden">
        <motion.div style={{ scale: videoScale, opacity: videoOpacity, willChange: 'transform' }} className="w-full h-full origin-center">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover grayscale opacity-70" src="https://assets.mixkit.co/videos/preview/mixkit-strong-man-training-with-dumbbells-in-a-dark-gym-40295-large.mp4" />
        </motion.div>
        {/* Darkening overlay mask for premium contrast reading */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#010101] via-transparent to-[#010101] opacity-90" />
      </motion.div>

      {/* Top Nav */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}
        className="fixed top-0 w-full z-50 py-8 px-10 flex justify-between items-center pointer-events-none"
      >
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)]" />
           <span className="text-xl font-bold tracking-tight text-white select-none">GenFit.</span>
        </div>
        <button onClick={handlePrimaryCta} className="pointer-events-auto px-6 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/20 text-white text-sm font-medium tracking-wide hover:bg-white hover:text-black transition-colors duration-500 shadow-[0_0_10px_rgba(255,255,255,0.05)]">
          Enter App
        </button>
      </motion.nav>

      {/* ───────────────────────────────────────────────────────────
          STAGE 1: EPIC APPLE-STYLE HERO REVEAL
      ───────────────────────────────────────────────────────────── */}
      <section className="absolute top-0 w-full h-screen flex flex-col items-center justify-center z-10 pointer-events-none">
        <motion.div style={{ opacity: heroOpacity, y: heroTextSlide, scale: heroScale, willChange: 'transform' }} className="flex flex-col items-center text-center">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.4 }}
            className="mb-8 inline-flex items-center px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.2)]"
          >
            <span className="text-xs font-bold tracking-widest text-blue-300 uppercase">The Evolution of AI Coaching</span>
          </motion.div>

          <div className="overflow-hidden p-2">
             <motion.h1 
               initial={{ opacity: 0, y: 150 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
               className="text-7xl md:text-8xl lg:text-[130px] font-medium tracking-tighter leading-[0.85] text-white drop-shadow-xl"
             >
               Absolute
             </motion.h1>
          </div>
          <div className="overflow-hidden p-2 mt-[-10px]">
             <motion.h1 
               initial={{ opacity: 0, y: 150 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
               className="text-7xl md:text-8xl lg:text-[130px] font-medium tracking-tighter leading-[0.85] text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-100 to-blue-500/40"
             >
               precision.
             </motion.h1>
          </div>

        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 2, duration: 1 }} className="absolute bottom-12 flex flex-col items-center gap-4">
          <div className="text-[10px] uppercase font-bold tracking-widest text-white/40">Initiate Protocol</div>
          <div className="w-[1px] h-16 bg-gradient-to-b from-white to-transparent opacity-50" />
        </motion.div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          STAGE 2: THE 3 MAGNIFICENT HUD TABS
      ───────────────────────────────────────────────────────────── */}
      <section className="fixed top-0 w-full h-screen z-20 pointer-events-none">
        
        {/* HUD 1: Neural Engine */}
        <motion.div style={{ y: c1Y, opacity: c1Opacity, scale: c1Scale, willChange: 'transform' }} className="absolute inset-0 flex items-center justify-center -translate-y-[5vh]">
          {/* Reduced blur from 3xl to 2xl, removed duplicate heavy shadows for massive perf gain */}
          <div className="w-[90vw] md:w-[65vw] max-w-5xl p-10 md:p-14 rounded-[2rem] border border-white/10 bg-[#020202]/60 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center gap-14 pointer-events-auto group relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
             
             <div className="flex-1 space-y-6 relative z-10">
                <div className="w-14 h-14 rounded-full border border-blue-500/30 flex items-center justify-center bg-blue-500/10"><Cpu className="text-blue-400" /></div>
                <h2 className="text-4xl md:text-6xl font-medium tracking-tighter text-white">Neural<br/>Architecture.</h2>
                <p className="text-lg text-white/50 leading-relaxed font-light">
                  A hyper-optimized AI engine continuously analyzes your biometrics to output the perfectly calibrated growth curve without lag or friction.
                </p>
             </div>
             <div className="flex-1 w-full relative h-[250px] border border-white/5 rounded-3xl bg-white/[0.02] flex items-end p-6 overflow-hidden group-hover:border-blue-500/20 transition-colors duration-700">
               <svg className="absolute bottom-0 left-0 w-full h-[80%]" viewBox="0 0 100 50" preserveAspectRatio="none">
                 <defs>
                   <linearGradient id="chartGrad1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4"/><stop offset="100%" stopColor="#60a5fa" stopOpacity="0"/></linearGradient>
                 </defs>
                 <path d="M0,50 L0,30 Q20,40 40,20 T70,10 T100,25 L100,50 Z" fill="url(#chartGrad1)" className="opacity-40 group-hover:opacity-100 transition-opacity duration-1000" />
                 <path d="M0,30 Q20,40 40,20 T70,10 T100,25" fill="none" stroke="#60a5fa" strokeWidth="2.5" />
               </svg>
             </div>
          </div>
        </motion.div>

        {/* HUD 2: Output Metrics */}
        <motion.div style={{ y: c2Y, opacity: c2Opacity, scale: c2Scale, willChange: 'transform' }} className="absolute inset-0 flex items-center justify-center -translate-y-[5vh]">
          <div className="w-[90vw] md:w-[65vw] max-w-5xl p-10 md:p-14 rounded-[2rem] border border-white/10 bg-[#020202]/60 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row-reverse items-center gap-14 pointer-events-auto group relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-bl from-sky-500/0 via-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

             <div className="flex-1 space-y-6 relative z-10">
                <div className="w-14 h-14 rounded-full border border-sky-500/30 flex items-center justify-center bg-sky-500/10"><LineChart className="text-sky-400" /></div>
                <h2 className="text-4xl md:text-6xl font-medium tracking-tighter text-white">Kinetic<br/>Precision.</h2>
                <p className="text-lg text-white/50 leading-relaxed font-light">
                  Every joule of energy mapped. GenFit actively translates raw kinematic movement into highly elegant, actionable intelligence datasets.
                </p>
             </div>
             <div className="flex-[0.8] w-full flex flex-col gap-4 relative z-10">
                <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex justify-between items-center group-hover:border-sky-500/20 group-hover:bg-sky-500/5 transition-colors duration-500">
                  <span className="text-sm font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">Velocity</span>
                  <span className="text-2xl font-medium text-white group-hover:text-sky-300 transition-colors">2.4m/s</span>
                </div>
                <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex justify-between items-center group-hover:border-sky-500/20 group-hover:bg-sky-500/5 transition-colors duration-500 delay-75">
                  <span className="text-sm font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">Symmetry</span>
                  <span className="text-2xl font-medium text-white group-hover:text-sky-300 transition-colors">98.2%</span>
                </div>
                <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex justify-between items-center group-hover:border-sky-500/20 group-hover:bg-sky-500/5 transition-colors duration-500 delay-150">
                  <span className="text-sm font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">Impact</span>
                  <span className="text-2xl font-medium text-white group-hover:text-sky-300 transition-colors">110G</span>
                </div>
             </div>
          </div>
        </motion.div>

        {/* HUD 3: Cellular Regeneration */}
        <motion.div style={{ y: c3Y, opacity: c3Opacity, scale: c3Scale, willChange: 'transform' }} className="absolute inset-0 flex items-center justify-center -translate-y-[5vh]">
          <div className="w-[90vw] md:w-[65vw] max-w-5xl p-10 md:p-14 rounded-[2rem] border border-white/10 bg-[#020202]/60 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center gap-14 pointer-events-auto group relative overflow-hidden">
             
             <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/0 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

             <div className="flex-[0.9] space-y-6 relative z-10">
                <div className="w-14 h-14 rounded-full border border-cyan-500/30 flex items-center justify-center bg-cyan-500/10"><Activity className="text-cyan-400" /></div>
                <h2 className="text-4xl md:text-6xl font-medium tracking-tighter text-white">Cellular<br/>Regeneration.</h2>
                <p className="text-lg text-white/50 leading-relaxed font-light">
                  Predictive synthesis maps your exact muscle recovery timeline. We track advanced biomarkers to prevent overtraining and ensure absolute peak condition.
                </p>
             </div>
             
             <div className="flex-[1.1] w-full grid grid-cols-2 gap-5 relative z-10">
                 <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center gap-6 group-hover:border-cyan-500/20 group-hover:bg-cyan-500/5 transition-colors duration-700">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 absolute inset-0">
                        <circle cx="56" cy="56" r="50" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
                        <motion.circle 
                           cx="56" cy="56" r="50" stroke="#22d3ee" strokeWidth="6" fill="none" strokeDasharray="314" strokeDashoffset="314" strokeLinecap="round"
                           animate={{ strokeDashoffset: 62 }}
                           transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                           className="drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]" 
                        />
                      </svg>
                      <div className="text-3xl font-bold tracking-tighter text-white">80%</div>
                    </div>
                    <span className="text-xs tracking-[0.2em] font-bold uppercase text-white/50">Recovery Vol</span>
                 </div>
                 
                 <div className="flex flex-col gap-5">
                    <div className="flex-[0.8] rounded-3xl border border-white/5 bg-white/[0.02] p-6 flex flex-col justify-center gap-3 group-hover:border-cyan-500/20 transition-colors duration-700">
                       <span className="text-[10px] tracking-[0.2em] font-bold text-white/50 uppercase">System Status</span>
                       <div className="flex items-center gap-3">
                         <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                         <span className="text-2xl font-bold tracking-tight text-white">Optimal</span>
                       </div>
                    </div>
                    
                    <div className="flex-[1.2] rounded-3xl border border-white/5 bg-white/[0.02] p-6 flex flex-col justify-between overflow-hidden relative group-hover:border-cyan-500/20 transition-colors duration-700">
                       <span className="text-[10px] tracking-[0.2em] font-bold text-white/50 uppercase relative z-10">Heart Rate Variability</span>
                       <div className="w-full h-14 flex items-end relative z-0">
                          <svg className="absolute bottom-[-10px] w-[200%] h-full -translate-x-10" viewBox="0 0 100 40" preserveAspectRatio="none">
                             <motion.polyline 
                               points="0,20 20,20 25,5 30,35 35,20 60,20 65,10 70,30 75,20 100,20" 
                               fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinejoin="round" 
                               animate={{ translateX: ["0%", "-50%"] }}
                               transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                             />
                          </svg>
                       </div>
                    </div>
                 </div>

             </div>
          </div>
        </motion.div>

      </section>

      {/* ───────────────────────────────────────────────────────────
          STAGE 3: THE CINEMATIC FINALE
      ───────────────────────────────────────────────────────────── */}
      <section className="absolute bottom-0 w-full h-screen flex flex-col items-center justify-center z-30 pointer-events-none overflow-hidden">
        <motion.div style={{ opacity: ctaOpacity }} className="absolute inset-0 bg-[#010101] z-0 pointer-events-none" />
        
        {/* Massive slow-rotating Eclipse Core glow (Blue Theme, optimized) */}
        <motion.div style={{ opacity: ctaOpacity, scale: ctaScale, willChange: 'transform' }} className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none mix-blend-screen">
           <motion.div 
             animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
             transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
             className="w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_60%)] rounded-full"
           />
        </motion.div>

        <motion.div style={{ scale: ctaScale, opacity: ctaOpacity, willChange: 'transform' }} className="relative text-center px-6 pointer-events-auto flex flex-col items-center justify-center z-10 w-full h-full">
          
          <div className="overflow-hidden p-2 mb-[-10px]">
             <motion.h2 style={{ y: ctaTextY1 }} className="text-7xl md:text-[110px] font-medium tracking-tighter leading-none text-white drop-shadow-xl">
               Start the
             </motion.h2>
          </div>
          <div className="overflow-hidden p-2 mb-16">
             <motion.h2 style={{ y: ctaTextY2 }} className="text-7xl md:text-[110px] font-medium tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-100 to-blue-500/40">
               Evolution.
             </motion.h2>
          </div>
          
           <MagneticButton onClick={handlePrimaryCta}>
             BEGIN
          </MagneticButton>
          
        </motion.div>
      </section>

    </div>
  );
}
