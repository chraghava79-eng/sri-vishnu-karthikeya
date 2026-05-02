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
          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
      <XAxis 
        dataKey="day" 
        axisLine={false} 
        tickLine={false} 
        tick={{ fontSize: 10, fill: 'var(--text)', opacity: 0.5, fontWeight: 'bold' }}
        dy={10}
      />
      <YAxis hide domain={[0, 100]} />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: 'var(--bg)', 
          borderRadius: '16px', 
          border: '1px solid var(--glass-border)', 
          boxShadow: '0 20px 50px var(--glass-shadow)',
          backdropFilter: 'blur(12px)'
        }}
        itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text)' }}
        labelStyle={{ color: 'var(--text)', opacity: 0.5, marginBottom: '4px', fontSize: '10px' }}
      />
      <Area 
        type="monotone" 
        dataKey="score" 
        stroke="#3b82f6" 
        strokeWidth={4} 
        fillOpacity={1} 
        fill="url(#colorScore)" 
        animationDuration={2000}
      />
      <Line 
        type="monotone" 
        dataKey="projected" 
        stroke="#3b82f6" 
        strokeWidth={2} 
        strokeDasharray="5 5" 
        dot={false} 
        opacity={0.2}
      />
    </AreaChart>
  </ResponsiveContainer>
));

const MemoizedRadarChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
      <PolarGrid stroke="var(--glass-border)" />
      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text)', opacity: 0.5, fontSize: 8, fontWeight: 'bold' }} />
      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
      <Radar
        name="Neural Mastery"
        dataKey="A"
        stroke="#3b82f6"
        fill="#3b82f6"
        fillOpacity={0.3}
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
    if (logs.length === 0) return [];
    
    // Group logs by date and calculate average mastery for each day
    const grouped = logs.reduce((acc: Map<string, number[]>, log) => {
      const seconds = log.timestamp?.seconds;
      if (!seconds) return acc;
      
      const dateKey = new Date(seconds * 1000).toISOString().split('T')[0];
      
      if (!acc.has(dateKey)) acc.set(dateKey, []);
      const scoreValue = typeof log.afterFear === 'number' ? (10 - log.afterFear) : 0;
      acc.get(dateKey)?.push(scoreValue); 
      return acc;
    }, new Map());

    // Sort dates chronologically
    const sortedDates = Array.from(grouped.keys()).sort();

    return sortedDates.map(dateKey => {
      const values = grouped.get(dateKey) || [];
      const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      
      return {
        day: formatDate(new Date(dateKey)),
        score: Math.round(avg * 10),
        projected: Math.min(100, Math.round(avg * 11))
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
    const counts = new Map(days.map(d => [d, 0]));
    
    logs.forEach(log => {
      const seconds = log.timestamp?.seconds;
      if (seconds) {
        const day = days[new Date(seconds * 1000).getDay()];
        counts.set(day, (counts.get(day) || 0) + 1);
      }
    });

    return days.map(day => ({ name: day, tasks: counts.get(day) || 0 }));
  }, [logs]);

  const hasFearProfile = useMemo(() => {
    return profile?.fearProfile !== undefined || localStorage.getItem('fear_profile') !== null;
  }, [profile?.fearProfile, fearProfile]);

  const connectivityData = useMemo(() => {
    if (!profile) return [];
    const fears = profile.fears || [];
    
    // Connectivity is derived from how balanced the mastery is across nodes
    // Nodes with similar mastery scores have stronger "neural bridges"
    return fears.map((f, i) => {
      const score = f.score || 0;
      const neighbors = [
        fears[(i + 1) % fears.length],
        fears[(i - 1 + fears.length) % fears.length]
      ];
      const avgNeighborScore = neighbors.reduce((acc, n) => acc + (n?.score || 0), 0) / 2;
      const connectivity = 100 - Math.abs(score - avgNeighborScore);

      return {
        x: (i + 1) * 15,
        y: score,
        z: connectivity * 5,
        name: f.type
      };
    });
  }, [profile]);

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
    if (averageMastery > 80) return { label: 'Resilient', color: 'text-green-400', bg: 'bg-green-500/10' };
    if (averageMastery > 50) return { label: 'Stable', color: 'text-blue-400', bg: 'bg-blue-500/10' };
    if (averageMastery > 20) return { label: 'Fluctuating', color: 'text-orange-400', bg: 'bg-orange-500/10' };
    return { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10' };
  }, [averageMastery]);

  if (!profile) return null;

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-12 text-gray-600">
        <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Processing Neural Data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 pb-32 min-h-full safe-top">
      <header className="flex justify-between items-center glass-morphism -mx-4 sm:-mx-6 px-4 sm:px-6 py-6 border-b border-[var(--border)] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img 
            src={APP_LOGO} 
            className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-xl shadow-lg border border-[var(--border)]" 
            alt="Phobix" 
            referrerPolicy="no-referrer" 
            loading="lazy"
            decoding="async"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[8px] sm:text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em]">Neural Diagnostics</h2>
              <div className={`px-1.5 py-0.5 rounded-full ${neuralStatus.bg} ${neuralStatus.color} text-[6px] font-black uppercase tracking-widest border border-current/20 backdrop-blur-md`}>
                {neuralStatus.label}
              </div>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-current leading-tight tracking-tighter italic uppercase">Neural Analysis</h1>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {/* 0. Fear Breakdown (New System) */}
        {!hasFearProfile ? (
          <GlassCard className="p-8 text-center bg-blue-500/10 border-[var(--border)] shadow-xl">
            <AlertCircle size={32} className="sm:w-10 sm:h-10 mx-auto text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-lg sm:text-xl font-black text-current mb-2 uppercase italic">Initialize Fear Profile</h3>
            <p className="text-[10px] text-[var(--text-secondary)] mb-8 font-medium">Complete your neural calibration to unlock detailed fear breakdown analytics.</p>
            <button 
              onClick={() => setIsFearProfileOpen(true)} 
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-blue-500/40 active:scale-95 transition-all text-xs"
            >
              Initialize Calibration
            </button>
          </GlassCard>
        ) : (
          <GlassCard className="p-6 border-[var(--border)] bg-[var(--card-bg)] shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <Brain size={18} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-black text-current text-sm sm:text-base uppercase tracking-tight italic">Fear Breakdown</h3>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 sm:flex-none px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-[7px] font-black text-red-600 dark:text-red-400 uppercase tracking-[0.2em]">Primary Fear</p>
                  <p className="text-[10px] font-black text-current italic truncate">{primaryFear?.topic}</p>
                </div>
                <div className="flex-1 sm:flex-none px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <p className="text-[7px] font-black text-green-600 dark:text-green-400 uppercase tracking-[0.2em]">Strength Area</p>
                  <p className="text-[10px] font-black text-current italic truncate">{strengthArea?.topic}</p>
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
                    tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(15,15,15,0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', color: '#fff' }}
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
          <GlassCard className="p-6 border-[var(--border)] bg-[var(--card-bg)] shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <Activity size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-black text-current text-sm sm:text-base uppercase tracking-tight italic">Mastery Trend</h3>
              </div>
              {trendData.length > 1 && (
                <span className="text-[8px] font-black text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest">
                  Analysis Active
                </span>
              )}
            </div>
            <div className="h-[200px] w-full flex items-center justify-center">
              {trendData.length > 0 ? (
                <MemoizedLineChart data={trendData} />
              ) : (
                <div className="text-center space-y-3">
                  <Activity size={32} className="mx-auto text-[var(--border)] animate-pulse" />
                  <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em]">Insufficient Neural Data</p>
                  <p className="text-[9px] text-[var(--text-secondary)] font-medium">Complete exposure tasks to generate trend analysis.</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 2. Fear Distribution Radar */}
          <motion.div whileHover={{ scale: 1.02 }}>
            <GlassCard className="p-6 border-[var(--border)] bg-[var(--card-bg)] shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <Brain size={18} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-black text-current text-sm sm:text-base uppercase tracking-tight italic">Neural Fingerprint</h3>
              </div>
              <div className="h-[250px] w-full">
                <MemoizedRadarChart data={radarData} />
              </div>
              <p className="mt-4 text-[8px] text-center text-[var(--text-secondary)] font-black uppercase tracking-[0.3em]">Active Mastery Levels</p>
            </GlassCard>
          </motion.div>

          {/* 2b. Baseline Topography Radar */}
          <motion.div whileHover={{ scale: 1.02 }}>
            <GlassCard className="p-6 border-[var(--border)] bg-[var(--card-bg)] shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <Activity size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-black text-current text-sm sm:text-base uppercase tracking-tight italic">Baseline Topography</h3>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={baselineRadarData}>
                    <PolarGrid stroke="var(--border)" fill="var(--bg)" fillOpacity={0.1} />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 7, fontWeight: 900, fill: 'var(--text-secondary)' }} />
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
              <p className="mt-4 text-[8px] text-center text-[var(--text-secondary)] font-black uppercase tracking-[0.3em]">Initial Fear Calibration</p>
            </GlassCard>
          </motion.div>
        </div>

        {/* 3. Future Projected Transformation */}
        <GlassCard className="p-6 bg-white/5 border-white/5 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                <Target size={18} className="text-blue-400" />
              </div>
              <h3 className="font-black text-sm sm:text-base text-current uppercase tracking-tight italic">Projected Transformation</h3>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData}>
                  <defs>
                    <linearGradient id="colorMastery" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 900 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15,15,15,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="mastery" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMastery)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-6 text-[9px] text-gray-600 leading-relaxed italic font-medium">
              *Based on current exposure velocity. Projected 85% neural recalibration by Month 3.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
        </GlassCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 4. Exposure Velocity */}
          <GlassCard className="p-6 border-white/5 bg-white/5">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <Zap size={18} className="text-orange-400" />
              </div>
              <h3 className="font-black text-current text-sm sm:text-base uppercase tracking-tight italic">Exposure Velocity</h3>
            </div>
            <div className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData}>
                  <Bar dataKey="tasks" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 900 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* 5. Neural Connectivity Strength */}
          <GlassCard className="p-6 border-white/5 bg-white/5">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl">
                <Activity size={18} className="text-green-400" />
              </div>
              <h3 className="font-black text-current text-sm sm:text-base uppercase tracking-tight italic">Connectivity</h3>
            </div>
            <div className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={connectivityData}>
                  <XAxis dataKey="x" hide />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px', backgroundColor: 'rgba(15,15,15,0.9)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
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
                <h3 className="text-2xl font-black text-current tracking-tighter italic">Neural Baseline</h3>
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
                className="w-full mt-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform shadow-xl shadow-blue-500/20"
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
