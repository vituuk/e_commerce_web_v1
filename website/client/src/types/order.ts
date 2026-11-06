import type { Address } from './address'

export interface OrderItem {
  id: number | string
  orderId?: number | string
  variantId?: number | string | null
  product_name?: string
  sku?: string
  color?: string | null
  size?: string | null
  unit_price?: number | string
  price: number | string
  quantity: number
  amount?: number | string
  total: number | string
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | string

export interface Order {
  id: number | string
  userId?: number | string
  order_number?: string
  status: OrderStatus
  payment_status: string
  shipping_receiver_name?: string
  shipping_phone?: string
  shipping_street?: string
  shipping_city?: string
  subtotal?: number | string
  sub_total?: number | string
  discount?: number | string
  shipping_fee?: number | string
  total: number | string
  addressId?: number | string | null
  address?: Address
  items?: OrderItem[]
  createdAt?: string
  updatedAt?: string
}

export interface OrderCheckoutItemInput {
  variantId: number
  quantity?: number
}

export interface OrderCheckoutPayload {
  addressId?: number | string
  sub_total?: number
  discount?: number
  shipping_fee?: number
  items?: OrderCheckoutItemInput[]
}

export interface OrderQueryParams {
  status?: string
  q?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}
