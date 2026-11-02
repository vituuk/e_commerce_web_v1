export type PaywayPaymentOption =
  | 'abapay_khqr'
  | 'abapay_khqr_deeplink'
  | 'cards'
  | 'alipay'
  | 'wechat'

export type CheckoutPaymentMethod = PaywayPaymentOption | 'paypal' | string

export interface CreditCardFormState {
  number: string
  name: string
  exp: string
  cvv: string
}

export interface PaymentOrderSummary {
  id: number | string
  order_number?: string
  total?: number | string
  status?: string
}

export interface PaymentRecord {
  id: number | string
  userId?: number | string
  orderId?: number | string
  order_id?: number | string
  paywayTranId?: string
  payway_tran_id?: string
  method?: string
  payment_option?: string
  provider?: string
  amount: number | string
  status: 'pending' | 'success' | 'failed' | string
  paidAt?: string | null
  remark?: string | null
  order?: PaymentOrderSummary
  createdAt?: string
  updatedAt?: string
}

export interface PaywayCheckoutPayload {
  orderId: number | string
  payment_option?: PaywayPaymentOption | string
}

export interface PaywayCheckoutResponse {
  action_url?: string
  method?: string
  target?: string
  id?: string
  fields?: Record<string, string | number | null | undefined>
  payment?: PaymentRecord
  payway?: {
    action: string
    method: string
    target?: string
    id?: string
    fields: Record<string, string | number | null | undefined>
  }
}

export interface PaymentQueryParams {
  status?: 'pending' | 'success' | 'failed' | string
  method?: string
  orderId?: number | string
  page?: number
  limit?: number
}
