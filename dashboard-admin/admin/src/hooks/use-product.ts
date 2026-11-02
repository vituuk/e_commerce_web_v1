import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProduct,
  createProductVariant,
  deleteProduct,
  deleteProductImage,
  deleteProductVariant,
  getProductImages,
  getProductReviews,
  getProducts,
  getProductVariants,
  updateProduct,
  updateProductVariant,
  uploadProductImage,
} from '@/services/product.service'
import type { ProductPayload, ProductVariantPayload } from '@/types/product'

export const useProducts = (search?: string, categoryId?: number) => {
  return useQuery({
    queryKey: ['products', search, categoryId],
    queryFn: () => getProducts(search, categoryId),
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProductPayload) => createProduct(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Products'] })
    },
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: Partial<ProductPayload> }) =>
      updateProduct(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Products'] })
    },
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id?: number }) => deleteProduct(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Products'] })
    },
  })
}

export const useProductVariants = (productId: number | string) => {
  return useQuery({
    queryKey: ['product-variants', productId],
    queryFn: () => getProductVariants(productId),
    enabled: Boolean(productId),
  })
}

export const useCreateProductVariant = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      productId,
      request,
    }: {
      productId: number | string
      request: ProductVariantPayload
    }) => createProductVariant(productId, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product-variants'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Product variants'] })
    },
  })
}

export const useUpdateProductVariant = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      productId,
      id,
      request,
    }: {
      productId: number | string
      id: number | string
      request: Partial<ProductVariantPayload>
    }) => updateProductVariant(productId, id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product-variants'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Product variants'] })
    },
  })
}

export const useDeleteProductVariant = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      productId,
      id,
    }: {
      productId: number | string
      id: number | string
    }) => deleteProductVariant(productId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product-variants'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Product variants'] })
    },
  })
}

export const useProductImages = (productId: number | string) => {
  return useQuery({
    queryKey: ['product-images', productId],
    queryFn: () => getProductImages(productId),
    enabled: Boolean(productId),
  })
}

export const useUploadProductImage = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      productId,
      file,
      dataUrl,
      is_primary,
    }: {
      productId: number | string
      file?: File
      dataUrl?: string
      is_primary?: boolean
    }) => uploadProductImage(productId, { file, dataUrl, is_primary }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product-images'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Product images'] })
    },
  })
}

export const useDeleteProductImage = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      productId,
      id,
    }: {
      productId: number | string
      id: number | string
    }) => deleteProductImage(productId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product-images'] })
      void queryClient.invalidateQueries({ queryKey: ['resource', 'Product images'] })
    },
  })
}

export const useProductReviews = (productId: number | string) => {
  return useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: () => getProductReviews(productId),
    enabled: Boolean(productId),
  })
}

