import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CORE_FEARS, APP_LOGO } from '../constants';
import GlassCard from './GlassCard';
import { ArrowRight, Check, ShieldCheck, Zap, Brain, Sparkles, Target, Activity, Lock, TrendingUp, Users, UserMinus, UserCheck, Mic, Dumbbell, HelpCircle } from 'lucide-react';
import { trackEvent, AnalyticsEvent } from '../services/analytics';
import { FearProfile, PrivacyPreferences } from '../types';

interface OnboardingProps {
  onComplete: (fears: string[], fearProfile: FearProfile, privacyPrefs: PrivacyPreferences) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [selectedFears, setSelectedFears] = useState<string[]>([]);
  const [privacyPrefs, setPrivacyPrefs] = useState<PrivacyPreferences>({
    analyticsEnabled: true,
    dataCollectionAccepted: true,
    marketingEmails: false
  });
  const [fearProfile, setFearProfile] = useState<FearProfile>(() => {
    const profile: any = {};
    CORE_FEARS.forEach(fear => {
      profile[fear] = 50;
    });
    return profile as FearProfile;
  });

  useEffect(() => {
    // Initial mount logic if needed
  }, []);

  const toggleFear = (fear: string) => {
    setSelectedFears(prev => 
      prev.includes(fear) ? prev.filter(f => f !== fear) : [...prev, fear]
    );
  };

  const steps = [
    {
      title: "Privacy & Consent",
      subtitle: "DATA PROTOCOL",
      description: "We value your privacy. Select how you'd like us to handle your neural data and session activity.",
      isPrivacy: true,
      cta: "Accept & Initialize"
    },
    {
      title: "Welcome to FEAR",
      subtitle: "THE NEURAL INTERFACE",
      description: "A clinical, data-driven space designed to transform anxiety into your greatest strength through neural recalibration.",
      icon: <Brain className="text-blue-500" size={48} />,
      cta: "Initialize Journey"
    },
    {
      title: "Science-Backed",
      subtitle: "CLINICAL PRECISION",
      description: "Our system uses proven exposure therapy methods to recalibrate your response based on your inputs and behavioral patterns.",
      icon: <ShieldCheck className="text-blue-500" size={48} />,
      cta: "Learn Methodology"
    },
    {
      title: "Privacy First",
      subtitle: "ENCRYPTED PROTOCOL",
      description: "Your neural data is end-to-end encrypted. We prioritize your anonymity and security above all else.",
      icon: <Lock className="text-blue-500" size={48} />,
      cta: "Secure Session"
    },
    {
      title: "Personalized Path",
      subtitle: "ADAPTIVE LEARNING",
      description: "The AI Coach learns your stress patterns and generates custom exposure tasks tailored to your specific resilience level.",
      icon: <Target className="text-blue-500" size={48} />,
      cta: "Define Goals"
    },
    {
      title: "Fear Breakdown",
      subtitle: "NEURAL BASELINE",
      description: "Manually calibrate your current fear levels across key topics to initialize your neural topography.",
      isFearProfile: true,
      cta: "Calibrate Nodes"
    },
    {
      title: "What do you fear most?",
      subtitle: "NODE SELECTION",
      description: "Select the neural nodes that resonate with your current journey. We'll build your initial fear topography.",
      isSelection: true,
      cta: "Continue"
    }
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step === 0) {
      // First step is privacy consent
      trackEvent(AnalyticsEvent.ONBOARDING_START);
    }
    trackEvent(AnalyticsEvent.ONBOARDING_STEP_COMPLETE, { step, title: currentStep.title });
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem('fear_profile', JSON.stringify(fearProfile));
      localStorage.setItem('privacy_preferences', JSON.stringify(privacyPrefs));
      trackEvent(AnalyticsEvent.ONBOARDING_COMPLETE, { selectedFears, fearProfile, privacyPrefs });
      onComplete(selectedFears, fearProfile, privacyPrefs);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white relative flex flex-col overflow-hidden text-gray-900">
      {/* Neural Network Background Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      {/* Premium Background Blobs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0]
        }}
        transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
        className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-100/30 blur-[150px] rounded-full" 
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          x: [0, -40, 0],
          y: [0, -20, 0]
        }}
        transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
        className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-100/30 blur-[150px] rounded-full" 
      />
      <motion.div 
        animate={{ 
          opacity: [0.1, 0.2, 0.1],
          scale: [0.8, 1.1, 0.8]
        }}
        transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-100/20 blur-[120px] rounded-full" 
      />

      {/* Top Logo Bar */}
      <header className="p-6 sm:p-8 flex justify-center items-center z-20 safe-top">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <img src={APP_LOGO} className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-xl shadow-lg" alt="Phobix" referrerPolicy="no-referrer" />
          <div className="h-4 w-px bg-[var(--border)] mx-1" />
          <span className="text-[10px] sm:text-sm font-black tracking-[0.2em] italic text-[var(--text-secondary)]">NEURAL INTERFACE</span>
        </motion.div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 z-10 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="w-full max-w-lg mb-8"
          >
            <GlassCard className="shimmer-effect bg-white/40 border-white/60 backdrop-blur-[40px] p-6 sm:p-10 md:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.05)] space-y-6 sm:space-y-8 relative overflow-hidden group">
              {/* Glass Highlight Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
              <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.1),transparent)] animate-[spin_10s_linear_infinite] pointer-events-none" />
              
              {/* Subtle Logo in Card */}
              <div className="absolute top-6 right-8 opacity-5 pointer-events-none hidden sm:block">
                <img src={APP_LOGO} className="w-12 h-12 object-cover rounded-xl grayscale" alt="" />
              </div>

