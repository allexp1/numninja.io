import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from '../api/client';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private pushToken: string | null = null;

  async setupNotifications(): Promise<void> {
    try {
      // Check if we're on a physical device
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return;
      }

      // Get permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for notifications');
        return;
      }

      // Get push token
      const token = await this.getExpoPushToken();
      if (token) {
        this.pushToken = token;
        await this.registerTokenWithBackend(token);
      }

      // Set up notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Listen for notifications
      this.setupNotificationListeners();
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  }

  private async getExpoPushToken(): Promise<string | null> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error('Project ID not found in app.json');
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      return token;
    } catch (error) {
      console.error('Error getting Expo push token:', error);
      return null;
    }
  }

  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      await api.post('/notifications/register', {
        token,
        platform: Platform.OS,
      });
      console.log('Push token registered with backend');
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });

    await Notifications.setNotificationChannelAsync('calls', {
      name: 'Incoming Calls',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      lightColor: '#6366f1',
    });

    await Notifications.setNotificationChannelAsync('sms', {
      name: 'SMS Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250],
      sound: 'default',
      lightColor: '#6366f1',
    });

    await Notifications.setNotificationChannelAsync('billing', {
      name: 'Billing & Subscriptions',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#6366f1',
    });
  }

  private setupNotificationListeners(): void {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      this.handleNotification(notification);
    });

    // Handle notification tap
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      this.handleNotificationResponse(response);
    });
  }

  private handleNotification(notification: Notifications.Notification): void {
    const { title, body, data } = notification.request.content;
    
    // Handle different notification types
    switch (data?.type) {
      case 'call':
        this.handleCallNotification(data);
        break;
      case 'sms':
        this.handleSMSNotification(data);
        break;
      case 'billing':
        this.handleBillingNotification(data);
        break;
      default:
        console.log('Unknown notification type');
    }
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;
    
    // Navigate based on notification type
    switch (data?.type) {
      case 'call':
        // Navigate to CDR screen
        // NavigationService.navigate('CDR', { number: data.number });
        break;
      case 'sms':
        // Navigate to SMS history
        // NavigationService.navigate('SMSHistory', { number: data.number });
        break;
      case 'billing':
        // Navigate to subscriptions
        // NavigationService.navigate('Subscriptions');
        break;
    }
  }

  private handleCallNotification(data: any): void {
    // Handle incoming call notification
    console.log('Incoming call:', data);
  }

  private handleSMSNotification(data: any): void {
    // Handle SMS notification
    console.log('New SMS:', data);
  }

  private handleBillingNotification(data: any): void {
    // Handle billing notification
    console.log('Billing update:', data);
  }

  // Public methods
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: trigger || null,
    });

    return notificationId;
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count: number): Promise<boolean> {
    return await Notifications.setBadgeCountAsync(count);
  }

  async clearBadge(): Promise<boolean> {
    return await Notifications.setBadgeCountAsync(0);
  }

  getPushToken(): string | null {
    return this.pushToken;
  }

  // Notification preference methods
  async updateNotificationPreferences(preferences: {
    calls: boolean;
    sms: boolean;
    billing: boolean;
    marketing: boolean;
  }): Promise<void> {
    try {
      await api.post('/notifications/preferences', preferences);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  async getNotificationPreferences(): Promise<any> {
    try {
      const response = await api.get('/notifications/preferences');
      return response.data;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export setup function for App.tsx
export const setupNotifications = async () => {
  await notificationService.setupNotifications();
};