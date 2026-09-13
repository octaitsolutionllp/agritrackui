// Physical device (Expo Go) needs the dev machine's LAN IP — Android emulator's 10.0.2.2 / iOS
// simulator's localhost don't resolve from a real phone. Update this IP if it changes (ipconfig).
// `EXPO_PUBLIC_API_BASE_URL` (set via .env.production, read at build time) overrides this for
// the deployed web build, so the production bundle never points at a dev machine's LAN IP.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.6:5012';

export const REQUEST_TIMEOUT = 15000;
