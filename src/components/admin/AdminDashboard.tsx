import { useState, useEffect } from 'react';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { UserProfile } from '../../types';
import GlassCard from '../GlassCard';
import { Users, CreditCard, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const mockChartData = [
  { name: 'Mon', users: 400, revenue: 2400 },
  { name: 'Tue', users: 300, revenue: 1398 },
  { name: 'Wed', users: 200, revenue: 9800 },
  { name: 'Thu', users: 278, revenue: 3908 },
  { name: 'Fri', users: 189, revenue: 4800 },
  { name: 'Sat', users: 239, revenue: 3800 },
  { name: 'Sun', users: 349, revenue: 4300 },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    activeToday: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersColl = collection(db, 'users');
        const premiumQuery = query(usersColl, where('subscriptionStatus', '==', 'premium'));
        
        const [usersCount, premiumCount] = await Promise.all([
          getCountFromServer(usersColl),
          getCountFromServer(premiumQuery)
        ]);
        
        const total = usersCount.data().count;
        const premium = premiumCount.data().count;
        const monthlyRevenue = premium * 9.99;

        setStats({
          totalUsers: total,
          premiumUsers: premium,
          activeToday: Math.floor(total * 0.15), // Simulated active users
          revenue: Number(monthlyRevenue.toFixed(2)),
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'admin_stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Premium Users', value: stats.premiumUsers, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Conversion Rate', value: `${((stats.premiumUsers / stats.totalUsers || 0) * 100).toFixed(1)}%`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Monthly Revenue', value: `$${stats.revenue}`, icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Real-time metrics for FEAR platform.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <GlassCard key={i} className="flex items-center gap-4 border-none shadow-sm">
            <div className={`w-12 h-12 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="h-96 border-none shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Activity size={20} className="text-blue-600" /> User Growth
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="h-96 border-none shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <DollarSign size={20} className="text-green-600" /> Revenue Trends
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </div>
  );
}
