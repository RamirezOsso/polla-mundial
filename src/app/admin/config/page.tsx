'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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
    if (!confirm('⚠️ ¿Seguro? Esto borrará TODAS las predicciones y puntos. Esta acción no se puede deshacer.')) return
    if (!confirm('¿Confirmas que quieres reiniciar el torneo completo?')) return
    setResetting(true)
    setResetMsg('')
    const { data, error } = await createClient().rpc('reset_tournament')
    if (error) setResetMsg('❌ Error: ' + error.message)
    else setResetMsg('✅ ' + data)
    setResetting(false)
  }

  if (!config) return <div className="text-gray-400">Cargando...</div>

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-black text-white">🔧 Configuración</h1>

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-3 text-sm">
          ✅ Guardado
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-white">⚽ Torneo</h2>
        <Input
          label="Nombre"
          value={config.name ?? ''}
          onChange={e => setConfig((c: any) => ({ ...c, name: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Fecha inicio"
            type="date"
            value={config.start_date ?? ''}
            onChange={e => setConfig((c: any) => ({ ...c, start_date: e.target.value }))}
          />
          <Input
            label="Fecha fin"
            type="date"
            value={config.end_date ?? ''}
            onChange={e => setConfig((c: any) => ({ ...c, end_date: e.target.value }))}
          />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.is_predictions_open ?? true}
            onChange={e => setConfig((c: any) => ({ ...c, is_predictions_open: e.target.checked }))}
            className="w-4 h-4 accent-green-500"
          />
          <span className="text-sm text-gray-300">Predicciones abiertas globalmente</span>
        </label>
      </div>

      <Button onClick={handleSave} loading={saving}>💾 Guardar configuración</Button>

      {/* Zona de peligro */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-red-400">⚠️ Zona de peligro</h2>
        <p className="text-sm text-gray-400">
          Resetea el torneo completo: borra todas las predicciones, puntos y resultados.
          Los partidos y equipos se mantienen.
        </p>
        {resetMsg && (
          <div className={`rounded-xl p-3 text-sm ${resetMsg.startsWith('✅') ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
            {resetMsg}
          </div>
        )}
        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl disabled:opacity-50 transition-all"
        >
          {resetting ? '⏳ Reseteando...' : '🔄 Reiniciar torneo completo'}
        </button>
      </div>
    </div>
  )
}