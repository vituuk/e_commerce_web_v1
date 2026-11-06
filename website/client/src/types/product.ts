import type { Category } from './category'

export interface ProductSummary {
  id: number | string
  name: string
  slug?: string
}

export interface ProductImage {
  id: number | string
  productId?: number | string
  image_url?: string
  url?: string
  is_primary?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ProductImageDetail extends ProductImage {
  product?: ProductSummary
}

export interface ProductVariant {
  id: number | string
  productId?: number | string
  sku?: string
  color?: string | null
  size?: string | null
  price?: number | string | null
  final_price?: number | string
  stock_qty?: number | string
  is_active?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ProductVariantDetail extends ProductVariant {
  product?: ProductSummary
}

export interface ProductReviewUser {
  id?: number | string
  firstName?: string
  lastName?: string
  email?: string
}

export interface ProductReview {
  id: number | string
  productId?: number | string
  userId?: number | string
  rating: number
  comment?: string | null
  createdAt?: string
  updatedAt?: string
  user?: ProductReviewUser
}

export type ProductReviewsBreakdown = Record<number, number>

export interface ProductReviewsSummary {
  average_rating: number
  total_reviews: number
  breakdown?: ProductReviewsBreakdown
}

export interface Product {
  id: number | string
  key?: string
  isPreview?: boolean
  name: string
  slug?: string
  description?: string | null
  base_price?: number | string
  sale_price?: number | string | null
  price?: number | string
  image_url?: string
  image?: string
  colorHint?: string
  is_active?: boolean
  categoryId?: number | string | null
  category?: Category | null
  images?: ProductImage[]
  variants?: ProductVariant[]
  reviewsList?: ProductReview[]
  reviewsSummary?: ProductReviewsSummary
  createdAt?: string
  updatedAt?: string
}

export interface ProductQueryParams {
  categoryId?: number | string
  q?: string
  page?: number
  limit?: number
}

export interface ReviewQueryParams {
  rating?: number
  page?: number
  limit?: number
}

export interface ReviewFormPayload {
  rating: number
  comment?: string | null
}

export interface SelectedDetailPricing {
  basePrice: number
  salePrice: number
}

export interface OurProductShowcaseItem {
  key: string
  name: string
  base_price?: number
  sale_price?: number
  originalPrice?: number
  price: number
  image: string
  category: string
}

export interface EnrichedOurProductItem extends OurProductShowcaseItem {
  realProduct: Product | null
  catalogId: number | string
}
