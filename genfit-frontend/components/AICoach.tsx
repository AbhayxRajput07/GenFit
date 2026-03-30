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

const AICoach: React.FC<AICoachProps> = ({ stats, theme }) => {
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const isRose = theme === 'pink';

  const ui = {
    root: isRose ? 'bg-[#fff7fb] text-[#3d3344]' : 'bg-[#000000] text-[#f5f9ff]',
    sidebar: isRose ? 'border-r border-[#f0dce7] bg-gradient-to-b from-[#fffaf6] to-[#fff3f8]' : 'border-r border-[#1a3158] bg-gradient-to-b from-[#04070f] to-[#0a1428]',
    sidebarHeaderBorder: isRose ? 'border-b border-[#f0dce7]' : 'border-b border-[#21457f]',
    sidebarTitle: isRose ? 'text-[#b08da3]' : 'text-[#9eb9e6]',
    sidebarCreateBtn: isRose
      ? 'border border-[#edd7e2] bg-white/75 text-[#9a7c90] hover:text-[#6c5164] hover:bg-[#fff8fc]'
      : 'border border-[#2b4e82] bg-[#10254a]/85 text-[#d7e6ff] hover:text-white hover:bg-[#173564]',
    sidebarIdleItem: isRose
      ? 'border-transparent hover:bg-[#fff1f7] text-[#8d7687] hover:text-[#563f50]'
      : 'border-transparent hover:bg-[#14315d] text-[#a9c0e6] hover:text-white',
    sidebarActive: isRose
      ? 'border-[#e7bfd1] bg-gradient-to-r from-[#ffeef6] to-[#fff5ee] shadow-[0_10px_24px_rgba(205,143,171,0.18)]'
      : 'border-[#4f7bc2] bg-gradient-to-r from-[#235293] to-[#1a3f79] shadow-[0_12px_28px_rgba(9,23,52,0.45)]',
    sidebarActiveText: isRose ? 'text-[#4f3b49]' : 'text-white',
    sidebarIconIdle: isRose ? 'text-[#bf9eaf]' : 'text-[#90addf]',
    sidebarDate: isRose ? 'text-[#c0a3b1]' : 'text-[#8ca7d4]',
    deleteBtn: isRose
      ? 'text-[#bf97a9] hover:text-[#b04f78] hover:bg-[#ffe8f1]'
      : 'text-[#93b0df] hover:text-white hover:bg-[#1a3768]',
    proTipCard: isRose ? 'bg-[#fff4f9] border border-[#eddbe5]' : 'bg-[#0f2449]/80 border border-[#294b7f]',
    proTipLabel: isRose ? 'text-[#cf6e98]' : 'text-[#2f67ca]',
    proTipText: isRose ? 'text-[#8d7383]' : 'text-[#b7c9eb]',
    mainPanel: isRose ? 'bg-[#fff7fb]' : 'bg-[#000000]',
    ambientGlow: isRose ? 'bg-pink-300/20' : 'bg-blue-500/25',
    header: isRose ? 'border-b border-[#f0dce7] bg-[#fff9fc]/95 backdrop-blur-md' : 'border-b border-[#1f3a66] bg-[#000000]/92 backdrop-blur-md',
    headerBtn: isRose
      ? 'border border-[#edd7e2] bg-white/80 text-[#9a7c90] hover:bg-[#fff8fc] hover:text-[#684d60]'
      : 'border border-[#2b4e82] bg-[#10254a]/80 text-[#d7e6ff] hover:bg-[#173564] hover:text-white',
    headerBtnSettings: isRose
      ? 'border border-[#edd7e2] bg-white/80 text-[#9a7c90] hover:text-[#684d60] hover:bg-[#fff8fc]'
      : 'border border-[#2b4e82] bg-[#10254a]/80 text-[#d7e6ff] hover:text-white hover:bg-[#173564]',
    accentIconWrap: isRose
      ? 'bg-gradient-to-br from-[#ffd8ea] to-[#ffcde2] border border-[#efbfd3] shadow-[0_12px_26px_rgba(205,143,171,0.22)]'
      : 'bg-gradient-to-br from-[#1e4f98] to-[#2e69bf] border border-[#4f7bc2] shadow-[0_12px_28px_rgba(9,23,52,0.4)]',
    accentIcon: isRose ? 'text-[#c95e8d]' : 'text-[#e5efff]',
    headerName: isRose ? 'text-[#4f3d49]' : 'text-[#f5f9ff]',
    headerStatus: isRose ? 'text-[#b494a7]' : 'text-[#a6bde4]',
    statusDot: isRose ? 'bg-emerald-400' : 'bg-emerald-500',
    greetingShell: isRose ? 'bg-gradient-to-br from-[#f8b7d5] via-[#f5aaca] to-[#ef9dbf] border border-[#efbfd3] shadow-[0_18px_34px_rgba(205,143,171,0.26)]' : 'bg-gradient-to-br from-[#78a4f6] to-[#8ab6ff] border border-[#9dbdf5] shadow-[0_20px_40px_rgba(86,132,210,0.3)]',
    greetingGlow: isRose ? 'bg-[#ffd7e8]/45' : 'bg-[#9bc0ff]/40',
    greetingGlowHover: isRose ? 'group-hover:bg-[#ffd7e8]/65' : 'group-hover:bg-[#9bc0ff]/60',
    nameGradient: isRose
      ? 'from-[#fff7ef] via-[#fff4fb] to-[#ffe7f3]'
      : 'from-[#f8fbff] to-[#dce9ff]',
    greetingTitle: isRose ? 'text-[#18223f]' : 'text-white',
    subtitle: isRose ? 'text-[#fff5fb]' : 'text-white/90',
    promptBase: isRose
      ? 'border border-[#edcfdd] bg-[#fff9fc]/95 text-[#ac5f85] hover:text-[#93466d]'
      : 'border border-[#2f5389] bg-[#0f2347]/80 text-[#b8d0f3] hover:text-white',
    promptHover: isRose
      ? 'hover:border-[#e5b8cb] hover:bg-[#fff1f8]'
      : 'hover:border-[#5d88cf] hover:bg-[#153261]',
    userAvatar: isRose ? 'bg-gradient-to-tr from-[#f3a3c6] to-[#eb8eb7] border-[#efbfd3]' : 'bg-gradient-to-tr from-[#5f90f4] to-[#7cabff] border-[#9dbcf3]',
    modelAvatar: isRose ? 'bg-white border-[#ecd2dd]' : 'bg-[#0f2449] border-[#2f5389]',
    botAccent: isRose ? 'text-[#c95e8d]' : 'text-[#2f67ca]',
    userBubble: isRose ? 'bg-gradient-to-tr from-[#f39fc4] to-[#ea87b2] border-[#e8b7cc] text-white' : 'bg-[#0e1f3e] border-[#2f5389] text-[#8cc6ff]',
    modelBubble: isRose ? 'bg-[#fffaf6] border-[#eed9e3] text-[#54485a]' : 'bg-[#e8f1ff] border-[#bfd5f5] text-[#1f3f6f]',
    copyHover: isRose ? 'hover:text-[#b65a84]' : 'hover:text-[#2f67ca]',
    timeText: isRose ? 'text-[#c09faf]' : 'text-[#8ba8d5]',
    inputArea: isRose ? 'border-t border-[#f0dce7] bg-[#fff9fc]/95 backdrop-blur-md' : 'border-t border-[#1f3a66] bg-[#000000]/94 backdrop-blur-md',
    regenBtn: isRose
      ? 'border border-[#ead4df] bg-white text-[#9a7c90] hover:text-[#694f62] hover:bg-[#fff4f9]'
      : 'border border-[#2b4e82] bg-[#10254a]/80 text-[#d7e6ff] hover:text-white hover:bg-[#173564]',
    textarea: isRose
      ? 'border-[#ead4df] bg-[#fffdfa] text-[#4f4354] placeholder-[#bea8b5] focus:bg-white'
      : 'border-[#2b4e82] bg-[#142b57] text-[#f2f7ff] placeholder-[#88a8d8] focus:bg-[#1b3a73]',
    inputFocus: isRose ? 'focus:border-[#d99ab5]' : 'focus:border-[#8fb2f2]',
    voiceIdle: isRose
      ? 'bg-transparent border-transparent text-[#b38ea2] hover:text-[#6a4f62] hover:bg-[#fff1f8]'
      : 'bg-transparent border-transparent text-[#9cb8e6] hover:text-white hover:bg-[#173564]',
    voiceActive: isRose ? 'bg-[#e67da9] border-[#dc6b9c] text-white' : 'bg-[#5f90f4] border-[#4e7fde] text-white',
    sendButton: isRose
      ? 'bg-gradient-to-tr from-[#f39fc4] to-[#ea87b2] text-white shadow-[0_12px_28px_rgba(205,143,171,0.32)] hover:shadow-[0_16px_34px_rgba(205,143,171,0.42)]'
      : 'bg-gradient-to-tr from-[#5f90f4] to-[#7cb0ff] text-white shadow-[0_12px_28px_rgba(86,132,210,0.35)] hover:shadow-[0_16px_34px_rgba(86,132,210,0.45)]',
    statusAccent: isRose ? 'text-[#cf6e98]' : 'text-[#3f7ee8]',
    statusText: isRose ? 'text-[#a78899]' : 'text-[#a9c0e7]',
    engineText: isRose ? 'text-[#c1aab7]' : 'text-[#8ba8d5]',
    modalGlow: isRose ? 'bg-[#ffdce9]/45' : 'bg-blue-300/20',
    modalLabel: isRose ? 'text-[#c16d95]' : 'text-[#4d79b9]',
    toneActive: isRose
      ? 'bg-[#ffeef6] border-[#e8bfd1] text-[#9d5479] shadow-[0_10px_20px_rgba(205,143,171,0.2)]'
      : 'bg-[#1f4a8e] border-[#4f7bc2] text-[#eef4ff] shadow-[0_10px_24px_rgba(9,23,52,0.4)]',
    settingsApply: isRose
      ? 'bg-gradient-to-r from-[#f19ec2] to-[#e687b1] text-white shadow-[0_12px_28px_rgba(205,143,171,0.32)] hover:shadow-[0_16px_34px_rgba(205,143,171,0.42)]'
      : 'bg-gradient-to-r from-[#5f90f4] to-[#7cabff] text-white shadow-[0_12px_26px_rgba(86,132,210,0.35)] hover:shadow-[0_16px_30px_rgba(86,132,210,0.45)]',
    offlineAlert: isRose ? 'text-[#d84686]' : 'text-rose-500'
  };

  const TypingDots = () => (
    <div className="flex gap-1.5 ml-14 items-center">
      <motion.span className={`w-1.5 h-1.5 rounded-full ${isRose ? 'bg-rose-300' : 'bg-blue-400'}`} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} />
      <motion.span className={`w-1.5 h-1.5 rounded-full ${isRose ? 'bg-rose-300' : 'bg-blue-400'}`} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
      <motion.span className={`w-1.5 h-1.5 rounded-full ${isRose ? 'bg-rose-300' : 'bg-blue-400'}`} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
      <span className={`ml-3 text-[10px] font-bold uppercase tracking-[0.2em] ${isRose ? 'text-[#9f8a95]' : 'text-white/30'}`}>Processing...</span>
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
    <div className={`w-full h-screen flex overflow-hidden ${ui.root}`}>
      
      {/* ── Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }} animate={{ width: '280px', opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`flex flex-col h-full relative z-20 shrink-0 ${ui.sidebar}`}
          >
            <div className={`p-5 flex items-center justify-between ${ui.sidebarHeaderBorder}`}>
              <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${ui.sidebarTitle}`}>{t('coach.history')}</span>
              <button
                onClick={createNewChat}
                className={`p-2 rounded-xl transition-all ${ui.sidebarCreateBtn}`}
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
                    ? ui.sidebarActive
                    : ui.sidebarIdleItem}`}
                >
                  <button
                    onClick={() => openSession(session.id)}
                    className="w-full text-left px-4 py-3 flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-3 mb-1">
                       <MessageSquare className={`w-4 h-4 shrink-0 ${session.id === activeSessionId ? ui.botAccent : ui.sidebarIconIdle}`} />
                       <p className={`text-sm font-semibold truncate ${session.id === activeSessionId ? ui.sidebarActiveText : ''}`}>{session.title}</p>
                    </div>
                    <p className={`text-[9px] font-bold pl-7 uppercase tracking-widest ${ui.sidebarDate}`}>{new Date(session.updatedAt).toLocaleDateString()}</p>
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${ui.deleteBtn}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className={`p-4 ${isRose ? 'border-t border-[#e8d9df]' : 'border-t border-white/5'}`}>
              <div className={`p-4 rounded-xl ${ui.proTipCard}`}>
                <p className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${ui.proTipLabel}`}>{t('coach.pro_tip')}</p>
                <p className={`text-xs font-light tracking-wide leading-relaxed ${ui.proTipText}`}>{t('coach.tip_text')}</p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main Chat Area ── */}
      <div className={`flex-1 flex flex-col min-w-0 relative ${ui.mainPanel}`}>
        
        {/* Ambient Glow */}
        <div className={`absolute top-0 right-0 w-[40vw] h-[40vw] blur-[120px] rounded-full pointer-events-none ${ui.ambientGlow}`} />

        {/* Header */}
        <div className={`flex items-center justify-between gap-3 px-6 py-4 relative z-10 ${ui.header}`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2.5 rounded-xl transition-all ${ui.headerBtn}`}
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
            
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ui.accentIconWrap}`}>
                <Bot className={ui.accentIcon} size={20} />
              </div>
              <div>
                <h3 className={`font-bold text-sm tracking-wide ${ui.headerName}`}>{assistantName}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${ui.statusDot}`} />
                    <p className={`text-[9px] font-black uppercase tracking-widest ${ui.headerStatus}`}>{t('coach.status')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className={`p-2.5 rounded-xl transition-all ${ui.headerBtnSettings}`}
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
                <div className={`mx-auto w-24 h-24 rounded-[2rem] flex items-center justify-center relative group ${ui.greetingShell}`}>
                  <div className={`absolute inset-0 blur-2xl rounded-[2rem] transition-colors ${ui.greetingGlow} ${ui.greetingGlowHover}`} />
                  <Sparkles className={`w-10 h-10 relative z-10 ${ui.accentIcon}`} />
                </div>
                <div>
                   <h2 className={`text-4xl lg:text-5xl font-medium tracking-tighter ${ui.greetingTitle}`}>
                       {getTimeGreeting()}, <span className={`text-transparent bg-clip-text bg-gradient-to-r ${ui.nameGradient}`}>{displayName}</span>
                   </h2>
                   <p className={`mt-4 text-sm font-light tracking-wide max-w-md mx-auto ${ui.subtitle}`}>{t('coach.subtitle')}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-6">
                   {[t('coach.prompts.workout'), t('coach.prompts.meal'), t('coach.prompts.sleep')].map((s, i) => (
                     <button key={i} onClick={() => setInput(s)} className={`px-5 py-3 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all ${ui.promptBase} ${ui.promptHover}`}>
                           {s}
                       </button>
                   ))}
                </div>
                {!apiReady && <p className={`mt-6 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${ui.offlineAlert}`}><X size={14}/> {t('coach.status_lost')}</p>}
              </motion.div>
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-4 mb-8 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-1 shadow-lg ${msg.role === 'user' ? ui.userAvatar : ui.modelAvatar}`}>
                    {msg.role === 'user' ? <User className="w-5 text-white" /> : <Bot className={`w-5 ${ui.botAccent}`} />}
                  </div>

                  <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                      <div className={`p-5 rounded-[1.5rem] text-sm leading-relaxed shadow-xl border ${msg.role === 'user' ? `${ui.userBubble} rounded-tr-sm` : `${ui.modelBubble} rounded-tl-sm`}`}>
                        <div className="whitespace-pre-wrap tracking-wide font-light">{msg.text}</div>
                      </div>
                      
                      <div className={`flex items-center gap-4 px-2 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${ui.timeText}`}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.role === 'model' && (
                            <button
                              onClick={() => handleCopy(msg)}
                              className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-white/30 transition-colors ${ui.copyHover}`}
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
        <div className={`pt-4 pb-6 px-4 md:px-8 relative z-10 ${ui.inputArea}`}>
          <div className="max-w-4xl mx-auto">
            
            <AnimatePresence>
                {lastUserPrompt && !isLoading && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mb-4 flex justify-end">
                        <button
                          onClick={handleRegenerate} disabled={isLoading || !apiReady}
                          className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all ${ui.regenBtn}`}
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
                  className={`w-full px-6 pl-6 pr-32 py-5 rounded-2xl border transition-all resize-none shadow-2xl outline-none font-medium custom-scrollbar block ${ui.textarea} ${ui.inputFocus}`}
                  style={{ maxHeight: '180px' }}
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    onClick={handleVoiceToggle} disabled={!voiceSupported}
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${isListening ? ui.voiceActive : ui.voiceIdle}`}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  <button
                    onClick={handleSend} disabled={!input.trim() || isLoading}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:grayscale ${ui.sendButton}`}
                  >
                    <Send size={18} />
                  </button>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between px-2">
                <div>
                    {voiceError ? (
                        <p className={`text-[10px] font-bold flex items-center gap-2 ${ui.offlineAlert}`}><Bot size={12}/> {voiceError}</p>
                    ) : (
                        <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${ui.statusText}`}>
                            <Sparkles size={12} className={ui.statusAccent}/> {isListening ? t('coach.capturing') : t('coach.status')}
                        </p>
                    )}
                </div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${ui.engineText}`}>GenFit AI Engine</p>
            </div>
          </div>
        </div>
      </div>

      <AICoachSettings 
        isOpen={showSettings} onClose={() => setShowSettings(false)}
        name={assistantName} setName={setAssistantName} tone={assistantTone} setTone={setAssistantTone}
        onSave={saveSettings} t={t} theme={theme}
      />
    </div>
  );
};

