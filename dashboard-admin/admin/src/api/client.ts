import axios, { type AxiosRequestConfig } from 'axios'
import {
  getAccessToken,
  getUserFromToken,
  isAdminRole,
  removeAccessToken,
  setAccessToken,
} from '@/utils/tokenStorage'

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ||
  'http://localhost:3000'

export const TOKEN_STORAGE_KEY = 'commerceos_admin_token'
export const USER_STORAGE_KEY = 'commerceos_admin_user'

export interface AuthUser {
  id: number
  email: string
  fullName?: string
  firstName?: string
  lastName?: string
  roles: string[]
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if ((config.method || 'get').toLowerCase() === 'get') {
    config.params = { ...(config.params || {}), _t: Date.now() }
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url = String(error?.config?.url || '')
    if (status === 401 && !url.includes('/auth/admin/login')) {
      removeAccessToken()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('commerceos-auth-change'))
      }
    }
    return Promise.reject(error)
  },
)

export function getStoredToken(): string | null {
  return getAccessToken()
}

export function setStoredToken(token: string | null) {
  if (token) {
    setAccessToken(token, 2)
  } else {
    removeAccessToken()
  }
}

export function getStoredUser(): AuthUser | null {
  return getUserFromToken()
}

export function setStoredUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return
  if (user && isAdminRole(user.roles)) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  } else {
    removeAccessToken()
  }
}

export function resolveImageUrl(url?: string | null): string {
  if (!url) return ''
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url
  }
  if (url.startsWith('/uploads')) {
    return `${API_BASE_URL}${url}`
  }
  return url
}

export function extractErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message
    if (typeof msg === 'string' && msg.trim()) return msg
    if (typeof error.message === 'string' && error.message.trim()) return error.message
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

// Convert base64 data URL (from CrudDialog file input) into a File object for multipart/form-data
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
    const finalName = filename.includes('.') ? filename : `${filename}.${ext}`
    return new File([u8arr], finalName, { type: mime })
  } catch {
    return null
  }
}

