import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { APP_LOGO, CORE_FEARS } from '../constants';
import GlassCard from './GlassCard';
import { Settings, LogOut, Shield, Award, Calendar, BarChart3, ShieldAlert, MessageSquare, X, Send, FileText, Zap, Users, UserMinus, UserCheck, Mic, Dumbbell, HelpCircle, Edit3, Activity, ArrowRight, RefreshCw } from 'lucide-react';
import { logOut, db, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { FearProfile } from '../types';

interface ProfileProps {
  profile: UserProfile | null;
  onOpenPaywall: () => void;
}

import { trackEvent, AnalyticsEvent } from '../services/analytics';

import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function Profile({ profile, onOpenPaywall }: ProfileProps) {
  const { theme, toggleTheme } = useTheme();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'feedback' | 'bug'>('feedback');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [isFearProfileOpen, setIsFearProfileOpen] = useState(false);
  const [isPrivacySettingsOpen, setIsPrivacySettingsOpen] = useState(false);
  const [fearProfile, setFearProfile] = useState<FearProfile>(() => {
    if (profile?.fearProfile) return profile.fearProfile;
    const saved = localStorage.getItem('fear_profile');
    if (saved) return JSON.parse(saved);
    
    const defaultProfile: any = {};
    CORE_FEARS.forEach(fear => {
      defaultProfile[fear] = 50;
    });
    return defaultProfile as FearProfile;
  });

  const averageMastery = useMemo(() => {
    if (!profile?.fears || profile.fears.length === 0) return 0;
    const sum = profile.fears.reduce((acc, fear) => acc + fear.score, 0);
    return Math.round(sum / profile.fears.length);
  }, [profile?.fears]);

  useEffect(() => {
    if (profile?.fearProfile) {
      setFearProfile(profile.fearProfile);
    }
  }, [profile?.fearProfile]);

  if (!profile) return null;

  const isAdmin = useMemo(() => profile.role === 'admin' || profile.email === 'chraghava79@gmail.com', [profile.role, profile.email]);

  const handleFearProfileUpdate = useCallback(async (key: keyof FearProfile, value: number) => {
    const newProfile = { ...fearProfile, [key]: value };
    setFearProfile(newProfile);
    localStorage.setItem('fear_profile', JSON.stringify(newProfile));
    
    try {
      await updateDoc(doc(db, 'users', profile.userId), {
        fearProfile: newProfile
      });
      trackEvent(AnalyticsEvent.TASK_COMPLETE, { type: 'fear_profile_update', key, value });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.userId}`);
    }
  }, [fearProfile, profile.userId]);

  const handlePrivacyUpdate = useCallback(async (updates: Partial<UserProfile['privacyPreferences']>) => {
    if (!profile.privacyPreferences) return;
    const newPrefs = { ...profile.privacyPreferences, ...updates };
    localStorage.setItem('privacy_preferences', JSON.stringify(newPrefs));
    
    try {
      await updateDoc(doc(db, 'users', profile.userId), {
        privacyPreferences: newPrefs
      });
      trackEvent(AnalyticsEvent.TASK_COMPLETE, { type: 'privacy_update', ...updates });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.userId}`);
    }
  }, [profile.privacyPreferences, profile.userId]);

  const handleNeuralReset = useCallback(async () => {
    setIsResetting(true);
    try {
      await updateDoc(doc(db, 'users', profile.userId), {
        fears: profile.fears.map(f => ({ ...f, score: 0, lastUpdated: new Date().toISOString() })),
        streak: 0,
        lastTaskDate: "",
        rank: 'Beginner',
        goldBadge: false
      });
      trackEvent(AnalyticsEvent.TASK_COMPLETE, { type: 'neural_reset' });
      setShowResetConfirm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.userId}`);
    } finally {
      setIsResetting(false);
    }
  }, [profile.userId, profile.fears]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app, we'd upload to Firebase Storage.
    // For this environment, we'll use a base64 string for the demo.
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        await updateDoc(doc(db, 'users', profile.userId), {
          photoURL: base64String
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${profile.userId}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAccount = useCallback(async () => {
    setIsDeleting(true);
    try {
      // 1. Delete user data from Firestore
      await updateDoc(doc(db, 'users', profile.userId), { 
        isDeleted: true,
        deletedAt: serverTimestamp() 
      });
      
      // 2. Sign out
      await logOut();
      trackEvent(AnalyticsEvent.ACCOUNT_DELETE);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${profile.userId}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [profile.userId]);

  const handleFeedbackSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: profile.userId,
        userEmail: profile.email,
        type: feedbackType,
        message: feedbackMessage,
        timestamp: serverTimestamp(),
      });
      setSubmitSuccess(true);
      trackEvent(AnalyticsEvent.FEEDBACK_SUBMIT, { type: feedbackType });
      setFeedbackMessage('');
      setTimeout(() => {
        setIsFeedbackOpen(false);
        setSubmitSuccess(false);
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'feedback');
    } finally {
      setIsSubmitting(false);
    }
  }, [feedbackMessage, feedbackType, profile.userId, profile.email]);

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 pb-32 safe-top">
      <header className="flex justify-between items-center glass-morphism -mx-4 sm:-mx-6 px-4 sm:px-6 py-6 border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={APP_LOGO} className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-xl shadow-2xl border border-white/20" alt="FEAR" referrerPolicy="no-referrer" />
          <div>
            <h2 className="text-[8px] sm:text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Phobix Protocol</h2>
            <h1 className="text-lg sm:text-2xl font-bold text-current italic tracking-tight">{profile.displayName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-2.5 bg-white/5 border border-white/10 rounded-full text-gray-400 active:scale-90 transition-all hover:bg-white/10 hover:text-white"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </motion.button>
          <button 
            onClick={() => setIsPrivacySettingsOpen(true)}
            className="p-2.5 bg-white/5 border border-white/10 rounded-full text-gray-400 active:scale-90 transition-all hover:bg-white/10 hover:text-white"
          >
            <Settings size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      <div className="flex items-center gap-5 px-2">
        <div className="relative group">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl sm:text-4xl font-black italic shadow-2xl overflow-hidden border-2 border-white/20"
          >
            {profile.photoURL ? (
              <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
            ) : (
              profile.displayName[0]
            )}
          </motion.div>
          <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-[2rem] cursor-pointer transition-opacity backdrop-blur-sm">
            <Edit3 size={18} className="text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="text-blue-400 sm:w-[20px] sm:h-[20px]" size={18} />
            <span className="font-black text-current text-lg sm:text-xl italic tracking-tight">{profile.rank}</span>
            {profile.goldBadge && (
              <div className="flex items-center gap-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-2 py-0.5 shadow-[0_0_10px_rgba(250,204,21,0.2)]">
                <Award size={10} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[7px] font-black text-yellow-400 uppercase tracking-widest">Gold</span>
              </div>
            )}
          </div>
          <p className="text-[9px] sm:text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Member since {new Date(profile.createdAt?.seconds * 1000).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="text-center p-6 border-white/5 bg-white/5">
          <Calendar className="mx-auto text-blue-400 mb-2 sm:w-6 sm:h-6" size={20} />
          <div className="text-2xl sm:text-3xl font-black text-current italic">{profile.streak}</div>
          <p className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Day Streak</p>
        </GlassCard>
        <GlassCard className="text-center p-6 border-white/5 bg-white/5">
          <BarChart3 className="mx-auto text-blue-400 mb-2 sm:w-6 sm:h-6" size={20} />
          <div className="text-2xl sm:text-3xl font-black text-current italic">{averageMastery}%</div>
          <p className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Resilience</p>
        </GlassCard>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">Subscription</h3>
        <GlassCard className="flex items-center justify-between p-5 border-white/5 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Shield size={22} />
            </div>
            <div>
              <h4 className="font-black text-current text-sm sm:text-base italic uppercase tracking-tight">{profile.subscriptionStatus} Plan</h4>
              <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium">Next billing: May 5, 2026</p>
            </div>
          </div>
          {profile.subscriptionStatus === 'free' && (
            <button onClick={onOpenPaywall} className="text-[9px] sm:text-[10px] font-black text-blue-400 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl active:scale-95 transition-all hover:bg-blue-500/20 uppercase tracking-widest">
              Upgrade
            </button>
          )}
        </GlassCard>
      </div>

      <GlassCard className="p-6 border-white/5 bg-white/5">
        <h3 className="text-sm sm:text-base font-black text-current mb-6 flex items-center gap-2 uppercase tracking-[0.1em]">
          <Award size={18} className="text-blue-400" /> Neural Rank Details
        </h3>
        <div className="space-y-5">
          {[
            { rank: 'Beginner', desc: 'Initial calibration. Neural pathways are being mapped.', color: 'text-gray-500' },
            { rank: 'Novice', desc: 'Consistent exposure protocols established.', color: 'text-blue-400' },
            { rank: 'Intermediate', desc: 'Significant resilience detected in core nodes.', color: 'text-indigo-400' },
            { rank: 'Advanced', desc: 'High-level mastery across the topography.', color: 'text-purple-400' },
            { rank: 'Fearless', desc: 'Total neural resilience. Protocol complete.', color: 'text-orange-400' }
          ].map((r) => (
            <div key={r.rank} className={`flex items-start gap-4 transition-opacity duration-500 ${profile.rank === r.rank ? 'opacity-100' : 'opacity-20'}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 ${r.color.replace('text', 'bg')} shadow-[0_0_8px_currentColor]`} />
              <div className="flex-1">
                <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${r.color}`}>{r.rank}</div>
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{r.desc}</p>
              </div>
              {profile.rank === r.rank && (
                <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[7px] font-black uppercase tracking-widest">Active</div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">Neural Maintenance</h3>
        <div className="grid grid-cols-1 gap-3">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black italic uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all text-sm shadow-2xl shadow-blue-900/20"
          >
            <RefreshCw size={18} /> Sync Neural Data
          </motion.button>
          
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: Edit3, label: 'Edit Fear Profile', onClick: () => setIsFearProfileOpen(true), color: 'bg-white/5 text-gray-300' },
              { icon: Shield, label: 'Privacy Settings', onClick: () => setIsPrivacySettingsOpen(true), color: 'bg-white/5 text-gray-300' },
              { icon: Zap, label: 'Recalibrate Baseline', onClick: () => setShowResetConfirm(true), color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
            ].map((btn, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.98 }}
                onClick={btn.onClick}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all text-[11px] border border-white/5 ${btn.color}`}
              >
                <btn.icon size={18} /> {btn.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">Support & Legal</h3>
        <div className="grid grid-cols-1 gap-3">
          <motion.button
            whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsFeedbackOpen(true)}
            className="w-full py-4 bg-white/5 border border-white/5 text-white rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all text-[11px]"
          >
            <MessageSquare size={18} /> Send Feedback
          </motion.button>

          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/privacy"
              className="flex flex-col items-center justify-center p-5 bg-white/5 border border-white/5 rounded-2xl group active:scale-[0.98] transition-all hover:bg-white/10"
            >
              <Shield size={20} className="text-gray-500 mb-2 group-hover:text-blue-400 transition-colors" />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest group-hover:text-white">Privacy</span>
            </Link>
            <Link
              to="/terms"
              className="flex flex-col items-center justify-center p-5 bg-white/5 border border-white/5 rounded-2xl group active:scale-[0.98] transition-all hover:bg-white/10"
            >
              <FileText size={20} className="text-gray-500 mb-2 group-hover:text-blue-400 transition-colors" />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest group-hover:text-white">Terms</span>
            </Link>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">Administration</h3>
          <Link
            to="/admin"
            className="w-full py-4 bg-white text-black rounded-2xl font-black italic uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-2xl text-sm"
          >
            <ShieldAlert size={18} /> Admin Panel
          </Link>
        </div>
      )}

      <div className="pt-4 space-y-4">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={logOut}
          className="w-full py-4 border border-white/10 text-red-400 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all text-[11px] hover:bg-red-500/10"
        >
          <LogOut size={18} /> Sign Out
        </motion.button>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full py-2 text-gray-600 text-[8px] font-black uppercase tracking-[0.3em] hover:text-red-500 transition-colors"
        >
          Request Account Deletion
        </button>
      </div>

      <div className="flex flex-col items-center gap-4 pt-8 opacity-40">
        <img src={APP_LOGO} className="w-10 h-10 sm:w-12 sm:h-12 grayscale rounded-xl border border-white/20" alt="FEAR Logo" />
        <p className="text-center text-[8px] text-gray-600 font-black uppercase tracking-[0.4em]">
          FEAR v1.0.0 • PROTOCOL ENCRYPTED
        </p>
      </div>

      {/* Privacy Settings Modal */}
      <AnimatePresence>
        {isPrivacySettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPrivacySettingsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm glass-morphism-dark rounded-[3rem] p-8 shadow-2xl overflow-hidden border border-white/10"
            >
              <button
                onClick={() => setIsPrivacySettingsOpen(false)}
                className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-gray-400 hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={14} className="text-blue-400" />
                  <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Data Protocol</h2>
                </div>
                <h3 className="text-2xl font-black text-current tracking-tighter italic">Privacy Settings</h3>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Preferences</p>
                  
                  <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                    <div>
                      <p className="text-xs font-bold text-current">Usage Analytics</p>
                      <p className="text-[9px] text-gray-500 font-medium">Share anonymous session data.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={profile.privacyPreferences?.analyticsEnabled ?? true}
                      onChange={(e) => handlePrivacyUpdate({ analyticsEnabled: e.target.checked })}
                      className="w-5 h-5 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                    <div>
                      <p className="text-xs font-bold text-current">Marketing Emails</p>
                      <p className="text-[9px] text-gray-500 font-medium">Receive updates and resilience tips.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={profile.privacyPreferences?.marketingEmails ?? false}
                      onChange={(e) => handlePrivacyUpdate({ marketingEmails: e.target.checked })}
                      className="w-5 h-5 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Data Management</p>
                  
                  <button 
                    onClick={() => {
                      const data = JSON.stringify(profile, null, 2);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `fear-profile-${profile.userId}.json`;
                      a.click();
                    }}
                    className="w-full p-5 bg-white/5 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all hover:bg-white/10 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-blue-400 transition-colors">
                        <FileText size={16} />
                      </div>
                      <span className="text-xs font-bold text-gray-300">Export My Data</span>
                    </div>
                    <ArrowRight size={16} className="text-gray-600" />
                  </button>

                  <button 
                    onClick={() => {
                      setIsPrivacySettingsOpen(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full p-5 bg-red-500/5 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all hover:bg-red-500/10 border border-red-500/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-red-400">
                        <ShieldAlert size={16} />
                      </div>
                      <span className="text-xs font-bold text-red-500">Delete All Data</span>
                    </div>
                    <ArrowRight size={16} className="text-red-900" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setIsPrivacySettingsOpen(false)}
                className="w-full mt-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform"
              >
                Close Settings
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isFeedbackOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFeedbackOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm glass-morphism-dark rounded-[3rem] p-8 shadow-2xl overflow-hidden border border-white/10"
            >
              <button
                onClick={() => setIsFeedbackOpen(false)}
                className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-gray-400 hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare size={14} className="text-blue-400" />
                  <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Support</h2>
                </div>
                <h3 className="text-2xl font-black text-current tracking-tighter italic">Send Feedback</h3>
              </div>

              {submitSuccess ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 mx-auto border border-green-500/20">
                    <Send size={32} />
                  </div>
                  <h4 className="text-xl font-black text-current italic">Thank You!</h4>
                  <p className="text-xs text-gray-500 font-medium">Your feedback has been received and will help us improve the FEAR protocol.</p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                  <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => setFeedbackType('feedback')}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        feedbackType === 'feedback' ? 'bg-white text-black shadow-xl' : 'text-gray-500'
                      }`}
                    >
                      Feedback
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackType('bug')}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        feedbackType === 'bug' ? 'bg-red-500 text-white shadow-xl' : 'text-gray-500'
                      }`}
                    >
                      Bug Report
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Message</label>
                    <textarea
                      required
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      placeholder={feedbackType === 'feedback' ? "How can we improve?" : "What went wrong?"}
                      className="w-full h-32 p-5 bg-white/5 border border-white/5 rounded-2xl text-sm text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all resize-none placeholder:text-gray-700"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !feedbackMessage.trim()}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 shadow-2xl shadow-blue-900/20"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={18} /> Submit
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fear Profile Modal */}
      <AnimatePresence>
        {isFearProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFearProfileOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm glass-morphism-dark rounded-[3rem] p-8 shadow-2xl overflow-hidden border border-white/10"
            >
              <button
                onClick={() => setIsFearProfileOpen(false)}
                className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-gray-400 hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <Edit3 size={14} className="text-blue-400" />
                  <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Neural Calibration</h2>
                </div>
                <h3 className="text-2xl font-black text-current tracking-tighter italic">Edit Fear Profile</h3>
              </div>

              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {CORE_FEARS.map((fear) => (
                  <div key={fear} className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2 text-gray-400 font-black text-[9px] uppercase tracking-widest">
                        <Activity size={14} className="text-blue-400" />
                        {fear}
                      </div>
                      <span className="text-xs font-black text-blue-400 italic">{fearProfile[fear]}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={fearProfile[fear]}
                      onChange={(e) => handleFearProfileUpdate(fear, parseInt(e.target.value))}
                      className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() => setIsFearProfileOpen(false)}
                className="w-full mt-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform"
              >
                Save Calibration
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Neural Reset Confirmation */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm glass-morphism-dark rounded-[3rem] p-8 shadow-2xl text-center border border-orange-500/20"
            >
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-400 mx-auto mb-6 border border-orange-500/20">
                <Zap size={32} />
              </div>
              <h3 className="text-2xl font-black text-current tracking-tighter italic mb-2 uppercase">Recalibrate?</h3>
              <p className="text-gray-500 text-xs mb-8 leading-relaxed font-medium">
                This will reset your neural mastery scores to zero. Your streak and rank will also be reset. Protocol will restart from baseline.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleNeuralReset}
                  disabled={isResetting}
                  className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 shadow-2xl shadow-orange-900/20"
                >
                  {isResetting ? "Recalibrating..." : "Confirm Reset"}
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full py-4 bg-white/5 text-gray-500 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Account Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm glass-morphism-dark rounded-[3rem] p-8 shadow-2xl text-center border border-red-500/20"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 mx-auto mb-6 border border-red-500/20">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-2xl font-black text-current tracking-tighter italic mb-2 uppercase">Delete Account?</h3>
              <p className="text-gray-500 text-xs mb-8 leading-relaxed font-medium">
                This will permanently erase your neural progress and mastery data. This action is irreversible. Synaptic data will be purged.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 shadow-2xl shadow-red-900/20"
                >
                  {isDeleting ? "Eradicating Data..." : "Confirm Deletion"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-4 bg-white/5 text-gray-500 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
