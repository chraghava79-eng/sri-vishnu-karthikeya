import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { UserProfile } from '../../types';
import GlassCard from '../GlassCard';
import { Search, Shield, ShieldOff, ArrowUpCircle, ArrowDownCircle, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

const USERS_PER_PAGE = 20;

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchUsers = async (isNext = true) => {
    try {
      setLoading(isNext && !lastDoc ? true : false);
      if (!isNext && !lastDoc) setLoadingMore(true);

      let q = query(
        collection(db, 'users'), 
        orderBy('createdAt', 'desc'), 
        limit(USERS_PER_PAGE)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snap = await getDocs(q);
      const newUsers = snap.docs.map(d => d.data() as UserProfile);
      
      if (snap.docs.length < USERS_PER_PAGE) {
        setHasMore(false);
      }

      setUsers(prev => [...prev, ...newUsers]);
      setLastDoc(snap.docs[snap.docs.length - 1] as QueryDocumentSnapshot || null);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setUsers([]);
      setLastDoc(null);
      setHasMore(true);
      fetchUsers();
      return;
    }

    // Note: Firestore doesn't support full-text search natively.
    // For millions of users, we'd typically use Algolia or similar.
    // For now, we'll filter the current list, but acknowledge the limitation.
    // In a real production app at scale, this would be an API call to a search index.
  };

  const toggleBan = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isBanned: !currentStatus });
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, isBanned: !currentStatus } : u));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const toggleSubscription = async (userId: string, current: string) => {
    const next = current === 'premium' ? 'free' : 'premium';
    try {
      await updateDoc(doc(db, 'users', userId), { subscriptionStatus: next });
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, subscriptionStatus: next as any } : u));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm sm:text-base text-gray-500">Monitor and manage all FEAR users.</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-2xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </header>

      <GlassCard className="p-0 overflow-hidden border-none shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Streak</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Rank</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading neural database...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {user.displayName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{user.displayName}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        user.subscriptionStatus === 'premium' ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500"
                      }`}>
                        {user.subscriptionStatus}
                      </span>
                      {user.isBanned && (
                        <span className="ml-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-100 text-red-600">
                          Banned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{user.streak} days</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{user.rank}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSubscription(user.userId, user.subscriptionStatus)}
                          title={user.subscriptionStatus === 'premium' ? "Downgrade to Free" : "Upgrade to Premium"}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                        >
                          {user.subscriptionStatus === 'premium' ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
                        </button>
                        <button
                          onClick={() => toggleBan(user.userId, !!user.isBanned)}
                          title={user.isBanned ? "Unban User" : "Ban User"}
                          className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${user.isBanned ? "text-green-500" : "text-red-500"}`}
                        >
                          {user.isBanned ? <Shield size={18} /> : <ShieldOff size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {hasMore && !loading && (
          <div className="p-4 border-t border-gray-100 flex justify-center">
            <button
              onClick={() => fetchUsers(true)}
              disabled={loadingMore}
              className="px-6 py-2 bg-gray-50 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
            >
              {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight size={16} />}
              Load More Users
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
