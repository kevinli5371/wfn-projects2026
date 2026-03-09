import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => void;
  signUp: (email: string, username: string, password: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  signIn: () => {},
  signUp: () => {},
  signOut: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const signIn = (email: string, password: string) => {
    // TODO: Wire up to real backend auth
    setIsAuthenticated(true);
  };

  const signUp = (email: string, username: string, password: string) => {
    // TODO: Wire up to real backend auth
    setIsAuthenticated(true);
  };

  const signOut = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
