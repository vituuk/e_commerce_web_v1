import api from './lib/axios'
import type { Order, OrderStatus } from '@/types/order'
import type { CartEntity, CartItemPayload } from '@/types/cart'

export const getAdminOrders = async (params?: {
  status?: string
  q?: string
  userId?: number
  from?: string
  to?: string
  page?: number
  limit?: number
}): Promise<{ data: Order[] }> => {
  const res = (await api.get('/order/admin', {
    params: { limit: 100, ...params },
  })) as unknown as { data?: Order[] }
  return { data: res?.data || [] }
}

export const getAdminOrderById = async (id: number | string): Promise<Order | null> => {
  const res = (await api.get(`/order/admin/${id}`)) as unknown as { data?: Order }
  return res?.data || null
}

export const updateAdminOrderStatus = async (
  id: number | string,
  status: OrderStatus | string,
): Promise<Order> => {
  const res = (await api.patch(`/order/admin/${id}/status`, { status })) as unknown as {
    data: Order
  }
  return res.data
}

export const checkoutOrder = async (payload?: { addressId?: number }): Promise<Order> => {
  const res = (await api.post('/order', payload || {})) as unknown as { data: Order }
  return res.data
}

export const getUserOrders = async (params?: {
  status?: string
  q?: string
  page?: number
  limit?: number
}): Promise<{ data: Order[] }> => {
  const res = (await api.get('/order', {
    params: { limit: 100, ...params },
  })) as unknown as { data?: Order[] }
  return { data: res?.data || [] }
}

export const cancelUserOrder = async (id: number | string): Promise<Order> => {
  const res = (await api.patch(`/order/${id}/cancel`)) as unknown as { data: Order }
  return res.data
}

export const downloadOrderInvoice = async (id: number | string): Promise<void> => {
  const blob = (await api.get(`/order/${id}/invoice`, {
    responseType: 'blob',
  })) as unknown as Blob

  const url = window.URL.createObjectURL(new Blob([blob]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `invoice-order-${id}.docx`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export const getCart = async (): Promise<CartEntity | null> => {
  const res = (await api.get('/cart')) as unknown as { data?: CartEntity }
  return res?.data || null
}

export const clearCart = async (): Promise<CartEntity | null> => {
  const res = (await api.delete('/cart')) as unknown as { data?: CartEntity }
  return res?.data || null
}

export const addCartItem = async (payload: CartItemPayload): Promise<CartEntity | null> => {
  const res = (await api.post('/cart/items', payload)) as unknown as { data?: CartEntity }
  return res?.data || null
}

export const updateCartItem = async (
  itemId: number | string,
  quantity: number,
): Promise<CartEntity | null> => {
  const res = (await api.put(`/cart/items/${itemId}`, { quantity })) as unknown as {
    data?: CartEntity
  }
  return res?.data || null
}

export const removeCartItem = async (itemId: number | string): Promise<CartEntity | null> => {
  const res = (await api.delete(`/cart/items/${itemId}`)) as unknown as { data?: CartEntity }
  return res?.data || null
}

