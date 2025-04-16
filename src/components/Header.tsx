'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, signOut, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  
  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      router.push('/');
    }
  };
  
  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-gray-600 transition-colors duration-300">
          我的部落格
        </Link>
        
        {/* 桌面導航 */}
        <nav className="hidden md:block">
          <ul className="flex items-center space-x-6">
            <li>
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-800 transition-colors duration-300 font-medium"
              >
                首頁
              </Link>
            </li>
            
            {user ? (
              <>
                <li>
                  <Link 
                    href="/admin" 
                    className="text-gray-600 hover:text-gray-800 transition-colors duration-300 font-medium"
                  >
                    管理
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={handleSignOut}
                    className="px-4 py-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors duration-300 font-medium text-sm"
                  >
                    登出
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link 
                  href="/login" 
                  className="px-4 py-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-300 font-medium text-sm"
                >
                  登入
                </Link>
              </li>
            )}
          </ul>
        </nav>
        
        {/* 移動版漢堡選單按鈕 */}
        <button 
          className="md:hidden flex items-center"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? '關閉選單' : '開啟選單'}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {isMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 12h16M4 6h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      
      {/* 移動版下拉選單 */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <ul className="container mx-auto px-4 py-2 flex flex-col">
            <li className="py-2">
              <Link 
                href="/" 
                className="block text-gray-600 hover:text-gray-800 transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                首頁
              </Link>
            </li>
            
            {user ? (
              <>
                <li className="py-2">
                  <Link 
                    href="/admin" 
                    className="block text-gray-600 hover:text-gray-800 transition-colors duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    管理
                  </Link>
                </li>
                <li className="py-2">
                  <button 
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="text-red-600 hover:text-red-800 transition-colors duration-300"
                  >
                    登出
                  </button>
                </li>
              </>
            ) : (
              <li className="py-2">
                <Link 
                  href="/login" 
                  className="block text-blue-600 hover:text-blue-800 transition-colors duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  登入
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
} 