import { supabase } from './supabaseClient';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

// 客戶端登入
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

// 客戶端註冊
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  return { data, error };
}

// 客戶端登出
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// 客戶端獲取當前會話
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

// 中間件客戶端
export function createAuthMiddlewareClient(req: NextRequest, res: NextResponse) {
  return createMiddlewareClient({ req, res });
} 