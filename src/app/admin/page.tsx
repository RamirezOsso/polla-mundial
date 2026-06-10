'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const PRECIO_POR_JUGADOR = 100000

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const supabase = createClient()
    const [
      { data: profiles },
      { data: matches },
      { data: predictions },
      { data: ranking },
      { data: config },
    ] = await Promise.all([
      supabase.from('profiles').select('id, display_name, username, is_active, is_spectator, is_admin, created_at'),
      supabase.from('matches').select('*, stage:stages(type), home_team:teams!home_team_id(name, short_name), away_team:teams!away_team_id(name, short_name)').order('match_number'),
      supabase.from('predictions').select('user_id, match_id, home_score, away_score, created_at, updated_at'),
      supabase.from('global_ranking').select('*, profile:profiles(display_name, username)').order('rank'),
      supabase.from('tournament_config').select('*').single(),
    ])
    setData({ profiles, matches, predictions, ranking, config })
    setLoading(false)
  }

  const stats = useMemo(() => {
    if (!data) return null
    const { profiles, matches, predictions, ranking } = data

    const pagantes = profiles?.filter((p: any) => !p.is_spectator && p.is_active !== false && !p.is_admin) ?? []
    const espectadores = profiles?.filter((p: any) => p.is_spectator) ?? []
    const inactivos = profiles?.filter((p: any) => p.is_active === false) ?? []
    const pozo = pagantes.length * PRECIO_POR_JUGADOR

    // Predicciones por usuario
    const predByUser = new Map<string, number>()
    predictions?.forEach((p: any) => {
      predByUser.set(p.user_id, (predByUser.get(p.user_id) ?? 0) + 1)
    })

    // Estado de usuarios
    const usuariosCompletos = pagantes.filter((p: any) => (predByUser.get(p.id) ?? 0) >= 104)
    const usuariosIncompletos = pagantes.filter((p: any) => {
      const c = predByUser.get(p.id) ?? 0
      return c > 0 && c < 104
    })
    const usuariosSinPreds = pagantes.filter((p: any) => (predByUser.get(p.id) ?? 0) === 0)

    // Partidos
    const finishedMatches = matches?.filter((m: any) => m.status === 'finished') ?? []
    const scheduledMatches = matches?.filter((m: any) => m.status === 'scheduled') ?? []
    const groupMatches = matches?.filter((m: any) => m.stage?.type === 'group') ?? []
    const finishedGroups = groupMatches.filter((m: any) => m.status === 'finished')

    // Alertas
    const alertas = []
    if (usuariosSinPreds.length > 0)
      alertas.push({ type: 'error', msg: `${usuariosSinPreds.length} usuario(s) sin ningún pronóstico`, link: '/admin/users' })
    if (usuariosIncompletos.length > 0)
      alertas.push({ type: 'warning', msg: `${usuariosIncompletos.length} usuario(s) con pronósticos incompletos`, link: '/admin/users' })
    if (!data.config?.is_predictions_open)
      alertas.push({ type: 'info', msg: 'Las predicciones están cerradas', link: '/admin/config' })
    if (finishedGroups.length === 72 && finishedMatches.filter((m: any) => m.stage?.type === 'round_of_32').length === 0)
      alertas.push({ type: 'warning', msg: 'Grupos completos — verifica que R32 se generó correctamente', link: '/admin/results' })

    // Fase actual
    const stageOrder = ['group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final']
    const stageLabels: Record<string, string> = {
      group: 'Fase de Grupos', round_of_32: 'Ronda de 32', round_of_16: 'Octavos',
      quarter_final: 'Cuartos', semi_final: 'Semifinales', third_place: 'Tercer Lugar', final: 'Final'
    }
    const currentStage = stageOrder.find(s => {
      const sm = matches?.filter((m: any) => m.stage?.type === s) ?? []
      return sm.some((m: any) => m.status === 'scheduled')
    }) ?? 'final'

    // Próximos partidos sin resultado
    const pendingResults = finishedMatches.filter((m: any) => !m.result_published_at).slice(0, 5)

    // Hoy
    const today = new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
    const todayMatches = scheduledMatches.filter((m: any) =>
      new Date(m.match_date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }) === today
    )

    // Equipo más predicho como campeón
    const finalMatchId = matches?.find((m: any) => m.stage?.type === 'final')?.id
    const finalPreds = predictions?.filter((p: any) => p.match_id === finalMatchId) ?? []

    return {
      pagantes, espectadores, inactivos, pozo,
      predByUser, usuariosCompletos, usuariosIncompletos, usuariosSinPreds,
      finishedMatches, scheduledMatches, groupMatches, finishedGroups,
      alertas, currentStage, stageLabels, todayMatches, pendingResults,
      ranking: ranking ?? [],
      totalMatches: matches?.length ?? 0,
      tasa: pagantes.length > 0 ? Math.round((usuariosCompletos.length / pagantes.length) * 100) : 0,
    }
  }, [data])

  if (loading || !stats) return (
    <div className="space-y-4">
      {Array.from({length: 4}).map((_, i) => (
        <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl"/>
      ))}
    </div>
  )

  const { pozo } = stats
  const prizes = [
    { pos: '🥇 1er Puesto', pct: 60, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-500/10' },
    { pos: '🥈 2do Puesto', pct: 25, color: 'text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800' },
    { pos: '🥉 3er Puesto', pct: 15, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">📊 Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">FIFA World Cup 2026 · {stats.stageLabels[stats.currentStage]}</p>
        </div>
        <button onClick={loadData} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-xl transition-all">
          🔄 Actualizar
        </button>
      </div>

      {/* Alertas */}
      {stats.alertas.length > 0 && (
        <div className="space-y-2">
          {stats.alertas.map((a: any, i: number) => (
            <Link key={i} href={a.link}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:opacity-80 ${
                a.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400' :
                a.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30 text-yellow-600 dark:text-yellow-400' :
                'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400'
              }`}>
              <span>{a.type === 'error' ? '🔴' : a.type === 'warning' ? '🟡' : 'ℹ️'}</span>
              <span className="flex-1">{a.msg}</span>
              <span>→</span>
            </Link>
          ))}
        </div>
      )}

      {/* Pozo y premios */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-green-100 text-sm">💰 Pozo total</p>
            <p className="text-3xl font-black">${pozo.toLocaleString('es-CO')}</p>
            <p className="text-green-200 text-xs mt-1">{stats.pagantes.length} jugadores × $100.000</p>
          </div>
          <div className="text-right">
            <p className="text-green-100 text-xs">Fase actual</p>
            <p className="text-lg font-black">{stats.stageLabels[stats.currentStage]}</p>
            <p className="text-green-200 text-xs">{stats.finishedMatches.length}/{stats.totalMatches} partidos</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {prizes.map((p, i) => {
            const winner = stats.ranking[i]
            const amount = Math.round(pozo * p.pct / 100)
            return (
              <div key={p.pos} className="bg-white/20 rounded-xl p-3 text-center">
                <p className="text-xs text-green-100 mb-1">{p.pos}</p>
                <p className="text-lg font-black">${amount.toLocaleString('es-CO')}</p>
                <p className="text-xs text-green-200">{p.pct}%</p>
                {winner && <p className="text-xs font-bold mt-1 truncate">{winner.profile?.display_name || winner.profile?.username}</p>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Estado usuarios */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-black text-gray-900 dark:text-white">👥 Estado de participantes</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">{stats.usuariosCompletos.length} completos</span>
            <span className="text-xs bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full">{stats.usuariosIncompletos.length} incompletos</span>
            <span className="text-xs bg-red-100 dark:bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full">{stats.usuariosSinPreds.length} sin preds</span>
          </div>
        </div>

        {/* Barra progreso */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">Tasa de participación completa</span>
            <span className="text-xs font-black text-gray-900 dark:text-white">{stats.tasa}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${(stats.usuariosCompletos.length / Math.max(stats.pagantes.length, 1)) * 100}%` }}/>
            <div className="h-full bg-yellow-400 transition-all" style={{ width: `${(stats.usuariosIncompletos.length / Math.max(stats.pagantes.length, 1)) * 100}%` }}/>
            <div className="h-full bg-red-400 transition-all" style={{ width: `${(stats.usuariosSinPreds.length / Math.max(stats.pagantes.length, 1)) * 100}%` }}/>
          </div>
        </div>

        {/* Lista de usuarios */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto">
          {stats.pagantes.map((user: any) => {
            const preds = stats.predByUser.get(user.id) ?? 0
            const rank = stats.ranking.find((r: any) => r.user_id === user.id)
            const pct = Math.round((preds / 104) * 100)
            const status = preds >= 104 ? 'complete' : preds > 0 ? 'partial' : 'none'
            return (
              <div key={user.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  status === 'complete' ? 'bg-green-500' :
                  status === 'partial' ? 'bg-yellow-400' : 'bg-red-400'
                }`}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.display_name || user.username}</span>
                    {status === 'complete' && <span className="text-xs text-green-500">✅</span>}
                    {status === 'none' && <span className="text-xs text-red-400">❌ Sin pronósticos</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${status === 'complete' ? 'bg-green-500' : status === 'partial' ? 'bg-yellow-400' : 'bg-gray-300'}`}
                        style={{ width: `${pct}%` }}/>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{preds}/104</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-gray-900 dark:text-white">{rank?.total_points ?? 0} pts</p>
                  <p className="text-xs text-gray-400">#{rank?.rank ?? '?'}</p>
                </div>
              </div>
            )
          })}
          {stats.espectadores.length > 0 && (
            <div className="px-4 py-2 bg-orange-50 dark:bg-orange-500/5">
              <p className="text-xs text-orange-500 font-medium">👀 Espectadores: {stats.espectadores.map((e: any) => e.display_name || e.username).join(', ')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Ranking top 5 */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-black text-gray-900 dark:text-white">🏆 Ranking actual</h2>
          <Link href="/admin/users" className="text-xs text-green-600 dark:text-green-400 font-medium">Ver todos →</Link>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {stats.ranking.filter((r: any) => !r.profile?.is_spectator).slice(0, 5).map((r: any, i: number) => {
            const prize = i < 3 ? prizes[i] : null
            const prizeAmount = prize ? Math.round(pozo * prize.pct / 100) : 0
            return (
              <div key={r.user_id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-lg w-8 text-center flex-shrink-0">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{r.profile?.display_name || r.profile?.username}</p>
                  <p className="text-xs text-gray-400">{r.exact_scores} exactos · {r.correct_results} correctos · {r.total_predictions} pred.</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-black text-gray-900 dark:text-white">{r.total_points} pts</p>
                  {prize && <p className="text-xs font-bold text-green-600 dark:text-green-400">${prizeAmount.toLocaleString('es-CO')}</p>}
                </div>
              </div>
            )
          })}
          {stats.ranking.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">Sin datos de ranking aún</div>
          )}
        </div>
      </div>

      {/* Partidos de hoy */}
      {stats.todayMatches.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900 dark:text-white">📅 Partidos de hoy</h2>
            <Link href="/admin/results" className="text-xs text-green-600 dark:text-green-400 font-medium">Ingresar resultados →</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {stats.todayMatches.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {m.home_team?.name} vs {m.away_team?.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(m.match_date).toLocaleString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                  m.status === 'finished' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' :
                  'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                }`}>
                  {m.status === 'finished' ? `✅ ${m.home_score}-${m.away_score}` : '⏳ Pendiente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/admin/results', label: 'Resultados', icon: '📋', desc: `${stats.finishedMatches.length}/${stats.totalMatches} publicados` },
          { href: '/admin/users', label: 'Usuarios', icon: '👥', desc: `${stats.pagantes.length} jugadores` },
          { href: '/admin/predictions', label: 'Backup PDF', icon: '📄', desc: 'Descargar pronósticos' },
          { href: '/admin/config', label: 'Configuración', icon: '🔧', desc: data?.config?.is_predictions_open ? '🟢 Polla abierta' : '🔴 Polla cerrada' },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-green-400 dark:hover:border-green-500/50 rounded-2xl p-4 transition-all group">
            <div className="text-2xl mb-2">{a.icon}</div>
            <p className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{a.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
