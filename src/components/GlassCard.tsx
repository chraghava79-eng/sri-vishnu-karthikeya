import { ReactNode } from 'react';
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

export default function GlassCard({ children, className, onClick, hover = true }: GlassCardProps) {
  return (
    <motion.div
      whileHover={onClick && hover ? { y: -4, scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/60 before:to-transparent before:pointer-events-none",
        "after:absolute after:inset-0 after:bg-gradient-to-tl after:from-blue-500/5 after:to-transparent after:pointer-events-none after:opacity-0 hover:after:opacity-100 transition-opacity duration-500",
        onClick && "cursor-pointer hover:bg-white/50 hover:border-white/80 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)]",
        className
      )}
    >
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
