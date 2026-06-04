'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useGlobalRanking } from '@/hooks/useRanking'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'

function getRankBadge(rank: number | null) {
  if (!rank) return '?'
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

function getEfficiency(r: any) {
  if (!r.total_predictions) return 0
  return Math.round(((r.exact_scores + r.correct_results) / r.total_predictions) * 100)
}

export default function RankingPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const { ranking, count, loading } = useGlobalRanking(page)
  const [selected, setSelected] = useState<any>(null)
  const pageSize = 20

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">📊 Ranking</h1>
        <span className="text-sm text-gray-500">{count} participantes</span>
      </div>

      {/* Sistema de puntos */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <h3 className="text-sm font-bold text-white mb-3">⭐ Sistema de puntos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Marcador exacto', pts: '5 pts', color: 'text-green-400', icon: '🎯' },
            { label: 'Resultado correcto', pts: '3 pts', color: 'text-blue-400', icon: '✅' },
            { label: 'Clasificado Octavos', pts: '5 pts', color: 'text-yellow-400', icon: '⚽' },
            { label: 'Clasificado Cuartos', pts: '7 pts', color: 'text-orange-400', icon: '⚽' },
            { label: 'Clasificado Semis', pts: '10 pts', color: 'text-purple-400', icon: '⚽' },
            { label: 'Campeón correcto', pts: '25 pts', color: 'text-yellow-300', icon: '🏆' },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between bg-gray-800 rounded-xl px-3 py-2">
              <span className="text-xs text-gray-400 flex items-center gap-1">{r.icon} {r.label}</span>
              <span className={`text-xs font-black ml-2 flex-shrink-0 ${r.color}`}>{r.pts}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Desempate: puntos → exactos → acertados → fecha de registro
        </p>
      </div>

      {/* Tabla */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-4 py-2 bg-gray-800/60 border-b border-gray-700">
          <span className="w-10 text-xs font-bold text-gray-500">#</span>
          <span className="flex-1 text-xs font-bold text-gray-500">Jugador</span>
          <span className="w-14 text-center text-xs font-bold text-gray-500">Pts</span>
          <span className="w-10 text-center text-xs font-bold text-green-500">🎯</span>
          <span className="w-10 text-center text-xs font-bold text-blue-500">✅</span>
          <span className="w-10 text-center text-xs font-bold text-red-500">❌</span>
          <span className="w-12 text-center text-xs font-bold text-purple-500">%</span>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-800">
            {Array.from({length: 8}).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <Skeleton className="h-8 rounded-lg"/>
              </div>
            ))}
          </div>
        ) : ranking.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-2">📊</p>
            <p>Aún no hay participantes con puntos</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {ranking.map((r: any) => {
              const isMe = r.user_id === user?.id
              const failed = Math.max(0, r.total_predictions - r.exact_scores - r.correct_results)
              const pct = getEfficiency(r)
              return (
                <button key={r.id} onClick={() => setSelected(r)}
                  className={`w-full flex items-center px-4 py-3 transition-all hover:bg-gray-800/50 active:bg-gray-800 ${isMe ? 'bg-green-500/5' : ''}`}>
                  {/* Posición */}
                  <div className="w-10 flex-shrink-0">
                    {r.rank && r.rank <= 3
                      ? <span className="text-xl">{getRankBadge(r.rank)}</span>
                      : <span className="text-sm font-bold text-gray-500">#{r.rank}</span>}
                  </div>
                  {/* Jugador */}
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <Avatar src={r.profile?.avatar_url} name={r.profile?.display_name || r.profile?.username} size="sm"/>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {r.profile?.display_name || r.profile?.username}
                        {isMe && <span className="ml-1 text-green-400 text-xs">(Tú)</span>}
                      </p>
                      {r.profile?.country && (
                        <p className="text-xs text-gray-500 truncate">🌍 {r.profile.country}</p>
                      )}
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="w-14 text-center flex-shrink-0">
                    <span className="text-base font-black text-white">{r.total_points}</span>
                  </div>
                  <div className="w-10 text-center flex-shrink-0">
                    <span className="text-sm font-bold text-green-400">{r.exact_scores}</span>
                  </div>
                  <div className="w-10 text-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-400">{r.correct_results}</span>
                  </div>
                  <div className="w-10 text-center flex-shrink-0">
                    <span className="text-sm font-bold text-red-400">{failed}</span>
                  </div>
                  <div className="w-12 text-center flex-shrink-0">
                    <span className="text-sm font-bold text-purple-400">{pct}%</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Paginación */}
      {count > pageSize && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 border border-gray-600 rounded-xl text-sm text-gray-300 disabled:opacity-40 hover:border-gray-400 transition-all">
            ← Anterior
          </button>
          <span className="text-sm text-gray-400">Página {page} de {Math.ceil(count / pageSize)}</span>
          <button disabled={page >= Math.ceil(count / pageSize)} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border border-gray-600 rounded-xl text-sm text-gray-300 disabled:opacity-40 hover:border-gray-400 transition-all">
            Siguiente →
          </button>
        </div>
      )}

      {/* Modal detalle */}
      <Modal open={!!selected} onClose={() => setSelected(null)}
        title={selected?.profile?.display_name || selected?.profile?.username || ''}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar src={selected.profile?.avatar_url} name={selected.profile?.display_name || selected.profile?.username} size="xl"/>
              <div>
                <p className="text-xl font-black text-white">{selected.profile?.display_name || selected.profile?.username}</p>
                <p className="text-gray-400 text-sm">Puesto {getRankBadge(selected.rank)}</p>
                {selected.profile?.favorite_team && (
                  <p className="text-xs text-gray-500 mt-1">❤️ {selected.profile.favorite_team}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Puntos totales', value: selected.total_points, icon: '⭐', color: 'text-yellow-400' },
                { label: 'Predicciones', value: selected.total_predictions, icon: '📋', color: 'text-gray-300' },
                { label: 'Exactos', value: selected.exact_scores, icon: '🎯', color: 'text-green-400' },
                { label: 'Acertados', value: selected.correct_results, icon: '✅', color: 'text-blue-400' },
                { label: 'Fallados', value: Math.max(0, selected.total_predictions - selected.exact_scores - selected.correct_results), icon: '❌', color: 'text-red-400' },
                { label: 'Efectividad', value: `${getEfficiency(selected)}%`, icon: '📈', color: 'text-purple-400' },
              ].map(s => (
                <div key={s.label} className="bg-gray-800 rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
