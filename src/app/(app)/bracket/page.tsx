'use client'
import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

const STAGE_LABELS: Record<string, string> = {
  group: 'Grupos',
  round_of_32: 'Ronda de 32',
  round_of_16: 'Octavos',
  quarter_final: 'Cuartos',
  semi_final: 'Semis',
  final: 'Final',
}

const STAGE_POINTS: Record<string, number> = {
  round_of_32: 5,
  round_of_16: 5,
  quarter_final: 7,
  semi_final: 10,
  final: 15,
}

// Cruces del Mundial 2026
const R32_MATCHUPS = [
  { home: {g:'A',r:1}, away: {g:'B',r:2} },
  { home: {g:'B',r:1}, away: {g:'A',r:2} },
  { home: {g:'C',r:1}, away: {g:'D',r:2} },
  { home: {g:'D',r:1}, away: {g:'C',r:2} },
  { home: {g:'E',r:1}, away: {g:'F',r:2} },
  { home: {g:'F',r:1}, away: {g:'E',r:2} },
  { home: {g:'G',r:1}, away: {g:'H',r:2} },
  { home: {g:'H',r:1}, away: {g:'G',r:2} },
  { home: {g:'I',r:1}, away: {g:'J',r:2} },
  { home: {g:'J',r:1}, away: {g:'I',r:2} },
  { home: {g:'K',r:1}, away: {g:'L',r:2} },
  { home: {g:'L',r:1}, away: {g:'K',r:2} },
]

