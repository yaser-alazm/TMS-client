'use client'

import React, {createContext, useContext, useEffect, useRef, useState} from 'react'
import {useAuthProfile} from '@/hooks/useAuth'
import {UserContextClient} from '@/lib/auth'
import {refreshAccessToken} from '@/lib/auth'

interface AuthContextType {
  user: UserContextClient | null
  loading: boolean
  isFetched: boolean
  error: Error | null
  refetch: () => void
  setUser: (user: UserContextClient | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: Error | null) => void
  handleLogin: (userData: UserContextClient) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({children}: {children: React.ReactNode}) {
  // Local state for immediate updates
  const [localUser, setLocalUser] = useState<UserContextClient | null>(null)
  const [localLoading, setLocalLoading] = useState(false)
  const [localError, setLocalError] = useState<Error | null>(null)
  
  // React Query for server state
  const {
    data: serverUser,
    isLoading: serverLoading,
    isFetching,
    isFetched,
    error: serverError,
    refetch,
  } = useAuthProfile()
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Sync server state with local state
  useEffect(() => {
    if (serverUser) {
      setLocalUser(serverUser)
      setLocalError(null)
    } else if (serverError) {
      setLocalError(serverError)
      setLocalUser(null)
    } else if (!serverLoading && !serverUser) {
      setLocalUser(null)
      setLocalError(null)
    }
    setLocalLoading(serverLoading)
  }, [serverUser, serverLoading, serverError])

  // Set up refresh token interval
  useEffect(() => {
    if (localUser) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
      
      // Set up new interval (refresh every 30 minutes, tokens expire in 1 hour)
      refreshIntervalRef.current = setInterval(async () => {
        try {
          const success = await refreshAccessToken()
          if (!success) {
            setLocalUser(null)
            setLocalError(new Error('Session expired'))
          }
        } catch (error) {
          setLocalUser(null)
          setLocalError(error as Error)
        }
      }, 30 * 60 * 1000) // 30 minutes
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
    }

    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [localUser])

  const handleLogin = (userData: UserContextClient) => {
    setLocalUser(userData)
    setLocalError(null)
    setLocalLoading(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user: localUser,
        loading: localLoading || isFetching,
        isFetched,
        error: localError,
        refetch,
        setUser: setLocalUser,
        setLoading: setLocalLoading,
        setError: setLocalError,
        handleLogin,
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