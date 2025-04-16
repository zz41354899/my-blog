'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// 定義特定允許登入的管理員信箱
const ADMIN_EMAIL = 'zz41354899@gmail.com';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldownTime, setCooldownTime] = useState<number>(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const forceRedirectRef = useRef<NodeJS.Timeout | null>(null);

  // 封裝重定向邏輯以便重複使用
  const navigateToRedirect = useCallback(() => {
    // 從 URL 獲取重定向參數 (可能來自中間件)
    const redirectParam = searchParams.get('redirect');
    const finalRedirectPath = redirectParam || '/admin';
    
    console.log(`🧭 跳轉中 ${finalRedirectPath}...`);
    
    // 備份當前 URL，用於判斷跳轉是否成功
    const currentUrl = window.location.href;
    console.log(`📍 當前 URL: ${currentUrl}`);
    
    // 使用 replace 而非 push，避免導覽歷史記錄混亂
    try {
      router.replace(finalRedirectPath);
      console.log(`✅ router.replace 已執行到 ${finalRedirectPath}`);
    } catch (err) {
      console.error(`⚠️ router.replace 出錯:`, err);
    }
    
    // 監控 URL 變化
    setTimeout(() => {
      if (window.location.href === currentUrl) {
        console.log(`⚠️ 5秒後 URL 未變化，可能跳轉失敗`);
      }
    }, 5000);
  }, [router, searchParams]);

  // 暴力跳轉函數
  const forceNavigate = useCallback(() => {
    const redirectParam = searchParams.get('redirect');
    const finalRedirectPath = redirectParam || '/admin';
    
    console.log(`🔥 執行暴力跳轉到 ${finalRedirectPath}`);
    try {
      window.location.href = finalRedirectPath;
    } catch (err) {
      console.error(`⚠️ 暴力跳轉失敗:`, err);
    }
  }, [searchParams]);

  // 調試函數：打印 localStorage 中的 Supabase 相關項目
  const debugLocalStorage = useCallback(() => {
    console.log('--- localStorage 調試信息 ---');
    
    // 檢查是否有 Supabase 相關的 localStorage 項目
    const supabaseItems = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') || key.includes('supabase')
    );
    
    if (supabaseItems.length > 0) {
      console.log('找到 Supabase 相關的 localStorage 項目:');
      supabaseItems.forEach(key => {
        console.log(`- ${key}`);
      });
    } else {
      console.log('沒有找到 Supabase 相關的 localStorage 項目');
    }
    
    console.log('-----------------------------');
  }, []);

  useEffect(() => {
    console.log('🌀 正在執行登入頁面初始化檢查...');
    
    // 清理之前的超時計時器
    if (sessionCheckTimeoutRef.current) {
      clearTimeout(sessionCheckTimeoutRef.current);
    }
    
    // 新增：暴力檢查並跳轉函數
    const checkSessionAndRedirect = async () => {
      console.log('🌀 正在執行登入後檢查邏輯...');
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔍 檢查 session:', session);
        
        if (session) {
          // 從 URL 獲取重定向參數 (可能來自中間件)
          const redirectParam = searchParams.get('redirect');
          const finalRedirectPath = redirectParam || '/admin';
          
          console.log(`✅ session 存在，準備跳轉到 ${finalRedirectPath}`);
          
          // 嘗試使用 router 進行跳轉
          console.log("🔁 嘗試呼叫 router.push...");
          router.push(finalRedirectPath);
          
          // 備援：如果 3 秒後還沒跳轉，使用 location.href
          forceRedirectRef.current = setTimeout(() => {
            console.log(`⚠️ router.push 未執行？強制備援跳轉 ${finalRedirectPath}`);
            window.location.href = finalRedirectPath;
          }, 3000);
          
          return true;
        } else {
          console.log('⏳ 尚未登入或 session 尚未就緒');
          return false;
        }
      } catch (err) {
        console.error('🔴 檢查 session 時出錯:', err);
        return false;
      }
    };
    
    // 先快速檢查 session 狀態
    checkSessionAndRedirect().then(hasSession => {
      // 如果已存在 session 且正在跳轉，就不執行下面的代碼
      if (hasSession) {
        console.log('⏩ 檢測到有效 session，跳過其他檢查');
        return;
      }
      
      // 如果沒有 session，執行完整的檢查流程
      async function cleanupAndCheckSession() {
        try {
          console.log('檢查用戶會話...');
          debugLocalStorage();
          
          // 檢查會話前先延遲 500ms，確保 Supabase 客戶端完全初始化
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 獲取會話 - 先不清除任何內容，只檢查會話狀態
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('獲取會話錯誤:', sessionError);
            setError('檢查登入狀態時發生錯誤，請重新載入頁面');
            setCheckingSession(false);
            return;
          }
          
          // 詳細輸出會話資訊用於調試
          console.log('會話檢查結果:', {
            hasSession: !!data.session,
            expiresAt: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toLocaleString() : 'N/A',
            user: data.session?.user ? {
              id: data.session.user.id,
              email: data.session.user.email,
              role: data.session.user.role
            } : null
          });
          
          // 無論是否有會話，都進行第二次確認
          const secondCheck = await supabase.auth.getUser();
          console.log('二次確認用戶:', secondCheck.data.user ? '已登入' : '未登入');
          
          if (!data.session || !secondCheck.data.user) {
            // 僅在沒有有效 session 時清理 localStorage
            // 這樣可以避免已登入用戶被清除 session
            console.log('未找到有效會話，準備清理舊的 token...');
            
            // 清除舊版和新版的 token 存儲
            localStorage.removeItem('supabase.auth.token');
            
            // 動態清除項目特定的 token
            // 找出所有 Supabase token 相關的 localStorage 項目
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-') && key.includes('-auth-token')) {
                console.log(`清除 localStorage 項目: ${key}`);
                localStorage.removeItem(key);
              }
            });
            setCheckingSession(false);
          } else {
            console.log('發現有效的 session，驗證用戶...');
            
            if (secondCheck.data.user) {
              console.log('用戶驗證成功:', secondCheck.data.user.email);
              console.log('檢查用戶 profile...');
              
              try {
                // 檢查用戶 profile 是否存在
                const { data: profile, error: profileError } = await supabase
                  .from('profiles')
                  .select('id, name')
                  .eq('id', secondCheck.data.user.id)
                  .single();
                
                if (profileError && profileError.code !== 'PGRST116') {
                  // PGRST116 = 沒有找到數據，這是可接受的
                  console.warn('獲取 profile 時出錯，但非致命錯誤:', profileError);
                }
                
                if (!profile) {
                  console.log('用戶 profile 不存在，但繼續重定向到管理頁面');
                } else {
                  console.log('找到用戶 profile:', profile);
                }
              } catch (profileErr) {
                console.warn('檢查 profile 時出錯，但不影響登入流程:', profileErr);
              }
              
              // 不管 profile 是否存在，都重定向到管理頁面
              // 在重定向前先確認一次重定向路徑
              const redirectParam = searchParams.get('redirect');
              const finalRedirectPath = redirectParam || '/admin';
              console.log(`確認重定向路徑: ${finalRedirectPath}`);
              
              // 暴力跳轉
              console.log("🔁 嘗試呼叫 router.push...");
              router.push(finalRedirectPath);
              
              // 備援：如果 3 秒後還沒跳轉，使用 location.href
              forceRedirectRef.current = setTimeout(() => {
                console.log(`⚠️ router.push 未執行？強制備援跳轉 ${finalRedirectPath}`);
                window.location.href = finalRedirectPath;
              }, 3000);
            } else {
              console.warn('找到 session 但無用戶資料，可能是 token 無效');
              setError('登入狀態已過期，請重新登入');
              await supabase.auth.signOut();
              setCheckingSession(false);
            }
          }
        } catch (error) {
          console.error('Session 檢查錯誤:', error);
          setError('檢查登入狀態時發生未知錯誤');
          setCheckingSession(false);
        }
      }
      
      cleanupAndCheckSession();
      
      // 設置 30 秒超時，避免無限 loading
      sessionCheckTimeoutRef.current = setTimeout(() => {
        if (checkingSession) {
          console.log('Session 檢查超時 - 強制結束 loading 狀態');
          setError('登入處理超時，請刷新頁面重試');
          setCheckingSession(false);
        }
      }, 30000);
    });
    
    return () => {
      if (sessionCheckTimeoutRef.current) {
        clearTimeout(sessionCheckTimeoutRef.current);
      }
      if (forceRedirectRef.current) {
        clearTimeout(forceRedirectRef.current);
      }
    };
  }, [router, navigateToRedirect, debugLocalStorage]);

  // 冷卻時間計時器
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (cooldownTime > 0) {
      timer = setTimeout(() => {
        setCooldownTime(time => time - 1);
      }, 1000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cooldownTime]);

  // 表單驗證
  const validateForm = () => {
    setError(null);
    setSuccess(null);
    
    if (cooldownTime > 0) {
      setError(`請等待 ${cooldownTime} 秒後再嘗試`);
      return false;
    }
    
    if (!email || !password) {
      setError('請輸入電子郵件和密碼');
      return false;
    }
    
    // 檢查是否為允許的管理員郵箱
    if (email !== ADMIN_EMAIL) {
      setError('此電子郵件沒有登入權限');
      return false;
    }
    
    return true;
  };

  // 處理登入
  const handleLogin = async (): Promise<string | null> => {
    console.log('🔐 執行登入流程...');
    
    // 添加額外 1 秒延遲，降低頻繁請求風險並避免 429 錯誤
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('登入錯誤:', error);
        
        // 特別處理 429 錯誤（請求過多）
        if (error.status === 429) {
          const cooldownSeconds = 30; // 設定 30 秒冷卻時間
          setCooldownTime(cooldownSeconds);
          return '登入嘗試次數過多，請稍後再試';
        }
        
        // 其他常見錯誤類型處理
        if (error.message.includes('Invalid login credentials')) {
          return '電子郵件或密碼錯誤';
        } else if (error.message.includes('Email not confirmed')) {
          return '此電子郵件尚未驗證，請檢查您的收件箱';
        } else if (error.message.includes('network')) {
          return '網路連線錯誤，請檢查您的網絡連接';
        } else {
          return error.message || '登入失敗';
        }
      }

      console.log('登入成功!', data);
      
      // 檢查是否為允許的管理員郵箱
      if (data.user?.email !== ADMIN_EMAIL) {
        console.log('⛔ 非管理員帳號嘗試登入:', data.user?.email);
        
        // 立即登出非管理員帳號
        await supabase.auth.signOut();
        
        // 清除本地狀態
        setSuccess(null);
        debugLocalStorage();
        
        return '⚠️ 你無權登入此網站';
      }
      
      // 是管理員帳號，允許登入
      console.log('✅ 管理員帳號登入成功:', data.user?.email);
      setSuccess('登入成功！正在跳轉到管理頁面...');
      
      // 確保 localStorage 有更新
      debugLocalStorage();
      
      // 短延遲後嘗試跳轉
      setTimeout(() => {
        const redirectParam = searchParams.get('redirect');
        const finalRedirectPath = redirectParam || '/admin';
        console.log(`嘗試跳轉到重定向路徑: ${finalRedirectPath}`);
        navigateToRedirect();
        
        // 如果 5 秒後仍在登入頁面，則顯示手動跳轉按鈕
        loginTimeoutRef.current = setTimeout(() => {
          if (window.location.pathname.includes('/login')) {
            console.log('檢測到可能未自動跳轉');
            setSuccess('登入成功！但未自動跳轉。您可以手動前往管理頁面。');
          }
        }, 5000);
      }, 1000);
      
      return null;
    } catch (e) {
      console.error('登入時發生未預期錯誤:', e);
      return '登入時發生未預期錯誤，請稍後再試';
    } finally {
      // finally 區塊確保 loading 狀態被正確重置
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if already loading or in cooldown
    if (loading || cooldownTime > 0) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // 驗證基本欄位
      if (!validateForm()) {
        setLoading(false);
        return;
      }
      
      // 執行登入
      const errorMessage = await handleLogin();
      
      if (errorMessage) {
        setError(errorMessage);
      }
    } catch (error) {
      console.error('表單提交錯誤:', error);
      setError('處理您的請求時發生錯誤');
    } finally {
      setLoading(false);
    }
  };
  
  // 清理超時計時器
  useEffect(() => {
    return () => {
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
      }
    };
  }, []);
  
  // 手動重定向函數
  const handleManualRedirect = () => {
    console.log('手動重定向...');
    debugLocalStorage();
    navigateToRedirect();
  };

  if (checkingSession) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-white">
        <div className="h-10 w-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">正在檢查登入狀態...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-1 text-gray-900">登入管理後台</h1>
          <p className="text-gray-500">輸入您的管理員帳號登入</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-100 bg-red-50 text-red-600 flex items-center">
            <svg 
              className="w-5 h-5 mr-3 flex-shrink-0 text-red-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <p>{error}</p>
            {cooldownTime > 0 && (
              <div className="ml-auto text-sm font-semibold">
                {cooldownTime}秒
              </div>
            )}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg border border-green-100 bg-green-50 text-green-600 flex items-center flex-wrap">
            <svg 
              className="w-5 h-5 mr-3 flex-shrink-0 text-green-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
            <p className="flex-grow">{success}</p>
            
            {/* 添加手動重定向按鈕 */}
            {(success.includes('未自動跳轉') || success.includes('手動前往')) && (
              <button 
                onClick={handleManualRedirect}
                className="mt-3 w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                前往管理頁面
              </button>
            )}
          </div>
        )}
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                電子郵件
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="請輸入管理員電子郵件"
                disabled={cooldownTime > 0 || loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密碼
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="請輸入密碼"
                disabled={cooldownTime > 0 || loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || cooldownTime > 0}
            className={`w-full py-3 px-4 rounded-lg font-medium ${
              loading || cooldownTime > 0 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors duration-200 flex justify-center items-center`}
          >
            {loading ? (
              <>
                <div className="mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                登入中...
              </>
            ) : cooldownTime > 0 ? (
              `請等待 ${cooldownTime} 秒`
            ) : (
              '登入'
            )}
          </button>

          <div className="flex justify-center pt-2">
            <Link 
              href="/" 
              className="text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              返回網站首頁
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 
 