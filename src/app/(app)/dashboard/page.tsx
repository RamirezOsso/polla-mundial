'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'
import { createClient } from '@/lib/supabase/client'
import { MatchCardSkeleton } from '@/components/ui/Skeleton'
import { formatDateTime } from '@/lib/utils'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const { matches, loading } = useMatches()
  const { predictions } = usePredictions(user?.id)
  const [userRank, setUserRank] = useState<any>(null)

  useEffect(() => {
    if (!user) return
    createClient().from('global_ranking').select('*').eq('user_id', user.id).single()
      .then(({ data }) => setUserRank(data))
  }, [user])

  const predMap = new Map(predictions.map(p => [p.match_id, p]))
  const liveMatches = matches.filter(m => m.status === 'live')
  const upcomingMatches = matches.filter(m => m.status === 'scheduled').slice(0, 5)

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-900/40 to-blue-900/40 border border-green-500/20 p-6 sm:p-8">
        <div className="absolute right-4 top-4 text-8xl opacity-10">⚽</div>
        <div className="relative">
          <h1 className="text-2xl sm:text-4xl font-black gradient-text">FIFA World Cup 2026</h1>
          <p className="text-gray-400 mt-1 text-sm">USA · México · Canadá • 11 Jun – 19 Jul 2026</p>
          {userRank && (
            <div className="mt-4 inline-flex items-center gap-3 bg-gray-900/80 rounded-2xl px-4 py-2 border border-gray-700">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-xs text-gray-400">Tu posición global</p>
                <p className="text-xl font-black text-white">#{userRank.rank ?? '?'} · {userRank.total_points} pts</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {profile && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Puntos', value: profile.total_points, icon: '⭐' },
            { label: 'Predicciones', value: profile.total_predictions, icon: '🎯' },
            { label: 'Exactas', value: profile.total_exact_scores, icon: '🏆' },
            { label: 'Correctas', value: profile.total_correct_results, icon: '✅' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {liveMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />En Vivo
          </h2>
          <div className="space-y-3">
            {liveMatches.map(m => (
              <div key={m.id} className="bg-red-500/5 border border-red-500/30 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    {m.home_team?.flag_url && <img src={m.home_team.flag_url} className="w-6 h-4 object-cover rounded" />}
                    <span className="font-bold text-white text-sm">{m.home_team?.name}</span>
                  </div>
                  <div className="px-4 py-1 bg-gray-800 rounded-xl mx-3">
                    <span className="text-xl font-black text-white">{m.home_score ?? 0} - {m.away_score ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-bold text-white text-sm">{m.away_team?.name}</span>
                    {m.away_team?.flag_url && <img src={m.away_team.flag_url} className="w-6 h-4 object-cover rounded" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Próximos partidos</h2>
          <Link href="/matches" className="text-sm text-green-400 hover:text-green-300">Ver todos →</Link>
        </div>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <MatchCardSkeleton key={i} />)}</div>
        ) : upcomingMatches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-2">⚽</p>
            <p>No hay partidos programados aún</p>
            <p className="text-xs mt-1">El admin debe cargar los partidos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMatches.map(m => {
              const pred = predMap.get(m.id)
              return (
                <Link key={m.id} href="/matches">
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-600 transition-all cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500">{m.stage?.name}{m.group_name && ` · Grupo ${m.group_name}`}</span>
                      <span className="text-xs text-gray-600">· {formatDateTime(m.match_date)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        {m.home_team?.flag_url && <img src={m.home_team.flag_url} className="w-6 h-4 object-cover rounded" />}
                        <span className="font-semibold text-white text-sm">{m.home_team?.name}</span>
                      </div>
                      <div className="px-3 py-1 bg-gray-800 rounded-xl text-center min-w-[60px]">
                        {pred ? (
                          <span className="text-sm font-black text-blue-400">{pred.home_score}-{pred.away_score}</span>
                        ) : (
                          <span className="text-xs text-gray-500">vs</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-semibold text-white text-sm">{m.away_team?.name}</span>
                        {m.away_team?.flag_url && <img src={m.away_team.flag_url} className="w-6 h-4 object-cover rounded" />}
                      </div>
                    </div>
                    {!pred && !m.is_locked && (
                      <div className="mt-2 text-center">
                        <span className="text-xs text-yellow-400">⚡ Sin predicción — ¡Ingresa ahora!</span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
