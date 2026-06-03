'use client'
import { useAuth } from '@/hooks/useAuth'
import { useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDateTime } from '@/lib/utils'

export default function PredictionsPage() {
  const { user } = useAuth()
  const { matches, loading: mLoading } = useMatches()
  const { predictions, loading: pLoading } = usePredictions(user?.id)
  const loading = mLoading || pLoading
  const predMap = new Map(predictions.map(p => [p.match_id, p]))
  const totalPoints = predictions.filter(p => p.is_calculated).reduce((s,p) => s+p.points_earned, 0)
  const exact = predictions.filter(p => p.points_earned===5).length
  const missed = matches.filter(m => m.is_locked && !predMap.has(m.id)).length

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">🎯 Mis Predicciones</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {label:'Realizadas',value:predictions.length,icon:'📊',color:'text-blue-400'},
          {label:'Puntos',value:totalPoints,icon:'⭐',color:'text-yellow-400'},
          {label:'Exactas',value:exact,icon:'🎯',color:'text-green-400'},
          {label:'Sin predecir',value:missed,icon:'❌',color:'text-red-400'},
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {loading ? Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-24 rounded-2xl"/>) :
         matches.map(m => {
          const pred = predMap.get(m.id)
          return (
            <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{m.stage?.name}{m.group_name&&` · G${m.group_name}`}</span>
                <span className="text-xs text-gray-600">{formatDateTime(m.match_date)}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 justify-end">
                  {m.home_team?.flag_url && <img src={m.home_team.flag_url} className="w-6 h-4 object-cover rounded"/>}
                  <span className="font-semibold text-white text-sm">{m.home_team?.name}</span>
                </div>
                <div className="px-3 py-1 bg-gray-800 rounded-xl min-w-[60px] text-center">
                  {m.status==='finished'
                    ? <span className="text-sm font-black text-white">{m.home_score}-{m.away_score}</span>
                    : <span className="text-xs text-gray-500">vs</span>}
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-semibold text-white text-sm">{m.away_team?.name}</span>
                  {m.away_team?.flag_url && <img src={m.away_team.flag_url} className="w-6 h-4 object-cover rounded"/>}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                {pred ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Tu pred:</span>
                    <span className="text-sm font-bold text-blue-400">{pred.home_score}-{pred.away_score}</span>
                    {pred.is_calculated && (
                      <Badge variant={pred.points_earned===5?'success':pred.points_earned>=3?'info':'default'}>+{pred.points_earned}pts</Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-yellow-400">{m.is_locked?'🔒 Sin predicción':'⚡ Sin predicción — ve a Partidos'}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
