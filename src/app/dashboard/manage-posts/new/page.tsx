'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function NewPostPage() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  // 確保用戶已登入
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
    }
    
    checkUser()
  }, [supabase, router])
  
  // 從標題生成slug
  const generateSlug = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')           // 將空格替換為 -
      .replace(/[^\w\u4e00-\u9fa5-]/g, '') // 保留中文字符、英文和數字
      .replace(/--+/g, '-')           // 替換多個 - 為單個 -
      .replace(/^-+/, '')             // 刪除開頭的 -
      .replace(/-+$/, '')             // 刪除結尾的 -
  }

  // 處理標題變更並自動生成slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle))
    }
  }
  
  // 驗證表單
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!title.trim()) {
      newErrors.title = '請輸入文章標題'
    }
    
    if (!slug.trim()) {
      newErrors.slug = '請輸入文章的URL slug'
    } else if (!/^[a-z0-9\u4e00-\u9fa5-]+$/.test(slug)) {
      newErrors.slug = 'Slug只能包含小寫字母、數字、中文字符和連字符'
    }
    
    if (!content.trim()) {
      newErrors.content = '請輸入文章內容'
    }
    
    if (coverUrl && !isValidUrl(coverUrl)) {
      newErrors.coverUrl = '請輸入有效的URL'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // 檢查URL是否有效
  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }
  
  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // 建立新文章
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            title,
            slug,
            content,
            cover_url: coverUrl || null,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single()
        
      if (error) throw error
      
      // 重定向到文章管理頁面
      router.push('/admin/posts')
      router.refresh()
    } catch (error: any) {
      console.error('發布文章時出錯:', error)
      
      // 處理唯一性約束錯誤
      if (error.code === '23505') {
        setErrors({
          slug: '此Slug已被使用，請嘗試其他值'
        })
      } else {
        alert(`發布文章時出錯: ${error.message || '未知錯誤'}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">建立新文章</h1>
        <p className="text-gray-600">填寫以下資料來建立一篇新的部落格文章</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 標題欄位 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            文章標題 <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={handleTitleChange}
            className={`w-full rounded-md border ${errors.title ? 'border-red-500' : 'border-gray-300'} px-4 py-2 focus:border-blue-500 focus:ring-blue-500`}
            placeholder="輸入文章標題"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>
        
        {/* Slug欄位 */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            文章Slug <span className="text-red-600">*</span>
            <span className="text-gray-500 text-xs ml-2">(用於URL)</span>
          </label>
          <input
            type="text"
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className={`w-full rounded-md border ${errors.slug ? 'border-red-500' : 'border-gray-300'} px-4 py-2 focus:border-blue-500 focus:ring-blue-500`}
            placeholder="your-post-url"
          />
          {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
          <p className="mt-1 text-xs text-gray-500">這將成為您文章的URL: /blog/{slug}</p>
        </div>
        
        {/* 封面圖片URL欄位 */}
        <div>
          <label htmlFor="coverUrl" className="block text-sm font-medium text-gray-700 mb-1">
            封面圖片URL <span className="text-gray-500 text-xs ml-2">(選填)</span>
          </label>
          <input
            type="text"
            id="coverUrl"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            className={`w-full rounded-md border ${errors.coverUrl ? 'border-red-500' : 'border-gray-300'} px-4 py-2 focus:border-blue-500 focus:ring-blue-500`}
            placeholder="https://example.com/image.jpg"
          />
          {errors.coverUrl && <p className="mt-1 text-sm text-red-600">{errors.coverUrl}</p>}
          {coverUrl && isValidUrl(coverUrl) && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">預覽:</p>
              <img 
                src={coverUrl} 
                alt="Cover preview" 
                className="h-40 rounded border object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                }}
              />
            </div>
          )}
        </div>
        
        {/* 內容欄位 */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            文章內容 <span className="text-red-600">*</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className={`w-full rounded-md border ${errors.content ? 'border-red-500' : 'border-gray-300'} px-4 py-2 focus:border-blue-500 focus:ring-blue-500`}
            placeholder="撰寫您的文章內容（支援中文字符）"
          />
          {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
          <p className="mt-1 text-xs text-gray-500">字數: {content.replace(/\s+/g, '').length}</p>
        </div>
        
        {/* 提交與取消按鈕 */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.push('/admin/posts')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? '發布中...' : '發布文章'}
          </button>
        </div>
      </form>
    </div>
  )
} 