// ==================== 1. AUTH & USERS (/auth) ====================
export const authApi = {
  async loginAdmin(payload: { email: string; password: string }) {
    const res = await apiClient.post('/auth/admin/login', payload)
    const roles: string[] = Array.isArray(res.data?.roles) ? res.data.roles : []
    if (!isAdminRole(roles)) {
      removeAccessToken()
      throw new Error('Access denied: Only admin or superadmin accounts can sign in here.')
    }
    const token: string | undefined = res.data?.token
    if (token) setStoredToken(token)
    const meRes = await apiClient.get('/auth/me').catch(() => null)
    const user: AuthUser = meRes?.data?.data || {
      id: 1,
      email: payload.email,
      fullName: payload.email.split('@')[0],
      roles,
    }
    if (!isAdminRole(user.roles)) {
      removeAccessToken()
      throw new Error('Access denied: Only admin or superadmin accounts can sign in here.')
    }
    setStoredUser(user)
    return { token, roles, user }
  },

  async registerUser(payload: {
    firstName: string
    lastName: string
    email: string
    password: string
    status?: boolean
  }) {
    const res = await apiClient.post('/auth/user/register', payload)
    return res.data
  },

  async registerAdmin(payload: {
    firstName: string
    lastName: string
    email: string
    password: string
    status?: boolean
    roles?: string[]
  }) {
    const res = await apiClient.post('/auth/admin/register', payload)
    return res.data
  },

  async updateUser(
    id: number | string,
    payload: {
      firstName?: string
      lastName?: string
      email?: string
      password?: string
      status?: boolean
    },
  ) {
    const res = await apiClient.put(`/auth/users/${id}`, payload)
    return res.data?.data
  },

  async removeUser(id: number | string) {
    const res = await apiClient.delete(`/auth/users/${id}`)
    return res.data
  },

  async me() {
    const res = await apiClient.get('/auth/me')
    const user = res.data?.data as AuthUser | undefined
    if (user && !isAdminRole(user.roles)) {
      removeAccessToken()
      throw new Error('Access denied: Account is not admin or superadmin.')
    }
    if (user) {
      setStoredUser(user)
    }
    return user as AuthUser
  },

  async listUsers() {
    const res = await apiClient.get('/auth/getData')
    return Array.isArray(res.data?.data) ? res.data.data : []
  },

  async getMyProfile() {
    const res = await apiClient.get('/auth/profile')
    return res.data?.data
  },

  async createMyProfile(payload: {
    firstName?: string
    lastName?: string
    avatar?: string
    bio?: string
    phone?: string
    date_of_birth?: string
  }) {
    const res = await apiClient.post('/auth/profile', payload)
    return res.data?.data
  },

  async updateMyProfile(payload: {
    firstName?: string
    lastName?: string
    avatar?: string
    bio?: string
    phone?: string
    date_of_birth?: string
  }) {
    const res = await apiClient.put('/auth/profile', payload)
    return res.data?.data
  },

  async saveMyProfile(
    payload: {
      firstName?: string
      lastName?: string
      avatar?: string
      bio?: string
      phone?: string
      date_of_birth?: string
    },
    hasExistingProfile?: boolean,
  ) {
    try {
      if (hasExistingProfile === false) {
        const res = await apiClient.post('/auth/profile', payload)
        return res.data?.data
      }
      const res = await apiClient.put('/auth/profile', payload)
      return res.data?.data
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          const res = await apiClient.post('/auth/profile', payload)
          return res.data?.data
        }
        if (err.response?.status === 409) {
          const res = await apiClient.put('/auth/profile', payload)
          return res.data?.data
        }
      }
      throw err
    }
  },

  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('image', file)
    const config: AxiosRequestConfig = {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
    const res = await apiClient.post('/auth/profile/avatar', formData, config)
    return res.data?.data?.url || ''
  },

  async getUserProfileById(userId: number | string) {
    const res = await apiClient.get(`/auth/profile/${userId}`)
    return res.data?.data
  },

  async createUserProfileById(
    userId: number | string,
    payload: {
      firstName?: string
      lastName?: string
      avatar?: string
      bio?: string
      phone?: string
      date_of_birth?: string
    },
  ) {
    const res = await apiClient.post(`/auth/profile/${userId}`, payload)
    return res.data?.data
  },

  async updateUserProfileById(
    userId: number | string,
    payload: {
      firstName?: string
      lastName?: string
      avatar?: string
      bio?: string
      phone?: string
      date_of_birth?: string
    },
  ) {
    const res = await apiClient.put(`/auth/profile/${userId}`, payload)
    return res.data?.data
  },

  async removeUserProfileById(userId: number | string) {
    const res = await apiClient.delete(`/auth/profile/${userId}`)
    return res.data
  },

  logout() {
    setStoredToken(null)
    setStoredUser(null)
  },
}

// ==================== 2. ROLES (/role) & USER ROLES (/user-role) ====================
export const roleApi = {
  async list(params?: { q?: string; status?: boolean; page?: number; limit?: number }) {
    const res = await apiClient.get('/role', { params: { limit: 100, ...params } })
    return {
      data: Array.isArray(res.data?.data) ? res.data.data : [],
      pagination: res.data?.pagination,
    }
  },
  async getById(id: number | string) {
    const res = await apiClient.get(`/role/${id}`)
    return res.data?.data
  },
  async create(payload: { name: string; code: string; status?: boolean }) {
    const res = await apiClient.post('/role', payload)
    return res.data?.data
  },
  async update(id: number | string, payload: { name?: string; code?: string; status?: boolean }) {
    const res = await apiClient.put(`/role/${id}`, payload)
    return res.data?.data
  },
  async remove(id: number | string) {
    const res = await apiClient.delete(`/role/${id}`)
    return res.data
  },
}

