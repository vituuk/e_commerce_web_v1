import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addCartItem,
  checkoutOrder,
  clearCart,
  downloadOrderInvoice,
  getAdminOrderById,
  getAdminOrders,
  getCart,
  updateAdminOrderStatus,
} from '@/services/order.service'
import type { OrderStatus } from '@/types/order'
import type { CartItemPayload } from '@/types/cart'

export const useOrders = (params?: {
  status?: string
  q?: string
  from?: string
  to?: string
}) => {
  return useQuery({
    queryKey: ['orders', params?.status, params?.q, params?.from, params?.to],
    queryFn: () => getAdminOrders(params),
  })
}

export const useOrderById = (id: number | string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => getAdminOrderById(id),
    enabled: Boolean(id),
  })
}

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: OrderStatus | string }) =>
      updateAdminOrderStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-report'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Orders'] })
    },
  })
}

export const useCheckoutOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload?: { addressId?: number }) => checkoutOrder(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Orders'] })
    },
  })
}

export const useDownloadOrderInvoice = () => {
  return useMutation({
    mutationFn: (id: number | string) => downloadOrderInvoice(id),
  })
}

export const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => getCart(),
  })
}

export const useAddCartItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CartItemPayload) => addCartItem(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Carts'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Cart items'] })
    },
  })
}

export const useClearCart = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => clearCart(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Carts'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Cart items'] })
    },
  })
}

