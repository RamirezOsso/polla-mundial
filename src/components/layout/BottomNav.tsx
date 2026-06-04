'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const items = [
  { href: '/dashboard', icon: '🏠', label: 'Inicio' },
  { href: '/pronosticos', icon: '⚽', label: 'Pronósticos' },
  { href: '/camino', icon: '🏆', label: 'Campeón' },
  { href: '/ranking', icon: '📊', label: 'Ranking' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-gray-800 bg-gray-950/95 backdrop-blur-sm">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(item => (
          <Link key={item.href} href={item.href}
            className={cn('flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all',
              pathname === item.href ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'
            )}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
