import type { Category } from './category'

export interface IProductImage {
  id: number
  productId: number
  url: string
  is_primary: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ProductVariantPayload {
  id?: number
  productId?: number
  sku: string
  color?: string | null
  size?: string | null
  price?: number | null
  stock_qty?: number
  is_active?: boolean
}

export interface ProductVariant {
  id: number
  productId: number
  sku: string
  color?: string | null
  size?: string | null
  price?: number | string | null
  final_price?: number
  stock_qty: number
  is_active: boolean
  createdAt?: string
  updatedAt?: string
  product?: {
    id: number
    name: string
    slug: string
    base_price?: number | string
  }
}

export interface ProductPayload {
  id?: number
  categoryId: number
  name: string
  slug?: string
  description?: string | null
  base_price: number
  is_active?: boolean
}

export interface Product {
  id: number
  categoryId: number
  name: string
  slug: string
  description?: string | null
  base_price: number | string
  is_active: boolean
  createdAt: string
  updatedAt?: string
  category?: Category
  images?: IProductImage[]
  variants?: ProductVariant[]
}

export interface ReviewPayload {
  rating: number
  comment?: string | null
}

export interface Review {
  id: number
  userId: number
  productId: number
  rating: number
  comment?: string | null
  createdAt: string
  updatedAt?: string
  user?: {
    id: number
    firstName: string
    lastName?: string
    email: string
  }
}

