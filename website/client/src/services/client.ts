import api, {
  API_BASE_URL,
  apiUrl,
  extractErrorMessage,
  resolveImageUrl,
} from './lib/axios'
import type {
  Address,
  AddressFormPayload,
  AddressQueryParams,
} from '@/types/address'
import type {
  AuthGoogleLoginPayload,
  AuthLoginPayload,
  AuthLoginResponse,
  AuthRegisterPayload,
  AuthUser,
  PaginationMeta,
  ProfileInputPayload,
  UserProfileData,
  UserProfileForm,
} from '@/types/auth'
import type { AddCartItemPayload, Cart, UpdateCartItemPayload } from '@/types/cart'
import type {
  Category,
  CategoryDetail,
  CategoryQueryParams,
} from '@/types/category'
import type {
  Order,
  OrderCheckoutPayload,
  OrderQueryParams,
} from '@/types/order'
import type {
  PaymentQueryParams,
  PaymentRecord,
  PaywayCheckoutPayload,
  PaywayCheckoutResponse,
  PaywayPaymentOption,
} from '@/types/payment'
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

export { API_BASE_URL, apiUrl, extractErrorMessage, resolveImageUrl }

const ALLOWED_PAYWAY_OPTIONS: readonly PaywayPaymentOption[] = [
  'abapay_khqr',
  'abapay_khqr_deeplink',
  'cards',
  'alipay',
  'wechat',
]

export function normalizePaywayOption(option?: string | null): PaywayPaymentOption {
  const cleaned = String(option || 'abapay_khqr').trim().toLowerCase()
  if (cleaned === 'paypal') return 'cards'
  if ((ALLOWED_PAYWAY_OPTIONS as readonly string[]).includes(cleaned)) {
    return cleaned as PaywayPaymentOption
  }
  return 'abapay_khqr'
}

export function sanitizePhoneForApi(phone?: string | null): string {
  if (!phone) return ''
  const trimmed = String(phone).trim()
  if (trimmed.includes('@')) return ''
  const digitsOnly = trimmed.replace(/[\s()\-.]/g, '')
  if (/^\+?[0-9]{6,15}$/.test(digitsOnly)) {
    return digitsOnly
  }
  return ''
}

export function sanitizeProfilePayload(
  data: Partial<UserProfileForm | ProfileInputPayload>,
): ProfileInputPayload {
  const payload: ProfileInputPayload = {}
  if (data.firstName !== undefined) payload.firstName = String(data.firstName).trim()
  if (data.lastName !== undefined) payload.lastName = String(data.lastName).trim()
  if (data.avatar !== undefined) {
    const trimmed = data.avatar ? String(data.avatar).trim() : ''
    if (trimmed.startsWith('blob:') || (trimmed.includes('@') && !trimmed.includes('/'))) {
      payload.avatar = null
    } else {
      payload.avatar = trimmed || null
    }
  }
  if (data.bio !== undefined) {
    payload.bio = data.bio !== null ? String(data.bio).trim() : null
  }
  if (data.phone !== undefined) {
    const cleaned = sanitizePhoneForApi(data.phone)
    payload.phone = cleaned || null
  }
  if (data.date_of_birth !== undefined) {
    const trimmedDob = data.date_of_birth ? String(data.date_of_birth).trim() : ''
    payload.date_of_birth = trimmedDob || null
  }
  return payload
}

export function sanitizeAddressPayload(data: AddressFormPayload): AddressFormPayload {
  return {
    receiver_name: String(data.receiver_name || '').trim(),
    phone: sanitizePhoneForApi(data.phone),
    street: String(data.street || '').trim(),
    city: String(data.city || '').trim(),
    status: Boolean(data.status),
  }
}

function capQueryLimit<T extends { limit?: number }>(params?: T): T | undefined {
  if (!params) return undefined
  if (params.limit !== undefined && Number(params.limit) > 100) {
    return { ...params, limit: 100 }
  }
  return params
}

// ==================== HEALTH ====================
export const healthApi = {
  check: () => api.get<{ message?: string }>('/testing'),
}

