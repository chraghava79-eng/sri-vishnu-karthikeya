export type FearType = 'Unknown' | 'Failure' | 'Judgement' | 'Rejection' | 'Darkness' | 'Being Alone' | 'Loss of Control';

export interface FearProgress {
  type: FearType;
  score: number; // 0-100
  lastUpdated: string;
}

export type FearProfile = Record<FearType, number>;

export interface PrivacyPreferences {
  analyticsEnabled: boolean;
  dataCollectionAccepted: boolean;
  marketingEmails?: boolean;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  photoURL?: string;
  email: string;
  fears: FearProgress[];
  fearProfile?: FearProfile;
  privacyPreferences?: PrivacyPreferences;
  streak: number;
  xp: number;
  lastTaskDate?: string;
  lastLoginDate?: string;
  subscriptionStatus: 'free' | 'premium';
  rank: 'Beginner' | 'Intermediate' | 'Pro' | 'Experienced' | 'Elite' | 'God';
  role?: 'user' | 'admin';
  isBanned?: boolean;
  createdAt: any;
  aiCredits?: number;
  lastCreditReset?: string;
  goldBadge?: boolean;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  duration: '1month' | '3months' | 'yearly';
  expiryDate?: string;
  usageLimit?: number;
  usageCount: number;
  active: boolean;
}

export interface AppConfig {
  freeFearLimit: number;
  dailyTaskLimit: number;
  aiEnabled: boolean;
}

export interface ExposureTask {
  id: string;
  fearType: FearType;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  points: number;
}

export interface TaskLog {
  userId: string;
  taskId: string;
  fearType: FearType;
  beforeFear: number;
  afterFear: number;
  timestamp: any;
}

export type AlternativeModeType = 'Mind Reframe' | 'Micro-Challenges' | 'Reflection';

export interface AlternativeActivity {
  id: string;
  type: AlternativeModeType;
  title: string;
  description: string;
  isPremium?: boolean;
}

export interface AlternativeLog {
  userId: string;
  activityId: string;
  type: AlternativeModeType;
  input?: string;
  reframe?: string;
  timestamp: any;
}
