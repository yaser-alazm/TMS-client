'use client'

import {useEffect, useState} from 'react'
import {useLogin} from '@/hooks/useAuth'
import Link from 'next/link'
import {useAuth} from '@/context/AuthContext'
import {useRouter} from 'next/navigation'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const loginMutation = useLogin()
  const {user: authenticatedUser, loading} = useAuth()
  const router = useRouter()

  // Only redirect if user is already authenticated (not from login success)
  useEffect(() => {
    if (authenticatedUser && !loading && !loginMutation.isPending) {
      router.push('/dashboard')
    }
  }, [authenticatedUser, loading, router, loginMutation.isPending])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    loginMutation.mutate({username, password})
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='p-8 bg-white rounded-lg shadow-md w-full max-w-md'>
        <h1 className='text-2xl font-bold mb-6 text-center'>
          Transportation Management System
        </h1>

        {loginMutation.error && (
          <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
            {loginMutation.error.message || 'Login failed'}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label
              className='block text-gray-700 text-sm font-bold mb-2'
              htmlFor='username'
            >
              Username
            </label>
            <input
              id='username'
              type='text'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label
              className='block text-gray-700 text-sm font-bold mb-2'
              htmlFor='password'
            >
              Password
            </label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <button
            type='submit'
            disabled={loginMutation.isPending}
            className='w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50'
          >
            {loginMutation.isPending ? 'Logging in...' : 'Login'}
          </button>

          <div className='text-center mt-4'>
            Don&apos;t have an account?{' '}
            <Link
              href='/register'
              className='text-blue-500 hover:text-blue-700'
            >
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
