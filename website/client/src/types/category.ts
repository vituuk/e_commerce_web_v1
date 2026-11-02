export interface Category {
  id: number | string
  name: string
  slug?: string
  description?: string
  is_active?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CategoryDetail<TProduct = unknown> extends Category {
  products?: TProduct[]
}

export interface CategoryQueryParams {
  q?: string
  is_active?: boolean
  page?: number
  limit?: number
}

export interface EditorialCategoryItem {
  key: string
  name: string
  query: string
  image: string
}
