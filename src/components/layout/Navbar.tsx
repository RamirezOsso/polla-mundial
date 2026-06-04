'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/pronosticos', label: 'Pronósticos' },
  { href: '/camino', label: 'Camino al Campeón' },
  { href: '/ranking', label: 'Ranking' },
]

export function Navbar() {
  const { profile } = useAuth()
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-black text-xl">
          <span className="text-2xl">⚽</span>
          <span className="gradient-text hidden sm:block">Polla Mundial</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(item => (
            <Link key={item.href} href={item.href}
              className={cn('px-3 py-2 rounded-lg text-sm transition-all',
                pathname === item.href
                  ? 'text-white bg-gray-800 dark:bg-gray-800'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              )}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {profile?.is_admin && (
            <Link href="/admin" className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-1 rounded-lg font-medium">
              Admin
            </Link>
          )}
          <Link href="/perfil">
            <Avatar src={profile?.avatar_url} name={profile?.display_name || profile?.username} size="sm" />
          </Link>
        </div>
      </div>
    </nav>
  )
}
