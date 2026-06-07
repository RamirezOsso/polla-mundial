'use client'
import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'

const GROUPS = 'ABCDEFGHIJKL'.split('')

const STAGES = [
  { id: 'r32', label: 'Ronda de 32', type: 'round_of_32', pts: 5 },
  { id: 'r16', label: 'Octavos', type: 'round_of_16', pts: 5 },
  { id: 'qf', label: 'Cuartos', type: 'quarter_final', pts: 7 },
  { id: 'sf', label: 'Semis', type: 'semi_final', pts: 10 },
  { id: 'tp', label: 'Tercer Lugar', type: 'third_place', pts: 10 },
  { id: 'final', label: 'Final', type: 'final', pts: 15 },
]

// Cruces R32 oficiales FIFA 2026
// 12 cruces fijos (1ro vs 2do) + 4 cruces de mejores terceros
const R32_FIXED = [
  { idx: 0,  home: {g:'A',r:1}, away: {g:'B',r:2}, label: '1°A vs 2°B' },
  { idx: 1,  home: {g:'C',r:1}, away: {g:'D',r:2}, label: '1°C vs 2°D' },
  { idx: 2,  home: {g:'E',r:1}, away: {g:'F',r:2}, label: '1°E vs 2°F' },
  { idx: 3,  home: {g:'G',r:1}, away: {g:'H',r:2}, label: '1°G vs 2°H' },
  { idx: 4,  home: {g:'I',r:1}, away: {g:'J',r:2}, label: '1°I vs 2°J' },
  { idx: 5,  home: {g:'K',r:1}, away: {g:'L',r:2}, label: '1°K vs 2°L' },
  { idx: 6,  home: {g:'B',r:1}, away: {g:'A',r:2}, label: '1°B vs 2°A' },
  { idx: 7,  home: {g:'D',r:1}, away: {g:'C',r:2}, label: '1°D vs 2°C' },
  { idx: 8,  home: {g:'F',r:1}, away: {g:'E',r:2}, label: '1°F vs 2°E' },
  { idx: 9,  home: {g:'H',r:1}, away: {g:'G',r:2}, label: '1°H vs 2°G' },
  { idx: 10, home: {g:'J',r:1}, away: {g:'I',r:2}, label: '1°J vs 2°I' },
  { idx: 11, home: {g:'L',r:1}, away: {g:'K',r:2}, label: '1°L vs 2°K' },
]

// 4 cruces de mejores terceros (por ranking de terceros)
const R32_THIRDS = [
  { idx: 12, homeThird: 0, awayThird: 1, label: 'Mejor 3° vs 2° Mejor 3°' },
  { idx: 13, homeThird: 2, awayThird: 3, label: '3° Mejor 3° vs 4° Mejor 3°' },
  { idx: 14, homeThird: 4, awayThird: 5, label: '5° Mejor 3° vs 6° Mejor 3°' },
  { idx: 15, homeThird: 6, awayThird: 7, label: '7° Mejor 3° vs 8° Mejor 3°' },
]

