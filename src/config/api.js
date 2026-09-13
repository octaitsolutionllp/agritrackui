// Physical device (Expo Go) needs the dev machine's LAN IP — Android emulator's 10.0.2.2 / iOS
// simulator's localhost don't resolve from a real phone. Update this IP if it changes (ipconfig).
export const API_BASE_URL = 'http://192.168.1.6:5012';

export const REQUEST_TIMEOUT = 15000;
