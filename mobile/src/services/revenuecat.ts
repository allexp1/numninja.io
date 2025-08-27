import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Product identifiers for in-app purchases
export const PRODUCT_IDS = {
  // Monthly subscriptions
  MONTHLY_NUMBER_BASIC: 'monthly_number_basic',
  MONTHLY_NUMBER_PREMIUM: 'monthly_number_premium',
  MONTHLY_NUMBER_BUSINESS: 'monthly_number_business',
  
  // SMS packages
  SMS_ADDON_100: 'sms_addon_100',
  SMS_ADDON_500: 'sms_addon_500',
  SMS_ADDON_1000: 'sms_addon_1000',
  SMS_ADDON_UNLIMITED: 'sms_addon_unlimited',
  
  // Forwarding packages
  FORWARDING_BASIC: 'forwarding_basic',
  FORWARDING_ADVANCED: 'forwarding_advanced',
  FORWARDING_ENTERPRISE: 'forwarding_enterprise',
  
  // Bundle deals
  BUNDLE_STARTER: 'bundle_starter',
  BUNDLE_PROFESSIONAL: 'bundle_professional',
  BUNDLE_ENTERPRISE: 'bundle_enterprise',
};

// Entitlement identifiers
export const ENTITLEMENTS = {
  PRO: 'pro',
  PREMIUM: 'premium',
  SMS_ENABLED: 'sms_enabled',
  FORWARDING_ENABLED: 'forwarding_enabled',
  UNLIMITED: 'unlimited',
};

class RevenueCatService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const apiKey = Platform.select({
        ios: Constants.expoConfig?.extra?.revenueCatApiKey?.ios,
        android: Constants.expoConfig?.extra?.revenueCatApiKey?.android,
      });

      if (!apiKey) {
        console.error('RevenueCat API key not found in app.json');
        return;
      }

      // Configure RevenueCat
      await Purchases.configure({ apiKey });

      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      this.isInitialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return null;
    }
  }

  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo;
    } catch (error: any) {
      if (error.userCancelled) {
        throw new Error('Purchase cancelled');
      }
      throw error;
    }
  }

  async purchaseProduct(productId: string): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.purchaseStoreProduct(productId);
      return customerInfo;
    } catch (error: any) {
      if (error.userCancelled) {
        throw new Error('Purchase cancelled');
      }
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }

  async checkEntitlement(entitlementId: string): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      return entitlementId in customerInfo.entitlements.active;
    } catch (error) {
      console.error('Failed to check entitlement:', error);
      return false;
    }
  }

  async hasActiveSubscription(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      return Object.keys(customerInfo.entitlements.active).length > 0;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  async getActiveSubscriptions(): Promise<string[]> {
    try {
      const customerInfo = await this.getCustomerInfo();
      return Object.keys(customerInfo.entitlements.active);
    } catch (error) {
      console.error('Failed to get active subscriptions:', error);
      return [];
    }
  }

  async syncPurchases(): Promise<void> {
    try {
      await Purchases.syncPurchases();
      console.log('Purchases synced successfully');
    } catch (error) {
      console.error('Failed to sync purchases:', error);
    }
  }

  async setUserAttributes(userId: string, email?: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
      
      if (email) {
        await Purchases.setEmail(email);
      }
      
      // Set additional attributes
      await Purchases.setAttributes({
        app_version: Constants.expoConfig?.version || '1.0.0',
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Failed to set user attributes:', error);
    }
  }

  async logOut(): Promise<void> {
    try {
      await Purchases.logOut();
    } catch (error) {
      console.error('Failed to log out from RevenueCat:', error);
    }
  }

  // Helper method to format price
  formatPrice(price: number, currencyCode: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(price);
  }

  // Check if user can make purchases
  async canMakePurchases(): Promise<boolean> {
    try {
      const canMakePayments = await Purchases.canMakePayments();
      return canMakePayments;
    } catch (error) {
      console.error('Failed to check if can make payments:', error);
      return false;
    }
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService();

// Export initialization function for App.tsx
export const initializeRevenueCat = async () => {
  await revenueCatService.initialize();
};