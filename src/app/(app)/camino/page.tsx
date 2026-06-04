'use client'
import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'

const STAGES = [
  { id: 'round_of_32', label: 'Ronda de 32' },
  { id: 'round_of_16', label: 'Octavos de Final' },
  { id: 'quarter_final', label: 'Cuartos de Final' },
  { id: 'semi_final', label: 'Semifinales' },
  { id: 'third_place', label: 'Tercer Lugar' },
  { id: 'final', label: 'Final' },
]

const STAGE_POINTS: Record<string, number> = {
  round_of_32: 5,
  round_of_16: 5,
  quarter_final: 7,
  semi_final: 10,
  third_place: 10,
  final: 15,
}

// Cruces del Mundial 2026
const R32_MATCHUPS = [
  { pos: 0, home: {g:'A',r:1}, away: {g:'B',r:2}, label: '1°A vs 2°B' },
  { pos: 1, home: {g:'C',r:1}, away: {g:'D',r:2}, label: '1°C vs 2°D' },
  { pos: 2, home: {g:'E',r:1}, away: {g:'F',r:2}, label: '1°E vs 2°F' },
  { pos: 3, home: {g:'G',r:1}, away: {g:'H',r:2}, label: '1°G vs 2°H' },
  { pos: 4, home: {g:'I',r:1}, away: {g:'J',r:2}, label: '1°I vs 2°J' },
  { pos: 5, home: {g:'K',r:1}, away: {g:'L',r:2}, label: '1°K vs 2°L' },
  { pos: 6, home: {g:'B',r:1}, away: {g:'A',r:2}, label: '1°B vs 2°A' },
  { pos: 7, home: {g:'D',r:1}, away: {g:'C',r:2}, label: '1°D vs 2°C' },
  { pos: 8, home: {g:'F',r:1}, away: {g:'E',r:2}, label: '1°F vs 2°E' },
  { pos: 9, home: {g:'H',r:1}, away: {g:'G',r:2}, label: '1°H vs 2°G' },
  { pos: 10, home: {g:'J',r:1}, away: {g:'I',r:2}, label: '1°J vs 2°I' },
  { pos: 11, home: {g:'L',r:1}, away: {g:'K',r:2}, label: '1°L vs 2°K' },
]

