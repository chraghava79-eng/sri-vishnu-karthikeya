import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Github, Chrome, Loader2, AlertCircle } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } from '../firebase';
import { APP_LOGO } from '../constants';
import GlassCard from './GlassCard';

interface LoginProps {
  onSuccess: () => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else if (mode === 'signup') {
        if (!name.trim()) throw new Error('Name is required');
        await signUpWithEmail(email, password, name);
      } else if (mode === 'reset') {
        await resetPassword(email);
        setMessage('Password reset link sent to your email.');
      }
      if (mode !== 'reset') onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,rgba(59,130,246,0.08)_0%,transparent_100%)]" />
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8 relative z-10"
      >
        <div className="text-center space-y-4">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="inline-block relative"
          >
            <img 
              src={APP_LOGO} 
              className="w-20 h-20 rounded-3xl object-cover shadow-2xl border-2 border-white/10" 
              alt="Phobix" 
            />
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-900">Phobix</h1>
            <p className="text-blue-600 font-black text-[8px] uppercase tracking-[0.4em]">Neural Resilience Protocol</p>
          </div>
        </div>

        <GlassCard className="p-6 sm:p-8 space-y-6 bg-white/40 border-white/60">
          <div className="flex p-1 bg-gray-100/50 rounded-xl mb-2">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                mode === 'signup' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'
              }`}
            >
              Signup
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    required={mode === 'signup'}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            {mode !== 'reset' && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-widest"
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}

            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-50 text-green-600 rounded-xl text-[10px] font-bold uppercase tracking-widest"
              >
                {message}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-100 active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {mode === 'login' ? 'Access Protocol' : mode === 'signup' ? 'Initialize Profile' : 'Reset Password'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {mode === 'login' && (
            <button
              onClick={() => setMode('reset')}
              className="w-full text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
            >
              Forgot Password?
            </button>
          )}

          {mode === 'reset' && (
            <button
              onClick={() => setMode('login')}
              className="w-full text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
            >
              Back to Login
            </button>
          )}

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
              <span className="bg-white/40 px-4 text-gray-400">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 px-8 bg-white border border-gray-100 text-gray-700 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-transform hover:bg-gray-50 disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Google Account
          </button>
        </GlassCard>

        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-gray-100 w-full">
          <div className="text-center">
            <p className="text-2xl font-black text-gray-900">7</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Core Fears</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-gray-900">AI</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Driven Protocols</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
