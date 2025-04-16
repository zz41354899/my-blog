'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

export default function ManagePostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  // 獲取當前用戶ID和文章
  useEffect(() => {
    async function loadUserAndPosts() {
      try {
        // 獲取當前登入用戶
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        
        setUserId(user.id)
        
        // 僅獲取當前用戶的文章
        const { data: posts, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setPosts(posts || [])
      } catch (error) {
        console.error('載入文章時出錯:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserAndPosts()
  }, [supabase, router])

  // 刪除文章
  const handleDeletePost = async (id: number) => {
    if (!confirm('確定要刪除這篇文章嗎？此操作不可恢復。')) {
      return
    }
    
    setDeleteLoading(id)
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId) // 確保只刪除自己的文章
      
      if (error) throw error
      
      // 從列表中移除被刪除的文章
      setPosts(posts.filter(post => post.id !== id))
    } catch (error) {
      console.error('刪除文章時出錯:', error)
      alert('刪除文章時出錯')
    } finally {
      setDeleteLoading(null)
    }
  }

  // 字數統計函數
  const getWordCount = (content: string) => {
    // 針對中文和英文混合文本的字數統計
    return content.replace(/\s+/g, '').length
  }

  // 截取預覽文本
  const getContentPreview = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">管理文章</h1>
        <Link 
          href="/admin/posts/new" 
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          新增文章
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-3 text-gray-600">載入文章中...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">尚未建立任何文章</h3>
          <p className="text-gray-600 mb-4">建立您的第一篇文章，開始分享您的想法吧！</p>
          <Link 
            href="/admin/posts/new" 
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            建立新文章
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  文章標題
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  發布日期
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  字數
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      {post.cover_url && (
                        <div className="flex-shrink-0 h-16 w-16 mr-4">
                          <img 
                            src={post.cover_url} 
                            alt={post.title} 
                            className="h-16 w-16 rounded object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-image.jpg'
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{post.title}</div>
                        <div className="text-sm text-gray-500 mt-1">{getContentPreview(post.content)}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Slug: {post.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getWordCount(post.content)} 字
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-3">
                    <Link 
                      href={`/admin/posts/edit/${post.id}`}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      編輯
                    </Link>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deleteLoading === post.id}
                      className={`text-red-600 hover:text-red-900 font-medium ${deleteLoading === post.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {deleteLoading === post.id ? '刪除中...' : '刪除'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 