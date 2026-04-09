import { useMemo, useState, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, TaskLog, FearProfile } from '../types';
import { CORE_FEARS, APP_LOGO } from '../constants';
import GlassCard from './GlassCard';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, getDocs, Timestamp, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, AreaChart, Area,
  ComposedChart, Scatter, Cell
} from 'recharts';
import { TrendingDown, Zap, Brain, Target, Activity, Loader2, AlertCircle, TrendingUp, X, Users, UserMinus, UserCheck, Mic, Dumbbell, HelpCircle, Edit3, Share2 } from 'lucide-react';
import { trackEvent, AnalyticsEvent } from '../services/analytics';
import { safeStorage, formatDate } from '../lib/utils';

interface AnalysisProps {
  profile: UserProfile | null;
}

// Memoized Chart Components
const MemoizedLineChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data}>
      <defs>
        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
      <XAxis 
        dataKey="day" 
        axisLine={false} 
        tickLine={false} 
        tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
        dy={10}
      />
      <YAxis hide domain={[0, 100]} />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)', 
          borderRadius: '16px', 
          border: 'none', 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(8px)'
        }}
        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
      />
      <Area 
        type="monotone" 
        dataKey="score" 
        stroke="#3b82f6" 
        strokeWidth={4} 
        fillOpacity={1} 
        fill="url(#colorScore)" 
        animationDuration={1500}
      />
      <Line 
        type="monotone" 
        dataKey="projected" 
        stroke="#3b82f6" 
        strokeWidth={2} 
        strokeDasharray="5 5" 
        dot={false} 
        opacity={0.3}
      />
    </AreaChart>
  </ResponsiveContainer>
));

const MemoizedRadarChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
      <PolarGrid stroke="#e5e7eb" />
      <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 8, fontWeight: 'bold' }} />
      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
      <Radar
        name="Neural Mastery"
        dataKey="A"
        stroke="#3b82f6"
        fill="#3b82f6"
        fillOpacity={0.2}
      />
    </RadarChart>
  </ResponsiveContainer>
));