function ScoreInput({ value, onChange, disabled }: { value: number|string, onChange: (v: number) => void, disabled?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <input
        type="number" min="0" max="20"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-12 h-12 text-center text-2xl font-black bg-gray-800 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500 disabled:opacity-40 disabled:cursor-not-allowed"
        placeholder="?"
      />
      <div className="flex gap-0.5">
        {[0,1,2,3,4,5].map(n => (
          <button key={n} onClick={() => !disabled && onChange(n)} disabled={disabled}
            className={`w-6 h-5 rounded text-xs font-bold transition-all disabled:opacity-30 ${value===n ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-white'}`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function GroupView({ group, matches, predictions, onSave, locked, onBack }: any) {
  const [localPreds, setLocalPreds] = useState<Record<string, {h: number|string, a: number|string}>>(() => {
    const init: Record<string, {h: number|string, a: number|string}> = {}
    matches.forEach((m: any) => {
      const p = predictions.find((p: any) => p.match_id === m.id)
      init[m.id] = { h: p?.home_score ?? '', a: p?.away_score ?? '' }
    })
    return init
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    for (const m of matches) {
      const pred = localPreds[m.id]
      if (pred.h !== '' && pred.a !== '') {
        await onSave(m.id, Number(pred.h), Number(pred.a))
      }
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); onBack() }, 1200)
  }

  const completed = matches.filter((m: any) => {
    const p = localPreds[m.id]
    return p.h !== '' && p.a !== ''
  }).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
          ← Volver
        </button>
        <h2 className="text-xl font-black text-white">Grupo {group}</h2>
        <span className="text-sm text-gray-500">{completed}/{matches.length} partidos</span>
      </div>

      <div className="space-y-3">
        {matches.map((m: any) => {
          const pred = localPreds[m.id]
          const isFinished = m.status === 'finished'
          return (
            <div key={m.id} className={`bg-gray-900 border rounded-2xl p-4 ${pred.h!==''&&pred.a!=='' ? 'border-green-500/30' : 'border-gray-800'}`}>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 justify-end">
                  {m.home_team?.flag_url && <img src={m.home_team.flag_url} className="w-7 h-5 object-cover rounded"/>}
                  <span className="font-bold text-white text-sm text-right">{m.home_team?.name}</span>
                </div>
                {isFinished ? (
                  <div className="px-4 py-2 bg-gray-800 rounded-xl text-center min-w-[80px]">
                    <span className="text-xl font-black text-white">{m.home_score}-{m.away_score}</span>
                  </div>
                ) : locked ? (
                  <div className="px-4 py-2 bg-gray-800 rounded-xl text-center min-w-[80px]">
                    {pred.h!=='' ? <span className="text-sm font-black text-blue-400">{pred.h}-{pred.a}</span>
                      : <span className="text-xs text-gray-500">🔒</span>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ScoreInput value={pred.h} onChange={v => setLocalPreds(p => ({...p, [m.id]: {...p[m.id], h: v}}))} />
                    <span className="text-2xl font-black text-gray-600">:</span>
                    <ScoreInput value={pred.a} onChange={v => setLocalPreds(p => ({...p, [m.id]: {...p[m.id], a: v}}))} />
                  </div>
                )}
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-bold text-white text-sm">{m.away_team?.name}</span>
                  {m.away_team?.flag_url && <img src={m.away_team.flag_url} className="w-7 h-5 object-cover rounded"/>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!locked && (
        <button onClick={handleSave} disabled={saving || completed === 0}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl disabled:opacity-50 text-sm">
          {saved ? '✅ ¡Guardado!' : saving ? 'Guardando...' : `💾 Guardar Grupo ${group}`}
        </button>
      )}
    </div>
  )
}

export default function BracketPage() {
  const { user } = useAuth()
  const { matches, loading } = useMatches()
  const { predictions, savePrediction } = usePredictions(user?.id)
  const [activeStage, setActiveStage] = useState('group')
  const [selectedGroup, setSelectedGroup] = useState<string|null>(null)

  const predMap = useMemo(() => new Map(predictions.map(p => [p.match_id, p])), [predictions])

  const groupMatches = useMemo(() => matches.filter(m => m.stage?.type === 'group'), [matches])

  // Calcular standings por grupo según predicciones
  const groupStandings = useMemo(() => {
    const standings: Record<string, any[]> = {}
    GROUPS.forEach(g => {
      const gMatches = groupMatches.filter(m => m.group_name === g)
      const teams: Record<string, any> = {}
      gMatches.forEach((m: any) => {
        if (!teams[m.home_team_id]) teams[m.home_team_id] = { ...m.home_team, pts: 0, gd: 0, gf: 0 }
        if (!teams[m.away_team_id]) teams[m.away_team_id] = { ...m.away_team, pts: 0, gd: 0, gf: 0 }
        const pred = predMap.get(m.id)
        if (!pred) return
        const h = pred.home_score, a = pred.away_score
        teams[m.home_team_id].gf += h; teams[m.away_team_id].gf += a
        teams[m.home_team_id].gd += h-a; teams[m.away_team_id].gd += a-h
        if (h>a) teams[m.home_team_id].pts += 3
        else if (h<a) teams[m.away_team_id].pts += 3
        else { teams[m.home_team_id].pts += 1; teams[m.away_team_id].pts += 1 }
      })
      standings[g] = Object.values(teams).sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf)
    })
    return standings
  }, [groupMatches, predMap])

  // Calcular cruces de R32 según standings
  const r32Matchups = useMemo(() => R32_MATCHUPS.map((matchup, i) => {
    const homeTeam = groupStandings[matchup.home.g]?.[matchup.home.r - 1]
    const awayTeam = groupStandings[matchup.away.g]?.[matchup.away.r - 1]
    const homeGroupDone = groupMatches.filter(m => m.group_name === matchup.home.g).every(m => predMap.has(m.id))
    const awayGroupDone = groupMatches.filter(m => m.group_name === matchup.away.g).every(m => predMap.has(m.id))
    return {
      id: `r32_${i}`,
      homeTeam: homeGroupDone ? homeTeam : null,
      awayTeam: awayGroupDone ? awayTeam : null,
      homeGroupDone,
      awayGroupDone,
      canPredict: homeGroupDone && awayGroupDone,
      label: `${matchup.home.r}° G${matchup.home.g} vs ${matchup.away.r}° G${matchup.away.g}`,
    }
  }), [groupStandings, groupMatches, predMap])

  // Calcular progreso por grupo
  const groupProgress = useMemo(() => {
    const prog: Record<string, {done: number, total: number}> = {}
    GROUPS.forEach(g => {
      const gMatches = groupMatches.filter(m => m.group_name === g)
      prog[g] = { done: gMatches.filter(m => predMap.has(m.id)).length, total: gMatches.length }
    })
    return prog
  }, [groupMatches, predMap])

  const totalGroupsDone = GROUPS.filter(g => groupProgress[g]?.done === groupProgress[g]?.total && groupProgress[g]?.total > 0).length

  const stages = ['group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final']

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-800 animate-pulse rounded-xl"/>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({length:12}).map((_,i) => <div key={i} className="h-24 bg-gray-800 animate-pulse rounded-2xl"/>)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">🏆 Mi Bracket</h1>
        <p className="text-gray-400 text-sm mt-1">Predice fase por fase · {totalGroupsDone}/12 grupos completos</p>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {stages.map(s => (
          <button key={s} onClick={() => { setActiveStage(s); setSelectedGroup(null) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeStage === s ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}>
            {STAGE_LABELS[s]}
          </button>
        ))}
      </div>

      {/* GRUPOS */}
      {activeStage === 'group' && (
        selectedGroup ? (
          <GroupView
            group={selectedGroup}
            matches={groupMatches.filter(m => m.group_name === selectedGroup)}
            predictions={predictions}
            onSave={savePrediction}
            locked={false}
            onBack={() => setSelectedGroup(null)}
          />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Toca un grupo para ingresar tus predicciones</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {GROUPS.map(g => {
                const prog = groupProgress[g]
                const isDone = prog.done === prog.total && prog.total > 0
                const standing = groupStandings[g]
                return (
                  <button key={g} onClick={() => setSelectedGroup(g)}
                    className={`bg-gray-900 border rounded-2xl p-4 text-left transition-all hover:border-gray-500 hover:shadow-lg ${
                      isDone ? 'border-green-500/40 bg-green-500/5' : prog.done > 0 ? 'border-yellow-500/40' : 'border-gray-800'
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-black text-white">Grupo {g}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isDone ? 'bg-green-500/20 text-green-400' :
                        prog.done > 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {isDone ? '✅' : `${prog.done}/${prog.total}`}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {standing.slice(0,4).map((team: any, i: number) => (
                        <div key={team.id} className="flex items-center gap-2">
                          <span className={`text-xs w-4 font-bold ${i < 2 ? 'text-green-400' : 'text-gray-500'}`}>{i+1}</span>
                          {team.flag_url && <img src={team.flag_url} className="w-5 h-3.5 object-cover rounded"/>}
                          <span className={`text-xs truncate flex-1 ${i < 2 ? 'text-white' : 'text-gray-400'}`}>{team.short_name}</span>
                          <span className="text-xs font-black text-gray-300">{team.pts}</span>
                        </div>
                      ))}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${isDone ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${prog.total > 0 ? (prog.done/prog.total)*100 : 0}%` }}/>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      )}

      {/* RONDA DE 32 */}
      {activeStage === 'round_of_32' && (
        <div className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-center gap-2">
            <span className="text-yellow-400 font-bold">⭐ +{STAGE_POINTS.round_of_32} pts</span>
            <span className="text-gray-300 text-sm">por cada equipo que clasifiques correctamente</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {r32Matchups.map((matchup: any) => (
              <div key={matchup.id} className={`bg-gray-900 border rounded-2xl p-4 ${matchup.canPredict ? 'border-gray-700' : 'border-gray-800 opacity-60'}`}>
                <p className="text-xs text-gray-500 mb-3">{matchup.label}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    {matchup.homeTeam ? (
                      <>
                        {matchup.homeTeam.flag_url && <img src={matchup.homeTeam.flag_url} className="w-7 h-5 object-cover rounded"/>}
                        <span className="font-bold text-white text-sm">{matchup.homeTeam.name}</span>
                      </>
                    ) : (
                      <span className="text-gray-500 text-sm italic">Por definir</span>
                    )}
                  </div>
                  <span className="text-gray-600 font-bold">vs</span>
                  <div className="flex items-center gap-2 flex-1">
                    {matchup.awayTeam ? (
                      <>
                        <span className="font-bold text-white text-sm">{matchup.awayTeam.name}</span>
                        {matchup.awayTeam.flag_url && <img src={matchup.awayTeam.flag_url} className="w-7 h-5 object-cover rounded"/>}
                      </>
                    ) : (
                      <span className="text-gray-500 text-sm italic">Por definir</span>
                    )}
                  </div>
                </div>
                {!matchup.canPredict && (
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    {!matchup.homeGroupDone && !matchup.awayGroupDone ? 'Completa ambos grupos' :
                     !matchup.homeGroupDone ? `Completa Grupo ${R32_MATCHUPS[r32Matchups.indexOf(matchup)]?.home.g}` :
                     `Completa Grupo ${R32_MATCHUPS[r32Matchups.indexOf(matchup)]?.away.g}`}
                  </p>
                )}
                {matchup.canPredict && (
                  <p className="text-xs text-green-400 mt-2 text-center">✅ Listo para predecir</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FASES SIGUIENTES */}
      {['round_of_16', 'quarter_final', 'semi_final', 'final'].includes(activeStage) && (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">⏳</p>
          <h3 className="text-xl font-bold text-white mb-2">{STAGE_LABELS[activeStage]}</h3>
          <p className="text-gray-400 text-sm">
            Disponible cuando completes la Ronda de 32
          </p>
          {STAGE_POINTS[activeStage] && (
            <div className="mt-4 inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-xl">
              <span className="text-yellow-400 font-bold">⭐ +{STAGE_POINTS[activeStage]} pts</span>
              <span className="text-gray-300 text-sm">por clasificado correcto</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
