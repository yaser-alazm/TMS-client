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
  const {user, loading} = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user && requiredRoles.length > 0) {
      // Check if user has required roles
      const hasRequiredRole = requiredRoles.some((role) =>
        user.roles.includes(role)
      )
      if (!hasRequiredRole) {
        router.push('/unauthorized')
      }
    }
  }, [user, loading, router, requiredRoles])

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        Loading...
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  // If user has required roles or no roles required, render the children
  return <>{children}</>
}
