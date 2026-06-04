'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function PerfilPage() {
  const { profile, signOut } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ display_name: '', country: '', favorite_team: '' })
  const [saving, setSaving] = useState(false)
  const [userRank, setUserRank] = useState<any>(null)
  const [changingPass, setChangingPass] = useState(false)
  const [passForm, setPassForm] = useState({ new: '', confirm: '' })
  const [passMsg, setPassMsg] = useState('')

  useEffect(() => {
    if (!profile) return
    setForm({ display_name: profile.display_name ?? '', country: profile.country ?? '', favorite_team: profile.favorite_team ?? '' })
    createClient().from('global_ranking').select('*').eq('user_id', profile.id).single()
      .then(({ data }) => setUserRank(data))
  }, [profile])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    await createClient().from('profiles').update({ ...form, updated_at: new Date().toISOString() }).eq('id', profile.id)
    setSaving(false)
    setEditing(false)
  }

  const handleChangePass = async () => {
    if (passForm.new !== passForm.confirm) { setPassMsg('Las contraseñas no coinciden'); return }
    if (passForm.new.length < 8) { setPassMsg('Mínimo 8 caracteres'); return }
    setSaving(true)
    const { error } = await createClient().auth.updateUser({ password: passForm.new })
    if (error) setPassMsg('❌ ' + error.message)
    else { setPassMsg('✅ Contraseña actualizada'); setChangingPass(false); setPassForm({ new: '', confirm: '' }) }
    setSaving(false)
  }

  if (!profile) return null

  const accuracy = profile.total_predictions > 0
    ? Math.round(((profile.total_exact_scores + profile.total_correct_results) / profile.total_predictions) * 100) : 0

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">👤 Mi Perfil</h1>

      {/* Card principal */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <Avatar src={profile.avatar_url} name={profile.display_name || profile.username} size="xl"/>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">{profile.display_name || profile.username}</h2>
            <p className="text-gray-500 text-sm">@{profile.username}</p>
            {userRank?.rank && <p className="text-sm text-gray-500 mt-1">🏆 Puesto #{userRank.rank} · {userRank.total_points} pts</p>}
            {profile.country && <p className="text-xs text-gray-400 mt-1">🌍 {profile.country}</p>}
            {profile.favorite_team && <p className="text-xs text-gray-400">❤️ {profile.favorite_team}</p>}
            <p className="text-xs text-gray-400 mt-1">Registrado: {new Date(profile.created_at).toLocaleDateString('es-CO')}</p>
          </div>
          <button onClick={() => setEditing(!editing)}
            className="text-xs border border-gray-200 dark:border-gray-600 hover:border-gray-400 text-gray-500 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg transition-all">
            {editing ? 'Cancelar' : '✏️ Editar'}
          </button>
        </div>

        {editing && (
          <div className="mt-5 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-5">
            {[
              { label: 'Nombre', key: 'display_name', placeholder: 'Tu nombre' },
              { label: 'País', key: 'country', placeholder: 'Colombia' },
              { label: 'Equipo favorito', key: 'favorite_team', placeholder: 'Colombia' },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <label className="text-xs font-medium text-gray-500">{f.label}</label>
                <input value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-green-500"/>
              </div>
            ))}
            <button onClick={handleSave} disabled={saving}
              className="w-full py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl text-sm disabled:opacity-50">
              {saving ? 'Guardando...' : '💾 Guardar cambios'}
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Exactos', value: profile.total_exact_scores, icon: '🎯', color: 'text-green-500' },
          { label: 'Acertados', value: profile.total_correct_results, icon: '✅', color: 'text-blue-500' },
          { label: 'Efectividad', value: `${accuracy}%`, icon: '📈', color: 'text-purple-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tema */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900 dark:text-white">🎨 Tema</p>
          <p className="text-xs text-gray-500 mt-0.5">Cambiar entre modo claro y oscuro</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
        <button onClick={() => setChangingPass(!changingPass)}
          className="w-full flex items-center justify-between text-left">
          <span className="font-bold text-gray-900 dark:text-white">🔐 Cambiar contraseña</span>
          <span className="text-gray-400 text-sm">{changingPass ? '▲' : '▼'}</span>
        </button>
        {changingPass && (
          <div className="mt-4 space-y-3">
            {passMsg && (
              <p className={`text-sm p-2 rounded-lg ${passMsg.startsWith('✅') ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                {passMsg}
              </p>
            )}
            {[
              { label: 'Nueva contraseña', key: 'new' },
              { label: 'Confirmar contraseña', key: 'confirm' },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <label className="text-xs font-medium text-gray-500">{f.label}</label>
                <input type="password" value={(passForm as any)[f.key]}
                  onChange={e => setPassForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-green-500"/>
              </div>
            ))}
            <button onClick={handleChangePass} disabled={saving}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm disabled:opacity-50">
              {saving ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </div>
        )}
      </div>

      {/* Cerrar sesión */}
      <button onClick={signOut}
        className="w-full py-3 border border-red-200 dark:border-red-500/30 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold rounded-2xl transition-all">
        🚪 Cerrar sesión
      </button>
    </div>
  )
}
