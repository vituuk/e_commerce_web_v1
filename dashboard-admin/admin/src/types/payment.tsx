export type PaymentStatus = 'pending' | 'success' | 'failed'

export interface PaymentCheckoutPayload {
  orderId: number
  payment_option?: string
}

export interface Payment {
  id: number
  userId: number
  orderId: number
  paywayTranId?: string | null
  method: string
  paidAt?: string | null
  remark?: string | null
  amount: number | string
  status: PaymentStatus
  createdAt: string
  updatedAt?: string
  order?: {
    id: number
    order_number: string
    total: number | string
    status: string
  }
  user?: {
    id: number
    firstName: string
    lastName?: string
    email: string
  }
}

