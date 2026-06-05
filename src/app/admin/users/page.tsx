'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'reset'|'delete'|'detail'>('detail')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    const { data } = await createClient()
      .from('profiles')
      .select('*, global_ranking(total_points, rank)')
      .order('created_at', { ascending: false })
    setUsers(data ?? [])
    setLoading(false)
  }

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  )

  const openModal = (user: any, type: 'reset'|'delete'|'detail') => {
    setSelected(user)
    setModalType(type)
    setShowModal(true)
    setMsg('')
    setNewPassword('')
  }

  const handleToggleActive = async (user: any) => {
    if (!confirm(`¿${user.is_active ? 'Inactivar' : 'Activar'} al usuario ${user.username}?`)) return
    await createClient().from('profiles').update({ is_active: !user.is_active }).eq('id', user.id)
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
  }

  const handleToggleAdmin = async (user: any) => {
    if (!confirm(`¿${user.is_admin ? 'Quitar' : 'Dar'} rol admin a ${user.username}?`)) return
    await createClient().from('profiles').update({ is_admin: !user.is_admin }).eq('id', user.id)
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_admin: !u.is_admin } : u))
  }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) { setMsg('Mínimo 8 caracteres'); return }
    setSaving(true)
    const { error } = await createClient().rpc('admin_reset_password', {
      p_user_id: selected.id,
      p_new_password: newPassword
    })
    if (error) setMsg('❌ ' + error.message)
    else setMsg('✅ Contraseña actualizada correctamente')
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm(`¿ELIMINAR PERMANENTEMENTE al usuario ${selected.username}? Esta acción no se puede deshacer.`)) return
    setSaving(true)
    await createClient().from('profiles').delete().eq('id', selected.id)
    setUsers(prev => prev.filter(u => u.id !== selected.id))
    setShowModal(false)
    setSaving(false)
  }

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active !== false).length,
    inactive: users.filter(u => u.is_active === false).length,
    admins: users.filter(u => u.is_admin).length,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">👥 Usuarios</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: '👥', color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Activos', value: stats.active, icon: '✅', color: 'text-green-600 dark:text-green-400' },
          { label: 'Inactivos', value: stats.inactive, icon: '🚫', color: 'text-red-500' },
          { label: 'Admins', value: stats.admins, icon: '⚙️', color: 'text-purple-600 dark:text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o usuario..."
          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-green-500"/>
      </div>

      <p className="text-sm text-gray-500">{filtered.length} usuarios</p>

      {/* Lista */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map(user => (
              <div key={user.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all ${user.is_active === false ? 'opacity-50' : ''}`}>
                <Avatar src={user.avatar_url} name={user.display_name || user.username} size="sm"/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{user.display_name || user.username}</p>
                    {user.is_admin && <span className="text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full">Admin</span>}
                    {user.is_active === false && <span className="text-xs bg-red-100 dark:bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded-full">Inactivo</span>}
                  </div>
                  <p className="text-xs text-gray-400">@{user.username} · {user.global_ranking?.[0]?.total_points ?? 0} pts · #{user.global_ranking?.[0]?.rank ?? '?'}</p>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openModal(user, 'detail')} title="Ver detalle"
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all">
                    👁️
                  </button>
                  <button onClick={() => handleToggleAdmin(user)} title={user.is_admin ? 'Quitar admin' : 'Hacer admin'}
                    className={`p-2 rounded-lg transition-all ${user.is_admin ? 'text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10' : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10'}`}>
                    ⚙️
                  </button>
                  <button onClick={() => openModal(user, 'reset')} title="Restablecer contraseña"
                    className="p-2 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 rounded-lg transition-all">
                    🔑
                  </button>
                  <button onClick={() => handleToggleActive(user)} title={user.is_active === false ? 'Activar' : 'Inactivar'}
                    className={`p-2 rounded-lg transition-all ${user.is_active === false ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10' : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10'}`}>
                    {user.is_active === false ? '✅' : '🚫'}
                  </button>
                  <button onClick={() => openModal(user, 'delete')} title="Eliminar usuario"
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={
          modalType === 'reset' ? `🔑 Restablecer contraseña` :
          modalType === 'delete' ? `🗑️ Eliminar usuario` :
          `👤 ${selected?.display_name || selected?.username}`
        }>
        {selected && (
          <div className="space-y-4">
            {/* Detalle */}
            {modalType === 'detail' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar src={selected.avatar_url} name={selected.display_name || selected.username} size="xl"/>
                  <div>
                    <p className="text-xl font-black text-gray-900 dark:text-white">{selected.display_name || selected.username}</p>
                    <p className="text-gray-500 text-sm">@{selected.username}</p>
                    {selected.country && <p className="text-xs text-gray-400 mt-1">🌍 {selected.country}</p>}
                    {selected.favorite_team && <p className="text-xs text-gray-400">❤️ {selected.favorite_team}</p>}
                    <p className="text-xs text-gray-400 mt-1">Registro: {new Date(selected.created_at).toLocaleDateString('es-CO')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Puntos', value: selected.total_points, icon: '⭐' },
                    { label: 'Predicciones', value: selected.total_predictions, icon: '🎯' },
                    { label: 'Exactos', value: selected.total_exact_scores, icon: '✅' },
                    { label: 'Posición', value: `#${selected.global_ranking?.[0]?.rank ?? '?'}`, icon: '🏆' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                      <div className="text-lg mb-1">{s.icon}</div>
                      <div className="text-xl font-black text-gray-900 dark:text-white">{s.value}</div>
                      <div className="text-xs text-gray-400">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setModalType('reset')}
                    className="flex-1 py-2 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 font-bold rounded-xl text-sm hover:bg-yellow-200 dark:hover:bg-yellow-500/30 transition-all">
                    🔑 Restablecer contraseña
                  </button>
                  <button onClick={() => handleToggleActive(selected)}
                    className={`flex-1 py-2 font-bold rounded-xl text-sm transition-all ${
                      selected.is_active === false
                        ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-200'
                        : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 hover:bg-orange-200'
                    }`}>
                    {selected.is_active === false ? '✅ Activar' : '🚫 Inactivar'}
                  </button>
                </div>
              </div>
            )}

            {/* Reset password */}
            {modalType === 'reset' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <Avatar src={selected.avatar_url} name={selected.display_name || selected.username} size="sm"/>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{selected.display_name || selected.username}</p>
                    <p className="text-xs text-gray-400">@{selected.username}</p>
                  </div>
                </div>
                {msg && (
                  <p className={`text-sm p-3 rounded-xl ${msg.startsWith('✅') ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-500/10 text-red-500'}`}>
                    {msg}
                  </p>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Nueva contraseña</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-green-500"/>
                </div>
                <button onClick={handleResetPassword} disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-white font-bold rounded-xl disabled:opacity-50">
                  {saving ? 'Actualizando...' : '🔑 Actualizar contraseña'}
                </button>
              </div>
            )}

            {/* Delete */}
            {modalType === 'delete' && (
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4">
                  <p className="font-bold text-red-600 dark:text-red-400 mb-1">⚠️ Acción irreversible</p>
                  <p className="text-sm text-red-500 dark:text-red-400">
                    Eliminar a <strong>{selected.username}</strong> borrará todas sus predicciones y puntos permanentemente.
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <Avatar src={selected.avatar_url} name={selected.display_name || selected.username} size="sm"/>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{selected.display_name || selected.username}</p>
                    <p className="text-xs text-gray-400">{selected.total_predictions} predicciones · {selected.total_points} pts</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setShowModal(false)}
                    className="py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                    Cancelar
                  </button>
                  <button onClick={handleDelete} disabled={saving}
                    className="py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl disabled:opacity-50 transition-all">
                    {saving ? 'Eliminando...' : '🗑️ Eliminar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
