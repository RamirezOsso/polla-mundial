'use client'
import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'
import { assignThirdsOfficially } from '@/lib/fifaThirds'

const GROUPS = 'ABCDEFGHIJKL'.split('')

const STAGES = [
  { id: 'r32', label: 'Ronda de 32', pts: 5 },
  { id: 'r16', label: 'Octavos', pts: 5 },
  { id: 'qf', label: 'Cuartos', pts: 7 },
  { id: 'sf', label: 'Semis', pts: 10 },
  { id: 'tp', label: 'Tercer Lugar', pts: 10 },
  { id: 'final', label: 'Final', pts: 15 },
]

const R32_OFFICIAL = [
  { idx: 0,  home: {g:'A',r:2}, away: {g:'B',r:2}, label: '2°A vs 2°B' },
  { idx: 1,  home: {g:'C',r:1}, away: {g:'F',r:2}, label: '1°C vs 2°F' },
  { idx: 2,  home: {g:'E',r:1}, away: {thirds:['A','B','C','D','F']}, label: '1°E vs Mejor 3°(A/B/C/D/F)' },
  { idx: 3,  home: {g:'F',r:1}, away: {g:'C',r:2}, label: '1°F vs 2°C' },
  { idx: 4,  home: {g:'E',r:2}, away: {g:'I',r:2}, label: '2°E vs 2°I' },
  { idx: 5,  home: {g:'I',r:1}, away: {thirds:['C','D','F','G','H']}, label: '1°I vs Mejor 3°(C/D/F/G/H)' },
  { idx: 6,  home: {g:'A',r:1}, away: {thirds:['C','E','F','H','I']}, label: '1°A vs Mejor 3°(C/E/F/H/I)' },
  { idx: 7,  home: {g:'L',r:1}, away: {thirds:['E','H','I','J','K']}, label: '1°L vs Mejor 3°(E/H/I/J/K)' },
  { idx: 8,  home: {g:'G',r:1}, away: {thirds:['A','E','H','I','J']}, label: '1°G vs Mejor 3°(A/E/H/I/J)' },
  { idx: 9,  home: {g:'D',r:1}, away: {thirds:['B','E','F','I','J']}, label: '1°D vs Mejor 3°(B/E/F/I/J)' },
  { idx: 10, home: {g:'H',r:1}, away: {g:'J',r:2}, label: '1°H vs 2°J' },
  { idx: 11, home: {g:'K',r:2}, away: {g:'L',r:2}, label: '2°K vs 2°L' },
  { idx: 12, home: {g:'B',r:1}, away: {thirds:['D','E','I','J','L']}, label: '1°B vs Mejor 3°(D/E/I/J/L)' },
  { idx: 13, home: {g:'D',r:2}, away: {g:'G',r:2}, label: '2°D vs 2°G' },
  { idx: 14, home: {g:'J',r:1}, away: {g:'H',r:2}, label: '1°J vs 2°H' },
  { idx: 15, home: {g:'K',r:1}, away: {thirds:['D','E','I','J','L']}, label: '1°K vs Mejor 3°(D/E/I/J/L)' },
]

