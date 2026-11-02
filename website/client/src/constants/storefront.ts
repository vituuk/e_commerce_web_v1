export const FREE_SHIPPING_THRESHOLD = 75
export const LOW_ORDER_THRESHOLD = 20
export const SHIPPING_RATE_LOW = 2.5
export const SHIPPING_RATE_STANDARD = 5.0
export const ITEMS_PER_PAGE = 10
export const OUR_PRODUCTS_PER_PAGE = 10

/**
 * Option A: Tiered Shipping Calculation
 * - Subtotal $0: $0.00
 * - Subtotal < $20: $2.50 (balanced rate for small / single-item purchases)
 * - Subtotal $20 - $74.99: $5.00 (standard rate)
 * - Subtotal >= $75: $0.00 (FREE shipping)
 */
export function calculateShippingFee(subtotal: number): number {
  const s = Math.max(0, Number(subtotal) || 0)
  if (s === 0) return 0
  if (s >= FREE_SHIPPING_THRESHOLD) return 0
  if (s < LOW_ORDER_THRESHOLD) return SHIPPING_RATE_LOW
  return SHIPPING_RATE_STANDARD
}

