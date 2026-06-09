'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Prediction } from '@/types'

export function usePredictions(userId?: string) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [isPredictionsOpen, setIsPredictionsOpen] = useState(true)

  const load = async () => {
    if (!userId) { setLoading(false); return }
    const supabase = createClient()

    const [{ data: preds }, { data: config }] = await Promise.all([
      supabase.from('predictions').select('*').eq('user_id', userId),
      supabase.from('tournament_config').select('is_predictions_open, predictions_close_at').single()
    ])

    setPredictions(preds as Prediction[] ?? [])

    if (config) {
      const closeAt = config.predictions_close_at ? new Date(config.predictions_close_at) : null
      const isOpen = config.is_predictions_open && (!closeAt || closeAt > new Date())
      setIsPredictionsOpen(isOpen)
    }

    setLoading(false)
  }

  useEffect(() => { load() }, [userId])

  const savePrediction = async (matchId: string, homeScore: number, awayScore: number, homeTeamId?: string, awayTeamId?: string) => {
    if (!userId) return
    if (!isPredictionsOpen) return

    const supabase = createClient()

    // Si no se pasaron los equipos, obtenerlos del partido
    let hTeamId = homeTeamId
    let aTeamId = awayTeamId

    if (!hTeamId || !aTeamId) {
      const { data: match } = await supabase
        .from('matches')
        .select('home_team_id, away_team_id, home_team:teams!home_team_id(short_name), away_team:teams!away_team_id(short_name)')
        .eq('id', matchId)
        .single()
      if (match) {
        const homeTBD = (match as any).home_team?.short_name === 'TBD'
        const awayTBD = (match as any).away_team?.short_name === 'TBD'
        if (!homeTBD) hTeamId = match.home_team_id
        if (!awayTBD) aTeamId = match.away_team_id
      }
    }

    const payload: any = {
      user_id: userId,
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore,
    }
    if (hTeamId) payload.home_team_id = hTeamId
    if (aTeamId) payload.away_team_id = aTeamId

    const { data } = await supabase
      .from('predictions')
      .upsert(payload, { onConflict: 'user_id,match_id' })
      .select().single()

    if (data) {
      setPredictions(prev => {
        const idx = prev.findIndex(p => p.match_id === matchId)
        if (idx >= 0) { const next = [...prev]; next[idx] = data as Prediction; return next }
        return [...prev, data as Prediction]
      })
    }
    return data
  }

  return { predictions, loading, savePrediction, isPredictionsOpen, refetch: load }
}
