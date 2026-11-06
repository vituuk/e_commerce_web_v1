import axios from 'axios'
import { authApi, profileApi } from './client'
import {
  getAccessToken,
  isUserRole,
  removeAccessToken,
  setAccessToken,
} from '@/utils/tokenStorage'
import { isConfiguredGoogleClientId } from '@/utils/googleAuth'
import type {
  AuthGoogleLoginPayload,
  AuthLoginPayload,
  AuthLoginResponse,
  AuthRegisterPayload,
  AuthUser,
  ProfileInputPayload,
  UserProfileData,
  UserProfileForm,
} from '@/types/auth'

export const authUserLogin = async (payload: AuthLoginPayload): Promise<AuthLoginResponse> => {
  const res = await authApi.login(payload)
  if (res.data?.token) {
    setAccessToken(res.data.token)
  }
  return res.data
}

export const getGoogleAuthClientId = async (): Promise<string> => {
  const envClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || ''
  if (isConfiguredGoogleClientId(envClientId)) {
    return envClientId
  }
  try {
    const res = await authApi.googleConfig()
    const serverClientId = (res.data?.clientId || '').trim()
    if (isConfiguredGoogleClientId(serverClientId)) {
      return serverClientId
    }
  } catch {
    // ignore fallback fetch error
  }
  return ''
}

export const authGoogleLogin = async (
  payload: AuthGoogleLoginPayload,
): Promise<AuthLoginResponse> => {
  const res = await authApi.googleLogin(payload)
  if (res.data?.token) {
    setAccessToken(res.data.token)
  }
  return res.data
}

export const authUserRegister = async (payload: AuthRegisterPayload) => {
  const res = await authApi.register(payload)
  return res.data
}

export const getAuthMe = async (): Promise<AuthUser | null> => {
  if (!getAccessToken()) return null
  try {
    const res = await authApi.me()
    const me = res.data?.data || null
    if (!me || (me.roles && !isUserRole(me.roles))) {
      removeAccessToken()
      return null
    }
    return me
  } catch {
    removeAccessToken()
    return null
  }
}

export const getOwnProfile = async (): Promise<UserProfileData | null> => {
  const res = await profileApi.getMine()
  return res.data?.data || null
}

export const createOwnProfile = async (
  payload: Partial<UserProfileForm | ProfileInputPayload>,
): Promise<UserProfileData | null> => {
  try {
    const res = await profileApi.create(payload)
    return res.data?.data || null
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 409) {
      const retry = await profileApi.update(payload)
      return retry.data?.data || null
    }
    throw err
  }
}

export const updateOwnProfile = async (
  payload: Partial<UserProfileForm | ProfileInputPayload>,
): Promise<UserProfileData | null> => {
  try {
    const res = await profileApi.update(payload)
    return res.data?.data || null
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      const retry = await profileApi.create(payload)
      return retry.data?.data || null
    }
    throw err
  }
}

export const saveOwnProfile = async (
  payload: Partial<UserProfileForm | ProfileInputPayload>,
  hasExistingProfile = true,
): Promise<UserProfileData | null> => {
  return hasExistingProfile ? updateOwnProfile(payload) : createOwnProfile(payload)
}

export const uploadOwnAvatar = async (file: File): Promise<string | null> => {
  const res = await profileApi.uploadAvatar(file)
  const rawUrl = res.data?.data?.url || null
  return rawUrl || null
}

export const authLogout = (): void => {
  removeAccessToken()
}
