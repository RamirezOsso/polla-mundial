'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function AdminMatchesPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [stages, setStages] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [form, setForm] = useState({ stage_id: '', home_team_id: '', away_team_id: '', match_date: '', venue: '', city: '', group_name: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('teams').select('*').order('name').then(({ data }) => setTeams(data ?? []))
    supabase.from('stages').select('*').order('order_num').then(({ data }) => setStages(data ?? []))
    supabase.from('matches').select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), stage:stages(*)')
      .order('match_date').then(({ data }) => setMatches(data ?? []))
  }, [])

  const handleCreate = async () => {
    if (!form.stage_id || !form.home_team_id || !form.away_team_id || !form.match_date) {
      setError('Completa los campos obligatorios'); return
    }
    setLoading(true); setError('')
    const { error: err } = await createClient().from('matches').insert({ ...form, status: 'scheduled' })
    if (err) { setError(err.message) }
    else { setSuccess(true); setTimeout(() => setSuccess(false), 3000); setForm({ stage_id: '', home_team_id: '', away_team_id: '', match_date: '', venue: '', city: '', group_name: '' }) }
    setLoading(false)
  }

  const toggleLock = async (match: any) => {
    await createClient().from('matches').update({ is_locked: !match.is_locked }).eq('id', match.id)
    setMatches(prev => prev.map(m => m.id === match.id ? { ...m, is_locked: !m.is_locked } : m))
  }

  const Select = ({ label, value, onChange, options, placeholder }: any) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50">
        <option value="">{placeholder}</option>
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black text-white">⚽ Gestión de Partidos</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-bold text-white">➕ Crear partido</h2>
          {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-xl">{error}</div>}
          {success && <div className="text-green-400 text-sm bg-green-500/10 p-3 rounded-xl">✅ Partido creado</div>}
          <Select label="Fase *" value={form.stage_id} onChange={(v: string) => setForm(f => ({ ...f, stage_id: v }))} placeholder="Seleccionar..." options={stages.map(s => ({ value: s.id, label: s.name }))} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Local *" value={form.home_team_id} onChange={(v: string) => setForm(f => ({ ...f, home_team_id: v }))} placeholder="Local..." options={teams.map(t => ({ value: t.id, label: t.name }))} />
            <Select label="Visitante *" value={form.away_team_id} onChange={(v: string) => setForm(f => ({ ...f, away_team_id: v }))} placeholder="Visitante..." options={teams.map(t => ({ value: t.id, label: t.name }))} />
          </div>
          <Input label="Fecha y hora *" type="datetime-local" value={form.match_date} onChange={e => setForm(f => ({ ...f, match_date: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Estadio" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Estadio Azteca" />
            <Input label="Ciudad" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Ciudad de México" />
          </div>
          <Input label="Grupo" value={form.group_name} onChange={e => setForm(f => ({ ...f, group_name: e.target.value.toUpperCase() }))} placeholder="A" maxLength={1} />
          <Button onClick={handleCreate} loading={loading} className="w-full">Crear partido</Button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="font-bold text-white">Partidos ({matches.length})</h3>
          </div>
          <div className="divide-y divide-gray-800 max-h-[500px] overflow-y-auto">
            {matches.map(match => (
              <div key={match.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {match.home_team?.name} vs {match.away_team?.name}
                  </p>
                  <p className="text-xs text-gray-500">{match.stage?.name}{match.group_name && ` · G${match.group_name}`}</p>
                </div>
                <button onClick={() => toggleLock(match)}
                  className={`text-xs px-2 py-1 rounded-lg border transition-all ${match.is_locked ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'}`}>
                  {match.is_locked ? '🔒' : '🔓'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
