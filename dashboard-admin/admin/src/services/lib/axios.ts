import { getAccessToken, removeAccessToken } from '@/utils/tokenStorage'
import axios from 'axios'

export const apiUrl =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ||
  'http://localhost:3000'

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Automatically attaches JWT Bearer token from 2-hour cookie
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response Interceptor: Automatically unpacks response.data and clears expired session on 401
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const status = error?.response?.status
    const url = String(error?.config?.url || '')
    if (status === 401 && !url.includes('/auth/admin/login')) {
      removeAccessToken()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('commerceos-auth-change'))
      }
    }
    return Promise.reject(error)
  },
)

export default api

