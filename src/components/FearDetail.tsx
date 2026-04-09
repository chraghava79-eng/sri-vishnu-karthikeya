import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { FearType, UserProfile, ExposureTask } from '../types';
import { MOCK_TASKS, APP_LOGO } from '../constants';
import GlassCard from './GlassCard';
import { X, CheckCircle2, ArrowRight, Info, Loader2, Trophy, Sparkles, RefreshCw, Star } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDocs, Timestamp, getCountFromServer, limit, onSnapshot } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";
import confetti from 'canvas-confetti';

interface FearDetailProps {
  fearType: FearType;
  profile: UserProfile;
  onClose: () => void;
  setIsUpdating: (val: boolean) => void;
  initialTaskId?: string;
}

import { trackEvent, AnalyticsEvent } from '../services/analytics';

export default function FearDetail({ fearType, profile, onClose, setIsUpdating, initialTaskId }: FearDetailProps) {
  const [selectedTask, setSelectedTask] = useState<ExposureTask | null>(initialTaskId ? MOCK_TASKS.find(t => t.id === initialTaskId) || null : null);
  const [step, setStep] = useState<'info' | 'pre' | 'post' | 'success'>('info');
  const [beforeFear, setBeforeFear] = useState(5);
  const [afterFear, setAfterFear] = useState(5);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [isNodeCompleted, setIsNodeCompleted] = useState(false);

  const fearData = profile.fears.find(f => f.type === fearType);
  const score = fearData?.score || 50;
  
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'users', profile.userId, 'logs'),
      where('fearType', '==', fearType)
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const ids = new Set(snap.docs.map(d => d.data().taskId));
      setCompletedTaskIds(ids);
      setLoadingHistory(false);
      
      const totalTasks = MOCK_TASKS.filter(t => t.fearType === fearType).length;
      if (ids.size >= totalTasks && totalTasks > 0) {
        setIsNodeCompleted(true);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${profile.userId}/logs`);
      setLoadingHistory(false);
    });

    return () => unsubscribe();
  }, [fearType, profile.userId]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  const tasks = useMemo(() => {
    const allTasks = MOCK_TASKS.filter(t => t.fearType === fearType);
    // Sort by difficulty: easy -> medium -> hard
    const order = { easy: 0, medium: 1, hard: 2 };
    
    // Shuffle within tiers for variety on refresh
    return [...allTasks]
      .sort(() => Math.random() - 0.5)
      .sort((a, b) => order[a.difficulty] - order[b.difficulty]);
  }, [fearType, refreshKey]);

  const handleTaskStart = useCallback(() => {
    if (selectedTask) {
      setStep('pre');
      trackEvent(AnalyticsEvent.TASK_START, { fearType, taskId: selectedTask.id, difficulty: selectedTask.difficulty });
    }
  }, [selectedTask, fearType]);

  const handleComplete = useCallback(async () => {
    if (!selectedTask) return;

    // Trigger confetti immediately for better UX
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#6366f1', '#22c55e']
    });

    trackEvent(AnalyticsEvent.TASK_COMPLETE, { 
      fearType, 
      taskId: selectedTask.id, 
      beforeFear, 
      afterFear,
      reduction: beforeFear - afterFear
    });

    const log = {
      userId: profile.userId,
      taskId: selectedTask.id,
      fearType,
      beforeFear,
      afterFear,
      timestamp: serverTimestamp(),
    };

    // Optimistic UI update
    setCompletedTaskIds(prev => new Set(prev).add(selectedTask.id));
    setStep('success');

    // Background sync
    setIsUpdating(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // 1. Calculate new score
      const gain = Math.max(0, beforeFear - afterFear) * (selectedTask.difficulty === 'hard' ? 2 : selectedTask.difficulty === 'medium' ? 1.5 : 1);
      const newScore = Math.min(100, score + gain);

      // 2. Update profile logic
      const updatedFears = profile.fears.map(f => 
        f.type === fearType ? { ...f, score: newScore, lastUpdated: new Date().toISOString() } : f
      );

      const finalFears = updatedFears.map(f => 
        f.type !== fearType ? { ...f, score: Math.min(100, f.score + (gain * 0.1)) } : f
      );

      // 3. Streak logic (Check logs for today)
      const logsQuery = query(
        collection(db, 'users', profile.userId, 'logs'),
        where('timestamp', '>=', Timestamp.fromDate(new Date(today)))
      );

      const [_, logsSnap] = await Promise.all([
        addDoc(collection(db, 'users', profile.userId, 'logs'), log),
        getDocs(logsQuery) // Using getDocs instead of getCountFromServer for potentially better compatibility/speed in some cases
      ]);

      const todayLogsCount = logsSnap.size + 1;
      let newStreak = profile.streak;
      let newLastTaskDate = profile.lastTaskDate;

      if (todayLogsCount >= 3) {
        if (profile.lastTaskDate !== today) {
          if (profile.lastTaskDate === yesterday) {
            newStreak = profile.streak + 1;
          } else {
            newStreak = 1;
          }
          newLastTaskDate = today;
        }
      }

      await updateDoc(doc(db, 'users', profile.userId), {
        fears: finalFears,
        streak: newStreak,
        lastTaskDate: newLastTaskDate
      });

      // Generate AI Insight in parallel with the success screen
      setIsGeneratingInsight(true);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const reduction = beforeFear - afterFear;
      const percentBetter = beforeFear > 0 ? Math.round((reduction / beforeFear) * 100) : 0;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `User completed: ${selectedTask.description}
        Fear: ${fearType}
        Improvement: ${percentBetter}%
        
        Generate a 1-sentence, high-impact "Neural Recalibration" insight. 
        If they completed all tasks for this node, mention they are "Great" or "Exceptional".
        Keep it under 20 words.`,
      });
      setAiInsight(response.text || "Neural pathways are strengthening. Resilience increased.");
      
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${profile.userId}/logs`);
    } finally {
      setIsUpdating(false);
      setIsGeneratingInsight(false);
    }
  }, [selectedTask, fearType, beforeFear, afterFear, profile.userId, profile.fears, profile.streak, profile.lastTaskDate, score, setIsUpdating]);

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 200 }}
      className="fixed inset-0 bg-white/95 backdrop-blur-3xl z-[60] flex flex-col overflow-hidden"
    >
      <header className="p-6 flex justify-between items-center border-b border-gray-100 bg-white/50 backdrop-blur-xl safe-top">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={APP_LOGO} className="w-10 h-10 object-cover rounded-xl shadow-lg" alt="FEAR" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-blue-500/10 rounded-xl pointer-events-none" />
          </div>
          <div>
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Neural Analysis</h2>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight tracking-tighter italic">{fearType}</h1>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose} 
          className="p-2 bg-gray-100 rounded-full text-gray-500"
        >
          <X size={24} />
        </motion.button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {step === 'info' && (
          <>
            <div className="flex justify-center py-8 relative">
              <motion.div 
                animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="absolute inset-0 bg-blue-500 rounded-full blur-[60px] max-w-[200px] mx-auto"
              />
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="96" cy="96" r="88"
                    fill="none" stroke="#f3f4f6" strokeWidth="12"
                  />
                  <motion.circle
                    initial={{ strokeDasharray: "0 553" }}
                    animate={{ strokeDasharray: `${(score / 100) * 553} 553` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx="96" cy="96" r="88"
                    fill="none" stroke="#3b82f6" strokeWidth="12"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center relative z-10">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-5xl font-black text-gray-900 tracking-tighter"
                  >
                    {Math.round(score)}%
                  </motion.div>
                  <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">Mastery</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900">Exposure Ladder</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">10-Step Protocol</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleRefresh}
                    className="p-2 bg-gray-100 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                    title="Refresh Protocol"
                  >
                    <RefreshCw size={14} className={isRefreshing ? "animate-spin-once" : ""} />
                  </button>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                    {loadingHistory ? "Loading..." : `${completedTaskIds.size} / 10 Mastered`}
                  </span>
                </div>
              </div>
              
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 size={32} className="animate-spin mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Syncing History...</p>
                </div>
              ) : completedTaskIds.size === MOCK_TASKS.filter(t => t.fearType === fearType).length ? (
                <GlassCard className="bg-green-50 border-green-100 text-center py-8">
                  <Trophy className="mx-auto text-green-600 mb-3" size={40} />
                  <h4 className="text-lg font-bold text-gray-900 mb-1">Category Mastered!</h4>
                  <p className="text-xs text-gray-500 max-w-[200px] mx-auto leading-relaxed">
                    You've completed every unique task in this category. You can still repeat them to maintain your resilience.
                  </p>
                </GlassCard>
              ) : null}

              <div key={refreshKey} className="relative pl-8 space-y-6">
                {/* The Ladder Vertical Line */}
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-100">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${tasks.length > 0 ? (completedTaskIds.size / tasks.length) * 100 : 0}%` }}
                    className="w-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  />
                </div>

                {!loadingHistory && tasks
                  .map((task, index) => {
                    const isCompleted = completedTaskIds.has(task.id);
                    const isSelected = selectedTask?.id === task.id;
                    
                    return (
                      <div key={task.id} className="relative">
                        {/* Ladder Step Node */}
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className={`absolute -left-[29px] top-4 w-4 h-4 rounded-full border-2 z-10 transition-all duration-500 ${
                            isCompleted 
                              ? "bg-blue-500 border-blue-200 shadow-[0_0_8px_rgba(59,130,246,0.4)]" 
                              : "bg-white border-gray-200"
                          }`}
                        >
                          {isCompleted && <div className="w-full h-full flex items-center justify-center text-[8px] text-white font-bold">✓</div>}
                        </motion.div>

                        <GlassCard
                          onClick={() => setSelectedTask(task)}
                          className={`border-2 transition-all relative overflow-hidden group ${
                            isSelected ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100/50" : "border-gray-100"
                          } ${isCompleted ? "opacity-80" : ""}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Step {index + 1}</span>
                              <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                task.difficulty === 'hard' ? "bg-red-100 text-red-600" :
                                task.difficulty === 'medium' ? "bg-orange-100 text-orange-600" :
                                "bg-green-100 text-green-600"
                              }`}>
                                {task.difficulty}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400">+{task.points} pts</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed font-medium">{task.description}</p>
                          
                          {/* Selection Indicator */}
                          {isSelected && (
                            <motion.div 
                              layoutId="active-task"
                              className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"
                            />
                          )}
                        </GlassCard>
                      </div>
                    );
                  })}
              </div>
            </div>
          </>
        )}

        {step === 'pre' && (
          <div className="space-y-8 text-center pt-12">
            <h2 className="text-3xl font-bold text-gray-900">Initial Assessment</h2>
            <p className="text-gray-500">How much fear do you feel right now regarding this task?</p>
            <div className="flex justify-center gap-2">
              {[...Array(11)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBeforeFear(i)}
                  className={`w-8 h-12 rounded-lg font-bold transition-all ${
                    beforeFear === i ? "bg-blue-600 text-white scale-110" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'post' && (
          <div className="space-y-8 text-center pt-12">
            <h2 className="text-3xl font-bold text-gray-900">Reflection</h2>
            <p className="text-gray-500">Task complete. How much fear do you feel now?</p>
            <div className="flex justify-center gap-2">
              {[...Array(11)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setAfterFear(i)}
                  className={`w-8 h-12 rounded-lg font-bold transition-all ${
                    afterFear === i ? "bg-blue-600 text-white scale-110" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 pt-24">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600"
            >
              <CheckCircle2 size={48} />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900">Progress Recorded</h2>
            
            {isNodeCompleted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex items-center gap-3 max-w-xs"
              >
                <Star className="text-yellow-500 shrink-0" size={24} fill="currentColor" />
                <p className="text-xs font-bold text-yellow-800 text-left">
                  Exceptional! You have mastered every protocol in this node. You are truly great.
                </p>
              </motion.div>
            )}
            
            <GlassCard className="bg-blue-50 border-blue-100 max-w-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Sparkles size={40} />
              </div>
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Sparkles size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Neural Insight</span>
              </div>
              {isGeneratingInsight ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 size={14} className="animate-spin text-blue-400" />
                  <span className="text-xs text-blue-400 font-medium italic">Recalibrating...</span>
                </div>
              ) : (
                <p className="text-sm text-blue-900 font-medium leading-relaxed italic">
                  "{aiInsight}"
                </p>
              )}
            </GlassCard>

            <p className="text-gray-500 max-w-xs text-xs">
              Your mastery level has increased. The neural network is recalibrating to your new baseline.
            </p>
            <button
              onClick={onClose}
              className="w-full py-4 bg-black text-white rounded-2xl font-bold active:scale-95 transition-transform"
            >
              Return to Network
            </button>
          </div>
        )}
      </div>

      {step !== 'success' && (
        <div className="p-6 border-t border-gray-100 safe-bottom">
          <button
            disabled={!selectedTask}
            onClick={() => {
              if (step === 'info') handleTaskStart();
              else if (step === 'pre') setStep('post');
              else if (step === 'post') handleComplete();
            }}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            {step === 'info' ? "Start Task" : step === 'pre' ? "Task Completed" : "Submit Reflection"}
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </motion.div>
  );
}
