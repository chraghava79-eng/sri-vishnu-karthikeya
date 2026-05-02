import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import GlassCard from './GlassCard';

interface NeuralSyncProps {
  isSyncing: boolean;
  error: string | null;
  onRetry?: () => void;
  lastSyncTime?: Date | null;
}

export default function NeuralSync({ isSyncing, error, onRetry, lastSyncTime }: NeuralSyncProps) {
  return (
    <AnimatePresence>
      {(isSyncing || error) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
          className="fixed top-6 right-6 z-[100] max-w-[280px]"
        >
          <GlassCard className="glass-morphism-dark p-4 border-white/10 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="relative mt-1">
                {isSyncing ? (
                  <div className="relative w-5 h-5">
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 bg-blue-500 rounded-full blur-md"
                    />
                    <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full" />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="absolute inset-0 border-2 border-t-blue-400 rounded-full" 
                    />
                  </div>
                ) : error ? (
                  <AlertCircle className="text-red-400" size={20} />
                ) : (
                  <CheckCircle2 className="text-green-400" size={20} />
                )}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
                    Neural Sync
                  </span>
                  {lastSyncTime && !isSyncing && !error && (
                    <span className="text-[8px] text-gray-500 font-bold uppercase">
                      Just now
                    </span>
                  )}
                </div>
                
                <p className="text-xs font-bold text-current leading-tight italic tracking-tight opacity-90">
                  {isSyncing 
                    ? "Recalibrating neural nodes..." 
                    : error 
                      ? "Sync protocol failed" 
                      : "Neural topography updated"}
                </p>
                
                {error && (
                  <div className="pt-2">
                    <p className="text-[9px] text-red-400 font-medium mb-2 leading-relaxed">
                      Neural protocol interrupted.
                    </p>
                    <button
                      onClick={onRetry}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform border border-red-500/20"
                    >
                      <RefreshCw size={10} />
                      Retry Sync
                    </button>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
