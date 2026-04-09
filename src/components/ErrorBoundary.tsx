import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<Props>, State> {
  state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6"
          >
            <AlertCircle size={40} />
          </motion.div>
          
          <h1 className="text-2xl font-black text-gray-900 mb-2 italic tracking-tight uppercase">Neural Interface Error</h1>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto leading-relaxed">
            The protocol has encountered an unexpected interruption. Neural patterns could not be synchronized.
          </p>

          <div className="space-y-3 w-full max-w-xs">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-100 active:scale-95 transition-transform"
            >
              <RefreshCw size={18} /> Restart Protocol
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Home size={18} /> Return Home
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 w-full max-w-xs">
            <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.3em]">Error Code: {this.state.error?.name || 'UNKNOWN_EXCEPTION'}</p>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
