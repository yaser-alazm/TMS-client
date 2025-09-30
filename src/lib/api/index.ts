import {refreshAccessToken} from '../auth'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.origin) ||
  'http://localhost:4000'

interface FetchOptions extends RequestInit {
  skipRefresh?: boolean
}

export async function fetchWithAuth<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {skipRefresh = false, ...fetchOptions} = options
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      credentials: 'include',
    })

    if (response.status === 401 && !skipRefresh) {
      // Only try to refresh if we have a refresh token available
      const refreshed = await refreshAccessToken()

      if (refreshed) {
        return fetchWithAuth<T>(endpoint, {
          ...options,
          skipRefresh: true,
        })
      } else {
        throw new Error('Authentication required')
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage

      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || 'API request failed'
      } catch {
        errorMessage = errorText || `HTTP error ${response.status}`
      }

      throw new Error(errorMessage)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }

    return response.text() as unknown as T
  } catch (error) {
    console.error(`API error for ${endpoint}:`, error)
    throw error
  }
}


export const vehiclesApi = {
  getAll: () => fetchWithAuth('/api/vehicles'),
}
