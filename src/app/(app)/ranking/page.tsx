'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useGlobalRanking } from '@/hooks/useRanking'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'

function getRankBadge(rank: number | null, points: number) {
  if (rank === null || rank === undefined) return '?'
  // Solo mostrar medallas si hay puntos
  if (points > 0) {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
  }
  return '#' + rank
}

function getEfficiency(r: any) {
  if (!r.total_predictions) return 0
  return Math.round(((r.exact_scores + r.correct_results) / r.total_predictions) * 100)
}

export default function RankingPage() {
  const { user } = useAuth()
  const { ranking, count, loading } = useGlobalRanking(1)
  const [selected, setSelected] = useState<any>(null)
  const [showPoints, setShowPoints] = useState(false)
  const [selectedPreds, setSelectedPreds] = useState<any[]>([])
  const [loadingPreds, setLoadingPreds] = useState(false)
  const [predTab, setPredTab] = useState('group')
  const pageSize = 20

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">📊 Ranking</h1>
        <span className="text-sm text-gray-500">{count} participantes</span>
      </div>

      {/* Sistema de puntos - botón */}
      <button onClick={() => setShowPoints(true)}
        className="w-full flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
        <span className="text-sm font-bold text-gray-900 dark:text-white">⭐ ¿Cómo se ganan los puntos?</span>
        <span className="text-xs text-green-600 dark:text-green-400 font-bold">Ver →</span>
      </button>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <span className="w-10 text-xs font-bold text-gray-400">#</span>
          <span className="flex-1 text-xs font-bold text-gray-400">Jugador</span>
          <span className="w-16 text-center text-xs font-bold text-gray-400">Pts</span>
          {/* Columnas extras solo en desktop */}
          <span className="hidden sm:block w-10 text-center text-xs font-bold text-green-500">🎯</span>
          <span className="hidden sm:block w-10 text-center text-xs font-bold text-blue-500">✅</span>
          <span className="hidden sm:block w-10 text-center text-xs font-bold text-red-500">❌</span>
          <span className="hidden sm:block w-12 text-center text-xs font-bold text-purple-500">%</span>
          <span className="w-8 text-center text-xs font-bold text-gray-400 sm:hidden">→</span>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from({length: 8}).map((_, i) => (
              <div key={i} className="px-4 py-3"><Skeleton className="h-8 rounded-lg"/></div>
            ))}
          </div>
        ) : ranking.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📊</p>
            <p className="text-sm">Sin participantes aun</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {ranking.map((r: any) => {
              const isMe = r.user_id === user?.id
              const failed = r.total_predictions === 0 ? 0 : Math.max(0, r.total_predictions - r.exact_scores - r.correct_results)
              return (
                <button key={r.id} onClick={async () => {
                    setSelected(r)
                    setLoadingPreds(true)
                    setSelectedPreds([])
                    const supabase = createClient()
                    const { data } = await supabase
                      .from('predictions')
                      .select('*, home_team_id, away_team_id, match:matches!inner(match_number, home_score, away_score, match_date, home_team_id, away_team_id, stage:stages(type), home_team:teams!home_team_id(short_name, flag_url), away_team:teams!away_team_id(short_name, flag_url)), pred_home_team:teams!home_team_id(short_name, flag_url), pred_away_team:teams!away_team_id(short_name, flag_url)')
                      .eq('user_id', r.user_id)
                      .eq('is_calculated', true)
                    const sorted = (data ?? []).sort((a: any, b: any) => {
                      const dateA = new Date(a.match?.match_date ?? 0).getTime()
                      const dateB = new Date(b.match?.match_date ?? 0).getTime()
                      return dateB - dateA
                    })
                    setSelectedPreds(sorted)
                    setLoadingPreds(false)
                  }}
                  className={`w-full flex items-center px-4 py-3 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 ${isMe ? 'bg-green-50 dark:bg-green-500/5' : 'bg-white dark:bg-gray-900'}`}>
                  {/* Posición */}
                  <div className="w-10 flex-shrink-0 text-center">
                    <span className="text-sm font-bold text-gray-500">
                      {r.rank ? `#${r.rank}` : '?'}
                    </span>
                  </div>
                  {/* Jugador */}
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <Avatar src={r.profile?.avatar_url} name={r.profile?.display_name || r.profile?.username} size="sm"/>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {r.profile?.display_name || r.profile?.username}
                        {isMe && <span className="ml-1 text-green-600 dark:text-green-400 text-xs">(Tú)</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {((r as any).total_filled ?? r.total_predictions) >= 104
                          ? <span className="text-xs bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full font-bold">✅ 104/104</span>
                          : r.total_predictions > 0
                          ? <span className="text-xs bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-full">{(r as any).total_filled ?? r.total_predictions}/104</span>
                          : <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-full">Sin pronósticos</span>
                        }
                      </div>
                    </div>
                  </div>
                  {/* Puntos - siempre visible */}
                  <div className="w-16 text-center flex-shrink-0">
                    <span className="text-base font-black text-gray-900 dark:text-white">{r.total_points}</span>
                  </div>
                  {/* Stats - solo desktop */}
                  <div className="hidden sm:block w-10 text-center flex-shrink-0">
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">{r.exact_scores}</span>
                  </div>
                  <div className="hidden sm:block w-10 text-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{r.correct_results}</span>
                  </div>
                  <div className="hidden sm:block w-10 text-center flex-shrink-0">
                    <span className="text-sm font-bold text-red-500">{failed}</span>
                  </div>
                  <div className="hidden sm:block w-12 text-center flex-shrink-0">
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{getEfficiency(r)}%</span>
                  </div>
                  {/* Flecha - solo móvil */}
                  <div className="w-8 text-center flex-shrink-0 sm:hidden">
                    <span className="text-gray-300 dark:text-gray-600 text-sm">›</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Paginación */}

      {/* Modal sistema de puntos */}
      <Modal open={showPoints} onClose={() => setShowPoints(false)} title="⭐ ¿Cómo se ganan puntos?">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-black text-green-700 dark:text-green-400 mb-2">🏟️ FASE DE GRUPOS</p>
            <div className="space-y-2">
              <div className="bg-green-50 dark:bg-green-500/10 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">🎯 Marcador exacto</span>
                  <span className="text-sm font-black text-green-600 dark:text-green-400">+5 pts</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Pusiste México 2-1 y terminó 2-1 ✅</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">✅ Acertaste quién ganó o si fue empate</span>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">+3 pts</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Pusiste México gana y ganó, pero con diferente marcador ✅</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-cyan-700 dark:text-cyan-400 mb-2">⚔️ RONDA DE 32</p>
            <div className="space-y-2">
              <div className="bg-cyan-50 dark:bg-cyan-500/10 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">⚽ Por cada equipo que pusiste y sí clasificó</span>
                  <span className="text-sm font-black text-cyan-600 dark:text-cyan-400">+3 pts</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Pusiste Colombia en una llave y Colombia sí clasificó → +3 pts por Colombia</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-500/10 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">🔥 Acertaste quién ganó esa llave y pasó a Octavos</span>
                  <span className="text-sm font-black text-yellow-600 dark:text-yellow-400">+5 pts</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Pusiste Colombia ganando y Colombia pasó a Octavos → +5 pts</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">🎯 Acertaste el marcador exacto de la llave</span>
                  <span className="text-sm font-black text-gray-600 dark:text-gray-300">+5 pts</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Solo si pusiste exactamente los mismos dos equipos que jugaron</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-orange-700 dark:text-orange-400 mb-2">🔥 OCTAVOS, CUARTOS Y SEMIS</p>
            <div className="space-y-2">
              <div className="bg-orange-50 dark:bg-orange-500/10 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">💥 Acertaste quién ganó en Octavos y pasó a Cuartos</span>
                  <span className="text-sm font-black text-orange-600 dark:text-orange-400">+7 pts</span>
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-500/10 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">⭐ Acertaste quién ganó en Cuartos y pasó a Semis</span>
                  <span className="text-sm font-black text-purple-600 dark:text-purple-400">+10 pts</span>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">🌟 Acertaste quién ganó en Semis y llegó a la Final</span>
                  <span className="text-sm font-black text-red-600 dark:text-red-400">+15 pts</span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">🎯 Marcador exacto en cada llave</span>
                  <span className="text-sm font-black text-gray-600 dark:text-gray-300">+5 pts</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Solo si pusiste exactamente los mismos dos equipos que jugaron</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-yellow-700 dark:text-yellow-400 mb-2">🏆 TERCER LUGAR Y FINAL</p>
            <div className="space-y-2">
              <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">🥉 Acertaste el equipo que ganó el 3er lugar</span>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">+10 pts</span>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">4️⃣ Acertaste el equipo que quedó de 4to lugar</span>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">+8 pts</span>
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-500/10 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">🥈 Acertaste el Subcampeón (perdedor de la final)</span>
                  <span className="text-sm font-black text-yellow-600 dark:text-yellow-400">+15 pts</span>
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-500/10 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">🏆 Acertaste el Campeón del Mundial</span>
                  <span className="text-sm font-black text-yellow-500">+25 pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal detalle */}
      <Modal open={!!selected} onClose={() => { setSelected(null); setSelectedPreds([]) }}
        title={selected?.profile?.display_name || selected?.profile?.username || ''}>
        {selected && (
          <div className="space-y-3">
            {/* Header compacto */}
            <div className="flex items-center gap-3">
              <Avatar src={selected.profile?.avatar_url} name={selected.profile?.display_name || selected.profile?.username} size="lg"/>
              <div className="flex-1">
                <p className="text-lg font-black text-gray-900 dark:text-white">{selected.profile?.display_name || selected.profile?.username}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">{selected.total_points} pts</span>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span className="text-sm text-gray-500">Puesto #{selected.rank ?? '?'}</span>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span className="text-sm text-gray-500">{getEfficiency(selected)}% efect.</span>
                </div>
              </div>
            </div>

            {/* Stats en fila */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Exactos', value: selected.exact_scores, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
                { label: 'Correctos', value: selected.correct_results, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                { label: 'Fallados', value: (selected.exact_scores + selected.correct_results) === 0 ? 0 : Math.max(0, selected.total_predictions - selected.exact_scores - selected.correct_results), color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
                { label: 'Jugados', value: selected.total_predictions, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-2 text-center`}>
                  <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Pronósticos por fase */}
            {(() => {
              const TABS = [
                { key: 'group', label: '⚽', name: 'Grupos' },
                { key: 'round_of_32', label: '🔵', name: 'R32' },
                { key: 'round_of_16', label: '🟡', name: 'Octavos' },
                { key: 'quarter_final', label: '🟠', name: 'Cuartos' },
                { key: 'semi_final', label: '🔴', name: 'Semis' },
                { key: 'third_place', label: '🥉', name: '3°' },
                { key: 'final', label: '🏆', name: 'Final' },
              ]
              const predsForTab = selectedPreds.filter(p => (p as any).match?.stage?.type === predTab)
              const tabPoints = predsForTab.reduce((sum: number, p: any) => sum + (p.points_earned || 0), 0)
              return (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  {/* Tabs scrollable */}
                  <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    {TABS.map(t => {
                      const count = selectedPreds.filter(p => (p as any).match?.stage?.type === t.key).length
                      if (count === 0 && t.key !== 'group') return null
                      return (
                        <button key={t.key} onClick={() => setPredTab(t.key)}
                          className={`flex-shrink-0 px-3 py-2 text-xs font-bold transition-all border-b-2 ${predTab === t.key ? 'border-green-500 text-green-600 dark:text-green-400 bg-white dark:bg-gray-900' : 'border-transparent text-gray-400'}`}>
                          {t.label} {t.name}
                        </button>
                      )
                    })}
                  </div>
                  {loadingPreds ? (
                    <div className="py-6 text-center text-xs text-gray-400">Cargando...</div>
                  ) : predsForTab.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400">Sin partidos publicados en esta fase</div>
                  ) : (
                    <>
                      {/* Total puntos fase */}
                      <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                        <span className="text-xs text-gray-400">{predsForTab.length} partidos</span>
                        <span className="text-xs font-black text-green-600 dark:text-green-400">+{tabPoints} pts en esta fase</span>
                      </div>
                      <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-56 overflow-y-auto">
                        {predsForTab.map((pred: any) => {
                          const m = pred.match
                          const isExact = pred.points_earned >= 5
                          const isCorrect = pred.points_earned >= 3 && pred.points_earned < 5
                          const isGroup = m?.stage?.type === 'group'
                          const predHome = pred.pred_home_team
                          const predAway = pred.pred_away_team
                          const dispHome = isGroup ? m?.home_team : predHome
                          const dispAway = isGroup ? m?.away_team : predAway
                          // Calcular desglose para eliminatorias
                          const stageType = m?.stage?.type
                          const realHomeId = m?.home_team_id || m?.home_team?.id
                          const realAwayId = m?.away_team_id || m?.away_team?.id
                          const predHomeId = pred.home_team_id
                          const predAwayId = pred.away_team_id
                          const homeMatch = predHomeId && (predHomeId === realHomeId || predHomeId === realAwayId)
                          const awayMatch = predAwayId && (predAwayId === realHomeId || predAwayId === realAwayId)
                          const bothMatch = homeMatch && awayMatch
                          const exactScore = bothMatch && pred.home_score === m?.home_score && pred.away_score === m?.away_score
                          const predWinnerId = pred.home_score > pred.away_score ? predHomeId : pred.away_score > pred.home_score ? predAwayId : null
                          const realWinnerId = m?.home_score > m?.away_score ? realHomeId : realAwayId
                          const winnerMatch = predWinnerId && predWinnerId === realWinnerId

                          const breakdown: string[] = []
                          if (!isGroup && stageType === 'round_of_32') {
                            if (homeMatch) breakdown.push(`${predHome?.short_name} +3`)
                            if (awayMatch) breakdown.push(`${predAway?.short_name} +3`)
                            if (exactScore) breakdown.push('exacto +5')
                            if (winnerMatch) breakdown.push('avance +5')
                          } else if (!isGroup && stageType === 'round_of_16') {
                            if (exactScore) breakdown.push('exacto +5')
                            if (winnerMatch) breakdown.push('avance +7')
                          } else if (!isGroup && stageType === 'quarter_final') {
                            if (exactScore) breakdown.push('exacto +5')
                            if (winnerMatch) breakdown.push('avance +10')
                          } else if (!isGroup && stageType === 'semi_final') {
                            if (exactScore) breakdown.push('exacto +5')
                            if (winnerMatch) breakdown.push('avance +15')
                          } else if (!isGroup && stageType === 'third_place') {
                            if (exactScore) breakdown.push('exacto +5')
                            if (winnerMatch) breakdown.push('3er lugar +10')
                            const predLoserId = pred.home_score > pred.away_score ? predAwayId : predHomeId
                            const realLoserId = m?.home_score > m?.away_score ? realAwayId : realHomeId
                            if (predLoserId && predLoserId === realLoserId) breakdown.push('4to lugar +8')
                          } else if (!isGroup && stageType === 'final') {
                            if (exactScore) breakdown.push('exacto +5')
                            if (winnerMatch) breakdown.push('campeón +25')
                            const predLoserId = pred.home_score > pred.away_score ? predAwayId : predHomeId
                            const realLoserId = m?.home_score > m?.away_score ? realAwayId : realHomeId
                            if (predLoserId && predLoserId === realLoserId) breakdown.push('subcampeón +15')
                          }

                          return (
                            <div key={pred.id} className="px-3 py-2">
                              {/* Fila: Real vs Pronóstico vs Puntos */}
                              <div className="flex items-center gap-2">
                                {/* Resultado real */}
                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                  <span className="text-xs text-gray-400 flex-shrink-0 w-7">Real</span>
                                  {m?.home_team?.flag_url && <img src={m.home_team.flag_url} className="w-4 h-3 object-cover rounded flex-shrink-0"/>}
                                  <span className="text-xs font-black text-gray-900 dark:text-white">{m?.home_score}-{m?.away_score}</span>
                                  {m?.away_team?.flag_url && <img src={m.away_team.flag_url} className="w-4 h-3 object-cover rounded flex-shrink-0"/>}
                                </div>
                                {/* Separador */}
                                <span className="text-gray-200 dark:text-gray-700 text-xs">|</span>
                                {/* Pronóstico usuario */}
                                <div className="flex flex-col flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-400 flex-shrink-0 w-7">Pred</span>
                                  {dispHome?.flag_url && <img src={dispHome.flag_url} className="w-4 h-3 object-cover rounded flex-shrink-0"/>}
                                  <span className={`text-xs font-black ${isExact ? 'text-green-500' : isCorrect ? 'text-blue-400' : 'text-red-400'}`}>
                                    {pred.home_score}-{pred.away_score}
                                  </span>
                                  {dispAway?.flag_url && <img src={dispAway.flag_url} className="w-4 h-3 object-cover rounded flex-shrink-0"/>}
                                </div>
                                  </div>
                                {/* Puntos */}
                                <span className={`text-xs font-black w-8 text-right flex-shrink-0 ${pred.points_earned > 0 ? 'text-green-500' : 'text-gray-300'}`}>
                                  {pred.points_earned > 0 ? `+${pred.points_earned}` : '0'}
                                </span>
                              </div>
                                  {!isGroup && breakdown.length > 0 && (
                                    <p className="text-xs text-gray-400 mt-0.5 pl-7 truncate">
                                      {breakdown.join(' · ')}
                                    </p>
                                  )}
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </Modal>
    </div>
  )
}
