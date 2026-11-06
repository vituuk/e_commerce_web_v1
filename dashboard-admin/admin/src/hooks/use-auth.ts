import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  authAdminLogin,
  authLogin,
  authLogout,
  authUserRegister,
  getAuthMe,
  getAuthUsers,
  getOwnProfile,
  updateOwnProfile,
} from '@/services/auth.service'
import type { AuthLoginPayload, AuthRegisterPayload } from '@/types/auth-login'
import type { UserProfilePayload } from '@/types/user'

export const useAuthLogin = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ request }: { request: AuthLoginPayload }) => authLogin(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['auth-me'] })
    },
  })
}

export const useAdminLogin = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: AuthLoginPayload) => authAdminLogin(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['auth-me'] })
    },
  })
}

export const useAuthRegister = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: AuthRegisterPayload) => authUserRegister(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export const useAuthMe = () => {
  return useQuery({
    queryKey: ['auth-me'],
    queryFn: () => getAuthMe(),
  })
}

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => getAuthUsers(),
  })
}

export const useOwnProfile = () => {
  return useQuery({
    queryKey: ['own-profile'],
    queryFn: () => getOwnProfile(),
  })
}

export const useUpdateOwnProfile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UserProfilePayload) => updateOwnProfile(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['own-profile'] })
      void queryClient.invalidateQueries({ queryKey: ['auth-me'] })
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

