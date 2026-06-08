'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GlobalRanking } from '@/types'

export function useGlobalRanking(page = 1, pageSize = 20) {
  const [ranking, setRanking] = useState<GlobalRanking[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const from = (page - 1) * pageSize
      const { data, count } = await supabase
        .from('global_ranking')
        .select('*, profile:profiles(username, display_name, avatar_url, country, is_spectator)', { count: 'exact' })
        .eq('profile.is_spectator', false)
        .order('total_points', { ascending: false })
        .order('exact_scores', { ascending: false })
        .order('correct_results', { ascending: false })
        .order('champion_correct', { ascending: false })
        .order('finalists_correct', { ascending: false })
        .range(from, from + pageSize - 1)
      setRanking(data as GlobalRanking[] ?? [])
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
