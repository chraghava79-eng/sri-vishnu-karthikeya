import { memo, ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  [key: string]: any;
}

const GlassCard = memo(({ children, className, onClick, hover = true }: GlassCardProps) => {
  return (
    <motion.div
      whileHover={onClick && hover ? { y: -5, scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "glass-morphism rounded-[2.5rem] p-6 transition-all duration-500 overflow-hidden group border-[var(--border)]",
        onClick && "cursor-pointer hover:bg-blue-500/5 dark:hover:bg-white/5",
        className
      )}
    >
      {/* Premium Shimmer Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
        <motion.div
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "linear",
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
        />
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';

export default GlassCard;