const AICoachSettings: React.FC<any> = ({ isOpen, onClose, name, setName, tone, setTone, onSave, t, theme }) => (
    <>
    {(() => {
      const isRose = theme === 'pink';
      const modalLabel = isRose ? 'text-[#c16d95]' : 'text-sky-400';
      const toneActive = isRose
        ? 'bg-[#ffeef6] border-[#e8bfd1] text-[#9d5479] shadow-[0_10px_20px_rgba(205,143,171,0.2)]'
        : 'bg-[#dce9ff] border-[#9dbcf3] text-[#2a578f] shadow-[0_10px_24px_rgba(86,132,210,0.2)]';
      const applyClass = isRose
        ? 'bg-gradient-to-r from-[#f19ec2] to-[#e687b1] text-white shadow-[0_12px_28px_rgba(205,143,171,0.32)] hover:shadow-[0_16px_34px_rgba(205,143,171,0.42)]'
        : 'bg-gradient-to-r from-[#5f90f4] to-[#7cabff] text-white shadow-[0_12px_26px_rgba(86,132,210,0.35)] hover:shadow-[0_16px_30px_rgba(86,132,210,0.45)]';
      const modalGlow = isRose ? 'bg-pink-200/50' : 'bg-blue-300/30';
      const modalShell = isRose ? 'bg-[#fffaf6] border-[#eed9e4]' : 'bg-[#f5f9ff] border-[#d5e2f8]';
      const iconWrap = isRose ? 'bg-[#ffeef6] border border-[#e8bfd1]' : 'bg-white border border-[#d3e1f8]';
      const iconColor = isRose ? 'text-[#c16d95]' : 'text-[#356dd0]';
      const titleColor = isRose ? 'text-[#4f3d49]' : 'text-[#274f88]';
      const subtitleColor = isRose ? 'text-[#b393a5]' : 'text-[#7d96be]';
      const inputShell = isRose ? 'bg-white border-[#ead4df] text-[#4f4354] focus:border-[#d99ab5] focus:bg-white' : 'bg-white border-[#cfdcf5] text-[#2b4c78] focus:border-[#8fb2f2] focus:bg-white';
      const toneIdle = isRose ? 'border-[#ead4df] bg-white text-[#a07e90] hover:bg-[#fff2f8] hover:text-[#6c5164]' : 'border-[#cfdcf5] bg-white text-[#6b84af] hover:bg-[#edf3ff] hover:text-[#2a578f]';
      const closeBtn = isRose ? 'border-[#ead4df] text-[#b393a5] hover:bg-[#fff2f8] hover:text-[#6c5164]' : 'border-[#d3e1f8] text-[#7d96be] hover:bg-white hover:text-[#2a578f]';
      const inputIconColor = isRose ? 'text-white/30' : 'text-[#9ab0cf]';

      return (
    <AnimatePresence>
        {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className={`rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl border relative overflow-hidden ${modalShell}`}>
                    
                    <div className={`absolute inset-0 blur-3xl pointer-events-none ${modalGlow}`} />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className={`p-4 rounded-2xl ${iconWrap}`}>
                              <Sliders className={`w-6 h-6 ${iconColor}`} />
                            </div>
                            <div>
                              <h2 className={`text-2xl font-medium tracking-tight ${titleColor}`}>{t('coach.settings.title')}</h2>
                              <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${subtitleColor}`}>{t('coach.settings.subtitle')}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className={`block text-[10px] font-bold uppercase tracking-widest mb-3 ml-1 ${modalLabel}`}>{t('coach.settings.name')}</label>
                                <div className="relative">
                                  <User className={`absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 ${inputIconColor}`} />
                                    <input 
                                        value={name} onChange={e => setName(e.target.value)}
                                      className={`w-full border rounded-2xl pl-12 pr-5 py-4 font-medium text-sm focus:outline-none transition-all ${inputShell}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={`block text-[10px] font-bold uppercase tracking-widest mb-3 ml-1 ${modalLabel}`}>{t('coach.settings.tone')}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['professional', 'friendly', 'intense', 'minimalist'].map(toneKey => (
                                        <button 
                                            key={toneKey} onClick={() => setTone(t(`coach.tones.${toneKey}`))}
                                            className={`px-4 py-3.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${tone === t(`coach.tones.${toneKey}`) 
                                        ? toneActive
                                              : toneIdle}`}
                                        >
                                            {t(`coach.tones.${toneKey}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={onSave}
                                className={`w-full py-5 mt-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 mt-6 ${applyClass}`}>
                                {t('coach.settings.apply')}
                            </button>
                        </div>

                        <button onClick={onClose}
                          className={`absolute -top-4 -right-4 p-3 rounded-xl border transition-all ${closeBtn}`}>
                            <X size={18} />
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
          );
        })()}
        </>
);

export default AICoach;
