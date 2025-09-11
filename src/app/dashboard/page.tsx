'use client'

import {useAuth} from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import {useRouter} from 'next/navigation'

export default function Dashboard() {
  const {user, logout} = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
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

              <div className='mt-4'>
                <button
                  onClick={handleLogout}
                  className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded'
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
