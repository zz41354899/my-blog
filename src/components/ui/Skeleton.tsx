'use client';

import React from 'react';
import LoadingSkeleton, { SkeletonProps as LoadingSkeletonProps } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export interface SkeletonProps extends LoadingSkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <LoadingSkeleton
      className={className}
      baseColor="#e2e8f0"
      highlightColor="#f8fafc"
      {...props}
    />
  );
};

export default Skeleton; 