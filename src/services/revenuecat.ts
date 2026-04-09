import { Purchases } from '@revenuecat/purchases-js';

const API_KEY = (import.meta as any).env.VITE_REVENUECAT_API_KEY;

export const initRevenueCat = async (userId: string) => {
  if (!API_KEY) {
    console.warn('RevenueCat API Key is missing. Payments will be disabled.');
    return;
  }

  try {
    (Purchases as any).configure(API_KEY, userId);
    console.log('RevenueCat initialized for user:', userId);
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
  }
};

export const getOfferings = async () => {
  try {
    const offerings = await (Purchases as any).getOfferings();
    return offerings;
  } catch (error) {
    console.error('Failed to fetch offerings:', error);
    return null;
  }
};

export const purchasePackage = async (packageToPurchase: any) => {
  try {
    const { customerInfo } = await (Purchases as any).purchasePackage(packageToPurchase);
    return customerInfo;
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error('Purchase failed:', error);
    }
    throw error;
  }
};

export const getCustomerInfo = async () => {
  try {
    const customerInfo = await (Purchases as any).getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Failed to get customer info:', error);
    return null;
  }
};
