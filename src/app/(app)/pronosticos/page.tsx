'use client'
import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

function GroupCard({ group, matches, predictions, onClick }: any) {
  const predMap = new Map(predictions.map((p: any) => [p.match_id, p]))
  const done = matches.filter((m: any) => predMap.has(m.id)).length
  const total = matches.length
  const pct = total > 0 ? (done / total) * 100 : 0
  const isDone = done === total && total > 0

  const standings = useMemo(() => {
    const teams: Record<string, any> = {}
    matches.forEach((m: any) => {
      if (!teams[m.home_team_id]) teams[m.home_team_id] = { ...m.home_team, pts: 0, gd: 0, gf: 0 }
      if (!teams[m.away_team_id]) teams[m.away_team_id] = { ...m.away_team, pts: 0, gd: 0, gf: 0 }
      const isFinished = m.status === 'finished'
      const pred = predMap.get(m.id)
      const h = isFinished ? m.home_score : pred?.home_score
      const a = isFinished ? m.away_score : pred?.away_score
      if (h == null || a == null) return
      teams[m.home_team_id].gf += h
      teams[m.away_team_id].gf += a
      teams[m.home_team_id].gd += h - a
      teams[m.away_team_id].gd += a - h
      if (h > a) teams[m.home_team_id].pts += 3
      else if (h < a) teams[m.away_team_id].pts += 3
      else { teams[m.home_team_id].pts += 1; teams[m.away_team_id].pts += 1 }
    })
    return Object.values(teams).sort((a: any, b: any) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
  }, [matches, predMap])

  return (
    <button onClick={onClick}
      className={`w-full bg-gray-900 border rounded-2xl overflow-hidden text-left transition-all hover:border-gray-500 hover:shadow-lg active:scale-95 ${
        isDone ? 'border-green-500/40' : done > 0 ? 'border-yellow-500/30' : 'border-gray-800'
      }`}>
      <div className={`flex items-center justify-between px-4 py-3 ${isDone ? 'bg-green-500/10' : 'bg-gray-800/50'}`}>
        <span className="text-base font-black text-white">Grupo {group}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          isDone ? 'bg-green-500/20 text-green-400' :
          done > 0 ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-gray-700/50 text-gray-400'
        }`}>
          {isDone ? '✅ Listo' : `${done}/${total}`}
        </span>
      </div>
      <div className="px-3 py-2 space-y-1">
        {standings.map((team: any, i: number) => (
          <div key={team.id} className={`flex items-center gap-2 py-1.5 px-2 rounded-lg ${i < 2 ? 'bg-green-500/5' : ''}`}>
            <span className={`text-xs font-bold w-4 text-center flex-shrink-0 ${i < 2 ? 'text-green-400' : 'text-gray-500'}`}>{i + 1}</span>
            {team.flag_url && <img src={team.flag_url} className="w-6 h-4 object-cover rounded flex-shrink-0"/>}
            <span className={`text-xs flex-1 truncate ${i < 2 ? 'text-white font-semibold' : 'text-gray-400'}`}>{team.short_name}</span>
            <span className={`text-xs font-black w-5 text-right flex-shrink-0 ${i < 2 ? 'text-white' : 'text-gray-500'}`}>{team.pts}</span>
          </div>
        ))}
      </div>
      <div className="h-1 bg-gray-800 mx-3 mb-3 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-green-500' : 'bg-yellow-500'}`}
          style={{ width: `${pct}%` }}/>
      </div>
    </button>
  )
}

