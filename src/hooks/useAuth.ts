'use client'
import { useAppContext } from '@/contexts/AppContext'

export function useAuth() {
  const { user, profile, authLoading, signOut } = useAppContext()
  return { user, profile, loading: authLoading, signOut, isAdmin: profile?.is_admin ?? false }
}
