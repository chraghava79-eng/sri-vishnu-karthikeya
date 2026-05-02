import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Check, Zap, Shield, Brain, Sparkles, Ticket } from 'lucide-react';
import GlassCard from './GlassCard';
import { db, auth, handleFirestoreError, OperationType, logOut } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile, Coupon } from '../types';
import { APP_LOGO } from '../constants';

interface PaywallProps {
  onClose: () => void;
  profile: UserProfile;
  isMandatory?: boolean;
}

import { trackEvent, AnalyticsEvent } from '../services/analytics';
import GooglePayButton from '@google-pay/button-react';

// Digital Goods API types
declare global {
  interface Window {
    getDigitalGoodsService?: (serviceName: string) => Promise<any>;
  }
}

export default function Paywall({ onClose, profile, isMandatory }: PaywallProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isTWA, setIsTWA] = useState(false);

  const handleDodoPayment = async (productId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: auth.currentUser?.email || profile.email,
          productId
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initiate Dodo Payment');

      // Redirect to checkout
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error('Dodo Payment Error:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Check if running in a Trusted Web Activity (TWA)
    const checkTWA = () => {
      const isTwa = window.matchMedia('(display-mode: standalone)').matches || 
                   (window as any).getDigitalGoodsService !== undefined;
      setIsTWA(isTwa);
    };
    checkTWA();
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplying(true);
    setCouponError(null);
    setCouponSuccess(false);

    try {
      const couponDoc = await getDoc(doc(db, 'coupons', couponCode.trim().toUpperCase()));
      if (!couponDoc.exists()) {
        setCouponError('Invalid coupon code');
        trackEvent(AnalyticsEvent.COUPON_APPLY, { code: couponCode, success: false, error: 'invalid_code' });
        return;
      }

      const couponData = couponDoc.data() as Coupon;
      if (!couponData.active) {
        setCouponError('This coupon is no longer active');
        trackEvent(AnalyticsEvent.COUPON_APPLY, { code: couponCode, success: false, error: 'inactive' });
        return;
      }

      if (couponData.usageLimit && (couponData.usageCount || 0) >= couponData.usageLimit) {
        setCouponError('This coupon has reached its usage limit');
        trackEvent(AnalyticsEvent.COUPON_APPLY, { code: couponCode, success: false, error: 'limit_reached' });
        return;
      }

      // Apply premium status
      await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
        subscriptionStatus: 'premium',
        premiumSince: serverTimestamp()
      });

      // Update coupon usage count
      await updateDoc(doc(db, 'coupons', couponCode.trim().toUpperCase()), {
        usageCount: (couponData.usageCount || 0) + 1
      });

      setCouponSuccess(true);
      trackEvent(AnalyticsEvent.COUPON_APPLY, { code: couponCode, success: true });
      if (!isMandatory) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'coupons');
      setCouponError('Failed to apply coupon');
      trackEvent(AnalyticsEvent.COUPON_APPLY, { code: couponCode, success: false, error: 'exception' });
    } finally {
      setIsApplying(false);
    }
  };

  const handleDigitalGoodsPayment = async (sku: string) => {
    if (!window.getDigitalGoodsService) {
      alert('Digital Goods API not supported in this environment.');
      return;
    }

    setIsProcessing(true);
    try {
      const service = await window.getDigitalGoodsService('https://play.google.com/billing');
      
      // Create a payment request
      const paymentMethodData = [{
        supportedMethods: 'https://play.google.com/billing',
        data: { sku }
      }];

      const request = new (window as any).PaymentRequest(paymentMethodData);
      const response = await request.show();
      
      // Process response
      console.log('Digital Goods Response:', response);
      
      // In a real app, you'd verify the purchase token on your server
      // For this demo, we'll assume success if the response is received
      await response.complete('success');
      
      await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
        subscriptionStatus: 'premium',
        premiumSince: serverTimestamp()
      });
      
      setPaymentSuccess(true);
      trackEvent(AnalyticsEvent.TASK_COMPLETE, { type: 'digital_goods_purchase', sku });
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      console.error('Digital Goods Error:', error);
      alert('Payment failed or was cancelled.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    console.log('Payment success:', paymentData);
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
        subscriptionStatus: 'premium',
        premiumSince: serverTimestamp()
      });
      setPaymentSuccess(true);
      trackEvent(AnalyticsEvent.TASK_COMPLETE, { type: 'subscription_purchase' });
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to update subscription status:', error);
      alert('Payment successful, but failed to update profile. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', profile.userId));
      if (userDoc.exists() && userDoc.data().subscriptionStatus === 'premium') {
        setPaymentSuccess(true);
        setTimeout(() => onClose(), 2000);
      } else {
        alert('No active premium subscription found.');
      }
    } catch (error) {
      console.error('Restore failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-white z-[80] flex flex-col items-center justify-center p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6"
        >
          <Check size={48} />
        </motion.div>
        <h2 className="text-3xl font-black text-gray-900 mb-2 italic tracking-tight">NEURAL LINK ESTABLISHED</h2>
        <p className="text-gray-500 mb-8">Your premium access has been activated. Welcome to the elite protocol.</p>
        <div className="w-full max-w-xs h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2 }}
            className="h-full bg-green-500"
          />
        </div>
      </motion.div>
    );
  }

  if (isProcessing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-white z-[80] flex flex-col items-center justify-center p-8 text-center"
      >
        <div className="relative w-32 h-32 mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-4 border-blue-100 border-t-blue-600 rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="text-blue-600 animate-pulse" size={40} />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Securing Transaction...</h2>
        <p className="text-sm text-gray-500">Encrypting neural payment data via secure gateway.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={isMandatory ? { opacity: 0 } : { y: '100%' }}
      animate={isMandatory ? { opacity: 1 } : { y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-white z-[70] flex flex-col overflow-hidden"
    >
      <div className="relative h-64 shrink-0 overflow-hidden">
        <img
          src="https://picsum.photos/seed/fearless/1920/1080?blur=4"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          alt="Premium background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
        
        <div className="absolute top-[calc(1.5rem+env(safe-area-inset-top))] left-6 z-20 flex items-center gap-3">
          <img src={APP_LOGO} className="w-10 h-10 object-cover rounded-xl shadow-lg" alt="Phobix" referrerPolicy="no-referrer" />
          <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl border border-white/30">
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Premium</h2>
          </div>
        </div>

        {isMandatory ? (
          <button
            onClick={() => logOut()}
            className="absolute top-[calc(1.5rem+env(safe-area-inset-top))] right-6 px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-white border border-white/30 text-[10px] font-bold uppercase tracking-widest active:scale-90 transition-transform"
          >
            Sign Out
          </button>
        ) : (
          <button
            onClick={onClose}
            className="absolute top-[calc(1.5rem+env(safe-area-inset-top))] right-6 p-2 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30 active:scale-90 transition-transform"
          >
            <X size={24} />
          </button>
        )}

        <div className="absolute bottom-6 left-6 right-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Become Fearless</h1>
          <p className="text-gray-500 font-medium">Unlock the clinical toolkit to transform your anxiety.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4">
          {[
            { icon: Brain, title: "Full Network Access", desc: "Visualize and track all 7 core fears." },
            { icon: Sparkles, title: "Personalized AI Coach", desc: "Real-time stress recalibration and guidance." },
            { icon: Zap, title: "Unlimited Challenges", desc: "Access the full exposure ladder library." },
            { icon: Shield, title: "Advanced Analytics", desc: "Deep dive into your neural progress." }
          ].map((feature, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <feature.icon size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{feature.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-4 pt-4">
          <GlassCard 
            className="border-2 border-blue-500 bg-blue-50 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">
              Best Value
            </div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="font-bold text-gray-900">Yearly Protocol</h4>
                <p className="text-xs text-gray-500">Billed annually</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">$4.99<span className="text-sm font-normal text-gray-400">/mo</span></div>
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Save 50%</div>
              </div>
            </div>
            <button
              onClick={() => handleDodoPayment('p_yearly_elite')}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
            >
              Subscribe with Dodo
            </button>
          </GlassCard>

          <GlassCard 
            className="border-2 border-gray-100"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="font-bold text-gray-900">Monthly Protocol</h4>
                <p className="text-xs text-gray-500">Flexible subscription</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">$9.99<span className="text-sm font-normal text-gray-400">/mo</span></div>
              </div>
            </div>
            <button
              onClick={() => handleDodoPayment('p_monthly_elite')}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
            >
              Subscribe with Dodo
            </button>
          </GlassCard>

          <div className="pt-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter Coupon Code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="w-full py-4 px-12 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold uppercase tracking-widest focus:outline-none focus:border-blue-500 transition-colors"
              />
              <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <button
                onClick={handleApplyCoupon}
                disabled={isApplying || !couponCode.trim()}
                className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
              >
                {isApplying ? 'Applying...' : 'Apply'}
              </button>
            </div>
            {couponError && <p className="text-red-500 text-[10px] font-bold mt-2 px-2 uppercase tracking-widest">{couponError}</p>}
            {couponSuccess && <p className="text-green-500 text-[10px] font-bold mt-2 px-2 uppercase tracking-widest">Coupon Applied Successfully!</p>}
          </div>
        </div>

        <div className="text-center px-8 pb-4">
          <p className="text-[10px] text-gray-400 font-medium mb-2">
            By continuing, you agree to our 
            <a href="/terms" className="text-blue-500 hover:underline mx-1">Terms of Service</a> 
            and 
            <a href="/privacy" className="text-blue-500 hover:underline mx-1">Privacy Policy</a>.
          </p>
          <p className="text-[10px] text-gray-400 font-medium">
            Cancel anytime in your account settings.
          </p>
        </div>
      </div>

      <div className="p-6 border-t border-gray-100 safe-bottom">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleRestore} 
          className="w-full py-3 text-xs font-bold text-gray-400 uppercase tracking-widest"
        >
          Restore Purchases
        </motion.button>
      </div>
    </motion.div>
  );
}
