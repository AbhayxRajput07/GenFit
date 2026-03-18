import React from "react";
import { motion } from "framer-motion";

export default function LandingPage({ onEnter }: { onEnter?: () => void }) {
  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-white via-rose-50 to-pink-100 overflow-hidden text-black">

      {/* 🌸 EXTRA DENSE FLOWING FLOWERS */}
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-pink-300/70 text-3xl select-none"
          initial={{ x: "-10vw", y: `${Math.random() * 100}vh`, opacity: 0 }}
          animate={{ x: ["-10vw", "110vw"], opacity: [0, 1, 1, 0] }}
          transition={{ repeat: Infinity, duration: 15 + Math.random() * 10, ease: "linear", delay: i * 0.3 }}
        >
          🌸
        </motion.div>
      ))}

      {/* 🔥 FULL CORNER GLOW BORDER */}
      <motion.div
        className="absolute inset-0 rounded-[34px] pointer-events-none"
        style={{ border: "3px solid black" }}
        animate={{
          boxShadow: [
            "0 0 25px #f472b6, inset 0 0 25px #f472b6",
            "0 0 50px #fb7185, inset 0 0 40px #fb7185",
            "0 0 25px #f472b6, inset 0 0 25px #f472b6"
          ]
        }}
        transition={{ repeat: Infinity, duration: 4 }}
      />

      {/* HERO */}
      <section className="h-screen flex flex-col justify-center items-center text-center px-6 relative z-10 w-full">

        {/* Floating Accent */}
        <motion.div
          animate={{ y: [-10, 10, -10] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="bg-white px-6 py-2 rounded-full border-2 border-black font-bold text-pink-500 shadow-[4px_4px_0px_rgba(0,0,0,1)] tracking-widest uppercase text-sm mb-10"
        >
          ✨ Your AI Wellness Bestie
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6 text-6xl md:text-8xl font-black mb-6 tracking-tight">
          <motion.span
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
            className="text-black drop-shadow-[4px_4px_0_#f472b6]"
          >
            Genfit
          </motion.span>

          <motion.span
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1, type: "spring", bounce: 0.5 }}
            className="text-white drop-shadow-[4px_4px_0_#000000]"
            style={{ WebkitTextStroke: "2px black" }}
          >
            Health
          </motion.span>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-lg md:text-xl max-w-xl mb-12 text-black font-medium leading-relaxed bg-white/50 backdrop-blur-md p-6 rounded-3xl border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.1)]"
        >
          A surprisingly cute, brutally effective AI fitness dashboard built for beginners, college students, and women-focused wellness tracking. 💖
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.05, y: -4, boxShadow: "4px 8px 0px rgba(0,0,0,1)" }}
          whileTap={{ scale: 0.95, y: 0, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
          onClick={onEnter}
          className="px-14 py-5 bg-pink-300 border-2 border-black rounded-2xl font-black text-xl flex items-center gap-3 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)]"
        >
          Enter App <span className="text-2xl">💫</span>
        </motion.button>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-6 md:px-10 max-w-7xl mx-auto relative z-10 w-full">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">Level Up Your Journey</h2>
          <p className="text-lg font-medium text-black/70">Powerful tools wrapped in an adorable package.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {[
            { tag: "Nutrition", title: "AI Macros 💗", desc: "Snap a photo of your meal. Our AI automatically logs calories, protein, and carbs.", color: "bg-rose-200" },
            { tag: "Fitness", title: "Activity Tracker 🌸", desc: "Log your daily steps, workouts, and sweat sessions with a beautiful interactive chart.", color: "bg-pink-300" },
            { tag: "Support", title: "AI Coach ✨", desc: "Feeling unmotivated? Chat with your 24/7 personalized wellness bestie.", color: "bg-fuchsia-200" }
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.2 }}
              whileHover={{ y: -10, rotate: i % 2 === 0 ? 2 : -2 }}
              className={`backdrop-blur-xl border-4 border-black rounded-[32px] p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] bg-white overflow-hidden relative group`}
            >
              <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full border-4 border-black ${f.color} opacity-50 group-hover:scale-150 transition-transform duration-500`} />

              <span className={`inline-block px-4 py-1.5 rounded-full border-2 border-black font-bold text-xs mb-6 bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)] relative z-10`}>
                {f.tag}
              </span>

              <h3 className="text-2xl font-black mb-4 flex items-center gap-3 relative z-10">{f.title}</h3>
              <p className="text-black/80 font-medium leading-relaxed relative z-10">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 text-center relative z-10 px-6 max-w-5xl mx-auto w-full">
        <div className="bg-pink-300 border-4 border-black rounded-[40px] p-12 md:p-20 shadow-[12px_12px_0px_rgba(0,0,0,1)] relative overflow-hidden">

          {/* Decorative shapes inside CTA */}
          <div className="absolute top-10 right-10 w-20 h-20 bg-white border-4 border-black rounded-full shadow-[4px_4px_0px_rgba(0,0,0,1)] animate-bounce" style={{ animationDuration: '3s' }} />
          <div className="absolute bottom-10 left-10 w-16 h-16 bg-rose-400 border-4 border-black rotate-12 shadow-[4px_4px_0px_rgba(0,0,0,1)]" />

          <h2 className="text-5xl md:text-6xl font-black mb-8 relative z-10 drop-shadow-[4px_4px_0_#ffffff]">
            Start Your Fitness Journey Today 🌷
          </h2>

          <p className="text-xl font-bold mb-12 max-w-2xl mx-auto relative z-10">
            Join thousands of others tracking their progress in the cutest way possible.
          </p>

          <motion.button
            whileHover={{ scale: 1.05, y: -4, boxShadow: "6px 6px 0px rgba(0,0,0,1)" }}
            whileTap={{ scale: 0.95, y: 0, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
            onClick={onEnter}
            className="px-14 py-5 bg-white border-4 border-black rounded-2xl font-black text-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all relative z-10"
          >
            LET'S GO! 🚀
          </motion.button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 text-center font-bold text-black border-t-4 border-black relative z-10 bg-white mt-10">
        <p className="text-lg">© {new Date().getFullYear()} Genfit AI</p>
        <p className="text-sm text-black/60 mt-2">Where health meets cute.</p>
      </footer>

    </div>
  );
}
