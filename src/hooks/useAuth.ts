import React from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {useRouter} from 'next/navigation'
import {
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
  getUserProfile,
  refreshAccessToken,
} from '@/lib/auth'
import {LoginDto, CreateUserDto} from '@yatms/common'
import {queryKeys} from '@/lib/query/queryKeys'
import {useAuth as useAuthContext} from '@/context/AuthContext'

export function useAuthProfile() {
  const query = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: getUserProfile,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always',
    retry: false,
    refetchInterval: false,
    notifyOnChangeProps: ['data', 'error', 'isLoading', 'isFetching'],
  })

  return query
}

export function useLogin() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const {handleLogin} = useAuthContext()

  return useMutation({
    mutationFn: (credentials: LoginDto) => {
      return loginApi(credentials)
    },
    onSuccess: async (auth) => {
      
      if (auth?.user) {
        const userData = {
          ...auth.user,
          isAuthenticated: true,
        }
        
        handleLogin(userData)
        
        await queryClient.cancelQueries({queryKey: queryKeys.auth.me})
        queryClient.setQueryData(queryKeys.auth.me, userData)
        
        router.replace('/dashboard')
      }
    },
    onError: (error) => {
      console.error('Login failed:', error.message)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (userData: CreateUserDto) => registerApi(userData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: queryKeys.auth.me})
      router.push('/dashboard')
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async () => await logoutApi(),
    onMutate: async () => {
      await queryClient.cancelQueries({queryKey: queryKeys.auth.me})
      queryClient.setQueryData(queryKeys.auth.me, null)
    },
    onSuccess: () => {
      queryClient.removeQueries({queryKey: queryKeys.auth.me})
      queryClient.clear()
      router.replace('/login')
    },
    onError: () => {
      queryClient.setQueryData(queryKeys.auth.me, null)
      queryClient.removeQueries({queryKey: queryKeys.auth.me})
      router.replace('/login')
    },
  })
}

export function useRefreshToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => refreshAccessToken(),
    onSuccess: (success) => {
      if (success) {
        queryClient.fetchQuery({queryKey: queryKeys.auth.me})
      } else {
        queryClient.clear()
      }
    },
    onError: (error) => {
      console.log('Refresh token mutation failed:', error.message)
      queryClient.clear()
    },
  })
}
