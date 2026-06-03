'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { MatchCardSkeleton } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { formatDateTime } from '@/lib/utils'
import type { Match } from '@/types'

const TABS = [
  { id: 'all', label: 'Todos' },
  { id: 'live', label: '🔴 En Vivo' },
  { id: 'upcoming', label: 'Próximos' },
  { id: 'finished', label: 'Finalizados' },
  { id: 'A', label: 'Grupo A' },{ id: 'B', label: 'Grupo B' },{ id: 'C', label: 'Grupo C' },
  { id: 'D', label: 'Grupo D' },{ id: 'E', label: 'Grupo E' },{ id: 'F', label: 'Grupo F' },
  { id: 'G', label: 'Grupo G' },{ id: 'H', label: 'Grupo H' },{ id: 'I', label: 'Grupo I' },
  { id: 'J', label: 'Grupo J' },{ id: 'K', label: 'Grupo K' },{ id: 'L', label: 'Grupo L' },
]

function PredictionModal({ match, existing, onSave, onClose }: any) {
  const [home, setHome] = useState<number|string>(existing?.home_score ?? '')
  const [away, setAway] = useState<number|string>(existing?.away_score ?? '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (home === '' || away === '') return
    setLoading(true)
    await onSave(Number(home), Number(away))
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1000)
    setLoading(false)
  }

  if (match.is_locked || match.status !== 'scheduled') {
    return (
      <div className="text-center py-4">
        <p className="text-gray-400 text-sm">🔒 Predicciones cerradas para este partido</p>
        {existing && <p className="text-blue-400 font-bold mt-2">{existing.home_score} - {existing.away_score}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-2">
          {match.home_team?.flag_url && <img src={match.home_team.flag_url} className="w-10 h-7 object-cover rounded" />}
          <span className="text-xs text-gray-400 text-center">{match.home_team?.name}</span>
          <input type="number" min="0" max="20" value={home} onChange={e => setHome(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-16 h-16 text-center text-3xl font-black bg-gray-800 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500" placeholder="?" />
          <div className="flex gap-1">
            {[0,1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setHome(n)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${home===n?'bg-green-600 text-white':'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{n}</button>
            ))}
          </div>
        </div>
        <span className="text-4xl font-black text-gray-600">:</span>
        <div className="flex flex-col items-center gap-2">
          {match.away_team?.flag_url && <img src={match.away_team.flag_url} className="w-10 h-7 object-cover rounded" />}
          <span className="text-xs text-gray-400 text-center">{match.away_team?.name}</span>
          <input type="number" min="0" max="20" value={away} onChange={e => setAway(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-16 h-16 text-center text-3xl font-black bg-gray-800 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500" placeholder="?" />
          <div className="flex gap-1">
            {[0,1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setAway(n)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${away===n?'bg-green-600 text-white':'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{n}</button>
            ))}
          </div>
        </div>
      </div>
      <button onClick={handleSave} disabled={home===''||away===''||loading}
        className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl disabled:opacity-50">
        {saved ? '✅ ¡Guardado!' : loading ? 'Guardando...' : existing ? '📝 Actualizar' : '💾 Guardar predicción'}
      </button>
    </div>
  )
}

export default function MatchesPage() {
  const { user } = useAuth()
  const { matches, loading } = useMatches()
  const { predictions, savePrediction } = usePredictions(user?.id)
  const [selected, setSelected] = useState<Match|null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const predMap = new Map(predictions.map(p => [p.match_id, p]))
  const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

  const filtered = matches.filter(m => {
    if (activeTab === 'live') return m.status === 'live'
    if (activeTab === 'upcoming') return m.status === 'scheduled'
    if (activeTab === 'finished') return m.status === 'finished'
    if (GROUPS.includes(activeTab)) return m.group_name === activeTab
    return true
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">⚽ Partidos</h1>
      <Tabs tabs={TABS} onChange={setActiveTab}>
        {() => (
          <div className="space-y-3">
            {loading ? Array.from({length:5}).map((_,i) => <MatchCardSkeleton key={i}/>) :
             filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-4xl mb-3">⚽</p><p>No hay partidos aquí</p>
              </div>
            ) : filtered.map(m => {
              const pred = predMap.get(m.id)
              return (
                <div key={m.id} onClick={() => setSelected(m)}
                  className={`bg-gray-900 border rounded-2xl p-4 cursor-pointer transition-all hover:border-gray-600 ${m.status==='live'?'border-red-500/40':'border-gray-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">{m.stage?.name}{m.group_name&&` · Grupo ${m.group_name}`}</span>
                    <div className="flex items-center gap-2">
                      {m.status==='live' && <span className="flex items-center gap-1 text-xs font-bold text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>EN VIVO</span>}
                      <span className="text-xs text-gray-600">{formatDateTime(m.match_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      {m.home_team?.flag_url && <img src={m.home_team.flag_url} className="w-6 h-4 object-cover rounded"/>}
                      <span className="font-semibold text-white text-sm">{m.home_team?.name}</span>
                    </div>
                    <div className="px-3 py-1 bg-gray-800 rounded-xl text-center min-w-[70px]">
                      {m.status==='finished'||m.status==='live'
                        ? <span className="text-lg font-black text-white">{m.home_score}-{m.away_score}</span>
                        : <span className="text-xs text-gray-500">vs</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-semibold text-white text-sm">{m.away_team?.name}</span>
                      {m.away_team?.flag_url && <img src={m.away_team.flag_url} className="w-6 h-4 object-cover rounded"/>}
                    </div>
                  </div>
                  {pred && (
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="text-xs text-gray-500">Tu pred:</span>
                      <span className="text-xs font-bold text-blue-400">{pred.home_score}-{pred.away_score}</span>
                      {pred.is_calculated && (
                        <Badge variant={pred.points_earned>=5?'success':pred.points_earned>=3?'info':'default'}>+{pred.points_earned}pts</Badge>
                      )}
                    </div>
                  )}
                  {!pred && !m.is_locked && m.status==='scheduled' && (
                    <div className="mt-2 text-center"><span className="text-xs text-yellow-400">⚡ Sin predicción</span></div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Tabs>
      <Modal open={!!selected} onClose={() => setSelected(null)}
        title={selected?`${selected.home_team?.name} vs ${selected.away_team?.name}`:''}>
        {selected && (
          <PredictionModal match={selected} existing={predMap.get(selected.id)}
            onSave={(h: number, a: number) => savePrediction(selected.id, h, a)}
            onClose={() => setSelected(null)} />
        )}
      </Modal>
    </div>
  )
}
