import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';
import { registerPushToken } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationData {
  alertId?: string;
  hiveId?: string;
  type?: 'alert' | 'reminder';
}

const PUSH_TOKEN_STORAGE_KEY = '@bsads/push_token';

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const responseListener = useRef<Notifications.Subscription>();
  const notificationListener = useRef<Notifications.Subscription>();

  async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for notifications!');
        return;
      }
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;

        // Register token with backend if not already registered
        const savedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
        if (token && token !== savedToken) {
          await registerPushToken({
            token,
            deviceId: Constants.deviceId || 'unknown',
            platform: Platform.OS as 'ios' | 'android' | 'web',
          });
          await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
        }
      } catch (error) {
        console.error('Error getting push token:', error);
      }
    } else {
      Alert.alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFB268',
      });
    }

    return token;
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    return () => {
      notificationListener.current && Notifications.removeNotificationSubscription(notificationListener.current);
      responseListener.current && Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return {
    expoPushToken,
    notification,
    registerForPushNotificationsAsync,
  };
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: PushNotificationData
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null,
  });
}
