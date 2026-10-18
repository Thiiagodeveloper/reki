import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserSettings {
  dailyNewCardLimit: number;
  dailyReviewLimit: number;
  notificationsEnabled: boolean;
  notificationHour: number;
  notificationMinute: number;
}

const SETTINGS_KEY = 'reki_user_settings';

const DEFAULT_SETTINGS: UserSettings = {
  dailyNewCardLimit: 20,
  dailyReviewLimit: 100,
  notificationsEnabled: false,
  notificationHour: 9,
  notificationMinute: 0,
};

export async function getSettings(): Promise<UserSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}
