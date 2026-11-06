import React from 'react'
import { ShoppingBag, Trash2, X } from 'lucide-react'
import { formatPrice } from '@/utils/currency'
import { NO_IMAGE_PLACEHOLDER } from '@/utils/productImage'
import { useI18n } from '@/assets/i18n'
import type { Product } from '@/types/product'

export interface WishlistDrawerProps {
  isOpen: boolean
  onClose: () => void
  wishlistProducts: Product[]
  onToggleWishlist: (prodId: number | string, prodName?: string) => void
  onAddWishlistToCart: (prod: Product) => void
  onAddAllToCart: () => void
  onClearWishlist: () => void
  onOpenProduct: (prod: Product) => void
  onNavigateShop: () => void
  getProductPrimaryImage: (prod: Product, fallbackIdx?: number | string) => string
}

export function WishlistDrawer({
  isOpen,
  onClose,
  wishlistProducts,
  onToggleWishlist,
  onAddWishlistToCart,
  onAddAllToCart,
  onClearWishlist,
  onOpenProduct,
  onNavigateShop,
  getProductPrimaryImage,
}: WishlistDrawerProps) {
  const { t } = useI18n()
  if (!isOpen) return null

  return (
    <div className="nx-wishlist-overlay" onClick={onClose} aria-hidden={!isOpen}>
      <aside
        className="nx-wishlist-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Wishlist"
      >
        {/* Drawer Header */}
        <div className="nx-wishlist-header">
          <div className="nx-wishlist-header-left">
            <div className="nx-wishlist-header-icon-box">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="#ef4444"
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
              </svg>
            </div>
            <div>
              <h3 className="nx-wishlist-title">{t('My Wishlist')}</h3>
              <span className="nx-wishlist-sub">
                {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'} saved
              </span>
            </div>
          </div>
          <button
            type="button"
            className="nx-wishlist-close-btn"
            onClick={onClose}
            aria-label="Close wishlist"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="nx-wishlist-body">
          {wishlistProducts.length === 0 ? (
            <div className="nx-wishlist-empty">
              <div className="nx-wishlist-empty-icon-wrap">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="44"
                  height="44"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
                </svg>
              </div>
              <h4>Your wishlist is empty</h4>
              <p>
                Tap the heart icon on any product to save items you love and find them anytime.
              </p>
              <button
                type="button"
                className="nx-btn nx-btn-dark nx-wishlist-shop-btn"
                onClick={() => {
                  onClose()
                  onNavigateShop()
                }}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="nx-wishlist-items-list">
              {wishlistProducts.map((prod, idx) => {
                const variants = prod.variants || []
                const basePrice = Number(prod.base_price ?? variants[0]?.price ?? 0)
                const salePrice =
                  prod.sale_price !== null && prod.sale_price !== undefined
                    ? Number(prod.sale_price)
                    : null
                const hasDiscount = salePrice !== null && basePrice > salePrice
                const displayPrice = hasDiscount
                  ? salePrice
                  : (variants[0]?.final_price ?? (basePrice > 0 ? basePrice : prod.price ?? 0))
                const originalPrice = hasDiscount ? basePrice : null
                const discountPercent =
                  hasDiscount && basePrice > 0
                    ? Math.round(((basePrice - salePrice) / basePrice) * 100)
                    : 0
                const coverUrl = getProductPrimaryImage(prod, idx)
                const totalStock = variants.reduce(
                  (acc, v) => acc + Number(v.stock_qty || 0),
                  0,
                )
                const inStock = totalStock > 0 || variants.length === 0
                const catName =
                  typeof prod.category === 'string'
                    ? prod.category
                    : prod.category?.name || 'Clothing'

                return (
                  <div key={prod.id || prod.key || idx} className="nx-wishlist-item-card">
                    <div
                      className="nx-wishlist-item-img-wrap"
                      onClick={() => {
                        onClose()
                        onOpenProduct(prod)
                      }}
                    >
                      <img
                        src={coverUrl}
                        alt={prod.name}
                        onError={(e) => {
                          e.currentTarget.src = NO_IMAGE_PLACEHOLDER
                        }}
                      />
                      {hasDiscount && (
                        <span className="nx-wishlist-item-discount">-{discountPercent}%</span>
                      )}
                    </div>

                    <div className="nx-wishlist-item-info">
                      <div className="nx-wishlist-item-top">
                        <span className="nx-wishlist-item-cat">{catName}</span>
                        <button
                          type="button"
                          className="nx-wishlist-item-remove-btn"
                          onClick={() => onToggleWishlist(prod.id, prod.name)}
                          title="Remove from wishlist"
                          aria-label="Remove from wishlist"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <h4
                        className="nx-wishlist-item-title"
                        onClick={() => {
                          onClose()
                          onOpenProduct(prod)
                        }}
                      >
                        {prod.name}
                      </h4>

                      <div className="nx-wishlist-item-price-row">
                        <span className="nx-wishlist-item-price">{formatPrice(displayPrice)}</span>
                        {originalPrice && (
                          <span className="nx-wishlist-item-orig-price">
                            {formatPrice(originalPrice)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="nx-wishlist-item-add-cart-btn"
                        disabled={!inStock}
                        onClick={() => onAddWishlistToCart(prod)}
                      >
                        <ShoppingBag size={13} />
                        <span>{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {wishlistProducts.length > 0 && (
          <div className="nx-wishlist-footer">
            <button
              type="button"
              className="nx-wishlist-add-all-btn"
              onClick={onAddAllToCart}
            >
              <ShoppingBag size={15} />
              <span>{t('Move All to Cart')}</span>
            </button>
            <div className="nx-wishlist-footer-links">
              <button
                type="button"
                className="nx-wishlist-clear-btn"
                onClick={onClearWishlist}
              >
                {t('Clear All Filters')}
              </button>
              <button
                type="button"
                className="nx-wishlist-continue-btn"
                onClick={() => {
                  onClose()
                  onNavigateShop()
                }}
              >
                {t('Continue Shopping')} →
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

export default WishlistDrawer

