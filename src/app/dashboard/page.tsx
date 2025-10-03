'use client'

import {useAuth} from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import {useLogout} from '@/hooks/useAuth'
import Link from 'next/link'

export default function Dashboard() {
  const {user, loading} = useAuth()
  const logoutMutation = useLogout()

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  return (
    <ProtectedRoute>
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='py-6'>
            <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>

            <div className='mt-4 bg-white shadow rounded-lg p-6'>
              <div className='border-b pb-4'>
                <h2 className='text-xl font-semibold'>
                  Welcome, {user?.email}
                </h2>
                <p className='text-gray-500'>User ID: {user?.userId}</p>
                <p className='text-gray-500'>Roles: {user?.roles.join(', ')}</p>
              </div>

              <div className='mt-4 flex flex-wrap gap-4'>
                <Link
                  href='/routes'
                  className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium'
                >
                  🗺️ Route Optimization
                </Link>
                <Link
                  href='/route-optimization'
                  className='bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md font-medium'
                >
                  📍 Simple Routes
                </Link>
                <button
                  onClick={handleLogout}
                  className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded'
                  disabled={loading}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
