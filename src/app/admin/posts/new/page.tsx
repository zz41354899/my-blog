'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { createPost } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import AdminPostForm from '@/components/AdminPostForm';
import Link from 'next/link';

// 定義 Post 類型
interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  cover_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}


// Slug 清洗函數，確保 URL 安全
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 移除非字母數字字符
    .replace(/\s+/g, '-')      // 將空格替換為連字符
    .replace(/-+/g, '-')       // 移除連續連字符
    .replace(/^-+/, '')        // 刪除開頭的連字符
    .replace(/-+$/, '');       // 刪除結尾的連字符
}
export default function NewPostPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // 獲取會話
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('無法獲取登入狀態，請重新登入');
          router.push('/login');
          return;
        }
        
        // 如果沒有會話則重定向到登入頁面
        if (!session) {
          console.log('New post page: No session found, redirecting to login');
          router.push('/login');
          return;
        }
        
        console.log('New post page: Session found, user can create posts');
        setUserId(session.user.id);
      } catch (error) {
        console.error('獲取會話失敗', error);
        setError('獲取會話失敗，請重新登入');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
    
    // 監聽認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('New post page: Auth state change:', event);
      
      if (event === 'SIGNED_OUT') {
        // 用戶登出，重定向到登入頁面
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSubmit = async (data: { title: string; slug: string; content: string; coverUrl?: string }) => {
    if (!userId) {
      setError('請先登入');
      return;
    }

    // 防止重複提交
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('準備創建文章:', { title: data.title, slug: slugify(data.slug), user_id: userId });
      
      const postData = {
        title: data.title,
        slug: slugify(data.slug),
        content: data.content,
        cover_url: typeof data.coverUrl === 'string' ? data.coverUrl : undefined,
        user_id: userId,
      };

      const result = await createPost(postData);
      
      console.log('文章創建成功:', result);
      setSuccess('文章建立成功！正在跳轉到文章列表...');
      // 延遲重定向以顯示成功消息
      setTimeout(() => {
        router.push('/admin/posts');
      }, 1500);
    } catch (error: any) {
      console.error('創建文章時出錯:', error);
      
      if (error.message) {
        setError(error.message);
      } else {
        setError('創建文章時出現未知錯誤，請重試');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center p-12 space-y-4">
        <LoadingSpinner size="large" />
        <p className="text-gray-600">正在載入，請稍候...</p>
      </div>
    );
  }

  // 如果沒有用戶則不渲染內容
  if (!userId) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">您需要登入才能創建文章</p>
          <Link 
            href="/login" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            前往登入
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">創建新文章</h1>
        <p className="text-gray-600">
          填寫下方表單以創建新文章
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
          <svg 
            className="w-5 h-5 mr-2 text-red-500 flex-shrink-0" 
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
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center">
          <svg 
            className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" 
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
          <span>{success}</span>
        </div>
      )}

      <AdminPostForm 
        onSubmit={handleSubmit} 
        isLoading={isSubmitting} 
      />

      <div className="mt-6">
        <button
          onClick={() => router.push('/admin/posts')}
          disabled={isSubmitting}
          className={`px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          返回文章列表
        </button>
      </div>
    </div>
  );
} 