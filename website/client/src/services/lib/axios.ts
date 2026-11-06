import axios, { AxiosError } from 'axios'
import {
  AUTH_UNAUTHORIZED_EVENT,
  getAccessToken,
  removeAccessToken,
} from '@/utils/tokenStorage'

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ||
  'http://localhost:3000'

export const apiUrl: string = API_BASE_URL

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const requestUrl = error.config?.url || ''
    const isAuthAttempt =
      requestUrl.includes('/auth/user/login') ||
      requestUrl.includes('/auth/user/register') ||
      requestUrl.includes('/auth/user/google')

    if (error.response?.status === 401 && !isAuthAttempt) {
      removeAccessToken()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
      }
    }
    return Promise.reject(error)
  },
)

export function extractErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return `Cannot connect to API server at ${API_BASE_URL}. Please ensure the backend server in the "admin" folder is running.`
    }
    const data = error.response.data as { message?: string; error?: string } | undefined
    if (data?.message) return data.message
    if (data?.error) return data.error
    if (error.message) return error.message
  }
  if (error instanceof Error) return error.message
  return fallback
}

export const resolveImageUrl = (url?: string | null): string | null => {
  if (!url) return null
  const cleaned = String(url).trim().replace(/\\/g, '/')
  if (!cleaned) return null
  // Guard against invalid inputs like email addresses in avatar field
  if (cleaned.includes('@') && !cleaned.includes('/')) return null
  if (
    cleaned.startsWith('http://') ||
    cleaned.startsWith('https://') ||
    cleaned.startsWith('data:') ||
    cleaned.startsWith('blob:') ||
    cleaned.startsWith('/@fs/')
  ) {
    return cleaned
  }
  return `${API_BASE_URL}${cleaned.startsWith('/') ? '' : '/'}${cleaned}`
}

export default api
