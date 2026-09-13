import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { AllTogetherApiClient } from '../api/client';

export async function enablePushReminders(api: AllTogetherApiClient): Promise<{ enabled: boolean; reason?: string }> {
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (!projectId) return { enabled: false, reason: 'EXPO_PUBLIC_EAS_PROJECT_ID is not configured' };

  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return { enabled: false, reason: 'notification permission denied' };

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('family-updates', {
      name: 'Family updates',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  await api.registerPushToken(token.data, Platform.OS === 'ios' ? 'ios' : 'android');
  return { enabled: true };
}
