import type { Product } from './product'

export type StorefrontPage = 'home' | 'shop' | 'product' | 'cart' | 'checkout' | 'account'

export type NavHighlightKey =
  | 'home'
  | 'shop'
  | 'new-arrivals'
  | 'men'
  | 'women'
  | 'sale'
  | 'cart'
  | 'account'
  | string

export type AccountTab = 'profile' | 'addresses' | 'orders' | 'payments' | 'reviews'

export type LanguageCode = 'en' | 'km'

export type ToastType = 'info' | 'success' | 'error'

export interface ToastMessage {
  message: string
  type: ToastType
}

export interface NavigateOptions {
  product?: Product | null
  pushHistory?: boolean
  replaceHistory?: boolean
  navHighlight?: string | null
  noScroll?: boolean
}

export type PriceRangePreset = 'all' | 'under50' | '50to100' | 'over100' | 'custom'

export type AvailabilityFilter = 'all' | 'in_stock' | 'on_sale'

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'popularity'

