import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addCartItem,
  clearCart,
  EMPTY_CART,
  getCart,
  getStoredCart,
  removeCartItem,
  updateCartItem,
} from '@/services/cart.service'
import type { AddCartItemPayload, UpdateCartItemPayload } from '@/types/cart'

export const useCart = (enabled = true) => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => getCart(),
    enabled,
    initialData: () => getStoredCart(),
  })
}

export const useAddCartItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AddCartItemPayload) => addCartItem(payload),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(['cart'], updatedCart)
    },
  })
}

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: number | string
      payload: UpdateCartItemPayload
    }) => updateCartItem(itemId, payload),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(['cart'], updatedCart)
    },
  })
}

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (itemId: number | string) => removeCartItem(itemId),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(['cart'], updatedCart)
    },
  })
}

export const useClearCart = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => clearCart(),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(['cart'], updatedCart)
    },
  })
}
