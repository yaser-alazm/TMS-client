'use client'

import {useAuth} from '@/context/AuthContext'
import {useRouter} from 'next/navigation'
import {useEffect} from 'react'

export default function ProtectedRoute({
  children,
  requiredRoles = [],
}: {
  children: React.ReactNode
  requiredRoles?: string[]
}) {
  const {user, loading, isFetched} = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isFetched && !loading && !user) {
      router.replace('/login')
    } else if (isFetched && !loading && user && requiredRoles.length > 0) {
      // Check if user has required roles
      const hasRequiredRole = requiredRoles.some((role) =>
        user.roles.includes(role)
      )
      if (!hasRequiredRole) {
        router.replace('/unauthorized')
      }
    }
  }, [user, loading, router, requiredRoles, isFetched])

  if (loading || !isFetched) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2'></div>
          Loading...
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
