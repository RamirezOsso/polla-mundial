'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function GenerateKnockoutButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const handleGenerate = async () => {
    if (!confirm('¿Generar los cruces de eliminatorias? Esto borrará los partidos de eliminatorias existentes.')) return
    setLoading(true)
    setResult('')
    const { data, error } = await createClient().rpc('generate_knockout_matches')
    if (error) setResult('❌ Error: ' + error.message)
    else setResult('✅ ' + data)
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      <button onClick={handleGenerate} disabled={loading}
        className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl disabled:opacity-50 transition-all hover:from-green-500 hover:to-green-400">
        {loading ? '⏳ Generando...' : '🚀 Generar eliminatorias automáticamente'}
      </button>
      {result && (
        <div className={`p-3 rounded-xl text-sm ${result.startsWith('✅') ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
          {result}
        </div>
      )}
    </div>
  )
}
