'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { signInWithEmail, signOut as authSignOut, signUpWithEmail } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signUp: (email: string, password: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<{ error: unknown }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      setIsLoading(true);

      // 獲取初始會話
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);

      // 設置監聽器以捕捉身份驗證變化
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          setUser(session?.user || null);
          setIsLoading(false);
        }
      );

      setIsLoading(false);

      // 清理
      return () => {
        subscription.unsubscribe();
      };
    };

    initSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await signInWithEmail(email, password);
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await signUpWithEmail(email, password);
    return { error };
  };

  const signOutUser = async () => {
    const { error } = await authSignOut();
    return { error };
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut: signOutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth 必須在 AuthProvider 內部使用');
  }
  return context;
} 