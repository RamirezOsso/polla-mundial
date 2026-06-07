'use client'
import { useAppContext } from '@/contexts/AppContext'

export function useMatches(filters?: { status?: string; group?: string }) {
  const { matches, matchesLoading, refetchMatches } = useAppContext()

  let filtered = matches
  if (filters?.status) filtered = filtered.filter(m => m.status === filters.status)
  if (filters?.group) filtered = filtered.filter(m => m.group_name === filters.group)

  return { matches: filtered, loading: matchesLoading, refetch: refetchMatches }
}
