import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import { RevenueCatProvider } from './src/contexts/RevenueCatContext';
import RootNavigator from './src/navigation/RootNavigator';
import { initializeRevenueCat } from './src/services/revenuecat';
import { setupNotifications } from './src/services/notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  useEffect(() => {
    // Initialize RevenueCat
    initializeRevenueCat();
    
    // Setup push notifications
    setupNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <RevenueCatProvider>
            <CartProvider>
              <StatusBar style="auto" />
              <RootNavigator />
            </CartProvider>
          </RevenueCatProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}