import api from './lib/axios'
import {
  getAccessToken,
  getUserFromToken,
  isAdminRole,
  removeAccessToken,
  setAccessToken,
} from '@/utils/tokenStorage'
import type {
  AuthLoginPayload,
  AuthLoginResponse,
  AuthRegisterPayload,
  AuthUserIdentity,
} from '@/types/auth-login'
import type { User, UserProfilePayload } from '@/types/user'

export const authAdminLogin = async (
  request: AuthLoginPayload,
): Promise<AuthLoginResponse & { user: AuthUserIdentity }> => {
  const res = (await api.post('/auth/admin/login', request)) as unknown as AuthLoginResponse
  if (!isAdminRole(res?.roles)) {
    removeAccessToken()
    throw new Error('Access denied: Only admin or superadmin accounts can sign in here.')
  }
  if (res?.token) {
    setAccessToken(res.token, 2)
  }
  const decoded = getUserFromToken()
  let user: AuthUserIdentity = decoded || {
    id: 0,
    email: request.email,
    fullName: request.email.split('@')[0],
    roles: res?.roles || ['admin'],
  }
  try {
    const meRes = (await api.get('/auth/me')) as unknown as {
      data?: AuthUserIdentity
      user?: AuthUserIdentity
    }
    const meUser = meRes?.data || meRes?.user
    if (meUser) {
      if (!isAdminRole(meUser.roles)) {
        removeAccessToken()
        throw new Error('Access denied: Only admin or superadmin accounts can sign in here.')
      }
      user = meUser
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Access denied')) {
      throw err
    }
    // fallback to decoded token
  }
  return { ...res, user }
}

export const authLogin = async (
  request: AuthLoginPayload,
): Promise<AuthLoginResponse & { user: AuthUserIdentity }> => {
  return await authAdminLogin(request)
}

export const authAdminRegister = async (request: AuthRegisterPayload) => {
  return await api.post('/auth/admin/register', request)
}

export const authUserRegister = async (request: AuthRegisterPayload) => {
  return await api.post('/auth/user/register', request)
}

export const getAuthMe = async (): Promise<AuthUserIdentity | null> => {
  if (!getAccessToken()) return null
  const res = (await api.get('/auth/me')) as unknown as {
    data?: AuthUserIdentity
    user?: AuthUserIdentity
  }
  const user = res?.data || res?.user || getUserFromToken()
  if (user && !isAdminRole(user.roles)) {
    removeAccessToken()
    return null
  }
  return user || null
}

export const getAuthUsers = async (): Promise<User[]> => {
  const res = (await api.get('/auth/getData')) as unknown as { data?: User[] }
  return res?.data || []
}

export const getOwnProfile = async (): Promise<User | null> => {
  const res = (await api.get('/auth/profile')) as unknown as { data?: User }
  return res?.data || null
}

export const createOwnProfile = async (request: UserProfilePayload): Promise<User | null> => {
  const res = (await api.post('/auth/profile', request)) as unknown as { data?: User }
  return res?.data || null
}

export const updateOwnProfile = async (request: UserProfilePayload): Promise<User | null> => {
  try {
    const res = (await api.put('/auth/profile', request)) as unknown as { data?: User }
    return res?.data || null
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      const created = (await api.post('/auth/profile', request)) as unknown as { data?: User }
      return created?.data || null
    }
    throw err
  }
}

export const uploadOwnAvatar = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('image', file)
  const res = (await api.post('/auth/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })) as unknown as { data?: { url?: string } }
  return res?.data?.url || ''
}

export const getUserProfileById = async (userId: number | string): Promise<User | null> => {
  const res = (await api.get(`/auth/profile/${userId}`)) as unknown as { data?: User }
  return res?.data || null
}

export const authLogout = (): void => {
  removeAccessToken()
}
