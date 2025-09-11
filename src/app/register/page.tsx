'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {useAuth} from '@/context/AuthContext'
import Link from 'next/link'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const {register, loading} = useAuth()
  const router = useRouter()

  const validateForm = () => {
    if (!username || !email || !password || !confirmPassword) {
      setError('All fields are required')
      return false
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    try {
      await register({
        username,
        email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        roles: ['user'],
        isActive: true,
        lastLogin: new Date(),
      })

      router.push('/dashboard')
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || 'Registration failed')
      } else {
        setError('Registration failed')
      }
      console.error('Registration error:', error)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='p-8 bg-white rounded-lg shadow-md w-full max-w-md'>
        <h1 className='text-2xl font-bold mb-6 text-center'>
          Create Your Account
        </h1>

        {error && (
          <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label
                className='block text-gray-700 text-sm font-bold mb-2'
                htmlFor='firstName'
              >
                First Name
              </label>
              <input
                id='firstName'
                type='text'
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label
                className='block text-gray-700 text-sm font-bold mb-2'
                htmlFor='lastName'
              >
                Last Name
              </label>
              <input
                id='lastName'
                type='text'
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>

          <div>
            <label
              className='block text-gray-700 text-sm font-bold mb-2'
              htmlFor='username'
            >
              Username*
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
              htmlFor='email'
            >
              Email Address*
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label
              className='block text-gray-700 text-sm font-bold mb-2'
              htmlFor='password'
            >
              Password*
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

          <div>
            <label
              className='block text-gray-700 text-sm font-bold mb-2'
              htmlFor='confirmPassword'
            >
              Confirm Password*
            </label>
            <input
              id='confirmPassword'
              type='password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50'
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>

          <div className='text-center mt-4'>
            Already have an account?{' '}
            <Link href='/login' className='text-blue-500 hover:text-blue-700'>
              Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