export default function Analysis({ profile }: AnalysisProps) {
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFearProfileOpen, setIsFearProfileOpen] = useState(false);
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

  useEffect(() => {
    if (profile?.fearProfile) {
      setFearProfile(profile.fearProfile);
    } else {
      const saved = localStorage.getItem('fear_profile');
      if (saved) {
        setFearProfile(JSON.parse(saved));
      }
    }
  }, [profile?.fearProfile]);

  const handleFearProfileUpdate = useCallback(async (key: keyof FearProfile, value: number) => {
    const newProfile = { ...fearProfile, [key]: value };
    setFearProfile(newProfile);
    localStorage.setItem('fear_profile', JSON.stringify(newProfile));
    
    if (profile) {
      try {
        await updateDoc(doc(db, 'users', profile.userId), {
          fearProfile: newProfile
        });
        trackEvent(AnalyticsEvent.TASK_COMPLETE, { type: 'fear_profile_update_analysis', key, value });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${profile.userId}`);
      }
    }
  }, [fearProfile, profile]);

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'users', profile.userId, 'logs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const fetchedLogs = snap.docs.map(d => ({ ...d.data(), id: d.id } as unknown as TaskLog));
      setLogs(fetchedLogs.reverse());
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${profile.userId}/logs`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.userId]);

  // Process logs for trend data
  const trendData = useMemo(() => {
    if (logs.length === 0) {
      return [
        { day: 'Start', score: 0, projected: 10 },
        { day: 'Now', score: 0, projected: 20 }
      ];
    }
    
    // Group logs by date and calculate average mastery for each day
    const grouped = logs.reduce((acc: any, log) => {
      const seconds = log.timestamp?.seconds;
      if (!seconds) return acc;
      
      const dateObj = new Date(seconds * 1000);
      const dateKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD for easy sorting
      
      if (!acc[dateKey]) acc[dateKey] = [];
      // afterFear is 0-10, so (10 - afterFear) is mastery on 0-10 scale
      const scoreValue = typeof log.afterFear === 'number' ? (10 - log.afterFear) : 0;
      acc[dateKey].push(scoreValue); 
      return acc;
    }, {});

    // Sort dates chronologically
    const sortedDates = Object.keys(grouped).sort();

    return sortedDates.map(dateKey => {
      const values = grouped[dateKey];
      const avg = values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0;
      
      const dateObj = new Date(dateKey);
      // Format date for display (e.g., "Apr 8")
      const displayDate = formatDate(dateObj);
      
      return {
        day: displayDate,
        score: Math.round(avg * 10),
        projected: Math.min(100, Math.round(avg * 11)) // Slight projection
      };
    });
  }, [logs]);

  const radarData = useMemo(() => {
    if (!profile) return [];
    const fears = profile.fears || [];
    if (fears.length === 0) return [];
    
    return fears.map(f => ({
      subject: f.type,
      A: f.score || 0,
      fullMark: 100,
    }));
  }, [profile]);

  const projectionData = useMemo(() => {
    if (!profile) return [];
    const fears = profile.fears || [];
    const currentMastery = fears.length > 0 
      ? Math.round(fears.reduce((acc, f) => acc + (f.score || 0), 0) / fears.length)
      : 0;
    
    return [
      { month: 'Current', mastery: currentMastery },
      { month: 'Month 1', mastery: Math.min(100, currentMastery + 20) },
      { month: 'Month 2', mastery: Math.min(100, currentMastery + 40) },
      { month: 'Month 3', mastery: Math.min(100, currentMastery + 55) },
    ];
  }, [profile]);

  const velocityData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts: any = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    
    logs.forEach(log => {
      const seconds = log.timestamp?.seconds;
      if (seconds) {
        const day = days[new Date(seconds * 1000).getDay()];
        if (day) counts[day]++;
      }
    });

    return days.map(day => ({ name: day, tasks: counts[day] }));
  }, [logs]);

  const hasFearProfile = useMemo(() => {
    return profile?.fearProfile !== undefined || localStorage.getItem('fear_profile') !== null;
  }, [profile?.fearProfile, fearProfile]);

  const connectivityData = useMemo(() => {
    if (!profile) return [];
    const fears = profile.fears || [];
    const hasMastery = fears.some(f => f.score > 0);
    
    if (!hasMastery && hasFearProfile) {
      // Show baseline connectivity if no mastery yet
      return Object.entries(fearProfile).map(([key, value], i) => ({
        x: (i + 1) * 15,
        y: (value as number) / 10, // Scale down for connectivity visualization
        z: (value as number) * 2,
        name: key
      }));
    }

    return fears.map((f, i) => ({
      x: (i + 1) * 15,
      y: f.score || 0,
      z: (f.score || 0) * 5,
      name: f.type
    }));
  }, [profile, fearProfile, hasFearProfile]);

  const fearBreakdownData = useMemo(() => {
    return Object.entries(fearProfile).map(([key, value]) => ({
      topic: key,
      value
    }));
  }, [fearProfile]);

  const primaryFear = useMemo(() => {
    if (!hasFearProfile) return null;
    return [...fearBreakdownData].sort((a, b) => b.value - a.value)[0];
  }, [fearBreakdownData, hasFearProfile]);

  const strengthArea = useMemo(() => {
    if (!hasFearProfile) return null;
    return [...fearBreakdownData].sort((a, b) => a.value - b.value)[0];
  }, [fearBreakdownData, hasFearProfile]);

  const baselineRadarData = useMemo(() => {
    return Object.entries(fearProfile).map(([key, value]) => ({
      subject: key,
      A: value,
      fullMark: 100,
    }));
  }, [fearProfile]);

  const averageMastery = useMemo(() => {
    if (!profile) return 0;
    const fears = profile.fears || [];
    return fears.length > 0 
      ? Math.round(fears.reduce((acc, f) => acc + (f.score || 0), 0) / fears.length)
      : 0;
  }, [profile]);

  const neuralStatus = useMemo(() => {
    if (averageMastery > 80) return { label: 'Resilient', color: 'text-green-600', bg: 'bg-green-50' };
    if (averageMastery > 50) return { label: 'Stable', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (averageMastery > 20) return { label: 'Fluctuating', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-50' };
  }, [averageMastery]);

  if (!profile) return null;

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-12 text-gray-400">
        <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
        <p className="text-sm font-bold uppercase tracking-widest">Processing Neural Data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 pb-24 bg-gray-50/50 min-h-full safe-top">
      <header className="flex justify-between items-center bg-white/50 backdrop-blur-md -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={APP_LOGO} className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-xl shadow-lg" alt="FEAR" referrerPolicy="no-referrer" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[8px] sm:text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Neural Diagnostics</h2>
              <div className={`px-1.5 py-0.5 rounded-full ${neuralStatus.bg} ${neuralStatus.color} text-[6px] font-black uppercase tracking-widest border border-current/10`}>
                {neuralStatus.label}
              </div>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight tracking-tighter italic">Neural Analysis</h1>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* 0. Fear Breakdown (New System) */}
        {!hasFearProfile ? (
          <GlassCard className="p-6 sm:p-8 text-center bg-blue-50 border-blue-100">
            <AlertCircle size={32} className="sm:w-10 sm:h-10 mx-auto text-blue-500 mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Initialize Fear Profile</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-6">Complete your neural calibration to unlock detailed fear breakdown analytics.</p>
            <button 
              onClick={() => setIsFearProfileOpen(true)} 
              className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform text-sm"
            >
              Initialize Calibration
            </button>
          </GlassCard>
        ) : (
          <GlassCard className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <Brain size={16} className="sm:w-[18px] sm:h-[18px] text-indigo-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">Fear Breakdown</h3>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 sm:flex-none px-3 py-1.5 bg-red-50 rounded-lg">
                  <p className="text-[7px] sm:text-[8px] font-black text-red-400 uppercase tracking-widest">Primary Fear</p>
                  <p className="text-[10px] sm:text-xs font-bold text-red-600">{primaryFear?.topic}</p>
                </div>
                <div className="flex-1 sm:flex-none px-3 py-1.5 bg-green-50 rounded-lg">
                  <p className="text-[7px] sm:text-[8px] font-black text-green-400 uppercase tracking-widest">Strength Area</p>
                  <p className="text-[10px] sm:text-xs font-bold text-green-600">{strengthArea?.topic}</p>
                </div>
              </div>
            </div>
            <div className="h-[200px] sm:h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fearBreakdownData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis 
                    dataKey="topic" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    width={80}
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                    {fearBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value > 70 ? '#ef4444' : entry.value < 30 ? '#22c55e' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        )}

        {/* 1. Neural Resilience Trend */}
        <motion.div whileHover={{ y: -4 }}>
          <GlassCard className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Activity size={16} className="sm:w-[18px] sm:h-[18px] text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">Mastery Trend</h3>
              </div>
              <span className="text-[8px] sm:text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12% this week</span>
            </div>
            <div className="h-[180px] sm:h-[200px] w-full">
              <MemoizedLineChart data={trendData} />
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* 2. Fear Distribution Radar */}
          <motion.div whileHover={{ scale: 1.02 }}>
            <GlassCard className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Brain size={16} className="sm:w-[18px] sm:h-[18px] text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">Neural Fingerprint</h3>
              </div>
              <div className="h-[220px] sm:h-[250px] w-full">
                <MemoizedRadarChart data={radarData} />
              </div>
              <p className="mt-2 text-[7px] sm:text-[8px] text-center text-gray-400 font-bold uppercase tracking-widest">Active Mastery Levels</p>
            </GlassCard>
          </motion.div>

          {/* 2b. Baseline Topography Radar */}
          <motion.div whileHover={{ scale: 1.02 }}>
            <GlassCard className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Activity size={16} className="sm:w-[18px] sm:h-[18px] text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">Baseline Topography</h3>
              </div>
              <div className="h-[220px] sm:h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={baselineRadarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 7, fontWeight: 700, fill: '#64748b' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Intensity"
                      dataKey="A"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-[7px] sm:text-[8px] text-center text-gray-400 font-bold uppercase tracking-widest">Initial Fear Calibration</p>
            </GlassCard>
          </motion.div>
        </div>

        {/* 3. Future Projected Transformation */}
        <GlassCard className="p-4 sm:p-6 bg-gray-900 text-white border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Target size={16} className="sm:w-[18px] sm:h-[18px] text-blue-400" />
            </div>
            <h3 className="font-bold text-sm sm:text-base">Projected Transformation</h3>
          </div>
          <div className="h-[180px] sm:h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="colorMastery" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="mastery" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMastery)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-[9px] sm:text-[10px] text-gray-400 leading-relaxed italic">
            *Based on current exposure velocity. Projected 85% neural recalibration by Month 3.
          </p>
        </GlassCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* 4. Exposure Velocity */}
          <GlassCard className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Zap size={16} className="sm:w-[18px] sm:h-[18px] text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Exposure Velocity</h3>
            </div>
            <div className="h-[120px] sm:h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData}>
                  <Bar dataKey="tasks" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* 5. Neural Connectivity Strength */}
          <GlassCard className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Activity size={16} className="sm:w-[18px] sm:h-[18px] text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Connectivity</h3>
            </div>
            <div className="h-[120px] sm:h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={connectivityData}>
                  <XAxis dataKey="x" hide />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                  <Scatter name="Fears" dataKey="y" fill="#22c55e" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>

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
                <h3 className="text-2xl font-black text-gray-900 tracking-tighter italic">Neural Baseline</h3>
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
    </div>
  );
}
