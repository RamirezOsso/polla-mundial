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

export default function RankingPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const { ranking, count, loading } = useGlobalRanking(page)
  const [selected, setSelected] = useState<any>(null)
  const pageSize = 20

  const getEfficiency = (r: any) => {
    if (!r.total_predictions) return '0%'
    return Math.round(((r.exact_scores + r.correct_results) / r.total_predictions) * 100) + '%'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">📊 Ranking</h1>
        <span className="text-sm text-gray-500">{count} participantes</span>
      </div>

      {/* Header tabla */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-800/50 text-xs font-bold text-gray-500 uppercase">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Jugador</div>
          <div className="col-span-2 text-center">Pts</div>
          <div className="col-span-1 text-center">🎯</div>
          <div className="col-span-1 text-center">✅</div>
          <div className="col-span-1 text-center">❌</div>
          <div className="col-span-2 text-center">%</div>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-800">
            {Array.from({length: 10}).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <Skeleton className="h-8 rounded-lg"/>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {ranking.map((r: any) => {
              const isMe = r.user_id === user?.id
              const failed = r.total_predictions - r.exact_scores - r.correct_results
              return (
                <button key={r.id} onClick={() => setSelected(r)}
                  className={`w-full grid grid-cols-12 gap-2 px-4 py-3 items-center text-left transition-all hover:bg-gray-800/50 ${isMe ? 'bg-green-500/5' : ''}`}>
                  <div className="col-span-1">
                    {r.rank && r.rank <= 3
                      ? <span className="text-lg">{getRankBadge(r.rank)}</span>
                      : <span className="text-sm font-bold text-gray-500">#{r.rank}</span>}
                  </div>
                  <div className="col-span-4 flex items-center gap-2 min-w-0">
                    <Avatar src={r.profile?.avatar_url} name={r.profile?.display_name || r.profile?.username} size="sm"/>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {r.profile?.display_name || r.profile?.username}
                        {isMe && <span className="ml-1 text-green-400 text-xs">(Tú)</span>}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-base font-black text-white">{r.total_points}</span>
                  </div>
                  <div className="col-span-1 text-center text-sm text-green-400 font-bold">{r.exact_scores}</div>
                  <div className="col-span-1 text-center text-sm text-blue-400 font-bold">{r.correct_results}</div>
                  <div className="col-span-1 text-center text-sm text-red-400 font-bold">{Math.max(0, failed)}</div>
                  <div className="col-span-2 text-center text-sm text-purple-400 font-bold">{getEfficiency(r)}</div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 text-xs text-gray-500 justify-center">
        <span>🎯 Exactos</span>
        <span>✅ Acertados</span>
        <span>❌ Fallados</span>
        <span>% Efectividad</span>
      </div>

      {/* Paginación */}
      {count > pageSize && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 border border-gray-600 rounded-xl text-sm text-gray-300 disabled:opacity-40">
            ← Anterior
          </button>
          <span className="text-sm text-gray-400">Página {page} de {Math.ceil(count / pageSize)}</span>
          <button disabled={page >= Math.ceil(count / pageSize)} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border border-gray-600 rounded-xl text-sm text-gray-300 disabled:opacity-40">
            Siguiente →
          </button>
        </div>
      )}

      {/* Modal detalle usuario */}
      <Modal open={!!selected} onClose={() => setSelected(null)}
        title={selected?.profile?.display_name || selected?.profile?.username || ''}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar src={selected.profile?.avatar_url} name={selected.profile?.display_name || selected.profile?.username} size="xl"/>
              <div>
                <p className="text-xl font-black text-white">{selected.profile?.display_name || selected.profile?.username}</p>
                <p className="text-gray-400 text-sm">@{selected.profile?.username}</p>
                <p className="text-2xl mt-1">{getRankBadge(selected.rank)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Puntos totales', value: selected.total_points, icon: '⭐', color: 'text-yellow-400' },
                { label: 'Exactos', value: selected.exact_scores, icon: '🎯', color: 'text-green-400' },
                { label: 'Acertados', value: selected.correct_results, icon: '✅', color: 'text-blue-400' },
                { label: 'Efectividad', value: getEfficiency(selected), icon: '📈', color: 'text-purple-400' },
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
