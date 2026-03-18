import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert } from 'react-native';

interface User {
  userId: string;
  username: string;
  balance: number;
  display_name?: string;
  profile_picture_url?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  signIn: (email: string, password: string) => void;
  signUp: (email: string, username: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  signIn: () => { },
  signUp: () => { },
  logout: () => { },
});

export function useAuth() {
  return useContext(AuthContext);
}

const API_URL = 'http://172.20.10.2:8000';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setUser({ 
          userId: data.user_id, 
          username: data.username, 
          balance: data.balance,
          display_name: data.display_name,
          profile_picture_url: data.profile_picture_url
        });
        setIsAuthenticated(true);
      } else {
        Alert.alert('Login Failed', data.error || 'Invalid credentials');
      }
    } catch {
      Alert.alert('Error', 'Could not connect to server');
    }
  };

  const signUp = async (email: string, username: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await res.json();
      if (data.success) {
        setUser({ 
          userId: data.user_id, 
          username: data.username, 
          balance: data.balance,
          display_name: data.display_name,
          profile_picture_url: data.profile_picture_url
        });
        setIsAuthenticated(true);
      } else {
        Alert.alert('Signup Failed', data.error || 'Could not create account');
      }
    } catch {
      Alert.alert('Error', 'Could not connect to server');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
