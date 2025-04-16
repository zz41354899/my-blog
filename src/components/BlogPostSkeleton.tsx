'use client';

import React from 'react';
import Skeleton from '@/components/ui/Skeleton';

const BlogPostSkeleton = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* 标题骨架 */}
      <div className="mb-8">
        <Skeleton height={60} width="80%" />
      </div>
      
      {/* 发布日期骨架 */}
      <div className="mb-12">
        <Skeleton height={24} width={120} />
      </div>
      
      {/* 文章封面骨架 */}
      <div className="mb-8">
        <Skeleton height={400} className="w-full rounded-lg" />
      </div>
      
      {/* 文章内容骨架 */}
      <div className="space-y-6">
        <Skeleton height={20} count={2} className="w-full" />
        <Skeleton height={20} width="95%" />
        <Skeleton height={20} count={3} className="w-full" />
        <Skeleton height={20} width="90%" />
        <Skeleton height={20} count={2} className="w-full" />
      </div>
    </div>
  );
};

export default BlogPostSkeleton; 