'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, UserRole } from '@/types';
import { databaseStore } from '@/lib/db';
import { auth as firebaseAuth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPending: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  quickLogin: (userId: string) => void;
  signup: (data: {
    name: string;
    email: string;
    phone: string;
    requestedRole: string;
    password?: string;
  }) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from databaseStore / localStorage
  useEffect(() => {
    try {
      const currentUser = databaseStore.getCurrentUser();
      setUser(currentUser);
    } catch (e) {
      console.error('Error loading current user:', e);
    } finally {
      setIsLoading(false);
    }

    // Also observe Firebase Auth if available
    if (firebaseAuth) {
      try {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (fbUser) => {
          if (fbUser && fbUser.email) {
            const matched = databaseStore.getUserByEmail(fbUser.email);
            if (matched) {
              setUser(matched);
              databaseStore.setCurrentUser(matched);
            }
          }
        });
        return () => unsubscribe();
      } catch (err) {
        // Firebase Auth listener fallback
      }
    }
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // Attempt Firebase Auth sign-in if password provided
      if (password && firebaseAuth) {
        try {
          await signInWithEmailAndPassword(firebaseAuth, email, password);
        } catch {
          // If Firebase Auth does not have user yet, we fallback to internal directory check
        }
      }

      // Check internal users in database
      const found = databaseStore.getUserByEmail(email);
      if (!found) {
        setIsLoading(false);
        return { success: false, error: 'E-mail não encontrado no sistema.' };
      }

      if (found.status === 'BLOCKED') {
        setIsLoading(false);
        return { success: false, error: 'Acesso bloqueado pela administração.' };
      }

      // Update last login
      databaseStore.updateUser(found.id, { lastLoginAt: new Date().toISOString() });
      databaseStore.setCurrentUser(found);
      setUser(found);
      setIsLoading(false);

      if (found.status === 'PENDING') {
        return { success: true };
      }

      return { success: true };
    } catch (err: unknown) {
      setIsLoading(false);
      const errorMsg = err instanceof Error ? err.message : 'Falha ao realizar login.';
      return { success: false, error: errorMsg };
    }
  };

  const quickLogin = (userId: string) => {
    const found = databaseStore.getUserById(userId);
    if (found) {
      databaseStore.setCurrentUser(found);
      setUser(found);
      if (found.status === 'ACTIVE') {
        router.push('/');
      }
    }
  };

  const signup = async (data: {
    name: string;
    email: string;
    phone: string;
    requestedRole: string;
    password?: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> => {
    setIsLoading(true);
    try {
      // Check if email already exists
      const existing = databaseStore.getUserByEmail(data.email);
      if (existing) {
        setIsLoading(false);
        return { success: false, error: 'Já existe um cadastro com este e-mail.' };
      }

      // Register in Firebase Auth if password supplied
      if (data.password && firebaseAuth) {
        try {
          await createUserWithEmailAndPassword(firebaseAuth, data.email, data.password);
        } catch (fbErr) {
          console.warn('Firebase Auth signup note:', fbErr);
        }
      }

      const tenant = databaseStore.getTenant();

      // Create new user with status: PENDING
      const newUser = databaseStore.createUser({
        tenantId: tenant.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: 'ATTENDANT', // Default placeholder until admin approves
        requestedRole: data.requestedRole,
        active: false,
        status: 'PENDING',
      });

      setUser(newUser);
      databaseStore.setCurrentUser(newUser);
      setIsLoading(false);
      return { success: true, user: newUser };
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar usuário.';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    if (firebaseAuth) {
      try {
        firebaseSignOut(firebaseAuth);
      } catch {}
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('traduztudo_current_user_id');
    }
    // Set to null or guest
    setUser(null);
    router.push('/login');
  };

  const isAdmin = user ? user.role === 'OWNER' || user.role === 'ADMIN' : false;
  const isPending = user ? user.status === 'PENDING' : false;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isPending,
        isLoading,
        login,
        quickLogin,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
