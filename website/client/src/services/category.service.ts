import { categoryApi } from './client'
import type { Category, CategoryDetail, CategoryQueryParams } from '@/types/category'
import type { Product } from '@/types/product'

export const getCategories = async (
  params: CategoryQueryParams & Record<string, unknown> = {},
): Promise<Category[]> => {
  const firstRes = await categoryApi.list({ page: 1, limit: 100, ...params })
  const rows: Category[] = [...(firstRes.data?.data || [])]
  const pagination = firstRes.data?.pagination

  if (!params.page && pagination?.has_next && pagination.total_pages > 1) {
    const maxPages = Math.min(pagination.total_pages, 5)
    for (let page = 2; page <= maxPages; page++) {
      const nextRes = await categoryApi.list({ ...params, page, limit: 100 })
      rows.push(...(nextRes.data?.data || []))
    }
  }

  return rows.filter((c) => c.is_active !== false)
}

export const getCategoryById = async (
  id: number | string,
): Promise<CategoryDetail<Product> | null> => {
  const res = await categoryApi.getById(id)
  return res.data?.data || null
}
