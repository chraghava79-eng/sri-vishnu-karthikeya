import { useState, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, FearType } from '../types';
import { CORE_FEARS, APP_LOGO } from '../constants';
import GlassCard from './GlassCard';
import { ZoomIn, ZoomOut, Move, Activity, Zap, Brain } from 'lucide-react';

interface FearNetworkProps {
  profile: UserProfile | null;
  onSelectFear: (fear: string) => void;
}

import { trackEvent, AnalyticsEvent } from '../services/analytics';

const FearNode = memo(({ pos, score, onSelect }: { pos: any, score: number, onSelect: (fear: string) => void }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.15, zIndex: 30 }}
    whileTap={{ scale: 0.9 }}
    onClick={() => onSelect(pos.fear)}
    style={{ left: pos.x, top: pos.y, willChange: 'transform, opacity' }}
    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 group"
  >
    <div className="relative">
      {/* Outer Ring */}
      <motion.div
        animate={{ 
          rotate: 360,
          borderColor: score > 70 ? ['rgba(239,68,68,0.4)', 'rgba(59,130,246,0.4)', 'rgba(239,68,68,0.4)'] : 'rgba(59,130,246,0.2)'
        }}
        transition={{ 
          rotate: { repeat: Infinity, duration: 10, ease: "linear" },
          borderColor: { repeat: Infinity, duration: 2 }
        }}
        className="absolute -inset-3 rounded-full border border-dashed"
      />
      
      {/* Node Body */}
      <div className="w-16 h-16 rounded-2xl bg-[var(--card-bg)] border border-white/10 shadow-2xl flex flex-col items-center justify-center overflow-hidden relative group-hover:border-blue-500/50 transition-all backdrop-blur-xl">
        {/* Progress Fill */}
        <motion.div 
          initial={{ height: 0 }}
          animate={{ height: `${score}%` }}
          className={`absolute bottom-0 left-0 right-0 opacity-20 transition-all duration-1000 ${
            score < 30 ? 'bg-red-500' : 'bg-blue-500'
          }`}
        />
        
        <span className={`text-xl font-black tracking-tighter italic ${score < 30 ? 'text-red-500 dark:text-red-400' : 'text-[var(--text)]'}`}>
          {Math.round(score)}
        </span>
        <div className="text-[6px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Mastery</div>
      </div>

      {/* Status Indicator */}
      <AnimatePresence>
        {score > 70 && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full border-2 border-[var(--bg)] flex items-center justify-center shadow-lg"
          >
            <Activity size={10} className="text-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Label */}
    <div className="px-4 py-2 rounded-xl glass-morphism border-[var(--border)] shadow-xl group-hover:border-blue-500/50 transition-all">
      <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] whitespace-nowrap group-hover:text-[var(--text)] transition-colors">
        {pos.fear}
      </span>
    </div>
  </motion.button>
));

FearNode.displayName = 'FearNode';

