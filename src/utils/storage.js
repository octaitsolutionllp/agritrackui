import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Thin wrapper so the rest of the app never touches expo-secure-store directly —
// keeps token/user/language persistence swappable later without touching call sites.
// expo-secure-store has no web implementation (silently no-ops), so the browser
// preview falls back to localStorage; native iOS/Android always uses SecureStore.
export const storage = {
  async getItem(key) {
    try {
      if (Platform.OS === 'web') {
        return window.localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    try {
      if (Platform.OS === 'web') {
        window.localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch {
      // best-effort — a failed write just means the value won't survive a restart
    }
  },
  async removeItem(key) {
    try {
      if (Platform.OS === 'web') {
        window.localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore
    }
  },
};
