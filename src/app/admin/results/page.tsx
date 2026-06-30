'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
const STAGES = [
  { id: 'group', label: 'Grupos', icon: '🏟️' },
  { id: 'thirds', label: 'Terceros', icon: '📊' },
  { id: 'round_of_32', label: 'Ronda 32', icon: '⚔️' },
  { id: 'round_of_16', label: 'Octavos', icon: '🔥' },
  { id: 'quarter_final', label: 'Cuartos', icon: '💥' },
  { id: 'semi_final', label: 'Semis', icon: '⭐' },
  { id: 'third_place', label: '3er Lugar', icon: '🥉' },
  { id: 'final', label: 'Final', icon: '🏆' },
]

// Cruces oficiales R32 FIFA 2026
const R32_STRUCTURE = [
  { mn: 101, home: {g:'A',r:2}, away: {g:'B',r:2}, label: '2°A vs 2°B' },
  { mn: 102, home: {g:'C',r:1}, away: {g:'F',r:2}, label: '1°C vs 2°F' },
  { mn: 103, home: {g:'E',r:1}, away: {thirds:'ABCDF'}, label: '1°E vs Mejor 3°(A/B/C/D/F)' },
  { mn: 104, home: {g:'F',r:1}, away: {g:'C',r:2}, label: '1°F vs 2°C' },
  { mn: 105, home: {g:'E',r:2}, away: {g:'I',r:2}, label: '2°E vs 2°I' },
  { mn: 106, home: {g:'I',r:1}, away: {thirds:'CDFGH'}, label: '1°I vs Mejor 3°(C/D/F/G/H)' },
  { mn: 107, home: {g:'A',r:1}, away: {thirds:'CEFHI'}, label: '1°A vs Mejor 3°(C/E/F/H/I)' },
  { mn: 108, home: {g:'L',r:1}, away: {thirds:'EHIJK'}, label: '1°L vs Mejor 3°(E/H/I/J/K)' },
  { mn: 109, home: {g:'G',r:1}, away: {thirds:'AEHIJ'}, label: '1°G vs Mejor 3°(A/E/H/I/J)' },
  { mn: 110, home: {g:'D',r:1}, away: {thirds:'BEFIJ'}, label: '1°D vs Mejor 3°(B/E/F/I/J)' },
  { mn: 111, home: {g:'H',r:1}, away: {g:'J',r:2}, label: '1°H vs 2°J' },
  { mn: 112, home: {g:'K',r:2}, away: {g:'L',r:2}, label: '2°K vs 2°L' },
  { mn: 113, home: {g:'B',r:1}, away: {thirds:'EFGIJ'}, label: '1°B vs Mejor 3°(E/F/G/I/J)' },
  { mn: 114, home: {g:'D',r:2}, away: {g:'G',r:2}, label: '2°D vs 2°G' },
  { mn: 115, home: {g:'J',r:1}, away: {g:'H',r:2}, label: '1°J vs 2°H' },
  { mn: 116, home: {g:'K',r:1}, away: {thirds:'DEIJL'}, label: '1°K vs Mejor 3°(D/E/I/J/L)' },
]

function calcStandings(groupMatches: any[], group: string) {
  const teams: Record<string, any> = {}
  groupMatches.filter(m => m.group_name === group).forEach((m: any) => {
    if (!teams[m.home_team_id]) teams[m.home_team_id] = { ...m.home_team, pts:0, gd:0, gf:0 }
    if (!teams[m.away_team_id]) teams[m.away_team_id] = { ...m.away_team, pts:0, gd:0, gf:0 }
    if (m.status !== 'finished') return
    const h = m.home_score, a = m.away_score
    teams[m.home_team_id].gf += h; teams[m.away_team_id].gf += a
    teams[m.home_team_id].gd += h-a; teams[m.away_team_id].gd += a-h
    if (h > a) teams[m.home_team_id].pts += 3
    else if (h < a) teams[m.away_team_id].pts += 3
    else { teams[m.home_team_id].pts += 1; teams[m.away_team_id].pts += 1 }
  })
  return Object.values(teams).sort((a:any,b:any) => b.pts-a.pts||b.gd-a.gd||b.gf-a.gf)
}

function isGroupComplete(groupMatches: any[], group: string) {
  const gm = groupMatches.filter(m => m.group_name === group)
  return gm.length > 0 && gm.every(m => m.status === 'finished')
}

