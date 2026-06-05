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

// Cruces R32 según FIFA 2026
const R32_MATCHUPS = [
  { id: 0, home: {g:'A',r:1}, away: {g:'B',r:2}, label: '1°A vs 2°B' },
  { id: 1, home: {g:'C',r:1}, away: {g:'D',r:2}, label: '1°C vs 2°D' },
  { id: 2, home: {g:'E',r:1}, away: {g:'F',r:2}, label: '1°E vs 2°F' },
  { id: 3, home: {g:'G',r:1}, away: {g:'H',r:2}, label: '1°G vs 2°H' },
  { id: 4, home: {g:'I',r:1}, away: {g:'J',r:2}, label: '1°I vs 2°J' },
  { id: 5, home: {g:'K',r:1}, away: {g:'L',r:2}, label: '1°K vs 2°L' },
  { id: 6, home: {g:'B',r:1}, away: {g:'A',r:2}, label: '1°B vs 2°A' },
  { id: 7, home: {g:'D',r:1}, away: {g:'C',r:2}, label: '1°D vs 2°C' },
  { id: 8, home: {g:'F',r:1}, away: {g:'E',r:2}, label: '1°F vs 2°E' },
  { id: 9, home: {g:'H',r:1}, away: {g:'G',r:2}, label: '1°H vs 2°G' },
  { id: 10, home: {g:'J',r:1}, away: {g:'I',r:2}, label: '1°J vs 2°I' },
  { id: 11, home: {g:'L',r:1}, away: {g:'K',r:2}, label: '1°L vs 2°K' },
]

