"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import LoadingSpinner from "@/components/LoadingSpinner";
import { updatePost } from "@/lib/api";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams() as { id: string };
  const postId = typeof params.id === 'string' ? parseInt(params.id) : null;
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 檢查用戶是否登入並獲取文章資料
  useEffect(() => {
    async function loadPostAndCheckUser() {
      setIsLoading(true);
      
      try {
        // 獲取當前會話
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('沒有有效的會話，重定向到登入頁面');
          router.push('/login?redirect=/admin/posts');
          return;
        }
        
        setUserId(session.user.id);
        
        // 獲取文章
        if (postId) {
          const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', postId)
            .single();
            
          if (error) {
            console.error('獲取文章時出錯:', error);
            setError('無法獲取文章資料');
            setIsLoading(false);
            return;
          }
          
          if (!data) {
            setError('找不到文章');
            setIsLoading(false);
            return;
          }
          
          // 檢查是否是當前用戶的文章
          if (data.user_id !== session.user.id) {
            setError('您沒有權限編輯此文章');
            setIsLoading(false);
            return;
          }
          
          setTitle(data.title);
          setSlug(data.slug);
          setContent(data.content);
          setCoverUrl(data.cover_url || '');
        } else {
          setError('無效的文章 ID');
        }
      } catch (error) {
        console.error('載入文章時出錯:', error);
        setError('載入文章時發生錯誤');
      }
      
      setIsLoading(false);
    }
    
    loadPostAndCheckUser();
  }, [postId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('標題不能為空');
      return;
    }
    
    if (!slug.trim()) {
      setError('網址不能為空');
      return;
    }
    
    if (!content.trim()) {
      setError('內容不能為空');
      return;
    }
    
    if (!userId || !postId) {
      setError('用戶ID或文章ID無效');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const updatedPost = await updatePost(
        postId, 
        userId, 
        {
          title,
          slug,
          content,
          cover_url: coverUrl || undefined
        }
      );
      
      if (updatedPost) {
        setSuccess('文章更新成功！');
        setTimeout(() => {
          router.push('/admin/posts');
        }, 2000);
      } else {
        setError('更新文章時出錯');
      }
    } catch (error) {
      console.error('更新文章時出錯:', error);
      
      if (error instanceof Error) {
        // 檢查是否是唯一性約束錯誤
        if (error.message.includes('unique constraint') && error.message.includes('slug')) {
          setError('此網址已被使用，請嘗試其他網址');
        } else {
          setError(`更新文章時出錯: ${error.message}`);
        }
      } else {
        setError('更新文章時發生未知錯誤');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !error.includes('網址已被使用')) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">錯誤：</strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button 
          onClick={() => router.push('/admin/posts')}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          返回文章列表
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">編輯文章</h1>
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">成功：</strong>
          <span className="block sm:inline">{success}</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">錯誤：</strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">標題</label>
          <input
            type="text"
            id="title"
            name="title"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">網址名稱</label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
              /blog/
            </span>
            <input
              type="text"
              id="slug"
              name="slug"
              className="flex-1 block w-full border border-gray-300 rounded-none rounded-r-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              pattern="[a-z0-9-]+"
              title="僅允許小寫字母、數字和連字符"
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            僅允許小寫字母、數字和連字符，例如: &quot;my-post-title&quot;
          </p>
        </div>
        
        <div>
          <label htmlFor="coverUrl" className="block text-sm font-medium text-gray-700">封面圖片網址 (選填)</label>
          <input
            type="url"
            id="coverUrl"
            name="coverUrl"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={coverUrl || ''}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          <p className="mt-1 text-xs text-gray-500">
            請使用有效的圖片網址，建議使用 16:9 的圖片比例效果最佳
          </p>
        </div>
        
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">內容</label>
          <textarea
            id="content"
            name="content"
            rows={15}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/admin/posts')}
            className="bg-gray-200 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? '儲存中...' : '儲存更改'}
          </button>
        </div>
      </form>
    </div>
  );
} 