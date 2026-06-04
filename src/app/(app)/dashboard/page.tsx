'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/utils'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const { matches } = useMatches()
  const { predictions } = usePredictions(user?.id)
  const [userRank, setUserRank] = useState<any>(null)

  useEffect(() => {
    if (!user) return
    createClient().from('global_ranking').select('*').eq('user_id', user.id).single()
      .then(({ data }) => setUserRank(data))
  }, [user])

  const predMap = new Map(predictions.map(p => [p.match_id, p]))

  // Partidos de hoy (Colombia UTC-5)
  const today = new Date()
  const todayStr = today.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
  const todayMatches = matches.filter(m => {
    const matchDate = new Date(m.match_date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
    return matchDate === todayStr
  })

  // Próximos partidos (no de hoy, no finalizados)
  const upcomingMatches = matches.filter(m => {
    const matchDate = new Date(m.match_date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
    return matchDate !== todayStr && m.status === 'scheduled'
  }).slice(0, 5)

  // Stats
  const calculated = predictions.filter(p => p.is_calculated)
  const exact = calculated.filter(p => p.points_earned === 5).length
  const correct = calculated.filter(p => p.points_earned === 3).length
  const failed = calculated.filter(p => p.points_earned === 0).length
  const pct = calculated.length > 0 ? Math.round(((exact + correct) / calculated.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-900/40 to-blue-900/40 border border-green-500/20 p-6">
        <div className="absolute right-4 top-4 text-8xl opacity-10">⚽</div>
        <div className="relative">
          <p className="text-gray-400 text-sm">Bienvenido,</p>
          <h1 className="text-2xl font-black text-white">{profile?.display_name || profile?.username}</h1>
          <div className="mt-3 flex items-center gap-3 bg-gray-900/60 rounded-2xl px-4 py-2 w-fit">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-xs text-gray-400">Tu posición global</p>
              <p className="text-xl font-black text-white">
                #{userRank?.rank ?? '?'} · {userRank?.total_points ?? 0} pts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Puntos', value: userRank?.total_points ?? 0, icon: '⭐', color: 'text-yellow-400' },
          { label: 'Exactos', value: exact, icon: '🎯', color: 'text-green-400' },
          { label: 'Acertados', value: correct, icon: '✅', color: 'text-blue-400' },
          { label: 'Fallados', value: failed, icon: '❌', color: 'text-red-400' },
          { label: 'Efectividad', value: `${pct}%`, icon: '📈', color: 'text-purple-400' },
          { label: 'Predicciones', value: predictions.length, icon: '📋', color: 'text-gray-300' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Partidos de hoy */}
      <section>
        <h2 className="text-lg font-bold text-white mb-3">
          📅 Partidos de hoy
        </h2>
        {todayMatches.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center text-gray-500">
            <p className="text-3xl mb-2">📅</p>
            <p>No hay partidos programados para hoy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayMatches.map(m => {
              const pred = predMap.get(m.id)
              const isFinished = m.status === 'finished'
              return (
                <div key={m.id} className={`bg-gray-900 border rounded-2xl p-4 ${isFinished ? 'border-gray-700' : 'border-green-500/30'}`}>
                  {/* Equipos */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      {m.home_team?.flag_url && <img src={m.home_team.flag_url} className="w-7 h-5 object-cover rounded"/>}
                      <span className="font-bold text-white text-sm">{m.home_team?.name}</span>
                    </div>
                    <div className="px-3 py-1 bg-gray-800 rounded-xl text-center min-w-[70px]">
                      {isFinished
                        ? <span className="text-lg font-black text-white">{m.home_score}-{m.away_score}</span>
                        : <span className="text-xs text-gray-400">{new Date(m.match_date).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' })}</span>
                      }
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-bold text-white text-sm">{m.away_team?.name}</span>
                      {m.away_team?.flag_url && <img src={m.away_team.flag_url} className="w-7 h-5 object-cover rounded"/>}
                    </div>
                  </div>

                  {/* Mi pronóstico */}
                  <div className={`rounded-xl p-3 text-sm ${isFinished ? 'bg-gray-800/50' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                    {pred ? (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Mi pronóstico:</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-blue-400">{pred.home_score} - {pred.away_score}</span>
                          {pred.is_calculated && (
                            <span className={`font-black text-sm px-2 py-0.5 rounded-lg ${pred.points_earned === 5 ? 'bg-green-500/20 text-green-400' : pred.points_earned >= 3 ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                              +{pred.points_earned} pts
                            </span>
                          )}
                          {!pred.is_calculated && isFinished && (
                            <span className="text-xs text-gray-500">Calculando...</span>
                          )}
                          {!isFinished && (
                            <span className="text-xs text-yellow-400">⏳ Pendiente</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-yellow-400">⚡ Sin pronóstico</span>
                        {!m.is_locked && (
                          <a href="/pronosticos" className="text-xs text-green-400 font-bold">Ingresar →</a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Próximos partidos */}
      {upcomingMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-3">🔜 Próximos partidos</h2>
          <div className="space-y-2">
            {upcomingMatches.map(m => {
              const pred = predMap.get(m.id)
              return (
                <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-3 flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    {m.home_team?.flag_url && <img src={m.home_team.flag_url} className="w-6 h-4 object-cover rounded"/>}
                    <span className="text-white text-sm font-medium">{m.home_team?.name}</span>
                  </div>
                  <div className="text-center flex-shrink-0">
                    <p className="text-xs text-gray-500">{new Date(m.match_date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'short' })}</p>
                    {pred
                      ? <span className="text-xs font-bold text-blue-400">{pred.home_score}-{pred.away_score}</span>
                      : <span className="text-xs text-yellow-400">Sin pred.</span>
                    }
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-white text-sm font-medium">{m.away_team?.name}</span>
                    {m.away_team?.flag_url && <img src={m.away_team.flag_url} className="w-6 h-4 object-cover rounded"/>}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
