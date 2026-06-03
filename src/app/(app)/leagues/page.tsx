'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

export default function LeaguesPage() {
  const { user } = useAuth()
  const [leagues, setLeagues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [inviteCode, setInviteCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    if (!user) return
    const { data } = await createClient().from('league_members')
      .select('*, league:leagues(*, owner:profiles(username, display_name))')
      .eq('user_id', user.id)
    setLeagues(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const handleCreate = async () => {
    if (!user || !createForm.name) return
    setSubmitting(true)
    setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase.from('leagues')
      .insert({ ...createForm, owner_id: user.id }).select().single()
    if (err) { setError(err.message); setSubmitting(false); return }
    await supabase.from('league_members').insert({ league_id: data.id, user_id: user.id, role: 'admin' })
    setShowCreate(false)
    setCreateForm({ name: '', description: '' })
    load()
    setSubmitting(false)
  }

  const handleJoin = async () => {
    if (!user || !inviteCode) return
    setSubmitting(true)
    setError('')
    const supabase = createClient()
    const { data: league, error: err } = await supabase.from('leagues')
      .select('*').eq('invite_code', inviteCode.toUpperCase()).single()
    if (err || !league) { setError('Liga no encontrada'); setSubmitting(false); return }
    const { error: joinErr } = await supabase.from('league_members')
      .insert({ league_id: league.id, user_id: user.id })
    if (joinErr) { setError('Ya eres miembro o error al unirte'); setSubmitting(false); return }
    setShowJoin(false)
    setInviteCode('')
    load()
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">🏆 Ligas</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowJoin(true)}>Unirse</Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>+ Crear</Button>
        </div>
      </div>

      {leagues.length === 0 && !loading ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🏆</p>
          <h3 className="text-xl font-bold text-white mb-2">No estás en ninguna liga</h3>
          <p className="text-gray-400 mb-6">Crea tu propia liga o únete con un código</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setShowJoin(true)}>Unirse con código</Button>
            <Button onClick={() => setShowCreate(true)}>Crear liga</Button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {leagues.map((m: any) => (
            <a key={m.league?.id} href={`/leagues/${m.league?.id}`}
              className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl p-5 transition-all block">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-2xl">🏆</div>
                {m.role === 'admin' && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">Admin</span>}
              </div>
              <h3 className="font-bold text-white">{m.league?.name}</h3>
              {m.league?.description && <p className="text-sm text-gray-400 mt-1">{m.league.description}</p>}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800">
                <span className="text-sm text-gray-500">#{m.rank ?? '?'} · {m.total_points} pts</span>
                <span className="text-xs text-gray-600 font-mono">{m.league?.invite_code}</span>
              </div>
            </a>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Crear liga privada">
        <div className="space-y-4">
          {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-xl">{error}</div>}
          <Input label="Nombre" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="Mi liga" />
          <Input label="Descripción (opcional)" value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} placeholder="Liga entre amigos..." />
          <Button onClick={handleCreate} loading={submitting} className="w-full">Crear liga</Button>
        </div>
      </Modal>

      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="Unirse a una liga">
        <div className="space-y-4">
          {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-xl">{error}</div>}
          <Input label="Código de invitación" value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="ABC12345" className="tracking-widest text-center text-lg font-mono" maxLength={8} />
          <Button onClick={handleJoin} loading={submitting} className="w-full">Unirse</Button>
        </div>
      </Modal>
    </div>
  )
}
