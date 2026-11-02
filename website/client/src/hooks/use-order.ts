import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelMyOrder,
  checkoutOrder,
  getMyOrderById,
  getMyOrders,
  triggerOrderInvoiceDownload,
} from '@/services/order.service'
import type { OrderCheckoutPayload } from '@/types/order'

export const useMyOrders = (statusFilter = '', enabled = true) => {
  return useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => {
      const params: Record<string, unknown> = { limit: 50 }
      if (statusFilter) params.status = statusFilter
      return getMyOrders(params)
    },
    enabled,
    initialData: [],
  })
}

export const useMyOrderById = (orderId?: number | string | null, enabled = true) => {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getMyOrderById(orderId as number | string),
    enabled: Boolean(orderId) && enabled,
  })
}

export const useCheckoutOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: OrderCheckoutPayload) => checkoutOrder(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
  })
}

export const useCancelMyOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: number | string) => cancelMyOrder(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
  })
}

export const useDownloadOrderInvoice = () => {
  return useMutation({
    mutationFn: ({ orderId, orderNumber }: { orderId: number | string; orderNumber?: string }) =>
      triggerOrderInvoiceDownload(orderId, orderNumber),
  })
}
