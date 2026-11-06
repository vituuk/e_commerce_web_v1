import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProductReview,
  deleteProductReview,
  getEnrichedCatalog,
  getProductById,
  getProductImages,
  getProductReviews,
  getProductVariants,
  updateProductReview,
} from '@/services/product.service'
import type { ReviewFormPayload } from '@/types/product'

export const useCatalog = () => {
  return useQuery({
    queryKey: ['catalog'],
    queryFn: () => getEnrichedCatalog(),
  })
}

export const useProductById = (productId?: number | string | null) => {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProductById(productId as number | string),
    enabled: Boolean(productId),
  })
}

export const useProductImages = (productId?: number | string | null) => {
  return useQuery({
    queryKey: ['product-images', productId],
    queryFn: () => getProductImages(productId as number | string),
    enabled: Boolean(productId),
  })
}

export const useProductVariants = (productId?: number | string | null) => {
  return useQuery({
    queryKey: ['product-variants', productId],
    queryFn: () => getProductVariants(productId as number | string),
    enabled: Boolean(productId),
  })
}

export const useProductReviews = (productId?: number | string | null) => {
  return useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: () => getProductReviews(productId as number | string, { limit: 50 }),
    enabled: Boolean(productId),
  })
}

export const useSaveReview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      productId,
      reviewId,
      payload,
    }: {
      productId: number | string
      reviewId?: number | string | null
      payload: ReviewFormPayload
    }) =>
      reviewId
        ? updateProductReview(productId, reviewId, payload)
        : createProductReview(productId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['product-reviews', variables.productId] })
      void queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
  })
}

export const useDeleteReview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      productId,
      reviewId,
    }: {
      productId: number | string
      reviewId: number | string
    }) => deleteProductReview(productId, reviewId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['product-reviews', variables.productId] })
      void queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
  })
}
