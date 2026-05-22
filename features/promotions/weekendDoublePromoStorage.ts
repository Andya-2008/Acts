import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@acts/weekend_double_last_promo_key';

export async function getLastWeekendDoublePromoKey(): Promise<string | null> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v && v.trim().length > 0 ? v.trim() : null;
  } catch {
    return null;
  }
}

export async function setLastWeekendDoublePromoKey(key: string): Promise<void> {
  await AsyncStorage.setItem(KEY, key);
}
