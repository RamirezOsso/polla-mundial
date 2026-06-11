'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GlobalRanking } from '@/types'

export function useGlobalRanking(page = 1, pageSize = 100) {
  const [ranking, setRanking] = useState<GlobalRanking[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data, count } = await supabase
        .from('global_ranking')
        .select('*, profile:profiles!inner(username, display_name, avatar_url, country, is_spectator, created_at)', { count: 'exact' })
        .eq('profile.is_spectator', false)
        .order('total_points', { ascending: false })
        .order('exact_scores', { ascending: false })
        .order('correct_results', { ascending: false })
        .order('champion_correct', { ascending: false })
        .order('finalists_correct', { ascending: false })
        .range(0, 99)

      // Ordenar en frontend: primero por puntos, si empatan por created_at
      const sorted = (data ?? []).sort((a: any, b: any) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points
        if (b.exact_scores !== a.exact_scores) return b.exact_scores - a.exact_scores
        if (b.correct_results !== a.correct_results) return b.correct_results - a.correct_results
        // Si todo empata (ej: al inicio sin puntos), ordenar por fecha de registro
        const dateA = new Date(a.profile?.created_at ?? 0).getTime()
        const dateB = new Date(b.profile?.created_at ?? 0).getTime()
        return dateA - dateB
      })

      // Asignar números de posición consecutivos
      sorted.forEach((r: any, i: number) => { r.rank = i + 1 })

      setRanking(sorted as GlobalRanking[] ?? [])
      setCount(count ?? 0)
      setLoading(false)
    }
    load()
    const supabase = createClient()
    const channel = supabase
      .channel('ranking-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_ranking' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [page])

  return { ranking, count, loading }
}
