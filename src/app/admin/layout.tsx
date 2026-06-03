import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const links = [
    { href: '/admin', icon: '📊', label: 'Dashboard' },
    { href: '/admin/matches', icon: '⚽', label: 'Partidos' },
    { href: '/admin/results', icon: '📋', label: 'Resultados' },
    { href: '/admin/users', icon: '👥', label: 'Usuarios' },
    { href: '/admin/config', icon: '🔧', label: 'Configuración' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <aside className="fixed left-0 top-0 bottom-0 w-56 bg-gray-900 border-r border-gray-800 z-40 hidden md:flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">← App</Link>
          <p className="text-lg font-black gradient-text mt-1">⚙️ Admin</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all text-sm">
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="md:ml-56 flex-1 p-6">{children}</main>
    </div>
  )
}
