'use client';

import { useState, useEffect, useCallback } from 'react';
import { Post } from '@/types/index';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabaseClient';

interface AdminPostFormProps {
  post?: Post;
  onSubmit: (data: { title: string; slug: string; content: string; coverUrl?: string }) => Promise<void>;
  isLoading: boolean;
}

export default function AdminPostForm({ post, onSubmit, isLoading }: AdminPostFormProps) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [isTouched, setIsTouched] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // 當組件加載時，如果有現有的 post，則填充表單
  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSlug(post.slug);
      setContent(post.content);
      setCoverUrl(post.cover_url || '');
    }
  }, [post]);

  // 將標題轉換為 slug 的函數
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // 移除非字母數字字符
      .replace(/\s+/g, '-') // 將空格替換為連字符
      .replace(/-+/g, '-'); // 移除連續連字符
  };

  // 重新生成 slug 的按鈕處理函數
  const regenerateSlug = () => {
    if (title) {
      const newSlug = generateSlug(title);
      setSlug(newSlug);
    }
  };

  // 處理標題更改並自動更新 slug（僅當 slug 尚未手動修改時）
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setIsTouched(true);

    // 如果 slug 尚未被手動修改或為空，則自動更新
    if (!slug || slug === generateSlug(title)) {
      const newSlug = generateSlug(newTitle);
      setSlug(newSlug);
    }
  };

  // 處理圖片上傳
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageUploading(true);
    setFormError('');
    
    try {
      // 創建唯一的文件名
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
    } catch (error: any) {
      console.error('上傳圖片時出錯:', error);
      setFormError(`上傳圖片失敗: ${error.message}`);
    } finally {
      setImageUploading(false);
    }
  };

  // 清除圖片
  const handleClearImage = () => {
    setCoverUrl('');
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // 基本驗證
    if (!title.trim()) {
      setFormError('請輸入標題');
      return;
    }

    if (!slug.trim()) {
      setFormError('請輸入 URL 名稱');
      return;
    }

    if (!content.trim()) {
      setFormError('請輸入內容');
      return;
    }

    // 驗證 URL 格式（如果提供）
    if (coverUrl && !isValidUrl(coverUrl)) {
      setFormError('請輸入有效的圖片 URL');
      return;
    }

    try {
      await onSubmit({
        title,
        slug,
        content,
        coverUrl: coverUrl || '' // 使用空字串而非 undefined
      });
    } catch (error) {
      console.error('提交表單時出錯:', error);
      setFormError('提交表單時發生錯誤');
    }
  };

  // 驗證 URL 格式
  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {formError}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          標題
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={handleTitleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="輸入文章標題"
          required
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
          URL 名稱
        </label>
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
            /blog/
          </span>
          <input
            type="text"
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="url-friendly-name"
            required
          />
          <button
            type="button"
            onClick={regenerateSlug}
            className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 text-sm hover:bg-gray-100"
          >
            重新產生
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          此為文章的網址，建議使用英文、數字和連字符（-）
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          封面圖片
        </label>
        
        {/* 圖片預覽區域 */}
        {coverUrl && (
          <div className="mb-4 relative">
            <img 
              src={coverUrl} 
              alt="封面圖片預覽" 
              className="w-full max-h-64 object-cover rounded-md"
              onError={(e) => e.currentTarget.src = '/placeholder.svg'}
            />
            <button
              type="button"
              onClick={handleClearImage}
              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
              title="刪除圖片"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        
        {/* 圖片上傳區域 */}
        <div className="mt-2">
          <div className="flex items-center space-x-2">
            <label className="flex flex-col items-center px-4 py-2 bg-white text-blue-600 rounded-md border border-blue-600 cursor-pointer hover:bg-blue-50 transition-colors">
              <span className="text-sm font-medium">
                {imageUploading ? '上傳中...' : '選擇圖片'}
              </span>
              <input 
                type="file" 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
                disabled={imageUploading}
              />
            </label>
            <span className="text-xs text-gray-500">或</span>
            <input
              type="text"
              id="coverUrl"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="輸入圖片 URL"
              disabled={imageUploading}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            建議使用 16:9 比例的圖片，最大 10MB。支援 JPG、PNG、WebP 格式。
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          內容
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={15}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="輸入文章內容..."
          required
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading || imageUploading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            (isLoading || imageUploading) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center">
              <LoadingSpinner size="small" />
              <span className="ml-2">處理中...</span>
            </div>
          ) : post ? '更新文章' : '發佈文章'}
        </button>
      </div>
    </form>
  );
} 