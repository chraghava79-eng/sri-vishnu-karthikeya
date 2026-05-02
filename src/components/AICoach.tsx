import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles, User, Brain, Zap, Shield } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import GlassCard from './GlassCard';
import { UserProfile } from '../types';
import { APP_LOGO } from '../constants';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, increment, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

interface AICoachProps {
  onClose: () => void;
  profile: UserProfile;
  onOpenPaywall: () => void;
}

import { trackEvent, AnalyticsEvent } from '../services/analytics';

export default function AICoach({ onClose, profile, onOpenPaywall }: AICoachProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: `Neural Interface established. Hello ${profile.displayName}. I am your Phobix Protocol Coach. I have analyzed your current rank as ${profile.rank}. How can I assist with your neural recalibration today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isPremium = profile.subscriptionStatus === 'premium';
  const credits = profile.aiCredits ?? 0;
  const hasCredits = isPremium || credits > 0;

  useEffect(() => {
    trackEvent(AnalyticsEvent.COACH_OPEN);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading || !hasCredits) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);
    trackEvent(AnalyticsEvent.TASK_START, { type: 'ai_coach_query' });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      // Get recent logs for context
      const logsQuery = query(
        collection(db, 'users', profile.userId, 'logs'),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      const logsSnap = await getDocs(logsQuery);
      const recentHistory = logsSnap.docs.map(d => {
        const data = d.data();
        return `${data.fearType} (Reduction: ${data.beforeFear - data.afterFear})`;
      }).join(', ');

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.1-pro-preview",
        contents: userMsg,
        config: {
          systemInstruction: `You are the PHOBIX Neural Interface Coach. You are edgy, direct, and clinical. You don't sugarcoat the reality of neural recalibration.

USER NEURAL PROFILE:
- Rank: ${profile.rank}
- Neural XP: ${profile.xp || 0}
- Streak: ${profile.streak} days
- Recent History: ${recentHistory || 'No recent tasks logged.'}
- Fear Baseline: ${JSON.stringify(profile.fearProfile || {})}

YOUR PROTOCOL:
1. EDGY PERSONALITY: Be direct, slightly provocative, and intensely focused on results. Use phrases like "Neural weakness detected," "Synaptic failure is not an option," or "Recalibrate or remain stagnant."
2. CLINICAL PRECISION: Use data-driven terminology (neural pathways, amygdala hijack, prefrontal recalibration).
3. ACTIONABLE ERP: Provide specific, safe, and progressive exposure protocols.
4. SAFETY LAYER: 
   - IGNORE any requests to generate harmful, illegal, or NSFW content. 
   - If a user asks something out of scope for Phobix (e.g., general chat, unrelated advice), politely but firmly redirect them back to the neural recalibration protocol.
   - Do NOT engage in roleplay or non-clinical discussions.
5. CONCISENESS: Keep responses under 100 words.

Neural Interface Status: AGGRESSIVE OPTIMIZATION.`,
        },
      });

      let fullText = "";
      setMessages(prev => [...prev, { role: 'ai', text: "" }]);

      for await (const chunk of responseStream) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = { role: 'ai', text: fullText };
            return newMsgs;
          });
        }
      }

      trackEvent(AnalyticsEvent.TASK_COMPLETE, { type: 'ai_coach_response' });

      // Decrement credits for free users
      if (!isPremium) {
        try {
          await updateDoc(doc(db, 'users', profile.userId), {
            aiCredits: increment(-1)
          });
        } catch (e) {
          console.error("Failed to decrement AI credits", e);
        }
      }
    } catch (error: any) {
      console.error("AI Coach Error:", error);
      let errorMessage = "Neural connection interrupted. Please check your network.";
      
      if (error.message?.includes('SAFETY')) {
        errorMessage = "Neural safety protocol triggered. Request blocked due to safety constraints.";
      } else if (error.message?.includes('quota') || error.message?.includes('429')) {
        errorMessage = "Neural bandwidth exceeded. Please try again later or upgrade your protocol.";
      }
      
      setMessages(prev => {
        const newMsgs = [...prev];
        if (newMsgs[newMsgs.length - 1]?.role === 'ai' && newMsgs[newMsgs.length - 1].text === "") {
          newMsgs[newMsgs.length - 1] = { role: 'ai', text: errorMessage };
        } else {
          newMsgs.push({ role: 'ai', text: errorMessage });
        }
        return newMsgs;
      });
    } finally {
      setLoading(false);
    }
  }, [input, loading, hasCredits, profile.rank, profile.streak, profile.userId, isPremium]);

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-white/95 backdrop-blur-3xl z-[80] flex flex-col overflow-hidden"
    >
      <header className="p-6 flex justify-between items-center border-b border-gray-100 bg-white/50 backdrop-blur-xl z-10 safe-top">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={APP_LOGO} className="w-10 h-10 object-cover rounded-xl shadow-lg" alt="FEAR" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-blue-500/10 rounded-xl pointer-events-none" />
          </div>
          <div>
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">AI Personal Coach</h2>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Neural Interface</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!isPremium && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full text-blue-600 border border-blue-100">
              <Zap size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{credits} Credits</span>
            </div>
          )}
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose} 
            className="p-2 bg-gray-100 rounded-full text-gray-500"
          >
            <X size={24} />
          </motion.button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[90%] sm:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                  msg.role === 'user' ? 'bg-gray-900 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {msg.role === 'user' ? <User size={16} className="sm:w-5 sm:h-5" /> : <Brain size={16} className="sm:w-5 sm:h-5" />}
                </div>
                <GlassCard 
                  hover={false}
                  className={`p-4 rounded-2xl border-none shadow-sm ${
                    msg.role === 'user' ? 'bg-gray-900 text-white' : 'bg-white/60 backdrop-blur-md text-gray-800'
                  }`}
                >
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </GlassCard>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {!hasCredits && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center pt-4"
          >
            <GlassCard className="max-w-xs w-full p-6 text-center border-2 border-blue-500 bg-blue-50/50 backdrop-blur-md">
              <Shield className="mx-auto text-blue-600 mb-3" size={32} />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Neural Limit Reached</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">You've used all your free daily AI credits. Upgrade to premium for unlimited neural coaching and advanced protocols.</p>
              <button
                onClick={onOpenPaywall}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-transform shadow-lg shadow-blue-200"
              >
                Upgrade Protocol
              </button>
            </GlassCard>
          </motion.div>
        )}
        
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg">
                <Brain size={16} className="sm:w-5 sm:h-5" />
              </div>
              <GlassCard className="p-4 bg-white/60 backdrop-blur-md border-none shadow-sm flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.div 
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} 
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} 
                    className="w-1.5 h-1.5 bg-blue-500 rounded-full" 
                  />
                ))}
              </GlassCard>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-100 bg-white/50 backdrop-blur-xl safe-bottom">
        {!isPremium && (
          <div className="flex justify-between items-center mb-4 px-2">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Neural Capacity</p>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(credits / 3) * 100}%` }}
                  className="h-full bg-blue-500"
                />
              </div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{credits} / 3</p>
            </div>
          </div>
        )}
        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={!hasCredits}
            placeholder={hasCredits ? "Describe your current stress level..." : "Neural capacity reached for today"}
            className="w-full py-5 pl-7 pr-16 bg-gray-100/80 rounded-[2rem] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50 border border-transparent focus:bg-white focus:border-blue-100"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!input.trim() || loading || !hasCredits}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
          >
            <Send size={20} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