// ==================== USER AUTH ====================
export const authApi = {
  register: (data: AuthRegisterPayload) =>
    api.post<{ message: string; data?: AuthUser }>('/auth/user/register', {
      firstName: data.firstName?.trim(),
      lastName: data.lastName?.trim(),
      email: data.email.trim(),
      password: data.password,
      ...(data.status !== undefined ? { status: data.status } : {}),
    }),
  login: (data: AuthLoginPayload) =>
    api.post<AuthLoginResponse>('/auth/user/login', {
      email: data.email.trim(),
      password: data.password,
    }),
  googleConfig: () => api.get<{ clientId: string }>('/auth/google/config'),
  googleLogin: (data: AuthGoogleLoginPayload) =>
    api.post<AuthLoginResponse>('/auth/user/google', data),
  me: () => api.get<{ message: string; data: AuthUser }>('/auth/me'),
}

// ==================== USER PROFILE ====================
export const profileApi = {
  getMine: () => api.get<{ message: string; data: UserProfileData }>('/auth/profile'),
  create: (data: Partial<UserProfileForm | ProfileInputPayload>) =>
    api.post<{ message: string; data: UserProfileData }>(
      '/auth/profile',
      sanitizeProfilePayload(data),
    ),
  update: (data: Partial<UserProfileForm | ProfileInputPayload>) =>
    api.put<{ message: string; data: UserProfileData }>(
      '/auth/profile',
      sanitizeProfilePayload(data),
    ),
  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post<{ message: string; data: { url: string } }>(
      '/auth/profile/avatar',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    )
  },
}

// ==================== CATEGORY (PUBLIC) ====================
export const categoryApi = {
  list: (params?: CategoryQueryParams & Record<string, unknown>) =>
    api.get<{ message: string; data: Category[]; pagination?: PaginationMeta }>('/category', {
      params: capQueryLimit(params),
    }),
  getById: (id: number | string) =>
    api.get<{ message: string; data: CategoryDetail<Product> }>(`/category/${id}`),
}

// ==================== PRODUCT, IMAGES, VARIANTS & REVIEWS ====================
export const productApi = {
  list: (params?: ProductQueryParams & Record<string, unknown>) =>
    api.get<{ message: string; data: Product[]; pagination?: PaginationMeta }>('/product', {
      params: capQueryLimit(params),
    }),
  getById: (id: number | string) =>
    api.get<{ message: string; data: Product }>(`/product/${id}`),
  getBySlug: async (slug: string) => {
    const listRes = await api.get<{ message: string; data: Product[] }>('/product', {
      params: { page: 1, limit: 100 },
    })
    const matched = (listRes.data?.data || []).find(
      (p) => String(p.slug || '').toLowerCase() === String(slug || '').toLowerCase(),
    )
    return {
      ...listRes,
      data: {
        message: matched ? 'Get product successfully' : 'Product not found',
        data: matched || null,
      },
    }
  },
  getImages: (productId: number | string) =>
    api.get<{
      message: string
      data: { id: number; name: string; slug: string; images: ProductImage[] }
    }>(`/product/${productId}/images`),
  getImageById: (productId: number | string, id: number | string) =>
    api.get<{ message: string; data: ProductImageDetail }>(`/product/${productId}/images/${id}`),
  getVariants: (productId: number | string) =>
    api.get<{
      message: string
      data: {
        id: number
        name: string
        slug: string
        base_price: string
        variants: ProductVariant[]
      }
    }>(`/product/${productId}/variants`),
  getVariantById: (productId: number | string, id: number | string) =>
    api.get<{ message: string; data: ProductVariantDetail }>(
      `/product/${productId}/variants/${id}`,
    ),
  getReviews: (productId: number | string, params?: ReviewQueryParams & Record<string, unknown>) =>
    api.get<{
      message: string
      data: {
        product: { id: number; name: string; slug: string }
        average_rating: number
        total_reviews: number
        breakdown: ProductReviewsBreakdown
        reviews: ProductReview[]
      }
      pagination?: PaginationMeta
    }>(`/product/${productId}/reviews`, {
      params: capQueryLimit(params),
    }),
  getReviewById: (productId: number | string, reviewId: number | string) =>
    api.get<{ message: string; data: ProductReview }>(`/product/${productId}/reviews/${reviewId}`),
  createReview: (productId: number | string, data: ReviewFormPayload) =>
    api.post<{ message: string; data: ProductReview }>(`/product/${productId}/reviews`, {
      rating: Number(data.rating),
      comment: data.comment !== undefined && data.comment !== null ? String(data.comment).trim() : null,
    }),
  updateReview: (
    productId: number | string,
    reviewId: number | string,
    data: Partial<ReviewFormPayload>,
  ) =>
    api.put<{ message: string; data: ProductReview }>(
      `/product/${productId}/reviews/${reviewId}`,
      {
        ...(data.rating !== undefined ? { rating: Number(data.rating) } : {}),
        ...(data.comment !== undefined
          ? { comment: data.comment !== null ? String(data.comment).trim() : null }
          : {}),
      },
    ),
  deleteReview: (productId: number | string, reviewId: number | string) =>
    api.delete<{ message: string }>(`/product/${productId}/reviews/${reviewId}`),
}

