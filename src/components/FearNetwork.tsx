import { useState, useRef, useMemo } from 'react';
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
      return {
        fear,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        angle
      };
    });
  }, [radius, centerX, centerY]);

  if (!profile) return null;

  return (
    <div className="flex flex-col h-full min-h-[600px] p-6 bg-transparent safe-top relative overflow-hidden">
      {/* Neural Pulse Background */}
      <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-400 rounded-full blur-[100px]" 
        />
      </div>

      <header className="mb-6 flex justify-between items-end shrink-0 bg-white/50 backdrop-blur-md -mx-6 px-6 py-4 border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={APP_LOGO} className="w-10 h-10 object-cover rounded-xl shadow-lg" alt="FEAR" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-blue-500/10 rounded-xl pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain size={14} className="text-blue-500" />
              <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Neural Topography</h2>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tighter italic">Mastery Network</h1>
          </div>
        </div>
        <div className="flex gap-1 bg-white/80 backdrop-blur-md p-1 rounded-2xl border border-gray-100 shadow-sm">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleZoom(0.2)}
            className="p-2.5 hover:bg-gray-50 rounded-xl transition-all text-gray-600 active:scale-90"
          >
            <ZoomIn size={18} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleZoom(-0.2)}
            className="p-2.5 hover:bg-gray-50 rounded-xl transition-all text-gray-600 active:scale-90"
          >
            <ZoomOut size={18} />
          </motion.button>
          <div className="w-px bg-gray-100 mx-1" />
          <div className={`p-2.5 rounded-xl transition-all ${isDragging ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-400'}`}>
            <Move size={18} />
          </div>
        </div>
      </header>

      <div 
        ref={containerRef}
        className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden rounded-[2.5rem] bg-white/40 backdrop-blur-sm shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/60"
      >
        {/* Neural Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] [background-size:80px_80px]" />
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
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Inter-node Web Connections */}
              {nodePositions.map((pos, i) => {
                const nextPos = nodePositions[(i + 1) % nodePositions.length];
                const fears = profile.fears || [];
                const fearData = fears.find(f => f.type === pos.fear);
                const score = fearData?.score || 50;
                
                return (
                  <motion.line
                    key={`web-${i}`}
                    x1={pos.x} y1={pos.y}
                    x2={nextPos.x} y2={nextPos.y}
                    stroke="rgba(59, 130, 246, 0.2)"
                    strokeWidth="1"
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
                    {/* Static Line */}
                    <line
                      x1={centerX} y1={centerY}
                      x2={pos.x} y2={pos.y}
                      stroke="rgba(59, 130, 246, 0.1)"
                      strokeWidth="1"
                    />
                    {/* Animated Flow */}
                    <motion.line
                      x1={centerX} y1={centerY}
                      x2={pos.x} y2={pos.y}
                      stroke="url(#lineGradient)"
                      strokeWidth={1 + intensity * 4}
                      strokeDasharray="10 15"
                      animate={{ 
                        strokeDashoffset: [0, -50],
                        opacity: [0.2, intensity, 0.2]
                      }}
                      transition={{ 
                        strokeDashoffset: { repeat: Infinity, duration: 3 - intensity * 2, ease: "linear" },
                        opacity: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                      }}
                      filter="url(#glow)"
                    />
                    
                    {/* Neural Pulse */}
                    {score > 60 && (
                      <motion.circle
                        r="3"
                        fill="#60a5fa"
                        animate={{
                          cx: [centerX, pos.x],
                          cy: [centerY, pos.y],
                          opacity: [0, 1, 0],
                          scale: [0.5, 1.5, 0.5]
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.5 - intensity,
                          delay: i * 0.4,
                          ease: "circIn"
                        }}
                        filter="url(#glow)"
                      />
                    )}
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
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white border border-blue-100 flex items-center justify-center z-10 backdrop-blur-xl shadow-xl"
            >
              <div className="flex flex-col items-center">
                <Zap size={16} className="text-blue-500 mb-1 animate-pulse" />
                <div className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em]">Core</div>
              </div>
            </motion.div>

            {/* Fear Nodes */}
            {nodePositions.map((pos, i) => {
              const fears = profile.fears || [];
              const fearData = fears.find(f => f.type === pos.fear);
              const score = fearData?.score || 50;

              return (
                <motion.button
                  key={pos.fear}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.15, zIndex: 30 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleNodeSelect(pos.fear)}
                  style={{ left: pos.x, top: pos.y }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3 group"
                >
                  <div className="relative">
                    {/* Outer Ring */}
                    <motion.div
                      animate={{ 
                        rotate: 360,
                        borderColor: score > 70 ? ['#ef4444', '#3b82f6', '#ef4444'] : '#3b82f6'
                      }}
                      transition={{ 
                        rotate: { repeat: Infinity, duration: 10, ease: "linear" },
                        borderColor: { repeat: Infinity, duration: 2 }
                      }}
                      className="absolute -inset-2 rounded-full border border-dashed border-blue-500/30"
                    />
                    
                    {/* Node Body */}
                    <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-xl flex flex-col items-center justify-center overflow-hidden relative group-hover:border-blue-500/50 transition-colors">
                      {/* Progress Fill */}
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${score}%` }}
                        className={`absolute bottom-0 left-0 right-0 opacity-10 transition-all duration-1000 ${
                          score < 30 ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                      />
                      
                      <span className={`text-lg font-black tracking-tighter ${score < 30 ? 'text-red-500' : 'text-gray-900'}`}>
                        {Math.round(score)}
                      </span>
                      <div className="text-[6px] font-bold text-gray-400 uppercase tracking-widest">Mastery</div>
                    </div>

                    {/* Status Indicator */}
                    <AnimatePresence>
                      {score > 70 && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
                        >
                          <Activity size={10} className="text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Label */}
                  <div className="px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur-md border border-gray-100 shadow-lg group-hover:border-blue-500/50 transition-all">
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap">
                      {pos.fear}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      <GlassCard className="mt-6 bg-blue-900/10 border-blue-500/20">
        <div className="flex gap-4 items-start">
          <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
            <Activity size={16} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Neural Insight</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              The network visualization represents your <span className="text-gray-900 font-bold">Mastery Topography</span>. 
              Nodes with lower mastery (red indicators) require immediate exposure protocols to strengthen neural resilience.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
