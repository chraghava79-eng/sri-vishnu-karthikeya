import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export enum AnalyticsEvent {
  ONBOARDING_START = 'onboarding_start',
  ONBOARDING_STEP_COMPLETE = 'onboarding_step_complete',
  ONBOARDING_COMPLETE = 'onboarding_complete',
  TAB_CHANGE = 'tab_change',
  FEAR_SELECT = 'fear_select',
  TASK_START = 'task_start',
  TASK_COMPLETE = 'task_complete',
  COACH_OPEN = 'coach_open',
  PAYWALL_OPEN = 'paywall_open',
  UPGRADE_CLICK = 'upgrade_click',
  COUPON_APPLY = 'coupon_apply',
  FEEDBACK_SUBMIT = 'feedback_submit',
  ZOOM_CHANGE = 'zoom_change',
  ACCOUNT_DELETE = 'account_delete',
}

export const trackEvent = async (event: AnalyticsEvent, data: any = {}) => {
  try {
    // Check local opt-out flag
    const privacyPrefs = localStorage.getItem('privacy_preferences');
    if (privacyPrefs) {
      const prefs = JSON.parse(privacyPrefs);
      if (prefs.analyticsEnabled === false) {
        if (import.meta.env.MODE !== 'production') {
          console.log(`[Analytics] Opted out: ${event}`);
        }
        return;
      }
    }

    const userId = auth.currentUser?.uid;
    const eventData = {
      event,
      userId: userId || 'anonymous',
      timestamp: serverTimestamp(),
      ...data,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    };

    // Log to console in dev
    if (import.meta.env.MODE !== 'production') {
      console.log(`[Analytics] ${event}`, eventData);
    }

    // Save to Firestore
    await addDoc(collection(db, 'analytics'), eventData);
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};
