'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    createClient().from('profiles').select('*').order('total_points', { ascending: false })
      .then(({ data }) => setUsers(data ?? []))
  }, [])

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    setLoading(userId)
    await createClient().from('profiles').update({ is_admin: !isAdmin }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !isAdmin } : u))
    setLoading(null)
  }

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-black text-white">👥 Usuarios</h1>
      <Input placeholder="Buscar usuario..." value={search} onChange={e => setSearch(e.target.value)} />
      <p className="text-sm text-gray-500">{filtered.length} usuarios</p>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="divide-y divide-gray-800">
          {filtered.map(user => (
            <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/30">
              <Avatar src={user.avatar_url} name={user.display_name || user.username} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white text-sm truncate">{user.display_name || user.username}</p>
                  {user.is_admin && <Badge variant="purple">Admin</Badge>}
                </div>
                <p className="text-xs text-gray-500">@{user.username} · {user.total_points} pts · {user.total_predictions} predicciones</p>
              </div>
              <button onClick={() => toggleAdmin(user.id, user.is_admin)}
                disabled={loading === user.id}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${user.is_admin ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'}`}>
                {user.is_admin ? 'Quitar admin' : 'Hacer admin'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
