import type { Product, ProductVariant } from './product'

export interface CartItemVariant extends ProductVariant {
  product?: Product
}

export interface CartItem {
  id: number | string
  cartId?: number | string
  variantId?: number | string
  quantity: number
  unit_price?: number | string
  line_total?: number | string
  createdAt?: string
  updatedAt?: string
  variant?: CartItemVariant
}

export interface Cart {
  id?: number | string
  userId?: number | string
  items: CartItem[]
  total_qty: number
  total_price: number
}

export interface AddCartItemPayload {
  variantId: number | string
  quantity?: number
  variant?: ProductVariant | CartItemVariant | null
  product?: Product | null
}

export interface UpdateCartItemPayload {
  quantity: number
}
