import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCategory,
  deleteCategory,
  getCategory,
  updateCategory,
} from '@/services/category.service'
import type { CategoryPayload } from '@/types/category'

// 1. Reading Data (with automatic caching and search dependency)
export const useCategory = (search?: string) => {
  return useQuery({
    queryKey: ['categories', search],
    queryFn: () => getCategory(search),
  })
}

// 2. Create Mutation + Cache Invalidation
export const useCreateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CategoryPayload) => createCategory(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Categories'] })
    },
  })
}

// 3. Update Mutation
export const useUpdateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: CategoryPayload }) =>
      updateCategory(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Categories'] })
    },
  })
}

// 4. Delete Mutation
export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id?: number }) => deleteCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Categories'] })
    },
  })
}

