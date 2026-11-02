import { normalizePaywayOption, paymentApi } from './client'
import type {
  PaymentQueryParams,
  PaymentRecord,
  PaywayCheckoutPayload,
  PaywayCheckoutResponse,
} from '@/types/payment'

export function normalizePayment(raw: PaymentRecord): PaymentRecord {
  const tranId = raw.paywayTranId || raw.payway_tran_id
  const ordId = raw.orderId ?? raw.order_id
  const method = raw.method || raw.payment_option || raw.provider || 'abapay_khqr'
  return {
    ...raw,
    orderId: ordId,
    order_id: ordId,
    paywayTranId: tranId,
    payway_tran_id: tranId,
    method,
    payment_option: method,
  }
}

export const checkoutPaywayPayment = async (
  payload: PaywayCheckoutPayload,
): Promise<PaywayCheckoutResponse | null> => {
  const res = await paymentApi.checkout({
    orderId: Number(payload.orderId),
    payment_option: normalizePaywayOption(payload.payment_option),
  })
  const data = res.data?.data
  if (!data) return null
  return {
    ...data,
    payment: data.payment ? normalizePayment(data.payment) : undefined,
  }
}

export const verifyPaywayPayment = async (tranId: string): Promise<PaymentRecord | null> => {
  const res = await paymentApi.verify(tranId)
  return res.data?.data ? normalizePayment(res.data.data) : null
}

export const getMyPayments = async (
  params: PaymentQueryParams & Record<string, unknown> = { limit: 50 },
): Promise<PaymentRecord[]> => {
  const res = await paymentApi.listMine(params)
  return (res.data?.data || []).map(normalizePayment)
}
