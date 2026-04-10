import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services/api';

// ─── DEVELOPMENT TOGGLES ─────────────────────────────────
// Set to true to bypass login/registration and view the app
export const USE_MOCK_AUTH = false;

const MOCK_USER: User = {
  id: 999,
  username: 'testuser',
  email: 'test@example.com',
  phone_number: '+255123456789',
  is_customer: true,
  is_restaurant_owner: false,
  address: 'Sample Address',
  profile_picture: null,
};
// ──────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  email: string;
  phone_number: string;
  is_customer: boolean;
  is_restaurant_owner: boolean;
  address: string | null;
  profile_picture: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    phone_number: string;
    is_customer?: boolean;
    is_restaurant_owner?: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (USE_MOCK_AUTH) {
      setUser(MOCK_USER);
      setIsLoading(false);
      return;
    }

    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        const res = await authApi.getProfile();
        setUser(res.data);
      }
    } catch {
      await clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const clearTokens = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    setUser(null);
  };

  const login = async (username: string, password: string) => {
    if (USE_MOCK_AUTH) {
      setUser(MOCK_USER);
      return;
    }
    const res = await authApi.login({ username, password });
    const { access, refresh, user: userData } = res.data;
    await SecureStore.setItemAsync('access_token', access);
    await SecureStore.setItemAsync('refresh_token', refresh);
    setUser(userData);
  };

  const register = async (data: Parameters<AuthContextType['register']>[0]) => {
    if (USE_MOCK_AUTH) return;
    await authApi.register(data);
  };

  const logout = async () => {
    if (USE_MOCK_AUTH) {
      setUser(null);
      // Let standard flow reload mock user on next checkAuth if so desired, 
      // or optionally keep user null until restart. 
      return;
    }
    await clearTokens();
  };

  const refreshUser = async () => {
    if (USE_MOCK_AUTH) return;
    try {
      const res = await authApi.getProfile();
      setUser(res.data);
    } catch { /* silent */ }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
