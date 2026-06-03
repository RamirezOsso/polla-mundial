import { createClient } from '@/lib/supabase/server'
import { GenerateKnockoutButton } from './GenerateKnockoutButton'

export default async function AdminPage() {
  const supabase = await createClient()
  const [
    { count: totalUsers },
    { count: totalMatches },
    { count: totalPredictions },
    { count: pendingResults },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('predictions').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'finished').is('result_published_at', null),
  ])

  const stats = [
    { label: 'Usuarios', value: totalUsers ?? 0, icon: '👥', color: 'from-blue-600 to-blue-400' },
    { label: 'Partidos', value: totalMatches ?? 0, icon: '⚽', color: 'from-green-600 to-green-400' },
    { label: 'Predicciones', value: totalPredictions ?? 0, icon: '🎯', color: 'from-purple-600 to-purple-400' },
    { label: 'Sin resultado', value: pendingResults ?? 0, icon: '⚠️', color: 'from-yellow-600 to-yellow-400' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">📊 Admin Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Polla Mundial 2026</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-3xl font-black">{s.value.toLocaleString()}</div>
            <div className="text-sm opacity-80 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { href: '/admin/results', label: 'Ingresar resultados', icon: '📋', desc: `${pendingResults ?? 0} partidos pendientes` },
          { href: '/admin/matches', label: 'Gestionar partidos', icon: '⚽', desc: `${totalMatches ?? 0} partidos total` },
          { href: '/admin/users', label: 'Gestionar usuarios', icon: '👥', desc: `${totalUsers ?? 0} usuarios` },
        ].map(a => (
          <a key={a.href} href={a.href}
            className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl p-4 transition-all group">
            <div className="text-2xl mb-2">{a.icon}</div>
            <p className="font-bold text-white group-hover:text-green-400 transition-colors">{a.label}</p>
            <p className="text-sm text-gray-500 mt-0.5">{a.desc}</p>
          </a>
        ))}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-bold text-white mb-2">🏆 Generar Eliminatorias</h2>
        <p className="text-sm text-gray-400 mb-4">
          Usa esto cuando terminen todos los partidos de grupos. 
          Genera automáticamente los cruces de Ronda de 32 basados en los resultados reales.
        </p>
        <GenerateKnockoutButton />
      </div>
    </div>
  )
}
