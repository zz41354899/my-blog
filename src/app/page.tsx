import { Suspense } from 'react';
import { getAllPosts } from '@/lib/api';
import PostCard from '@/components/PostCard';
import LoadingSpinner from '@/components/LoadingSpinner';

// 獲取文章的服務器組件
async function PostsList() {
  const posts = await getAllPosts();
  
  if (posts.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-100">
        <svg
          className="w-16 h-16 mx-auto text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h2 className="text-xl font-semibold text-gray-600">目前還沒有文章</h2>
        <p className="mt-2 text-gray-500 max-w-md mx-auto">
          請前往管理頁面添加您的第一篇文章，或稍後回來查看新內容
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="space-y-12 py-4">
      <div className="text-center py-16 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800 tracking-tight">
          歡迎來到我的部落格
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          這是一個使用 Next.js 14、Tailwind CSS 和 Supabase 構建的部落格，來探索我的文章吧！
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-8 text-gray-800 border-b pb-2 flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
          最新文章
        </h2>
        <Suspense fallback={
          <div className="p-12 bg-white rounded-lg shadow-sm border border-gray-100">
            <LoadingSpinner />
          </div>
        }>
          <PostsList />
        </Suspense>
        </div>
    </div>
  );
}
