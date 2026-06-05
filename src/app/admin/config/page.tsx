'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminConfigPage() {
  const [config, setConfig] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetMsg, setResetMsg] = useState('')

  useEffect(() => {
    createClient().from('tournament_config').select('*').single().then(({ data }) => setConfig(data))
  }, [])

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    await createClient().from('tournament_config').update(config).eq('id', config.id)
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleReset = async () => {
    if (!confirm('⚠️ ¿Seguro? Esto borrará TODAS las predicciones y puntos.')) return
    if (!confirm('¿Confirmas que quieres reiniciar el torneo completo?')) return
    setResetting(true)
    setResetMsg('')
    const { data, error } = await createClient().rpc('reset_tournament')
    if (error) setResetMsg('❌ Error: ' + error.message)
    else setResetMsg('✅ ' + data)
    setResetting(false)
  }

  // Formatear fecha para input datetime-local
  const toLocalInput = (utc: string) => {
    if (!utc) return ''
    const d = new Date(utc)
    const offset = -5 * 60 // Colombia UTC-5
    const local = new Date(d.getTime() + offset * 60000)
    return local.toISOString().slice(0, 16)
  }

  const fromLocalInput = (local: string) => {
    if (!local) return ''
    return new Date(local + ':00-05:00').toISOString()
  }

  if (!config) return <div className="text-gray-400">Cargando...</div>

  const now = new Date()
  const closeAt = config.predictions_close_at ? new Date(config.predictions_close_at) : null
  const isOpen = config.is_predictions_open && (!closeAt || closeAt > now)
  const timeLeft = closeAt ? Math.max(0, closeAt.getTime() - now.getTime()) : null
  const daysLeft = timeLeft ? Math.floor(timeLeft / 86400000) : null
  const hoursLeft = timeLeft ? Math.floor((timeLeft % 86400000) / 3600000) : null

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">🔧 Configuración</h1>

      {success && (
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 rounded-xl p-3 text-sm">
          ✅ Configuración guardada
        </div>
      )}

      {/* Estado actual de predicciones */}
      <div className={`rounded-2xl p-5 border ${isOpen ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-black text-lg text-gray-900 dark:text-white">
              {isOpen ? '🟢 Predicciones abiertas' : '🔴 Predicciones cerradas'}
            </p>
            {isOpen && daysLeft !== null && daysLeft >= 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Cierra en <span className="font-bold">{daysLeft}d {hoursLeft}h</span>
              </p>
            )}
            {!isOpen && closeAt && closeAt < now && (
              <p className="text-sm text-gray-500 mt-1">
                Cerró el {closeAt.toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={config.is_predictions_open ?? true}
              onChange={e => setConfig((c: any) => ({ ...c, is_predictions_open: e.target.checked }))}
              className="sr-only peer"/>
            <div className="w-14 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>
      </div>

      {/* Configuración del torneo */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white">⚽ Torneo</h2>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">Nombre del torneo</label>
          <input value={config.name ?? ''}
            onChange={e => setConfig((c: any) => ({ ...c, name: e.target.value }))}
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-green-500"/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Fecha inicio</label>
            <input type="date" value={config.start_date ?? ''}
              onChange={e => setConfig((c: any) => ({ ...c, start_date: e.target.value }))}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-green-500"/>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Fecha fin</label>
            <input type="date" value={config.end_date ?? ''}
              onChange={e => setConfig((c: any) => ({ ...c, end_date: e.target.value }))}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-green-500"/>
          </div>
        </div>
      </div>

      {/* Cierre de predicciones */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white">🔒 Cierre automático de predicciones</h2>
          <p className="text-xs text-gray-500 mt-1">
            Cuando llegue esta fecha y hora, todas las predicciones se bloquearán automáticamente para todos los usuarios.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">Fecha y hora de cierre (hora Colombia)</label>
          <input type="datetime-local"
            value={toLocalInput(config.predictions_close_at)}
            onChange={e => setConfig((c: any) => ({ ...c, predictions_close_at: fromLocalInput(e.target.value) }))}
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-green-500"/>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-3">
          <p className="text-xs text-yellow-700 dark:text-yellow-400">
            ⚠️ El primer partido es el <strong>11 de junio de 2026 a las 12:00 PM</strong> (hora Colombia). Se recomienda cerrar predicciones entre 30 minutos y 2 horas antes.
          </p>
        </div>

        {/* Atajos de tiempo */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Atajos rápidos:</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: '5 min antes', mins: 5 },
              { label: '30 min antes', mins: 30 },
              { label: '1 hora antes', mins: 60 },
              { label: '2 horas antes', mins: 120 },
              { label: 'Inicio del mundial', mins: 0 },
            ].map(opt => (
              <button key={opt.label} onClick={() => {
                const base = new Date('2026-06-11T17:00:00Z') // 12:00 PM Colombia = 17:00 UTC
                const closeDate = new Date(base.getTime() - opt.mins * 60000)
                setConfig((c: any) => ({ ...c, predictions_close_at: closeDate.toISOString() }))
              }}
                className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-500/20 text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 rounded-lg border border-gray-200 dark:border-gray-700 transition-all font-medium">
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl disabled:opacity-50 transition-all">
        {saving ? 'Guardando...' : '💾 Guardar configuración'}
      </button>

      {/* Zona de peligro */}
      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-red-600 dark:text-red-400">⚠️ Zona de peligro</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Resetea el torneo completo: borra todas las predicciones, puntos y resultados. Los partidos y equipos se mantienen.
        </p>
        {resetMsg && (
          <div className={`rounded-xl p-3 text-sm ${resetMsg.startsWith('✅') ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-500/10 text-red-500'}`}>
            {resetMsg}
          </div>
        )}
        <button onClick={handleReset} disabled={resetting}
          className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl disabled:opacity-50 transition-all">
          {resetting ? '⏳ Reseteando...' : '🔄 Reiniciar torneo completo'}
        </button>
      </div>
    </div>
  )
}
