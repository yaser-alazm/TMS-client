import {AuthResponse, CreateUserDto, LoginDto, UserContext} from '@yatms/common'

export interface UserContextClient extends UserContext {
  isAuthenticated: boolean
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.origin) ||
  'http://localhost:4000'

let refreshTokenInMemory: string | null = null

export async function login(credentials: LoginDto): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(credentials),
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Authentication failed')
    }

    const data = await response.json()

    if (data.refreshToken) {
      refreshTokenInMemory = data.refreshToken
    }

    return data
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

export async function register(userData: CreateUserDto): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(userData),
      credentials: 'include',
    })

    console.log({response})

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Registration failed')
    }

    const data = await response.json()

    if (data.refreshToken) {
      refreshTokenInMemory = data.refreshToken
    }

    return data
  } catch (error) {
    console.error('Registration error:', error)
    throw error
  }
}

export async function refreshAccessToken(): Promise<boolean> {
  try {
    const token = refreshTokenInMemory

    if (!token) {
      return false
    }

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({refreshToken: token}),
      credentials: 'include',
    })

    if (!response.ok) {
      refreshTokenInMemory = null
      return false
    }

    const data = await response.json()

    if (data.refreshToken) {
      refreshTokenInMemory = data.refreshToken
    }

    return true
  } catch (error) {
    console.error('Token refresh failed:', error)
    return false
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    refreshTokenInMemory = null
  } catch (error) {
    console.error('Logout error:', error)
  }
}

export async function getUserProfile(): Promise<UserContextClient | null> {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      credentials: 'include',
    })

    if (response.status === 401) {
      const refreshed = await refreshAccessToken()

      if (refreshed) {
        return getUserProfile()
      }

      return null
    }

    if (!response.ok) {
      return null
    }

    const userData = await response.json()

    return {
      ...userData,
      isAuthenticated: true,
    }
  } catch (error) {
    console.error('Exception in getUserProfile:', error)
    return null
  }
}

export async function checkAuthenticated(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/auth/check`, {
      credentials: 'include',
    })
    return response.ok
  } catch {
    return false
  }
}