function MatchCard({ match, homeTeam, awayTeam, onSave, pending, label, isKnockout }: any) {
  const [home, setHome] = useState<number|string>(match?.home_score ?? '')
  const [away, setAway] = useState<number|string>(match?.away_score ?? '')
  const [penaltyWinner, setPenaltyWinner] = useState<string>(match?.penalty_winner_id ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const isFinished = match?.status === 'finished'
  const isTied = home !== '' && away !== '' && Number(home) === Number(away)

  useEffect(() => {
    setHome(match?.home_score ?? '')
    setAway(match?.away_score ?? '')
    setPenaltyWinner(match?.penalty_winner_id ?? '')
  }, [match?.id, match?.home_score, match?.away_score, match?.penalty_winner_id])

  if (pending || !homeTeam || !awayTeam) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 opacity-60">
        {label && <p className="text-xs font-bold text-gray-500 dark:text-gray-400 text-center mb-1">{label}</p>}
        <p className="text-xs text-gray-400 text-center mb-2">
          {match?.match_date && new Date(match.match_date).toLocaleString('es-CO', { timeZone:'America/Bogota', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
        </p>
        <p className="text-center text-sm text-gray-400">⏳ Equipos por definir</p>
      </div>
    )
  }

  const handleSave = async () => {
    if (home === '' || away === '') return
    if (isKnockout && isTied && !penaltyWinner) return
    setSaving(true)
    await onSave(match.id, Number(home), Number(away), penaltyWinner || null)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  return (
    <div className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 ${isFinished ? 'border-green-300 dark:border-green-500/30' : 'border-gray-200 dark:border-gray-800'}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          {label && <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-0.5">{label}</p>}
          <p className="text-xs text-gray-400">
            {new Date(match.match_date).toLocaleString('es-CO', { timeZone:'America/Bogota', weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
          </p>
        </div>
        {isFinished && <span className="text-xs bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">✅ Publicado</span>}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2">
          {homeTeam?.flag_url && <img src={homeTeam.flag_url} className="w-8 h-5 object-cover rounded flex-shrink-0"/>}
          <span className="font-bold text-gray-900 dark:text-white text-sm flex-1">{homeTeam?.name}</span>
          <input type="number" inputMode="numeric" min={0} max={20} value={home}
            onChange={e => { const v=parseInt(e.target.value); if(!isNaN(v)&&v>=0&&v<=20) setHome(v); else if(e.target.value==='') setHome('') }}
            className="w-14 h-10 text-center text-xl font-black bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-green-500" placeholder="?"/>
        </div>
        <div className="flex items-center justify-center"><span className="text-xs font-bold text-gray-400">VS</span></div>
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2">
          {awayTeam?.flag_url && <img src={awayTeam.flag_url} className="w-8 h-5 object-cover rounded flex-shrink-0"/>}
          <span className="font-bold text-gray-900 dark:text-white text-sm flex-1">{awayTeam?.name}</span>
          <input type="number" inputMode="numeric" min={0} max={20} value={away}
            onChange={e => { const v=parseInt(e.target.value); if(!isNaN(v)&&v>=0&&v<=20) setAway(v); else if(e.target.value==='') setAway('') }}
            className="w-14 h-10 text-center text-xl font-black bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-green-500" placeholder="?"/>
        </div>
      </div>
      {/* Selector ganador en penales */}
      {isKnockout && isTied && (
        <div className="mt-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/30 rounded-xl p-3">
          <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400 mb-2">🎯 Empate — ¿Quién ganó en penales?</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setPenaltyWinner(homeTeam.id)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${penaltyWinner === homeTeam.id ? 'bg-green-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>
              {homeTeam?.flag_url && <img src={homeTeam.flag_url} className="w-5 h-3 object-cover rounded inline mr-1"/>}
              {homeTeam?.name}
            </button>
            <button onClick={() => setPenaltyWinner(awayTeam.id)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${penaltyWinner === awayTeam.id ? 'bg-green-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>
              {awayTeam?.flag_url && <img src={awayTeam.flag_url} className="w-5 h-3 object-cover rounded inline mr-1"/>}
              {awayTeam?.name}
            </button>
          </div>
        </div>
      )}
      <button onClick={handleSave} disabled={saving || home===''||away===''||(isKnockout && isTied && !penaltyWinner)}
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
  const done = matches.filter((m:any) => m.status==='finished').length
  const standings = useMemo(() => calcStandings(matches, group), [matches])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm">← Grupos</button>
        <div className="flex-1">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Grupo {group}</h2>
          <p className="text-xs text-gray-500">{done}/{matches.length} resultados</p>
        </div>
      </div>
      {done > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500">Posiciones</p>
            {done===matches.length && <span className="text-xs text-green-600 dark:text-green-400 font-bold">✅ Completo</span>}
          </div>
          {standings.map((team:any,i:number) => (
            <div key={team.id} className={`flex items-center gap-3 px-4 py-2 ${i<2?'bg-green-50 dark:bg-green-500/5':''}`}>
              <span className={`text-xs font-black w-4 ${i<2?'text-green-600 dark:text-green-400':'text-gray-400'}`}>{i+1}</span>
              {team.flag_url && <img src={team.flag_url} className="w-6 h-4 object-cover rounded"/>}
              <span className={`text-sm flex-1 ${i<2?'font-bold text-gray-900 dark:text-white':'text-gray-500'}`}>{team.name}</span>
              <span className="text-xs text-gray-400 w-6">{team.gd>0?'+':''}{team.gd}</span>
              <span className={`text-sm font-black w-6 text-right ${i<2?'text-gray-900 dark:text-white':'text-gray-400'}`}>{team.pts}</span>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {matches.map((m:any) => (
          <MatchCard key={m.id} match={m} homeTeam={m.home_team} awayTeam={m.away_team} onSave={onSave}/>
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

  const handleSave = async (matchId: string, home: number, away: number, penaltyWinnerId?: string | null) => {
    const supabase = createClient()
    await supabase.from('matches').update({
      home_score: home, away_score: away, status: 'finished',
      result_published_at: new Date().toISOString(),
      penalty_winner_id: penaltyWinnerId || null
    }).eq('id', matchId)
    await supabase.rpc('update_points_for_match', { p_match_id: matchId })
    await loadMatches()
  }

  const groupMatches = useMemo(() => matches.filter(m => m.stage?.type==='group'), [matches])

  // Calcular standings por grupo
  const allStandings = useMemo(() => {
    const s: Record<string,any[]> = {}
    GROUPS.forEach(g => { s[g] = calcStandings(groupMatches, g) })
    return s
  }, [groupMatches])

  // Calcular mejores terceros
  const bestThirds = useMemo(() => {
    const thirds = GROUPS.map(g => {
      const st = allStandings[g]
      return st?.[2] ? { ...st[2], group: g } : null
    }).filter(Boolean) as any[]
    return thirds.sort((a,b) => b.pts-a.pts||b.gd-a.gd||b.gf-a.gf)
  }, [allStandings])

  // Asignar terceros a slots - solo los 8 mejores clasificados
  const assignedThirds = useMemo(() => {
    const top8 = bestThirds.slice(0, 8) // Solo los 8 mejores terceros
    const assigned = new Set<string>()
    const result: Record<string, any> = {}
    R32_STRUCTURE.forEach(slot => {
      const away = slot.away as any
      if (away.thirds) {
        const best = top8.find(t => away.thirds.includes(t.group) && !assigned.has(t.id))
        if (best) { assigned.add(best.id); result[`${slot.mn}_away`] = best }
      }
    })
    return result
  }, [bestThirds])

  // Resolver equipos R32 desde standings o desde match si ya tiene equipos definidos
  const r32WithTeams = useMemo(() => {
    const r32Matches = matches.filter(m => m.stage?.type==='round_of_32').sort((a,b)=>a.match_number-b.match_number)
    return R32_STRUCTURE.map((slot, i) => {
      const match = r32Matches[i]
      const homeSpec = slot.home as any
      const awaySpec = slot.away as any

      // Si el partido ya tiene equipos reales en la BD, usarlos directamente
      const matchHasTeams = match?.home_team && match?.away_team && 
        match.home_team.short_name !== 'TBD' && match.away_team.short_name !== 'TBD'
      if (matchHasTeams) {
        return { slot, match, homeTeam: match.home_team ?? null, awayTeam: match.away_team ?? null }
      }

      const homeDone = homeSpec.g ? isGroupComplete(groupMatches, homeSpec.g) : false
      const awayDone = awaySpec.g ? isGroupComplete(groupMatches, awaySpec.g) : false

      const homeTeam = homeDone ? allStandings[homeSpec.g]?.[homeSpec.r-1] ?? null : null
      const awayTeam = awaySpec.g
        ? (awayDone ? allStandings[awaySpec.g]?.[awaySpec.r-1] ?? null : null)
        : assignedThirds[`${slot.mn}_away`] ?? null

      return { slot, match, homeTeam, awayTeam }
    })
  }, [matches, allStandings, assignedThirds])

  // Resolver ganadores R32 → Octavos
  const r32Winners = useMemo(() => r32WithTeams.map(({ match, homeTeam, awayTeam }) => {
    if (!match || match.status !== 'finished') return null
    if (match.penalty_winner_id) {
      return match.penalty_winner_id === match.home_team_id ? homeTeam : awayTeam
    }
    return match.home_score > match.away_score ? homeTeam : awayTeam
  }), [r32WithTeams])

  const r16Matches = useMemo(() => matches.filter(m=>m.stage?.type==='round_of_16').sort((a,b)=>a.match_number-b.match_number), [matches])
  // Cruces Octavos oficiales FIFA 2026
  // W101 vs W104 | W103 vs W106 | W102 vs W105 | W107 vs W108
  // W112 vs W111 | W110 vs W109 | W115 vs W114 | W113 vs W116
  const R16_PAIRS = [[0,3],[2,5],[1,4],[6,7],[11,10],[9,8],[14,13],[12,15]]
  const r16WithTeams = useMemo(() => r16Matches.map((match,i) => {
    const pair = R16_PAIRS[i]
    return {
      match,
      homeTeam: pair ? (r32Winners[pair[0]]??null) : null,
      awayTeam: pair ? (r32Winners[pair[1]]??null) : null
    }
  }), [r16Matches, r32Winners])

  const r16Winners = useMemo(() => r16WithTeams.map(({match,homeTeam,awayTeam}) => {
    if (!match||match.status!=='finished') return null
    if (match.penalty_winner_id) {
      return match.penalty_winner_id === match.home_team_id ? homeTeam : awayTeam
    }
    return match.home_score>match.away_score?homeTeam:awayTeam
  }), [r16WithTeams])

  const qfMatches = useMemo(() => matches.filter(m=>m.stage?.type==='quarter_final').sort((a,b)=>a.match_number-b.match_number), [matches])
  const qfWithTeams = useMemo(() => qfMatches.map((match,i) => ({
    match, homeTeam: r16Winners[i*2]??null, awayTeam: r16Winners[i*2+1]??null
  })), [qfMatches, r16Winners])

  const qfWinners = useMemo(() => qfWithTeams.map(({match,homeTeam,awayTeam}) => {
    if (!match||match.status!=='finished') return null
    if (match.penalty_winner_id) return match.penalty_winner_id === match.home_team_id ? homeTeam : awayTeam
    return match.home_score>match.away_score?homeTeam:awayTeam
  }), [qfWithTeams])

  const sfMatches = useMemo(() => matches.filter(m=>m.stage?.type==='semi_final').sort((a,b)=>a.match_number-b.match_number), [matches])
  const sfWithTeams = useMemo(() => sfMatches.map((match,i) => ({
    match, homeTeam: qfWinners[i*2]??null, awayTeam: qfWinners[i*2+1]??null
  })), [sfMatches, qfWinners])

  const sfWinners = useMemo(() => sfWithTeams.map(({match,homeTeam,awayTeam}) => {
    if (!match||match.status!=='finished') return null
    if (match.penalty_winner_id) return match.penalty_winner_id === match.home_team_id ? homeTeam : awayTeam
    return match.home_score>match.away_score?homeTeam:awayTeam
  }), [sfWithTeams])

  const sfLosers = useMemo(() => sfWithTeams.map(({match,homeTeam,awayTeam}) => {
    if (!match||match.status!=='finished') return null
    if (match.penalty_winner_id) return match.penalty_winner_id === match.home_team_id ? awayTeam : homeTeam
    return match.home_score>match.away_score?awayTeam:homeTeam
  }), [sfWithTeams])

  const tpMatch = useMemo(() => matches.find(m=>m.stage?.type==='third_place'), [matches])
  const finalMatch = useMemo(() => matches.find(m=>m.stage?.type==='final'), [matches])

  const groupStats = GROUPS.map(g => ({
    group: g,
    done: groupMatches.filter(m=>m.group_name===g&&m.status==='finished').length,
    total: groupMatches.filter(m=>m.group_name===g).length,
    standings: allStandings[g] ?? []
  }))
  const totalGroupsDone = groupStats.filter(g=>g.done===g.total&&g.total>0).length
  const stageMatchCounts = (type:string) => matches.filter(m=>m.stage?.type===type)
  const stageDone = (type:string) => matches.filter(m=>m.stage?.type===type&&m.status==='finished').length

  if (loading) return <div className="text-gray-500 text-center py-8">Cargando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">📋 Resultados</h1>
        {activeStage==='group' && <span className="text-sm text-gray-500">{totalGroupsDone}/12 grupos</span>}
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-sm font-medium ${msg.startsWith('✅')?'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400':'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700'}`}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STAGES.map(s => {
          const count = s.id==='group' ? groupMatches.length : stageMatchCounts(s.id).length
          const done = s.id==='group' ? groupMatches.filter(m=>m.status==='finished').length : stageDone(s.id)
          return (
            <button key={s.id} onClick={() => { setActiveStage(s.id); setSelectedGroup(null) }}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all flex-shrink-0 ${
                activeStage===s.id ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}>
              <span>{s.icon}</span><span>{s.label}</span>
              {count>0 && <span className={`text-xs px-1.5 rounded-full ${done===count?'bg-green-500/30 text-green-700 dark:text-green-300':'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>{done}/{count}</span>}
            </button>
          )
        })}
      </div>

      {/* GRUPOS */}
      {activeStage==='group' && (
        selectedGroup ? (
          <GroupView group={selectedGroup} matches={groupMatches.filter(m=>m.group_name===selectedGroup)} onSave={handleSave} onBack={() => setSelectedGroup(null)}/>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {groupStats.map(({ group, done, total, standings }) => {
              const isDone = done===total&&total>0
              return (
                <button key={group} onClick={() => setSelectedGroup(group)}
                  className={`bg-white dark:bg-gray-900 border rounded-2xl overflow-hidden text-left transition-all hover:shadow-lg active:scale-95 ${isDone?'border-green-400 dark:border-green-500/40':done>0?'border-yellow-400 dark:border-yellow-500/30':'border-gray-200 dark:border-gray-800'}`}>
                  <div className={`flex items-center justify-between px-4 py-3 ${isDone?'bg-green-50 dark:bg-green-500/10':'bg-gray-50 dark:bg-gray-800/50'}`}>
                    <span className="text-base font-black text-gray-900 dark:text-white">Grupo {group}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDone?'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400':done>0?'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400':'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>{isDone?'✅':`${done}/${total}`}</span>
                  </div>
                  <div className="px-3 py-2 space-y-1">
                    {standings.slice(0,4).map((team:any,i:number) => (
                      <div key={team.id} className={`flex items-center gap-2 py-1 px-1 rounded-lg ${i<2&&done>0?'bg-green-50 dark:bg-green-500/5':''}`}>
                        <span className={`text-xs font-bold w-4 text-center ${i<2&&done>0?'text-green-600 dark:text-green-400':'text-gray-400'}`}>{i+1}</span>
                        {team.flag_url && <img src={team.flag_url} className="w-6 h-4 object-cover rounded flex-shrink-0"/>}
                        <span className={`text-xs flex-1 truncate ${i<2&&done>0?'text-gray-900 dark:text-white font-semibold':'text-gray-500'}`}>{team.short_name}</span>
                        <span className={`text-xs font-black ${i<2&&done>0?'text-gray-900 dark:text-white':'text-gray-400'}`}>{team.pts}</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-1 bg-gray-100 dark:bg-gray-800 mx-3 mb-3 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${isDone?'bg-green-500':'bg-yellow-500'}`} style={{width:`${total>0?(done/total)*100:0}%`}}/>
                  </div>
                </button>
              )
            })}
          </div>
        )
      )}

      {/* RONDA 32 */}
      {activeStage==='thirds' && (() => {
        const allGroups = 'ABCDEFGHIJKL'.split('')
        const thirds = allGroups.map(g => {
          const gm = matches.filter((m:any) => m.group_name === g && m.stage?.type === 'group')
          const standings = calcStandings(gm, g)
          const third = standings[2]
          return third ? { group: g, team: third } : null
        }).filter(Boolean)
        const sorted = thirds.sort((a:any, b:any) => b.team.pts - a.team.pts || b.team.gd - a.team.gd || b.team.gf - a.team.gf)
        const best8 = sorted.slice(0, 8)
        const groupsWithThirds = best8.map((t:any) => t.group).sort().join('')
        return (
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-3">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">📋 Grupos con mejor 3° clasificado</p>
              <p className="text-sm font-black text-blue-900 dark:text-blue-300">{groupsWithThirds || 'Calculando...'}</p>
              <p className="text-xs text-blue-500 mt-1">Comparar con tabla FIFA para determinar cruces en R32</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sorted.map((item:any, i:number) => (
                <div key={item.group} className={`bg-white dark:bg-gray-900 border rounded-2xl p-3 ${i < 8 ? 'border-green-300 dark:border-green-500/30' : 'border-gray-200 dark:border-gray-700 opacity-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${i < 8 ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      {i < 8 ? `✅ Clasifica` : '❌ No clasifica'}
                    </span>
                    <span className="text-xs font-bold text-gray-400">Grupo {item.group}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.team?.flag_url && <img src={item.team.flag_url} className="w-8 h-5 object-cover rounded"/>}
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{item.team?.short_name}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                    <div>
                      <p className="text-lg font-black text-green-600 dark:text-green-400">{item.team?.pts}</p>
                      <p className="text-xs text-gray-400">Pts</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-blue-600 dark:text-blue-400">{item.team?.gd > 0 ? '+' : ''}{item.team?.gd}</p>
                      <p className="text-xs text-gray-400">DG</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-gray-600 dark:text-gray-400">{item.team?.gf}</p>
                      <p className="text-xs text-gray-400">GF</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {activeStage==='round_of_32' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {r32WithTeams.map(({ slot, match, homeTeam, awayTeam }) => (
            <MatchCard key={slot.mn} match={match} homeTeam={homeTeam} awayTeam={awayTeam} onSave={handleSave} pending={!homeTeam||!awayTeam} label={slot.label} isKnockout={true}/>
          ))}
        </div>
      )}

      {/* OCTAVOS */}
      {activeStage==='round_of_16' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {r16WithTeams.map(({ match, homeTeam, awayTeam }, i) => (
            <MatchCard key={i} match={match}
              homeTeam={homeTeam || { name: 'Por definir', short_name: '?', flag_url: null }}
              awayTeam={awayTeam || { name: 'Por definir', short_name: '?', flag_url: null }}
              onSave={handleSave}
              pending={!homeTeam && !awayTeam}
              label={`Octavos ${i+1} · W${100+i*2+1} vs W${100+i*2+2}`}
              isKnockout={true}/>
          ))}
        </div>
      )}

      {/* CUARTOS */}
      {activeStage==='quarter_final' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {qfWithTeams.map(({ match, homeTeam, awayTeam }, i) => (
            <MatchCard key={i} match={match}
              homeTeam={homeTeam || { name: 'Por definir', short_name: '?', flag_url: null }}
              awayTeam={awayTeam || { name: 'Por definir', short_name: '?', flag_url: null }}
              onSave={handleSave}
              pending={!homeTeam && !awayTeam}
              label={`Cuartos ${i+1}`}
              isKnockout={true}/>
          ))}
        </div>
      )}

      {/* SEMIS */}
      {activeStage==='semi_final' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {sfWithTeams.map(({ match, homeTeam, awayTeam }, i) => (
            <MatchCard key={i} match={match}
              homeTeam={homeTeam || { name: 'Por definir', short_name: '?', flag_url: null }}
              awayTeam={awayTeam || { name: 'Por definir', short_name: '?', flag_url: null }}
              onSave={handleSave}
              pending={!homeTeam && !awayTeam}
              label={`Semifinal ${i+1}`}
              isKnockout={true}/>
          ))}
        </div>
      )}

      {/* TERCER LUGAR */}
      {activeStage==='third_place' && tpMatch && (
        <div className="max-w-md">
          <MatchCard match={tpMatch}
            homeTeam={sfLosers[0] || { name: 'Por definir', short_name: '?', flag_url: null }}
            awayTeam={sfLosers[1] || { name: 'Por definir', short_name: '?', flag_url: null }}
            onSave={handleSave}
            pending={!sfLosers[0] && !sfLosers[1]}
            label="3er Lugar"
            isKnockout={true}/>
        </div>
      )}

      {/* FINAL */}
      {activeStage==='final' && finalMatch && (
        <div className="max-w-md">
          <MatchCard match={finalMatch}
            homeTeam={sfWinners[0] || { name: 'Por definir', short_name: '?', flag_url: null }}
            awayTeam={sfWinners[1] || { name: 'Por definir', short_name: '?', flag_url: null }}
            onSave={handleSave}
            pending={!sfWinners[0] && !sfWinners[1]}
            label="Final"
            isKnockout={true}/>
        </div>
      )}
    </div>
  )
}
