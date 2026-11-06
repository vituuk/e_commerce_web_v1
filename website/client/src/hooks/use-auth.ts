import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  authLogout,
  authUserLogin,
  authUserRegister,
  getAuthMe,
  getOwnProfile,
  saveOwnProfile,
  uploadOwnAvatar,
} from '@/services/auth.service'
import type {
  AuthLoginPayload,
  AuthRegisterPayload,
  ProfileInputPayload,
  UserProfileForm,
} from '@/types/auth'

export const useAuthMe = () => {
  return useQuery({
    queryKey: ['auth-me'],
    queryFn: () => getAuthMe(),
  })
}

export const useAuthLogin = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AuthLoginPayload) => authUserLogin(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['auth-me'] })
      void queryClient.invalidateQueries({ queryKey: ['own-profile'] })
    },
  })
}

export const useAuthRegister = () => {
  return useMutation({
    mutationFn: (payload: AuthRegisterPayload) => authUserRegister(payload),
  })
}

export const useOwnProfile = (enabled = true) => {
  return useQuery({
    queryKey: ['own-profile'],
    queryFn: () => getOwnProfile(),
    enabled,
  })
}

export const useSaveOwnProfile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      hasExistingProfile,
      payload,
    }: {
      hasExistingProfile: boolean
      payload: Partial<UserProfileForm | ProfileInputPayload>
    }) => saveOwnProfile(payload, hasExistingProfile),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['own-profile'] })
      void queryClient.invalidateQueries({ queryKey: ['auth-me'] })
    },
  })
}

export const useUploadOwnAvatar = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadOwnAvatar(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['own-profile'] })
    },
  })
}

export const useAuthLogout = () => {
  const queryClient = useQueryClient()
  return () => {
    authLogout()
    queryClient.clear()
  }
}
