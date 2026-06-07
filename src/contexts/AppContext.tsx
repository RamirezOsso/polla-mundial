'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AppContextType {
  user: User | null
  profile: any | null
  matches: any[]
  matchesLoading: boolean
  authLoading: boolean
  signOut: () => Promise<void>
  refetchMatches: () => Promise<void>
}

const AppContext = createContext<AppContextType>({
  user: null, profile: null, matches: [], matchesLoading: true,
  authLoading: true, signOut: async () => {}, refetchMatches: async () => {}
})

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [matchesLoading, setMatchesLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)

  const loadMatches = useCallback(async () => {
    const { data } = await createClient()
      .from('matches')
      .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), stage:stages(*)')
      .order('match_date', { ascending: true })
    setMatches(data ?? [])
    setMatchesLoading(false)
  }, [])

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await createClient().from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setProfile(null)
      setAuthLoading(false)
    })

    loadMatches()

    const channel = supabase
      .channel('matches-global')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, async (payload) => {
        const { data } = await supabase
          .from('matches')
          .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), stage:stages(*)')
          .eq('id', payload.new.id)
          .single()
        if (data) setMatches(prev => prev.map(m => m.id === data.id ? data : m))
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [])

  const signOut = async () => { await createClient().auth.signOut() }

  return (
    <AppContext.Provider value={{
      user, profile, matches, matchesLoading,
      authLoading, signOut, refetchMatches: loadMatches
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)
