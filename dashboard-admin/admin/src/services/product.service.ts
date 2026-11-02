import api, { apiUrl } from './lib/axios'
import type {
  IProductImage,
  Product,
  ProductPayload,
  ProductVariant,
  ProductVariantPayload,
  Review,
  ReviewPayload,
} from '@/types/product'

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function resolveProductImageUrl(url?: string | null): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  if (url.startsWith('/uploads/')) {
    return `${apiUrl}${url}`
  }
  return url
}

export function dataUrlToFile(dataUrl: string, filename = 'upload.png'): File | null {
  try {
    const arr = dataUrl.split(',')
    if (arr.length < 2) return null
    const mimeMatch = arr[0].match(/:(.*?);/)
    const mime = mimeMatch ? mimeMatch[1] : 'image/png'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    const ext = mime.split('/')[1] || 'png'
    return new File([u8arr], `${filename.replace(/\.[^.]+$/, '')}.${ext}`, { type: mime })
  } catch {
    return null
  }
}

export const getProducts = async (search?: string, categoryId?: number): Promise<{ data: Product[] }> => {
  const res = (await api.get('/product', {
    params: { q: search || undefined, categoryId, limit: 100 },
  })) as unknown as { data?: Product[] }
  return { data: res?.data || [] }
}

export const getProductById = async (id: number | string): Promise<Product | null> => {
  const res = (await api.get(`/product/${id}`)) as unknown as { data?: Product }
  return res?.data || null
}

export const createProduct = async (request: ProductPayload): Promise<Product> => {
  const payload = {
    ...request,
    slug: request.slug?.trim() || toSlug(request.name),
  }
  const res = (await api.post('/product', payload)) as unknown as { data: Product }
  return res.data
}

export const updateProduct = async (
  id: number | string,
  request: Partial<ProductPayload>,
): Promise<Product> => {
  const res = (await api.put(`/product/${id}`, request)) as unknown as { data: Product }
  return res.data
}

export const deleteProduct = async (id?: number | string) => {
  return await api.delete(`/product/${id}`)
}

export const getProductVariants = async (
  productId: number | string,
): Promise<ProductVariant[]> => {
  const res = (await api.get(`/product/${productId}/variants`)) as unknown as {
    data?: { variants?: ProductVariant[] } | ProductVariant[]
  }
  const raw = res?.data
  return Array.isArray(raw) ? raw : raw?.variants || []
}

export const createProductVariant = async (
  productId: number | string,
  request: ProductVariantPayload,
): Promise<ProductVariant> => {
  const res = (await api.post(`/product/${productId}/variants`, request)) as unknown as {
    data: ProductVariant
  }
  return res.data
}

export const updateProductVariant = async (
  productId: number | string,
  id: number | string,
  request: Partial<ProductVariantPayload>,
): Promise<ProductVariant> => {
  const res = (await api.put(
    `/product/${productId}/variants/${id}`,
    request,
  )) as unknown as { data: ProductVariant }
  return res.data
}

export const deleteProductVariant = async (
  productId: number | string,
  id: number | string,
) => {
  return await api.delete(`/product/${productId}/variants/${id}`)
}

export const getProductImages = async (
  productId: number | string,
): Promise<IProductImage[]> => {
  const res = (await api.get(`/product/${productId}/images`)) as unknown as {
    data?: { images?: IProductImage[] } | IProductImage[]
  }
  const raw = res?.data
  const list = Array.isArray(raw) ? raw : raw?.images || []
  return list.map((img) => ({
    ...img,
    url: resolveProductImageUrl(img.url),
  }))
}

export const uploadProductImage = async (
  productId: number | string,
  payload: { file?: File; dataUrl?: string; is_primary?: boolean },
): Promise<IProductImage> => {
  const formData = new FormData()
  const file =
    payload.file ||
    (payload.dataUrl ? dataUrlToFile(payload.dataUrl, `product-${productId}`) : null)
  if (file) {
    formData.append('image', file)
  }
  if (payload.is_primary !== undefined) {
    formData.append('is_primary', String(payload.is_primary))
  }
  const res = (await api.post(`/product/${productId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })) as unknown as { data: IProductImage }
  return {
    ...res.data,
    url: resolveProductImageUrl(res.data.url),
  }
}

export const updateProductImage = async (
  productId: number | string,
  id: number | string,
  payload: { file?: File; dataUrl?: string; is_primary?: boolean },
): Promise<IProductImage> => {
  const formData = new FormData()
  const file =
    payload.file ||
    (payload.dataUrl ? dataUrlToFile(payload.dataUrl, `product-${productId}-${id}`) : null)
  if (file) {
    formData.append('image', file)
  }
  if (payload.is_primary !== undefined) {
    formData.append('is_primary', String(payload.is_primary))
  }
  const res = (await api.put(`/product/${productId}/images/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })) as unknown as { data: IProductImage }
  return {
    ...res.data,
    url: resolveProductImageUrl(res.data.url),
  }
}

export const deleteProductImage = async (
  productId: number | string,
  id: number | string,
) => {
  return await api.delete(`/product/${productId}/images/${id}`)
}

export const getProductReviews = async (
  productId: number | string,
): Promise<{
  reviews: Review[]
  average_rating: number
  total_reviews: number
}> => {
  const res = (await api.get(`/product/${productId}/reviews`, {
    params: { limit: 100 },
  })) as unknown as {
    data?: {
      reviews?: Review[]
      average_rating?: number
      total_reviews?: number
    } | Review[]
    average_rating?: number
    total_reviews?: number
  }
  const raw = res?.data
  if (Array.isArray(raw)) {
    return {
      reviews: raw,
      average_rating: Number(res?.average_rating ?? 0),
      total_reviews: Number(res?.total_reviews ?? raw.length),
    }
  }
  return {
    reviews: raw?.reviews || [],
    average_rating: Number(raw?.average_rating ?? res?.average_rating ?? 0),
    total_reviews: Number(raw?.total_reviews ?? res?.total_reviews ?? 0),
  }
}

export const createProductReview = async (
  productId: number | string,
  request: ReviewPayload,
): Promise<Review> => {
  const res = (await api.post(`/product/${productId}/reviews`, request)) as unknown as {
    data: Review
  }
  return res.data
}

export const updateProductReview = async (
  productId: number | string,
  id: number | string,
  request: Partial<ReviewPayload>,
): Promise<Review> => {
  const res = (await api.put(
    `/product/${productId}/reviews/${id}`,
    request,
  )) as unknown as { data: Review }
  return res.data
}

export const deleteProductReview = async (
  productId: number | string,
  id: number | string,
) => {
  return await api.delete(`/product/${productId}/reviews/${id}`)
}
