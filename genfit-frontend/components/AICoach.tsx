import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, DailyStats, Theme } from '../types';
import { createWellnessCoachChat, formatAiError, hasGeminiApiKey } from '../services/geminiService';
import { 
  Bot, Copy, MessageSquare, Mic, MicOff, Plus, 
  RotateCcw, Send, Sparkles, Trash2, User, 
  PanelLeftClose, PanelLeftOpen,
  Settings as SettingsIcon, X, Sliders
} from 'lucide-react';
import { Chat, GenerateContentResponse } from '@google/genai';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

interface AICoachProps {
  stats: DailyStats;
  theme: Theme;
}

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

const AICoach: React.FC<AICoachProps> = ({ stats }) => {
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [assistantName, setAssistantName] = useState(() => localStorage.getItem('zenfit_assistant_name') || 'GenFit Core');
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
    <div className="flex gap-1.5 ml-14 items-center">
      <motion.span className="w-1.5 h-1.5 bg-blue-400 rounded-full" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} />
      <motion.span className="w-1.5 h-1.5 bg-blue-400 rounded-full" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
      <motion.span className="w-1.5 h-1.5 bg-blue-400 rounded-full" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
      <span className="ml-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Processing...</span>
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
      } catch { }
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
        ...msg, timestamp: new Date(msg.timestamp),
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
          .join(' ').trim();
        if (transcript) setInput((prev) => (prev ? `${prev} ${transcript}`.trim() : transcript));
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setVoiceError(event?.error === 'not-allowed' ? t('coach.errors.mic_denied') : t('coach.errors.voice_fail'));
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

    return () => speechRef.current?.stop();
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
        if (copy[index].role === 'model') { copy.splice(index, 1); break; }
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
    } catch {}
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
    try { speechRef.current.start(); } 
    catch { setIsListening(false); setVoiceError(t('coach.errors.voice_ready')); }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showGreeting = messages.length === 0;

  return (
    <div className="w-full h-screen bg-[#010101] text-white flex overflow-hidden">
      
      {/* ── Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }} animate={{ width: '280px', opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex flex-col border-r border-white/5 bg-[#030303] h-full relative z-20 shrink-0"
          >
            <div className="p-5 flex items-center justify-between border-b border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{t('coach.history')}</span>
              <button
                onClick={createNewChat}
                className="p-2 rounded-xl border border-white/5 text-white/50 hover:text-white hover:bg-white/5 transition-all"
                title="New Chat"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative rounded-xl border transition-all duration-300 ${session.id === activeSessionId
                    ? 'border-blue-500/30 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                    : 'border-transparent hover:bg-white/5 text-white/60 hover:text-white'}`}
                >
                  <button
                    onClick={() => openSession(session.id)}
                    className="w-full text-left px-4 py-3 flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-3 mb-1">
                       <MessageSquare className={`w-4 h-4 shrink-0 ${session.id === activeSessionId ? 'text-blue-400' : 'text-white/30'}`} />
                       <p className={`text-sm font-semibold truncate ${session.id === activeSessionId ? 'text-white' : ''}`}>{session.title}</p>
                    </div>
                    <p className="text-[9px] font-bold opacity-40 pl-7 uppercase tracking-widest">{new Date(session.updatedAt).toLocaleDateString()}</p>
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all text-white/40 hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-white/5">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-sky-400 mb-2">{t('coach.pro_tip')}</p>
                <p className="text-xs font-light tracking-wide text-white/50 leading-relaxed">{t('coach.tip_text')}</p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-[#010101]">
        
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/5 bg-[#030303] relative z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 rounded-xl border border-white/5 text-white/50 hover:bg-white/5 transition-all"
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <Bot className="text-blue-400" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide text-white">{assistantName}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{t('coach.status')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 rounded-xl border border-white/5 text-white/50 hover:text-white hover:bg-white/5 transition-all"
              title="Assistant Settings"
            >
              <SettingsIcon className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-6 relative z-10">
          <div className="max-w-4xl mx-auto py-4">
            {showGreeting && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24 space-y-8">
                <div className="mx-auto w-24 h-24 rounded-[2rem] flex items-center justify-center relative bg-[#050505] border border-white/5 shadow-2xl group">
                  <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-[2rem] group-hover:bg-blue-500/40 transition-colors" />
                  <Sparkles className="w-10 h-10 text-blue-400 relative z-10" />
                </div>
                <div>
                   <h2 className="text-4xl lg:text-5xl font-medium tracking-tighter text-white">
                       {getTimeGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-400">{displayName}</span>
                   </h2>
                   <p className="mt-4 text-sm font-light text-white/50 tracking-wide max-w-md mx-auto">{t('coach.subtitle')}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-6">
                   {[t('coach.prompts.workout'), t('coach.prompts.meal'), t('coach.prompts.sleep')].map((s, i) => (
                       <button key={i} onClick={() => setInput(s)} className="px-5 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-[11px] font-bold text-white/60 tracking-widest uppercase hover:text-white hover:border-blue-500/30 hover:bg-blue-500/10 transition-all">
                           {s}
                       </button>
                   ))}
                </div>
                {!apiReady && <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-rose-500 flex items-center justify-center gap-2 animate-pulse"><X size={14}/> {t('coach.status_lost')}</p>}
              </motion.div>
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-4 mb-8 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-1 shadow-lg ${msg.role === 'user' ? 'bg-gradient-to-tr from-sky-500 to-blue-600 border-white/10' : 'bg-[#050505] border-white/5'}`}>
                    {msg.role === 'user' ? <User className="w-5 text-white" /> : <Bot className="w-5 text-blue-400" />}
                  </div>

                  <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                      <div className={`p-5 rounded-[1.5rem] text-sm leading-relaxed shadow-xl border ${msg.role === 'user' ? 'bg-[#050505] border-white/5 text-white rounded-tr-sm' : 'bg-[#030303] border-white/5 text-white/90 rounded-tl-sm'}`}>
                        <div className="whitespace-pre-wrap tracking-wide font-light">{msg.text}</div>
                      </div>
                      
                      <div className={`flex items-center gap-4 px-2 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.role === 'model' && (
                            <button
                              onClick={() => handleCopy(msg)}
                              className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-white/30 hover:text-blue-400 transition-colors"
                            >
                              <Copy size={12} /> {copiedMessageId === msg.id ? 'Saved' : 'Copy'}
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
        <div className="pt-4 pb-6 px-4 md:px-8 border-t border-white/5 bg-[#030303] relative z-10">
          <div className="max-w-4xl mx-auto">
            
            <AnimatePresence>
                {lastUserPrompt && !isLoading && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mb-4 flex justify-end">
                        <button
                          onClick={handleRegenerate} disabled={isLoading || !apiReady}
                          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg border border-white/5 bg-white/[0.02] text-white/50 hover:text-white hover:bg-white/5 transition-all"
                        >
                          <RotateCcw className="w-3 h-3" /> {t('coach.regenerate')}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative">
                <textarea
                  rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyPress}
                  placeholder={t('coach.placeholder')}
                  className="w-full px-6 pl-6 pr-32 py-5 rounded-2xl border border-white/10 bg-[#050505] text-white placeholder-white/20 focus:border-blue-500/50 focus:bg-[#070707] transition-all resize-none shadow-2xl outline-none font-medium custom-scrollbar block"
                  style={{ maxHeight: '180px' }}
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    onClick={handleVoiceToggle} disabled={!voiceSupported}
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${isListening ? 'bg-rose-500 border-rose-400 text-white animate-pulse' : 'bg-transparent border-transparent text-white/40 hover:text-white hover:bg-white/5'}`}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  <button
                    onClick={handleSend} disabled={!input.trim() || isLoading}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-gradient-to-tr from-blue-600 to-sky-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] active:scale-95 disabled:opacity-30 disabled:grayscale"
                  >
                    <Send size={18} />
                  </button>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between px-2">
                <div>
                    {voiceError ? (
                        <p className="text-[10px] font-bold text-rose-500 flex items-center gap-2"><Bot size={12}/> {voiceError}</p>
                    ) : (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                            <Sparkles size={12} className="text-sky-400"/> {isListening ? t('coach.capturing') : t('coach.status')}
                        </p>
                    )}
                </div>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">GenFit AI Engine</p>
            </div>
          </div>
        </div>
      </div>

      <AICoachSettings 
        isOpen={showSettings} onClose={() => setShowSettings(false)}
        name={assistantName} setName={setAssistantName} tone={assistantTone} setTone={setAssistantTone}
        onSave={saveSettings} t={t}
      />
    </div>
  );
};

const AICoachSettings: React.FC<any> = ({ isOpen, onClose, name, setName, tone, setTone, onSave, t }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl border bg-[#050505] border-white/10 relative overflow-hidden">
                    
                    <div className="absolute inset-0 bg-blue-500/5 blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                <Sliders className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-medium tracking-tight text-white">{t('coach.settings.title')}</h2>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-1">{t('coach.settings.subtitle')}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-3 ml-1 text-sky-400">{t('coach.settings.name')}</label>
                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <input 
                                        value={name} onChange={e => setName(e.target.value)}
                                        className="w-full border rounded-2xl pl-12 pr-5 py-4 font-medium text-sm focus:outline-none transition-all bg-[#030303] border-white/10 text-white focus:border-sky-500/50 focus:bg-white/[0.02]" 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-3 ml-1 text-sky-400">{t('coach.settings.tone')}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['professional', 'friendly', 'intense', 'minimalist'].map(toneKey => (
                                        <button 
                                            key={toneKey} onClick={() => setTone(t(`coach.tones.${toneKey}`))}
                                            className={`px-4 py-3.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${tone === t(`coach.tones.${toneKey}`) 
                                                ? 'bg-sky-500/10 border-sky-500/50 text-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.2)]'
                                                : 'border-white/5 bg-[#030303] text-white/40 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            {t(`coach.tones.${toneKey}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={onSave}
                                className="w-full py-5 mt-4 rounded-2xl text-white font-bold text-[11px] uppercase tracking-widest bg-gradient-to-r from-sky-500 to-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all active:scale-95 mt-6">
                                {t('coach.settings.apply')}
                            </button>
                        </div>

                        <button onClick={onClose}
                            className="absolute -top-4 -right-4 p-3 rounded-xl border border-white/5 text-white/30 hover:bg-white/5 hover:text-white transition-all">
                            <X size={18} />
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

export default AICoach;
