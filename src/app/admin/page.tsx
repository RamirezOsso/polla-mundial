import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: inactiveUsers },
    { count: totalMatches },
    { count: finishedMatches },
    { count: totalPredictions },
    { count: pendingResults },
    { data: topUser },
    { data: topExact },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('is_active', false),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', false),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'finished'),
    supabase.from('predictions').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'scheduled').not('result_published_at', 'is', null),
    supabase.from('global_ranking').select('*, profile:profiles(username, display_name, avatar_url)').order('total_points', { ascending: false }).limit(1),
    supabase.from('global_ranking').select('*, profile:profiles(username, display_name)').order('exact_scores', { ascending: false }).limit(1),
    supabase.from('predictions').select('*, profile:profiles(username), match:matches(*, home_team:teams!home_team_id(name, flag_url), away_team:teams!away_team_id(name, flag_url))').order('created_at', { ascending: false }).limit(8),
  ])

  const leader = topUser?.[0]
  const exactLeader = topExact?.[0]

  const kpis = [
    { label: 'Usuarios', value: totalUsers ?? 0, icon: '👥', color: 'from-blue-500 to-blue-600', sub: `${activeUsers ?? 0} activos` },
    { label: 'Inactivos', value: inactiveUsers ?? 0, icon: '🚫', color: 'from-red-500 to-red-600', sub: 'bloqueados' },
    { label: 'Predicciones', value: totalPredictions ?? 0, icon: '🎯', color: 'from-purple-500 to-purple-600', sub: 'realizadas' },
    { label: 'Partidos', value: totalMatches ?? 0, icon: '⚽', color: 'from-green-500 to-green-600', sub: `${finishedMatches ?? 0} finalizados` },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">📊 Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Panel de administración — FIFA World Cup 2026</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className={`bg-gradient-to-br ${k.color} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="text-3xl mb-2">{k.icon}</div>
            <div className="text-3xl font-black">{k.value.toLocaleString()}</div>
            <div className="text-sm opacity-80 mt-1">{k.label}</div>
            <div className="text-xs opacity-60 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Líderes */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Líder actual */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-500 mb-3">🥇 Líder del ranking</h3>
          {leader ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-2xl flex-shrink-0">
                {leader.profile?.avatar_url
                  ? <img src={leader.profile.avatar_url} className="w-full h-full rounded-full object-cover"/>
                  : '👤'}
              </div>
              <div>
                <p className="font-black text-gray-900 dark:text-white">{leader.profile?.display_name || leader.profile?.username}</p>
                <p className="text-2xl font-black text-yellow-500">{leader.total_points} pts</p>
              </div>
            </div>
          ) : <p className="text-gray-400 text-sm">Sin datos aún</p>}
        </div>

        {/* Más exactos */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-500 mb-3">🎯 Más marcadores exactos</h3>
          {exactLeader ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-2xl flex-shrink-0">
                🎯
              </div>
              <div>
                <p className="font-black text-gray-900 dark:text-white">{exactLeader.profile?.display_name || exactLeader.profile?.username}</p>
                <p className="text-2xl font-black text-green-500">{exactLeader.exact_scores} exactos</p>
              </div>
            </div>
          ) : <p className="text-gray-400 text-sm">Sin datos aún</p>}
        </div>
      </div>

      {/* Progreso del torneo */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-gray-500 mb-3">⚽ Progreso del torneo</h3>
        <div className="space-y-3">
          {[
            { label: 'Partidos jugados', done: finishedMatches ?? 0, total: totalMatches ?? 0, color: 'bg-green-500' },
            { label: 'Predicciones realizadas', done: totalPredictions ?? 0, total: (totalUsers ?? 0) * (totalMatches ?? 0), color: 'bg-blue-500' },
          ].map(p => (
            <div key={p.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">{p.label}</span>
                <span className="font-bold text-gray-900 dark:text-white">{p.done}/{p.total}</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full ${p.color} rounded-full transition-all`}
                  style={{ width: `${p.total > 0 ? Math.min((p.done / p.total) * 100, 100) : 0}%` }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accesos rápidos */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 mb-3">⚡ Accesos rápidos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/admin/results', label: 'Ingresar resultados', icon: '📋', desc: `${(totalMatches ?? 0) - (finishedMatches ?? 0)} pendientes` },
            { href: '/admin/users', label: 'Gestionar usuarios', icon: '👥', desc: `${totalUsers ?? 0} registrados` },
            { href: '/admin/matches', label: 'Gestionar partidos', icon: '⚽', desc: `${totalMatches ?? 0} partidos` },
            { href: '/admin/config', label: 'Configuración', icon: '🔧', desc: 'Ajustes del torneo' },
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

      {/* Actividad reciente */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-500">🕐 Últimas predicciones</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentActivity.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-sm flex-shrink-0">
                  🎯
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-bold">@{p.profile?.username}</span>
                    {' predijo '}
                    <span className="font-medium">{p.match?.home_team?.name} {p.home_score}-{p.away_score} {p.match?.away_team?.name}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(p.created_at).toLocaleString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {p.is_calculated && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    p.points_earned === 5 ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' :
                    p.points_earned >= 3 ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-500'
                  }`}>+{p.points_earned}pts</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
