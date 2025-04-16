'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Post } from '@/types/index';
import AdminPostForm from '@/components/AdminPostForm';
import { updatePost } from '@/lib/api';
import { Alert, AlertCircle, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

// 獲取文章數據
async function getPostData(id: string) {
  try {
    // 獲取當前會話用戶
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error(sessionError.message);
    }
    
    if (!session) {
      throw new Error('找不到有效的登入會話');
    }
    
    const userId = session.user.id;
    
    // 獲取文章數據
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (postError) {
      console.error('Database error:', postError);
      throw new Error('無法找到文章');
    }
    
    // 檢查是否為文章作者
    if (post.user_id !== userId) {
      throw new Error('無權編輯他人的文章');
    }
    
    return { post };
  } catch (error: unknown) {
    console.error('Error in getPostData:', error);
    throw error;
  }
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

export default function EditPostPage() {
  // 使用 useParams 獲取參數，並安全地提取 id
  const params = useParams() as { id: string };
  const postId = params.id as string;
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) {
        setError('缺少文章 ID');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { post } = await getPostData(postId);
        setPost(post);
        setError(null);
      } catch (err: unknown) {
        console.error('載入文章失敗:', err);
        const errorMessage = err instanceof Error ? err.message : '載入文章失敗';
        setError(errorMessage);
        
        // 如果沒有權限或沒有會話，重定向到文章列表
        if (errorMessage === '無權編輯他人的文章' || errorMessage === '找不到有效的登入會話') {
          router.push('/admin/posts');
        }
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId, router]);

  // 處理更新文章
  const handleUpdatePost = async (data: { title: string; slug: string; content: string; coverUrl?: string }) => {
    if (!post || !postId) return;
    
    setIsSubmitting(true);
    try {
      // 獲取當前會話用戶
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('找不到有效的登入會話');
      }
      
      const userId = session.user.id;
      
      // 確保 slug 是 URL 安全的
      const safeSlug = slugify(data.slug);
      
      // 更新文章
      await updatePost(parseInt(postId), userId, {
        title: data.title,
        slug: safeSlug,
        content: data.content,
        cover_url: data.coverUrl || '' // 確保使用空字串而非 undefined
      });
      
      // 更新成功後導航到文章列表
      router.push('/admin/posts');
    } catch (err) {
      console.error('更新文章失敗:', err);
      setError('更新文章時發生錯誤');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>錯誤</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>找不到文章</AlertTitle>
          <AlertDescription>找不到請求的文章。</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">編輯文章</h1>
      <AdminPostForm 
        post={post} 
        onSubmit={handleUpdatePost}
        isLoading={isSubmitting}
      />
    </div>
  );
} 
 