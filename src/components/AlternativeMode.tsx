import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, AlternativeActivity, AlternativeModeType } from '../types';
import { ALTERNATIVE_ACTIVITIES, MICRO_CHALLENGES, APP_LOGO } from '../constants';
import GlassCard from './GlassCard';
import { Brain, Zap, MessageSquare, ArrowLeft, Send, Loader2, CheckCircle2, Sparkles, X } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import confetti from 'canvas-confetti';

interface AlternativeModeProps {
  profile: UserProfile;
  onClose: () => void;
  onOpenPaywall: () => void;
}

export default function AlternativeMode({ profile, onClose, onOpenPaywall }: AlternativeModeProps) {
  const [selectedActivity, setSelectedActivity] = useState<AlternativeActivity | null>(null);
  const [step, setStep] = useState<'selection' | 'activity' | 'result'>('selection');
  
  // Activity States
  const [input, setInput] = useState('');
  const [reframe, setReframe] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState('');
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const startTimer = () => {
    setTimer(60);
    setIsTimerActive(true);
  };

  const handleSelectActivity = (activity: AlternativeActivity) => {
    if (activity.isPremium && profile.subscriptionStatus !== 'premium') {
      onOpenPaywall();
      return;
    }
    setSelectedActivity(activity);
    setStep('activity');
    
    if (activity.type === 'Micro-Challenges') {
      const random = MICRO_CHALLENGES[Math.floor(Math.random() * MICRO_CHALLENGES.length)];
      setCurrentChallenge(random);
    }
  };

  const handleMindReframe = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `User Fear Thought: "${input}"
        
        As a clinical neural resilience coach, provide a 2-sentence cognitive reframe. 
        1. Acknowledge the feeling without judgment.
        2. Provide a logical, action-oriented shift in perspective.
        Tone: Clinical, precise, empowering.`,
      });
      
      const result = response.text || "Neural patterns analyzed. Shift focus to immediate action.";
      setReframe(result);
      
      // Save log
      await addDoc(collection(db, 'users', profile.userId, 'alternative_logs'), {
        userId: profile.userId,
        activityId: selectedActivity?.id,
        type: 'Mind Reframe',
        input,
        reframe: result,
        timestamp: serverTimestamp()
      });
      
      setStep('result');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#6366f1', '#8b5cf6']
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${profile.userId}/alternative_logs`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChallengeComplete = async () => {
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'users', profile.userId, 'alternative_logs'), {
        userId: profile.userId,
        activityId: selectedActivity?.id,
        type: 'Micro-Challenges',
        challenge: currentChallenge,
        timestamp: serverTimestamp()
      });
      setStep('result');
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#f97316', '#fb923c', '#fdba74']
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${profile.userId}/alternative_logs`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReflectionComplete = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'users', profile.userId, 'alternative_logs'), {
        userId: profile.userId,
        activityId: selectedActivity?.id,
        type: 'Reflection',
        input,
        timestamp: serverTimestamp()
      });
      setStep('result');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981']
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${profile.userId}/alternative_logs`);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setSelectedActivity(null);
    setStep('selection');
    setInput('');
    setReframe('');
    setCurrentChallenge('');
    setTimer(0);
    setIsTimerActive(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col"
    >
      <header className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={step === 'selection' ? onClose : reset}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-[8px] sm:text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Neural Protocol</h2>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Alternative Mode</h1>
          </div>
        </div>
        <img src={APP_LOGO} className="w-8 h-8 rounded-lg object-cover" alt="FEAR" />
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {step === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Choose Your Method</h2>
                <p className="text-sm text-gray-500">Select a non-traditional protocol to recalibrate your neural response.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {ALTERNATIVE_ACTIVITIES.map((activity) => (
                  <motion.div
                    key={activity.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <GlassCard 
                      onClick={() => handleSelectActivity(activity)}
                      className={`p-6 cursor-pointer relative overflow-hidden group ${
                        activity.isPremium && profile.subscriptionStatus !== 'premium' ? 'opacity-80' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl ${
                          activity.type === 'Mind Reframe' ? 'bg-blue-50 text-blue-600' :
                          activity.type === 'Micro-Challenges' ? 'bg-orange-50 text-orange-600' :
                          'bg-indigo-50 text-indigo-600'
                        }`}>
                          {activity.type === 'Mind Reframe' && <Brain size={24} />}
                          {activity.type === 'Micro-Challenges' && <Zap size={24} />}
                          {activity.type === 'Reflection' && <MessageSquare size={24} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{activity.title}</h3>
                            {activity.isPremium && (
                              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[7px] font-black uppercase tracking-widest rounded-full">PRO</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{activity.description}</p>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-colors" />
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'activity' && selectedActivity && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full flex flex-col"
            >
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-blue-600" />
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{selectedActivity.type}</span>
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter italic">{selectedActivity.title}</h2>
              </div>

              {selectedActivity.type === 'Mind Reframe' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">The Fear Thought</label>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="e.g., 'I am afraid I will fail this presentation and everyone will think I am incompetent.'"
                      className="w-full h-40 p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none shadow-inner"
                    />
                  </div>
                  <button
                    onClick={handleMindReframe}
                    disabled={isLoading || !input.trim()}
                    className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-bold flex items-center justify-center gap-3 shadow-xl shadow-blue-200 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <><Brain size={20} /> Reframe Neural Path</>}
                  </button>
                </div>
              )}

              {selectedActivity.type === 'Micro-Challenges' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                  <div className="relative">
                    <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-4 animate-pulse">
                      <Zap size={48} />
                    </div>
                    {isTimerActive && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-black text-orange-600">{timer}s</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 max-w-xs">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{currentChallenge}</h3>
                    <p className="text-sm text-gray-500 italic">"Courage is not the absence of fear, but the triumph over it."</p>
                  </div>
                  <div className="w-full space-y-3">
                    {!isTimerActive && timer === 0 && (
                      <button
                        onClick={startTimer}
                        className="w-full py-4 border-2 border-orange-100 text-orange-600 rounded-2xl font-bold active:scale-95 transition-transform"
                      >
                        Start 60s Protocol
                      </button>
                    )}
                    <button
                      onClick={handleChallengeComplete}
                      className="w-full py-5 bg-orange-500 text-white rounded-[2rem] font-bold flex items-center justify-center gap-3 shadow-xl shadow-orange-200 active:scale-95 transition-all"
                    >
                      <CheckCircle2 size={20} /> I Completed This
                    </button>
                  </div>
                </div>
              )}

              {selectedActivity.type === 'Reflection' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Neural Journal Entry</label>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Describe the physical sensations of your fear. Where do you feel it? What is it trying to tell you?"
                      className="w-full h-64 p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none shadow-inner"
                    />
                  </div>
                  <button
                    onClick={handleReflectionComplete}
                    disabled={isLoading || !input.trim()}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-bold flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Seal Reflection</>}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-4">
                <CheckCircle2 size={48} />
              </div>
              
              <div className="space-y-4 max-w-sm">
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter italic">Protocol Success</h2>
                {reframe ? (
                  <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 relative">
                    <Sparkles className="absolute -top-2 -right-2 text-blue-400" size={24} />
                    <p className="text-sm text-blue-900 leading-relaxed italic">"{reframe}"</p>
                  </div>
                ) : (
                  <p className="text-gray-500 leading-relaxed">
                    Your neural resilience has been updated. This activity has been logged in your topography.
                  </p>
                )}
              </div>

              <div className="w-full space-y-3">
                <button
                  onClick={reset}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold active:scale-95 transition-transform"
                >
                  Try Another Method
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold active:scale-95 transition-transform"
                >
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
