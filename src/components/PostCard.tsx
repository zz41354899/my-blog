'use client';

import Link from 'next/link';
import { Post } from '@/types/index';
import Image from 'next/image';
import { useState } from 'react';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const formattedDate = new Date(post.created_at).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  // 生成摘要 (最多 150 個字符)
  const excerpt = post.content.length > 150 
    ? `${post.content.substring(0, 150)}...` 
    : post.content;

  // 設置封面圖片URL，如果沒有則使用預設圖片
  const coverImage = post.cover_url ?? '/placeholder.svg';
  
  // 圖片載入錯誤處理
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
      {/* 文章封面圖 */}
      <div className="h-40 relative">
        {imageError ? (
          <Image
            src="/placeholder.svg"
            alt={`${post.title} 的封面圖片`}
            className="object-cover w-full h-full"
            width={400}
            height={160}
          />
        ) : (
          <Image
            src={coverImage}
            alt={`${post.title} 的封面圖片`}
            fill={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            onError={handleImageError}
          />
        )}
      </div>
      
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>
          <div className="text-gray-500 text-sm">{formattedDate}</div>
        </div>
        <h2 className="text-xl font-bold mb-3 text-gray-800 hover:text-blue-600 transition-colors duration-300">
          <Link href={`/blog/${post.slug}`} prefetch={true} className="block">
            {post.title}
          </Link>
        </h2>
        <p className="text-gray-600 mb-4 leading-relaxed text-sm">{excerpt}</p>
        <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-center">
          <Link 
            href={`/blog/${post.slug}`}
            prefetch={true}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center transition-colors duration-300"
          >
            閱讀更多
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
          <span className="text-xs text-gray-400 italic">#{post.id}</span>
        </div>
      </div>
    </article>
  );
} 