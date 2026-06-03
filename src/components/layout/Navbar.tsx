'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/matches', label: 'Partidos' },
  { href: '/bracket', label: '🏆 Bracket' },
  { href: '/predictions', label: 'Predicciones' },
  { href: '/ranking', label: 'Ranking' },
]

export function Navbar() {
  const { user, profile } = useAuth()
  const { unreadCount } = useNotifications(user?.id)
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-black text-xl">
          <span className="text-2xl">⚽</span>
          <span className="gradient-text hidden sm:block">Polla Mundial</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(item => (
            <Link key={item.href} href={item.href}
              className={cn('px-3 py-2 rounded-lg text-sm transition-all',
                pathname === item.href ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="relative p-2 text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          {profile?.is_admin && (
            <Link href="/admin" className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-1 rounded-lg font-medium">
              Admin
            </Link>
          )}
          <Link href="/profile">
            <Avatar src={profile?.avatar_url} name={profile?.display_name || profile?.username} size="sm" />
          </Link>
        </div>
      </div>
    </nav>
  )
}
