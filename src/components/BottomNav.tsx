import { Home, Share2, BarChart3, User } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'network', icon: Share2, label: 'Network' },
    { id: 'analysis', icon: BarChart3, label: 'Analysis' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex justify-around items-center z-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              console.log(`Navigation: Switching to ${tab.id}`);
              onTabChange(tab.id);
            }}
            className={clsx(
              "flex-1 flex flex-col items-center gap-1 py-2 transition-all relative",
              isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            )}
          >
            {isActive && (
              <motion.div 
                layoutId="activeTab"
                className="absolute -top-2 w-8 h-1 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              />
            )}
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={clsx("transition-transform", isActive && "scale-110")} />
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