function GroupDetail({ group, matches, predictions, onSave, onBack }: any) {
  const predMap = new Map(predictions.map((p: any) => [p.match_id, p]))
  const [scores, setScores] = useState<Record<string, {h: number|string, a: number|string}>>(() => {
    const init: Record<string, any> = {}
    matches.forEach((m: any) => {
      const p = predMap.get(m.id)
      init[m.id] = { h: p?.home_score ?? '', a: p?.away_score ?? '' }
    })
    return init
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    for (const m of matches) {
      const s = scores[m.id]
      if (s.h !== '' && s.a !== '') {
        await onSave(m.id, Number(s.h), Number(s.a))
      }
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); onBack() }, 1200)
  }

  const done = matches.filter((m: any) => {
    const s = scores[m.id]
    return s?.h !== '' && s?.a !== ''
  }).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
          <span>←</span>
          <span className="text-sm">Grupos</span>
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-black text-white">Grupo {group}</h2>
          <p className="text-xs text-gray-500">{done}/{matches.length} pronósticos</p>
        </div>
      </div>

      <div className="space-y-3">
        {matches.map((m: any) => {
          const s = scores[m.id]
          const isLocked = m.is_locked || m.status !== 'scheduled'
          const isFinished = m.status === 'finished'
          const hasPred = s?.h !== '' && s?.a !== ''
          const calcPred = predMap.get(m.id)

          return (
            <div key={m.id} className={`bg-gray-900 border rounded-2xl p-4 ${hasPred ? 'border-green-500/20' : 'border-gray-800'}`}>
              <p className="text-xs text-gray-500 mb-3 text-center">
                {new Date(m.match_date).toLocaleString('es-CO', {
                  timeZone: 'America/Bogota', day: '2-digit', month: 'short',
                  hour: '2-digit', minute: '2-digit'
                })}
                {isLocked && <span className="ml-2 text-yellow-400">🔒</span>}
              </p>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 justify-end">
                  {m.home_team?.flag_url && <img src={m.home_team.flag_url} className="w-7 h-5 object-cover rounded"/>}
                  <span className="font-bold text-white text-sm text-right">{m.home_team?.name}</span>
                </div>

                {isFinished ? (
                  <div className="px-3 py-1.5 bg-gray-800 rounded-xl text-center min-w-[80px]">
                    <span className="text-xl font-black text-white">{m.home_score}-{m.away_score}</span>
                  </div>
                ) : isLocked ? (
                  <div className="px-3 py-1.5 bg-gray-800 rounded-xl text-center min-w-[80px]">
                    {hasPred
                      ? <span className="text-sm font-black text-blue-400">{s.h}-{s.a}</span>
                      : <span className="text-xs text-gray-500">🔒</span>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <input type="number" min="0" max="20" value={s?.h ?? ''}
                        onChange={e => setScores(p => ({...p, [m.id]: {...p[m.id], h: e.target.value === '' ? '' : Number(e.target.value)}}))}
                        className="w-14 h-14 text-center text-2xl font-black bg-gray-800 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
                        placeholder="?"/>
                      <div className="flex gap-0.5">
                        {[0,1,2,3,4,5].map(n => (
                          <button key={n} onClick={() => setScores(p => ({...p, [m.id]: {...p[m.id], h: n}}))}
                            className={`w-6 h-5 rounded text-xs font-bold transition-all ${s?.h===n ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-white'}`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <span className="text-2xl font-black text-gray-600">:</span>
                    <div className="flex flex-col items-center gap-1">
                      <input type="number" min="0" max="20" value={s?.a ?? ''}
                        onChange={e => setScores(p => ({...p, [m.id]: {...p[m.id], a: e.target.value === '' ? '' : Number(e.target.value)}}))}
                        className="w-14 h-14 text-center text-2xl font-black bg-gray-800 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
                        placeholder="?"/>
                      <div className="flex gap-0.5">
                        {[0,1,2,3,4,5].map(n => (
                          <button key={n} onClick={() => setScores(p => ({...p, [m.id]: {...p[m.id], a: n}}))}
                            className={`w-6 h-5 rounded text-xs font-bold transition-all ${s?.a===n ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-white'}`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 flex-1">
                  <span className="font-bold text-white text-sm">{m.away_team?.name}</span>
                  {m.away_team?.flag_url && <img src={m.away_team.flag_url} className="w-7 h-5 object-cover rounded"/>}
                </div>
              </div>

              {isFinished && calcPred?.is_calculated && (
                <div className="mt-2 text-center">
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    calcPred.points_earned === 5 ? 'bg-green-500/20 text-green-400' :
                    calcPred.points_earned >= 3 ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    +{calcPred.points_earned} pts
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {matches.some((m: any) => !m.is_locked && m.status === 'scheduled') && (
        <button onClick={handleSave} disabled={saving || done === 0}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 text-white font-black rounded-2xl text-base disabled:opacity-50 transition-all active:scale-95">
          {saved ? '✅ ¡Guardado!' : saving ? 'Guardando...' : `💾 Guardar Grupo ${group}`}
        </button>
      )}
    </div>
  )
}

export default function PronosticosPage() {
  const { user } = useAuth()
  const { matches, loading } = useMatches()
  const { predictions, savePrediction } = usePredictions(user?.id)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  const groupMatches = useMemo(() =>
    matches.filter(m => m.stage?.type === 'group'),
    [matches]
  )

  const totalDone = GROUPS.filter(g => {
    const gm = groupMatches.filter(m => m.group_name === g)
    return gm.length > 0 && gm.every(m => predictions.find(p => p.match_id === m.id))
  }).length

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-800 animate-pulse rounded-xl"/>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({length: 12}).map((_, i) => (
            <div key={i} className="h-36 bg-gray-800 animate-pulse rounded-2xl"/>
          ))}
        </div>
      </div>
    )
  }

  if (selectedGroup) {
    return (
      <GroupDetail
        group={selectedGroup}
        matches={groupMatches.filter(m => m.group_name === selectedGroup)}
        predictions={predictions}
        onSave={savePrediction}
        onBack={() => setSelectedGroup(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">⚽ Pronósticos</h1>
        <p className="text-gray-400 text-sm mt-1">
          {totalDone}/12 grupos completos · Toca un grupo para ingresar
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Progreso fase de grupos</span>
          <span className="text-sm font-bold text-white">{totalDone}/12</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-500"
            style={{ width: `${(totalDone / 12) * 100}%` }}/>
        </div>
        {totalDone === 12 && (
          <p className="text-xs text-green-400 mt-2 text-center">
            ✅ ¡Grupos completos! Ve a <a href="/camino" className="font-bold underline">Camino al Campeón</a>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {GROUPS.map(g => (
          <GroupCard
            key={g}
            group={g}
            matches={groupMatches.filter(m => m.group_name === g)}
            predictions={predictions}
            onClick={() => setSelectedGroup(g)}
          />
        ))}
      </div>
    </div>
  )
}
