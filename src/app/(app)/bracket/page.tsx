'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'
import { createClient } from '@/lib/supabase/client'
import { Tabs } from '@/components/ui/Tabs'

const STAGE_TABS = [
  { id: 'groups', label: '🏟️ Grupos' },
  { id: 'round_of_32', label: '⚔️ Ronda 32' },
  { id: 'round_of_16', label: '🔥 Octavos' },
  { id: 'quarter_final', label: '💥 Cuartos' },
  { id: 'semi_final', label: '⭐ Semis' },
  { id: 'final', label: '🏆 Final' },
]

const STAGE_POINTS: Record<string, number> = {
  round_of_32: 5,
  round_of_16: 5,
  quarter_final: 7,
  semi_final: 10,
  final: 15,
}

function MatchCard({ match, prediction, onPredict, locked }: any) {
  const [home, setHome] = useState<number | ''>(prediction?.home_score ?? '')
  const [away, setAway] = useState<number | ''>(prediction?.away_score ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (home === '' || away === '') return
    setSaving(true)
    await onPredict(match.id, Number(home), Number(away))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'

  return (
    <div className={`bg-gray-900 border rounded-2xl p-4 ${isLive ? 'border-red-500/40' : prediction ? 'border-green-500/30' : 'border-gray-800'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500">
          {match.stage?.name} {match.group_name && `· Grupo ${match.group_name}`}
        </span>
        {isLive && <span className="text-xs text-red-400 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>EN VIVO</span>}
        {isFinished && <span className="text-xs text-gray-500">Finalizado</span>}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 justify-end">
          {match.home_team?.flag_url && <img src={match.home_team.flag_url} className="w-8 h-5 object-cover rounded"/>}
          <span className="font-bold text-white text-sm text-right">{match.home_team?.name}</span>
        </div>

        {isFinished || isLive ? (
          <div className="px-4 py-2 bg-gray-800 rounded-xl text-center min-w-[80px]">
            <span className="text-xl font-black text-white">{match.home_score}-{match.away_score}</span>
          </div>
        ) : locked ? (
          <div className="px-4 py-2 bg-gray-800 rounded-xl text-center min-w-[80px]">
            {prediction ? (
              <span className="text-sm font-black text-blue-400">{prediction.home_score}-{prediction.away_score}</span>
            ) : (
              <span className="text-xs text-gray-500">🔒</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <input type="number" min="0" max="20" value={home}
                onChange={e => setHome(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-12 h-12 text-center text-2xl font-black bg-gray-800 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"/>
              <div className="flex gap-0.5">
                {[0,1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setHome(n)}
                    className={`w-6 h-5 rounded text-xs font-bold transition-all ${home===n?'bg-green-600 text-white':'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>{n}</button>
                ))}
              </div>
            </div>
            <span className="text-2xl font-black text-gray-600">:</span>
            <div className="flex flex-col items-center gap-1">
              <input type="number" min="0" max="20" value={away}
                onChange={e => setAway(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-12 h-12 text-center text-2xl font-black bg-gray-800 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"/>
              <div className="flex gap-0.5">
                {[0,1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setAway(n)}
                    className={`w-6 h-5 rounded text-xs font-bold transition-all ${away===n?'bg-green-600 text-white':'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>{n}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 flex-1">
          <span className="font-bold text-white text-sm">{match.away_team?.name}</span>
          {match.away_team?.flag_url && <img src={match.away_team.flag_url} className="w-8 h-5 object-cover rounded"/>}
        </div>
      </div>

      {prediction?.is_calculated && (
        <div className="mt-2 text-center">
          <span className={`text-sm font-bold ${prediction.points_earned >= 5 ? 'text-green-400' : prediction.points_earned >= 3 ? 'text-blue-400' : 'text-gray-500'}`}>
            +{prediction.points_earned} pts
          </span>
        </div>
      )}

      {!locked && !isFinished && !isLive && (
        <button onClick={handleSave} disabled={home===''||away===''||saving}
          className="mt-3 w-full py-2 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl text-sm disabled:opacity-50">
          {saved ? '✅ Guardado' : saving ? 'Guardando...' : prediction ? '📝 Actualizar' : '💾 Guardar'}
        </button>
      )}
    </div>
  )
}

function GroupStandings({ matches, predictions, groupName }: any) {
  const groupMatches = matches.filter((m: any) => m.group_name === groupName)
  const teams: Record<string, any> = {}

  groupMatches.forEach((m: any) => {
    if (!teams[m.home_team_id]) teams[m.home_team_id] = { ...m.home_team, pts: 0, gd: 0, gf: 0, played: 0 }
    if (!teams[m.away_team_id]) teams[m.away_team_id] = { ...m.away_team, pts: 0, gd: 0, gf: 0, played: 0 }

    const pred = predictions.find((p: any) => p.match_id === m.id)
    if (!pred) return

    const h = pred.home_score, a = pred.away_score
    teams[m.home_team_id].gf += h
    teams[m.away_team_id].gf += a
    teams[m.home_team_id].gd += h - a
    teams[m.away_team_id].gd += a - h
    teams[m.home_team_id].played++
    teams[m.away_team_id].played++

    if (h > a) { teams[m.home_team_id].pts += 3 }
    else if (h < a) { teams[m.away_team_id].pts += 3 }
    else { teams[m.home_team_id].pts += 1; teams[m.away_team_id].pts += 1 }
  })

  const sorted = Object.values(teams).sort((a: any, b: any) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-3 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs font-bold text-gray-400 uppercase">Grupo {groupName}</span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-500 border-b border-gray-800">
            <th className="text-left px-3 py-1.5">Equipo</th>
            <th className="text-center px-2 py-1.5">PJ</th>
            <th className="text-center px-2 py-1.5">DG</th>
            <th className="text-center px-2 py-1.5 font-black text-white">Pts</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((team: any, i: number) => (
            <tr key={team.id} className={`border-b border-gray-800/50 ${i < 2 ? 'bg-green-500/5' : ''}`}>
              <td className="px-3 py-1.5 flex items-center gap-2">
                {i < 2 && <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"/>}
                {team.flag_url && <img src={team.flag_url} className="w-5 h-3 object-cover rounded"/>}
                <span className={`font-medium ${i < 2 ? 'text-white' : 'text-gray-400'}`}>{team.short_name}</span>
              </td>
              <td className="text-center px-2 py-1.5 text-gray-400">{team.played}</td>
              <td className="text-center px-2 py-1.5 text-gray-400">{team.gd > 0 ? '+' : ''}{team.gd}</td>
              <td className="text-center px-2 py-1.5 font-black text-white">{team.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function BracketPage() {
  const { user } = useAuth()
  const { matches, loading } = useMatches()
  const { predictions, savePrediction } = usePredictions(user?.id)
  const [activeTab, setActiveTab] = useState('groups')

  const predMap = new Map(predictions.map(p => [p.match_id, p]))
  const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

  const groupMatches = matches.filter(m => m.stage?.type === 'group')
  const koMatches = matches.filter(m => m.stage?.type !== 'group')

  const totalGroupPreds = groupMatches.filter(m => predMap.has(m.id)).length
  const totalGroups = groupMatches.length
  const pct = totalGroups > 0 ? Math.round((totalGroupPreds / totalGroups) * 100) : 0

  const stageMatches = (stageType: string) =>
    matches.filter(m => m.stage?.type === stageType)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">🏆 Mi Bracket</h1>
        <p className="text-gray-400 text-sm mt-1">Predice fase por fase hasta el campeón</p>
      </div>

      {/* Progreso */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Grupos completados</span>
          <span className="text-sm font-bold text-white">{totalGroupPreds}/{totalGroups}</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}/>
        </div>
        {pct < 100 && (
          <p className="text-xs text-yellow-400 mt-2">⚡ Completa los grupos para desbloquear las eliminatorias</p>
        )}
      </div>

      <Tabs tabs={STAGE_TABS} onChange={setActiveTab}>
        {() => (
          <div className="space-y-4">
            {activeTab === 'groups' && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                  {GROUPS.map(g => (
                    <GroupStandings key={g} matches={groupMatches} predictions={predictions} groupName={g} />
                  ))}
                </div>
                <h3 className="text-lg font-bold text-white">Partidos de grupos</h3>
                <div className="space-y-3">
                  {groupMatches.map(m => (
                    <MatchCard key={m.id} match={m} prediction={predMap.get(m.id)}
                      locked={m.is_locked} onPredict={savePrediction} />
                  ))}
                </div>
              </>
            )}

            {activeTab !== 'groups' && (
              <>
                {stageMatches(activeTab).length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-5xl mb-3">⏳</p>
                    <h3 className="text-xl font-bold text-white mb-2">Fase no disponible aún</h3>
                    <p className="text-gray-400 text-sm">
                      {pct < 100
                        ? 'Primero completa todas tus predicciones de grupos'
                        : 'Los cruces se generarán cuando terminen los partidos de grupos'}
                    </p>
                    {STAGE_POINTS[activeTab] && (
                      <div className="mt-4 inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-xl">
                        <span className="text-yellow-400 font-bold">⭐ {STAGE_POINTS[activeTab]} pts</span>
                        <span className="text-gray-400 text-sm">por clasificado correcto en esta fase</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeTab !== 'groups' && STAGE_POINTS[activeTab] && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-center gap-2">
                        <span className="text-yellow-400 font-bold text-lg">⭐ +{STAGE_POINTS[activeTab]} pts</span>
                        <span className="text-gray-300 text-sm">por cada equipo que clasifiques correctamente a esta fase</span>
                      </div>
                    )}
                    {stageMatches(activeTab).map(m => (
                      <MatchCard key={m.id} match={m} prediction={predMap.get(m.id)}
                        locked={m.is_locked} onPredict={savePrediction} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Tabs>
    </div>
  )
}
