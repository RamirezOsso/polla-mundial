'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Match } from '@/types'

export function useMatches(filters?: { status?: string; group?: string }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const supabase = createClient()
    let query = supabase
      .from('matches')
      .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), stage:stages(*)')
      .order('match_date', { ascending: true })
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.group) query = query.eq('group_name', filters.group)
    const { data } = await query
    setMatches(data as Match[] ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const supabase = createClient()
    const channel = supabase
      .channel('matches-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [filters?.status, filters?.group])

  return { matches, loading, refetch: load }
}
