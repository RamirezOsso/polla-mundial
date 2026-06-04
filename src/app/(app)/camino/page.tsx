'use client'
import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'

const GROUPS = 'ABCDEFGHIJKL'.split('')

const STAGES = [
  { id: 'r32', label: 'Ronda de 32' },
  { id: 'r16', label: 'Octavos' },
  { id: 'qf', label: 'Cuartos' },
  { id: 'sf', label: 'Semis' },
  { id: 'tp', label: 'Tercer Lugar' },
  { id: 'final', label: 'Final' },
]

const STAGE_POINTS: Record<string, number> = {
  r32: 5, r16: 5, qf: 7, sf: 10, tp: 10, final: 15
}

const R32_STRUCTURE = [
  { id: 'r32_0',  home: {g:'A',r:1}, away: {g:'B',r:2} },
  { id: 'r32_1',  home: {g:'C',r:1}, away: {g:'D',r:2} },
  { id: 'r32_2',  home: {g:'E',r:1}, away: {g:'F',r:2} },
  { id: 'r32_3',  home: {g:'G',r:1}, away: {g:'H',r:2} },
  { id: 'r32_4',  home: {g:'I',r:1}, away: {g:'J',r:2} },
  { id: 'r32_5',  home: {g:'K',r:1}, away: {g:'L',r:2} },
  { id: 'r32_6',  home: {g:'B',r:1}, away: {g:'A',r:2} },
  { id: 'r32_7',  home: {g:'D',r:1}, away: {g:'C',r:2} },
  { id: 'r32_8',  home: {g:'F',r:1}, away: {g:'E',r:2} },
  { id: 'r32_9',  home: {g:'H',r:1}, away: {g:'G',r:2} },
  { id: 'r32_10', home: {g:'J',r:1}, away: {g:'I',r:2} },
  { id: 'r32_11', home: {g:'L',r:1}, away: {g:'K',r:2} },
]

const R16_STRUCTURE = [
  { id: 'r16_0', home: 'r32_0', away: 'r32_1' },
  { id: 'r16_1', home: 'r32_2', away: 'r32_3' },
  { id: 'r16_2', home: 'r32_4', away: 'r32_5' },
  { id: 'r16_3', home: 'r32_6', away: 'r32_7' },
  { id: 'r16_4', home: 'r32_8', away: 'r32_9' },
  { id: 'r16_5', home: 'r32_10', away: 'r32_11' },
  { id: 'r16_6', home: 'r32_0', away: 'r32_2' },
  { id: 'r16_7', home: 'r32_1', away: 'r32_3' },
]

const QF_STRUCTURE = [
  { id: 'qf_0', home: 'r16_0', away: 'r16_1' },
  { id: 'qf_1', home: 'r16_2', away: 'r16_3' },
  { id: 'qf_2', home: 'r16_4', away: 'r16_5' },
  { id: 'qf_3', home: 'r16_6', away: 'r16_7' },
  { id: 'qf_4', home: 'r16_0', away: 'r16_2' },
  { id: 'qf_5', home: 'r16_1', away: 'r16_3' },
]

const SF_STRUCTURE = [
  { id: 'sf_0', home: 'qf_0', away: 'qf_1' },
  { id: 'sf_1', home: 'qf_2', away: 'qf_3' },
  { id: 'sf_2', home: 'qf_4', away: 'qf_5' },
]

