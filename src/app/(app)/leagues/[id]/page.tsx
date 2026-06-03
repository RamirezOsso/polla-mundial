'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { getRankBadge } from '@/lib/utils'

const TABS = [
  { id: 'ranking', label: '🏆 Ranking' },
  { id: 'members', label: '👥 Miembros' },
  { id: 'info', label: 'ℹ️ Info' },
]

export default function LeaguePage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [league, setLeague] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)
  const [myMembership, setMyMembership] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const supabase = createClient()
      const [{ data: l }, { data: m }] = await Promise.all([
        supabase.from('leagues').select('*, owner:profiles(username, display_name)').eq('id', id).single(),
        supabase.from('league_members').select('*, profile:profiles(username, display_name, avatar_url, country)').eq('league_id', id).order('total_points', { ascending: false }),
      ])
      setLeague(l)
      setMembers(m ?? [])
      setMyMembership(m?.find((mem: any) => mem.user_id === user?.id) ?? null)
      setLoading(false)
    }
    load()
  }, [id, user?.id])

  const handleLeave = async () => {
    if (!user || !id || !confirm('¿Salir de esta liga?')) return
    await createClient().from('league_members').delete().eq('league_id', id).eq('user_id', user.id)
    router.push('/leagues')
  }

  const copyCode = async () => {
    if (!league) return
    await navigator.clipboard.writeText(league.invite_code)
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  if (loading) return <div className="text-center py-16 text-gray-500">Cargando...</div>
  if (!league) return <div className="text-center py-16 text-gray-500">Liga no encontrada</div>

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border border-green-500/20 rounded-3xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-3xl flex-shrink-0">🏆</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-white">{league.name}</h1>
            {league.description && <p className="text-gray-400 text-sm mt-1">{league.description}</p>}
            <p className="text-xs text-gray-500 mt-2">{members.length} miembros · @{league.owner?.username}</p>
          </div>
        </div>
        {myMembership && (
          <div className="mt-4 flex items-center gap-4 bg-gray-900/60 rounded-2xl p-3">
            <span className="text-2xl">{getRankBadge(myMembership.rank)}</span>
            <div>
              <p className="text-xs text-gray-400">Tu posición</p>
              <p className="text-lg font-black text-white">#{myMembership.rank ?? '?'} · {myMembership.total_points} pts</p>
            </div>
          </div>
        )}
      </div>

      <Tabs tabs={TABS}>
        {activeTab => (
          <>
            {activeTab === 'ranking' && (
              <div className="space-y-2">
                {members.map((member: any, i: number) => {
                  const isMe = member.user_id === user?.id
                  return (
                    <div key={member.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isMe ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-900 border-gray-800'}`}>
                      <div className="w-10 text-center flex-shrink-0">
                        {member.rank && member.rank <= 3
                          ? <span className="text-2xl">{getRankBadge(member.rank)}</span>
                          : <span className="text-sm font-bold text-gray-500">#{i + 1}</span>}
                      </div>
                      <Avatar src={member.profile?.avatar_url} name={member.profile?.display_name || member.profile?.username} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">
                          {member.profile?.display_name || member.profile?.username}
                          {isMe && <span className="ml-1 text-green-400 text-xs">(Tú)</span>}
                        </p>
                        {member.role === 'admin' && <Badge variant="purple">Admin</Badge>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-black text-white">{member.total_points}</p>
                        <p className="text-xs text-gray-500">pts</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-2">
                {members.map((member: any) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-xl">
                    <Avatar src={member.profile?.avatar_url} name={member.profile?.display_name || member.profile?.username} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">{member.profile?.display_name || member.profile?.username}</p>
                      <p className="text-xs text-gray-500">{member.profile?.country ?? 'Sin país'} · {new Date(member.joined_at).toLocaleDateString('es-CO')}</p>
                    </div>
                    {member.role === 'admin' && <Badge variant="purple">Admin</Badge>}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <h3 className="font-bold text-white mb-3">🔗 Código de invitación</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-800 rounded-xl px-4 py-3 font-mono text-2xl tracking-widest text-center text-white font-black">
                      {league.invite_code}
                    </div>
                    <Button onClick={copyCode} variant="outline" size="sm">
                      {copying ? '✅' : '📋 Copiar'}
                    </Button>
                  </div>
                </div>
                {myMembership?.role !== 'admin' && (
                  <Button variant="danger" onClick={handleLeave} className="w-full">🚪 Salir de la liga</Button>
                )}
              </div>
            )}
          </>
        )}
      </Tabs>
    </div>
  )
}
