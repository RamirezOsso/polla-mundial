'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
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
    // Cargar ranking completo para calcular posición correcta igual que la página de ranking
    createClient()
      .from('global_ranking')
      .select('*, profile:profiles!inner(username, display_name, is_spectator, created_at)')
      .eq('profile.is_spectator', false)
      .order('total_points', { ascending: false })
      .order('exact_scores', { ascending: false })
      .order('correct_results', { ascending: false })
      .then(({ data }) => {
        if (!data) return
        const sorted = data.sort((a: any, b: any) => {
          if (b.total_points !== a.total_points) return b.total_points - a.total_points
          if (b.exact_scores !== a.exact_scores) return b.exact_scores - a.exact_scores
          if (b.correct_results !== a.correct_results) return b.correct_results - a.correct_results
          const dateA = new Date(a.profile?.created_at ?? 0).getTime()
          const dateB = new Date(b.profile?.created_at ?? 0).getTime()
          return dateA - dateB
        })
        const idx = sorted.findIndex((r: any) => r.user_id === user.id)
        const myRank = sorted[idx]
        if (myRank) setUserRank({ ...myRank, rank: idx + 1 })
      })
  }, [user])

  const predMap = new Map(predictions.map(p => [p.match_id, p]))
  const totalMatches = 104
  const predPct = Math.round((predictions.length / totalMatches) * 100)
  const allDone = predictions.length >= totalMatches
  const today = new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
  const todayMatches = matches.filter(m =>
    new Date(m.match_date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }) === today
  )
  const upcomingMatches = matches.filter(m => {
    const d = new Date(m.match_date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
    return d !== today && m.status === 'scheduled'
  }).slice(0, 5)

  const calculated = predictions.filter(p => p.is_calculated)
  const exact = calculated.filter(p => p.points_earned === 5).length
  const correct = calculated.filter(p => p.points_earned === 3).length
  const failed = calculated.filter(p => p.points_earned === 0).length
  const pct = calculated.length > 0 ? Math.round(((exact + correct) / calculated.length) * 100) : 0

  const prizeRules = [
    { pos: '🥇 1er Puesto', pct: '60%', color: 'from-yellow-500 to-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-500/10', border: 'border-yellow-200 dark:border-yellow-500/30' },
    { pos: '🥈 2do Puesto', pct: '25%', color: 'from-gray-400 to-gray-300', bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700' },
    { pos: '🥉 3er Puesto', pct: '15%', color: 'from-amber-600 to-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30' },
  ]

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 to-blue-600 p-6">
        <div className="absolute right-4 top-4 text-8xl opacity-10">⚽</div>
        <div className="relative">
          <p className="text-green-100 text-sm">Bienvenido,</p>
          <h1 className="text-2xl font-black text-white">{profile?.display_name || profile?.username}</h1>
          <div className="mt-3 flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 w-fit">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-xs text-green-100">Tu posición global</p>
              <p className="text-xl font-black text-white">#{userRank?.rank ?? '?'} · {userRank?.total_points ?? 0} pts</p>
            </div>
          </div>
          <div className="mt-3 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-green-100">Pronósticos completados</p>
              <p className="text-xs font-black text-white">{predictions.length}/104 {predictions.length >= 104 ? '✅' : ''}</p>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${predictions.length >= 104 ? 'bg-green-300' : 'bg-yellow-300'}`}
                style={{ width: `${Math.min(Math.round((predictions.length / 104) * 100), 100)}%` }}/>
            </div>
            {predictions.length < 104 && (
              <p className="text-xs text-green-200 mt-1">Te faltan {104 - predictions.length} partidos</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Puntos', value: userRank?.total_points ?? 0, icon: '⭐', color: 'text-yellow-500' },
          { label: 'Exactos', value: exact, icon: '🎯', color: 'text-green-500' },
          { label: 'Acertados', value: correct, icon: '✅', color: 'text-blue-500' },
          { label: 'Fallados', value: failed, icon: '❌', color: 'text-red-500' },
          { label: 'Efectividad', value: `${pct}%`, icon: '📈', color: 'text-purple-500' },
          { label: 'Predicciones', value: predictions.length, icon: '📋', color: 'text-gray-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Premiación */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-yellow-500/10 to-green-500/10 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-gray-900 dark:text-white">🏆 Premiación</h2>
            <p className="text-xs text-gray-500 mt-0.5">Distribución del total recaudado acumulado</p>
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
            En caso de empate se divide
          </span>
        </div>
        <div className="p-4 grid grid-cols-3 gap-3">
          {prizeRules.map(r => (
            <div key={r.pos} className={`${r.bg} border ${r.border} rounded-2xl p-3 text-center`}>
              <p className="text-xs text-gray-500 mb-1">{r.pos}</p>
              <p className={`text-2xl font-black bg-gradient-to-r ${r.color} bg-clip-text text-transparent`}>{r.pct}</p>
              <p className="text-xs text-gray-400 mt-1">del total recaudado</p>
            </div>
          ))}
        </div>
        <div className="px-4 pb-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">📋 Sistema de calificación</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {[
                { label: '🎯 Marcador exacto', pts: '+5 pts' },
                { label: '✅ Resultado correcto', pts: '+3 pts' },
                { label: '⚽ Clasif. Octavos/R32', pts: '+5 pts' },
                { label: '⚽ Clasif. Cuartos', pts: '+7 pts' },
                { label: '⭐ Clasif. Semis', pts: '+10 pts' },
                { label: '🏆 Campeón acertado', pts: '+25 pts' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{r.label}</span>
                  <span className="text-xs font-black text-green-600 dark:text-green-400">{r.pts}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">⚖️ Criterios de desempate</p>
              <div className="flex flex-wrap gap-1.5">
                {['1. Puntos', '2. Exactos', '3. Correctos', '4. Campeón', '5. Finalistas', '6. Efectividad %', '7. Decisión participantes'].map((c, i) => (
                  <span key={i} className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partidos de hoy */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">📅 Partidos de hoy</h2>
        {todayMatches.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center text-gray-400">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm">No hay partidos programados para hoy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayMatches.map(m => {
              const pred = predMap.get(m.id)
              const isFinished = m.status === 'finished'
              return (
                <div key={m.id} className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 ${isFinished ? 'border-gray-200 dark:border-gray-700' : 'border-green-200 dark:border-green-500/30'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      {m.home_team?.flag_url && <img src={m.home_team.flag_url} className="w-7 h-5 object-cover rounded"/>}
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{m.home_team?.name}</span>
                    </div>
                    <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-xl text-center min-w-[70px]">
                      {isFinished
                        ? <span className="text-lg font-black text-gray-900 dark:text-white">{m.home_score}-{m.away_score}</span>
                        : <span className="text-xs text-gray-500">{new Date(m.match_date).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' })}</span>
                      }
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{m.away_team?.name}</span>
                      {m.away_team?.flag_url && <img src={m.away_team.flag_url} className="w-7 h-5 object-cover rounded"/>}
                    </div>
                  </div>
                  <div className={`rounded-xl p-3 text-sm ${isFinished ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20'}`}>
                    {pred ? (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Mi pronóstico:</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-blue-600 dark:text-blue-400">{pred.home_score} - {pred.away_score}</span>
                          {pred.is_calculated && (
                            <span className={`font-black text-sm px-2 py-0.5 rounded-lg ${pred.points_earned === 5 ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : pred.points_earned >= 3 ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                              +{pred.points_earned} pts
                            </span>
                          )}
                          {!pred.is_calculated && isFinished && <span className="text-xs text-gray-400">Calculando...</span>}
                          {!isFinished && <span className="text-xs text-yellow-500">⏳ Pendiente</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-yellow-500">⚡ Sin pronóstico</span>
                        {!m.is_locked && <a href="/pronosticos" className="text-xs text-green-600 dark:text-green-400 font-bold">Ingresar →</a>}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Próximos */}
      {upcomingMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">🔜 Próximos partidos</h2>
          <div className="space-y-2">
            {upcomingMatches.map(m => {
              const pred = predMap.get(m.id)
              return (
                <div key={m.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-3 flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    {m.home_team?.flag_url && <img src={m.home_team.flag_url} className="w-6 h-4 object-cover rounded"/>}
                    <span className="text-gray-900 dark:text-white text-sm font-medium">{m.home_team?.name}</span>
                  </div>
                  <div className="text-center flex-shrink-0">
                    <p className="text-xs text-gray-400">{new Date(m.match_date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'short' })}</p>
                    {pred
                      ? <span className="text-xs font-bold text-blue-500">{pred.home_score}-{pred.away_score}</span>
                      : <span className="text-xs text-yellow-500">Sin pred.</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-gray-900 dark:text-white text-sm font-medium">{m.away_team?.name}</span>
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
