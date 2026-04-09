import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { auth, db, signInWithGoogle, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { UserProfile, FearProfile, PrivacyPreferences } from './types';
import { INITIAL_FEARS, APP_LOGO, MOCK_TASKS } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { trackEvent, AnalyticsEvent } from './services/analytics';
import { initRevenueCat } from './services/revenuecat';

// Lazy load components for performance
const BottomNav = lazy(() => import('./components/BottomNav'));
const Home = lazy(() => import('./components/Home'));
const FearNetwork = lazy(() => import('./components/FearNetwork'));
const Analysis = lazy(() => import('./components/Analysis'));
const Profile = lazy(() => import('./components/Profile'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const Paywall = lazy(() => import('./components/Paywall'));
const FearDetail = lazy(() => import('./components/FearDetail'));
const AICoach = lazy(() => import('./components/AICoach'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const NeuralSync = lazy(() => import('./components/NeuralSync'));
const AlternativeMode = lazy(() => import('./components/AlternativeMode'));

// Admin components
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./components/admin/AdminUsers'));
const AdminCoupons = lazy(() => import('./components/admin/AdminCoupons'));

const LoadingScreen = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-white overflow-hidden relative">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05)_0%,transparent_100%)]" />
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative z-10 flex flex-col items-center"
    >
      <div className="relative mb-8">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            borderRadius: ["20%", "40%", "20%"]
          }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute inset-0 bg-blue-500/20 blur-2xl"
        />
        <img 
          src={APP_LOGO} 
          className="w-24 h-24 relative z-10 rounded-[2rem] object-cover shadow-2xl border border-white/20" 
          alt="FEAR" 
        />
      </div>
      <div className="space-y-2 text-center">
        <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] animate-pulse">Neural Calibration</h2>
        <div className="flex gap-1 justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
              className="w-1.5 h-1.5 bg-blue-500 rounded-full"
            />
          ))}
        </div>
      </div>
    </motion.div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedFear, setSelectedFear] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCoach, setShowCoach] = useState(false);
  const [delayedUpdating, setDelayedUpdating] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isUpdating) {
      // Increase delay to 1.5s so it only shows if sync is actually slow
      timeout = setTimeout(() => setDelayedUpdating(true), 1500);
    } else {
      setDelayedUpdating(false);
    }
    return () => clearTimeout(timeout);
  }, [isUpdating]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    trackEvent(AnalyticsEvent.TAB_CHANGE, { tab });
  }, []);

  const handleOpenPaywall = useCallback(() => {
    if (profile?.subscriptionStatus === 'premium') return;
    setShowPaywall(true);
    trackEvent(AnalyticsEvent.PAYWALL_OPEN);
  }, [profile?.subscriptionStatus]);

  const handleOpenCoach = useCallback(() => {
    setShowCoach(true);
    trackEvent(AnalyticsEvent.COACH_OPEN);
  }, []);

  const handleRandomTask = useCallback(() => {
    const randomTask = MOCK_TASKS[Math.floor(Math.random() * MOCK_TASKS.length)];
    setSelectedFear(randomTask.fearType);
    setSelectedTaskId(randomTask.id);
    trackEvent(AnalyticsEvent.TASK_START, { type: 'random_task', taskId: randomTask.id });
  }, []);

  const handleSelectFear = useCallback((fear: string | null) => {
    setSelectedFear(fear);
    setSelectedTaskId(null);
    if (fear) {
      trackEvent(AnalyticsEvent.FEAR_SELECT, { fear });
    }
  }, []);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setSyncError(null);
      // Clean up existing listener on auth change
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      setUser(firebaseUser);
      
      if (firebaseUser) {
        initRevenueCat(firebaseUser.uid);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
          // Verify we are still listening for the correct user
          if (auth.currentUser?.uid !== firebaseUser.uid) return;

          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            
            let updates: Partial<UserProfile> = {};

            // Check if streak needs reset
            if (data.lastTaskDate && data.lastTaskDate !== today && data.lastTaskDate !== yesterday) {
              if (data.streak !== 0) {
                updates.streak = 0;
                // We don't reset lastTaskDate to "" here, we just let it be. 
                // The condition data.streak !== 0 prevents repeated triggers.
              }
            }

            // AI Credit Reset (Free users get 3 credits daily)
            if (data.subscriptionStatus === 'free' && data.lastCreditReset !== today) {
              if (data.aiCredits !== 3) {
                updates.aiCredits = 3;
                updates.lastCreditReset = today;
              }
            }

            if (Object.keys(updates).length > 0) {
              try {
                setIsUpdating(true);
                await updateDoc(userDocRef, updates);
              } catch (e) {
                console.error("Failed to update user profile", e);
              } finally {
                setIsUpdating(false);
              }
            }
            
            setProfile(data);
            setLastSyncTime(new Date());
            setSyncError(null);
            setShowOnboarding(!data.fearProfile);
          } else {
            setShowOnboarding(true);
          }
          setLoading(false);
        }, (error) => {
          // Only handle error if the user is still logged in and it's the same user
          if (auth.currentUser?.uid === firebaseUser.uid) {
            setSyncError("Neural protocol synchronization failed.");
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          }
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const handleOnboardingComplete = async (selectedFears: string[], fearProfile: FearProfile, privacyPreferences: PrivacyPreferences) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if profile already exists to avoid overwriting mastery
    const userDocRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userDocRef);
    
    let profileData: UserProfile;
    
    if (docSnap.exists()) {
      const existingData = docSnap.data() as UserProfile;
      profileData = {
        ...existingData,
        fearProfile,
        privacyPreferences
      };
    } else {
      profileData = {
        userId: user.uid,
        displayName: user.displayName || 'User',
        email: user.email || '',
        fears: INITIAL_FEARS,
        fearProfile,
        privacyPreferences,
        streak: 0,
        subscriptionStatus: 'free',
        rank: 'Beginner',
        createdAt: serverTimestamp(),
        aiCredits: 3,
        lastCreditReset: today,
      };
    }

    try {
      setIsUpdating(true);
      setSyncError(null);
      await setDoc(userDocRef, profileData);
      setLastSyncTime(new Date());
      setShowOnboarding(false);
    } catch (error) {
      setSyncError("Failed to initialize neural profile.");
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white p-8 text-center overflow-hidden relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,rgba(59,130,246,0.08)_0%,transparent_100%)]" />
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[120px]" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12 max-w-sm w-full flex flex-col items-center relative z-10"
        >
          <div className="space-y-6 flex flex-col items-center">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="relative cursor-pointer"
            >
              <img 
                src={APP_LOGO} 
                className="w-32 h-32 relative z-10 rounded-[2.5rem] object-cover shadow-2xl border-2 border-white/10" 
                alt="FEAR" 
              />
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
            </motion.div>
            <div className="text-center">
              <h1 className="text-5xl font-black tracking-tighter text-gray-900 mb-2">FEAR</h1>
              <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.4em] mb-4">Neural Resilience Protocol</p>
              <p className="text-gray-500 font-medium leading-relaxed max-w-[280px]">
                The clinical protocol for neural resilience. 
                Conquer your limitations through science.
              </p>
            </div>
          </div>

          <div className="space-y-4 w-full">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={signInWithGoogle}
              className="w-full py-5 px-8 bg-gray-900 text-white rounded-[2rem] font-bold flex items-center justify-center gap-3 shadow-2xl shadow-black/10 transition-all hover:bg-black"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
              Continue with Google
            </motion.button>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Secure Clinical Authentication
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-100 w-full">
            <div className="text-center">
              <p className="text-3xl font-black text-gray-900">7</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Core Fears</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-gray-900">AI</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Driven Protocols</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Onboarding onComplete={handleOnboardingComplete} />
      </Suspense>
    );
  }

  const isAdmin = profile?.role === 'admin' || user.email === 'chraghava79@gmail.com' || user.email === 'admin@fearprotocol.ai';
  const isPremium = profile?.subscriptionStatus === 'premium';

  // Mandatory Paywall for free users who aren't admins
  // Allow them to see Home and Profile, but block Network and Analysis
  const isTabBlocked = (activeTab === 'network' || activeTab === 'analysis');
  const showMandatoryPaywall = profile && !isPremium && !isAdmin && !showPaywall && isTabBlocked;

  return (
    <Suspense fallback={<LoadingScreen />}>
      {showMandatoryPaywall ? (
        <Paywall onClose={() => setActiveTab('home')} profile={profile} isMandatory={true} />
      ) : (
        <Routes>
            {/* Admin Routes */}
            {isAdmin && (
              <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
            )}
            {isAdmin && (
              <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
            )}
            {isAdmin && (
              <Route path="/admin/coupons" element={<AdminLayout><AdminCoupons /></AdminLayout>} />
            )}
            {isAdmin && (
              <Route path="/admin/analytics" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
            )}
            {isAdmin && (
              <Route path="/admin/settings" element={<AdminLayout><div className="p-8">Settings coming soon...</div></AdminLayout>} />
            )}

            {/* Legal Routes */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />

            {/* App Routes */}
            <Route path="/" element={
              <div className="h-screen w-screen bg-white overflow-hidden flex flex-col relative">
                {/* Global Neural Pulse Background */}
                <div className="absolute inset-0 -z-10 bg-gray-50/50" />
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none -z-10">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                    className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-400 rounded-full blur-[120px]" 
                  />
                  <motion.div 
                    animate={{ 
                      scale: [1.2, 1, 1.2],
                      opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
                    className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-400 rounded-full blur-[120px]" 
                  />
                </div>

                <NeuralSync 
                  isSyncing={isUpdating} 
                  error={syncError} 
                  lastSyncTime={lastSyncTime}
                  onRetry={() => window.location.reload()}
                />

                <main className="flex-1 overflow-y-auto safe-pb-nav relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                      className="h-full"
                    >
                      {activeTab === 'home' && (
                        <Home 
                          profile={profile} 
                          onOpenPaywall={handleOpenPaywall} 
                          onOpenCoach={handleOpenCoach} 
                          onRandomTask={handleRandomTask}
                          onOpenAlternativeMode={() => setActiveTab('alternative')}
                        />
                      )}
                      {activeTab === 'network' && (
                        <FearNetwork profile={profile} onSelectFear={handleSelectFear} />
                      )}
                      {activeTab === 'analysis' && (
                        <Analysis profile={profile} />
                      )}
                      {activeTab === 'profile' && (
                        <Profile profile={profile} onOpenPaywall={handleOpenPaywall} />
                      )}
                      {activeTab === 'alternative' && (
                        <AlternativeMode 
                          profile={profile!} 
                          onClose={() => setActiveTab('home')} 
                          onOpenPaywall={handleOpenPaywall} 
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </main>

                {activeTab !== 'alternative' && (
                  <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
                )}

                <AnimatePresence>
                  {selectedFear && (
                    <FearDetail
                      fearType={selectedFear as any}
                      profile={profile!}
                      onClose={() => handleSelectFear(null)}
                      setIsUpdating={setIsUpdating}
                      initialTaskId={selectedTaskId || undefined}
                    />
                  )}
                  {showPaywall && profile?.subscriptionStatus !== 'premium' && (
                    <Paywall onClose={() => setShowPaywall(false)} profile={profile!} />
                  )}
                  {showCoach && (
                    <AICoach onClose={() => setShowCoach(false)} profile={profile!} onOpenPaywall={() => { setShowCoach(false); handleOpenPaywall(); }} />
                  )}
                </AnimatePresence>
              </div>
            } />
            
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </Suspense>
  );
}
