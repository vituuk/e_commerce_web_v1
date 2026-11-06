import React, { useEffect, useState } from 'react'
import { formatPrice as defaultFormatPrice } from '@/utils/currency'
import { useI18n } from '@/assets/i18n'
import type { Product } from '@/types/product'

export interface ProductCardProps {
  prod: Product
  idx: number
  onOpen: (prod: Product) => void
  formatPrice?: (val: number | string | null | undefined) => string
  getProductPrimaryImage: (prod: Product, fallbackIdx?: number | string) => string
  brokenImages?: Record<string | number, boolean>
  setBrokenImages: React.Dispatch<React.SetStateAction<Record<string | number, boolean>>>
  onAddToCart?: (prod: Product) => void
  isWishlisted?: boolean
  onToggleWishlist?: (prodId: number | string, prodName?: string) => void
}

export function ProductCard({
  prod,
  idx,
  onOpen,
  formatPrice = defaultFormatPrice,
  getProductPrimaryImage,
  setBrokenImages,
  onAddToCart,
  isWishlisted = false,
  onToggleWishlist,
}: ProductCardProps) {
  const { t } = useI18n()
  const variants = prod.variants || []
  const preferredVariant = variants.find((v) => Number(v.stock_qty || 0) > 0) || variants[0]
  const basePrice = Number(prod.base_price ?? preferredVariant?.price ?? 0)
  const explicitSalePrice =
    prod.sale_price !== null && prod.sale_price !== undefined ? Number(prod.sale_price) : null
  const variantFinalPrice =
    preferredVariant?.final_price !== undefined
      ? Number(preferredVariant.final_price)
      : preferredVariant?.price !== null && preferredVariant?.price !== undefined
      ? Number(preferredVariant.price)
      : null
  const salePrice =
    explicitSalePrice !== null && explicitSalePrice < basePrice
      ? explicitSalePrice
      : variantFinalPrice !== null && basePrice > 0 && variantFinalPrice < basePrice
      ? variantFinalPrice
      : null
  const hasDiscount = salePrice !== null && basePrice > salePrice
  const displayPrice = hasDiscount
    ? salePrice
    : (variantFinalPrice ?? (basePrice > 0 ? basePrice : prod.price ?? 0))
  const originalPrice = hasDiscount ? basePrice : null
  const discountPercent =
    hasDiscount && basePrice > 0 ? Math.round(((basePrice - salePrice) / basePrice) * 100) : 0
  const coverUrl = getProductPrimaryImage(prod, idx)
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => {
    setImgLoaded(false)
  }, [coverUrl])

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (onAddToCart) {
      onAddToCart(prod)
    }
  }

  const handleHeart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (onToggleWishlist) {
      onToggleWishlist(prod.id, prod.name)
    }
  }

  return (
    <article className="nx-op-card" onClick={() => onOpen(prod)}>
      <div className={`nx-op-media-box${!imgLoaded ? ' nx-media-shimmer-active' : ''}`}>
        <img
          ref={(el) => {
            if (el?.complete && !imgLoaded) {
              setImgLoaded(true)
            }
          }}
          src={coverUrl}
          alt={prod.name}
          className="nx-op-image"
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setImgLoaded(true)
            setBrokenImages((prev) => ({ ...prev, [prod.id]: true }))
          }}
        />

        {/* Top-Left Discount Badge on Product Image */}
        {hasDiscount && <span className="nx-op-discount-badge-left">-{discountPercent}%</span>}

        {/* Top-Right Price on Product (with Discount/Original Price on Left) */}
        <span className="nx-op-price-badge">
          {hasDiscount && originalPrice && (
            <span className="nx-op-original-price">{formatPrice(originalPrice)}</span>
          )}
          <span className="nx-op-current-price">{formatPrice(displayPrice)}</span>
        </span>

        {/* Hover Popup 'View' Text on Image */}
        <div className="nx-op-view-popup">
          <span className="nx-op-view-pill">{t('View')}</span>
        </div>
      </div>

      <div className="nx-op-info">
        <div className="nx-op-title-row">
          <h3 className="nx-op-name" title={prod.name}>
            {prod.name}
          </h3>
          <button
            type="button"
            className={`nx-op-heart-btn ${isWishlisted ? 'active' : ''}`}
            onClick={handleHeart}
            title={isWishlisted ? t('Wishlist') : t('Wishlist')}
            aria-label="Wishlist"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={isWishlisted ? '#e11d48' : 'none'}
              stroke={isWishlisted ? '#e11d48' : '#0f172a'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="nx-op-heart-svg"
            >
              <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
            </svg>
          </button>
        </div>

        <button type="button" className="nx-op-add-btn" onClick={handleAdd}>
          {t('ADD TO CART')}
        </button>
      </div>
    </article>
  )
}

export default ProductCard

