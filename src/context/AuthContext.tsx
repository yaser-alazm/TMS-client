'use client'

import React, {createContext, useContext, useEffect} from 'react'
import {useAuthProfile, useRefreshToken} from '@/hooks/useAuth'
import {UserContextClient} from '@/lib/auth'

interface AuthContextType {
  user: UserContextClient | null
  loading: boolean
  error: Error | null
  refetch: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({children}: {children: React.ReactNode}) {
  const {
    data: user,
    isLoading,
    isFetching,
    isFetched,
    error,
    refetch,
  } = useAuthProfile()
  const refreshTokenMutation = useRefreshToken()

  useEffect(() => {
    if (!user) return
    const interval = setInterval(
      () => refreshTokenMutation.mutate(),
      30 * 60 * 1000
    )
    return () => clearInterval(interval)
  }, [user, refreshTokenMutation])

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        loading: isLoading || isFetching,
        isFetched,
        error: error as Error | null,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
