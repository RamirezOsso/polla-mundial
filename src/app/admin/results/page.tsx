'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function AdminResultsPage() {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, { home: number | string; away: number | string }>>({})

  useEffect(() => {
    createClient()
      .from('matches')
      .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), stage:stages(*)')
      .neq('status', 'cancelled')
      .order('match_date')
      .then(({ data }) => {
        setMatches(data ?? [])
        const initial: Record<string, any> = {}
        data?.forEach((m: any) => {
          initial[m.id] = { home: m.home_score ?? '', away: m.away_score ?? '' }
        })
        setScores(initial)
        setLoading(false)
      })
  }, [])

  const handleSave = async (match: any) => {
    const score = scores[match.id]
    if (score.home === '' || score.away === '') return
    setSaving(match.id)
    const supabase = createClient()
    await supabase.from('matches').update({
      home_score: Number(score.home),
      away_score: Number(score.away),
      status: 'finished',
      result_published_at: new Date().toISOString(),
    }).eq('id', match.id)
    await supabase.rpc('update_points_for_match', { p_match_id: match.id })
    setMatches(prev => prev.map(m => m.id === match.id
      ? { ...m, home_score: Number(score.home), away_score: Number(score.away), status: 'finished' }
      : m))
    setSaving(null)
  }

  if (loading) return <div className="text-gray-400">Cargando...</div>

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-black text-white">📋 Ingresar Resultados</h1>
      {matches.map(match => (
        <div key={match.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-500">{match.stage?.name}{match.group_name && ` · Grupo ${match.group_name}`}</p>
              <p className="font-bold text-white text-sm">{match.home_team?.name} vs {match.away_team?.name}</p>
              <p className="text-xs text-gray-500">{new Date(match.match_date).toLocaleString('es-CO')}</p>
            </div>
            {match.status === 'finished' && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-lg">✅ Publicado</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-gray-400 w-16 text-right truncate">{match.home_team?.short_name}</span>
              <input type="number" min="0" max="30"
                value={scores[match.id]?.home ?? ''}
                onChange={e => setScores(prev => ({ ...prev, [match.id]: { ...prev[match.id], home: e.target.value } }))}
                className="w-16 h-12 text-center text-2xl font-black bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
                placeholder="0" />
            </div>
            <span className="text-gray-500 font-bold text-xl">-</span>
            <div className="flex items-center gap-2 flex-1">
              <input type="number" min="0" max="30"
                value={scores[match.id]?.away ?? ''}
                onChange={e => setScores(prev => ({ ...prev, [match.id]: { ...prev[match.id], away: e.target.value } }))}
                className="w-16 h-12 text-center text-2xl font-black bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
                placeholder="0" />
              <span className="text-xs text-gray-400 w-16 truncate">{match.away_team?.short_name}</span>
            </div>
            <Button onClick={() => handleSave(match)} loading={saving === match.id} size="sm">
              {match.status === 'finished' ? '🔄 Actualizar' : '✅ Publicar'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