function ScoreSelector({ value, onChange }: { value: number|string, onChange: (n: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <input type="number" min="0" max="20" value={value}
        onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className="w-12 h-12 text-center text-2xl font-black bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-green-500"/>
      <div className="flex gap-0.5">
        {[0,1,2,3,4,5].map(n => (
          <button key={n} onClick={() => onChange(n)}
            className={`w-6 h-5 rounded text-xs font-bold transition-all ${value===n ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function MatchCard({ matchId, homeTeam, awayTeam, userPreds, onSave, stageId, canPlay, missingMsg }: any) {
  const existing = userPreds[matchId]
  const [home, setHome] = useState<number>(existing?.h ?? 0)
  const [away, setAway] = useState<number>(existing?.a ?? 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const winner = existing
    ? (existing.h > existing.a ? homeTeam : existing.a > existing.h ? awayTeam : null)
    : null

  const handleSave = async () => {
    if (home === away) return
    setSaving(true)
    await onSave(matchId, home, away)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    setSaving(false)
  }

  return (
    <div className={`bg-white dark:bg-gray-900 border rounded-2xl overflow-hidden ${
      !canPlay ? 'border-gray-200 dark:border-gray-800 opacity-50' :
      existing ? 'border-green-300 dark:border-green-500/30' : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/40">
        <span className="text-xs text-gray-500 truncate flex-1">
          {homeTeam?.name ?? '?'} vs {awayTeam?.name ?? '?'}
        </span>
        <span className="text-xs font-bold text-yellow-500 ml-2 flex-shrink-0">+{STAGE_POINTS[stageId]}pts</span>
      </div>

      {!canPlay ? (
        <div className="px-3 py-3 text-center">
          <p className="text-xs text-gray-400">⏳ {missingMsg}</p>
        </div>
      ) : (
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1 justify-end">
              {homeTeam?.flag_url && <img src={homeTeam.flag_url} className="w-6 h-4 object-cover rounded flex-shrink-0"/>}
              <span className={`text-xs font-bold truncate ${winner?.id === homeTeam?.id ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                {homeTeam?.short_name ?? '?'}{winner?.id === homeTeam?.id && ' ✓'}
              </span>
            </div>
            <span className="text-gray-300 dark:text-gray-600 text-xs flex-shrink-0">vs</span>
            <div className="flex items-center gap-1.5 flex-1">
              <span className={`text-xs font-bold truncate ${winner?.id === awayTeam?.id ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                {winner?.id === awayTeam?.id && '✓ '}{awayTeam?.short_name ?? '?'}
              </span>
              {awayTeam?.flag_url && <img src={awayTeam.flag_url} className="w-6 h-4 object-cover rounded flex-shrink-0"/>}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <ScoreSelector value={home} onChange={setHome} />
            <span className="text-2xl font-black text-gray-300 dark:text-gray-600">:</span>
            <ScoreSelector value={away} onChange={setAway} />
          </div>

          {home === away && (
            <p className="text-xs text-red-500 text-center">No puede ser empate en eliminatorias</p>
          )}

          <button onClick={handleSave} disabled={saving || home === away}
            className="w-full py-2 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl text-xs disabled:opacity-40">
            {saved ? '✅ Guardado' : saving ? '...' : '💾 Guardar'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function CaminoPage() {
  const { user } = useAuth()
  const { matches, loading } = useMatches()
  const { predictions } = usePredictions(user?.id)
  const [activeStage, setActiveStage] = useState('r32')
  const [virtualPreds, setVirtualPreds] = useState<Record<string, {h:number, a:number}>>({})

  const predMap = useMemo(() => new Map(predictions.map(p => [p.match_id, p])), [predictions])
  const groupMatches = useMemo(() => matches.filter(m => m.stage?.type === 'group'), [matches])

  const groupStandings = useMemo(() => {
    const s: Record<string, any[]> = {}
    GROUPS.forEach(g => {
      const gm = groupMatches.filter(m => m.group_name === g)
      const teams: Record<string, any> = {}
      gm.forEach((m: any) => {
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
      s[g] = Object.values(teams).sort((a: any, b: any) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    })
    return s
  }, [groupMatches, predMap])

  const isGroupDone = (g: string) => {
    const gm = groupMatches.filter(m => m.group_name === g)
    return gm.length > 0 && gm.every(m => predMap.has(m.id))
  }

  const r32 = useMemo(() => R32_STRUCTURE.map(m => {
    const homeDone = isGroupDone(m.home.g)
    const awayDone = isGroupDone(m.away.g)
    const homeTeam = homeDone ? groupStandings[m.home.g]?.[m.home.r - 1] : null
    const awayTeam = awayDone ? groupStandings[m.away.g]?.[m.away.r - 1] : null
    const canPlay = homeDone && awayDone
    const vp = virtualPreds[m.id]
    const winner = vp ? (vp.h > vp.a ? homeTeam : awayTeam) : null
    return { ...m, homeTeam, awayTeam, canPlay, winner,
      missing: !homeDone && !awayDone ? `Grupos ${m.home.g} y ${m.away.g}` : !homeDone ? `Grupo ${m.home.g}` : `Grupo ${m.away.g}` }
  }), [groupStandings, virtualPreds])

  const getWinner = (id: string, roundData: any[]) => roundData.find(x => x.id === id)?.winner ?? null

  const r16 = useMemo(() => R16_STRUCTURE.map(m => {
    const homeTeam = getWinner(m.home, r32)
    const awayTeam = getWinner(m.away, r32)
    const canPlay = !!(homeTeam && awayTeam)
    const vp = virtualPreds[m.id]
    const winner = vp && homeTeam && awayTeam ? (vp.h > vp.a ? homeTeam : awayTeam) : null
    return { ...m, homeTeam, awayTeam, canPlay, winner, missing: 'Predice la Ronda de 32 primero' }
  }), [r32, virtualPreds])

  const qf = useMemo(() => QF_STRUCTURE.map(m => {
    const homeTeam = getWinner(m.home, r16)
    const awayTeam = getWinner(m.away, r16)
    const canPlay = !!(homeTeam && awayTeam)
    const vp = virtualPreds[m.id]
    const winner = vp && homeTeam && awayTeam ? (vp.h > vp.a ? homeTeam : awayTeam) : null
    return { ...m, homeTeam, awayTeam, canPlay, winner, missing: 'Predice Octavos primero' }
  }), [r16, virtualPreds])

  const sf = useMemo(() => SF_STRUCTURE.map(m => {
    const homeTeam = getWinner(m.home, qf)
    const awayTeam = getWinner(m.away, qf)
    const canPlay = !!(homeTeam && awayTeam)
    const vp = virtualPreds[m.id]
    const winner = vp && homeTeam && awayTeam ? (vp.h > vp.a ? homeTeam : awayTeam) : null
    const loser = vp && homeTeam && awayTeam ? (vp.h > vp.a ? awayTeam : homeTeam) : null
    return { ...m, homeTeam, awayTeam, canPlay, winner, loser, missing: 'Predice Cuartos primero' }
  }), [qf, virtualPreds])

  const sf0 = sf[0]; const sf1 = sf[1]
  const tpMatch = { id: 'tp_0', homeTeam: sf0?.loser ?? null, awayTeam: sf1?.loser ?? null, canPlay: !!(sf0?.loser && sf1?.loser), missing: 'Predice Semifinales primero' }
  const finalMatch = { id: 'final_0', homeTeam: sf0?.winner ?? null, awayTeam: sf1?.winner ?? null, canPlay: !!(sf0?.winner && sf1?.winner), missing: 'Predice Semifinales primero' }

  const handleVirtualSave = (matchId: string, h: number, a: number) => {
    setVirtualPreds(prev => ({ ...prev, [matchId]: { h, a } }))
  }

  const totalGroupsDone = GROUPS.filter(isGroupDone).length
  const stageData: Record<string, any[]> = { r32, r16, qf, sf, tp: [tpMatch], final: [finalMatch] }

  const champion = virtualPreds['final_0']
    ? (virtualPreds['final_0'].h > virtualPreds['final_0'].a ? finalMatch.homeTeam : finalMatch.awayTeam)
    : null

  if (loading) return (
    <div className="space-y-3">
      {Array.from({length:4}).map((_,i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl"/>)}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">🏆 Camino al Campeón</h1>
        <p className="text-gray-500 text-sm mt-1">{totalGroupsDone}/12 grupos completos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STAGES.map(s => {
          const done = (stageData[s.id] ?? []).filter((m: any) => virtualPreds[m.id]).length
          return (
            <button key={s.id} onClick={() => setActiveStage(s.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1 ${
                activeStage === s.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}>
              {s.label}
              {done > 0 && <span className="bg-green-500/30 text-green-700 dark:text-green-300 text-xs px-1.5 rounded-full">{done}</span>}
            </button>
          )
        })}
      </div>

      {/* Campeón predicho */}
      {champion && (
        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-2xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Tu campeón predicho</p>
          <div className="flex items-center justify-center gap-2">
            {champion.flag_url && <img src={champion.flag_url} className="w-8 h-5 object-cover rounded"/>}
            <span className="text-xl font-black text-yellow-600 dark:text-yellow-400">🏆 {champion.name}</span>
          </div>
        </div>
      )}

      {/* Partidos */}
      <div className="grid sm:grid-cols-2 gap-3">
        {(stageData[activeStage] ?? []).map((m: any) => (
          <MatchCard
            key={m.id}
            matchId={m.id}
            homeTeam={m.homeTeam}
            awayTeam={m.awayTeam}
            userPreds={virtualPreds}
            onSave={handleVirtualSave}
            stageId={activeStage}
            canPlay={m.canPlay}
            missingMsg={m.missing}
          />
        ))}
      </div>
    </div>
  )
}
