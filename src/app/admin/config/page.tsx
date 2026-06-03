'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function AdminConfigPage() {
  const [config, setConfig] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

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

  if (!config) return <div className="text-gray-400">Cargando...</div>

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-black text-white">🔧 Configuración</h1>
      {success && <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-3 text-sm">✅ Guardado</div>}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-white">⚽ Torneo</h2>
        <Input label="Nombre" value={config.name ?? ''} onChange={e => setConfig((c: any) => ({ ...c, name: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Fecha inicio" type="date" value={config.start_date ?? ''} onChange={e => setConfig((c: any) => ({ ...c, start_date: e.target.value }))} />
          <Input label="Fecha fin" type="date" value={config.end_date ?? ''} onChange={e => setConfig((c: any) => ({ ...c, end_date: e.target.value }))} />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={config.is_predictions_open ?? true}
            onChange={e => setConfig((c: any) => ({ ...c, is_predictions_open: e.target.checked }))}
            className="w-4 h-4 accent-green-500" />
          <span className="text-sm text-gray-300">Predicciones abiertas globalmente</span>
        </label>
      </div>
      <Button onClick={handleSave} loading={saving}>💾 Guardar configuración</Button>
    </div>
  )
}
