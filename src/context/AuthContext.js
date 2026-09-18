import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { TOKEN_KEY, setOnSessionExpired } from '../api/client';
import { storage } from '../utils/storage';
import { useLanguage } from './LanguageContext';

const USER_KEY = 'agritrack_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setLanguage } = useLanguage();

  useEffect(() => {
    (async () => {
      const [storedToken, storedUser] = await Promise.all([
        storage.getItem(TOKEN_KEY),
        storage.getItem(USER_KEY),
      ]);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    setOnSessionExpired(() => signOut());
  }, []);

  // `applyServerLanguage`: on register, the account's PreferredLanguage IS what the user just
  // picked on this screen, so applying it is a no-op-safe roundtrip. On login, the account may
  // carry a DIFFERENT language from a previous session/device — applying it would silently
  // override whatever the user just picked on the login screen for *this* session, which is the
  // bug reported. So login keeps whatever language is already active locally.
  const persistSession = async (authResponse, { applyServerLanguage }) => {
    const { token: newToken, userId, name, emailOrPhone, preferredLanguage, hasCompletedCropSelection, role } = authResponse;
    const newUser = { id: userId, name, emailOrPhone, preferredLanguage, hasCompletedCropSelection, role };
    await Promise.all([
      storage.setItem(TOKEN_KEY, newToken),
      storage.setItem(USER_KEY, JSON.stringify(newUser)),
    ]);
    setToken(newToken);
    setUser(newUser);
    if (applyServerLanguage && preferredLanguage) {
      await setLanguage(preferredLanguage);
    }
  };

  const register = async ({ name, emailOrPhone, password, preferredLanguage }) => {
    const response = await authApi.register({ name, emailOrPhone, password, preferredLanguage });
    await persistSession(response, { applyServerLanguage: true });
  };

  const signIn = async ({ emailOrPhone, password }) => {
    const response = await authApi.login({ emailOrPhone, password });
    await persistSession(response, { applyServerLanguage: false });
  };

  const signOut = async () => {
    await Promise.all([storage.removeItem(TOKEN_KEY), storage.removeItem(USER_KEY)]);
    setToken(null);
    setUser(null);
  };

  // Called after the crop-selection screen saves (or is skipped), so the app immediately stops
  // gating on onboarding without requiring a fresh login to pick up the server-side flag.
  const markCropSelectionComplete = async () => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, hasCompletedCropSelection: true };
      storage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const value = useMemo(
    () => ({ user, token, loading, register, signIn, signOut, markCropSelectionComplete }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