function calcStandings(matches: any[], predMap: Map<string, any>, group: string) {
  const teams: Record<string, any> = {}
  matches.filter(m => m.group_name === group).forEach((m: any) => {
    if (!teams[m.home_team_id]) teams[m.home_team_id] = { ...m.home_team, pts: 0, gd: 0, gf: 0, ga: 0 }
    if (!teams[m.away_team_id]) teams[m.away_team_id] = { ...m.away_team, pts: 0, gd: 0, gf: 0, ga: 0 }
    const pred = predMap.get(m.id)
    const isFinished = m.status === 'finished'
    const h = isFinished ? m.home_score : pred?.home_score
    const a = isFinished ? m.away_score : pred?.away_score
    if (h == null || a == null) return
    teams[m.home_team_id].gf += h; teams[m.away_team_id].gf += a
    teams[m.home_team_id].ga += a; teams[m.away_team_id].ga += h
    teams[m.home_team_id].gd += h - a; teams[m.away_team_id].gd += a - h
    if (h > a) teams[m.home_team_id].pts += 3
    else if (h < a) teams[m.away_team_id].pts += 3
    else { teams[m.home_team_id].pts += 1; teams[m.away_team_id].pts += 1 }
  })
  return Object.values(teams).sort((a: any, b: any) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
}

function getWinner(predMap: Map<string, any>, match: any, homeTeam: any, awayTeam: any) {
  if (!match || !homeTeam || !awayTeam) return null
  if (match.status === 'finished') {
    return match.home_score > match.away_score ? match.home_team : match.away_team
  }
  const pred = predMap.get(match.id)
  if (!pred || pred.home_score == null || pred.away_score == null) return null
  if (Number(pred.home_score) === Number(pred.away_score)) return null
  return Number(pred.home_score) > Number(pred.away_score) ? homeTeam : awayTeam
}

function getLoser(predMap: Map<string, any>, match: any, homeTeam: any, awayTeam: any) {
  const winner = getWinner(predMap, match, homeTeam, awayTeam)
  if (!winner) return null
  return winner.id === homeTeam?.id ? awayTeam : homeTeam
}

function ScoreInput({ value, onChange }: { value: number|string, onChange: (n: number|string) => void }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      pattern="[0-9]*"
      min={0}
      max={20}
      value={value}
      onChange={e => {
        const v = e.target.value
        if (v === '') { onChange(''); return }
        const n = parseInt(v)
        if (isNaN(n)) return
        if (n < 0) { onChange(0); return }
        if (n > 20) { onChange(20); return }
        onChange(n)
      }}
      placeholder="?"
      className="w-16 h-16 text-center text-3xl font-black bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all"
    />
  )
}

