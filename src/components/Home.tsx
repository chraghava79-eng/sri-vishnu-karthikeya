import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { APP_LOGO } from '../constants';
import GlassCard from './GlassCard';
import { Flame, TrendingUp, Brain, MessageCircle, Zap, Loader2, Activity, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { safeStorage } from '../lib/utils';

interface HomeProps {
  profile: UserProfile | null;
  onOpenPaywall: () => void;
  onOpenCoach: () => void;
  onRandomTask: () => void;
  onOpenAlternativeMode: () => void;
}

export default function Home({ profile, onOpenPaywall, onOpenCoach, onRandomTask, onOpenAlternativeMode }: HomeProps) {
  const [insight, setInsight] = useState<string>(() => safeStorage.get('daily_insight', ""));
  const [loadingInsight, setLoadingInsight] = useState(false);

  const fears = useMemo(() => profile?.fears || [], [profile?.fears]);
  const averageFear = useMemo(() => 
    fears.length > 0 
      ? Math.round(fears.reduce((acc, f) => acc + (f.score || 0), 0) / fears.length)
      : 0,
  [fears]);

  const neuralStatus = useMemo(() => {
    if (averageFear > 80) return { label: 'Resilient', color: 'text-green-600', bg: 'bg-green-50' };
    if (averageFear > 50) return { label: 'Stable', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (averageFear > 20) return { label: 'Fluctuating', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-50' };
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
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `User Profile:
        Rank: ${profile.rank}
        Streak: ${profile.streak} days
        Average Mastery: ${averageFear}%
        
        Generate a 1-sentence, high-impact "Neural Insight" for the user's dashboard. 
        It should be clinical, data-driven, and encouraging. 
        Focus on their current rank and mastery. 
        Keep it under 25 words.`,
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
      className="p-4 sm:p-6 space-y-6 sm:space-y-8 safe-top pb-24"
    >
      <header className="flex justify-between items-center bg-white/50 backdrop-blur-md -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 border-b border-gray-100 sticky top-0 z-50">
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={APP_LOGO} 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover shadow-lg border border-white/20" 
              alt="FEAR" 
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 bg-blue-500/10 rounded-xl pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[7px] sm:text-[8px] font-black text-blue-600 uppercase tracking-[0.3em]">Neural Resilience Protocol</h2>
              <div className={`px-1.5 py-0.5 rounded-full ${neuralStatus.bg} ${neuralStatus.color} text-[6px] font-black uppercase tracking-widest border border-current/10`}>
                {neuralStatus.label}
              </div>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Welcome, {profile.displayName.split(' ')[0]}</h1>
          </div>
        </motion.div>
        <motion.button 
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenPaywall} 
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200"
        >
          <TrendingUp size={18} className="sm:w-5 sm:h-5" />
        </motion.button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
          <GlassCard className="bg-orange-50 border-orange-100 p-3 sm:p-4 h-full">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <Flame size={14} className="sm:w-5 sm:h-5" />
              <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider">Streak</span>
            </div>
            <div className="text-2xl sm:text-4xl font-bold text-orange-900">{profile.streak}</div>
            <p className="text-[8px] sm:text-[10px] text-orange-700 mt-1">Days of resilience</p>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
          <GlassCard className="bg-blue-50 border-blue-100 p-3 sm:p-4 h-full">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Brain size={14} className="sm:w-5 sm:h-5" />
              <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider">Mindset</span>
            </div>
            <div className="text-xl sm:text-4xl font-bold text-blue-900 truncate">{profile.rank}</div>
            <p className="text-[8px] sm:text-[10px] text-blue-700 mt-1">Current Mastery</p>
          </GlassCard>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <GlassCard className="relative overflow-hidden p-4 sm:p-6 bg-white/40 border-white/60">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Mastery Topography</h3>
              <div className="flex items-center gap-2">
                <Activity size={12} className="text-blue-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Feed</span>
              </div>
            </div>
            <div className="flex items-end gap-2 sm:gap-3 h-32 sm:h-40">
              {fears.map((fear, i) => (
                <div key={fear.type} className="flex-1 flex flex-col items-center gap-3 group">
                  <div className="relative w-full flex-1 flex flex-col justify-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${fear.score || 0}%` }}
                      transition={{ delay: 0.5 + (i * 0.1), duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                      className={`w-full rounded-t-lg relative overflow-hidden ${
                        fear.score > 70 ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 
                        fear.score > 30 ? 'bg-blue-400/60' : 'bg-red-400/40'
                      }`}
                    >
                      <motion.div 
                        animate={{ y: [0, -100] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent h-20"
                      />
                    </motion.div>
                  </div>
                  <span className="text-[7px] sm:text-[8px] text-gray-400 font-bold uppercase tracking-wider rotate-45 origin-left whitespace-nowrap mt-1 group-hover:text-blue-600 transition-colors">
                    {fear.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[80px] -mr-24 -mt-24" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[80px] -ml-24 -mb-24" />
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <GlassCard onClick={onOpenCoach} className="p-4 sm:p-6 text-center hover:bg-blue-50 transition-colors cursor-pointer border-none shadow-sm h-full">
            <Brain className="mx-auto text-blue-600 mb-2 sm:mb-3 sm:w-8 sm:h-8" size={24} />
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">AI Coach</h3>
            <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest">Neural Support</p>
          </GlassCard>
        </motion.div>
        <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <GlassCard onClick={onRandomTask} className="p-4 sm:p-6 text-center hover:bg-orange-50 transition-colors cursor-pointer border-none shadow-sm h-full">
            <Zap className="mx-auto text-orange-600 mb-2 sm:mb-3 sm:w-8 sm:h-8" size={24} />
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">Unknown Mode</h3>
            <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest">Random Protocol</p>
          </GlassCard>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <GlassCard 
          onClick={onOpenAlternativeMode}
          className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100 cursor-pointer relative overflow-hidden group"
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-600" />
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Alternative Fear Mode</h3>
              </div>
              <p className="text-xs text-gray-500">Try a different way to break your fear</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
              <Brain size={20} />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />
        </GlassCard>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-3 sm:space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Daily Insights</h3>
          {profile.subscriptionStatus === 'free' && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 rounded-full text-blue-600">
              <Zap size={10} />
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{profile.aiCredits ?? 0} AI Credits</span>
            </div>
          )}
        </div>
        <GlassCard className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
            <MessageCircle size={16} className="sm:w-5 sm:h-5" />
          </div>
          <div>
            {loadingInsight ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 size={12} className="animate-spin text-blue-400" />
                <span className="text-[10px] sm:text-xs text-blue-400 font-medium italic">Analyzing neural patterns...</span>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-700 italic leading-relaxed">
                "{insight || "Neural resilience is trending upward. Continue the protocol."}"
              </p>
            )}
            <button onClick={onOpenCoach} className="mt-3 text-[10px] sm:text-xs font-bold text-blue-600 flex items-center gap-1 active:scale-95 transition-transform">
              Ask AI Coach <TrendingUp size={10} className="sm:w-3 sm:h-3" />
            </button>
          </div>
        </GlassCard>
      </motion.div>

      {profile.subscriptionStatus === 'free' && (
        <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <GlassCard onClick={onOpenPaywall} className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none p-5 sm:p-6 cursor-pointer">
            <h3 className="text-base sm:text-lg font-bold mb-1">Unlock Full Network</h3>
            <p className="text-[10px] sm:text-xs text-blue-100 mb-4">Get AI-generated tasks and advanced analytics.</p>
            <div className="flex items-center justify-between">
              <span className="text-lg sm:text-xl font-bold">$4.99/mo</span>
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-blue-600 rounded-xl text-[10px] sm:text-xs font-bold active:scale-95 transition-transform">Upgrade Now</div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  );
}
