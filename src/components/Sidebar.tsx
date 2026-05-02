import React from 'react';
import { Home, Share2, BarChart3, User, LogOut, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { APP_LOGO } from '../constants';
import { logOut } from '../firebase';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userEmail?: string;
}

export default function Sidebar({ activeTab, onTabChange, userEmail }: SidebarProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'network', icon: Share2, label: 'Neural Network' },
    { id: 'analysis', icon: BarChart3, label: 'Analysis' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-72 h-screen bg-white border-r border-gray-100 p-8 z-[60] relative overflow-hidden">
      {/* Logo Section */}
      <div className="flex items-center gap-3 mb-16 relative z-10">
        <img src={APP_LOGO} className="w-10 h-10 rounded-xl object-cover shadow-lg" alt="Phobix" />
        <span className="text-2xl font-bold tracking-tighter italic uppercase text-gray-900">PHOBIX</span>
      </div>

      {/* Nav Section */}
      <nav className="flex-1 space-y-2 relative z-10">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 px-3">Protocol Navigation</p>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 relative group",
                isActive ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebarActiveBg"
                  className="absolute inset-0 bg-blue-100/50 rounded-2xl -z-10 shadow-sm"
                />
              )}
              <Icon size={20} className={clsx("transition-transform group-hover:scale-110", isActive ? "text-blue-600" : "text-gray-400")} />
              <span className="text-sm font-black uppercase tracking-widest">{tab.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="indicator"
                  className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Section */}
      <div className="pt-8 border-t border-gray-100 relative z-10">
        <div className="bg-gray-50 p-4 rounded-2xl mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-black">
            {userEmail?.[0].toUpperCase() || 'P'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">{userEmail?.split('@')[0] || 'Protocol User'}</p>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Active Session</p>
          </div>
        </div>
        
        <button 
          onClick={() => logOut()}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all group font-black text-[10px] uppercase tracking-widest"
        >
          <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
          Sign Off Interface
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-blue-50/30 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-50/20 blur-[100px] rounded-full pointer-events-none -z-10" />
    </aside>
  );
}
