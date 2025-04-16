'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useParams } from 'next/navigation'
import PostImage from '@/components/ui/PostImage'

interface Post {
  id: number
  title: string
  slug: string
  content: string
  cover_url?: string
  created_at: string
  updated_at?: string
  user_id: string
}

export default function EditPostPage() {
  const params = useParams() as { id: string };
  const [post, setPost] = useState<Post | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  
  const postId = parseInt(params.id as string)
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  // 載入文章數據
  useEffect(() => {
    const loadPost = async () => {
      setIsLoading(true)
      
      try {
        // 獲取當前登入用戶
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        
        setUserId(user.id)
        
        // 獲取文章數據
        const { data: post, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', postId)
          .single()
          
        if (error) throw error
        
        // 確保用戶只能編輯自己的文章
        if (post.user_id !== user.id) {
          alert('您沒有權限編輯此文章')
          router.push('/admin/posts')
          return
        }
        
        // 設置表單數據
        setPost(post)
        setTitle(post.title)
        setSlug(post.slug)
        setContent(post.content)
        setCoverUrl(post.cover_url || '')
      } catch (error) {
        console.error('載入文章時出錯:', error)
        alert('載入文章時出錯')
        router.push('/admin/posts')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (postId) {
      loadPost()
    }
  }, [postId, supabase, router])
  
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
      // 更新文章
      const { data, error } = await supabase
        .from('posts')
        .update({
          title,
          slug,
          content,
          cover_url: coverUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', userId) // 確保只能更新自己的文章
        .select()
        .single()
        
      if (error) throw error
      
      // 重定向到文章管理頁面
      router.push('/admin/posts')
      router.refresh()
    } catch (error: any) {
      console.error('更新文章時出錯:', error)
      
      // 處理唯一性約束錯誤
      if (error.code === '23505') {
        setErrors({
          slug: '此Slug已被使用，請嘗試其他值'
        })
      } else {
        alert(`更新文章時出錯: ${error.message || '未知錯誤'}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-3 text-gray-600">載入文章中...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">編輯文章</h1>
        <p className="text-gray-600">更新您的部落格文章</p>
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
            onChange={(e) => setTitle(e.target.value)}
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
              <PostImage 
                src={coverUrl} 
                alt="封面預覽" 
                className="h-40 rounded border object-cover"
                fallbackSrc="/placeholder-image.jpg"
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
        <div className="flex justify-between items-center space-x-3 pt-4 border-t">
          <div className="text-sm text-gray-500">
            創建於: {post?.created_at && new Date(post.created_at).toLocaleDateString('zh-TW')}
          </div>
          <div className="flex space-x-3">
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
              className={`px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? '保存中...' : '保存變更'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
} 