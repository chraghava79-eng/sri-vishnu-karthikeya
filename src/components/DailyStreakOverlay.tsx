import { motion, AnimatePresence } from 'motion/react';
import { Flame, Star, Sparkles, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface DailyStreakOverlayProps {
  streak: number;
  onClose: () => void;
}

export default function DailyStreakOverlay({ streak, onClose }: DailyStreakOverlayProps) {
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 1.1, opacity: 0 }}
        className="relative w-full max-w-sm bg-white rounded-[3rem] p-8 text-center overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.3)]"
      >
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />
        
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="relative z-10 w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-100"
        >
          <Flame size={48} className="text-orange-600 fill-orange-600" />
          <motion.div
            animate={{ opacity: [0, 1, 0], scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-orange-400 rounded-full blur-xl -z-10"
          />
        </motion.div>

        <h2 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.4em] mb-2">Neural Consistency</h2>
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic mb-4">
          STREAK MAINTAINED
        </h1>

        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-12 bg-gray-100" />
          <div className="text-6xl font-black text-gray-900 tracking-tighter">
            {streak}
          </div>
          <div className="h-px w-12 bg-gray-100" />
        </div>

        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Your prefrontal cortex is stabilizing. <br />
          <span className="font-bold text-gray-900">Day {streak}</span> of the protocol is active.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-3 flex flex-col items-center gap-1">
              <Star size={14} className="text-orange-400" />
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Dopamine</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-transform shadow-xl shadow-blue-500/20"
        >
          Continue Protocol
        </button>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [0, -100],
                x: [0, (i % 2 === 0 ? 20 : -20)],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 2
              }}
              className="absolute bottom-0 left-1/2 w-1 h-1 bg-orange-400 rounded-full"
              style={{ left: `${20 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
