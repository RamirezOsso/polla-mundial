'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const { matches } = useMatches()
  const { predictions } = usePredictions(user?.id)
  const [userRank, setUserRank] = useState<any>(null)
  const [top3, setTop3] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
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
        setTop3(sorted.slice(0, 3).map((r: any, i: number) => ({ ...r, rank: i + 1 })))
      })
  }, [user])

  const predMap = new Map(predictions.map(p => [p.match_id, p]))
  const today = new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })

  const todayMatches = matches.filter(m =>
    new Date(m.match_date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }) === today
  )
  const upcomingMatches = matches.filter(m => {
    const d = new Date(m.match_date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
    return d !== today && m.status === 'scheduled'
  }).slice(0, 4)

  const calculated = predictions.filter(p => p.is_calculated)
  const exact = calculated.filter(p => p.points_earned === 5).length
  const correct = calculated.filter(p => p.points_earned === 3).length
  const failed = calculated.filter(p => p.points_earned === 0).length
  const pct = calculated.length > 0 ? Math.round(((exact + correct) / calculated.length) * 100) : 0
  const rankMedal = (rank: number) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'

  return (
    <div className="space-y-4 pb-6">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-700 via-green-600 to-blue-600 p-5">
        <div className="absolute -right-4 -top-4 text-[120px] opacity-5 select-none">⚽</div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-green-200 text-xs font-medium">¡Bienvenido!</p>
              <h1 className="text-xl font-black text-white leading-tight">{profile?.display_name || profile?.username}</h1>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-3 py-2 text-center">
              <p className="text-green-200 text-xs">Puesto</p>
              <p className="text-2xl font-black text-white">#{userRank?.rank ?? '?'}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-white">{userRank?.total_points ?? 0}</p>
              <p className="text-green-200 text-xs">Puntos</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-white">{exact}</p>
              <p className="text-green-200 text-xs">Exactos</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-white">{pct}%</p>
              <p className="text-green-200 text-xs">Efectividad</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-green-100">Pronósticos completados</p>
              <p className="text-xs font-black text-white">{predictions.length}/104 {predictions.length >= 104 ? '✅' : ''}</p>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${predictions.length >= 104 ? 'bg-green-300' : 'bg-yellow-300'}`}
                style={{ width: `${Math.min(Math.round((predictions.length / 104) * 100), 100)}%` }}/>
            </div>
            {predictions.length < 104 && (
              <p className="text-xs text-green-200 mt-1">Faltan {104 - predictions.length} partidos por llenar</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats detalladas */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Correctos', value: correct, icon: '✅', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Fallados', value: failed, icon: '❌', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
          { label: 'Jugados', value: calculated.length, icon: '📊', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800' },
          { label: 'Total', value: predictions.length, icon: '📋', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
            <div className="text-lg mb-0.5">{s.icon}</div>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Top 3 Ranking */}
      {top3.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900 dark:text-white">🏆 Top 3 Ranking</h2>
            <Link href="/ranking" className="text-xs text-green-600 dark:text-green-400 font-bold">Ver completo →</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {top3.map((r, i) => {
              const isMe = r.user_id === user?.id
              return (
                <div key={r.user_id} className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-green-50 dark:bg-green-500/10' : ''}`}>
                  <span className="text-xl w-8 text-center">{rankMedal(i + 1)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isMe ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                      {r.profile?.display_name || r.profile?.username}{isMe ? ' (Tú)' : ''}
                    </p>
                    <p className="text-xs text-gray-400">{r.exact_scores} exactos · {r.correct_results} correctos</p>
                  </div>
                  <span className="text-lg font-black text-green-600 dark:text-green-400">{r.total_points} pts</span>
                </div>
              )
            })}
            {userRank && userRank.rank > 3 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-500/10 border-t-2 border-dashed border-green-200 dark:border-green-500/30">
                <span className="text-sm font-black text-gray-500 w-8 text-center">#{userRank.rank}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-green-700 dark:text-green-400">
                    {profile?.display_name || profile?.username} (Tú)
                  </p>
                  <p className="text-xs text-gray-400">{userRank.exact_scores} exactos · {userRank.correct_results} correctos</p>
                </div>
                <span className="text-lg font-black text-green-600 dark:text-green-400">{userRank.total_points} pts</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Partidos de hoy */}
      <section>
        <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">📅 Partidos de hoy</h2>
        {todayMatches.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center text-gray-400">
            <p className="text-2xl mb-1">📅</p>
            <p className="text-sm">No hay partidos para hoy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayMatches.map(m => {
              const pred = predMap.get(m.id) as any
              const isFinished = m.status === 'finished'
              return (
                <div key={m.id} className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 ${isFinished ? 'border-gray-200 dark:border-gray-700' : 'border-green-300 dark:border-green-500/40'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400 font-medium">{m.group_name ? `Grupo ${m.group_name}` : 'Eliminatoria'}</span>
                    {isFinished
                      ? <span className="text-xs text-gray-400 font-medium">Finalizado</span>
                      : <span className="text-xs font-bold text-green-600 dark:text-green-400">
                          ⏰ {new Date(m.match_date).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    }
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      {m.home_team?.flag_url && <img src={m.home_team.flag_url} className="w-7 h-5 object-cover rounded"/>}
                      <span className="font-black text-gray-900 dark:text-white text-sm">{m.home_team?.short_name}</span>
                    </div>
                    <div className="px-4 py-2 rounded-xl text-center min-w-[70px] bg-gray-100 dark:bg-gray-800">
                      <span className="text-sm font-black text-gray-400">vs</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-black text-gray-900 dark:text-white text-sm">{m.away_team?.short_name}</span>
                      {m.away_team?.flag_url && <img src={m.away_team.flag_url} className="w-7 h-5 object-cover rounded"/>}
                    </div>
                  </div>
                  <div className={`mt-3 rounded-xl px-3 py-2 flex items-center justify-between ${
                    pred ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20' : 'bg-yellow-50 dark:bg-yellow-500/10'
                  }`}>
                    {pred ? (
                      <>
                        <span className="text-xs text-gray-500">Mi pronóstico:</span>
                        <span className="font-black text-blue-600 dark:text-blue-400 text-sm">{pred.home_score}-{pred.away_score}</span>
                      </>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 font-bold">⚡ Sin pronóstico</span>
                        {!m.is_locked && <Link href="/pronosticos" className="text-xs text-green-600 dark:text-green-400 font-bold">Llenar →</Link>}
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
          <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">🔜 Próximos partidos</h2>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
            {upcomingMatches.map(m => {
              const pred = predMap.get(m.id) as any
              const isCol = m.home_team?.short_name === 'COL' || m.away_team?.short_name === 'COL'
              return (
                <div key={m.id} className={`flex items-center gap-3 px-4 py-3 ${isCol ? 'bg-yellow-50/50 dark:bg-yellow-500/5' : ''}`}>
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    {m.home_team?.flag_url && <img src={m.home_team.flag_url} className="w-5 h-4 object-cover rounded"/>}
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{m.home_team?.short_name}</span>
                  </div>
                  <div className="text-center flex-shrink-0 min-w-[85px]">
                    <p className="text-xs text-gray-400 font-medium">
                      {new Date(m.match_date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'short' })}
                      {' · '}
                      {new Date(m.match_date).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {pred
                      ? <span className="text-xs font-bold text-blue-500">{pred.home_score}-{pred.away_score}</span>
                      : <span className="text-xs text-yellow-500">Sin pred.</span>
                    }
                  </div>
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{m.away_team?.short_name}</span>
                    {m.away_team?.flag_url && <img src={m.away_team.flag_url} className="w-5 h-4 object-cover rounded"/>}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Premiación compacta */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-black text-gray-900 dark:text-white">💰 Premiación</h2>
          <p className="text-xs text-gray-400">En caso de empate se divide el premio</p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800">
          {[
            { pos: '🥇', label: '1er Puesto', pct: '60%', color: 'text-yellow-500' },
            { pos: '🥈', label: '2do Puesto', pct: '25%', color: 'text-gray-400' },
            { pos: '🥉', label: '3er Puesto', pct: '15%', color: 'text-amber-600' },
          ].map(r => (
            <div key={r.label} className="p-4 text-center">
              <p className="text-2xl">{r.pos}</p>
              <p className={`text-2xl font-black ${r.color}`}>{r.pct}</p>
              <p className="text-xs text-gray-400">{r.label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
