import { memo } from 'react';
import { Home, Share2, BarChart3, User } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNav = memo(({ activeTab, onTabChange }: BottomNavProps) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'network', icon: Share2, label: 'Network' },
    { id: 'analysis', icon: BarChart3, label: 'Analysis' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-6 left-6 right-6 glass-morphism-dark rounded-[2rem] px-4 py-3 flex justify-around items-center z-50 border-white/10 shadow-2xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              onTabChange(tab.id);
            }}
            className={clsx(
              "flex-1 flex flex-col items-center gap-1 py-1 transition-all relative",
              isActive ? "text-blue-400" : "text-gray-500 hover:text-gray-300"
            )}
          >
            {isActive && (
              <motion.div 
                layoutId="activeTabGlow"
                className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full -z-10"
              />
            )}
            <div className="relative">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={clsx("transition-transform duration-300", isActive && "scale-110 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]")} />
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)]"
                />
              )}
            </div>
            <span className={clsx("text-[8px] font-black uppercase tracking-[0.2em] transition-colors", isActive ? "text-blue-400" : "text-gray-500")}>{tab.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
