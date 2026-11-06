import type { AddCartItemPayload, Cart, CartItem, UpdateCartItemPayload } from '@/types/cart'

export const EMPTY_CART: Cart = {
  items: [],
  total_qty: 0,
  total_price: 0,
}

const CART_STORAGE_KEY = 'aura_cart_v1'

function normalizeCart(raw?: Cart | null): Cart {
  if (!raw) return EMPTY_CART
  const items: CartItem[] = (raw.items || []).map((item) => {
    const v = item.variant
    const candidatePrice =
      item.unit_price !== undefined && item.unit_price !== null && !isNaN(Number(item.unit_price)) && Number(item.unit_price) > 0
        ? Number(item.unit_price)
        : v && v.price !== null && v.price !== undefined && !isNaN(Number(v.price)) && Number(v.price) > 0
        ? Number(v.price)
        : Number(v?.product?.base_price ?? 0)
    const unitPrice = Number(candidatePrice.toFixed(2))
    const qty = Math.max(1, Math.floor(Number(item.quantity || 1)))
    // Authoritatively recalculate line_total = unitPrice * qty
    const lineTotal = Number((unitPrice * qty).toFixed(2))
    return {
      ...item,
      quantity: qty,
      unit_price: unitPrice,
      line_total: lineTotal,
    }
  })

  const totalQty = items.reduce((sum, i) => sum + Number(i.quantity || 0), 0)
  const totalPrice = Number(
    items.reduce((sum, i) => sum + Number(i.line_total || 0), 0).toFixed(2),
  )

  return {
    id: raw.id || 'local_cart',
    userId: raw.userId,
    items,
    total_qty: totalQty,
    total_price: totalPrice,
  }
}

export function getStoredCart(): Cart {
  if (typeof window === 'undefined') return EMPTY_CART
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return EMPTY_CART
    const parsed = JSON.parse(raw)
    return normalizeCart(parsed)
  } catch {
    return EMPTY_CART
  }
}

export function saveStoredCart(cart: Cart): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  } catch (err) {
    console.error('Failed to save cart to localStorage', err)
  }
}

export const getCart = async (): Promise<Cart> => {
  return getStoredCart()
}

export const addCartItem = async (payload: AddCartItemPayload): Promise<Cart> => {
  const current = getStoredCart()
  const variantId = Number(payload.variantId)
  const addQty = Math.max(1, Math.floor(Number(payload.quantity ?? 1)))

  const existingIndex = current.items.findIndex(
    (item) => Number(item.variantId || item.variant?.id) === variantId,
  )

  const newItems = [...current.items]
  if (existingIndex >= 0) {
    const existing = newItems[existingIndex]
    const updatedQty = existing.quantity + addQty
    const unitPrice = Number(existing.unit_price || existing.variant?.price || existing.variant?.product?.base_price || 0)
    newItems[existingIndex] = {
      ...existing,
      quantity: updatedQty,
      line_total: Number((unitPrice * updatedQty).toFixed(2)),
      variant: payload.variant ? { ...existing.variant, ...payload.variant } : existing.variant,
    }
  } else {
    const v = payload.variant
    const p = payload.product
    const unitPrice = Number(
      v && v.price !== null && v.price !== undefined
        ? v.price
        : p?.base_price ?? 0,
    )
    const newItem: CartItem = {
      id: Date.now(),
      variantId,
      quantity: addQty,
      unit_price: unitPrice,
      line_total: Number((unitPrice * addQty).toFixed(2)),
      variant: v
        ? {
            ...v,
            product: p || undefined,
          }
        : undefined,
    }
    newItems.push(newItem)
  }

  const updatedCart = normalizeCart({
    ...current,
    items: newItems,
  })
  saveStoredCart(updatedCart)
  return updatedCart
}

export const updateCartItem = async (
  itemId: number | string,
  payload: UpdateCartItemPayload,
): Promise<Cart> => {
  const current = getStoredCart()
  const newQty = Math.max(1, Math.floor(Number(payload.quantity)))
  const newItems = current.items.map((item) => {
    if (String(item.id) === String(itemId) || String(item.variantId) === String(itemId)) {
      const unitPrice = Number(
        item.unit_price || item.variant?.price || item.variant?.product?.base_price || 0,
      )
      return {
        ...item,
        quantity: newQty,
        unit_price: unitPrice,
        line_total: Number((unitPrice * newQty).toFixed(2)),
      }
    }
    return item
  })

  const updatedCart = normalizeCart({
    ...current,
    items: newItems,
  })
  saveStoredCart(updatedCart)
  return updatedCart
}

export const removeCartItem = async (itemId: number | string): Promise<Cart> => {
  const current = getStoredCart()
  const newItems = current.items.filter(
    (item) => String(item.id) !== String(itemId) && String(item.variantId) !== String(itemId),
  )

  const updatedCart = normalizeCart({
    ...current,
    items: newItems,
  })
  saveStoredCart(updatedCart)
  return updatedCart
}

export const clearCart = async (): Promise<Cart> => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CART_STORAGE_KEY)
  }
  return EMPTY_CART
}
