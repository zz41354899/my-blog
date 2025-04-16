'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiUpload } from 'react-icons/fi';
import Image from 'next/image';
import slugify from 'slugify';
import LoadingSpinner from './LoadingSpinner';
import { updatePost, createPost } from '@/lib/api-client';
import { supabase } from '@/lib/supabaseClient';

interface AdminPostFormProps {
  // 支援舊的API
  post?: {
    id?: string | number;
    title: string;
    slug: string;
    content: string;
    cover_url?: string;
  };
  onSubmit?: (data: { title: string; slug: string; content: string; coverUrl?: string }) => Promise<void>;
  isLoading?: boolean;
  
  // 新API
  initialPost?: {
    id?: string;
    title: string;
    slug: string;
    content: string;
    coverUrl?: string;
  };
  onSuccess?: (post: Record<string, unknown>) => void;
}

const AdminPostForm: React.FC<AdminPostFormProps> = (props) => {
  const { 
    post, 
    initialPost, 
    onSubmit, 
    onSuccess, 
    isLoading: externalLoading 
  } = props;
  
  // 統一post物件，優先使用initialPost，使用useMemo避免每次重新計算
  const postData = useMemo(() => {
    return initialPost || (post ? {
      id: post.id?.toString(),
      title: post.title,
      slug: post.slug,
      content: post.content,
      coverUrl: post.cover_url
    } : undefined);
  }, [initialPost, post]);

  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // 當組件加載時，如果有現有的 post，則填充表單
  useEffect(() => {
    if (postData) {
      setTitle(postData.title);
      setSlug(postData.slug);
      setContent(postData.content);
      setCoverUrl(postData.coverUrl || '');
    }
  }, [postData]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // 自動生成slug
    if (!postData?.slug) {
      setSlug(slugify(newTitle.toLowerCase(), { strict: true }));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlug = e.target.value;
    setSlug(slugify(newSlug.toLowerCase(), { strict: true }));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleCoverUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCoverUrl(e.target.value);
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // 允許空URL
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 基本驗證
    if (!title) {
      setError('標題不能為空');
      return;
    }
    
    if (!slug) {
      setError('Slug不能為空');
      return;
    }
    
    if (!content) {
      setError('內容不能為空');
      return;
    }
    
    if (coverUrl && !validateUrl(coverUrl)) {
      setError('封面URL格式無效');
      return;
    }
    
    const formData = {
      title,
      slug,
      content,
      coverUrl: coverUrl || ''
    };
    
    // 使用傳入的提交函數
    if (onSubmit) {
      try {
        await onSubmit(formData);
      } catch (err) {
        console.error('儲存文章時出錯:', err);
        setError(err instanceof Error ? err.message : '儲存文章時出錯');
      }
      return;
    }
    
    // 使用內部邏輯
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const postData = {
        title,
        slug,
        content,
        coverUrl: coverUrl || null
      };
      
      let response;
      
      if (initialPost?.id) {
        // 更新現有文章
        response = await updatePost(initialPost.id, postData);
        setSuccessMessage('文章已成功更新！');
      } else {
        // 建立新文章
        response = await createPost(postData);
        setSuccessMessage('文章已成功建立！');
      }
      
      if (onSuccess && response) {
        onSuccess(response);
      }
      
      // 如果沒有onSuccess回調，則重新導向到管理頁面
      if (!onSuccess) {
        router.push('/admin/posts');
      }
    } catch (err) {
      console.error('儲存文章時出錯:', err);
      setError(err instanceof Error ? err.message : '儲存文章時出錯');
    } finally {
      setIsLoading(false);
    }
  };

  // 處理圖片上傳
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageUploading(true);
    setError('');
    
    try {
      // 建立唯一的檔案名稱
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // 獲取當前用戶
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('上傳失敗：未登入');
      }
      
      // 上傳文件到已存在的 bucket
      const { error: uploadError } = await supabase
        .storage
        .from('post-cover')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        throw new Error(`上傳失敗：${uploadError.message}`);
      }
      
      // 嘗試獲取簽名 URL（因為 bucket 可能是 private）
      const { data: signedData, error: signedError } = await supabase
        .storage
        .from('post-cover')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 年有效期
        
      if (signedError) {
        throw new Error(`無法獲取 URL：${signedError.message}`);
      }
        
      if (signedData?.signedUrl) {
        setCoverUrl(signedData.signedUrl);
      } else {
        throw new Error('無法獲取有效的檔案 URL');
      }
    } catch (error: unknown) {
      console.error('上傳圖片時出錯:', error);
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      setError(`上傳圖片失敗: ${errorMessage}`);
    } finally {
      setImageUploading(false);
    }
  };

  // 清除圖片
  const handleClearImage = () => {
    setCoverUrl('');
  };

  // 確定加載狀態，優先使用外部傳入的狀態
  const loading = externalLoading !== undefined ? externalLoading : isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      
      <div className="space-y-1">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          標題
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={handleTitleChange}
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="文章標題"
        />
      </div>
      
      <div className="space-y-1">
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
          Slug
        </label>
        <div className="flex rounded-md shadow-sm">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
            /blog/
          </span>
          <input
            type="text"
            id="slug"
            value={slug}
            onChange={handleSlugChange}
            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
            placeholder="url-friendly-slug"
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          URL 名稱將用於文章的永久連結，建議使用英文、數字和連字符
        </p>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="coverUrl" className="block text-sm font-medium text-gray-700">
          封面圖片
        </label>
        
        <div className="flex items-center space-x-3">
          <input
            type="file"
            id="imageUpload"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={imageUploading}
          />
          <button
            type="button"
            onClick={() => document.getElementById('imageUpload')?.click()}
            disabled={imageUploading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {imageUploading ? <LoadingSpinner size="small" className="mr-2" /> : <FiUpload className="mr-2" />}
            上傳圖片
          </button>
          <span className="text-sm text-gray-500">或</span>
        </div>
        
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            id="coverUrl"
            value={coverUrl}
            onChange={handleCoverUrlChange}
            className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="https://example.com/image.jpg"
          />
          <button
            type="button"
            onClick={handleClearImage}
            className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100"
          >
            清除
          </button>
        </div>
        
        {coverUrl && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-1">圖片預覽</p>
            <div className="relative h-48 w-full overflow-hidden rounded-md border border-gray-200">
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {validateUrl(coverUrl) && (
                  <Image
                    src={coverUrl}
                    alt="封面預覽"
                    fill
                    style={{ objectFit: 'cover' }}
                    onError={() => setCoverUrl('/placeholder.svg')}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          內容
        </label>
        <textarea
          id="content"
          rows={15}
          value={content}
          onChange={handleContentChange}
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-3"
          placeholder="使用 Markdown 格式編寫文章內容…"
        />
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? (
            <LoadingSpinner size="small" className="mr-2" />
          ) : (
            <FiCheck className="mr-2" />
          )}
          {postData?.id ? '更新文章' : '建立文章'}
        </button>
      </div>
    </form>
  );
};

export default AdminPostForm; 