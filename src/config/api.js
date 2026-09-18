import { Platform } from 'react-native';

// Physical device (Expo Go) needs the dev machine's LAN IP — Android emulator's 10.0.2.2 / iOS
// simulator's localhost don't resolve from a real phone. Update this IP if it changes (ipconfig).
// The web preview doesn't need it at all — browser and API run on the same machine, so
// `localhost` always resolves correctly there regardless of what the LAN IP currently is (it
// kept drifting across sessions and silently breaking local web testing).
// `EXPO_PUBLIC_API_BASE_URL` (set via .env.production, read at build time) overrides this for
// the deployed web build, so the production bundle never points at a dev machine's LAN IP.
const DEV_LAN_IP = 'http://192.168.1.2:5012';
const devDefault = Platform.OS === 'web' ? 'http://localhost:5012' : DEV_LAN_IP;

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || devDefault;

export const REQUEST_TIMEOUT = 15000;
