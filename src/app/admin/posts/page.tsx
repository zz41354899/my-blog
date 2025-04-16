'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { deletePost } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';

type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_url: string;
  created_at: string;
  user_id: string;
};

// Icons
const AddIcon = () => (
  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
  </svg>
);

const ViewIcon = () => (
  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
  </svg>
);

const EditIcon = () => (
  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
  </svg>
);

const LockIcon = () => (
  <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
  </svg>
);

const EmptyIcon = () => (
  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
  </svg>
);

// Main Page Component
export default function PostsManagementPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // 獲取當前用戶
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          return;
        }
        
        setUserId(user.id);
        
        // 獲取用戶的文章
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        setPosts(data || []);
      } catch (error) {
        console.error('獲取文章時出錯:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : '未知錯誤');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // 訂閱身份驗證狀態更改
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // 身份驗證狀態改變時重新獲取數據
      fetchData();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);
  
  // 處理刪除文章
  const handleDeletePost = async (id: string) => {
    if (!userId || !confirm('確定要刪除這篇文章嗎？此操作無法恢復。')) {
      return;
    }
    
    setDeleteLoading(id);
    
    try {
      const success = await deletePost(Number(id), userId);
      
      if (success) {
        setPosts(posts.filter(post => post.id !== id));
        alert('文章已刪除！');
      } else {
        throw new Error('刪除操作未成功完成');
      }
    } catch (error) {
      console.error('刪除文章時出錯:', error);
      alert('刪除文章時出錯');
    } finally {
      setDeleteLoading(null);
    }
  };

  // 過濾和排序文章
  const filteredPosts = posts?.filter(post => 
    post.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const sortedPosts = [...filteredPosts].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // 獲取文章摘要
  const getExcerpt = (content: string, length = 100) => {
    if (!content) return '';
    if (content.length <= length) return content;
    return content.substring(0, length) + '...';
  };

  // 渲染加載狀態
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // 如果沒有用戶則顯示未登入訊息
  if (!userId) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-8">
          <LockIcon />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">需要登入</h2>
          <p className="text-gray-600 mb-4">
            您需要先登入才能管理文章
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            前往登入
          </button>
        </div>
      </div>
    );
  }

  // 主頁面內容
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* 錯誤訊息 */}
      {hasError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {errorMessage || '獲取文章時發生錯誤'}
              </p>
              <p className="text-sm text-red-700 mt-1">
                您仍然可以嘗試創建新文章
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">文章管理</h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋文章..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
              <div className="absolute left-3 top-2.5">
                <SearchIcon />
              </div>
            </div>
            <Link
              href="/admin/posts/new"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <AddIcon />
              新增文章
            </Link>
          </div>
        </div>
        
        <p className="text-gray-600">
          在這裡管理您的部落格文章，總共 {posts?.length || 0} 篇文章。
          {hasError && ' (可能不完整)'}
        </p>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          {searchTerm ? (
            <>
              <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center">
                <SearchIcon />
              </div>
              <p className="text-gray-600">沒有找到符合「{searchTerm}」的文章</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                清除搜尋
              </button>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center">
                <EmptyIcon />
              </div>
              <p className="text-gray-600">
                {hasError 
                  ? '無法載入文章資料，請檢查數據庫連接' 
                  : '尚無文章，建立您的第一篇文章吧！'
                }
              </p>
              <Link
                href="/admin/posts/new"
                className="inline-flex items-center px-4 py-2 mt-4 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <AddIcon />
                建立文章
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-hidden border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  文章標題
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  發布日期
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Slug
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {post.cover_url && (
                        <div className="flex-shrink-0 mr-3">
                          <Image
                            src={post.cover_url}
                            alt=""
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded object-cover"
                            onError={(e) => {
                              // Type assertion needed for TypeScript
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/150?text=圖片';
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{post.title}</div>
                        <div className="text-sm text-gray-500 md:hidden">
                          {new Date(post.created_at).toLocaleDateString('zh-TW')}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                          {getExcerpt(post.content, 60)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                    <div>
                      {new Date(post.created_at).toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(post.created_at).toLocaleTimeString('zh-TW', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                      {post.slug}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-2">
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="inline-flex items-center px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs transition-colors"
                    >
                      <ViewIcon />
                      查看
                    </Link>
                    <Link
                      href={`/admin/posts/edit/${post.id}`}
                      className="inline-flex items-center px-2.5 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded text-xs transition-colors"
                    >
                      <EditIcon />
                      編輯
                    </Link>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deleteLoading === post.id}
                      className={`inline-flex items-center px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs transition-colors ${
                        deleteLoading === post.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {deleteLoading === post.id ? (
                        <svg className="animate-spin w-3.5 h-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <DeleteIcon />
                      )}
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
  );
} 