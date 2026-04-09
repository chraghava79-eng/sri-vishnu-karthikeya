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
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="fixed top-6 right-6 z-[100] max-w-[280px]"
        >
          <GlassCard className="bg-white/90 backdrop-blur-3xl p-4 border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
            <div className="flex items-start gap-3">
              <div className="relative mt-1">
                {isSyncing ? (
                  <div className="relative w-5 h-5">
                    <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full" />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="absolute inset-0 border-2 border-t-blue-500 rounded-full" 
                    />
                  </div>
                ) : error ? (
                  <AlertCircle className="text-red-500" size={20} />
                ) : (
                  <CheckCircle2 className="text-green-500" size={20} />
                )}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                    Neural Sync
                  </span>
                  {lastSyncTime && !isSyncing && !error && (
                    <span className="text-[8px] text-gray-400 font-bold uppercase">
                      Just now
                    </span>
                  )}
                </div>
                
                <p className="text-xs font-bold text-gray-900 leading-tight">
                  {isSyncing 
                    ? "Recalibrating neural nodes..." 
                    : error 
                      ? "Sync protocol failed" 
                      : "Neural topography updated"}
                </p>
                
                {error && (
                  <div className="pt-2">
                    <p className="text-[9px] text-red-500 font-medium mb-2 leading-relaxed">
                      Unable to load Neural Sync. Please try again.
                    </p>
                    <button
                      onClick={onRetry}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform"
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
