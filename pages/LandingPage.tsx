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
      <section className="h-screen flex flex-col justify-center items-center text-center px-6 relative z-10">

        <div className="flex gap-4 text-6xl md:text-7xl font-bold mb-6">
          <motion.span
            initial={{ x: -250, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1 }}
          >
            Genfit
          </motion.span>

          <motion.span
            initial={{ x: 250, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1 }}
          >
            Health
          </motion.span>
        </div>

        <p className="text-lg max-w-xl mb-10 text-gray-700">
          Cute premium AI fitness dashboard built for beginners, college students
          and women-focused wellness tracking.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEnter}
          className="px-12 py-4 bg-pink-300 border-2 border-black rounded-xl font-semibold shadow-lg"
        >
          Enter App
        </motion.button>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-10 grid md:grid-cols-3 gap-10 max-w-6xl mx-auto relative z-10">
        {[
          ["AI Nutrition 💗", "Scan meals & auto track macros instantly."],
          ["Activity Tracker 🌸", "Track workouts with daily history."],
          ["AI Coach ✨", "Motivation & wellness advice 24/7."]
        ].map((f, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -10, scale: 1.02 }}
            className="bg-white/70 backdrop-blur-xl border-2 border-black rounded-[28px] p-8 shadow-xl"
          >
            <h3 className="text-xl font-semibold mb-3">{f[0]}</h3>
            <p className="text-gray-600">{f[1]}</p>
          </motion.div>
        ))}
      </section>

      {/* CTA */}
      <section className="py-24 text-center relative z-10">
        <h2 className="text-4xl font-bold mb-6">
          Start Your Fitness Journey Today 🌷
        </h2>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEnter}
          className="px-12 py-4 bg-pink-300 border-2 border-black rounded-xl font-semibold shadow-lg"
        >
          Join Genfit
        </motion.button>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center text-gray-600 border-t border-black/10 relative z-10">
        © {new Date().getFullYear()} Genfit AI • Built with ❤
      </footer>

    </div>
  );
}
