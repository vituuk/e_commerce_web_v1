import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAddress,
  createCustomer,
  createRole,
  deleteAddress,
  deleteRole,
  getAddresses,
  getCustomers,
  getRoles,
  updateAddress,
  updateRole,
} from '@/services/customer.service'
import type { AddressPayload, RolePayload } from '@/types/user'
import type { AuthRegisterPayload } from '@/types/auth-login'

export const useCustomers = (search?: string) => {
  return useQuery({
    queryKey: ['customers', search],
    queryFn: () => getCustomers(search),
  })
}

export const useCreateCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AuthRegisterPayload) => createCustomer(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Customers'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Users'] })
    },
  })
}

export const useAddresses = (search?: string) => {
  return useQuery({
    queryKey: ['addresses', search],
    queryFn: () => getAddresses({ q: search }),
  })
}

export const useCreateAddress = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AddressPayload) => createAddress(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['addresses'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Addresses'] })
    },
  })
}

export const useUpdateAddress = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: Partial<AddressPayload> }) =>
      updateAddress(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['addresses'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Addresses'] })
    },
  })
}

export const useDeleteAddress = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteAddress(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['addresses'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Addresses'] })
    },
  })
}

export const useRoles = (search?: string) => {
  return useQuery({
    queryKey: ['roles', search],
    queryFn: () => getRoles(search),
  })
}

export const useCreateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RolePayload) => createRole(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Roles'] })
    },
  })
}

export const useUpdateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: Partial<RolePayload> }) =>
      updateRole(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Roles'] })
    },
  })
}

export const useDeleteRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteRole(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Roles'] })
    },
  })
}

