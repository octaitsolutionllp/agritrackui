import axios from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT } from '../config/api';
import { storage } from '../utils/storage';

export const TOKEN_KEY = 'agritrack_auth_token';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
});

client.interceptors.request.use(async (config) => {
  const token = await storage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onSessionExpired = null;
export function setOnSessionExpired(callback) {
  onSessionExpired = callback;
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      onSessionExpired?.();
    }
    return Promise.reject(error);
  }
);

export default client;
