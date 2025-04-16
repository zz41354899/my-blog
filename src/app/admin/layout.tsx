'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import LoadingSpinner from '@/components/LoadingSpinner';
import { BiLogOut } from "react-icons/bi";
import { CgMenuLeft } from "react-icons/cg";
import clsx from "clsx";
import { User as SupabaseUser } from '@supabase/supabase-js';

// Define a more specific user type that combines Supabase User with Profile
type User = SupabaseUser & {
  profile?: {
    name?: string | null;
    avatar_url?: string | null;
  };
};

// Define navigation item interface
interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

// Navigation items
const navItems: NavItem[] = [
  {
    label: '儀表板',
    href: '/admin',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    label: '文章管理',
    href: '/admin/posts',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    label: '新增文章',
    href: '/admin/posts/new',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    ),
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileName, setProfileName] = useState<string>("用戶");
  const [loadingStartTime, setLoadingStartTime] = useState<number>(Date.now());
  const [loadingMessage, setLoadingMessage] = useState<string>("正在載入...");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  /**
   * 獲取用戶數據的主要函數
   */
  async function getUser() {
    // 如果已經有使用者，直接返回
    if (user) return user;
    
    // 設定載入開始時間和訊息
    setLoadingStartTime(Date.now());
    setLoadingMessage('正在檢查登入狀態...');
    
    try {
      // 獲取當前會話
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session check error:', sessionError);
        setError(sessionError.message);
        setIsLoading(false);
        router.push('/login');
        return null;
      }
      
      // 如果沒有會話，表示用戶未登入
      if (!session) {
        console.log('No session found, redirecting to login');
        setIsLoading(false);
        router.push('/login');
        return null;
      }
      
      console.log('Session found:', session.user.id);
      
      // 檢查是否為管理員帳號
      if (session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        console.log('⛔ 非管理員帳號嘗試訪問 /admin:', session.user.email);
        setError('⚠️ 你無權訪問管理後台');
        setLoadingMessage('尚未登入或無權限');
        
        // 登出非管理員帳號
        await supabase.auth.signOut();
        setIsLoading(false);
        
        // 延遲跳轉至登入頁面
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        
        return null;
      }
      
      // 獲取用戶資料
      setLoadingMessage('正在獲取用戶資料...');
      
      // 確保至少顯示載入動畫一段時間，避免閃爍
      const startTime = Date.now();
      
      try {
        // 獲取用戶檔案
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError);
          // 即使個人檔案獲取失敗，我們仍然會保留會話
        }
        
        // 合併用戶數據
        const userData: User = {
          ...session.user,
          profile: profile || { 
            name: session.user.email?.split('@')[0] || '用戶',
            avatar_url: null 
          }
        };
        
        // 更新顯示名稱
        setProfileName(userData.profile?.name || userData.email?.split('@')[0] || '用戶');
        
        // 確保載入至少顯示500毫秒以避免閃爍
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 500) {
          await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
        }
        
        console.log('User data loaded successfully:', userData.id);
        setUser(userData);
        setIsLoading(false);
        return userData;
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('無法獲取用戶資料，請重新登入');
        setIsLoading(false);
        setTimeout(() => router.push('/login'), 2000);
        return null;
      }
    } catch (err) {
      console.error('Error in getUser:', err);
      setError('發生錯誤，請重新整理頁面');
      setIsLoading(false);
      setTimeout(() => router.push('/login'), 2000);
      return null;
    }
  }
  
  // 監聽身份驗證狀態變化
  useEffect(() => {
    let isMounted = true;
    
    // 初始檢查用戶會話
    async function initializeSession() {
      if (isMounted) {
        setIsLoading(true);
        await getUser();
      }
    }
    
    initializeSession();
    
    // 監聽身份驗證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setUser(null);
            router.push('/login');
          }
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (isMounted) {
            try {
              // 檢查是否為管理員帳號
              if (session?.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
                console.log('⛔ 非管理員帳號狀態變更事件:', event, session?.user.email);
                setError('⚠️ 你無權訪問管理後台');
                
                // 登出非管理員帳號
                await supabase.auth.signOut();
                
                // 延遲跳轉至登入頁面
                setTimeout(() => {
                  router.push('/login');
                }, 1000);
                
                return;
              }
                            
              await getUser();
            } catch (err) {
              console.error('Error fetching user data on auth change:', err);
            }
          }
        }
      }
    );
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  // 登出處理函數
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('正在登出...');
      await supabase.auth.signOut();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error("登出錯誤:", error);
      setError("登出時發生錯誤，請重新嘗試");
      setIsLoading(false);
    }
  };
  
  // 顯示載入中狀態
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">{loadingMessage}</p>
        {Date.now() - loadingStartTime > 5000 && (
          <p className="mt-2 text-sm text-gray-500 max-w-md text-center">
            載入時間較長，可能是網絡連接問題或會話已過期。
            <button 
              onClick={() => router.push('/login')} 
              className="text-blue-500 underline ml-1"
            >
              返回登入頁面
            </button>
          </p>
        )}
      </div>
    );
  }
  
  // 如果沒有用戶，繼續顯示載入指示器，同時進行重定向
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">正在轉跳至登入頁面...</p>
      </div>
    );
  }
  
  // 有用戶，顯示正常版面
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <button className="text-gray-600 mr-4" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <CgMenuLeft size={24} />
          </button>
          <h1 className="font-bold text-xl">管理後台</h1>
        </div>
        <div className="flex items-center">
          <p className="text-sm text-gray-600 mr-3">您好，{profileName}</p>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            title="登出"
          >
            <BiLogOut size={20} />
          </button>
        </div>
      </header>
      
      <div className="flex flex-1">
        <aside
          className={clsx(
            "bg-white w-64 shadow-md fixed h-full transition-transform z-30 md:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="p-6">
            <ul className="space-y-3">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center p-3 rounded-lg hover:bg-gray-100 text-gray-700"
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        
        <div
          className={clsx(
            "fixed inset-0 bg-black/50 z-20 transition-opacity md:hidden",
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setIsSidebarOpen(false)}
        />
        
        <main className="flex-1 p-6 ml-0 md:ml-64">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
              <button 
                onClick={() => setError(null)} 
                className="ml-2 text-red-500 hover:text-red-700"
              >
                關閉
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
 