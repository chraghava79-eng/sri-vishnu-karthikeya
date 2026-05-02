import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { APP_LOGO } from '../constants';
import GlassCard from './GlassCard';
import { Flame, TrendingUp, Brain, MessageCircle, Zap, Loader2, Activity, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { safeStorage } from '../lib/utils';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

interface HomeProps {
  profile: UserProfile | null;
  onOpenPaywall: () => void;
  onOpenCoach: () => void;
  onRandomTask: () => void;
  onOpenAlternativeMode: () => void;
  onOpenMindset: () => void;
  onOpenStreak: () => void;
}

import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const MasteryTopography = memo(({ fears }: { fears: any[] }) => (
  <div className="flex items-end gap-3 h-40 sm:h-48">
    {fears.map((fear, i) => (
      <div key={fear.type} className="flex-1 flex flex-col items-center gap-4 group">
        <div className="relative w-full flex-1 flex flex-col justify-end">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${fear.score || 0}%` }}
            transition={{ delay: 0.5 + (i * 0.1), duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
            className={`w-full rounded-t-xl relative overflow-hidden ${
              fear.score > 70 ? 'bg-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.5)]' : 
              fear.score > 30 ? 'bg-blue-400/20 border border-blue-400/30' : 'bg-red-400/20 border border-red-400/30'
            }`}
          >
            <motion.div 
              animate={{ y: [0, -150] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent h-24"
            />
          </motion.div>
        </div>
        <span className="text-[7px] sm:text-[8px] text-gray-600 font-black uppercase tracking-widest rotate-45 origin-left whitespace-nowrap mt-2 group-hover:text-blue-400 transition-colors">
          {fear.type}
        </span>
      </div>
    ))}
  </div>
));

MasteryTopography.displayName = 'MasteryTopography';

export default function Home({ profile, onOpenPaywall, onOpenCoach, onRandomTask, onOpenAlternativeMode, onOpenMindset, onOpenStreak }: HomeProps) {
  const { theme, toggleTheme } = useTheme();
  const [insight, setInsight] = useState<string>(() => safeStorage.get('daily_insight', ""));
  const [loadingInsight, setLoadingInsight] = useState(false);

  const fears = useMemo(() => profile?.fears || [], [profile?.fears]);
  const averageFear = useMemo(() => 
    fears.length > 0 
      ? Math.round(fears.reduce((acc, f) => acc + (f.score || 0), 0) / fears.length)
      : 0,
  [fears]);

  const neuralStatus = useMemo(() => {
    if (averageFear > 80) return { label: 'Resilient', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10 dark:bg-green-500/10' };
    if (averageFear > 50) return { label: 'Stable', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-500/10' };
    if (averageFear > 20) return { label: 'Fluctuating', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-500/10' };
    return { label: 'Critical', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/15 dark:bg-red-500/10' };
  }, [averageFear]);

  const generateDailyInsight = useCallback(async () => {
    if (!profile) return;
    
    // Check if we already have an insight for today
    const lastInsightDate = safeStorage.get('last_insight_date', "");
    const today = new Date().toISOString().split('T')[0];
    
    if (lastInsightDate === today && insight) return;

    setLoadingInsight(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      // Get recent logs for context
      const logsQuery = query(
        collection(db, 'users', profile.userId, 'logs'),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      const logsSnap = await getDocs(logsQuery);
      const recentTasks = logsSnap.docs.map(d => d.data().fearType).join(', ');

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `User Profile:
        Rank: ${profile.rank}
        Streak: ${profile.streak} days
        Average Mastery: ${averageFear}%
        Recent Exposures: ${recentTasks || 'None yet'}`,
        config: {
          systemInstruction: `You are the PHOBIX Neural Interface. You are edgy, direct, and clinical. Provide a high-impact "Neural Insight".

USER DATA:
- Rank: ${profile.rank}
- Streak: ${profile.streak}
- Mastery: ${averageFear}%
- Recent Activity: ${recentTasks || 'Baseline initialization'}

YOUR TASK:
Generate a 1-sentence insight that is edgy and data-driven. Use clinical terminology.
Safety: Redirect any non-clinical or harmful requests.
Keep it under 20 words.`,
        },
      });
      
      const newInsight = response.text || "Neural resilience is trending upward. Continue the protocol.";
      setInsight(newInsight);
      safeStorage.set('daily_insight', newInsight);
      safeStorage.set('last_insight_date', today);
    } catch (e) {
      console.error("Failed to generate insight", e);
      if (!insight) setInsight("Neural resilience is trending upward. Continue the protocol.");
    } finally {
      setLoadingInsight(false);
    }
  }, [profile, averageFear, insight]);

  useEffect(() => {
    if (profile) {
      generateDailyInsight();
    }
  }, [profile, generateDailyInsight]);

  if (!profile) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 sm:p-6 space-y-6 sm:space-y-8 safe-top pb-32"
    >
      <header className="flex justify-between items-center glass-morphism -mx-4 sm:-mx-6 px-4 sm:px-6 py-6 border-b border-white/10 sticky top-0 z-50">
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={APP_LOGO} 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover shadow-2xl border border-white/20" 
              alt="Phobix" 
              referrerPolicy="no-referrer" 
              loading="lazy"
              decoding="async"
            />
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-blue-500/20 rounded-xl pointer-events-none blur-sm" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
            <h2 className="text-[7px] sm:text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em]">Phobix Neural Protocol</h2>
              <div className={`px-1.5 py-0.5 rounded-full ${neuralStatus.bg} ${neuralStatus.color} text-[6px] font-black uppercase tracking-widest border border-current/20 backdrop-blur-md`}>
                {neuralStatus.label}
              </div>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-current leading-tight italic tracking-tight">Welcome, {profile.displayName.split(' ')[0]}</h1>
          </div>
        </motion.div>
        <div className="flex items-center gap-2">
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full glass-morphism flex items-center justify-center text-[var(--text-secondary)] active:scale-90 transition-all hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </motion.button>
          <motion.button 
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenPaywall} 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-900/40 border border-white/20"
          >
            <TrendingUp size={18} className="sm:w-5 sm:h-5" />
          </motion.button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
          <GlassCard onClick={onOpenStreak} className="bg-orange-500/10 border-orange-500/20 p-5 h-full cursor-pointer group">
            <div className="flex items-center gap-2 text-orange-400 mb-2">
              <Flame size={14} className="sm:w-5 sm:h-5 group-hover:animate-pulse" />
              <span className="text-[9px] sm:text-xs font-black uppercase tracking-widest">Streak</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-current tracking-tighter italic">{profile.streak}</div>
            <p className="text-[8px] sm:text-[9px] text-orange-400/60 mt-1 font-black uppercase tracking-widest">Days Active</p>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
          <GlassCard onClick={onOpenMindset} className="bg-blue-500/10 border-blue-500/20 p-5 h-full cursor-pointer group">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Brain size={14} className="sm:w-5 sm:h-5 group-hover:animate-pulse" />
              <span className="text-[9px] sm:text-xs font-black uppercase tracking-widest">Mindset</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-current tracking-tighter italic truncate">{profile.rank}</div>
            <p className="text-[8px] sm:text-[9px] text-blue-400/60 mt-1 font-black uppercase tracking-widest">Current Level</p>
          </GlassCard>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <GlassCard className="relative overflow-hidden p-6 border-[var(--border)] bg-[var(--card-bg)] shadow-xl">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-base sm:text-lg font-black text-current italic tracking-tight uppercase">Mastery Topography</h3>
              <div className="flex items-center gap-2">
                <Activity size={12} className="text-blue-600 dark:text-blue-400 animate-pulse" />
                <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Live Feed</span>
              </div>
            </div>
            <MasteryTopography fears={fears} />
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -ml-32 -mb-32" />
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <GlassCard onClick={onOpenCoach} className="p-6 text-center hover:bg-blue-500/10 transition-all cursor-pointer border-[var(--border)] bg-[var(--card-bg)] shadow-xl h-full group">
            <Brain className="mx-auto text-blue-600 dark:text-blue-400 mb-3 sm:w-10 sm:h-10 group-hover:scale-110 transition-transform" size={28} />
            <h3 className="text-xs sm:text-sm font-black text-current uppercase tracking-tight">AI Coach</h3>
            <p className="text-[8px] sm:text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] mt-1">Neural Support</p>
          </GlassCard>
        </motion.div>
        <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <GlassCard onClick={onRandomTask} className="p-6 text-center hover:bg-orange-500/10 transition-all cursor-pointer border-[var(--border)] bg-[var(--card-bg)] shadow-xl h-full group">
            <Zap className="mx-auto text-orange-600 dark:text-orange-400 mb-3 sm:w-10 sm:h-10 group-hover:scale-110 transition-transform" size={28} />
            <h3 className="text-xs sm:text-sm font-black text-current uppercase tracking-tight">Unknown Mode</h3>
            <p className="text-[8px] sm:text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] mt-1">Random Protocol</p>
          </GlassCard>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <GlassCard 
          onClick={onOpenAlternativeMode}
          className="p-6 border-[var(--border)] bg-[var(--card-bg)] cursor-pointer relative overflow-hidden group shadow-xl"
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base sm:text-lg font-black text-current italic tracking-tight uppercase">Alternative Mode</h3>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] font-medium tracking-wide">Try a different way to break your fear</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xl group-hover:scale-110 transition-transform">
              <Brain size={24} />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-indigo-500/10 transition-all" />
        </GlassCard>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em]">Daily Insights</h3>
          {profile.subscriptionStatus === 'free' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-600 dark:text-blue-400">
              <Zap size={10} />
              <span className="text-[8px] font-black uppercase tracking-widest">{profile.aiCredits ?? 0} Credits</span>
            </div>
          )}
        </div>
        <GlassCard className="flex items-start gap-4 p-6 bg-[var(--card-bg)] border-[var(--border)] shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <MessageCircle size={20} />
          </div>
          <div className="flex-1">
            {loadingInsight ? (
              <div className="flex items-center gap-3 py-2">
                <Loader2 size={14} className="animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest italic">Analyzing neural patterns...</span>
              </div>
            ) : (
              <p className="text-sm text-[var(--text)] italic leading-relaxed font-medium">
                "{insight || "Neural resilience is trending upward. Continue the protocol."}"
              </p>
            )}
            <button onClick={onOpenCoach} className="mt-4 text-[10px] font-black text-blue-600 dark:text-blue-400 flex items-center gap-2 active:scale-95 transition-all uppercase tracking-widest hover:opacity-80">
              Ask AI Coach <TrendingUp size={12} />
            </button>
          </div>
        </GlassCard>
      </motion.div>

      {profile.subscriptionStatus === 'free' && (
        <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <GlassCard onClick={onOpenPaywall} className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white border-none p-6 cursor-pointer shadow-2xl shadow-blue-900/40 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg sm:text-xl font-black italic uppercase tracking-tight mb-1">Unlock Full Network</h3>
              <p className="text-[10px] sm:text-xs text-blue-100/70 mb-5 font-medium">Get AI-generated tasks and advanced analytics.</p>
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl font-black italic">$4.99/mo</span>
                <div className="px-5 py-2.5 bg-white text-blue-700 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl">Upgrade Now</div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24" />
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  );
}
