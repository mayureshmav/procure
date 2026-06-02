'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { AuthResponse, AccessMatrix } from '@/types';

function parseAccessMatrix(json?: string | null): AccessMatrix {
  if (!json) return {};
  try { return JSON.parse(json) as AccessMatrix; }
  catch { return {}; }
}

/** Convenience hook — returns true if the current user can perform `action` on `module` */
export function useAccess(module: keyof AccessMatrix, action: string): boolean {
  const { accessMatrix } = useAuth();
  if (!accessMatrix) return false;
  return !!(accessMatrix[module] as any)?.[action];
}

interface AuthContextType {
  user: AuthResponse | null;
  isLoading: boolean;
  accessMatrix: AccessMatrix;
  canAccess: (module: keyof AccessMatrix, action?: string) => boolean;
  setAuth: (auth: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  accessMatrix: {},
  canAccess: () => true,  // open by default so existing screens don't break
  setAuth: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('authUser');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Dev bypass — full access so no existing screens break
        const defaultUser: AuthResponse = {
          accessToken: 'bypass-token-dev',
          refreshToken: 'bypass-refresh-dev',
          tokenType: 'Bearer',
          expiresIn: 3600,
          username: 'admin',
          role: 'SYSTEM_ADMIN',
          vendorId: null,
          vendorName: null,
          // Tenant context
          customerId: 1, customerName: 'Default Customer',
          companyId:  1, companyName:  'Default Company',
          positionId: 1, positionName: 'System Administrator',
          personId:   null,
          accessMatrix: null, // null → canAccess returns true (full access)
        };
        setUser(defaultUser);
      }
    } catch {}
    setIsLoading(false);
  }, []);

  const accessMatrix = useMemo<AccessMatrix>(
    () => parseAccessMatrix(user?.accessMatrix),
    [user?.accessMatrix]
  );

  /**
   * Returns true if the current position has `action` on `module`.
   * Falls back to true when no accessMatrix is set (dev bypass / admin).
   */
  const canAccess = (module: keyof AccessMatrix, action = 'view'): boolean => {
    if (!user?.accessMatrix) return true; // no matrix = full access (bypass / admin)
    return !!(accessMatrix[module] as any)?.[action];
  };

  const setAuth = (auth: AuthResponse) => {
    localStorage.setItem('accessToken', auth.accessToken);
    localStorage.setItem('refreshToken', auth.refreshToken);
    localStorage.setItem('authUser', JSON.stringify(auth));
    setUser(auth);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authUser');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, accessMatrix, canAccess, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
