'use client'
import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

const STAGES = [
  { id: 'group', label: '🏟️ Grupos' },
  { id: 'round_of_32', label: '⚔️ Ronda 32' },
  { id: 'round_of_16', label: '🔥 Octavos' },
  { id: 'quarter_final', label: '💥 Cuartos' },
  { id: 'semi_final', label: '⭐ Semis' },
  { id: 'third_place', label: '🥉 3er Lugar' },
  { id: 'final', label: '🏆 Final' },
]

function MatchResult({ match, onSave }: any) {
  const [home, setHome] = useState<number|string>(match.home_score ?? '')
  const [away, setAway] = useState<number|string>(match.away_score ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const isFinished = match.status === 'finished'

  const handleSave = async () => {
    if (home === '' || away === '') return
    setSaving(true)
    await onSave(match.id, Number(home), Number(away))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  return (
    <div className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 ${isFinished ? 'border-green-300 dark:border-green-500/30' : 'border-gray-200 dark:border-gray-800'}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400">
          {new Date(match.match_date).toLocaleString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          {match.venue && ` · ${match.venue}`}
        </p>
        {isFinished && <span className="text-xs bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">✅ Publicado</span>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2">
          {match.home_team?.flag_url && <img src={match.home_team.flag_url} className="w-8 h-5 object-cover rounded flex-shrink-0"/>}
          <span className="font-bold text-gray-900 dark:text-white text-sm flex-1">{match.home_team?.name}</span>
          <div className="flex gap-1">
            {[0,1,2,3,4,5,6,7].map(n => (
              <button key={n} onClick={() => setHome(n)}
                className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${home===n ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <div className="w-14 h-14 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl text-3xl font-black text-gray-900 dark:text-white">
            {home !== '' ? home : '?'}
          </div>
          <span className="text-2xl font-black text-gray-300 dark:text-gray-600">:</span>
          <div className="w-14 h-14 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl text-3xl font-black text-gray-900 dark:text-white">
            {away !== '' ? away : '?'}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2">
          {match.away_team?.flag_url && <img src={match.away_team.flag_url} className="w-8 h-5 object-cover rounded flex-shrink-0"/>}
          <span className="font-bold text-gray-900 dark:text-white text-sm flex-1">{match.away_team?.name}</span>
          <div className="flex gap-1">
            {[0,1,2,3,4,5,6,7].map(n => (
              <button key={n} onClick={() => setAway(n)}
                className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${away===n ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving || home === '' || away === ''}
        className="mt-3 w-full py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl disabled:opacity-50">
        {saved ? '✅ Publicado' : saving ? 'Guardando...' : isFinished ? '🔄 Actualizar' : '📋 Publicar resultado'}
      </button>
    </div>
  )
}

function GroupResults({ group, matches, onSave, onBack }: any) {
  const done = matches.filter((m: any) => m.status === 'finished').length

  const standings = useMemo(() => {
    const teams: Record<string, any> = {}
    matches.forEach((m: any) => {
      if (!teams[m.home_team_id]) teams[m.home_team_id] = { ...m.home_team, pts: 0, gd: 0, gf: 0, played: 0 }
      if (!teams[m.away_team_id]) teams[m.away_team_id] = { ...m.away_team, pts: 0, gd: 0, gf: 0, played: 0 }
      if (m.status !== 'finished' || m.home_score == null) return
      const h = m.home_score, a = m.away_score
      teams[m.home_team_id].gf += h; teams[m.away_team_id].gf += a
      teams[m.home_team_id].gd += h - a; teams[m.away_team_id].gd += a - h
      teams[m.home_team_id].played++; teams[m.away_team_id].played++
      if (h > a) teams[m.home_team_id].pts += 3
      else if (h < a) teams[m.away_team_id].pts += 3
      else { teams[m.home_team_id].pts += 1; teams[m.away_team_id].pts += 1 }
    })
    return Object.values(teams).sort((a: any, b: any) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
  }, [matches])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">
          ← Grupos
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Grupo {group}</h2>
          <p className="text-xs text-gray-500">{done}/{matches.length} resultados publicados</p>
        </div>
      </div>

      {done > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500">Tabla de posiciones</p>
            {done === matches.length && <span className="text-xs text-green-600 dark:text-green-400 font-bold">✅ Grupo completo</span>}
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {standings.map((team: any, i: number) => (
              <div key={team.id} className={`flex items-center gap-3 px-4 py-2 ${i < 2 ? 'bg-green-50 dark:bg-green-500/5' : ''}`}>
                <span className={`text-xs font-bold w-4 ${i < 2 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>{i+1}</span>
                {team.flag_url && <img src={team.flag_url} className="w-6 h-4 object-cover rounded"/>}
                <span className={`text-sm flex-1 ${i < 2 ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500'}`}>{team.name}</span>
                <span className="text-xs text-gray-400 w-6 text-center">{team.played}J</span>
                <span className="text-xs text-gray-400 w-8 text-center">{team.gd > 0 ? '+' : ''}{team.gd}</span>
                <span className={`text-sm font-black w-6 text-right ${i < 2 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{team.pts}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {matches.map((m: any) => (
          <MatchResult key={m.id} match={m} onSave={onSave} />
        ))}
      </div>
    </div>
  )
}

export default function AdminResultsPage() {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStage, setActiveStage] = useState('group')
  const [selectedGroup, setSelectedGroup] = useState<string|null>(null)
  const [generating, setGenerating] = useState(false)
  const [genMsg, setGenMsg] = useState('')

  useEffect(() => { loadMatches() }, [])

  const loadMatches = async () => {
    const { data } = await createClient()
      .from('matches')
      .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), stage:stages(*)')
      .order('match_date')
    setMatches(data ?? [])
    setLoading(false)
  }

  const handleSave = async (matchId: string, home: number, away: number) => {
    const supabase = createClient()
    await supabase.from('matches').update({
      home_score: home, away_score: away,
      status: 'finished',
      result_published_at: new Date().toISOString(),
    }).eq('id', matchId)
    await supabase.rpc('update_points_for_match', { p_match_id: matchId })

    const updated = matches.map(m => m.id === matchId
      ? { ...m, home_score: home, away_score: away, status: 'finished' }
      : m
    )
    setMatches(updated)

    // Verificar si todos los grupos están completos → generar R32
    const groupMatches = updated.filter(m => m.stage?.type === 'group')
    const allGroupsDone = GROUPS.every(g => {
      const gm = groupMatches.filter(m => m.group_name === g)
      return gm.length > 0 && gm.every(m => m.status === 'finished')
    })

    if (allGroupsDone) {
      setGenerating(true)
      setGenMsg('⏳ Generando Ronda de 32...')
      const { data, error } = await supabase.rpc('generate_knockout_from_results')
      if (!error) {
        setGenMsg('✅ ' + data)
        await loadMatches()
        setActiveStage('round_of_32')
      }
      setGenerating(false)
      setTimeout(() => setGenMsg(''), 5000)
    }
  }

  const groupMatches = matches.filter(m => m.stage?.type === 'group')
  const stageMatches = (type: string) => matches.filter(m => m.stage?.type === type)

  const groupStats = GROUPS.map(g => {
    const gm = groupMatches.filter(m => m.group_name === g)
    return { group: g, done: gm.filter(m => m.status === 'finished').length, total: gm.length }
  })

  const totalGroupsDone = groupStats.filter(g => g.done === g.total && g.total > 0).length

  if (loading) return <div className="text-gray-500 text-center py-8">Cargando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">📋 Resultados</h1>
        {activeStage === 'group' && (
          <span className="text-sm text-gray-500">{totalGroupsDone}/12 grupos completos</span>
        )}
      </div>

      {genMsg && (
        <div className={`p-3 rounded-xl text-sm font-medium ${genMsg.startsWith('✅') ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'}`}>
          {genMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STAGES.map(s => {
          const count = s.id === 'group' ? groupMatches.length : stageMatches(s.id).length
          const done = s.id === 'group'
            ? groupMatches.filter(m => m.status === 'finished').length
            : stageMatches(s.id).filter(m => m.status === 'finished').length
          return (
            <button key={s.id} onClick={() => { setActiveStage(s.id); setSelectedGroup(null) }}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1 ${
                activeStage === s.id ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}>
              {s.label}
              {count > 0 && (
                <span className={`text-xs px-1.5 rounded-full ${done === count ? 'bg-green-500/30 text-green-700 dark:text-green-300' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                  {done}/{count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Grupos */}
      {activeStage === 'group' && (
        selectedGroup ? (
          <GroupResults
            group={selectedGroup}
            matches={groupMatches.filter(m => m.group_name === selectedGroup)}
            onSave={handleSave}
            onBack={() => setSelectedGroup(null)}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {groupStats.map(({ group, done, total }) => {
              const isDone = done === total && total > 0
              return (
                <button key={group} onClick={() => setSelectedGroup(group)}
                  className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 text-left transition-all hover:shadow-lg active:scale-95 ${
                    isDone ? 'border-green-400 dark:border-green-500/40' :
                    done > 0 ? 'border-yellow-400 dark:border-yellow-500/30' :
                    'border-gray-200 dark:border-gray-800'
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-black text-gray-900 dark:text-white">Grupo {group}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isDone ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' :
                      done > 0 ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-500'
                    }`}>
                      {isDone ? '✅' : `${done}/${total}`}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${isDone ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${total > 0 ? (done/total)*100 : 0}%` }}/>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{done} de {total} resultados</p>
                </button>
              )
            })}
          </div>
        )
      )}

      {/* Eliminatorias */}
      {activeStage !== 'group' && (
        <div className="space-y-3">
          {stageMatches(activeStage).length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
              <p className="text-4xl mb-3">⏳</p>
              <p className="text-gray-600 dark:text-gray-400 font-medium">No hay partidos en esta fase aún</p>
              <p className="text-xs text-gray-400 mt-1">
                {activeStage === 'round_of_32'
                  ? `Completa todos los grupos (${totalGroupsDone}/12)`
                  : 'Completa la fase anterior para generar estos partidos'}
              </p>
            </div>
          ) : (
            stageMatches(activeStage).map(m => (
              <MatchResult key={m.id} match={m} onSave={handleSave} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
