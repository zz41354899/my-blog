'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();

  // Check for existing session
  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // User is already logged in, redirect to dashboard
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Failed to check session:', error);
      }
    }

    checkSession();
  }, [router]);

  useEffect(() => {
    // Countdown timer for cooldown
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(cooldown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission during cooldown
    if (cooldown > 0) {
      setMessage({
        type: 'error',
        text: `請稍候 ${cooldown} 秒後再試`
      });
      return;
    }
    
    // Form validation
    if (!email || !password || !confirmPassword) {
      setMessage({
        type: 'error',
        text: '請填寫所有欄位'
      });
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: '密碼與確認密碼不符'
      });
      return;
    }

    if (password.length < 6) {
      setMessage({
        type: 'error',
        text: '密碼長度必須至少為 6 個字符'
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({
        type: 'error',
        text: '請輸入有效的電子郵件地址'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        if (error.status === 429) {
          // Rate limited
          setCooldown(30); // 30 second cooldown
          setMessage({
            type: 'error',
            text: '超過請求限制，請30秒後再試'
          });
        } else if (error.message.includes('User already registered')) {
          setMessage({
            type: 'error',
            text: '此電子郵件已被註冊'
          });
        } else {
          setMessage({
            type: 'error',
            text: error.message || '註冊失敗，請稍後再試'
          });
        }
      } else {
        setIsRegistered(true);
        setMessage({
          type: 'success',
          text: '註冊成功！請查看您的電子郵件以進行驗證'
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setMessage({
        type: 'error',
        text: '註冊時發生錯誤，請稍後再試'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegistered ? '註冊成功！' : '註冊新帳戶'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            已經有帳戶？{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              登入
            </Link>
          </p>
        </div>

        {message && (
          <div className={`rounded-md p-4 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <p>{message.text}</p>
          </div>
        )}

        {isRegistered ? (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              我們已發送驗證郵件至 <strong>{email}</strong>。
              <br />請檢查您的收件箱並點擊驗證連結以完成註冊。
            </p>
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              返回登入頁面
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleRegister}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">電子郵件</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="電子郵件"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">密碼</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="密碼"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="sr-only">確認密碼</label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="確認密碼"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || cooldown > 0}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  loading || cooldown > 0 ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="small" />
                    <span className="ml-2">處理中...</span>
                  </div>
                ) : cooldown > 0 ? (
                  `請等待 ${cooldown} 秒`
                ) : (
                  '註冊'
                )}
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            回到首頁
          </Link>
        </div>
      </div>
    </div>
  );
} 