              <div className="text-center space-y-4 sm:space-y-6">
                {currentStep.icon && !currentStep.isSelection && (
                  <div className="flex justify-center">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 2, -2, 0]
                      }}
                      transition={{ repeat: Infinity, duration: 5 }}
                      className="p-4 sm:p-6 bg-blue-50 rounded-2xl sm:rounded-3xl border border-blue-100 shadow-inner relative"
                    >
                      <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-full" />
                      <div className="relative z-10">
                        {/* Adjust icon size for mobile */}
                        {currentStep.icon && React.cloneElement(currentStep.icon as React.ReactElement<any>, { size: 32, className: "sm:w-12 sm:h-12 text-blue-500" })}
                      </div>
                    </motion.div>
                  </div>
                )}

                <div className="space-y-2 sm:space-y-3">
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[8px] sm:text-[10px] font-black text-blue-600 uppercase tracking-[0.5em]"
                  >
                    {currentStep.subtitle}
                  </motion.p>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
                    {currentStep.title}
                  </h1>
                </div>
                
                <p className="text-gray-500 max-w-sm mx-auto leading-relaxed text-xs sm:text-sm md:text-base font-medium">
                  {currentStep.description}
                </p>

                {currentStep.isPrivacy && (
                  <div className="space-y-6 mt-8 text-left">
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1 bg-blue-100 rounded-md text-blue-600">
                          <Brain size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Neural Data</p>
                          <p className="text-[10px] text-gray-500 leading-relaxed">Your fear scores and progress are stored securely to personalize your experience.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1 bg-blue-100 rounded-md text-blue-600">
                          <Activity size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Usage Analytics</p>
                          <p className="text-[10px] text-gray-500 leading-relaxed">Non-personal data about how you use the app helps us improve the protocol.</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button 
                        onClick={() => setPrivacyPrefs({ analyticsEnabled: true, dataCollectionAccepted: true, marketingEmails: false })}
                        className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between ${privacyPrefs.analyticsEnabled ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'}`}
                      >
                        <div className="text-left">
                          <p className="text-xs font-bold text-gray-900">Accept All</p>
                          <p className="text-[10px] text-gray-500">Enable all features and analytics for the best experience.</p>
                        </div>
                        {privacyPrefs.analyticsEnabled && <Check size={16} className="text-blue-600" />}
                      </button>

                      <div className="p-4 rounded-2xl border border-gray-100 bg-white space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customize Preferences</p>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-gray-900">Analytics</p>
                            <p className="text-[9px] text-gray-500">Help us improve by sharing anonymous usage data.</p>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={privacyPrefs.analyticsEnabled}
                            onChange={(e) => setPrivacyPrefs(prev => ({ ...prev, analyticsEnabled: e.target.checked }))}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-gray-900">Data Collection</p>
                            <p className="text-[9px] text-gray-500">Required for storing your fear profile and progress.</p>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={privacyPrefs.dataCollectionAccepted}
                            disabled
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 opacity-50"
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-[9px] text-center text-gray-400 leading-relaxed">
                      By continuing, you agree to our <a href="/privacy" className="text-blue-500 underline">Privacy Policy</a> and <a href="/terms" className="text-blue-500 underline">Terms of Service</a>.
                    </p>
                  </div>
                )}

                {currentStep.isFearProfile && (
                  <div className="space-y-5 sm:space-y-6 mt-6 sm:mt-8">
                    {CORE_FEARS.map((fear) => (
                      <div key={fear} className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <div className="flex items-center gap-2 text-gray-700 font-bold text-[10px] sm:text-xs uppercase tracking-wider">
                            <Activity size={14} className="text-blue-500" />
                            {fear}
                          </div>
                          <span className="text-xs sm:text-sm font-black text-blue-600">{fearProfile[fear]}%</span>
                        </div>
                        <div className="px-1 relative pb-4">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={fearProfile[fear]}
                            onChange={(e) => setFearProfile(prev => ({ ...prev, [fear]: parseInt(e.target.value) }))}
                            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <div className="flex justify-between mt-1 px-0.5">
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">No Fear</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Fear</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentStep.isSelection && (
                  <div className="space-y-4 mt-6 sm:mt-8">
                    <div className="flex justify-end px-2">
                      <button 
                        onClick={() => setSelectedFears(CORE_FEARS)}
                        className="text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                      >
                        Select All Nodes
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:gap-3 w-full max-h-[250px] sm:max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {CORE_FEARS.map((fear, i) => (
                      <motion.button
                        key={fear}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => toggleFear(fear)}
                        className="relative group w-full"
                      >
                        <div
                          className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all flex justify-between items-center text-left backdrop-blur-md ${
                            selectedFears.includes(fear)
                              ? "border-blue-500/30 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.05)]"
                              : "border-gray-100 bg-white/40 hover:border-blue-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${selectedFears.includes(fear) ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'bg-gray-200'}`} />
                            <span className={`font-bold text-xs sm:text-sm tracking-tight ${selectedFears.includes(fear) ? 'text-blue-700' : 'text-gray-600'}`}>
                              {fear}
                            </span>
                          </div>
                          {selectedFears.includes(fear) && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="bg-blue-500 text-white p-1 rounded-full"
                            >
                              <Check size={10} strokeWidth={4} className="sm:w-3 sm:h-3" />
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    ))}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 sm:p-8 space-y-4 sm:space-y-6 z-20 safe-bottom bg-white/80 backdrop-blur-md border-t border-gray-100">
        <div className="flex justify-center gap-2 sm:gap-3">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                width: i === step ? 32 : 6,
                backgroundColor: i === step ? "#3b82f6" : "#e5e7eb"
              }}
              className="h-1 rounded-full transition-all"
            />
          ))}
        </div>
        
        <div className="max-w-lg mx-auto w-full">
          <button
            onClick={handleNext}
            disabled={currentStep.isSelection && selectedFears.length === 0}
            className="w-full py-4 sm:py-5 bg-blue-600 text-white rounded-2xl sm:rounded-[2.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_20px_50px_rgba(59,130,246,0.2)] hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <span className="text-xs sm:text-sm">{currentStep.cta}</span>
            <ArrowRight size={18} className="sm:w-5 sm:h-5" />
          </button>
          
          <div className="flex items-center justify-center gap-4 mt-6 sm:mt-8">
            <div className="h-px w-6 sm:w-8 bg-gray-100" />
            <p className="text-[8px] sm:text-[9px] text-gray-400 uppercase tracking-[0.4em] font-black">
              NEURAL LINK • ENCRYPTED
            </p>
            <div className="h-px w-6 sm:w-8 bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
