'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<{email: string | null, avatarUrl: string | null}>({
    email: null, 
    avatarUrl: null
  })
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      // 獲取用戶資料，包括頭像
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single()
        
        setUser({
          email: user.email || null,
          avatarUrl: data?.avatar_url || null
        })
      }
    }
    getUser()
  }, [supabase])

  const tabs = [
    { name: '儀表板', href: '/admin' },
    { name: '管理文章', href: '/admin/posts' },
    { name: '新增文章', href: '/admin/posts/new' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/" className="flex-shrink-0 flex items-center pr-6 border-r">
                <span className="text-xl font-bold text-gray-900">個人部落格</span>
              </Link>
              <div className="ml-6 flex items-center space-x-4">
                {tabs.map((tab) => (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === tab.href
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {tab.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt="用戶頭像"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {user.email?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <span className="text-sm text-gray-700">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
} 