export const userRoleApi = {
  async getUserRoles(userId: number | string) {
    const res = await apiClient.get(`/user-role/${userId}`)
    return res.data?.data
  },
  async addRoles(userId: number | string, roles: string[]) {
    const res = await apiClient.post(`/user-role/${userId}`, { roles })
    return res.data?.data
  },
  async setRoles(userId: number | string, roles: string[]) {
    const res = await apiClient.put(`/user-role/${userId}`, { roles })
    return res.data?.data
  },
  async removeRole(userId: number | string, code: string) {
    const res = await apiClient.delete(`/user-role/${userId}/${code}`)
    return res.data?.data
  },
}

// ==================== 3. CATEGORIES (/category) ====================
export const categoryApi = {
  async list(params?: { q?: string; is_active?: boolean; page?: number; limit?: number }) {
    const res = await apiClient.get('/category', { params: { limit: 100, ...params } })
    return {
      data: Array.isArray(res.data?.data) ? res.data.data : [],
      pagination: res.data?.pagination,
    }
  },
  async getById(id: number | string) {
    const res = await apiClient.get(`/category/${id}`)
    return res.data?.data
  },
  async create(payload: { name: string; slug: string; is_active?: boolean }) {
    const res = await apiClient.post('/category', payload)
    return res.data?.data
  },
  async update(
    id: number | string,
    payload: { name?: string; slug?: string; is_active?: boolean },
  ) {
    const res = await apiClient.put(`/category/${id}`, payload)
    return res.data?.data
  },
  async remove(id: number | string) {
    const res = await apiClient.delete(`/category/${id}`)
    return res.data
  },
}

// ==================== 4. PRODUCTS (/product) ====================
export const productApi = {
  async list(params?: {
    categoryId?: number | string
    q?: string
    is_active?: boolean
    page?: number
    limit?: number
  }) {
    const res = await apiClient.get('/product', { params: { limit: 100, ...params } })
    return {
      data: Array.isArray(res.data?.data) ? res.data.data : [],
      pagination: res.data?.pagination,
    }
  },
  async getById(id: number | string) {
    const res = await apiClient.get(`/product/${id}`)
    return res.data?.data
  },
  async create(payload: {
    categoryId?: number | null
    name: string
    slug: string
    description?: string
    base_price?: number
    is_active?: boolean
  }) {
    const res = await apiClient.post('/product', payload)
    return res.data?.data
  },
  async update(
    id: number | string,
    payload: {
      categoryId?: number | null
      name?: string
      slug?: string
      description?: string
      base_price?: number
      is_active?: boolean
    },
  ) {
    const res = await apiClient.put(`/product/${id}`, payload)
    return res.data?.data
  },
  async remove(id: number | string) {
    const res = await apiClient.delete(`/product/${id}`)
    return res.data
  },
}

// ==================== 5. PRODUCT VARIANTS (/product/:productId/variants) ====================
export const variantApi = {
  async listByProduct(productId: number | string) {
    const res = await apiClient.get(`/product/${productId}/variants`)
    return res.data?.data
  },
  async getOne(productId: number | string, id: number | string) {
    const res = await apiClient.get(`/product/${productId}/variants/${id}`)
    return res.data?.data
  },
  async create(
    productId: number | string,
    payload: {
      sku: string
      color?: string | null
      size?: string | null
      price?: number | null
      stock_qty?: number
      is_active?: boolean
    },
  ) {
    const res = await apiClient.post(`/product/${productId}/variants`, payload)
    return res.data?.data
  },
  async update(
    productId: number | string,
    id: number | string,
    payload: {
      sku?: string
      color?: string | null
      size?: string | null
      price?: number | null
      stock_qty?: number
      is_active?: boolean
    },
  ) {
    const res = await apiClient.put(`/product/${productId}/variants/${id}`, payload)
    return res.data?.data
  },
  async remove(productId: number | string, id: number | string) {
    const res = await apiClient.delete(`/product/${productId}/variants/${id}`)
    return res.data
  },
}

