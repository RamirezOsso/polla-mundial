'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'

const STAGES = [
  { type: 'group', label: 'Fase de Grupos' },
  { type: 'round_of_32', label: 'Ronda de 32' },
  { type: 'round_of_16', label: 'Octavos de Final' },
  { type: 'quarter_final', label: 'Cuartos de Final' },
  { type: 'semi_final', label: 'Semifinales' },
  { type: 'third_place', label: 'Tercer Lugar' },
  { type: 'final', label: 'Final' },
]

type FilterType = 'all' | 'complete' | 'incomplete' | 'none' | 'inactive' | 'spectator' | 'unpaid'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [authInfo, setAuthInfo] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [allPredictions, setAllPredictions] = useState<any[]>([])
  const [ranking, setRanking] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [selected, setSelected] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'info'|'account'|'predictions'>('info')
  const [showModal, setShowModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [userPredictions, setUserPredictions] = useState<any[]>([])
  const [loadingPreds, setLoadingPreds] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const supabase = createClient()
    const [
      { data: profiles },
      { data: authData },
      { data: matchData },
      { data: predData },
      { data: rankData },
    ] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.rpc('get_users_info'),
      supabase.from('matches').select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), stage:stages(type, name)').order('match_number'),
      supabase.from('predictions').select('*').order('created_at').limit(5000),
      supabase.from('global_ranking').select('*').order('rank'),
    ])
    setUsers(profiles ?? [])
    setAuthInfo(authData ?? [])
    setMatches(matchData ?? [])
    setAllPredictions(predData ?? [])
    setRanking(rankData ?? [])
    setLoading(false)
  }

  const predByUser = useMemo(() => {
    const map = new Map<string, number>()
    allPredictions.forEach(p => map.set(p.user_id, (map.get(p.user_id) ?? 0) + 1))
    return map
  }, [allPredictions])

  const authMap = useMemo(() => {
    const map = new Map<string, any>()
    authInfo.forEach(a => map.set(a.id, a))
    return map
  }, [authInfo])

  const rankMap = useMemo(() => {
    const map = new Map<string, any>()
    ranking.forEach(r => map.set(r.user_id, r))
    return map
  }, [ranking])

  const getUserStatus = (user: any) => {
    if (user.is_active === false) return 'inactive'
    if (user.is_spectator) return 'spectator'
    const preds = predByUser.get(user.id) ?? 0
    if (preds >= 104) return 'complete'
    if (preds > 0) return 'incomplete'
    return 'none'
  }

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        authMap.get(u.id)?.email?.toLowerCase().includes(search.toLowerCase())
      const status = getUserStatus(u)
      const matchesFilter = filter === 'all' ? true :
        filter === 'unpaid' ? !u.has_paid && !u.is_spectator && u.is_active !== false :
        filter === status
      return matchesSearch && matchesFilter
    })
  }, [users, search, filter, predByUser, authMap])

  const stats = useMemo(() => ({
    all: users.length,
    complete: users.filter(u => getUserStatus(u) === 'complete').length,
    incomplete: users.filter(u => getUserStatus(u) === 'incomplete').length,
    none: users.filter(u => getUserStatus(u) === 'none').length,
    inactive: users.filter(u => u.is_active === false).length,
    spectator: users.filter(u => u.is_spectator).length,
    unpaid: users.filter(u => !u.has_paid && !u.is_spectator && u.is_active !== false).length,
  }), [users, predByUser])

  const openDetail = async (user: any) => {
    setSelected(user)
    setActiveTab('info')
    setShowModal(true)
    setMsg('')
    setNewPassword('')
    setLoadingPreds(true)
    const { data } = await createClient()
      .from('predictions')
      .select('*, home_team:teams!home_team_id(id, short_name, name, flag_url), away_team:teams!away_team_id(id, short_name, name, flag_url)')
      .eq('user_id', user.id)
      .order('created_at')
    setUserPredictions(data ?? [])
    setLoadingPreds(false)
  }

  const handleUpdate = async (updates: any) => {
    await createClient().from('profiles').update(updates).eq('id', selected.id)
    setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, ...updates } : u))
    setSelected((prev: any) => ({ ...prev, ...updates }))
  }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) { setMsg('Mínimo 8 caracteres'); return }
    setSaving(true)
    const { error } = await createClient().rpc('admin_reset_password', {
      p_user_id: selected.id, p_new_password: newPassword
    })
    setMsg(error ? '❌ ' + error.message : '✅ Contraseña actualizada')
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm(`¿ELIMINAR PERMANENTEMENTE a ${selected.username}?`)) return
    setSaving(true)
    await createClient().from('profiles').delete().eq('id', selected.id)
    setUsers(prev => prev.filter(u => u.id !== selected.id))
    setShowModal(false)
    setSaving(false)
  }

  const statusConfig: Record<string, any> = {
    complete: { label: '✅ Completo', color: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400', dot: 'bg-green-500' },
    incomplete: { label: '⚠️ Incompleto', color: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400', dot: 'bg-yellow-400' },
    none: { label: '❌ Sin pronósticos', color: 'bg-red-100 dark:bg-red-500/20 text-red-500', dot: 'bg-red-400' },
    inactive: { label: '🚫 Inactivo', color: 'bg-gray-100 dark:bg-gray-700 text-gray-500', dot: 'bg-gray-400' },
    spectator: { label: '👀 Espectador', color: 'bg-orange-100 dark:bg-orange-500/20 text-orange-500', dot: 'bg-orange-400' },
  }

  const filterBtns: { key: FilterType, label: string, count: number }[] = [
    { key: 'all', label: 'Todos', count: stats.all },
    { key: 'complete', label: '✅ Completos', count: stats.complete },
    { key: 'incomplete', label: '⚠️ Incompletos', count: stats.incomplete },
    { key: 'none', label: '❌ Sin preds', count: stats.none },
    { key: 'unpaid', label: '💰 Sin pago', count: stats.unpaid },
    { key: 'inactive', label: '🚫 Inactivos', count: stats.inactive },
    { key: 'spectator', label: '👀 Espectadores', count: stats.spectator },
  ]

  if (loading) return <div className="text-gray-500 text-center py-8">Cargando...</div>

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">👥 Usuarios</h1>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterBtns.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 ${
              filter === f.key ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}>
            {f.label}
            <span className={`px-1.5 rounded-full text-xs ${filter === f.key ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'}`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, usuario o email..."
          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-green-500"/>
      </div>

      <p className="text-xs text-gray-400">{filtered.length} usuarios</p>

      {/* Lista */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-400">
          <div className="col-span-4">Usuario</div>
          <div className="col-span-2 text-center">Estado</div>
          <div className="col-span-2 text-center">Pronósticos</div>
          <div className="col-span-2 text-center">Puntos</div>
          <div className="col-span-1 text-center">Pago</div>
          <div className="col-span-1 text-center">Acción</div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {filtered.map(user => {
            const status = getUserStatus(user)
            const sc = statusConfig[status]
            const preds = predByUser.get(user.id) ?? 0
            const rank = rankMap.get(user.id)
            const auth = authMap.get(user.id)
            return (
              <div key={user.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
                {/* Usuario */}
                <div className="col-span-4 flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`}/>
                  <Avatar src={user.avatar_url} name={user.display_name || user.username} size="sm"/>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.display_name || user.username}</p>
                    <p className="text-xs text-gray-400 truncate">{auth?.email || '@' + user.username}</p>
                  </div>
                </div>
                {/* Estado */}
                <div className="col-span-2 flex justify-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}>{sc.label}</span>
                </div>
                {/* Pronósticos */}
                <div className="col-span-2 text-center">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{preds}/104</p>
                  <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
                    <div className={`h-full rounded-full ${status === 'complete' ? 'bg-green-500' : status === 'incomplete' ? 'bg-yellow-400' : 'bg-gray-300'}`}
                      style={{ width: `${Math.min((preds/104)*100, 100)}%` }}/>
                  </div>
                </div>
                {/* Puntos */}
                <div className="col-span-2 text-center">
                  <p className="text-sm font-black text-gray-900 dark:text-white">{rank?.total_points ?? 0}</p>
                  <p className="text-xs text-gray-400">#{rank?.rank ?? '?'}</p>
                </div>
                {/* Pago */}
                <div className="col-span-1 flex justify-center">
                  <button onClick={() => handleUpdate({ has_paid: !user.has_paid })} className="text-xl">
                    {user.has_paid ? '✅' : '⬜'}
                  </button>
                </div>
                {/* Acción */}
                <div className="col-span-1 flex justify-center">
                  <button onClick={() => openDetail(user)}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-500/20 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg text-xs font-medium transition-all">
                    Ver
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal detalle */}
      <Modal open={showModal} onClose={() => setShowModal(false)} size="lg"
        title={selected?.display_name || selected?.username}>
        {selected && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              {[
                { key: 'info', label: '📋 Información' },
                { key: 'account', label: '⚙️ Cuenta' },
                { key: 'predictions', label: '⚽ Pronósticos' },
              ].map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === t.key ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB: Información */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar src={selected.avatar_url} name={selected.display_name || selected.username} size="xl"/>
                  <div>
                    <p className="text-xl font-black text-gray-900 dark:text-white">{selected.display_name || selected.username}</p>
                    <p className="text-gray-500 text-sm">@{selected.username}</p>
                    <div className={`inline-flex mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[getUserStatus(selected)].color}`}>
                      {statusConfig[getUserStatus(selected)].label}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Email', value: authMap.get(selected.id)?.email || 'No disponible', icon: '📧' },
                    { label: 'Registro', value: new Date(selected.created_at).toLocaleDateString('es-CO'), icon: '📅' },
                    { label: 'Último ingreso', value: authMap.get(selected.id)?.last_sign_in_at ? new Date(authMap.get(selected.id).last_sign_in_at).toLocaleString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Nunca', icon: '🕐' },
                    { label: 'País', value: selected.country || 'No especificado', icon: '🌍' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">{s.icon} {s.label}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{s.value}</p>
                    </div>
                  ))}
                </div>
                {/* Pago */}
                <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${selected.has_paid ? 'border-green-400 bg-green-50 dark:bg-green-500/10' : 'border-red-300 bg-red-50 dark:bg-red-500/10'}`}>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">💰 Registro de pago</p>
                    <p className="text-xs text-gray-500 mt-0.5">$100.000 COP</p>
                  </div>
                  <button onClick={() => handleUpdate({ has_paid: !selected.has_paid })}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                      selected.has_paid
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200'
                    }`}>
                    {selected.has_paid ? '✅ Pagó' : '❌ No ha pagado'}
                  </button>
                </div>
                {/* Stats ranking */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Puntos', value: rankMap.get(selected.id)?.total_points ?? 0, icon: '⭐', color: 'text-yellow-500' },
                    { label: 'Posición', value: `#${rankMap.get(selected.id)?.rank ?? '?'}`, icon: '🏆', color: 'text-green-500' },
                    { label: 'Pronósticos', value: `${predByUser.get(selected.id) ?? 0}/104`, icon: '📋', color: 'text-blue-500' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                      <div className="text-xl mb-1">{s.icon}</div>
                      <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-400">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Cuenta */}
            {activeTab === 'account' && (
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-1">
                  <p className="text-xs text-gray-400">👤 Usuario</p>
                  <p className="font-bold text-gray-900 dark:text-white">@{selected.username}</p>
                  <p className="text-xs text-gray-400">{authMap.get(selected.id)?.email}</p>
                </div>

                {/* Restablecer contraseña */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">🔑 Restablecer contraseña</p>
                  {msg && <p className={`text-sm p-2 rounded-lg ${msg.startsWith('✅') ? 'bg-green-50 dark:bg-green-500/10 text-green-600' : 'bg-red-50 dark:bg-red-500/10 text-red-500'}`}>{msg}</p>}
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-500">Nueva contraseña</label>
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-green-400 hover:text-green-300">{showPassword ? '🙈 Ocultar' : '👁️ Ver'}</button>
                  </div>
                  <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-green-500"/>
                  <button onClick={handleResetPassword} disabled={saving}
                    className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-all">
                    {saving ? 'Actualizando...' : '🔑 Actualizar contraseña'}
                  </button>
                </div>

                {/* Acciones de cuenta */}
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleUpdate({ is_spectator: !selected.is_spectator })}
                    className={`py-3 font-bold rounded-xl text-sm transition-all ${
                      selected.is_spectator
                        ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                        : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400'
                    }`}>
                    {selected.is_spectator ? '✅ Quitar espectador' : '👀 Espectador'}
                  </button>
                  <button onClick={() => handleUpdate({ is_active: selected.is_active === false ? true : false })}
                    className={`py-3 font-bold rounded-xl text-sm transition-all ${
                      selected.is_active === false
                        ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                    }`}>
                    {selected.is_active === false ? '✅ Activar' : '🚫 Inactivar'}
                  </button>
                </div>

                {/* Eliminar */}
                <button onClick={handleDelete} disabled={saving}
                  className="w-full py-3 border-2 border-red-300 dark:border-red-500/30 text-red-500 font-bold rounded-xl text-sm hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-50">
                  🗑️ Eliminar cuenta permanentemente
                </button>
              </div>
            )}

            {/* TAB: Pronósticos */}
            {activeTab === 'predictions' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {userPredictions.length}/104 pronósticos
                  </p>
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>⭐ {rankMap.get(selected.id)?.total_points ?? 0} pts</span>
                    <span>#{rankMap.get(selected.id)?.rank ?? '?'}</span>
                  </div>
                </div>

                {loadingPreds ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Cargando pronósticos...</div>
                ) : userPredictions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Sin pronósticos aún</div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {STAGES.map(stage => {
                      const stageMatches = matches.filter(m => m.stage?.type === stage.type)
                      const stagePreds = userPredictions.filter(p => stageMatches.find(m => m.id === p.match_id))
                      if (stagePreds.length === 0) return null
                      return (
                        <div key={stage.type} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{stage.label}</p>
                            <p className="text-xs text-gray-400">{stagePreds.length} pronósticos</p>
                          </div>
                          <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {stagePreds.map(pred => {
                              const match = stageMatches.find(m => m.id === pred.match_id)
                              if (!match) return null
                              const homeTeam = (pred as any).home_team || match.home_team
                              const awayTeam = (pred as any).away_team || match.away_team
                              return (
                                <div key={pred.id} className="flex items-center gap-2 px-3 py-2">
                                  <div className="flex items-center gap-1 flex-1 min-w-0">
                                    {homeTeam?.flag_url && <img src={homeTeam.flag_url} className="w-5 h-3 object-cover rounded flex-shrink-0"/>}
                                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{homeTeam?.short_name || 'TBD'}</span>
                                  </div>
                                  <span className="text-xs font-black text-green-600 dark:text-green-400 flex-shrink-0 w-12 text-center">{pred.home_score}-{pred.away_score}</span>
                                  <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
                                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{awayTeam?.short_name || 'TBD'}</span>
                                    {awayTeam?.flag_url && <img src={awayTeam.flag_url} className="w-5 h-3 object-cover rounded flex-shrink-0"/>}
                                  </div>
                                  {pred.is_calculated ? (
                                    <span className={`text-xs font-bold flex-shrink-0 w-10 text-right ${pred.points_earned >= 5 ? 'text-green-500' : pred.points_earned >= 3 ? 'text-blue-500' : 'text-gray-400'}`}>
                                      +{pred.points_earned}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-300 flex-shrink-0 w-10 text-right">-</span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
