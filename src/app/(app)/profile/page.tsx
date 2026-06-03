'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

export default function ProfilePage() {
  const { profile, signOut } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ display_name: '', country: '', favorite_team: '' })
  const [saving, setSaving] = useState(false)
  const [userRank, setUserRank] = useState<any>(null)
  const [achievements, setAchievements] = useState<any[]>([])

  useEffect(() => {
    if (!profile) return
    setForm({ display_name: profile.display_name ?? '', country: profile.country ?? '', favorite_team: profile.favorite_team ?? '' })
    const supabase = createClient()
    supabase.from('global_ranking').select('*').eq('user_id', profile.id).single().then(({ data }) => setUserRank(data))
    supabase.from('user_achievements').select('*, achievement:achievements(*)').eq('user_id', profile.id).then(({ data }) => setAchievements(data ?? []))
  }, [profile])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    await createClient().from('profiles').update({ ...form, updated_at: new Date().toISOString() }).eq('id', profile.id)
    setSaving(false)
    setEditing(false)
  }

  if (!profile) return null

  const accuracy = profile.total_predictions > 0
    ? Math.round((profile.total_correct_results / profile.total_predictions) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-white">👤 Mi Perfil</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <Avatar src={profile.avatar_url} name={profile.display_name || profile.username} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-white">{profile.display_name || profile.username}</h2>
              {profile.is_admin && <Badge variant="purple">Admin</Badge>}
            </div>
            <p className="text-gray-400 text-sm">@{profile.username}</p>
            {userRank?.rank && (
              <p className="text-sm text-gray-400 mt-1">🏆 Puesto #{userRank.rank} global</p>
            )}
            {profile.country && (
              <p className="text-sm text-gray-500 mt-1">🌍 {profile.country}{profile.favorite_team && ` · ❤️ ${profile.favorite_team}`}</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancelar' : '✏️ Editar'}
          </Button>
        </div>

        {editing && (
          <div className="mt-6 space-y-4 border-t border-gray-800 pt-6">
            <Input label="Nombre para mostrar" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Tu nombre" />
            <Input label="País" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="Colombia" />
            <Input label="Equipo favorito" value={form.favorite_team} onChange={e => setForm(f => ({ ...f, favorite_team: e.target.value }))} placeholder="Colombia" />
            <div className="flex gap-3">
              <Button onClick={handleSave} loading={saving} size="sm">Guardar</Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Puntos', value: profile.total_points, icon: '⭐' },
          { label: 'Predicciones', value: profile.total_predictions, icon: '🎯' },
          { label: 'Exactas', value: profile.total_exact_scores, icon: '🏆' },
          { label: '% Acierto', value: `${accuracy}%`, icon: '📈' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {profile.total_predictions > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-white">Rendimiento</h3>
          {[
            { label: 'Exactas', value: profile.total_exact_scores, color: 'bg-green-500' },
            { label: 'Correctas', value: profile.total_correct_results, color: 'bg-blue-500' },
          ].map(bar => (
            <div key={bar.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{bar.label}</span>
                <span className="text-white font-bold">{bar.value}/{profile.total_predictions} ({Math.round((bar.value / profile.total_predictions) * 100)}%)</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full ${bar.color} rounded-full transition-all duration-700`}
                  style={{ width: `${(bar.value / profile.total_predictions) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {achievements.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-3">🏅 Logros</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {achievements.map(ua => (
              <div key={ua.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
                <div className="text-3xl mb-2">{ua.achievement?.icon ?? '🏅'}</div>
                <p className="font-bold text-white text-sm">{ua.achievement?.name}</p>
                <p className="text-xs text-gray-500 mt-1">{ua.achievement?.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-gray-800">
        <Button variant="danger" onClick={signOut}>🚪 Cerrar sesión</Button>
      </div>
    </div>
  )
}
