'use client';

import { notFound } from 'next/navigation';
import { getPostBySlug } from '@/lib/api';
import Link from 'next/link';
import { Post } from '@/types/index';
import { useParams } from 'next/navigation';
import { use } from 'react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    async function loadPost() {
      try {
        const postData = await getPostBySlug(slug);
        setPost(postData);
      } catch (error) {
        console.error('Error loading post:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadPost();
  }, [slug]);
  
  // 處理圖片載入錯誤
  const handleImageError = () => {
    setImageError(true);
  };
  
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">載入文章中...</p>
      </div>
    );
  }

  // 如果找不到文章，顯示 404 頁面
  if (!post) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">找不到文章</h1>
        <Link href="/" className="text-blue-600 hover:underline">
          返回首頁
        </Link>
      </div>
    );
  }

  // 格式化日期
  const formattedDate = new Date(post.created_at).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 封面圖片的 URL，若沒有則使用預設圖片
  const coverImage = post.cover_url ?? '/placeholder.svg';

  return (
    <div className="max-w-3xl mx-auto">
      <Link 
        href="/" 
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8 transition-colors duration-300 group"
      >
        <svg
          className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        返回首頁
      </Link>
      
      <article className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        {/* 顯示封面圖片，無論是否存在都顯示（使用預設圖片作為後備） */}
        <div className="mb-8 -mx-8 -mt-8 relative" style={{ height: '400px' }}>
          {imageError ? (
            <img
              src="/placeholder.svg"
              alt={`${post.title} 的封面圖片`}
              className="w-full h-full object-cover rounded-t-2xl"
            />
          ) : (
            <Image
              src={coverImage}
              alt={`${post.title} 的封面圖片`}
              fill={true}
              className="object-cover rounded-t-2xl"
              onError={handleImageError}
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
          )}
        </div>
        
        <header className="mb-8 pb-6 border-b border-gray-100">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex items-center text-gray-600">
            <div className="flex items-center mr-6">
              <svg
                className="w-5 h-5 mr-2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm">{formattedDate}</span>
            </div>
            
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm">文章 ID: {post.id}</span>
            </div>
          </div>
        </header>
        
        <div className="prose prose-lg max-w-none">
          {post.content.split('\n').map((paragraph, index) => (
            paragraph ? (
              <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                {paragraph}
              </p>
            ) : (
              <br key={index} />
            )
          ))}
        </div>
      </article>
    </div>
  );
} 