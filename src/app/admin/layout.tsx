import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const links = [
    { href: '/admin', icon: '📊', label: 'Dashboard' },
    { href: '/admin/results', icon: '📋', label: 'Resultados' },
    { href: '/admin/matches', icon: '⚽', label: 'Partidos' },
    { href: '/admin/users', icon: '👥', label: 'Usuarios' },
    { href: '/admin/config', icon: '🔧', label: 'Configuración' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <aside className="fixed left-0 top-0 bottom-0 w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 hidden md:flex flex-col">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">← App</Link>
            <p className="text-lg font-black gradient-text mt-1">⚙️ Admin</p>
          </div>
          <ThemeToggle />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-sm">
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-gray-500">← App</Link>
          <span className="font-black gradient-text">⚙️ Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-around h-14">
          {links.map(item => (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-0.5 px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <main className="md:ml-56 flex-1 p-4 md:p-6 pt-16 md:pt-6 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  )
}
