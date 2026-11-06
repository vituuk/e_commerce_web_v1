import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Edit3,
  MessageSquare,
  Star,
  Trash2,
} from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { getColorHex } from '@/constants/studioAssets'
import { extractErrorMessage, productApi, resolveImageUrl } from '@/api/client'
import { formatPrice } from '@/utils/currency'
import { NO_IMAGE_PLACEHOLDER } from '@/utils/productImage'
import { useI18n } from '@/assets/i18n'
import type { AuthUser } from '@/types/auth'
import type { ToastType } from '@/types/navigation'
import type {
  Product,
  ProductImage,
  ProductReview,
  ProductVariant,
  SelectedDetailPricing,
} from '@/types/product'

export interface ProductDetailPageProps {
  activeProduct: Product
  products: Product[]
  selectedDetailPricing: SelectedDetailPricing | null
  user: AuthUser | null
  wishlist: Array<number | string>
  brokenImages: Record<string | number, boolean>
  setBrokenImages: React.Dispatch<React.SetStateAction<Record<string | number, boolean>>>
  onToggleWishlist: (prodId: number | string, prodName?: string) => void
  onBack: () => void
  onAddToCart: (
    variant: ProductVariant | null,
    qty?: number,
    product?: Product,
  ) => void | Promise<void>
  onOpenProductDetails: (product: Product) => void
  onAddRelatedToCart: (product: Product) => void
  onOpenAuthModal: () => void
  onReloadCatalog: () => Promise<unknown>
  showToast: (message: string, type?: ToastType) => void
  getProductPrimaryImage: (prod?: Product | null, fallbackIdx?: number | string) => string
}

