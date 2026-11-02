import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  checkoutPayment,
  getAdminPayments,
  verifyPayment,
} from '@/services/payment.service'
import type { PaymentCheckoutPayload } from '@/types/payment'

export const usePayments = (params?: { status?: string; method?: string }) => {
  return useQuery({
    queryKey: ['payments', params?.status, params?.method],
    queryFn: () => getAdminPayments(params),
  })
}

export const useCheckoutPayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PaymentCheckoutPayload) => checkoutPayment(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Payments'] })
    },
  })
}

export const useVerifyPayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tranId: string) => verifyPayment(tranId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments'] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Payments'] })
    },
  })
}

