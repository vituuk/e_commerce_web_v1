import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAddress,
  getAddresses,
  getDefaultAddress,
  removeAddress,
  setDefaultAddress,
  updateAddress,
} from '@/services/address.service'
import type { AddressFormPayload } from '@/types/address'

export const useAddresses = (enabled = true) => {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: () => getAddresses({ limit: 50 }),
    enabled,
    initialData: [],
  })
}

export const useDefaultAddress = (enabled = true) => {
  return useQuery({
    queryKey: ['address-default'],
    queryFn: () => getDefaultAddress(),
    enabled,
  })
}

export const useSaveAddress = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id?: number | string | null
      payload: AddressFormPayload
    }) => (id ? updateAddress(id, payload) : createAddress(payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['addresses'] })
      void queryClient.invalidateQueries({ queryKey: ['address-default'] })
    },
  })
}

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) => setDefaultAddress(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['addresses'] })
      void queryClient.invalidateQueries({ queryKey: ['address-default'] })
    },
  })
}

export const useDeleteAddress = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) => removeAddress(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['addresses'] })
      void queryClient.invalidateQueries({ queryKey: ['address-default'] })
    },
  })
}
