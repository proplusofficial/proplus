import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Order, AppNotification, DashboardStats, PaymentMethod } from '../types.js';

interface AuthContextProps {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  adminLogin: (email: string, password: string) => Promise<User>;
  registerUser: (data: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
    paymentMethod: PaymentMethod;
    paymentAccount: string;
  }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: {
    fullName: string;
    phone: string;
    paymentMethod: PaymentMethod;
    paymentAccount: string;
  }) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  fetchStats: () => Promise<DashboardStats>;
  fetchOrders: (search?: string, status?: string) => Promise<Order[]>;
  createOrder: (customerName: string, items: { name: string; quantity: number }[]) => Promise<Order>;
  fetchNotifications: () => Promise<AppNotification[]>;
  markNotificationsAsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  // General wrapper for API fetch requests
  const apiCall = useCallback(async (path: string, method: string = 'GET', body?: any) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }

    const response = await fetch(path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }
    return data;
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiCall('/api/auth/me');
      setUser(data.user);
    } catch (e) {
      console.error('Session restoration failed:', e);
      // Clear token if invalid
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token, apiCall]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const data = await apiCall('/api/auth/login', 'POST', { email, password });
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (e) {
      setLoading(false);
      throw e;
    }
  };

  const adminLogin = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const data = await apiCall('/api/admin/login', 'POST', { email, password });
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (e) {
      setLoading(false);
      throw e;
    }
  };

  const registerUser = async (formData: any): Promise<User> => {
    setLoading(true);
    try {
      const data = await apiCall('/api/auth/register', 'POST', formData);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (e) {
      setLoading(false);
      throw e;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData: any) => {
    const data = await apiCall('/api/user/profile', 'POST', profileData);
    setUser(data.user);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await apiCall('/api/user/change-password', 'POST', { currentPassword, newPassword });
  };

  const fetchStats = async (): Promise<DashboardStats> => {
    return await apiCall('/api/user/stats');
  };

  const fetchOrders = async (search?: string, status?: string): Promise<Order[]> => {
    let url = '/api/orders';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    
    const query = params.toString();
    if (query) url += `?${query}`;

    const data = await apiCall(url);
    return data.orders;
  };

  const createOrder = async (customerName: string, items: { name: string; quantity: number }[]): Promise<Order> => {
    const data = await apiCall('/api/orders', 'POST', { customerName, items });
    return data.order;
  };

  const fetchNotifications = async (): Promise<AppNotification[]> => {
    const data = await apiCall('/api/notifications');
    return data.notifications;
  };

  const markNotificationsAsRead = async () => {
    await apiCall('/api/notifications/read', 'POST');
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = isAuthenticated && user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        adminLogin,
        registerUser,
        logout,
        refreshUser,
        updateProfile,
        changePassword,
        fetchStats,
        fetchOrders,
        createOrder,
        fetchNotifications,
        markNotificationsAsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
