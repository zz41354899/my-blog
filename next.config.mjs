/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'images.unsplash.com', 
      'plus.unsplash.com',
      'rshkvxujfnpxnlvtrwec.supabase.co', // 添加Supabase儲存桶域名
      'sjcyfubamkvfbxiwberp.supabase.co', // 確保兩個 Supabase 域名都被包含
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sjcyfubamkvfbxiwberp.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rshkvxujfnpxnlvtrwec.supabase.co',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // 配置 Supabase Auth 相關的 headers
  async headers() {
    return [
      {
        // 適用於所有頁面
        source: '/:path*',
        headers: [
          // 必要的安全標頭
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // 內容安全策略 (CSP)
          {
            key: 'Content-Security-Policy',
            value: `frame-ancestors 'none';`,
          },
          // 添加Cache-Control標頭以提高頁面緩存效率
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
      // 為靜態資源設置較長的緩存時間
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // 為每種圖片格式單獨設置緩存 (避免使用不支援的 regex 分組語法)
      {
        source: '/:path*.jpg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.jpeg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.gif',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.webp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // 提高JS/CSS打包效率
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 優化實驗性功能
  experimental: {
    scrollRestoration: true,
  },
};

export default nextConfig; 