function calcStandings(matches: any[], predMap: Map<string, any>, group: string) {
  const teams: Record<string, any> = {}
  const gm = matches.filter(m => m.group_name === group)
  gm.forEach((m: any) => {
    if (!teams[m.home_team_id]) teams[m.home_team_id] = { ...m.home_team, pts: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 }
    if (!teams[m.away_team_id]) teams[m.away_team_id] = { ...m.away_team, pts: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 }
    const pred = predMap.get(m.id)
    const isFinished = m.status === 'finished'
    const h = isFinished ? m.home_score : pred?.home_score
    const a = isFinished ? m.away_score : pred?.away_score
    if (h == null || a == null) return
    teams[m.home_team_id].gf += h; teams[m.away_team_id].gf += a
    teams[m.home_team_id].ga += a; teams[m.away_team_id].ga += h
    teams[m.home_team_id].gd += h - a; teams[m.away_team_id].gd += a - h
    teams[m.home_team_id].played++; teams[m.away_team_id].played++
    if (h > a) {
      teams[m.home_team_id].pts += 3; teams[m.home_team_id].won++
      teams[m.away_team_id].lost++
    } else if (h < a) {
      teams[m.away_team_id].pts += 3; teams[m.away_team_id].won++
      teams[m.home_team_id].lost++
    } else {
      teams[m.home_team_id].pts += 1; teams[m.home_team_id].drawn++
      teams[m.away_team_id].pts += 1; teams[m.away_team_id].drawn++
    }
  })
  return Object.values(teams).sort((a: any, b: any) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
}

function ScoreSelector({ value, onChange }: { value: number|string, onChange: (n: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-xl text-2xl font-black text-gray-900 dark:text-white">
        {value !== '' ? value : '?'}
      </div>
      <div className="flex gap-0.5">
        {[0,1,2,3,4,5].map(n => (
          <button key={n} onClick={() => onChange(n)}
            className={`w-7 h-6 rounded-lg text-xs font-bold transition-all ${value===n ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function MatchCard({ match, homeTeam, awayTeam, prediction, onSave, pts, isLocked, label }: any) {
  const [home, setHome] = useState<number|string>(prediction?.home_score ?? '')
  const [away, setAway] = useState<number|string>(prediction?.away_score ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isTBD = !homeTeam || !awayTeam || homeTeam?.short_name === 'TBD' || awayTeam?.short_name === 'TBD'
  const hasPred = prediction != null
  const isFinished = match?.status === 'finished'

  const winner = hasPred && Number(prediction.home_score) !== Number(prediction.away_score)
    ? (Number(prediction.home_score) > Number(prediction.away_score) ? homeTeam : awayTeam)
    : null

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
      isTBD ? 'border-gray-200 dark:border-gray-800 opacity-60' :
      hasPred ? 'border-green-300 dark:border-green-500/30' :
      'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50">
        {isTBD ? (
          <span className="text-xs text-gray-400">⏳ {label} — Por definir</span>
        ) : (
          <span className="text-xs text-gray-500 truncate flex-1">{label}</span>
        )}
        <span className="text-xs font-bold text-yellow-500 ml-2 flex-shrink-0">+{pts}pts</span>
      </div>

      {isTBD ? (
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-gray-400">Completa los grupos para ver los equipos</p>
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
            }`}>
              Mi pronóstico: {prediction.home_score}-{prediction.away_score} · +{prediction.points_earned ?? 0}pts
            </div>
          )}
        </div>
      ) : isLocked ? (
        <div className="p-3">
          <div className="flex items-center gap-2 justify-center">
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
        </div>
      ) : (
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1 justify-end">
              {homeTeam?.flag_url && <img src={homeTeam.flag_url} className="w-7 h-5 object-cover rounded flex-shrink-0"/>}
              <span className={`text-sm font-bold truncate ${winner?.id === homeTeam?.id ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                {homeTeam?.short_name}{winner?.id === homeTeam?.id && ' ✓'}
              </span>
            </div>
            <span className="text-gray-300 dark:text-gray-600 text-xs flex-shrink-0">vs</span>
            <div className="flex items-center gap-2 flex-1">
              <span className={`text-sm font-bold truncate ${winner?.id === awayTeam?.id ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                {winner?.id === awayTeam?.id && '✓ '}{awayTeam?.short_name}
              </span>
              {awayTeam?.flag_url && <img src={awayTeam.flag_url} className="w-7 h-5 object-cover rounded flex-shrink-0"/>}
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <ScoreSelector value={home} onChange={setHome}/>
            <span className="text-2xl font-black text-gray-300 dark:text-gray-600">:</span>
            <ScoreSelector value={away} onChange={setAway}/>
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

  // Standings por grupo
  const groupStandings = useMemo(() => {
    const s: Record<string, any[]> = {}
    GROUPS.forEach(g => { s[g] = calcStandings(groupMatches, predMap, g) })
    return s
  }, [groupMatches, predMap])

  const isGroupDone = (g: string) => {
    const gm = groupMatches.filter(m => m.group_name === g)
    return gm.length > 0 && gm.every(m => predMap.has(m.id))
  }

  // Mejores terceros (ordenados por pts, gd, gf)
  const bestThirds = useMemo(() => {
    const thirds = GROUPS.map(g => {
      const standings = groupStandings[g]
      return standings?.[2] ? { ...standings[2], group: g } : null
    }).filter(Boolean) as any[]

    return thirds
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
      .slice(0, 8)
  }, [groupStandings])

  // Partidos por fase
  const r32Matches = useMemo(() => matches.filter(m => m.stage?.type === 'round_of_32').sort((a,b) => a.match_number - b.match_number), [matches])
  const r16Matches = useMemo(() => matches.filter(m => m.stage?.type === 'round_of_16').sort((a,b) => a.match_number - b.match_number), [matches])
  const qfMatches = useMemo(() => matches.filter(m => m.stage?.type === 'quarter_final').sort((a,b) => a.match_number - b.match_number), [matches])
  const sfMatches = useMemo(() => matches.filter(m => m.stage?.type === 'semi_final').sort((a,b) => a.match_number - b.match_number), [matches])
  const tpMatch = useMemo(() => matches.find(m => m.stage?.type === 'third_place'), [matches])
  const finalMatch = useMemo(() => matches.find(m => m.stage?.type === 'final'), [matches])

  // R32 con equipos reales
  const r32WithTeams = useMemo(() => {
    const fixed = R32_FIXED.map(s => {
      const match = r32Matches[s.idx]
      const homeDone = isGroupDone(s.home.g)
      const awayDone = isGroupDone(s.away.g)
      const homeTeam = homeDone ? groupStandings[s.home.g]?.[s.home.r - 1] : null
      const awayTeam = awayDone ? groupStandings[s.away.g]?.[s.away.r - 1] : null
      return { ...s, match, homeTeam, awayTeam }
    })

    const thirds = R32_THIRDS.map(s => {
      const match = r32Matches[s.idx]
      const homeTeam = bestThirds[s.homeThird] ?? null
      const awayTeam = bestThirds[s.awayThird] ?? null
      return { ...s, match, homeTeam, awayTeam }
    })

    return [...fixed, ...thirds]
  }, [r32Matches, groupStandings, bestThirds])

  const totalGroupsDone = GROUPS.filter(isGroupDone).length
  const allGroupsDone = totalGroupsDone === 12

  const finalPred = finalMatch ? predMap.get(finalMatch.id) : null
  const champion = finalPred && finalMatch?.home_team?.short_name !== 'TBD'
    ? (Number(finalPred.home_score) > Number(finalPred.away_score) ? finalMatch.home_team : finalMatch.away_team)
    : null

  const stagePredCounts: Record<string, number> = {
    r32: r32Matches.filter(m => predMap.has(m.id)).length,
    r16: r16Matches.filter(m => predMap.has(m.id)).length,
    qf: qfMatches.filter(m => predMap.has(m.id)).length,
    sf: sfMatches.filter(m => predMap.has(m.id)).length,
    tp: tpMatch && predMap.has(tpMatch.id) ? 1 : 0,
    final: finalMatch && predMap.has(finalMatch.id) ? 1 : 0,
  }

  const stageTotals: Record<string, number> = {
    r32: 16, r16: 8, qf: 4, sf: 2, tp: 1, final: 1
  }

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

      {/* Mejores terceros */}
      {activeStage === 'r32' && totalGroupsDone > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-900 dark:text-white">🥉 Mejores Terceros ({bestThirds.length}/8 definidos)</p>
            {!allGroupsDone && <p className="text-xs text-gray-400">Completa todos los grupos</p>}
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {bestThirds.map((team: any, i: number) => (
              <div key={team.id} className="flex items-center gap-3 px-4 py-2">
                <span className="text-xs font-black text-purple-500 w-4">{i+1}</span>
                {team.flag_url && <img src={team.flag_url} className="w-6 h-4 object-cover rounded flex-shrink-0"/>}
                <span className="text-sm text-gray-900 dark:text-white font-medium flex-1">{team.name}</span>
                <span className="text-xs text-gray-400">Grupo {team.group}</span>
                <span className="text-xs font-bold text-gray-500 w-6 text-center">{team.gd > 0 ? '+' : ''}{team.gd}</span>
                <span className="text-sm font-black text-gray-900 dark:text-white w-6 text-right">{team.pts}</span>
              </div>
            ))}
            {Array.from({length: 8 - bestThirds.length}).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2 opacity-30">
                <span className="text-xs font-black text-gray-400 w-4">{bestThirds.length + i + 1}</span>
                <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded"/>
                <span className="text-sm text-gray-400 flex-1">Por definir</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
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
                <span className={`text-xs px-1.5 rounded-full ${done === total ? 'bg-green-500/30 text-green-700 dark:text-green-300' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                  {done}/{total}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* RONDA DE 32 */}
      {activeStage === 'r32' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {r32WithTeams.map(({ match, homeTeam, awayTeam, label, idx }) => (
            <MatchCard key={idx}
              match={match}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              prediction={match ? predMap.get(match.id) : null}
              onSave={savePrediction}
              pts={5}
              isLocked={!isPredictionsOpen || match?.is_locked}
              label={label}
            />
          ))}
        </div>
      )}

      {/* OCTAVOS */}
      {activeStage === 'r16' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {r16Matches.map((match, i) => (
            <MatchCard key={match.id}
              match={match}
              homeTeam={match.home_team}
              awayTeam={match.away_team}
              prediction={predMap.get(match.id)}
              onSave={savePrediction}
              pts={5}
              isLocked={!isPredictionsOpen || match.is_locked}
              label={`Octavos ${i+1}`}
            />
          ))}
        </div>
      )}

      {/* CUARTOS */}
      {activeStage === 'qf' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {qfMatches.map((match, i) => (
            <MatchCard key={match.id}
              match={match}
              homeTeam={match.home_team}
              awayTeam={match.away_team}
              prediction={predMap.get(match.id)}
              onSave={savePrediction}
              pts={7}
              isLocked={!isPredictionsOpen || match.is_locked}
              label={`Cuartos ${i+1}`}
            />
          ))}
        </div>
      )}

      {/* SEMIS */}
      {activeStage === 'sf' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {sfMatches.map((match, i) => (
            <MatchCard key={match.id}
              match={match}
              homeTeam={match.home_team}
              awayTeam={match.away_team}
              prediction={predMap.get(match.id)}
              onSave={savePrediction}
              pts={10}
              isLocked={!isPredictionsOpen || match.is_locked}
              label={`Semifinal ${i+1}`}
            />
          ))}
        </div>
      )}

      {/* TERCER LUGAR */}
      {activeStage === 'tp' && tpMatch && (
        <div className="max-w-md">
          <MatchCard
            match={tpMatch}
            homeTeam={tpMatch.home_team}
            awayTeam={tpMatch.away_team}
            prediction={predMap.get(tpMatch.id)}
            onSave={savePrediction}
            pts={10}
            isLocked={!isPredictionsOpen || tpMatch.is_locked}
            label="Tercer Lugar"
          />
        </div>
      )}

      {/* FINAL */}
      {activeStage === 'final' && finalMatch && (
        <div className="max-w-md">
          <MatchCard
            match={finalMatch}
            homeTeam={finalMatch.home_team}
            awayTeam={finalMatch.away_team}
            prediction={predMap.get(finalMatch.id)}
            onSave={savePrediction}
            pts={15}
            isLocked={!isPredictionsOpen || finalMatch.is_locked}
            label="Gran Final"
          />
        </div>
      )}
    </div>
  )
}
