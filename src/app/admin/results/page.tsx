'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

const STAGES = [
  { id: 'group', label: 'Grupos', icon: '🏟️' },
  { id: 'round_of_32', label: 'Ronda 32', icon: '⚔️' },
  { id: 'round_of_16', label: 'Octavos', icon: '🔥' },
  { id: 'quarter_final', label: 'Cuartos', icon: '💥' },
  { id: 'semi_final', label: 'Semis', icon: '⭐' },
  { id: 'third_place', label: '3er Lugar', icon: '🥉' },
  { id: 'final', label: 'Final', icon: '🏆' },
]

function MatchResultCard({ match, onSave }: any) {
  const [home, setHome] = useState<number|string>(match?.home_score ?? '')
  const [away, setAway] = useState<number|string>(match?.away_score ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const isFinished = match?.status === 'finished'
  const isTBD = match?.home_team?.short_name === 'TBD' || match?.away_team?.short_name === 'TBD'

  useEffect(() => {
    setHome(match?.home_score ?? '')
    setAway(match?.away_score ?? '')
  }, [match?.id, match?.home_score, match?.away_score])

  const handleSave = async () => {
    if (home === '' || away === '') return
    setSaving(true)
    await onSave(match.id, Number(home), Number(away))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  if (isTBD) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 opacity-50">
        <p className="text-xs text-gray-400 text-center mb-2">
          {new Date(match.match_date).toLocaleString('es-CO', { timeZone: 'America/Bogota', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
        </p>
        <p className="text-center text-sm text-gray-400">⏳ Equipos por definir</p>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 ${isFinished ? 'border-green-300 dark:border-green-500/30' : 'border-gray-200 dark:border-gray-800'}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400">
          {new Date(match.match_date).toLocaleString('es-CO', { timeZone: 'America/Bogota', weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
        </p>
        {isFinished && <span className="text-xs bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">✅ Publicado</span>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2">
          {match.home_team?.flag_url && <img src={match.home_team.flag_url} className="w-8 h-5 object-cover rounded flex-shrink-0"/>}
          <span className="font-bold text-gray-900 dark:text-white text-sm flex-1">{match.home_team?.name}</span>
          <input type="number" inputMode="numeric" min={0} max={20} value={home}
            onChange={e => { const v = parseInt(e.target.value); if(!isNaN(v) && v>=0 && v<=20) setHome(v); else if(e.target.value==='') setHome('') }}
            className="w-14 h-10 text-center text-xl font-black bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-green-500"
            placeholder="?"/>
        </div>

        <div className="flex items-center justify-center">
          <span className="text-xs font-bold text-gray-400">VS</span>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2">
          {match.away_team?.flag_url && <img src={match.away_team.flag_url} className="w-8 h-5 object-cover rounded flex-shrink-0"/>}
          <span className="font-bold text-gray-900 dark:text-white text-sm flex-1">{match.away_team?.name}</span>
          <input type="number" inputMode="numeric" min={0} max={20} value={away}
            onChange={e => { const v = parseInt(e.target.value); if(!isNaN(v) && v>=0 && v<=20) setAway(v); else if(e.target.value==='') setAway('') }}
            className="w-14 h-10 text-center text-xl font-black bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-green-500"
            placeholder="?"/>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving || home === '' || away === ''}
        className={`mt-3 w-full py-3 font-bold rounded-xl transition-all disabled:opacity-50 ${
          saved ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-300' :
          'bg-gradient-to-r from-green-600 to-green-500 text-white'
        }`}>
        {saved ? '✅ Publicado' : saving ? 'Guardando...' : isFinished ? '🔄 Actualizar' : '📋 Publicar resultado'}
      </button>
    </div>
  )
}

function GroupView({ group, matches, onSave, onBack }: any) {
  const done = matches.filter((m: any) => m.status === 'finished').length

  const standings = useMemo(() => {
    const teams: Record<string, any> = {}
    matches.forEach((m: any) => {
      if (!teams[m.home_team_id]) teams[m.home_team_id] = { ...m.home_team, pts: 0, gd: 0, gf: 0, played: 0 }
      if (!teams[m.away_team_id]) teams[m.away_team_id] = { ...m.away_team, pts: 0, gd: 0, gf: 0, played: 0 }
      if (m.status !== 'finished') return
      const h = m.home_score, a = m.away_score
      teams[m.home_team_id].gf += h; teams[m.away_team_id].gf += a
      teams[m.home_team_id].gd += h-a; teams[m.away_team_id].gd += a-h
      teams[m.home_team_id].played++; teams[m.away_team_id].played++
      if (h > a) teams[m.home_team_id].pts += 3
      else if (h < a) teams[m.away_team_id].pts += 3
      else { teams[m.home_team_id].pts += 1; teams[m.away_team_id].pts += 1 }
    })
    return Object.values(teams).sort((a: any, b: any) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf)
  }, [matches])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">← Grupos</button>
        <div className="flex-1">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Grupo {group}</h2>
          <p className="text-xs text-gray-500">{done}/{matches.length} resultados</p>
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
              <div key={team.id} className={`flex items-center gap-3 px-4 py-2.5 ${i < 2 ? 'bg-green-50 dark:bg-green-500/5' : ''}`}>
                <span className={`text-xs font-black w-4 ${i < 2 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>{i+1}</span>
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
        {matches.map((m: any) => <MatchResultCard key={m.id} match={m} onSave={onSave}/>)}
      </div>
    </div>
  )
}

export default function AdminResultsPage() {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStage, setActiveStage] = useState('group')
  const [selectedGroup, setSelectedGroup] = useState<string|null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { loadMatches() }, [])

  const loadMatches = async () => {
    const { data } = await createClient()
      .from('matches')
      .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), stage:stages(*)')
      .order('match_number')
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
      setMsg('⏳ Generando Ronda de 32...')
      const { data, error } = await supabase.rpc('generate_r32_from_groups')
      if (!error) {
        setMsg('✅ ' + data + ' — Los equipos se actualizarán automáticamente en cada fase')
        await loadMatches()
        setActiveStage('round_of_32')
      } else {
        setMsg('❌ Error: ' + error.message)
      }
      setTimeout(() => setMsg(''), 6000)
    }
  }

  const groupMatches = matches.filter(m => m.stage?.type === 'group')
  const stageMatches = (type: string) => matches.filter(m => m.stage?.type === type)

  const groupStats = GROUPS.map(g => ({
    group: g,
    done: groupMatches.filter(m => m.group_name === g && m.status === 'finished').length,
    total: groupMatches.filter(m => m.group_name === g).length,
    standings: (() => {
      const gm = groupMatches.filter(m => m.group_name === g)
      const teams: Record<string, any> = {}
      gm.forEach((m: any) => {
        if (!teams[m.home_team_id]) teams[m.home_team_id] = { ...m.home_team, pts: 0, gd: 0, gf: 0 }
        if (!teams[m.away_team_id]) teams[m.away_team_id] = { ...m.away_team, pts: 0, gd: 0, gf: 0 }
        if (m.status !== 'finished') return
        const h = m.home_score, a = m.away_score
        teams[m.home_team_id].gf += h; teams[m.away_team_id].gf += a
        teams[m.home_team_id].gd += h-a; teams[m.away_team_id].gd += a-h
        if (h > a) teams[m.home_team_id].pts += 3
        else if (h < a) teams[m.away_team_id].pts += 3
        else { teams[m.home_team_id].pts += 1; teams[m.away_team_id].pts += 1 }
      })
      return Object.values(teams).sort((a: any, b: any) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf)
    })()
  }))

  const totalGroupsDone = groupStats.filter(g => g.done === g.total && g.total > 0).length

  if (loading) return <div className="text-gray-500 text-center py-8">Cargando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">📋 Resultados</h1>
        {activeStage === 'group' && <span className="text-sm text-gray-500">{totalGroupsDone}/12 grupos</span>}
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-sm font-medium ${msg.startsWith('✅') ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : msg.startsWith('❌') ? 'bg-red-100 dark:bg-red-500/20 text-red-600' : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'}`}>
          {msg}
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
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1.5 ${
                activeStage === s.id ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}>
              <span>{s.icon}</span>
              <span>{s.label}</span>
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
          <GroupView
            group={selectedGroup}
            matches={groupMatches.filter(m => m.group_name === selectedGroup)}
            onSave={handleSave}
            onBack={() => setSelectedGroup(null)}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {groupStats.map(({ group, done, total, standings }) => {
              const isDone = done === total && total > 0
              return (
                <button key={group} onClick={() => setSelectedGroup(group)}
                  className={`bg-white dark:bg-gray-900 border rounded-2xl overflow-hidden text-left transition-all hover:shadow-lg active:scale-95 ${
                    isDone ? 'border-green-400 dark:border-green-500/40' :
                    done > 0 ? 'border-yellow-400 dark:border-yellow-500/30' :
                    'border-gray-200 dark:border-gray-800'
                  }`}>
                  <div className={`flex items-center justify-between px-4 py-3 ${isDone ? 'bg-green-50 dark:bg-green-500/10' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                    <span className="text-base font-black text-gray-900 dark:text-white">Grupo {group}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isDone ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' :
                      done > 0 ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                      'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}>{isDone ? '✅' : `${done}/${total}`}</span>
                  </div>
                  <div className="px-3 py-2 space-y-1">
                    {standings.slice(0,4).map((team: any, i: number) => (
                      <div key={team.id} className={`flex items-center gap-2 py-1 px-1 rounded-lg ${i < 2 && done > 0 ? 'bg-green-50 dark:bg-green-500/5' : ''}`}>
                        <span className={`text-xs font-bold w-4 text-center ${i < 2 && done > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>{i+1}</span>
                        {team.flag_url && <img src={team.flag_url} className="w-6 h-4 object-cover rounded flex-shrink-0"/>}
                        <span className={`text-xs flex-1 truncate ${i < 2 && done > 0 ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>{team.short_name}</span>
                        <span className={`text-xs font-black ${i < 2 && done > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{team.pts}</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-1 bg-gray-100 dark:bg-gray-800 mx-3 mb-3 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${isDone ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${total > 0 ? (done/total)*100 : 0}%` }}/>
                  </div>
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
                {activeStage === 'round_of_32' ? `Completa todos los grupos (${totalGroupsDone}/12)` : 'Completa la fase anterior'}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {stageMatches(activeStage).map(m => (
                <MatchResultCard key={m.id} match={m} onSave={handleSave}/>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
