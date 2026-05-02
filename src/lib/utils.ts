/**
 * Safe localStorage access with error handling and type safety
 */
export const safeStorage = {
  get: <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return fallback;
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Format date for display
 */
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Calculate percentage change
 */
export const calculatePercentChange = (oldVal: number, newVal: number): number => {
  if (oldVal === 0) return newVal > 0 ? 100 : 0;
  return Math.round(((newVal - oldVal) / oldVal) * 100);
};

export const MINDSET_LEVELS = [
  { rank: 'Beginner', minXp: 0, maxXp: 500, color: 'text-gray-500', bg: 'bg-gray-50' },
  { rank: 'Intermediate', minXp: 501, maxXp: 1500, color: 'text-blue-500', bg: 'bg-blue-50' },
  { rank: 'Pro', minXp: 1501, maxXp: 3500, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { rank: 'Experienced', minXp: 3501, maxXp: 7000, color: 'text-purple-500', bg: 'bg-purple-50' },
  { rank: 'Elite', minXp: 7001, maxXp: 12000, color: 'text-amber-500', bg: 'bg-amber-50' },
  { rank: 'God', minXp: 12001, maxXp: 999999, color: 'text-red-600', bg: 'bg-red-50' },
];

export const getMindsetInfo = (xp: number) => {
  const level = MINDSET_LEVELS.find(l => xp >= l.minXp && xp <= l.maxXp) || MINDSET_LEVELS[0];
  const nextLevel = MINDSET_LEVELS[MINDSET_LEVELS.indexOf(level) + 1] || null;
  
  const progress = nextLevel 
    ? ((xp - level.minXp) / (nextLevel.minXp - level.minXp)) * 100 
    : 100;
    
  return { ...level, nextLevel, progress };
};
