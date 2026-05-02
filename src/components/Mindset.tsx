import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { getMindsetInfo, MINDSET_LEVELS } from '../lib/utils';
import GlassCard from './GlassCard';
import { ArrowLeft, Trophy, Zap, Star, Shield, Crown, Sparkles } from 'lucide-react';
import { APP_LOGO } from '../constants';

interface MindsetProps {
  profile: UserProfile;
  onClose: () => void;
}

export default function Mindset({ profile, onClose }: MindsetProps) {
  const mindsetInfo = getMindsetInfo(profile.xp || 0);

  const getIcon = (rank: string) => {
    switch (rank) {
      case 'Beginner': return <Star size={24} />;
      case 'Intermediate': return <Zap size={24} />;
      case 'Pro': return <Shield size={24} />;
      case 'Experienced': return <Trophy size={24} />;
      case 'Elite': return <Crown size={24} />;
      case 'God': return <Sparkles size={24} />;
      default: return <Star size={24} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-0 z-[100] bg-[var(--bg)] flex flex-col overflow-hidden"
    >
      {/* Atmospheric Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ repeat: Infinity, duration: 10 }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[100px]" 
        />
      </div>

      <header className="flex justify-between items-center p-4 sm:p-6 border-b border-white/10 glass-morphism sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h2 className="text-[8px] sm:text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Neural Evolution</h2>
            <h1 className="text-lg sm:text-xl font-bold text-white italic tracking-tight">Mindset Levels</h1>
          </div>
        </div>
        <img src={APP_LOGO} className="w-8 h-8 rounded-lg object-cover border border-white/20" alt="FEAR" />
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 pb-24 relative z-10">
        {/* Current Status */}
        <section className="text-center space-y-6">
          <div className="relative inline-block">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 6 }}
              className={`w-28 h-28 sm:w-36 sm:h-36 rounded-[2.5rem] ${mindsetInfo.bg.replace('bg-', 'bg-').replace('50', '900/40')} ${mindsetInfo.color} flex items-center justify-center shadow-2xl border border-current/20 relative z-10 backdrop-blur-xl`}
            >
              {getIcon(mindsetInfo.rank)}
            </motion.div>
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full -z-10" />
          </div>
          
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase">{mindsetInfo.rank}</h2>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">{profile.xp || 0} Total Neural XP</p>
          </div>

          <div className="max-w-xs mx-auto space-y-3">
            <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
              <span>Progress to {mindsetInfo.nextLevel?.rank || 'MAX'}</span>
              <span className="text-blue-400">{Math.round(mindsetInfo.progress)}%</span>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${mindsetInfo.progress}%` }}
                transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                className={`h-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.6)]`}
              />
            </div>
            {mindsetInfo.nextLevel && (
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">
                {mindsetInfo.nextLevel.minXp - (profile.xp || 0)} XP remaining
              </p>
            )}
          </div>
        </section>

        {/* Level Roadmap */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Evolution Roadmap</h3>
          <div className="space-y-3">
            {MINDSET_LEVELS.map((level) => {
              const isUnlocked = (profile.xp || 0) >= level.minXp;
              const isCurrent = mindsetInfo.rank === level.rank;

              return (
                <GlassCard 
                  key={level.rank}
                  className={`p-4 flex items-center gap-4 transition-all border-white/5 ${
                    isCurrent ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)] scale-[1.02]' : 
                    isUnlocked ? 'bg-white/5' : 'opacity-30 grayscale blur-[1px]'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${level.bg.replace('bg-', 'bg-').replace('50', '900/40')} ${level.color} shrink-0 border border-current/10`}>
                    {getIcon(level.rank)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-bold italic tracking-tight ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>{level.rank}</h4>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-[7px] font-black uppercase tracking-widest rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]">Current</span>
                      )}
                    </div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                      {level.minXp}+ XP
                    </p>
                  </div>
                  {!isUnlocked && (
                    <div className="text-gray-600">
                      <Star size={16} />
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </section>

        <GlassCard className="p-6 bg-white/5 border-white/5 text-center space-y-3">
          <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">How to Evolve?</h4>
          <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
            Complete exposure tasks and alternative protocols to gain Neural XP. Each difficulty level provides different synaptic rewards:
          </p>
          <div className="flex justify-center gap-6 pt-2">
            <div className="text-center">
              <div className="text-xs font-black text-green-400 italic">10 XP</div>
              <div className="text-[7px] text-gray-600 uppercase font-black tracking-widest">Easy</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-black text-blue-400 italic">20 XP</div>
              <div className="text-[7px] text-gray-600 uppercase font-black tracking-widest">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-black text-red-400 italic">30 XP</div>
              <div className="text-[7px] text-gray-600 uppercase font-black tracking-widest">Hard</div>
            </div>
          </div>
        </GlassCard>
      </main>
    </motion.div>
  );
}
