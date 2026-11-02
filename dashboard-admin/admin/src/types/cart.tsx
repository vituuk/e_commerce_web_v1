export interface CartItemPayload {
  variantId: number
  quantity: number
}

export interface CartItemEntity {
  id: number
  cartId: number
  variantId: number
  quantity: number
  createdAt?: string
  updatedAt?: string
  variant?: {
    id: number
    sku: string
    color?: string | null
    size?: string | null
    price?: number | string | null
    final_price?: number
    stock_qty: number
    product?: {
      id: number
      name: string
      slug: string
      base_price: number | string
    }
  }
}

export interface CartEntity {
  id: number
  userId: number
  items?: CartItemEntity[]
  total_qty?: number
  total_price?: number
  createdAt?: string
  updatedAt?: string
}

export interface PosCartItem {
  id: string
  variantId?: number
  name: string
  sku: string
  price: number
  qty: number
  image: string
}

