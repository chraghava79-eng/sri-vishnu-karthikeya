import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, Award, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Zap } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, isAfter, startOfDay } from 'date-fns';
import { UserProfile } from '../types';
import GlassCard from './GlassCard';

interface StreakCalendarProps {
  profile: UserProfile;
  onClose: () => void;
}

export default function StreakCalendar({ profile, onClose }: StreakCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // In a real app, we'd fetch streak history from Firestore.
  // For now, we'll simulate it based on the current streak.
  const streakDays = useMemo(() => {
    const dates = [];
    const today = startOfDay(new Date());
    for (let i = 0; i < profile.streak; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(format(d, 'yyyy-MM-dd'));
    }
    return new Set(dates);
  }, [profile.streak]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md glass-morphism-dark rounded-[3rem] overflow-hidden shadow-2xl border border-white/10"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 p-8 text-white relative border-b border-white/10 backdrop-blur-xl">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Flame size={24} className="text-orange-500 fill-orange-500" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-400">Neural Consistency</h2>
          </div>
          <h1 className="text-4xl font-black tracking-tighter italic mb-4">
            {profile.streak} DAY STREAK
          </h1>
          
          {profile.goldBadge && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-2xl px-4 py-2 w-fit"
            >
              <Award size={18} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-200">Gold Resilience Badge</span>
            </motion.div>
          )}
        </div>

        <div className="p-6 sm:p-8">
          {/* Calendar Controls */}
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-white italic tracking-tight">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <ChevronLeft size={20} className="text-gray-400" />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <ChevronRight size={20} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-8">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={`${day}-${i}`} className="text-center text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] py-2">
                {day}
              </div>
            ))}
            {days.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isStreak = streakDays.has(dateStr);
              const isFuture = isAfter(startOfDay(day), startOfDay(new Date()));
              
              return (
                <motion.div 
                  key={dateStr}
                  initial={isToday(day) && isStreak ? { scale: 1 } : false}
                  animate={isToday(day) && isStreak ? { 
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      '0 0 15px rgba(249,115,22,0.4)',
                      '0 0 25px rgba(249,115,22,0.7)',
                      '0 0 15px rgba(249,115,22,0.4)'
                    ]
                  } : {}}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    ease: "easeInOut"
                  }}
                  className={`
                    relative aspect-square flex items-center justify-center rounded-2xl text-xs font-black transition-all
                    ${isStreak ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'text-gray-600 hover:bg-white/5'}
                    ${isToday(day) ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-[var(--bg)]' : ''}
                    ${isFuture ? 'opacity-10' : ''}
                  `}
                >
                  {format(day, 'd')}
                  {isStreak && (
                    <motion.div
                      layoutId="streak-dot"
                      className="absolute -top-1 -right-1"
                      animate={isToday(day) ? {
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.2, 1]
                      } : {}}
                      transition={{ repeat: Infinity, duration: 3 }}
                    >
                      <Flame size={10} className="fill-current text-orange-300" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Progress Info */}
          <GlassCard className="bg-blue-500/10 border-blue-500/20 p-5">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                <Zap size={18} className="text-blue-400" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-1">Badge Requirement</h4>
                <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                  Maintain a <span className="text-blue-400 font-black italic">30-DAY STREAK</span> to earn the permanent Gold Resilience Badge. 
                  {profile.streak >= 30 ? " Protocol complete!" : ` ${30 - profile.streak} cycles remaining.`}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </div>
  );
}
