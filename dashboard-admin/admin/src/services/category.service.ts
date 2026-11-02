import api from './lib/axios'
import type { Category, CategoryPayload } from '@/types/category'

export interface CategoryListResponse {
  message?: string
  data: Category[]
  pagination?: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const getCategory = async (search?: string): Promise<CategoryListResponse> => {
  const res = (await api.get('/category', {
    params: { q: search || undefined, limit: 100 },
  })) as unknown as CategoryListResponse
  return {
    data: res?.data || [],
    pagination: res?.pagination,
  }
}

export const getCategoryById = async (id: number | string): Promise<Category | null> => {
  const res = (await api.get(`/category/${id}`)) as unknown as { data?: Category }
  return res?.data || null
}

export const createCategory = async (request: CategoryPayload): Promise<Category> => {
  const payload = {
    ...request,
    slug: request.slug?.trim() || toSlug(request.name),
  }
  const res = (await api.post('/category', payload)) as unknown as { data: Category }
  return res.data
}

export const updateCategory = async (
  id: number | string,
  request: CategoryPayload,
): Promise<Category> => {
  const res = (await api.put(`/category/${id}`, request)) as unknown as { data: Category }
  return res.data
}

export const deleteCategory = async (id?: number | string) => {
  return await api.delete(`/category/${id}`)
}
