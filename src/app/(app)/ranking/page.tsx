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
  const [selectedPreds, setSelectedPreds] = useState<any[]>([])
  const [loadingPreds, setLoadingPreds] = useState(false)
  const pageSize = 20

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">📊 Ranking</h1>
        <span className="text-sm text-gray-500">{count} participantes</span>
      </div>

      {/* Sistema de puntos */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">⭐ Sistema de puntos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Marcador exacto', pts: '5 pts', color: 'text-green-600 dark:text-green-400', icon: '🎯' },
            { label: 'Resultado correcto', pts: '3 pts', color: 'text-blue-600 dark:text-blue-400', icon: '✅' },
            { label: 'Clasif. Octavos', pts: '5 pts', color: 'text-yellow-600 dark:text-yellow-400', icon: '⚽' },
            { label: 'Clasif. Cuartos', pts: '7 pts', color: 'text-orange-600 dark:text-orange-400', icon: '⚽' },
            { label: 'Clasif. Semis', pts: '10 pts', color: 'text-purple-600 dark:text-purple-400', icon: '⚽' },
            { label: 'Campeon', pts: '25 pts', color: 'text-yellow-500', icon: '🏆' },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
              <span className="text-xs text-gray-500 flex items-center gap-1">{r.icon} {r.label}</span>
              <span className={`text-xs font-black ml-2 flex-shrink-0 ${r.color}`}>{r.pts}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Desempate: exactos → acertados → campeón → finalistas → efectividad</p>
      </div>

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
                <button key={r.id} onClick={() => setSelected(r)}
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

            {/* Pronósticos publicados */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">⚽ Pronósticos en partidos publicados</p>
              </div>
              {loadingPreds ? (
                <div className="py-6 text-center text-xs text-gray-400">Cargando...</div>
              ) : selectedPreds.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">Sin partidos publicados aún</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto">
                  {selectedPreds.map(pred => {
                    const m = (pred as any).match
                    const isExact = pred.points_earned >= 5
                    const isCorrect = pred.points_earned >= 3 && pred.points_earned < 5
                    const isFail = pred.points_earned === 0
                    return (
                      <div key={pred.id} className="flex items-center gap-2 px-3 py-2">
                        {/* Equipos reales */}
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          {m?.home_team?.flag_url && <img src={m.home_team.flag_url} className="w-4 h-3 object-cover rounded flex-shrink-0"/>}
                          <span className="text-xs text-gray-500 truncate">{m?.home_team?.short_name}</span>
                          <span className="text-xs font-black text-gray-900 dark:text-white mx-1">{m?.home_score}-{m?.away_score}</span>
                          <span className="text-xs text-gray-500 truncate">{m?.away_team?.short_name}</span>
                          {m?.away_team?.flag_url && <img src={m.away_team.flag_url} className="w-4 h-3 object-cover rounded flex-shrink-0"/>}
                        </div>
                        {/* Pronóstico */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs text-gray-400">Pred:</span>
                          <span className={`text-xs font-bold ${isExact ? 'text-green-500' : isCorrect ? 'text-blue-500' : 'text-red-400'}`}>
                            {pred.home_score}-{pred.away_score}
                          </span>
                        </div>
                        {/* Puntos */}
                        <span className={`text-xs font-black flex-shrink-0 w-8 text-right ${isExact ? 'text-green-500' : isCorrect ? 'text-blue-500' : 'text-gray-300'}`}>
                          {pred.points_earned > 0 ? `+${pred.points_earned}` : '0'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