function MatchCard({ match, homeTeam, awayTeam, prediction, onSave, pts, isLocked, label, pendingMsg }: any) {
  const [home, setHome] = useState<number|string>(prediction?.home_score ?? '')
  const [away, setAway] = useState<number|string>(prediction?.away_score ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isPending = !homeTeam || !awayTeam || homeTeam?.short_name === 'TBD' || awayTeam?.short_name === 'TBD'
  const hasPred = prediction != null
  const isFinished = match?.status === 'finished'
  const winner = hasPred && Number(prediction?.home_score) !== Number(prediction?.away_score)
    ? (Number(prediction?.home_score) > Number(prediction?.away_score) ? homeTeam : awayTeam) : null

  const handleSave = async () => {
    if (home === '' || away === '' || Number(home) === Number(away)) return
    setSaving(true)
    await onSave(match.id, Number(home), Number(away))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  return (
    <div className={`bg-white dark:bg-gray-900 border rounded-2xl overflow-hidden transition-all ${
      isPending ? 'border-gray-200 dark:border-gray-800 opacity-60' :
      hasPred ? 'border-green-300 dark:border-green-500/30' : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50">
        <span className="text-xs text-gray-500 truncate flex-1">{label}</span>
        <span className="text-xs font-bold text-yellow-500 ml-2 flex-shrink-0">+{pts}pts</span>
      </div>

      {isPending ? (
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-gray-400">⏳ {pendingMsg || 'Completa la fase anterior'}</p>
        </div>
      ) : isFinished ? (
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1 justify-end">
              {homeTeam?.flag_url && <img src={homeTeam.flag_url} className="w-7 h-5 object-cover rounded"/>}
              <span className="font-bold text-gray-900 dark:text-white text-sm">{homeTeam?.short_name}</span>
            </div>
            <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-center min-w-[70px]">
              <span className="text-xl font-black text-gray-900 dark:text-white">{match.home_score}-{match.away_score}</span>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="font-bold text-gray-900 dark:text-white text-sm">{awayTeam?.short_name}</span>
              {awayTeam?.flag_url && <img src={awayTeam.flag_url} className="w-7 h-5 object-cover rounded"/>}
            </div>
          </div>
          {hasPred && (
            <div className={`text-center text-xs font-bold px-3 py-1.5 rounded-xl ${
              prediction.points_earned === 5 ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' :
              prediction.points_earned >= 3 ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' :
              'bg-gray-100 dark:bg-gray-700 text-gray-500'
            }`}>Mi pronóstico: {prediction.home_score}-{prediction.away_score} · +{prediction.points_earned ?? 0}pts</div>
          )}
        </div>
      ) : isLocked ? (
        <div className="p-3 flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 justify-end">
            {homeTeam?.flag_url && <img src={homeTeam.flag_url} className="w-7 h-5 object-cover rounded"/>}
            <span className="font-bold text-gray-900 dark:text-white text-sm">{homeTeam?.short_name}</span>
          </div>
          <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl min-w-[70px] text-center">
            {hasPred ? <span className="text-sm font-black text-blue-500">{prediction.home_score}-{prediction.away_score}</span>
              : <span className="text-xs text-gray-400">🔒</span>}
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="font-bold text-gray-900 dark:text-white text-sm">{awayTeam?.short_name}</span>
            {awayTeam?.flag_url && <img src={awayTeam.flag_url} className="w-7 h-5 object-cover rounded"/>}
          </div>
        </div>
      ) : (
        <div className="p-3 space-y-3">
          {/* Local */}
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2">
            {homeTeam?.flag_url && <img src={homeTeam.flag_url} className="w-8 h-5 object-cover rounded flex-shrink-0"/>}
            <span className={`text-sm font-bold flex-1 ${winner?.id === homeTeam?.id ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
              {homeTeam?.name}{winner?.id === homeTeam?.id && ' ✓'}
            </span>
            <ScoreInput value={home} onChange={setHome}/>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"/>
            <span className="text-xs font-bold text-gray-400 px-2">VS</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"/>
          </div>

          {/* Visitante */}
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2">
            {awayTeam?.flag_url && <img src={awayTeam.flag_url} className="w-8 h-5 object-cover rounded flex-shrink-0"/>}
            <span className={`text-sm font-bold flex-1 ${winner?.id === awayTeam?.id ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
              {winner?.id === awayTeam?.id && '✓ '}{awayTeam?.name}
            </span>
            <ScoreInput value={away} onChange={setAway}/>
          </div>

          {Number(home) === Number(away) && home !== '' && (
            <p className="text-xs text-red-500 text-center">No puede haber empate en eliminatorias</p>
          )}
          <button onClick={handleSave}
            disabled={saving || home === '' || away === '' || Number(home) === Number(away)}
            className={`w-full py-2.5 font-bold rounded-xl text-sm transition-all disabled:opacity-40 ${
              saved ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-300 dark:border-green-500/30'
                : 'bg-gradient-to-r from-green-600 to-green-500 text-white'
            }`}>
            {saved ? '✅ ¡Guardado!' : saving ? 'Guardando...' : hasPred ? '🔄 Actualizar' : '💾 Guardar'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function CaminoPage() {
  const { user } = useAuth()
  const { matches, loading } = useMatches()
  const { predictions, savePrediction, isPredictionsOpen } = usePredictions(user?.id)
  const [activeStage, setActiveStage] = useState('r32')

  const predMap = useMemo(() => new Map(predictions.map(p => [p.match_id, p])), [predictions])
  const groupMatches = useMemo(() => matches.filter(m => m.stage?.type === 'group'), [matches])

  const groupStandings = useMemo(() => {
    const s: Record<string, any[]> = {}
    GROUPS.forEach(g => { s[g] = calcStandings(groupMatches, predMap, g) })
    return s
  }, [groupMatches, predMap])

  const isGroupDone = (g: string) => {
    const gm = groupMatches.filter(m => m.group_name === g)
    return gm.length > 0 && gm.every(m => predMap.has(m.id))
  }

  const allThirds = useMemo(() => GROUPS.map(g => {
    const t = groupStandings[g]?.[2]
    return t ? { ...t, group: g } : null
  }).filter(Boolean) as any[], [groupStandings])

  const sortedThirds = useMemo(() =>
    [...allThirds].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
  , [allThirds])

  const assignedThirds = useMemo(() => {
    const bestThirds = sortedThirds.slice(0, 8)
    const qualifiedGroups = bestThirds.map((t: any) => t.group)
    const teamsByGroup: Record<string, any> = {}
    bestThirds.forEach((t: any) => { teamsByGroup[t.group] = t })
    const officialMap = assignThirdsOfficially(qualifiedGroups, teamsByGroup)
    const result: Record<string, any> = {}
    R32_OFFICIAL.forEach(slot => {
      const homeSpec = slot.home as any
      const awaySpec = slot.away as any
      if (awaySpec.thirds && homeSpec.g) {
        const assigned = officialMap[homeSpec.g]
        if (assigned) result[`${slot.idx}_away`] = assigned
      }
      if (homeSpec.thirds && awaySpec.g) {
        const assigned = officialMap[awaySpec.g]
        if (assigned) result[`${slot.idx}_home`] = assigned
      }
    })
    return result
  }, [sortedThirds])

  const r32Matches = useMemo(() => matches.filter(m => m.stage?.type === 'round_of_32').sort((a,b) => a.match_number - b.match_number), [matches])
  const r16Matches = useMemo(() => matches.filter(m => m.stage?.type === 'round_of_16').sort((a,b) => a.match_number - b.match_number), [matches])
  const qfMatches  = useMemo(() => matches.filter(m => m.stage?.type === 'quarter_final').sort((a,b) => a.match_number - b.match_number), [matches])
  const sfMatches  = useMemo(() => matches.filter(m => m.stage?.type === 'semi_final').sort((a,b) => a.match_number - b.match_number), [matches])
  const tpMatch    = useMemo(() => matches.find(m => m.stage?.type === 'third_place'), [matches])
  const finalMatch = useMemo(() => matches.find(m => m.stage?.type === 'final'), [matches])

  const r32WithTeams = useMemo(() => R32_OFFICIAL.map(slot => {
    const match = r32Matches[slot.idx]
    const homeSpec = slot.home as any
    const awaySpec = slot.away as any
    const homeTeam = homeSpec.g
      ? (isGroupDone(homeSpec.g) ? groupStandings[homeSpec.g]?.[homeSpec.r - 1] ?? null : null)
      : assignedThirds[`${slot.idx}_home`] ?? null
    const awayTeam = awaySpec.g
      ? (isGroupDone(awaySpec.g) ? groupStandings[awaySpec.g]?.[awaySpec.r - 1] ?? null : null)
      : assignedThirds[`${slot.idx}_away`] ?? null
    return { ...slot, match, homeTeam, awayTeam }
  }), [r32Matches, groupStandings, assignedThirds])

  const r32Winners = useMemo(() =>
    r32WithTeams.map(s => getWinner(predMap, s.match, s.homeTeam, s.awayTeam))
  , [r32WithTeams, predMap])

  const r16WithTeams = useMemo(() => r16Matches.map((match, i) => ({
    match,
    homeTeam: r32Winners[i * 2] ?? null,
    awayTeam: r32Winners[i * 2 + 1] ?? null,
    label: `Octavos ${i+1}`
  })), [r16Matches, r32Winners])

  const r16Winners = useMemo(() =>
    r16WithTeams.map(s => getWinner(predMap, s.match, s.homeTeam, s.awayTeam))
  , [r16WithTeams, predMap])

  const qfWithTeams = useMemo(() => qfMatches.map((match, i) => ({
    match,
    homeTeam: r16Winners[i * 2] ?? null,
    awayTeam: r16Winners[i * 2 + 1] ?? null,
    label: `Cuartos ${i+1}`
  })), [qfMatches, r16Winners])

  const qfWinners = useMemo(() =>
    qfWithTeams.map(s => getWinner(predMap, s.match, s.homeTeam, s.awayTeam))
  , [qfWithTeams, predMap])

  const sfWithTeams = useMemo(() => sfMatches.map((match, i) => ({
    match,
    homeTeam: qfWinners[i * 2] ?? null,
    awayTeam: qfWinners[i * 2 + 1] ?? null,
    label: `Semifinal ${i+1}`
  })), [sfMatches, qfWinners])

  const sfWinners = useMemo(() =>
    sfWithTeams.map(s => getWinner(predMap, s.match, s.homeTeam, s.awayTeam))
  , [sfWithTeams, predMap])

  const sfLosers = useMemo(() =>
    sfWithTeams.map(s => getLoser(predMap, s.match, s.homeTeam, s.awayTeam))
  , [sfWithTeams, predMap])

  const totalGroupsDone = GROUPS.filter(isGroupDone).length
  const bestThirds8 = sortedThirds.slice(0, 8)

  const finalPred = finalMatch ? predMap.get(finalMatch.id) : null
  const champion = finalPred && sfWinners[0] && sfWinners[1]
    ? (Number(finalPred.home_score) > Number(finalPred.away_score) ? sfWinners[0] : sfWinners[1])
    : null

  const stagePredCounts: Record<string, number> = {
    r32: r32Matches.filter(m => predMap.has(m.id)).length,
    r16: r16Matches.filter(m => predMap.has(m.id)).length,
    qf: qfMatches.filter(m => predMap.has(m.id)).length,
    sf: sfMatches.filter(m => predMap.has(m.id)).length,
    tp: tpMatch && predMap.has(tpMatch.id) ? 1 : 0,
    final: finalMatch && predMap.has(finalMatch.id) ? 1 : 0,
  }
  const stageTotals: Record<string, number> = { r32:16, r16:8, qf:4, sf:2, tp:1, final:1 }

  if (loading) return (
    <div className="space-y-3">
      {Array.from({length:4}).map((_,i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl"/>)}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">🏆 Camino al Campeón</h1>
        <p className="text-gray-500 text-sm mt-1">{totalGroupsDone}/12 grupos con pronósticos</p>
      </div>

      {!isPredictionsOpen && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-3 text-sm text-red-600 dark:text-red-400 font-medium">
          🔒 Las predicciones están cerradas
        </div>
      )}

      {champion && (
        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-2xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Tu campeón predicho</p>
          <div className="flex items-center justify-center gap-2">
            {champion.flag_url && <img src={champion.flag_url} className="w-8 h-5 object-cover rounded"/>}
            <span className="text-xl font-black text-yellow-600 dark:text-yellow-400">🏆 {champion.name}</span>
          </div>
        </div>
      )}

      {activeStage === 'r32' && totalGroupsDone > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-900 dark:text-white">🥉 Mejores Terceros ({bestThirds8.length}/8)</p>
            {totalGroupsDone < 12 && <p className="text-xs text-gray-400">{totalGroupsDone}/12 grupos</p>}
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {bestThirds8.map((team: any, i: number) => (
              <div key={team.id} className="flex items-center gap-3 px-4 py-2">
                <span className="text-xs font-black text-purple-500 w-4">{i+1}</span>
                {team.flag_url && <img src={team.flag_url} className="w-6 h-4 object-cover rounded flex-shrink-0"/>}
                <span className="text-sm text-gray-900 dark:text-white font-medium flex-1">{team.name}</span>
                <span className="text-xs text-gray-400 px-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">Gr.{team.group}</span>
                <span className="text-xs text-gray-400 w-8 text-center">{team.gd > 0?'+':''}{team.gd}</span>
                <span className="text-sm font-black text-gray-900 dark:text-white w-5 text-right">{team.pts}</span>
              </div>
            ))}
            {Array.from({length: Math.max(0, 8-bestThirds8.length)}).map((_,i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2 opacity-30">
                <span className="text-xs font-black text-gray-400 w-4">{bestThirds8.length+i+1}</span>
                <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded"/>
                <span className="text-sm text-gray-400 flex-1">Por definir</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto pb-1">
        {STAGES.map(s => {
          const done = stagePredCounts[s.id]
          const total = stageTotals[s.id]
          return (
            <button key={s.id} onClick={() => setActiveStage(s.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1 ${
                activeStage === s.id ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}>
              {s.label}
              {done > 0 && (
                <span className={`text-xs px-1.5 rounded-full ${done===total ? 'bg-green-500/30 text-green-700 dark:text-green-300' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                  {done}/{total}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {activeStage === 'r32' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {r32WithTeams.map(({ match, homeTeam, awayTeam, label, idx }) => (
            <MatchCard key={idx} match={match} homeTeam={homeTeam} awayTeam={awayTeam}
              prediction={match ? predMap.get(match.id) : null}
              onSave={savePrediction} pts={5}
              isLocked={!isPredictionsOpen || match?.is_locked}
              label={label} pendingMsg="Completa los grupos para ver los equipos"/>
          ))}
        </div>
      )}

      {activeStage === 'r16' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {r16WithTeams.map(({ match, homeTeam, awayTeam, label }, i) => (
            <MatchCard key={i} match={match} homeTeam={homeTeam} awayTeam={awayTeam}
              prediction={predMap.get(match?.id)} onSave={savePrediction} pts={5}
              isLocked={!isPredictionsOpen || match?.is_locked}
              label={label} pendingMsg="Predice la Ronda de 32 primero"/>
          ))}
        </div>
      )}

      {activeStage === 'qf' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {qfWithTeams.map(({ match, homeTeam, awayTeam, label }, i) => (
            <MatchCard key={i} match={match} homeTeam={homeTeam} awayTeam={awayTeam}
              prediction={predMap.get(match?.id)} onSave={savePrediction} pts={7}
              isLocked={!isPredictionsOpen || match?.is_locked}
              label={label} pendingMsg="Predice los Octavos primero"/>
          ))}
        </div>
      )}

      {activeStage === 'sf' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {sfWithTeams.map(({ match, homeTeam, awayTeam, label }, i) => (
            <MatchCard key={i} match={match} homeTeam={homeTeam} awayTeam={awayTeam}
              prediction={predMap.get(match?.id)} onSave={savePrediction} pts={10}
              isLocked={!isPredictionsOpen || match?.is_locked}
              label={label} pendingMsg="Predice los Cuartos primero"/>
          ))}
        </div>
      )}

      {activeStage === 'tp' && tpMatch && (
        <div className="max-w-md">
          <MatchCard match={tpMatch} homeTeam={sfLosers[0]} awayTeam={sfLosers[1]}
            prediction={predMap.get(tpMatch.id)} onSave={savePrediction} pts={10}
            isLocked={!isPredictionsOpen || tpMatch.is_locked}
            label="Tercer Lugar" pendingMsg="Predice las Semifinales primero"/>
        </div>
      )}

      {activeStage === 'final' && finalMatch && (
        <div className="max-w-md">
          <MatchCard match={finalMatch} homeTeam={sfWinners[0]} awayTeam={sfWinners[1]}
            prediction={predMap.get(finalMatch.id)} onSave={savePrediction} pts={15}
            isLocked={!isPredictionsOpen || finalMatch.is_locked}
            label="Gran Final 🏆" pendingMsg="Predice las Semifinales primero"/>
        </div>
      )}
    </div>
  )
}