function MatchResultCard({ match, onSave }: any) {
  const [home, setHome] = useState<number|string>(match?.home_score ?? '')
  const [away, setAway] = useState<number|string>(match?.away_score ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const isFinished = match?.status === 'finished'

  useEffect(() => {
    setHome(match?.home_score ?? '')
    setAway(match?.away_score ?? '')
  }, [match?.id])

  if (!match) return null

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
          {new Date(match.match_date).toLocaleString('es-CO', { timeZone: 'America/Bogota', weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
                className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${home===n ? 'bg-green-600 text-white shadow' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
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
                className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${away===n ? 'bg-green-600 text-white shadow' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving || home === '' || away === ''}
        className="mt-3 w-full py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl disabled:opacity-50 transition-all">
        {saved ? '✅ Publicado' : saving ? 'Guardando...' : isFinished ? '🔄 Actualizar resultado' : '📋 Publicar resultado'}
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
        <button onClick={onBack} className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">
          ← Grupos
        </button>
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
                <span className={`text-xs font-black w-4 text-center ${i < 2 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>{i+1}</span>
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

  useEffect(() => { loadMatches() }, [])

  const loadMatches = async () => {
    const { data } = await createClient()
      .from('matches')
      .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), stage:stages(*)')
      .order('match_date')
    setMatches(data ?? [])
    setLoading(false)
  }

  // Calcular standings por grupo
  const groupStandings = useMemo(() => {
    const s: Record<string, any[]> = {}
    GROUPS.forEach(g => {
      const gm = matches.filter(m => m.group_name === g)
      const teams: Record<string, any> = {}
      gm.forEach((m: any) => {
        if (!teams[m.home_team_id]) teams[m.home_team_id] = { ...m.home_team, pts: 0, gd: 0, gf: 0, played: 0 }
        if (!teams[m.away_team_id]) teams[m.away_team_id] = { ...m.away_team, pts: 0, gd: 0, gf: 0, played: 0 }
        if (m.status !== 'finished') return
        const h = m.home_score, a = m.away_score
        teams[m.home_team_id].gf += h; teams[m.away_team_id].gf += a
        teams[m.home_team_id].gd += h - a; teams[m.away_team_id].gd += a - h
        teams[m.home_team_id].played++; teams[m.away_team_id].played++
        if (h > a) teams[m.home_team_id].pts += 3
        else if (h < a) teams[m.away_team_id].pts += 3
        else { teams[m.home_team_id].pts += 1; teams[m.away_team_id].pts += 1 }
      })
      s[g] = Object.values(teams).sort((a: any, b: any) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    })
    return s
  }, [matches])

  const isGroupComplete = (g: string) => {
    const gm = matches.filter(m => m.group_name === g)
    return gm.length > 0 && gm.every(m => m.status === 'finished')
  }

  // Calcular R32 automáticamente según standings reales
  const r32Matchups = useMemo(() => R32_MATCHUPS.map(matchup => {
    const homeDone = isGroupComplete(matchup.home.g)
    const awayDone = isGroupComplete(matchup.away.g)
    const homeTeam = homeDone ? groupStandings[matchup.home.g]?.[matchup.home.r - 1] : null
    const awayTeam = awayDone ? groupStandings[matchup.away.g]?.[matchup.away.r - 1] : null

    // Buscar partido real en DB
    const realMatch = matches.find(m =>
      m.stage?.type === 'round_of_32' &&
      homeTeam && awayTeam && (
        (m.home_team_id === homeTeam.id && m.away_team_id === awayTeam.id) ||
        (m.away_team_id === homeTeam.id && m.home_team_id === awayTeam.id)
      )
    )

    return {
      ...matchup,
      homeTeam,
      awayTeam,
      homeDone,
      awayDone,
      canShow: homeDone && awayDone,
      realMatch,
      winner: realMatch?.status === 'finished'
        ? (realMatch.home_score > realMatch.away_score
          ? (realMatch.home_team_id === homeTeam?.id ? homeTeam : awayTeam)
          : (realMatch.away_team_id === awayTeam?.id ? awayTeam : homeTeam))
        : null
    }
  }), [groupStandings, matches])

  // Ganadores de R32 para Octavos
  const getR32Winner = (matchupId: number) => r32Matchups[matchupId]?.winner ?? null

  // Octavos: ganadores de R32 en pares
  const r16Matchups = useMemo(() => [
    { id: 'r16_0', home: getR32Winner(0), away: getR32Winner(1), label: 'G1 vs G2' },
    { id: 'r16_1', home: getR32Winner(2), away: getR32Winner(3), label: 'G3 vs G4' },
    { id: 'r16_2', home: getR32Winner(4), away: getR32Winner(5), label: 'G5 vs G6' },
    { id: 'r16_3', home: getR32Winner(6), away: getR32Winner(7), label: 'G7 vs G8' },
    { id: 'r16_4', home: getR32Winner(8), away: getR32Winner(9), label: 'G9 vs G10' },
    { id: 'r16_5', home: getR32Winner(10), away: getR32Winner(11), label: 'G11 vs G12' },
  ].map(m => ({
    ...m,
    canShow: !!(m.home && m.away),
    realMatch: matches.find(rm =>
      rm.stage?.type === 'round_of_16' && m.home && m.away && (
        (rm.home_team_id === m.home?.id && rm.away_team_id === m.away?.id) ||
        (rm.away_team_id === m.home?.id && rm.home_team_id === m.away?.id)
      )
    ),
    winner: null as any
  })).map(m => ({
    ...m,
    winner: m.realMatch?.status === 'finished'
      ? (m.realMatch.home_score > m.realMatch.away_score
        ? (m.realMatch.home_team_id === m.home?.id ? m.home : m.away)
        : (m.realMatch.away_team_id === m.away?.id ? m.away : m.home))
      : null
  })), [r32Matchups, matches])

  const getR16Winner = (idx: number) => r16Matchups[idx]?.winner ?? null

  // Cuartos
  const qfMatchups = useMemo(() => [
    { id: 'qf_0', home: getR16Winner(0), away: getR16Winner(1), label: 'QF1' },
    { id: 'qf_1', home: getR16Winner(2), away: getR16Winner(3), label: 'QF2' },
    { id: 'qf_2', home: getR16Winner(4), away: getR16Winner(5), label: 'QF3' },
  ].map(m => ({
    ...m,
    canShow: !!(m.home && m.away),
    realMatch: matches.find(rm =>
      rm.stage?.type === 'quarter_final' && m.home && m.away && (
        (rm.home_team_id === m.home?.id && rm.away_team_id === m.away?.id) ||
        (rm.away_team_id === m.home?.id && rm.home_team_id === m.away?.id)
      )
    ),
    winner: null as any,
    loser: null as any,
  })).map(m => {
    const w = m.realMatch?.status === 'finished'
      ? (m.realMatch.home_score > m.realMatch.away_score
        ? (m.realMatch.home_team_id === m.home?.id ? m.home : m.away)
        : (m.realMatch.away_team_id === m.away?.id ? m.away : m.home))
      : null
    const l = w ? (w.id === m.home?.id ? m.away : m.home) : null
    return { ...m, winner: w, loser: l }
  }), [r16Matchups, matches])

  const getQFWinner = (idx: number) => qfMatchups[idx]?.winner ?? null
  const getQFLoser = (idx: number) => qfMatchups[idx]?.loser ?? null

  // Semis
  const sfMatchups = useMemo(() => [
    { id: 'sf_0', home: getQFWinner(0), away: getQFWinner(1), label: 'SF1' },
    { id: 'sf_1', home: getQFWinner(2), away: getQFWinner(2), label: 'SF2' },
  ].map(m => ({
    ...m,
    canShow: !!(m.home && m.away),
    realMatch: matches.find(rm =>
      rm.stage?.type === 'semi_final' && m.home && m.away && (
        (rm.home_team_id === m.home?.id && rm.away_team_id === m.away?.id) ||
        (rm.away_team_id === m.home?.id && rm.home_team_id === m.away?.id)
      )
    ),
    winner: null as any,
    loser: null as any,
  })).map(m => {
    const w = m.realMatch?.status === 'finished'
      ? (m.realMatch.home_score > m.realMatch.away_score
        ? (m.realMatch.home_team_id === m.home?.id ? m.home : m.away)
        : (m.realMatch.away_team_id === m.away?.id ? m.away : m.home))
      : null
    const l = w ? (w.id === m.home?.id ? m.away : m.home) : null
    return { ...m, winner: w, loser: l }
  }), [qfMatchups, matches])

  const handleSave = async (matchId: string, home: number, away: number) => {
    const supabase = createClient()
    await supabase.from('matches').update({
      home_score: home, away_score: away,
      status: 'finished',
      result_published_at: new Date().toISOString(),
    }).eq('id', matchId)
    await supabase.rpc('update_points_for_match', { p_match_id: matchId })
    setMatches(prev => prev.map(m => m.id === matchId
      ? { ...m, home_score: home, away_score: away, status: 'finished' }
      : m
    ))
  }

  // Crear partido en DB si no existe
  const ensureMatch = async (stageType: string, homeTeam: any, awayTeam: any, date: string) => {
    if (!homeTeam || !awayTeam) return null
    const existing = matches.find(m =>
      m.stage?.type === stageType && (
        (m.home_team_id === homeTeam.id && m.away_team_id === awayTeam.id) ||
        (m.away_team_id === homeTeam.id && m.home_team_id === awayTeam.id)
      )
    )
    if (existing) return existing

    const supabase = createClient()
    const { data: stage } = await supabase.from('stages').select('id').eq('type', stageType).single()
    if (!stage) return null

    const { data: newMatch } = await supabase.from('matches').insert({
      stage_id: stage.id,
      home_team_id: homeTeam.id,
      away_team_id: awayTeam.id,
      match_date: date,
      status: 'scheduled'
    }).select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), stage:stages(*)').single()

    if (newMatch) {
      setMatches(prev => [...prev, newMatch])
      return newMatch
    }
    return null
  }

  const groupMatches = matches.filter(m => m.stage?.type === 'group')
  const groupStats = GROUPS.map(g => ({
    group: g,
    done: groupMatches.filter(m => m.group_name === g && m.status === 'finished').length,
    total: groupMatches.filter(m => m.group_name === g).length
  }))
  const totalGroupsDone = groupStats.filter(g => g.done === g.total && g.total > 0).length

  // Renderizar cruce genérico
  const renderMatchup = (matchup: any, stageType: string, date: string) => {
    if (!matchup.canShow) {
      return (
        <div key={matchup.id} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <p className="text-xs text-gray-400 text-center mb-2">{matchup.label}</p>
          <div className="flex items-center gap-3 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded"/>
              <span className="text-xs text-gray-400 italic">Por definir</span>
            </div>
            <span className="text-gray-300 dark:text-gray-600">vs</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 italic">Por definir</span>
              <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded"/>
            </div>
          </div>
          <p className="text-xs text-center text-gray-400 mt-2">⏳ Esperando resultados anteriores</p>
        </div>
      )
    }

    // Buscar o crear partido
    const realMatch = matchup.realMatch || matches.find(m =>
      m.stage?.type === stageType && matchup.home && matchup.away && (
        (m.home_team_id === matchup.home?.id && m.away_team_id === matchup.away?.id) ||
        (m.away_team_id === matchup.home?.id && m.home_team_id === matchup.away?.id)
      )
    )

    if (!realMatch) {
      return (
        <div key={matchup.id} className="bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-4">
          <p className="text-xs text-blue-500 text-center mb-3">{matchup.label}</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 flex-1 justify-end">
              {matchup.home?.flag_url && <img src={matchup.home.flag_url} className="w-7 h-5 object-cover rounded"/>}
              <span className="font-bold text-gray-900 dark:text-white text-sm">{matchup.home?.name}</span>
            </div>
            <span className="text-gray-400 text-sm">vs</span>
            <div className="flex items-center gap-2 flex-1">
              <span className="font-bold text-gray-900 dark:text-white text-sm">{matchup.away?.name}</span>
              {matchup.away?.flag_url && <img src={matchup.away.flag_url} className="w-7 h-5 object-cover rounded"/>}
            </div>
          </div>
          <button onClick={() => ensureMatch(stageType, matchup.home, matchup.away, date)}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all">
            ➕ Crear partido
          </button>
        </div>
      )
    }

    return <MatchResultCard key={realMatch.id} match={realMatch} onSave={handleSave}/>
  }

  if (loading) return <div className="text-gray-500 text-center py-8">Cargando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">📋 Resultados</h1>
        {activeStage === 'group' && (
          <span className="text-sm text-gray-500">{totalGroupsDone}/12 grupos completos</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STAGES.map(s => {
          const stageMatchCount = s.id === 'group'
            ? groupMatches.length
            : matches.filter(m => m.stage?.type === s.id).length
          const stageDone = s.id === 'group'
            ? groupMatches.filter(m => m.status === 'finished').length
            : matches.filter(m => m.stage?.type === s.id && m.status === 'finished').length

          return (
            <button key={s.id} onClick={() => { setActiveStage(s.id); setSelectedGroup(null) }}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1.5 ${
                activeStage === s.id ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}>
              <span>{s.icon}</span>
              <span>{s.label}</span>
              {stageMatchCount > 0 && (
                <span className={`text-xs px-1.5 rounded-full ${stageDone === stageMatchCount ? 'bg-green-500/30 text-green-700 dark:text-green-300' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                  {stageDone}/{stageMatchCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* GRUPOS */}
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
            {groupStats.map(({ group, done, total }) => {
              const isDone = done === total && total > 0
              const standings = groupStandings[group] ?? []
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
                    {standings.slice(0, 4).map((team: any, i: number) => (
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

      {/* RONDA DE 32 */}
      {activeStage === 'round_of_32' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Los cruces aparecen automáticamente cuando ambos grupos están completos.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {r32Matchups.map(m => renderMatchup(m, 'round_of_32', '2026-06-29T17:00:00Z'))}
          </div>
        </div>
      )}

      {/* OCTAVOS */}
      {activeStage === 'round_of_16' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Disponible cuando se completen los cruces de Ronda de 32.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {r16Matchups.map(m => renderMatchup(m, 'round_of_16', '2026-07-05T17:00:00Z'))}
          </div>
        </div>
      )}

      {/* CUARTOS */}
      {activeStage === 'quarter_final' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Disponible cuando se completen los Octavos.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {qfMatchups.map(m => renderMatchup(m, 'quarter_final', '2026-07-09T17:00:00Z'))}
          </div>
        </div>
      )}

      {/* SEMIS */}
      {activeStage === 'semi_final' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Disponible cuando se completen los Cuartos.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {sfMatchups.map(m => renderMatchup(m, 'semi_final', '2026-07-14T17:00:00Z'))}
          </div>
        </div>
      )}

      {/* TERCER LUGAR */}
      {activeStage === 'third_place' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Los perdedores de semifinales.</p>
          {renderMatchup({
            id: 'tp',
            home: sfMatchups[0]?.loser,
            away: sfMatchups[1]?.loser,
            canShow: !!(sfMatchups[0]?.loser && sfMatchups[1]?.loser),
            label: 'Tercer Puesto',
            realMatch: matches.find(m => m.stage?.type === 'third_place')
          }, 'third_place', '2026-07-18T17:00:00Z')}
        </div>
      )}

      {/* FINAL */}
      {activeStage === 'final' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Los ganadores de semifinales.</p>
          {renderMatchup({
            id: 'final',
            home: sfMatchups[0]?.winner,
            away: sfMatchups[1]?.winner,
            canShow: !!(sfMatchups[0]?.winner && sfMatchups[1]?.winner),
            label: 'Gran Final',
            realMatch: matches.find(m => m.stage?.type === 'final')
          }, 'final', '2026-07-19T17:00:00Z')}
        </div>
      )}
    </div>
  )
}
