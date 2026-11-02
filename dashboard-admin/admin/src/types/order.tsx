export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  id: number
  orderId: number
  variantId: number
  product_name: string
  sku: string
  color?: string | null
  size?: string | null
  unit_price: number | string
  quantity: number
  amount: number | string
  createdAt?: string
}

export interface Order {
  id: number
  userId: number
  addressId?: number | null
  order_number: string
  shipping_receiver_name?: string | null
  shipping_phone?: string | null
  shipping_street?: string | null
  shipping_city?: string | null
  sub_total: number | string
  discount: number | string
  shipping_fee: number | string
  total: number | string
  status: OrderStatus
  createdAt: string
  updatedAt?: string
  items?: OrderItem[]
  user?: {
    id: number
    firstName: string
    lastName?: string
    email: string
  }
}

export interface OrderReport {
  from: string
  to: string
  total_orders: number
  paid_orders: number
  revenue: number
  average_order_value: number
  by_status: Record<string, number>
  top_products: Array<{
    variantId: number
    product_name: string
    sku: string
    quantity: number
    revenue: number
  }>
  daily: Array<{
    date: string
    orders: number
    revenue: number
  }>
}

