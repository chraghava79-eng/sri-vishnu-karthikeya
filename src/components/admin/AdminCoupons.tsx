import { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, deleteDoc, query, orderBy, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Coupon } from '../../types';
import GlassCard from '../GlassCard';
import { Ticket, Plus, Trash2, ToggleLeft, ToggleRight, Calendar, X, AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const COUPONS_PER_PAGE = 12;

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    discountType: 'percentage',
    duration: '1month',
    active: true,
    usageCount: 0
  });

  useEffect(() => {
    const fetchCoupons = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'coupons'), 
          orderBy('code'),
          limit(COUPONS_PER_PAGE)
        );
        const snap = await getDocs(q);
        setCoupons(snap.docs.map(d => d.data() as Coupon));
        setLastDoc(snap.docs[snap.docs.length - 1] as QueryDocumentSnapshot || null);
        setHasMore(snap.docs.length === COUPONS_PER_PAGE);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'coupons'),
        orderBy('code'),
        startAfter(lastDoc),
        limit(COUPONS_PER_PAGE)
      );
      const snap = await getDocs(q);
      const newCoupons = snap.docs.map(d => d.data() as Coupon);
      setCoupons(prev => [...prev, ...newCoupons]);
      setLastDoc(snap.docs[snap.docs.length - 1] as QueryDocumentSnapshot || null);
      setHasMore(snap.docs.length === COUPONS_PER_PAGE);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleAdd = async () => {
    if (!newCoupon.code || !newCoupon.discountValue) return;
    try {
      await setDoc(doc(db, 'coupons', newCoupon.code), { ...newCoupon, usageCount: 0 } as Coupon);
      setCoupons(prev => [...prev, { ...newCoupon, usageCount: 0 } as Coupon]);
      setShowAdd(false);
      setNewCoupon({ discountType: 'percentage', duration: '1month', active: true, usageCount: 0 });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `coupons/${newCoupon.code}`);
    }
  };

  const toggleStatus = async (code: string, current: boolean) => {
    try {
      await setDoc(doc(db, 'coupons', code), { active: !current }, { merge: true });
      setCoupons(prev => prev.map(c => c.code === code ? { ...c, active: !current } : c));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `coupons/${code}`);
    }
  };

  const handleDelete = async (code: string) => {
    try {
      await deleteDoc(doc(db, 'coupons', code));
      setCoupons(prev => prev.filter(c => c.code !== code));
      setDeleteConfirm(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `coupons/${code}`);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-sm sm:text-base text-gray-500">Create and manage subscription gift codes.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-blue-200"
        >
          <Plus size={20} /> Create Coupon
        </button>
      </header>

      {showAdd && (
        <GlassCard className="space-y-6 border-2 border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Code</label>
              <input
                type="text"
                placeholder="FEAR2026"
                value={newCoupon.code || ''}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Discount Type</label>
              <select
                value={newCoupon.discountType}
                onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value as any })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Value</label>
              <input
                type="number"
                placeholder="20"
                value={newCoupon.discountValue || ''}
                onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Duration</label>
              <select
                value={newCoupon.duration}
                onChange={(e) => setNewCoupon({ ...newCoupon, duration: e.target.value as any })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                <option value="1month">1 Month</option>
                <option value="3months">3 Months</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAdd(false)} className="px-6 py-3 text-gray-500 font-bold">Cancel</button>
            <button onClick={handleAdd} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold">Save Coupon</button>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 size={40} className="animate-spin mb-4" />
            <p className="font-bold uppercase tracking-widest text-xs">Loading Coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-gray-400">
            <Ticket size={40} className="mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-xs">No coupons found</p>
          </div>
        ) : (
          coupons.map((coupon) => (
            <GlassCard key={coupon.code} className="relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Ticket size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{coupon.code}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `$${coupon.discountValue} Off`} • {coupon.duration}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleStatus(coupon.code, coupon.active)}
                    className={`p-2 transition-colors ${coupon.active ? "text-blue-600" : "text-gray-300"}`}
                  >
                    {coupon.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(coupon.code)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Usage</p>
                  <p className="text-sm font-bold text-gray-900">{coupon.usageCount} / {coupon.usageLimit || '∞'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Duration</p>
                  <p className="text-sm font-bold text-blue-600 capitalize">
                    {coupon.duration === 'yearly' ? 'Yearly' : 
                     coupon.duration === '3months' ? '3 Months' : '1 Month'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    coupon.active ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                  }`}>
                    {coupon.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {hasMore && !loading && (
        <div className="flex justify-center pt-8">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-8 py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl font-bold flex items-center gap-3 hover:bg-gray-50 active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            {loadingMore ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <ChevronRight size={20} />
            )}
            {loadingMore ? "Loading..." : "Load More Coupons"}
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter italic mb-2">Delete Coupon?</h3>
              <p className="text-gray-500 text-sm mb-8">
                Are you sure you want to delete the coupon <span className="font-bold text-gray-900">{deleteConfirm}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold active:scale-95 transition-transform shadow-xl shadow-red-100"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