// ==================== CART ====================
export const cartApi = {
  getCart: () => api.get<{ message: string; data: Cart }>('/cart'),
  addItem: (data: AddCartItemPayload) =>
    api.post<{ message: string; data: Cart }>('/cart/items', {
      variantId: Number(data.variantId),
      quantity: Math.max(1, Math.floor(Number(data.quantity ?? 1))),
    }),
  updateItem: (itemId: number | string, data: UpdateCartItemPayload) =>
    api.put<{ message: string; data: Cart }>(`/cart/items/${itemId}`, {
      quantity: Math.max(1, Math.floor(Number(data.quantity))),
    }),
  removeItem: (itemId: number | string) =>
    api.delete<{ message: string; data: Cart }>(`/cart/items/${itemId}`),
  clearCart: () => api.delete<{ message: string; data: Cart }>('/cart'),
}

// ==================== ADDRESS ====================
export const addressApi = {
  list: (params?: AddressQueryParams & Record<string, unknown>) =>
    api.get<{ message: string; data: Address[]; pagination?: PaginationMeta }>('/address', {
      params: capQueryLimit(params),
    }),
  getDefault: () => api.get<{ message: string; data: Address }>('/address/default'),
  getOne: (id: number | string) =>
    api.get<{ message: string; data: Address }>(`/address/${id}`),
  create: (data: AddressFormPayload) =>
    api.post<{ message: string; data: Address }>('/address', sanitizeAddressPayload(data)),
  update: (id: number | string, data: AddressFormPayload) =>
    api.put<{ message: string; data: Address }>(`/address/${id}`, sanitizeAddressPayload(data)),
  setDefault: (id: number | string) =>
    api.patch<{ message: string; data: Address }>(`/address/${id}/default`),
  remove: (id: number | string) => api.delete<{ message: string }>(`/address/${id}`),
}

// ==================== ORDER (CUSTOMER OWN ORDERS) ====================
export const orderApi = {
  checkout: (data?: OrderCheckoutPayload) =>
    api.post<{ message: string; data: Order }>('/order', {
      ...(data?.addressId !== undefined && data.addressId !== null && data.addressId !== ''
        ? { addressId: Number(data.addressId) }
        : {}),
      ...(data?.sub_total !== undefined ? { sub_total: Number(data.sub_total) } : {}),
      ...(data?.discount !== undefined ? { discount: Number(data.discount) } : {}),
      ...(data?.shipping_fee !== undefined ? { shipping_fee: Number(data.shipping_fee) } : {}),
      ...(Array.isArray(data?.items) && data.items.length > 0 ? { items: data.items } : {}),
    }),
  listMine: (params?: OrderQueryParams & Record<string, unknown>) =>
    api.get<{ message: string; data: Order[]; pagination?: PaginationMeta }>('/order', {
      params: capQueryLimit(params),
    }),
  getMine: (id: number | string) =>
    api.get<{ message: string; data: Order }>(`/order/${id}`),
  cancelMine: (id: number | string) =>
    api.patch<{ message: string; data: Order }>(`/order/${id}/cancel`),
  downloadInvoice: (id: number | string) =>
    api.get<Blob>(`/order/${id}/invoice`, { responseType: 'blob' }),
}

// ==================== PAYMENT (CUSTOMER OWN PAYMENTS) ====================
export const paymentApi = {
  checkout: (data: PaywayCheckoutPayload) =>
    api.post<{ message: string; data: PaywayCheckoutResponse }>('/payment/checkout', {
      orderId: Number(data.orderId),
      payment_option: normalizePaywayOption(data.payment_option),
    }),
  verify: (tranId: string) =>
    api.get<{ message: string; data: PaymentRecord }>(
      `/payment/verify/${encodeURIComponent(tranId)}`,
    ),
  listMine: (params?: PaymentQueryParams & Record<string, unknown>) =>
    api.get<{ message: string; data: PaymentRecord[]; pagination?: PaginationMeta }>('/payment', {
      params: capQueryLimit(params),
    }),
}

export default api

