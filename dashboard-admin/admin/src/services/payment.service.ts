import api from './lib/axios'
import type { Payment, PaymentCheckoutPayload } from '@/types/payment'

export const getAdminPayments = async (params?: {
  status?: string
  method?: string
  orderId?: number
  userId?: number
  page?: number
  limit?: number
}): Promise<{ data: Payment[] }> => {
  const res = (await api.get('/payment/admin', {
    params: { limit: 100, ...params },
  })) as unknown as { data?: Payment[] }
  return { data: res?.data || [] }
}

export const getUserPayments = async (params?: {
  status?: string
  method?: string
  orderId?: number
  page?: number
  limit?: number
}): Promise<{ data: Payment[] }> => {
  const res = (await api.get('/payment', {
    params: { limit: 100, ...params },
  })) as unknown as { data?: Payment[] }
  return { data: res?.data || [] }
}

export const checkoutPayment = async (payload: PaymentCheckoutPayload) => {
  return await api.post('/payment/checkout', payload)
}

export const verifyPayment = async (tranId: string): Promise<Payment | null> => {
  const res = (await api.get(`/payment/verify/${tranId}`)) as unknown as { data?: Payment }
  return res?.data || null
}