export function ProductDetailPage({
  activeProduct,
  products,
  selectedDetailPricing,
  user,
  wishlist,
  brokenImages,
  setBrokenImages,
  onToggleWishlist,
  onBack,
  onAddToCart,
  onOpenProductDetails,
  onAddRelatedToCart,
  onOpenAuthModal,
  onReloadCatalog,
  showToast,
  getProductPrimaryImage,
}: ProductDetailPageProps) {
  const { t } = useI18n()
  const [liveProduct, setLiveProduct] = useState<Product>(activeProduct)
  const [liveImages, setLiveImages] = useState<ProductImage[]>(activeProduct.images || [])
  const [liveVariants, setLiveVariants] = useState<ProductVariant[]>(
    activeProduct.variants || [],
  )
  const [detailMainImageIdx, setDetailMainImageIdx] = useState(0)
  const [detailColor, setDetailColor] = useState('')
  const [detailSize, setDetailSize] = useState('')
  const [detailVariantId, setDetailVariantId] = useState<number | string | null>(null)
  const [detailReviews, setDetailReviews] = useState<ProductReview[]>(
    activeProduct.reviewsList || [],
  )
  const [detailAverageRating, setDetailAverageRating] = useState<number>(
    Number(activeProduct.reviewsSummary?.average_rating || 0),
  )
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [editingReviewId, setEditingReviewId] = useState<number | string | null>(null)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [isImageZoomed, setIsImageZoomed] = useState(false)
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 })

  useEffect(() => {
    let cancelled = false
    setLiveProduct(activeProduct)
    setLiveImages(activeProduct.images || [])
    const initialVars = activeProduct.variants || []
    setLiveVariants(initialVars)
    setDetailMainImageIdx(0)
    setIsImageZoomed(false)

    const applyVariantDefaults = (vars: ProductVariant[]) => {
      const firstInStock = vars.find((v) => Number(v.stock_qty || 0) > 0) || vars[0]
      const rawColors = Array.from(
        new Set(vars.map((v) => v.color).filter((c): c is string => Boolean(c))),
      )
      const rawSizes = Array.from(
        new Set(vars.map((v) => v.size).filter((s): s is string => Boolean(s))),
      )
      setDetailColor(firstInStock?.color || rawColors[0] || '')
      setDetailSize(firstInStock?.size || rawSizes[0] || '')
      setDetailVariantId(firstInStock?.id ?? null)
    }

    applyVariantDefaults(initialVars)
    setDetailReviews(activeProduct.reviewsList || [])
    setDetailAverageRating(Number(activeProduct.reviewsSummary?.average_rating || 0))
    setEditingReviewId(null)

    Promise.allSettled([
      productApi.getById(activeProduct.id),
      productApi.getImages(activeProduct.id),
      productApi.getVariants(activeProduct.id),
      productApi.getReviews(activeProduct.id, { limit: 50 }),
    ]).then(([prodRes, imgRes, varRes, revRes]) => {
      if (cancelled) return

      if (prodRes.status === 'fulfilled' && prodRes.value.data?.data) {
        setLiveProduct((prev) => ({ ...prev, ...prodRes.value.data.data }))
      }

      if (imgRes.status === 'fulfilled' && imgRes.value.data?.data?.images) {
        const sortedImgs = [...imgRes.value.data.data.images].sort((a, b) =>
          a.is_primary === b.is_primary ? Number(a.id) - Number(b.id) : a.is_primary ? -1 : 1,
        )
        setLiveImages(sortedImgs)
      }

      if (varRes.status === 'fulfilled' && varRes.value.data?.data?.variants) {
        const activeVars = varRes.value.data.data.variants.filter((v) => v.is_active !== false)
        setLiveVariants(activeVars)
        applyVariantDefaults(activeVars)
      }

      if (revRes.status === 'fulfilled' && revRes.value.data?.data) {
        const revData = revRes.value.data.data
        setDetailReviews(revData.reviews || [])
        setDetailAverageRating(Number(revData.average_rating || 0))
      }
    })

    return () => {
      cancelled = true
    }
  }, [activeProduct.id])

  const availableSizes = useMemo(
    () =>
      Array.from(
        new Set(liveVariants.map((v) => v.size).filter((s): s is string => Boolean(s))),
      ),
    [liveVariants],
  )

  const availableColors = useMemo(
    () =>
      Array.from(
        new Set(liveVariants.map((v) => v.color).filter((c): c is string => Boolean(c))),
      ),
    [liveVariants],
  )

  const showSkuOnlySelector =
    liveVariants.length > 0 && availableSizes.length === 0 && availableColors.length === 0

  const activeDetailVariant = useMemo<ProductVariant | null>(() => {
    if (!liveVariants.length) return null
    if (showSkuOnlySelector && detailVariantId !== null) {
      return (
        liveVariants.find((v) => String(v.id) === String(detailVariantId)) || liveVariants[0]
      )
    }
    return (
      liveVariants.find(
        (v) =>
          (!detailColor || v.color === detailColor) && (!detailSize || v.size === detailSize),
      ) ||
      (detailColor ? liveVariants.find((v) => v.color === detailColor) : undefined) ||
      (detailSize ? liveVariants.find((v) => v.size === detailSize) : undefined) ||
      liveVariants[0]
    )
  }, [liveVariants, detailColor, detailSize, detailVariantId, showSkuOnlySelector])

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) {
      onOpenAuthModal()
      return
    }
    setSubmittingReview(true)
    try {
      const existingMyReview = detailReviews.find(
        (r) => Number(r.userId || r.user?.id) === Number(user.id),
      )
      const targetReviewId = editingReviewId ?? existingMyReview?.id ?? null

      if (targetReviewId) {
        await productApi.updateReview(liveProduct.id, targetReviewId, reviewForm)
        showToast('Your review has been updated', 'success')
      } else {
        await productApi.createReview(liveProduct.id, reviewForm)
        showToast('Thank you! Your review has been published', 'success')
      }
      setReviewForm({ rating: 5, comment: '' })
      setEditingReviewId(null)
      const revRes = await productApi.getReviews(liveProduct.id, { limit: 50 })
      const revData = revRes.data?.data
      if (revData?.reviews) {
        setDetailReviews(revData.reviews)
      }
      if (revData?.average_rating !== undefined) {
        setDetailAverageRating(Number(revData.average_rating || 0))
      }
      await onReloadCatalog()
    } catch (err: unknown) {
      showToast(extractErrorMessage(err, 'Could not submit review'), 'error')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleDeleteReview = async (reviewId: number | string) => {
    try {
      await productApi.deleteReview(liveProduct.id, reviewId)
      showToast('Review deleted', 'info')
      const revRes = await productApi.getReviews(liveProduct.id, { limit: 50 })
      const revData = revRes.data?.data
      setDetailReviews(revData?.reviews || [])
      setDetailAverageRating(Number(revData?.average_rating || 0))
      await onReloadCatalog()
    } catch (err: unknown) {
      showToast(extractErrorMessage(err, 'Unable to delete review'), 'error')
    }
  }

  // Gallery preparation strictly from API images
  const displayThumbs = useMemo<string[]>(() => {
    const resolved = liveImages
      .map((i) => resolveImageUrl(i.url || i.image_url))
      .filter((u): u is string => Boolean(u))

    if (resolved.length > 0) return resolved

    const directUrl = resolveImageUrl(liveProduct.image_url)
    if (directUrl) return [directUrl]

    return [NO_IMAGE_PLACEHOLDER]
  }, [liveImages, liveProduct.image_url])

  const currentMainImg =
    displayThumbs[detailMainImageIdx % displayThumbs.length] || displayThumbs[0]

  // Pricing calculation strictly from API product & selected variant
  const basePrice = Number(
    selectedDetailPricing?.basePrice ??
      liveProduct.base_price ??
      activeDetailVariant?.price ??
      0,
  )
  const rawSalePrice =
    selectedDetailPricing?.salePrice !== undefined && selectedDetailPricing?.salePrice !== null
      ? Number(selectedDetailPricing.salePrice)
      : liveProduct.sale_price !== null && liveProduct.sale_price !== undefined
      ? Number(liveProduct.sale_price)
      : activeDetailVariant?.final_price !== undefined &&
        Number(activeDetailVariant.final_price) < basePrice
      ? Number(activeDetailVariant.final_price)
      : null
  const hasDiscount = rawSalePrice !== null && basePrice > rawSalePrice
  const displayPrice = hasDiscount
    ? rawSalePrice
    : Number(activeDetailVariant?.final_price ?? activeDetailVariant?.price ?? basePrice)
  const originalPrice = hasDiscount ? basePrice : null
  const discountPercent =
    hasDiscount && basePrice > 0 ? Math.round(((basePrice - displayPrice) / basePrice) * 100) : 0

  const currentSize = detailSize || availableSizes[0] || ''
  const currentColor = detailColor || availableColors[0] || ''
  const hasNoVariants = liveVariants.length === 0
  const isOutOfStock =
    hasNoVariants ||
    Boolean(activeDetailVariant && Number(activeDetailVariant.stock_qty || 0) <= 0)
  const displayRating = detailReviews.length > 0 ? detailAverageRating : 0
  const isWishlisted = wishlist.some((savedId) => String(savedId) === String(liveProduct.id))
  const relatedProducts = useMemo(
    () => products.filter((p) => String(p.id) !== String(liveProduct.id)).slice(0, 5),
    [products, liveProduct.id],
  )

  return (
    <div className="nx-container nx-page-product">
      <div className="nx-product-detail-layout">
        {/* Left: Image Gallery with Floating Navigation Arrows & Thumbnails */}
        <div className="nx-detail-gallery">
          <div className="nx-detail-gallery-container">
            <button
              type="button"
              className="nx-detail-back-btn"
              onClick={onBack}
              title="Back to previous page"
              aria-label="Back to previous page"
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </button>

            <div className="nx-detail-thumbs">
              {displayThumbs.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  className={`nx-thumb-btn ${
                    detailMainImageIdx % displayThumbs.length === idx ? 'active' : ''
                  }`}
                  onClick={() => {
                    setDetailMainImageIdx(idx)
                    setIsImageZoomed(false)
                  }}
                  aria-label={`View angle ${idx + 1}`}
                >
                  <img
                    src={url}
                    alt={`${liveProduct.name} angle ${idx + 1}`}
                    onError={(e) => {
                      e.currentTarget.src = NO_IMAGE_PLACEHOLDER
                    }}
                  />
                </button>
              ))}
            </div>

            <div
              className="nx-detail-main-img-wrap"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = Math.max(
                  0,
                  Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
                )
                const y = Math.max(
                  0,
                  Math.min(100, ((e.clientY - rect.top) / rect.height) * 100),
                )
                setZoomCoords({ x, y })
                setIsImageZoomed(true)
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = Math.max(
                  0,
                  Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
                )
                const y = Math.max(
                  0,
                  Math.min(100, ((e.clientY - rect.top) / rect.height) * 100),
                )
                setZoomCoords({ x, y })
                if (!isImageZoomed) setIsImageZoomed(true)
              }}
              onMouseLeave={() => {
                setIsImageZoomed(false)
              }}
            >
              {displayThumbs.length > 1 && (
                <button
                  type="button"
                  className="nx-gallery-arrow-btn prev"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsImageZoomed(false)
                    setDetailMainImageIdx((prev) =>
                      prev > 0 ? prev - 1 : displayThumbs.length - 1,
                    )
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              <div className="nx-detail-main-img">
                <img
                  src={currentMainImg}
                  alt={liveProduct.name}
                  onError={(e) => {
                    e.currentTarget.src = NO_IMAGE_PLACEHOLDER
                  }}
                  style={
                    isImageZoomed
                      ? {
                          transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%`,
                          transform: 'scale(2.5)',
                          transition:
                            'transform-origin 0.04s ease-out, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        }
                      : {
                          transformOrigin: 'center center',
                          transform: 'scale(1)',
                          transition:
                            'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform-origin 0.2s ease',
                        }
                  }
                />
              </div>

              {displayThumbs.length > 1 && (
                <button
                  type="button"
                  className="nx-gallery-arrow-btn next"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsImageZoomed(false)
                    setDetailMainImageIdx((prev) =>
                      prev < displayThumbs.length - 1 ? prev + 1 : 0,
                    )
                  }}
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Product Details */}
        <div className="nx-detail-info">
          <h1 className="nx-detail-title">{liveProduct.name}</h1>

          <div className="nx-detail-rating-row">
            <div className="nx-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  fill={star <= Math.round(displayRating) ? '#fbbf24' : '#e5e7eb'}
                  color={star <= Math.round(displayRating) ? '#fbbf24' : '#e5e7eb'}
                />
              ))}
            </div>
            <span className="nx-rating-score">
              ({displayRating.toFixed(1)})
            </span>
          </div>

          <div className="nx-detail-price-row">
            <span className="nx-detail-price">{formatPrice(displayPrice)}</span>
            {hasDiscount && originalPrice && (
              <>
                <span className="nx-detail-original-price">{formatPrice(originalPrice)}</span>
                {discountPercent > 0 && (
                  <span className="nx-detail-discount-badge">-{discountPercent}%</span>
                )}
              </>
            )}
          </div>

          <div className="nx-detail-divider" />

          {/* Available Size Selector (Strictly from API Variants) */}
          {availableSizes.length > 0 && (
            <div className="nx-detail-section-group">
              <div className="nx-detail-opt-label">{t('Please select one size')}</div>
              <div className="nx-size-tiles-row">
                {availableSizes.map((sz) => {
                  const isSelected = currentSize === sz
                  return (
                    <button
                      key={sz}
                      type="button"
                      className={`nx-size-tile ${isSelected ? 'active' : ''}`}
                      onClick={() => setDetailSize(sz)}
                    >
                      {sz}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Available Color Selector (Strictly from API Variants) */}
          {availableColors.length > 0 && (
            <div className="nx-detail-section-group">
              <div className="nx-detail-opt-label">
                {t('Available Color')}
                {currentColor && <span className="nx-color-name"> · {currentColor}</span>}
              </div>
              <div className="nx-color-swatches-row">
                {availableColors.map((c) => {
                  const isSelected = currentColor === c
                  const hex = getColorHex(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      className={`nx-detail-color-swatch ${isSelected ? 'active' : ''}`}
                      style={{ backgroundColor: hex }}
                      onClick={() => setDetailColor(c)}
                      title={c}
                      aria-label={`Color ${c}`}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* SKU Selector when variants exist without color/size attributes */}
          {showSkuOnlySelector && (
            <div className="nx-detail-section-group">
              <div className="nx-detail-opt-label">{t('Select Variant')}</div>
              <div className="nx-size-tiles-row">
                {liveVariants.map((v) => {
                  const isSelected = String(activeDetailVariant?.id) === String(v.id)
                  return (
                    <button
                      key={v.id}
                      type="button"
                      className={`nx-size-tile ${isSelected ? 'active' : ''}`}
                      onClick={() => setDetailVariantId(v.id)}
                    >
                      {v.sku || `#${v.id}`}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action Row: Add to Cart + Heart Icon on Right */}
          <div className="nx-detail-action-row">
            <button
              type="button"
              className="nx-detail-add-btn"
              disabled={isOutOfStock}
              onClick={() =>
                void onAddToCart(activeDetailVariant, 1, {
                  ...liveProduct,
                  images: liveImages,
                  variants: liveVariants,
                })
              }
            >
              <span>
                {hasNoVariants
                  ? t('No Variants Available')
                  : isOutOfStock
                  ? t('Out of Stock')
                  : t('Add to cart')}
              </span>
            </button>

            <button
              type="button"
              className={`nx-detail-heart-btn ${isWishlisted ? 'active' : ''}`}
              onClick={() => onToggleWishlist(liveProduct.id, liveProduct.name)}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={isWishlisted ? '#e11d48' : 'none'}
                stroke={isWishlisted ? '#e11d48' : '#111827'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="nx-detail-heart-svg"
              >
                <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
              </svg>
            </button>
          </div>

          {/* Product Description Block (Strictly from API Product & Variant Data) */}
          <div className="nx-detail-desc-card">
            <div className="nx-detail-desc-title">{t('Description')}</div>
            <p className="nx-detail-desc-p">
              {liveProduct.description || 'No description provided for this product.'}
            </p>
            <div className="nx-detail-bullet-points">
              <div className="nx-bullet-item">
                <span className="nx-bullet-dot" />
                <span>{t('Category')}: {liveProduct.category?.name || 'Uncategorized'}</span>
              </div>
              {activeDetailVariant?.sku && (
                <div className="nx-bullet-item">
                  <span className="nx-bullet-dot" />
                  <span>{t('SKU')}: {activeDetailVariant.sku}</span>
                </div>
              )}
              <div className="nx-bullet-item">
                <span className="nx-bullet-dot" />
                <span>
                  Stock:{' '}
                  {activeDetailVariant
                    ? `${Number(activeDetailVariant.stock_qty || 0)} available`
                    : 'No active variants'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="nx-reviews-section">
        <div className="nx-section-header">
          <div>
            <h2 className="nx-section-title">Customer Reviews ({detailReviews.length})</h2>
          </div>
        </div>

        <div className="nx-reviews-grid">
          <form className="nx-review-form-card" onSubmit={handleReviewSubmit}>
            <h3>{editingReviewId ? 'Update Your Review' : 'Write a Customer Review'}</h3>
            <p className="nx-muted">
              Share your feedback and rating for <strong>{liveProduct.name}</strong>.
            </p>

            <div className="nx-form-field">
              <label>Rating (1 – 5 Stars)</label>
              <div className="nx-star-picker">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                  >
                    <Star
                      size={22}
                      fill={star <= reviewForm.rating ? '#f59e0b' : 'none'}
                      color="#f59e0b"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="nx-form-field">
              <label>Your Comment</label>
              <textarea
                rows={4}
                required
                placeholder="Write your review here..."
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              />
            </div>

            <div className="nx-form-actions">
              <button
                type="submit"
                className="nx-btn nx-btn-dark"
                disabled={submittingReview}
              >
                {submittingReview
                  ? 'Saving...'
                  : editingReviewId
                  ? 'Update Review'
                  : 'Submit Review'}
              </button>
              {editingReviewId && (
                <button
                  type="button"
                  className="nx-btn nx-btn-outline"
                  onClick={() => {
                    setEditingReviewId(null)
                    setReviewForm({ rating: 5, comment: '' })
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="nx-reviews-list">
            {detailReviews.length === 0 ? (
              <div className="nx-empty-card">
                <MessageSquare size={28} />
                <h4>No reviews yet for this product</h4>
                <p>Be the first customer to review {liveProduct.name}.</p>
              </div>
            ) : (
              detailReviews.map((rev) => {
                const isOwner = Boolean(
                  user &&
                    (Number(rev.userId || rev.user?.id) === Number(user.id) ||
                      rev.user?.firstName === user.firstName),
                )
                return (
                  <div key={rev.id} className="nx-review-card">
                    <div className="nx-review-head">
                      <div>
                        <strong>
                          {rev.user
                            ? `${rev.user.firstName || ''} ${rev.user.lastName || ''}`.trim()
                            : 'Verified Customer'}
                        </strong>
                        <span className="nx-review-date">
                          {rev.createdAt
                            ? new Date(rev.createdAt).toLocaleDateString()
                            : 'Recent'}
                        </span>
                      </div>
                      <div className="nx-stars">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={14}
                            fill={n <= Number(rev.rating || 5) ? '#f59e0b' : 'none'}
                            color="#f59e0b"
                          />
                        ))}
                      </div>
                    </div>
                    <p className="nx-review-comment">{rev.comment}</p>
                    {isOwner && (
                      <div className="nx-review-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReviewId(rev.id)
                            setReviewForm({
                              rating: rev.rating,
                              comment: rev.comment || '',
                            })
                          }}
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => void handleDeleteReview(rev.id)}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="nx-section">
          <div className="nx-section-header">
            <div>
              <span className="nx-eyebrow">YOU MAY ALSO LIKE</span>
              <h2 className="nx-section-title">Related Products</h2>
            </div>
          </div>
          <div className="nx-product-grid-4">
            {relatedProducts.map((prod, idx) => (
              <ProductCard
                key={prod.id}
                prod={prod}
                idx={idx}
                onOpen={onOpenProductDetails}
                formatPrice={formatPrice}
                getProductPrimaryImage={getProductPrimaryImage}
                brokenImages={brokenImages}
                setBrokenImages={setBrokenImages}
                onAddToCart={onAddRelatedToCart}
                isWishlisted={wishlist.some(
                  (savedId) => String(savedId) === String(prod.id),
                )}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default ProductDetailPage
