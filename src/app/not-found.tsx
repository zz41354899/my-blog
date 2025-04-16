import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="text-center py-16">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">404 - 頁面不存在</h2>
      <p className="text-gray-600 mb-8">
        抱歉，您要尋找的頁面不存在或已被移除。
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        返回首頁
      </Link>
    </div>
  );
} 