// ==================== 6. PRODUCT IMAGES (/product/:productId/images) ====================
export const productImageApi = {
  async listByProduct(productId: number | string) {
    const res = await apiClient.get(`/product/${productId}/images`)
    return res.data?.data
  },
  async getOne(productId: number | string, id: number | string) {
    const res = await apiClient.get(`/product/${productId}/images/${id}`)
    return res.data?.data
  },
  async create(
    productId: number | string,
    payload: { image?: File; url?: string; is_primary?: boolean },
  ) {
    const formData = new FormData()
    if (payload.image) {
      formData.append('image', payload.image)
    }
    if (payload.url) {
      formData.append('url', payload.url)
    }
    if (payload.is_primary !== undefined) {
      formData.append('is_primary', String(payload.is_primary))
    }
    const config: AxiosRequestConfig = {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
    const res = await apiClient.post(`/product/${productId}/images`, formData, config)
    return res.data?.data
  },
  async update(
    productId: number | string,
    id: number | string,
    payload: { productId?: number | string; image?: File; url?: string; is_primary?: boolean },
  ) {
    const formData = new FormData()
    if (payload.productId !== undefined && payload.productId !== '') {
      formData.append('productId', String(payload.productId))
    }
    if (payload.image) {
      formData.append('image', payload.image)
    }
    if (payload.url) {
      formData.append('url', payload.url)
    }
    if (payload.is_primary !== undefined) {
      formData.append('is_primary', String(payload.is_primary))
    }
    const config: AxiosRequestConfig = {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
    const res = await apiClient.put(`/product/${productId}/images/${id}`, formData, config)
    return res.data?.data
  },
  async remove(productId: number | string, id: number | string) {
    const res = await apiClient.delete(`/product/${productId}/images/${id}`)
    return res.data
  },
}

// ==================== 7. REVIEWS (/product/:productId/reviews) ====================
export const reviewApi = {
  async listByProduct(
    productId: number | string,
    params?: { rating?: number; page?: number; limit?: number },
  ) {
    const res = await apiClient.get(`/product/${productId}/reviews`, {
      params: { limit: 100, ...params },
    })
    return res.data?.data
  },
  async getOne(productId: number | string, id: number | string) {
    const res = await apiClient.get(`/product/${productId}/reviews/${id}`)
    return res.data?.data
  },
  async create(
    productId: number | string,
    payload: { rating: number; comment?: string; userId?: number },
  ) {
    const res = await apiClient.post(`/product/${productId}/reviews`, payload)
    return res.data?.data
  },
  async update(
    productId: number | string,
    id: number | string,
    payload: { rating?: number; comment?: string },
  ) {
    const res = await apiClient.put(`/product/${productId}/reviews/${id}`, payload)
    return res.data?.data
  },
  async remove(productId: number | string, id: number | string) {
    const res = await apiClient.delete(`/product/${productId}/reviews/${id}`)
    return res.data
  },
}

// ==================== 8. CART (/cart) ====================
export const cartApi = {
  async getCart() {
    const res = await apiClient.get('/cart')
    return res.data?.data
  },
  async listAll() {
    const res = await apiClient.get('/cart/admin')
    return Array.isArray(res.data?.data) ? res.data.data : []
  },
  async createCart(userId?: number | string) {
    const res = await apiClient.post('/cart/admin', userId ? { userId } : {})
    return res.data?.data
  },
  async updateCart(cartId: number | string, payload: { userId?: number | string }) {
    const res = await apiClient.put(`/cart/admin/${cartId}`, payload)
    return res.data?.data
  },
  async deleteCart(cartId: number | string) {
    const res = await apiClient.delete(`/cart/admin/${cartId}`)
    return res.data
  },
  async clearCart() {
    const res = await apiClient.delete('/cart')
    return res.data?.data
  },
  async addItem(payload: { variantId: number; quantity?: number; cartId?: number }) {
    const res = await apiClient.post('/cart/items', payload)
    return res.data?.data
  },
  async updateItem(itemId: number | string, payload: { quantity: number; variantId?: number }) {
    const res = await apiClient.put(`/cart/items/${itemId}`, payload)
    return res.data?.data
  },
  async removeItem(itemId: number | string) {
    const res = await apiClient.delete(`/cart/items/${itemId}`)
    return res.data?.data
  },
}

// ==================== 9. ADDRESSES (/address) ====================
export const addressApi = {
  async list(params?: { city?: string; q?: string; page?: number; limit?: number }) {
    try {
      const res = await apiClient.get('/address/admin', { params: { limit: 100, ...params } })
      return {
        data: Array.isArray(res.data?.data) ? res.data.data : [],
        pagination: res.data?.pagination,
      }
    } catch {
      const res = await apiClient.get('/address', { params: { limit: 100, ...params } })
      return {
        data: Array.isArray(res.data?.data) ? res.data.data : [],
        pagination: res.data?.pagination,
      }
    }
  },
  async getDefault() {
    const res = await apiClient.get('/address/default')
    return res.data?.data
  },
  async getOne(id: number | string) {
    const res = await apiClient.get(`/address/${id}`)
    return res.data?.data
  },
  async create(payload: {
    userId?: number
    receiver_name: string
    phone: string
    street: string
    city: string
    status?: boolean
  }) {
    const res = await apiClient.post('/address', payload)
    return res.data?.data
  },
  async update(
    id: number | string,
    payload: {
      receiver_name?: string
      phone?: string
      street?: string
      city?: string
      status?: boolean
    },
  ) {
    const res = await apiClient.put(`/address/${id}`, payload)
    return res.data?.data
  },
  async setDefault(id: number | string) {
    const res = await apiClient.patch(`/address/${id}/default`)
    return res.data?.data
  },
  async remove(id: number | string) {
    const res = await apiClient.delete(`/address/${id}`)
    return res.data
  },
}

// ==================== 10. ORDERS & REPORTS (/order) ====================
export const orderApi = {
  async listAll(params?: {
    status?: string
    q?: string
    userId?: number | string
    from?: string
    to?: string
    page?: number
    limit?: number
  }) {
    const res = await apiClient.get('/order/admin', { params: { limit: 100, ...params } })
    return {
      data: Array.isArray(res.data?.data) ? res.data.data : [],
      pagination: res.data?.pagination,
    }
  },
  async createAdminOrder(payload: {
    userId?: number
    addressId?: number
    order_number?: string
    shipping_street?: string
    shipping_city?: string
    sub_total?: number
    discount?: number
    shipping_fee?: number
    total?: number
    status?: string
  }) {
    const res = await apiClient.post('/order/admin', payload)
    return res.data?.data
  },
  async getAny(id: number | string) {
    const res = await apiClient.get(`/order/admin/${id}`)
    return res.data?.data
  },
  async updateStatus(id: number | string, status: string) {
    const res = await apiClient.patch(`/order/admin/${id}/status`, { status })
    return res.data?.data
  },
  async updateAdminOrder(
    id: number | string,
    payload: {
      addressId?: number | null
      status?: string
      sub_total?: number
      discount?: number
      shipping_fee?: number
      total?: number
      shipping_receiver_name?: string
      shipping_phone?: string
      shipping_street?: string
      shipping_city?: string
    },
  ) {
    const res = await apiClient.put(`/order/admin/${id}`, payload)
    return res.data?.data
  },
  async updateOrderPricing(
    id: number | string,
    payload: {
      sub_total?: number
      discount?: number
      shipping_fee?: number
    },
  ) {
    const res = await apiClient.patch(`/order/admin/${id}/pricing`, payload)
    return res.data?.data
  },
  async removeAdminOrder(id: number | string) {
    const res = await apiClient.delete(`/order/admin/${id}`)
    return res.data
  },
  async createOrderItem(payload: {
    orderId?: number
    variantId?: number
    sku?: string
    product_name?: string
    unit_price?: number
    quantity?: number
    amount?: number
  }) {
    const res = await apiClient.post('/order/admin/items', payload)
    return res.data?.data
  },
  async updateOrderItem(
    id: number | string,
    payload: {
      product_name?: string
      sku?: string
      unit_price?: number
      quantity?: number
      amount?: number
    },
  ) {
    const res = await apiClient.put(`/order/admin/items/${id}`, payload)
    return res.data?.data
  },
  async removeOrderItem(id: number | string) {
    const res = await apiClient.delete(`/order/admin/items/${id}`)
    return res.data
  },
  async getReport(params?: { from?: string; to?: string }) {
    const res = await apiClient.get('/order/admin/report', { params })
    return res.data?.data
  },
  async exportReportExcel(params?: { from?: string; to?: string }) {
    const res = await apiClient.get('/order/admin/report/export', {
      params,
      responseType: 'blob',
    })
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `order-report-${params?.from || 'recent'}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },
  async downloadInvoice(id: number | string) {
    const res = await apiClient.get(`/order/${id}/invoice`, {
      responseType: 'blob',
    })
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-order-${id}.docx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },
  async checkout(payload?: { addressId?: number; discount?: number; shipping_fee?: number }) {
    const res = await apiClient.post('/order', payload || {})
    return res.data?.data
  },
  async listMine(params?: { status?: string; q?: string; page?: number; limit?: number }) {
    const res = await apiClient.get('/order', { params: { limit: 100, ...params } })
    return {
      data: Array.isArray(res.data?.data) ? res.data.data : [],
      pagination: res.data?.pagination,
    }
  },
  async cancelMine(id: number | string) {
    const res = await apiClient.patch(`/order/${id}/cancel`)
    return res.data?.data
  },
}

// ==================== 11. PAYMENTS (/payment) ====================
export const paymentApi = {
  async listAll(params?: {
    status?: string
    method?: string
    orderId?: number | string
    userId?: number | string
    page?: number
    limit?: number
  }) {
    const res = await apiClient.get('/payment/admin', { params: { limit: 100, ...params } })
    return {
      data: Array.isArray(res.data?.data) ? res.data.data : [],
      pagination: res.data?.pagination,
    }
  },
  async createAdminPayment(payload: {
    orderId?: number
    method?: string
    amount?: number
    status?: string
  }) {
    const res = await apiClient.post('/payment/admin', payload)
    return res.data?.data
  },
  async updateAdminPayment(
    id: number | string,
    payload: {
      method?: string
      amount?: number
      status?: string
    },
  ) {
    const res = await apiClient.put(`/payment/admin/${id}`, payload)
    return res.data?.data
  },
  async removeAdminPayment(id: number | string) {
    const res = await apiClient.delete(`/payment/admin/${id}`)
    return res.data
  },
  async listMine(params?: { status?: string; method?: string; orderId?: number | string }) {
    const res = await apiClient.get('/payment', { params: { limit: 100, ...params } })
    return {
      data: Array.isArray(res.data?.data) ? res.data.data : [],
      pagination: res.data?.pagination,
    }
  },
  async checkout(payload: { orderId: number; payment_option?: string }) {
    const res = await apiClient.post('/payment/checkout', payload)
    return res.data?.data
  },
  async verify(tranId: string) {
    const res = await apiClient.get(`/payment/verify/${tranId}`)
    return res.data?.data
  },
}

// ==================== 12. TELEGRAM BOT NOTIFICATIONS (/telegram) ====================
export const telegramApi = {
  async getConfig() {
    const res = await apiClient.get('/telegram/config')
    return res.data?.data as {
      configured: boolean
      hasBotToken: boolean
      hasChatId: boolean
      botTokenMasked: string
      chatId: string | null
    }
  },
  async updateConfig(payload: { botToken?: string; chatId?: string }) {
    const res = await apiClient.post('/telegram/config', payload)
    return res.data?.data
  },
  async sendTest() {
    const res = await apiClient.post('/telegram/test')
    return res.data as { message: string; data?: unknown }
  },
}