export default function FearNetwork({ profile, onSelectFear }: FearNetworkProps) {
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Circular layout for nodes
  const radius = 140;
  const centerX = 200;
  const centerY = 200;

  const handleZoom = (delta: number) => {
    const newScale = Math.min(Math.max(scale + delta, 0.5), 2.5);
    setScale(newScale);
    trackEvent(AnalyticsEvent.ZOOM_CHANGE, { scale: newScale });
  };

  const handleNodeSelect = (fear: string) => {
    onSelectFear(fear);
    trackEvent(AnalyticsEvent.FEAR_SELECT, { fear });
  };

  // Pre-calculate node positions for the "web" connections
  const nodePositions = useMemo(() => {
    return CORE_FEARS.map((fear, i) => {
      const angle = (i / CORE_FEARS.length) * 2 * Math.PI;
      // Add slight jitter based on fear name hash for a more organic feel
      const hash = fear.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const jitter = (hash % 20) - 10;
      return {
        fear,
        x: centerX + (radius + jitter) * Math.cos(angle),
        y: centerY + (radius + jitter) * Math.sin(angle),
        angle
      };
    });
  }, [radius, centerX, centerY]);

  if (!profile) return null;

  return (
    <div className="flex flex-col h-full min-h-[600px] p-6 bg-transparent safe-top relative overflow-hidden">
      {/* Neural Pulse Background */}
      <div className="absolute inset-0 -z-10 opacity-40 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[100px]" 
        />
      </div>

      <header className="mb-6 flex justify-between items-end shrink-0 glass-morphism -mx-6 px-6 py-8 border-b border-[var(--border)] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={APP_LOGO} 
              className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-xl shadow-2xl border border-[var(--border)]" 
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
            <div className="flex items-center gap-2 mb-1">
              <Brain size={14} className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em]">Neural Topography</h2>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text)] leading-tight tracking-tighter italic uppercase">Mastery Network</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Zoom Level</span>
            <span className="text-xs font-black text-blue-600 dark:text-blue-400 italic">{Math.round(scale * 100)}%</span>
          </div>
          <div className="flex gap-1 glass-morphism p-1.5 rounded-2xl border border-[var(--border)] shadow-xl bg-[var(--card-bg)]">
            <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleZoom(0.2)}
              className="p-2.5 rounded-xl transition-all text-[var(--text)] hover:text-blue-600 dark:hover:text-blue-400 active:scale-90"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleZoom(-0.2)}
              className="p-2.5 rounded-xl transition-all text-[var(--text)] hover:text-blue-600 dark:hover:text-blue-400 active:scale-90"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </motion.button>
            <div className="w-px bg-[var(--border)] mx-1" />
            <div 
              className={`p-2.5 rounded-xl transition-all ${isDragging ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-[var(--text-secondary)]'}`}
              title="Pan Enabled"
            >
              <Move size={18} />
            </div>
          </div>
        </div>
      </header>

      <div 
        ref={containerRef}
        className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden rounded-[3.5rem] glass-morphism border border-[var(--border)] shadow-2xl"
      >
        {/* Neural Grid Background */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(var(--text-secondary)_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--text-secondary)_1px,transparent_1px),linear-gradient(to_bottom,var(--text-secondary)_1px,transparent_1px)] [background-size:80px_80px]" />
        </div>

        <motion.div
          drag
          dragConstraints={containerRef}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          animate={{ scale }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="relative w-[400px] h-[400px]">
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Inter-node Web Connections */}
              {nodePositions.map((pos, i) => {
                const nextPos = nodePositions[(i + 1) % nodePositions.length];
                return (
                  <motion.line
                    key={`web-${i}`}
                    x1={pos.x} y1={pos.y}
                    x2={nextPos.x} y2={nextPos.y}
                    stroke="var(--border)"
                    strokeWidth="1"
                    strokeOpacity="0.2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, delay: i * 0.1 }}
                  />
                );
              })}

              {/* Core Connections */}
              {nodePositions.map((pos, i) => {
                const fears = profile.fears || [];
                const fearData = fears.find(f => f.type === pos.fear);
                const score = fearData?.score || 50;
                const intensity = score / 100;
                
                return (
                  <g key={`core-lines-${i}`}>
                    <line
                      x1={centerX} y1={centerY}
                      x2={pos.x} y2={pos.y}
                      stroke="var(--border)"
                      strokeWidth="1"
                      strokeOpacity="0.1"
                    />
                    <motion.line
                      x1={centerX} y1={centerY}
                      x2={pos.x} y2={pos.y}
                      stroke="url(#lineGradient)"
                      strokeWidth={1 + intensity * 3}
                      strokeDasharray="10 15"
                      animate={{ 
                        strokeDashoffset: [0, -50],
                        opacity: [0.1, intensity * 0.8, 0.1]
                      }}
                      transition={{ 
                        strokeDashoffset: { repeat: Infinity, duration: 4 - intensity * 2, ease: "linear" },
                        opacity: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                      }}
                      filter="url(#glow)"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Central Neural Hub */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                boxShadow: [
                  "0 0 20px rgba(59, 130, 246, 0.1)",
                  "0 0 40px rgba(59, 130, 246, 0.2)",
                  "0 0 20px rgba(59, 130, 246, 0.1)"
                ]
              }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-[var(--bg)] border border-blue-500/20 flex items-center justify-center z-10 backdrop-blur-3xl shadow-xl"
            >
              <div className="flex flex-col items-center">
                <Zap size={20} className="text-blue-600 dark:text-blue-400 mb-1 animate-pulse" />
                <div className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] italic">Core</div>
              </div>
            </motion.div>

            {/* Fear Nodes */}
            {nodePositions.map((pos) => {
              const fears = profile.fears || [];
              const fearData = fears.find(f => f.type === pos.fear);
              const score = fearData?.score || 50;

              return (
                <FearNode 
                  key={pos.fear} 
                  pos={pos} 
                  score={score} 
                  onSelect={handleNodeSelect} 
                />
              );
            })}
          </div>
        </motion.div>
      </div>

      <GlassCard className="mt-8 bg-[var(--card-bg)] border-[var(--border)] p-6 shadow-xl">
        <div className="flex gap-5 items-start">
          <div className="p-3 bg-blue-500/10 rounded-2xl shrink-0 border border-blue-500/20 shadow-xl">
            <Activity size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] mb-1.5 italic">Neural Insight</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              The network visualization represents your <span className="text-[var(--text)] font-black italic">Neural Topography</span>. 
              Nodes with lower mastery (red indicators) require immediate exposure protocols to strengthen synaptic resilience.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
