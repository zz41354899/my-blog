'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PostImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
}

export default function PostImage({
  src,
  alt,
  fallbackSrc = '/placeholder.svg',
  className = '',
  style = {},
  width = 800,
  height = 450
}: PostImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      width={width}
      height={height}
    />
  );
} 