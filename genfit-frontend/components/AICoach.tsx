import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, DailyStats, Theme } from '../types';
import { createWellnessCoachChat, formatAiError, hasGeminiApiKey } from '../services/geminiService';
import { 
  Bot, Copy, Download, MessageSquare, Mic, MicOff, Plus, 
  RotateCcw, Send, Sparkles, Trash2, User, Menu, 
  PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight,
  Settings as SettingsIcon, X, Sliders, Target
} from 'lucide-react';
import { Chat, GenerateContentResponse } from '@google/genai';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

interface AICoachProps {
  stats: DailyStats;
  theme: Theme;
}

// ... (SpeechRecognition interfaces remain the same)
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface ChatSessionItem {
  id: string;
  title: string;
  updatedAt: string;
  messages: Array<Omit<ChatMessage, 'timestamp'> & { timestamp: string }>;
}

const CHAT_SESSIONS_KEY = 'genfit_ai_chat_sessions';
const ACTIVE_CHAT_KEY = 'genfit_ai_active_chat';
const AUTH_STORAGE_KEY = 'genfit_auth_user';

const AICoach: React.FC<AICoachProps> = ({ stats, theme }) => {
  const { t } = useLanguage();
  const isBlue = theme === 'blue';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [assistantName, setAssistantName] = useState(() => localStorage.getItem('zenfit_assistant_name') || 'ZenFit Assistant');
  const [assistantTone, setAssistantTone] = useState(() => localStorage.getItem('zenfit_assistant_tone') || 'Professional');

  const buildMessage = (role: 'user' | 'model', text: string): ChatMessage => ({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text,
    timestamp: new Date(),
  });

  const createEmptySession = (): ChatSessionItem => ({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: t('coach.history').split(' ')[0] + ' ' + (sessions.length + 1),
    updatedAt: new Date().toISOString(),
    messages: [],
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [input, setInput] = useState('');
  const [displayName, setDisplayName] = useState('User');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUserPrompt, setLastUserPrompt] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState('');
  const [apiReady, setApiReady] = useState(true);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const chatSession = useRef<Chat | null>(null);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('coach.greeting.morning');
    if (hour < 17) return t('coach.greeting.afternoon');
    return t('coach.greeting.evening');
  };

  const TypingDots = () => (
    <div className={`flex gap-1 ml-12 items-center ${isBlue ? 'text-gray-400' : 'text-black/60'}`}>
      <motion.span className={`w-1.5 h-1.5 ${isBlue ? 'bg-blue-400' : 'bg-pink-400'} rounded-full`} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} />
      <motion.span className={`w-1.5 h-1.5 ${isBlue ? 'bg-blue-400' : 'bg-pink-400'} rounded-full`} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
      <motion.span className={`w-1.5 h-1.5 ${isBlue ? 'bg-blue-400' : 'bg-pink-400'} rounded-full`} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
      <span className="ml-2 text-[10px] font-bold uppercase tracking-widest opacity-60">{t('coach.thinking')}</span>
    </div>
  );

  const persistSessions = (nextSessions: ChatSessionItem[], nextActiveId: string) => {
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(nextSessions));
    localStorage.setItem(ACTIVE_CHAT_KEY, nextActiveId);
    setSessions(nextSessions);
    setActiveSessionId(nextActiveId);
  };

  const syncMessagesIntoSession = (nextMessages: ChatMessage[]) => {
    if (!activeSessionId) return;

    setSessions((prev) => {
      const updated = prev.map((session) => {
        if (session.id !== activeSessionId) return session;

        const firstUser = nextMessages.find((msg) => msg.role === 'user');
        const title = firstUser?.text?.slice(0, 36) || session.title || t('coach.history').split(' ')[0];

        return {
          ...session,
          title,
          updatedAt: new Date().toISOString(),
          messages: nextMessages.map((msg) => ({
            ...msg,
            timestamp: msg.timestamp.toISOString(),
          })),
        };
      }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const authRaw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (authRaw) {
      try {
        const parsed = JSON.parse(authRaw) as { name?: string };
        if (parsed?.name?.trim()) setDisplayName(parsed.name.trim());
      } catch {
        // Ignore invalid stored auth.
      }
    }

    const storedSessionsRaw = localStorage.getItem(CHAT_SESSIONS_KEY);
    const storedActiveId = localStorage.getItem(ACTIVE_CHAT_KEY) || '';
    let initialSessions: ChatSessionItem[] = [];

    if (storedSessionsRaw) {
      try {
        const parsed = JSON.parse(storedSessionsRaw) as ChatSessionItem[];
        if (Array.isArray(parsed)) initialSessions = parsed;
      } catch {
        localStorage.removeItem(CHAT_SESSIONS_KEY);
      }
    }

    if (initialSessions.length === 0) {
      const fresh = createEmptySession();
      initialSessions = [fresh];
      localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(initialSessions));
      localStorage.setItem(ACTIVE_CHAT_KEY, fresh.id);
    }

    const activeId = initialSessions.some((session) => session.id === storedActiveId)
      ? storedActiveId
      : initialSessions[0].id;

    setSessions(initialSessions);
    setActiveSessionId(activeId);

    const activeSession = initialSessions.find((session) => session.id === activeId);
    if (activeSession) {
      setMessages(activeSession.messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })));
    }

    const win = window as any;
    const SpeechRecognition: SpeechRecognitionCtor | undefined = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0]?.transcript || '')
          .join(' ')
          .trim();

        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}`.trim() : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setVoiceError(event?.error === 'not-allowed'
          ? t('coach.errors.mic_denied')
          : t('coach.errors.voice_fail'));
      };

      recognition.onend = () => setIsListening(false);
      speechRef.current = recognition;
    }

    const keyOk = hasGeminiApiKey();
    setApiReady(keyOk);

    if (keyOk) {
      chatSession.current = createWellnessCoachChat(assistantName, assistantTone);
      const contextPrompt = [
        'User profile context for personalization:',
        `- Steps: ${stats.steps}`,
        `- Calories out: ${stats.caloriesOut}`,
        `- Sleep hours: ${stats.sleepHours}`,
        `- Water ml: ${stats.waterMl}`,
        'Use this as background context and avoid repeating these numbers unless asked.',
        `Your name is ${assistantName}. Your tone is ${assistantTone}.`,
      ].join('\n');
      chatSession.current.sendMessage({ message: contextPrompt }).catch(() => {});
    }

    return () => {
      speechRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    syncMessagesIntoSession(messages);
  }, [messages]);

  const openSession = (sessionId: string) => {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) return;

    localStorage.setItem(ACTIVE_CHAT_KEY, sessionId);
    setActiveSessionId(sessionId);
    setMessages(session.messages.map((msg) => ({ ...msg, timestamp: new Date(msg.timestamp) })));
  };

  const createNewChat = () => {
    const fresh = createEmptySession();
    persistSessions([fresh, ...sessions], fresh.id);
    setMessages([]);
    setLastUserPrompt('');
    setInput('');
  };

  const saveSettings = () => {
    localStorage.setItem('zenfit_assistant_name', assistantName);
    localStorage.setItem('zenfit_assistant_tone', assistantTone);
    setShowSettings(false);
    // Re-initialize chat with new settings
    chatSession.current = createWellnessCoachChat(assistantName, assistantTone);
    const contextPrompt = `Update: Your name is now ${assistantName} and your tone is ${assistantTone}. Continue accordingly.`;
    chatSession.current.sendMessage({ message: contextPrompt }).catch(() => {});
  };

  const deleteSession = (sessionId: string) => {
    const filtered = sessions.filter((session) => session.id !== sessionId);
    if (filtered.length === 0) {
      const fresh = createEmptySession();
      persistSessions([fresh], fresh.id);
      setMessages([]);
      return;
    }

    const nextActiveId = activeSessionId === sessionId ? filtered[0].id : activeSessionId;
    persistSessions(filtered, nextActiveId);

    const active = filtered.find((session) => session.id === nextActiveId);
    setMessages((active?.messages || []).map((msg) => ({ ...msg, timestamp: new Date(msg.timestamp) })));
  };

  const sendMessageToCoach = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || !chatSession.current || !apiReady) return;

    const userMsg = buildMessage('user', text);
    setMessages((prev) => [...prev, userMsg]);
    setLastUserPrompt(text);
    setIsLoading(true);

    try {
      const result: GenerateContentResponse = await chatSession.current.sendMessage({ message: text });
      const modelMsg = buildMessage('model', result.text || 'I could not generate a response. Please retry.');
      setMessages((prev) => [...prev, modelMsg]);
    } catch (error) {
      setMessages((prev) => [...prev, buildMessage('model', formatAiError(error))]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    setVoiceError('');
    await sendMessageToCoach(text);
  };

  const handleRegenerate = async () => {
    if (!lastUserPrompt || !chatSession.current || isLoading) return;

    setMessages((prev) => {
      const copy = [...prev];
      for (let index = copy.length - 1; index >= 0; index -= 1) {
        if (copy[index].role === 'model') {
          copy.splice(index, 1);
          break;
        }
      }
      return copy;
    });

    await sendMessageToCoach(`${lastUserPrompt}\n\nPlease provide an alternative answer with the same goal.`);
  };

  const handleCopy = async (msg: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.text);
      setCopiedMessageId(msg.id);
      window.setTimeout(() => setCopiedMessageId(''), 1400);
    } catch {
      // Ignore clipboard failures.
    }
  };

  const exportConversation = () => {
    const lines = messages.map((msg) => `[${msg.timestamp.toLocaleString()}] ${msg.role === 'user' ? 'You' : 'Coach'}: ${msg.text}`);
    const blob = new Blob([lines.join('\n\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `genfit-ai-coach-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleVoiceToggle = () => {
    if (!voiceSupported || !speechRef.current) return;

    if (isListening) {
      speechRef.current.stop();
      setIsListening(false);
      return;
    }

    setVoiceError('');
    setIsListening(true);
    try {
      speechRef.current.start();
    } catch {
      setIsListening(false);
      setVoiceError(t('coach.errors.voice_ready'));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showGreeting = messages.length === 0;

  return (
    <div className={`h-[calc(100vh-2rem)] rounded-3xl overflow-hidden border transition-all duration-500 relative ${isBlue ? 'bg-[#0a192f] border-blue-500/20 shadow-2xl shadow-blue-500/5' : 'bg-gradient-to-br from-white via-rose-50 to-pink-100 border-black/10 shadow-xl shadow-pink-500/5'} flex`}>
      
      {/* ── Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '280px', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`flex flex-col border-r h-full relative z-20 overflow-hidden ${isBlue ? 'bg-[#112240] border-blue-500/20' : 'bg-white/80 backdrop-blur-md border-black/10'}`}
          >
            <div className="p-5 flex items-center justify-between border-b border-inherit bg-inherit/50">
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isBlue ? 'text-blue-400/60' : 'text-pink-500/60'}`}>{t('coach.history')}</span>
              <button
                onClick={createNewChat}
                className={`p-2 rounded-xl border transition-all active:scale-90 ${isBlue ? 'border-blue-500/30 text-blue-300 hover:bg-blue-500/10' : 'border-black/10 text-black hover:bg-black/5'}`}
                title="New Chat"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative rounded-2xl border transition-all duration-300 transform ${session.id === activeSessionId
                    ? (isBlue ? 'border-blue-500/40 bg-blue-500/10 shadow-lg shadow-blue-500/5 scale-[1.02]' : 'border-pink-500/30 bg-pink-100/50 shadow-md scale-[1.02]')
                    : (isBlue ? 'border-transparent hover:bg-white/5 opacity-70 hover:opacity-100' : 'border-transparent hover:bg-black/5 opacity-70 hover:opacity-100')}`}
                >
                  <button
                    onClick={() => openSession(session.id)}
                    className="w-full text-left px-4 py-4 flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2">
                       <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isBlue ? 'text-blue-400' : 'text-pink-500'}`} />
                       <p className={`text-sm font-bold truncate ${isBlue ? 'text-white' : 'text-black/80'}`}>{session.title}</p>
                    </div>
                    <p className={`text-[10px] font-semibold opacity-40 pl-5 uppercase tracking-tighter`}>{new Date(session.updatedAt).toLocaleDateString()}</p>
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all active:scale-90 ${isBlue ? 'text-red-400/60 hover:text-red-400 hover:bg-red-400/10' : 'text-red-500/60 hover:text-red-500 hover:bg-red-100'}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-inherit">
                <div className={`p-4 rounded-2xl ${isBlue ? 'bg-blue-500/10' : 'bg-pink-50'} border ${isBlue ? 'border-blue-500/20' : 'border-pink-100'}`}>
                    <p className="text-[10px] font-black uppercase mb-2 opacity-40">{t('coach.pro_tip')}</p>
                    <p className="text-[11px] font-medium leading-relaxed opacity-60">{t('coach.tip_text')}</p>
                </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main Chat Area ── */}
      <div className={`flex-1 flex flex-col min-w-0 relative transition-colors duration-700 ${isBlue ? 'bg-[#0b0e23]' : ''}`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between gap-3 px-6 py-4 border-b relative z-10 transition-colors duration-500 ${isBlue ? 'bg-[#0f172a]/80 backdrop-blur-xl border-indigo-500/20' : 'bg-white/70 backdrop-blur-xl border-black/10'}`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-xl border transition-all active:scale-90 ${isBlue ? 'border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10' : 'border-black/10 text-black/60 hover:bg-black/5 hover:text-black'}`}
            >
              {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner ${isBlue ? 'bg-indigo-900/30 border-indigo-500/40 shadow-indigo-500/20' : 'bg-pink-100 border-pink-200'}`}>
                <Bot className={isBlue ? 'text-indigo-400' : 'text-pink-600'} size={22} />
              </div>
              <div>
                <h3 className={`font-black text-sm tracking-tight ${isBlue ? 'text-white' : 'text-slate-800'}`}>{assistantName}</h3>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className={`text-[10px] font-bold uppercase tracking-widest opacity-40 italic`}>{t('coach.status')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className={`p-2.5 rounded-xl border transition-all active:scale-95 ${isBlue ? 'border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10' : 'border-black/20 text-black hover:bg-black/5'}`}
              title="Assistant Settings"
            >
              <SettingsIcon className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 md:px-12 custom-scrollbar space-y-8">
          <div className="max-w-5xl mx-auto space-y-10 py-4">
            {showGreeting && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 space-y-6"
              >
                <div className={`mx-auto w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl relative ${isBlue ? 'bg-gradient-to-br from-indigo-600 to-cyan-500 shadow-indigo-500/30' : 'bg-gradient-to-br from-pink-500 to-rose-400'}`}>
                  <Sparkles className="w-10 h-10 text-white animate-pulse" />
                  <div className={`absolute -bottom-2 -right-2 p-2 rounded-xl bg-white shadow-xl ${isBlue ? 'text-indigo-500' : 'text-pink-500'}`}>
                      <Bot size={20} />
                  </div>
                </div>
                <div>
                    <h2 className={`text-4xl md:text-5xl font-black tracking-tighter ${isBlue ? 'text-white' : 'text-slate-900'}`}>
                        {getTimeGreeting()}, <span className={isBlue ? 'text-indigo-400' : 'text-pink-500'}>{displayName}</span>
                    </h2>
                    <p className={`mt-4 text-base md:text-lg font-medium max-w-lg mx-auto leading-relaxed ${isBlue ? 'text-indigo-100/60' : 'text-slate-500'}`}>
                        {t('coach.subtitle')}
                    </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                   {[t('coach.prompts.workout'), t('coach.prompts.meal'), t('coach.prompts.sleep')].map((s, i) => (
                       <button key={i} onClick={() => setInput(s)} className={`px-5 py-2.5 rounded-2xl border text-sm font-bold transition-all hover:-translate-y-1 active:scale-95 ${isBlue ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20' : 'bg-white border-pink-200 text-pink-700 hover:shadow-lg hover:border-pink-300'}`}>
                           {s}
                       </button>
                   ))}
                </div>
                <p className={`mt-8 text-[10px] font-black uppercase tracking-[0.3em] ${apiReady ? (isBlue ? 'text-emerald-500/50' : 'text-emerald-600/50') : 'text-red-500 animate-pulse'}`}>
                  {apiReady ? t('coach.status_active') : t('coach.status_lost')}
                </p>
              </motion.div>
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, x: msg.role === 'user' ? 40 : -40, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
                  className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg ${msg.role === 'user' ? (isBlue ? 'bg-gradient-to-tr from-blue-600 to-cyan-500 border-white/20' : 'bg-gradient-to-tr from-pink-400 to-rose-400 border-white/40') : (isBlue ? 'bg-slate-800 border-blue-500/20' : 'bg-white border-black/10')}`}>
                    {msg.role === 'user' ? <User className="w-5 text-white" /> : <Bot className={`w-5 ${isBlue ? 'text-blue-400' : 'text-pink-600'}`} />}
                  </div>

                  <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                      <motion.div
                        className={`p-4 md:p-5 rounded-[2rem] text-sm md:text-[15px] leading-relaxed shadow-xl ${msg.role === 'user' 
                           ? (isBlue ? 'bg-gradient-to-r from-indigo-600 to-blue-500 border border-indigo-400/30 text-white rounded-tr-none shadow-indigo-500/20' : 'bg-white border border-pink-100 text-slate-800 rounded-tr-none') 
                           : (isBlue ? 'bg-[#1a1c4b]/80 backdrop-blur-md border border-indigo-500/20 text-indigo-50 shadow-indigo-500/5 rounded-tl-none' : 'bg-white border border-black/5 text-slate-700 rounded-tl-none shadow-pink-500/5')}`}
                      >
                        <div className="whitespace-pre-wrap coach-message-content">{msg.text}</div>
                      </motion.div>
                      
                      <div className={`flex items-center gap-4 px-2 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <span className={`text-[10px] font-black uppercase tracking-widest opacity-30`}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.role === 'model' && (
                            <button
                              onClick={() => handleCopy(msg)}
                              className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 ${isBlue ? 'text-blue-400/60 hover:text-blue-400' : 'text-pink-500/60 hover:text-pink-600'}`}
                            >
                              <Copy size={11} />
                              {copiedMessageId === msg.id ? 'Saved' : 'Copy'}
                            </button>
                          )}
                      </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && <TypingDots />}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input area */}
        <div className={`pt-4 pb-2 md:pt-6 md:pb-4 md:px-12 border-t relative overflow-hidden transition-colors duration-500 mt-auto ${isBlue ? 'bg-[#0f172a] border-indigo-500/20' : 'bg-white/90 backdrop-blur-xl border-black/10'}`}>
          <div className="max-w-5xl mx-auto">
            
            <AnimatePresence>
                {lastUserPrompt && !isLoading && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 10 }}
                        className="mb-4 flex justify-end"
                    >
                        <button
                          onClick={handleRegenerate}
                          disabled={isLoading || !apiReady}
                          className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all active:scale-95 disabled:opacity-50 ${isBlue ? 'bg-blue-500/10 border-blue-500/30 text-blue-200 hover:bg-blue-500/20' : 'bg-pink-50 border-pink-200 text-pink-600 hover:bg-white hover:shadow-lg'}`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          {t('coach.regenerate')}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative group">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={t('coach.placeholder')}
                  className={`w-full px-7 pr-32 py-5 rounded-[2rem] border outline-none transition-all resize-none shadow-2xl custom-scrollbar ${isBlue ? 'bg-[#1a1c4b] border-indigo-500/30 text-white placeholder-indigo-300/30 focus:border-indigo-400/60 shadow-indigo-500/10' : 'border-black/10 bg-white text-slate-800 focus:border-pink-300 shadow-pink-500/10'}`}
                  style={{ maxHeight: '180px' }}
                />

                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                  <button
                    onClick={handleVoiceToggle}
                    disabled={!voiceSupported}
                    className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all active:scale-90 ${isListening ? 'bg-red-500 border-red-400 text-white animate-pulse' : (isBlue ? 'bg-indigo-900/40 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white' : 'bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-500 hover:text-white')}`}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 translate-y-0 disabled:opacity-30 disabled:translate-y-0 ${isBlue ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-500' : 'bg-pink-500 text-white shadow-lg shadow-pink-500/40 hover:bg-pink-600'}`}
                  >
                    <Send size={18} />
                  </button>
                </div>
            </div>

            <div className="mt-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    {voiceError ? (
                        <p className="text-[10px] font-bold text-red-500 flex items-center gap-1"><Bot size={12}/> {voiceError}</p>
                    ) : (
                        <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2`}>
                            <Sparkles size={12} className={isBlue ? 'text-indigo-400' : 'text-pink-500'}/>
                            {isListening ? t('coach.capturing') : t('coach.status')}
                        </p>
                    )}
                </div>
                <p className={`text-[9px] font-bold opacity-30 italic`}>
                    {t('settings.sections.about')} - GenFit Assistant
                </p>
            </div>
          </div>
        </div>
      </div>

      <AICoachSettings 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        name={assistantName}
        setName={setAssistantName}
        tone={assistantTone}
        setTone={setAssistantTone}
        onSave={saveSettings}
        isBlue={isBlue}
        t={t}
      />
    </div>
  );
};

// ... at the bottom of the file, outside the component or inside if desired ...
const AICoachSettings: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    name: string;
    setName: (n: string) => void;
    tone: string;
    setTone: (t: string) => void;
    onSave: () => void;
    isBlue: boolean;
    t: any;
}> = ({ isOpen, onClose, name, setName, tone, setTone, onSave, isBlue, t }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className={`rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl border relative overflow-hidden ${isBlue ? 'bg-[#0f172a] border-indigo-500/20 shadow-indigo-500/10' : 'bg-white border-pink-100'}`}>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className={`p-4 rounded-2xl ${isBlue ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-pink-100'}`}>
                                <Sliders className={`w-6 h-6 ${isBlue ? 'text-indigo-400' : 'text-pink-500'}`} />
                            </div>
                            <div>
                                <h2 className={`text-2xl font-black tracking-tight ${isBlue ? 'text-white' : 'text-slate-900'}`}>{t('coach.settings.title')}</h2>
                                <p className={`text-xs font-bold uppercase tracking-widest opacity-40`}>{t('coach.settings.subtitle')}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 opacity-50 ${isBlue ? 'text-indigo-400' : 'text-slate-500'}`}>{t('coach.settings.name')}</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                                    <input 
                                        value={name} 
                                        onChange={e => setName(e.target.value)}
                                        className={`w-full border rounded-2xl pl-12 pr-5 py-4 font-bold text-sm focus:outline-none transition-all ${isBlue ? 'bg-[#0b0e23] border-indigo-500/30 text-white focus:border-indigo-400 shadow-inner' : 'bg-slate-50 border-slate-100 focus:border-pink-300'}`} 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 opacity-50 ${isBlue ? 'text-indigo-400' : 'text-slate-500'}`}>{t('coach.settings.tone')}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['professional', 'friendly', 'intense', 'minimalist'].map(toneKey => (
                                        <button 
                                            key={toneKey}
                                            onClick={() => setTone(t(`coach.tones.${toneKey}`))}
                                            className={`px-4 py-3 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${tone === t(`coach.tones.${toneKey}`) 
                                                ? (isBlue ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/40' : 'bg-pink-500 border-pink-400 text-white shadow-lg shadow-pink-500/40')
                                                : (isBlue ? 'border-indigo-500/10 text-indigo-300/40 hover:bg-indigo-500/5' : 'border-slate-100 text-slate-400 hover:bg-slate-50')}`}
                                        >
                                            {t(`coach.tones.${toneKey}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={onSave}
                                className={`w-full py-5 mt-4 rounded-[1.5rem] text-white font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 ${isBlue ? 'bg-gradient-to-r from-indigo-600 to-blue-500 shadow-indigo-500/20' : 'bg-gradient-to-r from-pink-500 to-rose-400 shadow-pink-500/20'}`}>
                                {t('coach.settings.apply')}
                            </button>
                        </div>

                        <button onClick={onClose}
                            className={`absolute -top-4 -right-4 p-3 rounded-full transition-all active:scale-90 ${isBlue ? 'bg-indigo-900/40 text-indigo-400 hover:bg-indigo-800' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                            <X size={20} />
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

export default AICoach;

