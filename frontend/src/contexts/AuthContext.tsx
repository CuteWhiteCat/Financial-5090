import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, APIError } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const loadAuth = async () => {
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        setToken(savedToken);
        try {
          const userData = await authAPI.getCurrentUser(savedToken);
          setUser(userData);
        } catch (error) {
          console.error('載入使用者資訊失敗：', error);
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    loadAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authAPI.login(username, password);
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem('auth_token', response.access_token);
    } catch (error: unknown) {
      console.error('登入失敗：', error);
      if (error instanceof APIError) {
        throw new Error(error.message);
      }
      if (error instanceof Error) {
        throw new Error(error.message || '登入失敗，請稍後再試');
      }
      throw new Error('登入失敗，請稍後再試');
    }
  };

  const register = async (username: string, email: string, password: string, fullName?: string) => {
    try {
      await authAPI.register(username, email, password, fullName);
      // After registration, automatically login
      await login(username, password);
    } catch (error: unknown) {
      console.error('註冊失敗：', error);
      if (error instanceof APIError) {
        throw new Error(error.message);
      }
      if (error instanceof Error) {
        throw new Error(error.message || '註冊失敗，請稍後再試');
      }
      throw new Error('註冊失敗，請稍後再試');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
