'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UserProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  display_name: string | null;
  website: string | null;
  bio: string | null;
}

export default function PreferencesPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  // 獲取用戶資料
  useEffect(() => {
    const getUser = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        setErrorMessage('');
        
        // 獲取當前登入用戶
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        // 明確檢查 session 是否為 null
        if (!session) {
          console.log('Preferences page: No session found, redirecting to login');
          router.push('/login');
          return;
        }

        console.log('Preferences page: Session found, fetching user profile');

        // 獲取用戶 profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('獲取用戶資料失敗 (查詢錯誤):', error);
          
          // 如果是找不到記錄，建立一個新的預設用戶配置而不是報錯
          if (error.code === 'PGRST116') {
            setProfile({
              id: session.user.id,
              name: session.user.email?.split('@')[0] || '用戶',
              avatar_url: null,
              display_name: null,
              website: null,
              bio: null,
            });
            return;
          }
          
          throw error;
        }

        // 初始化配置
        setProfile({
          id: session.user.id,
          name: data?.name || session.user.email?.split('@')[0] || '',
          avatar_url: data?.avatar_url,
          display_name: data?.display_name || null,
          website: data?.website || null,
          bio: data?.bio || null,
        });
      } catch (error) {
        console.error('獲取用戶資料失敗:', error);
        setHasError(true);
        setErrorMessage('獲取用戶資料失敗，請重新載入頁面');
        // 不再自動重定向到登入頁面，而是顯示錯誤訊息
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
    
    // 監聽認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log('Preferences page: Auth state change:', event);
      
      if (event === 'SIGNED_IN') {
        // 用戶登入了，獲取用戶資料
        getUser();
      } else if (event === 'SIGNED_OUT') {
        // 用戶登出了，重定向到登入頁面
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]); // 移除 supabase 依賴

  // 表單提交處理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      // 更新用戶個人資料
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          name: profile.name,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          website: profile.website,
          bio: profile.bio,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setMessage({ text: '個人資料已成功更新', type: 'success' });

      // 3秒後清除訊息
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('更新個人資料失敗', error);
      setMessage({ text: '更新個人資料失敗', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // 處理輸入變更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!profile) return;
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  // 處理頭像URL變更
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const url = e.target.value;
    setProfile({
      ...profile,
      avatar_url: url || null,
    });
  };

  // 顯示載入狀態
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // 顯示錯誤信息
  if (hasError) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="p-4 mb-4 rounded-lg bg-red-50 text-red-700">
          <h2 className="text-lg font-semibold mb-2">發生錯誤</h2>
          <p>{errorMessage}</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          重新載入
        </button>
      </div>
    );
  }

  // 如果沒有用戶，顯示載入中而不是立即返回 null
  // 這可以避免在等待 session 檢查時閃爍
  if (!profile) {
    return (
      <div className="flex justify-center items-center p-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">個人設定</h1>
        <p className="text-gray-600">
          更新您的個人資料和偏好設定。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 顯示訊息 */}
        {message.text && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 頭像預覽與設定 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0">
            {profile?.avatar_url ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                <Image
                  src={profile.avatar_url}
                  alt="頭像預覽"
                  fill
                  className="object-cover"
                  onError={() => {
                    setProfile({...profile, avatar_url: 'https://via.placeholder.com/150?text=頭像'});
                  }}
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-md">
                <span className="text-blue-600 font-semibold text-2xl">
                  {profile?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-grow">
            <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 mb-1">
              頭像網址
            </label>
            <input
              type="text"
              id="avatar_url"
              name="avatar_url"
              value={profile?.avatar_url || ''}
              onChange={handleAvatarChange}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              輸入外部圖片URL作為您的頭像。留空則使用名稱首字母作為頭像。
            </p>
          </div>
        </div>

        {/* 名稱 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            用戶名稱 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={profile?.name || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            用於識別您的唯一名稱。
          </p>
        </div>

        {/* 顯示名稱 */}
        <div>
          <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-1">
            顯示名稱
          </label>
          <input
            type="text"
            id="display_name"
            name="display_name"
            value={profile?.display_name || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            將顯示在您的文章和評論中。如果未設置，將使用用戶名稱。
          </p>
        </div>

        {/* 網站 */}
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
            個人網站
          </label>
          <input
            type="url"
            id="website"
            name="website"
            value={profile?.website || ''}
            onChange={handleChange}
            placeholder="https://yourwebsite.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 簡介 */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            個人簡介
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={profile?.bio || ''}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="簡單介紹一下您自己..."
          ></textarea>
        </div>

        {/* 提交按鈕 */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className={`px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
              isSaving ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSaving ? '儲存中...' : '儲存變更'}
          </button>
        </div>
      </form>
    </div>
  );
} 