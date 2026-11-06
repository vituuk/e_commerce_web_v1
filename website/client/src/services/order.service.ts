import { orderApi } from './client'
import type {
  Order,
  OrderCheckoutPayload,
  OrderItem,
  OrderQueryParams,
} from '@/types/order'

export function normalizeOrder(raw: Order): Order {
  const status = String(raw.status || 'pending').toLowerCase()
  const derivedPaymentStatus =
    raw.payment_status ||
    (['paid', 'shipped', 'delivered'].includes(status)
      ? 'paid'
      : status === 'cancelled'
      ? 'cancelled'
      : 'pending')

  const subTotal = raw.sub_total ?? raw.subtotal ?? 0
  const discount = raw.discount ?? 0
  const shippingFee = raw.shipping_fee ?? 0

  const items: OrderItem[] = (raw.items || []).map((oi) => {
    const unitPrice = oi.unit_price ?? oi.price ?? 0
    const qty = Number(oi.quantity || 1)
    const lineAmount =
      oi.amount ?? oi.total ?? Number((Number(unitPrice || 0) * qty).toFixed(2))
    return {
      ...oi,
      quantity: qty,
      unit_price: unitPrice,
      price: unitPrice,
      amount: lineAmount,
      total: lineAmount,
    }
  })

  const shippingAddress =
    raw.address ||
    (raw.shipping_street || raw.shipping_city
      ? {
          id: raw.addressId ?? `order-addr-${raw.id}`,
          receiver_name: raw.shipping_receiver_name || 'Customer',
          phone: raw.shipping_phone || '',
          street: raw.shipping_street || '',
          city: raw.shipping_city || '',
          status: true,
        }
      : undefined)

  return {
    ...raw,
    status,
    payment_status: derivedPaymentStatus,
    sub_total: subTotal,
    subtotal: subTotal,
    discount,
    shipping_fee: shippingFee,
    address: shippingAddress,
    items,
  }
}

export const checkoutOrder = async (payload: OrderCheckoutPayload): Promise<Order | null> => {
  const res = await orderApi.checkout(payload)
  return res.data?.data ? normalizeOrder(res.data.data) : null
}

export const getMyOrders = async (
  params: OrderQueryParams & Record<string, unknown> = { limit: 50 },
): Promise<Order[]> => {
  const res = await orderApi.listMine(params)
  return (res.data?.data || []).map(normalizeOrder)
}

export const getMyOrderById = async (id: number | string): Promise<Order | null> => {
  const res = await orderApi.getMine(id)
  return res.data?.data ? normalizeOrder(res.data.data) : null
}

export const cancelMyOrder = async (id: number | string): Promise<Order | null> => {
  const res = await orderApi.cancelMine(id)
  return res.data?.data ? normalizeOrder(res.data.data) : null
}

export const downloadOrderInvoice = async (id: number | string) => {
  return orderApi.downloadInvoice(id)
}

export const triggerOrderInvoiceDownload = async (
  id: number | string,
  orderNumber?: string,
): Promise<void> => {
  const res = await orderApi.downloadInvoice(id)
  const disposition = String(res.headers?.['content-disposition'] || '')
  const match = disposition.match(/filename="?([^"]+)"?/i)
  const fallbackName = `invoice-${orderNumber || id}.docx`
  const filename = match?.[1] || fallbackName

  const blob = new Blob([res.data], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(blobUrl)
}
