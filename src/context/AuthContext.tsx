'use client'

import React, {createContext, useContext, useState, useEffect} from 'react'
import {
  UserContextClient,
  getUserProfile,
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  refreshAccessToken,
} from '@/lib/auth'
import {CreateUserDto, LoginDto} from '@yatms/common'

interface AuthContextType {
  user: UserContextClient | null
  login: (credentials: LoginDto) => Promise<void>
  register: (userData: CreateUserDto) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<UserContextClient | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserProfile()
        setUser(userData)
      } catch (error) {
        console.error('Failed to get user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    if (!user) return

    const interval = setInterval(
      () => {
        refreshAccessToken()
          .then((success) => {
            if (!success) {
              logout()
            }
          })
          .catch(() => {
            logout()
          })
      },
      30 * 60 * 1000
    )

    return () => clearInterval(interval)
  }, [user])

  const login = async (credentials: LoginDto) => {
    setLoading(true)
    try {
      await loginApi(credentials)
      const userData = await getUserProfile()
      setUser(userData)
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userDataInput: CreateUserDto) => {
    setLoading(true)
    try {
      await registerApi(userDataInput)
      const userData = await getUserProfile()
      setUser(userData)
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await logoutApi()
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    const success = await refreshAccessToken()

    if (success) {
      const userData = await getUserProfile()
      if (userData) {
        setUser(userData)
      }
    }

    return success
  }

  return (
    <AuthContext.Provider
      value={{user, login, register, logout, refreshToken, loading}}
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
