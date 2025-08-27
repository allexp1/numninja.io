import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  PurchasesEntitlementInfo,
} from 'react-native-purchases';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface RevenueCatContextType {
  isReady: boolean;
  offerings: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  isSubscribed: boolean;
  purchasePackage: (pkg: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  getOfferings: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<boolean>;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
};

interface RevenueCatProviderProps {
  children: ReactNode;
}

export const RevenueCatProvider: React.FC<RevenueCatProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    initializeRevenueCat();
  }, []);

  const initializeRevenueCat = async () => {
    try {
      const apiKey = Platform.select({
        ios: Constants.expoConfig?.extra?.revenueCatApiKey?.ios,
        android: Constants.expoConfig?.extra?.revenueCatApiKey?.android,
      });

      if (!apiKey) {
        console.error('RevenueCat API key not found');
        return;
      }

      // Configure RevenueCat
      await Purchases.configure({ apiKey });
      
      // Set debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      }

      // Get initial customer info
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      checkEntitlements(info);

      // Get offerings
      await getOfferings();

      setIsReady(true);

      // Listen to customer info updates
      Purchases.addCustomerInfoUpdateListener((info) => {
        setCustomerInfo(info);
        checkEntitlements(info);
      });
    } catch (error) {
      console.error('Error initializing RevenueCat:', error);
    }
  };

  const checkEntitlements = (info: CustomerInfo) => {
    // Check if user has any active entitlement
    const hasActiveEntitlement = Object.values(info.entitlements.active).length > 0;
    setIsSubscribed(hasActiveEntitlement);
  };

  const getOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setOfferings(offerings.current);
      }
    } catch (error) {
      console.error('Error getting offerings:', error);
    }
  };

  const purchasePackage = async (pkg: PurchasesPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(customerInfo);
      checkEntitlements(customerInfo);
    } catch (error: any) {
      if (!error.userCancelled) {
        throw new Error(error.message || 'Purchase failed');
      }
    }
  };

  const restorePurchases = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      setCustomerInfo(customerInfo);
      checkEntitlements(customerInfo);
    } catch (error: any) {
      throw new Error(error.message || 'Restore failed');
    }
  };

  const checkSubscriptionStatus = async (): Promise<boolean> => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      checkEntitlements(info);
      return Object.values(info.entitlements.active).length > 0;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  };

  return (
    <RevenueCatContext.Provider
      value={{
        isReady,
        offerings,
        customerInfo,
        isSubscribed,
        purchasePackage,
        restorePurchases,
        getOfferings,
        checkSubscriptionStatus,
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
};