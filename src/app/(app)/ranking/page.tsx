'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useGlobalRanking } from '@/hooks/useRanking'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { getRankBadge } from '@/lib/utils'

export default function RankingPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const { ranking, count, loading } = useGlobalRanking(page)
  const pageSize = 20

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">🏆 Ranking Global</h1>
        <span className="text-sm text-gray-500">{count} jugadores</span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <h3 className="text-sm font-bold text-gray-400 mb-3">Sistema de puntos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Marcador exacto', pts: '5 pts', color: 'text-green-400' },
            { label: 'Resultado correcto', pts: '3 pts', color: 'text-blue-400' },
            { label: 'Diferencia goles', pts: '2 pts', color: 'text-yellow-400' },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
              <span className="text-xs text-gray-400">{r.label}</span>
              <span className={`text-xs font-bold ${r.color}`}>{r.pts}</span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : (
        <>
          <div className="space-y-2">
            {ranking.map((r) => {
              const isMe = r.user_id === user?.id
              return (
                <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isMe ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-900 border-gray-800 hover:border-gray-600'}`}>
                  <div className="w-10 text-center flex-shrink-0">
                    {r.rank && r.rank <= 3 ? (
                      <span className="text-2xl">{getRankBadge(r.rank)}</span>
                    ) : (
                      <span className="text-sm font-bold text-gray-500">#{r.rank}</span>
                    )}
                  </div>
                  <Avatar src={(r as any).profile?.avatar_url} name={(r as any).profile?.display_name || (r as any).profile?.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {(r as any).profile?.display_name || (r as any).profile?.username}
                      {isMe && <span className="ml-1 text-green-400 text-xs">(Tú)</span>}
                    </p>
                    <p className="text-xs text-gray-500">⚽ {r.exact_scores} exactos · ✅ {r.correct_results} correctos</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-black text-white">{r.total_points}</p>
                    <p className="text-xs text-gray-500">pts</p>
                  </div>
                </div>
              )
            })}
          </div>
          {count > pageSize && (
            <div className="flex items-center justify-center gap-3 pt-4">
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
        </>
      )}
    </div>
  )
}
