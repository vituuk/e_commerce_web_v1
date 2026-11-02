import { productApi, resolveImageUrl } from './client'
import { getCategories } from './category.service'
import type { Category } from '@/types/category'
import type {
  Product,
  ProductImage,
  ProductImageDetail,
  ProductQueryParams,
  ProductReview,
  ProductReviewsBreakdown,
  ProductVariant,
  ProductVariantDetail,
  ReviewFormPayload,
  ReviewQueryParams,
} from '@/types/product'

export const getProducts = async (
  params: ProductQueryParams & Record<string, unknown> = {},
): Promise<Product[]> => {
  const firstRes = await productApi.list({ page: 1, limit: 100, ...params })
  const rows: Product[] = [...(firstRes.data?.data || [])]
  const pagination = firstRes.data?.pagination

  if (!params.page && pagination?.has_next && pagination.total_pages > 1) {
    const maxPages = Math.min(pagination.total_pages, 5)
    for (let page = 2; page <= maxPages; page++) {
      const nextRes = await productApi.list({ ...params, page, limit: 100 })
      rows.push(...(nextRes.data?.data || []))
    }
  }

  return rows.filter((p) => p.is_active !== false)
}

export const getProductById = async (id: number | string): Promise<Product | null> => {
  const res = await productApi.getById(id)
  return res.data?.data || null
}

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  const res = await productApi.getBySlug(slug)
  return res.data?.data || null
}

export const getProductImages = async (productId: number | string): Promise<ProductImage[]> => {
  const res = await productApi.getImages(productId)
  const rawImages = res.data?.data?.images || []
  return [...rawImages]
    .map((img) => {
      const resolved = resolveImageUrl(img.url || img.image_url) || undefined
      return {
        ...img,
        url: resolved ?? img.url,
        image_url: resolved ?? img.image_url,
      }
    })
    .sort((a, b) =>
      a.is_primary === b.is_primary ? Number(a.id) - Number(b.id) : a.is_primary ? -1 : 1,
    )
}

export const getProductImageById = async (
  productId: number | string,
  id: number | string,
): Promise<ProductImageDetail | null> => {
  const res = await productApi.getImageById(productId, id)
  return res.data?.data || null
}

export const getProductVariants = async (
  productId: number | string,
): Promise<ProductVariant[]> => {
  const res = await productApi.getVariants(productId)
  return (res.data?.data?.variants || []).filter((v) => v.is_active !== false)
}

export const getProductVariantById = async (
  productId: number | string,
  id: number | string,
): Promise<ProductVariantDetail | null> => {
  const res = await productApi.getVariantById(productId, id)
  return res.data?.data || null
}

export const getProductReviews = async (
  productId: number | string,
  params: ReviewQueryParams & Record<string, unknown> = { limit: 50 },
): Promise<{
  reviews: ProductReview[]
  average_rating: number
  total_reviews: number
  breakdown?: ProductReviewsBreakdown
}> => {
  const res = await productApi.getReviews(productId, params)
  const revData = res.data?.data
  const reviews = revData?.reviews || []
  return {
    reviews,
    average_rating: Number(revData?.average_rating || 0),
    total_reviews: Number(revData?.total_reviews || reviews.length || 0),
    breakdown: revData?.breakdown,
  }
}

export const getProductReviewById = async (
  productId: number | string,
  reviewId: number | string,
): Promise<ProductReview | null> => {
  const res = await productApi.getReviewById(productId, reviewId)
  return res.data?.data || null
}

export const createProductReview = async (
  productId: number | string,
  payload: ReviewFormPayload,
) => {
  const res = await productApi.createReview(productId, payload)
  return res.data
}

export const updateProductReview = async (
  productId: number | string,
  reviewId: number | string,
  payload: Partial<ReviewFormPayload>,
) => {
  const res = await productApi.updateReview(productId, reviewId, payload)
  return res.data
}

export const deleteProductReview = async (
  productId: number | string,
  reviewId: number | string,
) => {
  const res = await productApi.deleteReview(productId, reviewId)
  return res.data
}

async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize)
    const chunkResults = await Promise.all(chunk.map(mapper))
    results.push(...chunkResults)
  }
  return results
}

export const getEnrichedCatalog = async (): Promise<{
  categories: Category[]
  products: Product[]
}> => {
  const [catRes, prodRes] = await Promise.allSettled([
    getCategories({ limit: 100 }),
    getProducts({ limit: 100 }),
  ])

  if (prodRes.status === 'rejected') {
    throw prodRes.reason
  }

  const catRows = catRes.status === 'fulfilled' ? catRes.value : []
  const prodRows = prodRes.value

  const enriched = await mapInBatches(prodRows, 10, async (prod) => {
    const [imgRes, varRes, revRes] = await Promise.allSettled([
      getProductImages(prod.id),
      getProductVariants(prod.id),
      getProductReviews(prod.id, { limit: 50 }),
    ])

    const imgs = imgRes.status === 'fulfilled' ? imgRes.value : []
    const vars = varRes.status === 'fulfilled' ? varRes.value : []
    const revData =
      revRes.status === 'fulfilled'
        ? revRes.value
        : { reviews: [], average_rating: 0, total_reviews: 0 }

    const primaryImg = imgs.find((i) => i.is_primary) || imgs[0]
    const resolvedFallbackImg = resolveImageUrl(prod.image_url) || undefined

    return {
      ...prod,
      image_url: primaryImg?.url || primaryImg?.image_url || resolvedFallbackImg,
      category:
        prod.category ||
        catRows.find((c) => Number(c.id) === Number(prod.categoryId)) ||
        null,
      images: imgs,
      variants: vars,
      reviewsList: revData.reviews,
      reviewsSummary: {
        average_rating: revData.average_rating,
        total_reviews: revData.total_reviews,
        breakdown: revData.breakdown,
      },
    }
  })

  return {
    categories: catRows,
    products: enriched,
  }
}
