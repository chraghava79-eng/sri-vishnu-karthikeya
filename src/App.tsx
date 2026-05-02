import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { auth, db, signInWithGoogle, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { UserProfile, FearProfile, PrivacyPreferences } from './types';
import { INITIAL_FEARS, APP_LOGO, MOCK_TASKS } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import { trackEvent, AnalyticsEvent } from './services/analytics';

// Lazy load components for performance
const BottomNav = lazy(() => import('./components/BottomNav'));
const Home = lazy(() => import('./components/Home'));
const FearNetwork = lazy(() => import('./components/FearNetwork'));
const Analysis = lazy(() => import('./components/Analysis'));
const Profile = lazy(() => import('./components/Profile'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const Login = lazy(() => import('./components/Login'));
const Paywall = lazy(() => import('./components/Paywall'));
const FearDetail = lazy(() => import('./components/FearDetail'));
const AICoach = lazy(() => import('./components/AICoach'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const NeuralSync = lazy(() => import('./components/NeuralSync'));
const AlternativeMode = lazy(() => import('./components/AlternativeMode'));
const Mindset = lazy(() => import('./components/Mindset'));
const StreakCalendar = lazy(() => import('./components/StreakCalendar'));
const DailyStreakOverlay = lazy(() => import('./components/DailyStreakOverlay'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const Sidebar = lazy(() => import('./components/Sidebar'));

// Admin components
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./components/admin/AdminUsers'));
const AdminCoupons = lazy(() => import('./components/admin/AdminCoupons'));

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[500] overflow-hidden">
    {/* Atmospheric Background for Loader */}
    <div className="absolute inset-0 pointer-events-none">
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[120px]" 
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[120px]" 
      />
    </div>

    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative z-10 flex flex-col items-center gap-6"
    >
      <div className="relative">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            rotate: { repeat: Infinity, duration: 15, ease: "linear" },
            scale: { repeat: Infinity, duration: 3, ease: "easeInOut" }
          }}
          className="absolute inset-[-20px] border border-blue-500/20 rounded-full"
        />
        <div className="relative z-10 w-24 h-24 bg-white/[0.03] backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-white/10">
          <img 
            src={APP_LOGO} 
            className="w-16 h-16 rounded-2xl object-cover grayscale opacity-80" 
            alt="Phobix" 
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <motion.h2 
          initial={{ letterSpacing: "0.5em", opacity: 0 }}
          animate={{ letterSpacing: "1em", opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-white text-2xl font-black italic uppercase ml-[1em]"
        >
          PHOBIX
        </motion.h2>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
              className="w-1.5 h-1.5 bg-blue-500 rounded-full"
            />
          ))}
        </div>
      </div>
    </motion.div>

    <div className="absolute bottom-12 left-0 w-full flex flex-col items-center gap-4 px-12 text-center">
      <div className="w-full max-w-[200px] h-[2px] bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-full h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
        />
      </div>
      <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.4em]">Initializing Neural Protocol</p>
    </div>
  </div>
);

import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAlternativeMode, setShowAlternativeMode] = useState(false);
  const [showMindset, setShowMindset] = useState(false);
  const [showStreakCalendar, setShowStreakCalendar] = useState(false);
  const [showDailyStreak, setShowDailyStreak] = useState(false);
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');
    
    if (paymentStatus === 'success' && profile && profile.subscriptionStatus !== 'premium') {
      const activatePremium = async () => {
        try {
          setIsUpdating(true);
          await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
            subscriptionStatus: 'premium',
            premiumSince: serverTimestamp()
          });
          
          // Clear query params
          navigate('/dashboard', { replace: true });
          
          // Trigger a celebration or notification?
          trackEvent(AnalyticsEvent.TASK_COMPLETE, { type: 'dodo_payment_success' });
          alert('ACCESS UPGRADED. Neural protocol "Apex" is now active.');
        } catch (error) {
          console.error("Failed to upgrade premium status:", error);
        } finally {
          setIsUpdating(false);
        }
      };
      activatePremium();
    }
  }, [location.search, profile, navigate]);

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
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
          // Verify we are still listening for the correct user
          if (auth.currentUser?.uid !== firebaseUser.uid) return;

          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            
            // Defensive check for missing fields
            if (!data.fears || !Array.isArray(data.fears)) {
              console.warn("User profile data is incomplete. Initializing missing fields.");
              await updateDoc(userDocRef, { fears: INITIAL_FEARS });
              return; // Let the next snapshot handle it
            }

            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            
            let updates: Partial<UserProfile> = {};

            // Check if streak needs reset (only if not already checked today)
            const lastCheckDate = localStorage.getItem('last_maintenance_check');
            if (lastCheckDate !== today) {
              // Check if streak needs reset
              if (data.lastTaskDate && data.lastTaskDate !== today && data.lastTaskDate !== yesterday) {
                if (data.streak !== 0) {
                  updates.streak = 0;
                }
              }

              // AI Credit Reset (Free users get 3 credits daily)
              if (data.subscriptionStatus === 'free' && data.lastCreditReset !== today) {
                if (data.aiCredits !== 3) {
                  updates.aiCredits = 3;
                  updates.lastCreditReset = today;
                }
              }

              // Daily Login Streak Acknowledgment
              if (data.lastLoginDate !== today) {
                updates.lastLoginDate = today;
                if (data.streak > 0) {
                  setShowDailyStreak(true);
                }
              }

              if (Object.keys(updates).length > 0) {
                try {
                  setIsUpdating(true);
                  await updateDoc(userDocRef, updates);
                  localStorage.setItem('last_maintenance_check', today);
                } catch (e) {
                  console.error("Failed to update user profile", e);
                } finally {
                  setIsUpdating(false);
                }
              } else {
                localStorage.setItem('last_maintenance_check', today);
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
        xp: 0,
        subscriptionStatus: 'free',
        rank: 'Beginner',
        createdAt: serverTimestamp(),
        aiCredits: 3,
        lastCreditReset: today,
        lastLoginDate: today,
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

  // Website Routes for non-authenticated users
  if (!user) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<LandingPage onLogin={() => navigate('/login')} />} />
          <Route path="/login" element={<Login onSuccess={() => navigate('/dashboard')} />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
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

            {/* Application Interface */}
            <Route path="/dashboard" element={
              <div className="h-screen w-screen bg-[var(--bg)] overflow-hidden flex flex-col md:flex-row relative">
                <Sidebar activeTab={activeTab} onTabChange={handleTabChange} userEmail={user?.email || undefined} />

                {/* Atmospheric Background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.15, 0.25, 0.15],
                      x: [0, 50, 0],
                      y: [0, 30, 0]
                    }}
                    transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
                    className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-blue-600/20 rounded-full blur-[120px]" 
                  />
                  <motion.div 
                    animate={{ 
                      scale: [1.3, 1, 1.3],
                      opacity: [0.15, 0.25, 0.15],
                      x: [0, -50, 0],
                      y: [0, -30, 0]
                    }}
                    transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
                    className="absolute bottom-[-20%] left-[-10%] w-[80%] h-[80%] bg-indigo-600/20 rounded-full blur-[120px]" 
                  />
                  <div className="absolute inset-0 bg-[var(--bg)]/40 backdrop-blur-[2px]" />
                </div>

                <NeuralSync 
                  isSyncing={isUpdating} 
                  error={syncError} 
                  lastSyncTime={lastSyncTime}
                  onRetry={() => window.location.reload()}
                />

                <main className="flex-1 overflow-y-auto safe-pb-nav relative">
                  <div className="max-w-7xl mx-auto h-full">
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
                            onOpenAlternativeMode={() => setShowAlternativeMode(true)}
                            onOpenMindset={() => setShowMindset(true)}
                            onOpenStreak={() => setShowStreakCalendar(true)}
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
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </main>

                {activeTab !== 'alternative' && (
                  <div className="md:hidden">
                    <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
                  </div>
                )}

                <AnimatePresence>
                  {showMindset && profile && (
                    <Mindset 
                      profile={profile} 
                      onClose={() => setShowMindset(false)} 
                    />
                  )}
                  {showAlternativeMode && profile && (
                    <AlternativeMode 
                      profile={profile} 
                      onClose={() => setShowAlternativeMode(false)} 
                      onOpenPaywall={handleOpenPaywall} 
                    />
                  )}
                  {showStreakCalendar && profile && (
                    <StreakCalendar 
                      profile={profile} 
                      onClose={() => setShowStreakCalendar(false)} 
                    />
                  )}
                  {showDailyStreak && profile && (
                    <DailyStreakOverlay 
                      streak={profile.streak} 
                      onClose={() => setShowDailyStreak(false)} 
                    />
                  )}
                </AnimatePresence>

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
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      )}
    </Suspense>
  );
}
