import { useQuery } from '@tanstack/react-query'
import { getCategories, getCategoryById } from '@/services/category.service'

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ limit: 100 }),
  })
}

export const useCategoryById = (id?: number | string | null) => {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => getCategoryById(id as number | string),
    enabled: Boolean(id),
  })
}
