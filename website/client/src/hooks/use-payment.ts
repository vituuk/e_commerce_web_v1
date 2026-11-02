import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  checkoutPaywayPayment,
  getMyPayments,
  verifyPaywayPayment,
} from '@/services/payment.service'
import type { PaywayCheckoutPayload } from '@/types/payment'

export const useMyPayments = (enabled = true) => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => getMyPayments({ limit: 50 }),
    enabled,
    initialData: [],
  })
}

export const useCheckoutPayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PaywayCheckoutPayload) => checkoutPaywayPayment(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
  })
}

export const useVerifyPayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tranId: string) => verifyPaywayPayment(tranId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments'] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

