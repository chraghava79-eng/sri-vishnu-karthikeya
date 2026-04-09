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

export default function Profile({ profile, onOpenPaywall }: ProfileProps) {
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
        rank: 'Beginner'
      });
      trackEvent(AnalyticsEvent.TASK_COMPLETE, { type: 'neural_reset' });
      setShowResetConfirm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.userId}`);
    } finally {
      setIsResetting(false);
    }
  }, [profile.userId, profile.fears]);

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
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 pb-24 safe-top">
      <header className="flex justify-between items-center bg-white/50 backdrop-blur-md -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={APP_LOGO} className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-xl shadow-lg" alt="FEAR" referrerPolicy="no-referrer" />
          <div>
            <h2 className="text-[8px] sm:text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Personal Profile</h2>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">{profile.displayName}</h1>
          </div>
        </div>
        <button 
          onClick={() => setIsPrivacySettingsOpen(true)}
          className="p-2 bg-gray-100 rounded-full text-gray-500 active:scale-90 transition-transform"
        >
          <Settings size={18} className="sm:w-5 sm:h-5" />
        </button>
      </header>

      <div className="flex items-center gap-4 px-2">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-xl shadow-blue-200">
          {profile.displayName[0]}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="text-blue-600 sm:w-[18px] sm:h-[18px]" size={16} />
            <span className="font-bold text-gray-900 text-sm sm:text-base">{profile.rank}</span>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500">Member since {new Date(profile.createdAt?.seconds * 1000).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <GlassCard className="text-center p-4 sm:p-6">
          <Calendar className="mx-auto text-blue-500 mb-2 sm:w-6 sm:h-6" size={20} />
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{profile.streak}</div>
          <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Day Streak</p>
        </GlassCard>
        <GlassCard className="text-center p-4 sm:p-6">
          <BarChart3 className="mx-auto text-blue-500 mb-2 sm:w-6 sm:h-6" size={20} />
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{averageMastery}%</div>
          <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resilience</p>
        </GlassCard>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 px-1">Subscription</h3>
        <GlassCard className="flex items-center justify-between p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Shield size={20} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base capitalize">{profile.subscriptionStatus} Plan</h4>
              <p className="text-[9px] sm:text-[10px] text-gray-500">Next billing: May 5, 2026</p>
            </div>
          </div>
          {profile.subscriptionStatus === 'free' && (
            <button onClick={onOpenPaywall} className="text-[10px] sm:text-xs font-bold text-blue-600 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 rounded-lg active:scale-95 transition-transform">
              Upgrade
            </button>
          )}
        </GlassCard>
      </div>

      <GlassCard className="p-4 sm:p-6 mb-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Award size={18} className="text-blue-500" /> Neural Rank Details
        </h3>
        <div className="space-y-4">
          {[
            { rank: 'Beginner', desc: 'Initial calibration. Neural pathways are being mapped.', color: 'text-gray-400' },
            { rank: 'Novice', desc: 'Consistent exposure protocols established.', color: 'text-blue-400' },
            { rank: 'Intermediate', desc: 'Significant resilience detected in core nodes.', color: 'text-indigo-500' },
            { rank: 'Advanced', desc: 'High-level mastery across the topography.', color: 'text-purple-600' },
            { rank: 'Fearless', desc: 'Total neural resilience. Protocol complete.', color: 'text-orange-500' }
          ].map((r) => (
            <div key={r.rank} className={`flex items-start gap-3 ${profile.rank === r.rank ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 ${r.color.replace('text', 'bg')}`} />
              <div>
                <div className={`text-[10px] font-black uppercase tracking-widest ${r.color}`}>{r.rank}</div>
                <p className="text-[10px] text-gray-500 font-medium">{r.desc}</p>
              </div>
              {profile.rank === r.rank && (
                <div className="ml-auto px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[8px] font-black uppercase tracking-widest">Active</div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 px-1">Neural Maintenance</h3>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform text-sm sm:text-base shadow-lg shadow-blue-100"
        >
          <RefreshCw size={18} className="sm:w-5 sm:h-5" /> Sync Neural Data
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsFearProfileOpen(true)}
          className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform text-sm sm:text-base"
        >
          <Edit3 size={18} className="sm:w-5 sm:h-5" /> Edit Fear Profile
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsPrivacySettingsOpen(true)}
          className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform text-sm sm:text-base"
        >
          <Shield size={18} className="sm:w-5 sm:h-5" /> Privacy Settings
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowResetConfirm(true)}
          className="w-full py-4 bg-orange-50 text-orange-600 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform text-sm sm:text-base"
        >
          <Zap size={18} className="sm:w-5 sm:h-5" /> Recalibrate Neural Baseline
        </motion.button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 px-1">Support</h3>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsFeedbackOpen(true)}
          className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform text-sm sm:text-base"
        >
          <MessageSquare size={18} className="sm:w-5 sm:h-5" /> Send Feedback
        </motion.button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 px-1">Legal</h3>
        <div className="grid grid-cols-1 gap-2">
          <Link
            to="/privacy"
            className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                <Shield size={16} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-600">Privacy Policy</span>
            </div>
            <FileText size={16} className="text-gray-300" />
          </Link>
          <Link
            to="/terms"
            className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                <FileText size={16} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-600">Terms of Service</span>
            </div>
            <FileText size={16} className="text-gray-300" />
          </Link>
        </div>
      </div>

      {isAdmin && (
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 px-1">Administration</h3>
          <Link
            to="/admin"
            className="w-full py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-xl shadow-gray-200 text-sm sm:text-base"
          >
            <ShieldAlert size={18} className="sm:w-5 sm:h-5" /> Open Admin Panel
          </Link>
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={logOut}
        className="w-full py-4 border-2 border-gray-100 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform text-sm sm:text-base"
      >
        <LogOut size={18} className="sm:w-5 sm:h-5" /> Sign Out
      </motion.button>

      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="w-full py-4 text-gray-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] hover:text-red-400 transition-colors"
      >
        Request Account Deletion
      </button>

      <div className="flex flex-col items-center gap-4 pt-4">
        <img src={APP_LOGO} className="w-10 h-10 sm:w-12 sm:h-12 opacity-20 grayscale rounded-xl" alt="FEAR Logo" />
        <p className="text-center text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          FEAR v1.0.0 • Scientific Protocol Encrypted
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => setIsPrivacySettingsOpen(false)}
                className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={14} className="text-indigo-600" />
                  <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Data Protocol</h2>
                </div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tighter italic">Privacy Settings</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preferences</p>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div>
                      <p className="text-xs font-bold text-gray-900">Usage Analytics</p>
                      <p className="text-[9px] text-gray-500">Share anonymous session data.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={profile.privacyPreferences?.analyticsEnabled ?? true}
                      onChange={(e) => handlePrivacyUpdate({ analyticsEnabled: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div>
                      <p className="text-xs font-bold text-gray-900">Marketing Emails</p>
                      <p className="text-[9px] text-gray-500">Receive updates and resilience tips.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={profile.privacyPreferences?.marketingEmails ?? false}
                      onChange={(e) => handlePrivacyUpdate({ marketingEmails: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Management</p>
                  
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
                    className="w-full p-4 bg-gray-50 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-colors">
                        <FileText size={16} />
                      </div>
                      <span className="text-xs font-bold text-gray-600">Export My Data</span>
                    </div>
                    <ArrowRight size={16} className="text-gray-300" />
                  </button>

                  <button 
                    onClick={() => {
                      setIsPrivacySettingsOpen(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full p-4 bg-red-50 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-400">
                        <ShieldAlert size={16} />
                      </div>
                      <span className="text-xs font-bold text-red-600">Delete All Data</span>
                    </div>
                    <ArrowRight size={16} className="text-red-300" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setIsPrivacySettingsOpen(false)}
                className="w-full mt-8 py-4 bg-black text-white rounded-2xl font-bold active:scale-95 transition-transform"
              >
                Close Settings
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isFeedbackOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFeedbackOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => setIsFeedbackOpen(false)}
                className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare size={14} className="text-blue-600" />
                  <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Support</h2>
                </div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tighter italic">Send Feedback</h3>
              </div>

              {submitSuccess ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
                    <Send size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Thank You!</h4>
                  <p className="text-sm text-gray-500">Your feedback has been received and will help us improve the FEAR protocol.</p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFeedbackType('feedback')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        feedbackType === 'feedback' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'
                      }`}
                    >
                      Feedback
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackType('bug')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        feedbackType === 'bug' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'
                      }`}
                    >
                      Bug Report
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message</label>
                    <textarea
                      required
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      placeholder={feedbackType === 'feedback' ? "How can we improve?" : "What went wrong?"}
                      className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !feedbackMessage.trim()}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 shadow-xl shadow-blue-100"
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => setIsFearProfileOpen(false)}
                className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Edit3 size={14} className="text-blue-600" />
                  <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Neural Calibration</h2>
                </div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tighter italic">Edit Fear Profile</h3>
              </div>

              <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {CORE_FEARS.map((fear) => (
                  <div key={fear} className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2 text-gray-700 font-bold text-[10px] uppercase tracking-wider">
                        <Activity size={16} className="text-blue-600" />
                        {fear}
                      </div>
                      <span className="text-xs font-black text-blue-600">{fearProfile[fear]}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={fearProfile[fear]}
                      onChange={(e) => handleFearProfileUpdate(fear, parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() => setIsFearProfileOpen(false)}
                className="w-full mt-8 py-4 bg-black text-white rounded-2xl font-bold active:scale-95 transition-transform"
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
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mx-auto mb-6">
                <Zap size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter italic mb-2">Recalibrate?</h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                This will reset your neural mastery scores to zero. Your streak and rank will also be reset.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleNeuralReset}
                  disabled={isResetting}
                  className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold active:scale-95 transition-transform disabled:opacity-50"
                >
                  {isResetting ? "Recalibrating..." : "Confirm Reset"}
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold active:scale-95 transition-transform"
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
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter italic mb-2">Delete Account?</h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                This will permanently erase your neural progress and mastery data. This action is irreversible.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold active:scale-95 transition-transform disabled:opacity-50"
                >
                  {isDeleting ? "Eradicating Data..." : "Confirm Deletion"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold active:scale-95 transition-transform"
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
