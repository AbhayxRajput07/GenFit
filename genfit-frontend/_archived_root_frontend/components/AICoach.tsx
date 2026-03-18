import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, DailyStats } from '../types';
import { createWellnessCoachChat } from '../services/geminiService';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { Chat, GenerateContentResponse } from '@google/genai';
import { motion, AnimatePresence } from 'framer-motion';

interface AICoachProps {
  stats: DailyStats;
}

const TypingDots = () => (
  <div className="flex gap-1 ml-12 items-center text-black/60">
    <motion.span className="w-2 h-2 bg-pink-400 rounded-full" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} />
    <motion.span className="w-2 h-2 bg-pink-400 rounded-full" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: .2 }} />
    <motion.span className="w-2 h-2 bg-pink-400 rounded-full" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: .4 }} />
    <span className="ml-2 text-xs">AI typing…</span>
  </div>
);

const AICoach: React.FC<AICoachProps> = ({ stats }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hey 👋 I'm your AI wellness coach.",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [flyingText, setFlyingText] = useState<string | null>(null);

  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatSession.current = createWellnessCoachChat();

    const contextPrompt = `User stats:
Steps:${stats.steps}
Calories:${stats.caloriesOut}
Sleep:${stats.sleepHours}
Water:${stats.waterMl}`;

    chatSession.current.sendMessage({ message: contextPrompt }).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession.current) return;

    const text = input;
    setInput('');
    setFlyingText(text);

    setTimeout(async () => {
      setFlyingText(null);

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const result: GenerateContentResponse =
          await chatSession.current!.sendMessage({ message: text });

        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: result.text || 'Try again.',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, botMsg]);
      } catch {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: 'Something went wrong.',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }, 900);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col rounded-3xl overflow-hidden border border-black/20 bg-gradient-to-br from-white via-rose-50 to-pink-100">

      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-black/10 bg-white">
        <div className="p-2 rounded-xl bg-pink-200 border border-black/20">
          <Bot className="text-black" />
        </div>
        <div>
          <h3 className="font-semibold text-black">Genfit AI Coach</h3>
          <p className="text-xs text-black/60">Live Assistant</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border border-black/20 ${msg.role === 'user' ? 'bg-pink-200' : 'bg-white'}`}>
                {msg.role === 'user'
                  ? <User className="w-4 text-black" />
                  : <Sparkles className="w-4 text-pink-500" />}
              </div>

              <motion.div
                className={`max-w-[75%] p-4 rounded-2xl border border-black/20 text-sm md:text-base ${
                  msg.role === 'user'
                    ? 'bg-pink-200 text-black'
                    : 'bg-white text-black'
                }`}
                initial={{ scale: .9 }}
                animate={{ scale: 1 }}
              >
                {msg.text}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && <TypingDots />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-5 border-t border-black/10 bg-white">
        <div className="relative max-w-4xl mx-auto">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask fitness, diet, sleep, motivation…"
            className="w-full px-5 py-3 rounded-2xl border border-black/20 bg-white text-black outline-none"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-pink-200 border border-black/20 hover:bg-pink-300 transition"
          >
            <Send className="w-4 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AICoach;