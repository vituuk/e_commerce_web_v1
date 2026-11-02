import React from 'react'
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag } from 'lucide-react'
import { formatPrice } from '@/utils/currency'
import { useI18n } from '@/assets/i18n'
import type { AuthUser } from '@/types/auth'
import type { Cart } from '@/types/cart'
import type { Product } from '@/types/product'

export interface CartPageProps {
  user: AuthUser | null
  cart: Cart
  cartSubtotal: number
  shippingEstimate: number
  onOpenAuthModal: () => void
  onNavigateShop: () => void
  onProceedToCheckout: () => void
  onUpdateCartQty: (itemId: number | string, newQty: number, maxStock?: number) => void
  onRemoveCartItem: (itemId: number | string) => void
  getProductPrimaryImage: (prod?: Product | null, fallbackIdx?: number | string) => string
}

export function CartPage({
  user,
  cart,
  cartSubtotal,
  shippingEstimate,
  onOpenAuthModal,
  onNavigateShop,
  onProceedToCheckout,
  onUpdateCartQty,
  onRemoveCartItem,
  getProductPrimaryImage,
}: CartPageProps) {
  const { t } = useI18n()
  return (
    <div className="nx-container nx-page-cart">
      <div className="nx-page-banner">
        <div>
          <h1>{t('Your Shopping Cart')}</h1>
          <p>
            {t('Review your selected clothing variants, adjust quantities, validate available stock, and proceed to checkout.')}
          </p>
        </div>
      </div>

      {!cart?.items?.length ? (
        <div className="nx-empty-card">
          <ShoppingBag size={40} />
          <h3>{t('Your shopping cart is currently empty')}</h3>
          <p>{t('Browse our clothing catalog and select a size & color variant to add.')}</p>
          <button type="button" className="nx-btn nx-btn-dark" onClick={onNavigateShop}>
            {t('Explore Clothing Catalog')}
          </button>
        </div>
      ) : (
        <div className="nx-cart-layout">
          <div className="nx-cart-items-col nx-luxury-items-container">
            {cart.items.map((item, idx) => {
              const v = item.variant || ({} as NonNullable<typeof item.variant>)
              const p = v.product || null
              const imgUrl = getProductPrimaryImage(p, idx)
              const stockQty = v.stock_qty !== undefined ? Number(v.stock_qty) : undefined
              return (
                <div key={item.id} className="nx-luxury-item-row">
                  <div className="nx-luxury-thumb-wrap">
                    <img
                      src={imgUrl}
                      alt={p?.name || 'Product'}
                      className="nx-luxury-thumb"
                    />
                  </div>
                  <div className="nx-luxury-info">
                    <div className="nx-luxury-top">
                      <h3 className="nx-luxury-title">{p?.name || v.sku || 'Product'}</h3>
                      <span className="nx-luxury-price">{formatPrice(item.line_total)}</span>
                    </div>
                    <div className="nx-luxury-specs">
                      <div className="nx-luxury-spec-row">
                        <span className="nx-luxury-spec-label">Size:</span>
                        <span className="nx-luxury-spec-val">{v.size || '—'}</span>
                      </div>
                      <div className="nx-luxury-spec-row">
                        <span className="nx-luxury-spec-label">Color:</span>
                        <span className="nx-luxury-spec-val">{v.color || '—'}</span>
                      </div>
                      <div className="nx-luxury-spec-row">
                        <span className="nx-luxury-spec-label">Quantity:</span>
                        <div className="nx-luxury-qty-inline">
                          <span className="nx-luxury-spec-val">{item.quantity}</span>
                          <div className="nx-luxury-qty-actions">
                            <button
                              type="button"
                              className="nx-luxury-qty-btn"
                              title="Decrease quantity"
                              onClick={() =>
                                item.quantity > 1
                                  ? onUpdateCartQty(item.id, item.quantity - 1, stockQty)
                                  : onRemoveCartItem(item.id)
                              }
                            >
                              <Minus size={11} />
                            </button>
                            <button
                              type="button"
                              className="nx-luxury-qty-btn"
                              title="Increase quantity"
                              onClick={() =>
                                onUpdateCartQty(item.id, item.quantity + 1, stockQty)
                              }
                            >
                              <Plus size={11} />
                            </button>
                            <button
                              type="button"
                              className="nx-luxury-remove-link"
                              title="Remove item"
                              onClick={() => onRemoveCartItem(item.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right: Cart Summary & Proceed to Checkout */}
          <aside className="nx-cart-summary-card">
            <h3>{t('Order Summary')}</h3>
            <div className="nx-summary-rows">
              <div className="nx-summary-line">
                <span>{t('Subtotal')} ({cart.total_qty})</span>
                <strong>{formatPrice(cartSubtotal)}</strong>
              </div>
              <div className="nx-summary-line">
                <span>{t('Shipping')}</span>
                <strong>
                  {shippingEstimate === 0 ? '0 $' : formatPrice(shippingEstimate)}
                </strong>
              </div>
              <div className="nx-summary-line total">
                <span>{t('Total')}</span>
                <strong>{formatPrice(cartSubtotal + shippingEstimate)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="nx-btn nx-btn-dark nx-btn-full"
              onClick={onProceedToCheckout}
            >
              <span>{t('Proceed to Checkout')}</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="nx-btn nx-btn-outline nx-btn-full"
              style={{ marginTop: '10px' }}
              onClick={onNavigateShop}
            >
              {t('Continue Shopping')}
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}

export default CartPage