function MatchupCard({ homeTeam, awayTeam, prediction, onPredict, locked, label, stageType, canPredict, missingGroups }: any) {
  const [home, setHome] = useState<number|string>(prediction?.home_score ?? '')
  const [away, setAway] = useState<number|string>(prediction?.away_score ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (home === '' || away === '' || home === away) return
    setSaving(true)
    await onPredict(Number(home), Number(away))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  const pts = STAGE_POINTS[stageType] ?? 0

  // Equipo ganador según predicción
  const predWinner = prediction
    ? (prediction.home_score > prediction.away_score ? homeTeam : awayTeam)
    : null

  return (
    <div className={`bg-gray-900 border rounded-2xl overflow-hidden transition-all ${
      !canPredict ? 'opacity-60 border-gray-800' :
      prediction ? 'border-green-500/30' : 'border-gray-700'
    }`}>
      {/* Label */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800/50">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-bold text-yellow-400">+{pts} pts</span>
      </div>

      {!canPredict ? (
        <div className="px-4 py-4 text-center">
          <p className="text-xs text-gray-500">⏳ Completa {missingGroups}</p>
        </div>
      ) : (
        <div className="p-3 space-y-3">
          {/* Equipos */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1 justify-end">
              {homeTeam?.flag_url && <img src={homeTeam.flag_url} className="w-7 h-5 object-cover rounded flex-shrink-0"/>}
              <span className={`text-sm font-bold truncate ${predWinner?.id === homeTeam?.id ? 'text-green-400' : 'text-white'}`}>
                {homeTeam?.name ?? '?'}
              </span>
              {predWinner?.id === homeTeam?.id && <span className="text-green-400 text-xs">→</span>}
            </div>
            <span className="text-gray-600 font-bold text-sm flex-shrink-0">vs</span>
            <div className="flex items-center gap-2 flex-1">
              {predWinner?.id === awayTeam?.id && <span className="text-green-400 text-xs">←</span>}
              <span className={`text-sm font-bold truncate ${predWinner?.id === awayTeam?.id ? 'text-green-400' : 'text-white'}`}>
                {awayTeam?.name ?? '?'}
              </span>
              {awayTeam?.flag_url && <img src={awayTeam.flag_url} className="w-7 h-5 object-cover rounded flex-shrink-0"/>}
            </div>
          </div>

          {/* Input o resultado */}
          {locked ? (
            prediction && (
              <div className="text-center bg-gray-800 rounded-xl py-2">
                <span className="text-sm font-black text-blue-400">
                  {prediction.home_score} - {prediction.away_score}
                </span>
                {predWinner && (
                  <p className="text-xs text-green-400 mt-0.5">Avanza: {predWinner.name}</p>
                )}
              </div>
            )
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 text-center">No puede ser empate</p>
              <div className="flex items-center justify-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <input type="number" min="0" max="20" value={home}
                    onChange={e => setHome(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-12 h-12 text-center text-2xl font-black bg-gray-800 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
                    placeholder="?"/>
                  <div className="flex gap-0.5">
                    {[0,1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setHome(n)}
                        className={`w-6 h-5 rounded text-xs font-bold ${home===n ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-2xl font-black text-gray-600">:</span>
                <div className="flex flex-col items-center gap-1">
                  <input type="number" min="0" max="20" value={away}
                    onChange={e => setAway(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-12 h-12 text-center text-2xl font-black bg-gray-800 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
                    placeholder="?"/>
                  <div className="flex gap-0.5">
                    {[0,1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setAway(n)}
                        className={`w-6 h-5 rounded text-xs font-bold ${away===n ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={handleSave}
                disabled={saving || home === '' || away === '' || home === away}
                className="w-full py-2 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl text-sm disabled:opacity-40">
                {saved ? '✅ Guardado' : saving ? 'Guardando...' : '💾 Guardar'}
              </button>
              {home !== '' && away !== '' && home === away && (
                <p className="text-xs text-red-400 text-center">En eliminatorias no hay empate</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CaminoPage() {
  const { user } = useAuth()
  const { matches, loading } = useMatches()
  const { predictions, savePrediction } = usePredictions(user?.id)
  const [activeStage, setActiveStage] = useState('round_of_32')

  const predMap = useMemo(() => new Map(predictions.map(p => [p.match_id, p])), [predictions])
  const groupMatches = useMemo(() => matches.filter(m => m.stage?.type === 'group'), [matches])

  // Calcular standings por grupo según predicciones del usuario
  const groupStandings = useMemo(() => {
    const standings: Record<string, any[]> = {}
    'ABCDEFGHIJKL'.split('').forEach(g => {
      const gMatches = groupMatches.filter(m => m.group_name === g)
      const teams: Record<string, any> = {}
      gMatches.forEach((m: any) => {
        if (!teams[m.home_team_id]) teams[m.home_team_id] = { ...m.home_team, pts: 0, gd: 0, gf: 0 }
        if (!teams[m.away_team_id]) teams[m.away_team_id] = { ...m.away_team, pts: 0, gd: 0, gf: 0 }
        const pred = predMap.get(m.id)
        const isFinished = m.status === 'finished'
        const h = isFinished ? m.home_score : pred?.home_score
        const a = isFinished ? m.away_score : pred?.away_score
        if (h == null || a == null) return
        teams[m.home_team_id].gf += h; teams[m.away_team_id].gf += a
        teams[m.home_team_id].gd += h - a; teams[m.away_team_id].gd += a - h
        if (h > a) teams[m.home_team_id].pts += 3
        else if (h < a) teams[m.away_team_id].pts += 3
        else { teams[m.home_team_id].pts += 1; teams[m.away_team_id].pts += 1 }
      })
      standings[g] = Object.values(teams).sort((a: any, b: any) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    })
    return standings
  }, [groupMatches, predMap])

  const isGroupComplete = (g: string) => {
    const gm = groupMatches.filter(m => m.group_name === g)
    return gm.length > 0 && gm.every(m => predMap.has(m.id))
  }

  // Calcular R32 matchups con equipos reales
  const r32Matchups = useMemo(() => R32_MATCHUPS.map(matchup => {
    const homeGroupDone = isGroupComplete(matchup.home.g)
    const awayGroupDone = isGroupComplete(matchup.away.g)
    const homeTeam = homeGroupDone ? groupStandings[matchup.home.g]?.[matchup.home.r - 1] : null
    const awayTeam = awayGroupDone ? groupStandings[matchup.away.g]?.[matchup.away.r - 1] : null
    const canPredict = homeGroupDone && awayGroupDone
    const missing = !homeGroupDone && !awayGroupDone
      ? `Grupos ${matchup.home.g} y ${matchup.away.g}`
      : !homeGroupDone ? `Grupo ${matchup.home.g}`
      : `Grupo ${matchup.away.g}`
    return { ...matchup, homeTeam, awayTeam, canPredict, missingGroups: missing }
  }), [groupStandings])

  // Calcular avanzados de R32 según predicciones del usuario
  const r32Winners = useMemo(() => {
    const winners: Record<number, any> = {}
    r32Matchups.forEach(m => {
      // Buscar predicción del usuario para este cruce (por equipo)
      if (!m.homeTeam || !m.awayTeam) return
      const match = matches.find(match =>
        (match.home_team_id === m.homeTeam?.id && match.away_team_id === m.awayTeam?.id) ||
        (match.away_team_id === m.homeTeam?.id && match.home_team_id === m.awayTeam?.id)
      )
      if (!match) return
      const pred = predMap.get(match.id)
      if (!pred) return
      if (pred.home_score > pred.away_score) winners[m.pos] = m.homeTeam
      else if (pred.away_score > pred.home_score) winners[m.pos] = m.awayTeam
    })
    return winners
  }, [r32Matchups, matches, predMap])

  const totalGroupsDone = 'ABCDEFGHIJKL'.split('').filter(isGroupComplete).length

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-gray-800 animate-pulse rounded-xl"/>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({length: 6}).map((_, i) => <div key={i} className="h-24 bg-gray-800 animate-pulse rounded-2xl"/>)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">🏆 Camino al Campeón</h1>
        <p className="text-gray-400 text-sm mt-1">
          Predice quién avanza en cada fase · {totalGroupsDone}/12 grupos completos
        </p>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {STAGES.map(s => (
          <button key={s.id} onClick={() => setActiveStage(s.id)}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeStage === s.id ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Ronda de 32 */}
      {activeStage === 'round_of_32' && (
        <div className="space-y-4">
          {totalGroupsDone < 12 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-sm text-yellow-300">
              ⚡ Completa todos los grupos en <a href="/pronosticos" className="font-bold underline">Pronósticos</a> para ver todos los cruces
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {r32Matchups.map(m => {
              const match = matches.find(match =>
                m.homeTeam && m.awayTeam && (
                  (match.home_team_id === m.homeTeam.id && match.away_team_id === m.awayTeam.id) ||
                  (match.away_team_id === m.homeTeam.id && match.home_team_id === m.awayTeam.id)
                )
              )
              return (
                <MatchupCard
                  key={m.pos}
                  homeTeam={m.homeTeam}
                  awayTeam={m.awayTeam}
                  prediction={match ? predMap.get(match.id) : null}
                  onPredict={async (h: number, a: number) => {
                    if (match) await savePrediction(match.id, h, a)
                  }}
                  locked={match?.is_locked}
                  label={m.label}
                  stageType="round_of_32"
                  canPredict={m.canPredict}
                  missingGroups={m.missingGroups}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Fases siguientes */}
      {activeStage !== 'round_of_32' && (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">⏳</p>
          <h3 className="text-xl font-bold text-white mb-2">
            {STAGES.find(s => s.id === activeStage)?.label}
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Disponible cuando completes la Ronda de 32
          </p>
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-xl">
            <span className="text-yellow-400 font-bold">⭐ +{STAGE_POINTS[activeStage]} pts</span>
            <span className="text-gray-300 text-sm">por clasificado correcto</span>
          </div>
        </div>
      )}
    </div>
  )
}
