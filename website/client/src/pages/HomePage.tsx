import React, { useMemo, useRef, useState } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, Package } from 'lucide-react'
import { CategorySliderSkeleton, ProductGridSkeleton } from '@/components/CatalogSkeletons'
import { OUR_PRODUCTS_PER_PAGE } from '@/constants/storefront'
import { useI18n } from '@/assets/i18n'
import { formatPrice } from '@/utils/currency'
import { NO_IMAGE_PLACEHOLDER } from '@/utils/productImage'
import { getProductSlug } from '@/utils/slug'
import type { Category } from '@/types/category'
import type {
  EnrichedOurProductItem,
  Product,
  SelectedDetailPricing,
} from '@/types/product'

export interface HomePageProps {
  categories: Category[]
  products: Product[]
  catalogLoading?: boolean
  catalogError?: string | null
  onReloadCatalog?: () => void
  wishlist: Array<number | string>
  onToggleWishlist: (prodId: number | string, prodName?: string) => void
  onNavigateHeaderCategory: (navKey: string) => void
  onSelectCategory: (category: Category) => void
  onOpenProductDetails: (product: Product, customPricing?: SelectedDetailPricing | null) => void
  onAddOurProductToCart: (item: EnrichedOurProductItem | Product) => void
  getProductPrimaryImage: (prod?: Product | null, fallbackIdx?: number | string) => string
}

export function HomePage({
  categories,
  products,
  catalogLoading = false,
  catalogError = null,
  onReloadCatalog,
  wishlist,
  onToggleWishlist,
  onNavigateHeaderCategory,
  onSelectCategory,
  onOpenProductDetails,
  onAddOurProductToCart,
  getProductPrimaryImage,
}: HomePageProps) {
  const { t } = useI18n()
  const [heroFallback, setHeroFallback] = useState(false)
  const [ourProductsPage, setOurProductsPage] = useState(1)
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({})

  const markImageLoaded = (imgKey: string) => {
    setLoadedImages((prev) => (prev[imgKey] ? prev : { ...prev, [imgKey]: true }))
  }

  const categorySliderRef = useRef<HTMLDivElement | null>(null)
  const [isCategoryDragging, setIsCategoryDragging] = useState(false)
  const [categoryStartX, setCategoryStartX] = useState(0)
  const [categoryScrollLeft, setCategoryScrollLeft] = useState(0)
  const [hasDraggedCategory, setHasDraggedCategory] = useState(false)

  const handleCategoryMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!categorySliderRef.current) return
    setIsCategoryDragging(true)
    setHasDraggedCategory(false)
    setCategoryStartX(e.pageX - categorySliderRef.current.offsetLeft)
    setCategoryScrollLeft(categorySliderRef.current.scrollLeft)
  }

  const handleCategoryMouseLeave = () => {
    setIsCategoryDragging(false)
  }

  const handleCategoryMouseUp = () => {
    setIsCategoryDragging(false)
  }

  const handleCategoryMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCategoryDragging || !categorySliderRef.current) return
    e.preventDefault()
    const x = e.pageX - categorySliderRef.current.offsetLeft
    const walk = (x - categoryStartX) * 1.5
    if (Math.abs(walk) > 4) {
      setHasDraggedCategory(true)
    }
    categorySliderRef.current.scrollLeft = categoryScrollLeft - walk
  }

  const categoryCards = useMemo(() => {
    return categories.map((cat, idx) => {
      const catProducts = products.filter(
        (p) => String(p.categoryId ?? p.category?.id) === String(cat.id),
      )
      const withUploadedImage =
        catProducts.find((p) => (p.images && p.images.length > 0) || Boolean(p.image_url)) ||
        catProducts[0] ||
        null
      return {
        category: cat,
        image: getProductPrimaryImage(withUploadedImage, idx),
      }
    })
  }, [categories, products, getProductPrimaryImage])

  const allOurProducts = useMemo<EnrichedOurProductItem[]>(() => {
    return products.map((prod, idx) => {
      const variants = prod.variants || []
      const preferredVariant =
        variants.find((v) => Number(v.stock_qty || 0) > 0) || variants[0]
      const basePrice = Number(prod.base_price ?? preferredVariant?.price ?? 0)
      const explicitSalePrice =
        prod.sale_price !== null && prod.sale_price !== undefined
          ? Number(prod.sale_price)
          : undefined
      const variantFinalPrice =
        preferredVariant?.final_price !== undefined
          ? Number(preferredVariant.final_price)
          : preferredVariant?.price !== null && preferredVariant?.price !== undefined
          ? Number(preferredVariant.price)
          : undefined

      const effectiveSalePrice =
        explicitSalePrice !== undefined && explicitSalePrice < basePrice
          ? explicitSalePrice
          : variantFinalPrice !== undefined && basePrice > 0 && variantFinalPrice < basePrice
          ? variantFinalPrice
          : undefined

      const displayPrice = Number(
        effectiveSalePrice ?? variantFinalPrice ?? basePrice,
      )

      return {
        key: String(getProductSlug(prod) || prod.id || idx),
        name: prod.name,
        base_price: basePrice,
        sale_price: effectiveSalePrice,
        price: displayPrice,
        image: getProductPrimaryImage(prod, idx),
        category: prod.category?.name || 'Uncategorized',
        realProduct: prod,
        catalogId: prod.id,
      }
    })
  }, [products, getProductPrimaryImage])

  const showOurProductsPagination = allOurProducts.length > OUR_PRODUCTS_PER_PAGE
  const totalOurProductsPages = Math.max(
    1,
    Math.ceil(allOurProducts.length / OUR_PRODUCTS_PER_PAGE),
  )

  const visibleOurProducts = useMemo(() => {
    if (!showOurProductsPagination) {
      return allOurProducts.slice(0, OUR_PRODUCTS_PER_PAGE)
    }
    const start = (ourProductsPage - 1) * OUR_PRODUCTS_PER_PAGE
    return allOurProducts.slice(start, start + OUR_PRODUCTS_PER_PAGE)
  }, [allOurProducts, ourProductsPage, showOurProductsPagination])

  return (
    <div className="nx-page-home">
      {/* Minimal Editorial Hero Banner ("Your Cozy Era") */}
      <section className="nx-container nx-hero-section">
        <div
          className="nx-hero-cozy-banner"
          onClick={() => onNavigateHeaderCategory('shop')}
        >
          {!heroFallback ? (
            <>
              <img
                src="/@fs/C:/Users/USER/.gemini/antigravity/brain/5fd22866-75a4-411e-b6aa-d36f05615d9b/.user_uploaded/media_1792553818666_b3c1fbdb.png"
                alt="Your Cozy Era"
                className="nx-hero-cozy-img"
                onError={() => setHeroFallback(true)}
              />
              <button
                type="button"
                className="nx-hero-cozy-btn-hotspot"
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigateHeaderCategory('shop')
                }}
                aria-label="Shop Now"
              >
                SHOP NOW
              </button>
            </>
          ) : (
            <div className="nx-hero-cozy-fallback-wrap">
              <img
                src="https://images.unsplash.com/photo-1544441893-675973e31985?w=1800&auto=format&fit=crop&q=85"
                alt="Your Cozy Era"
                className="nx-hero-cozy-fallback-img"
              />
              <div className="nx-hero-cozy-fallback-content">
                <h1 className="nx-hero-cozy-title">Your Cozy Era</h1>
                <p className="nx-hero-cozy-sub">
                  Get peak comfy-chic
                  <br />
                  with new winter essentials.
                </p>
                <button
                  type="button"
                  className="nx-hero-cozy-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onNavigateHeaderCategory('shop')
                  }}
                >
                  SHOP NOW
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Live API Category Showcase with Smooth Horizontal Slider */}
      <section className="nx-container nx-category-section">
        <h2 className="nx-category-section-title">{t('Featured Categories')}</h2>

        {catalogLoading ? (
          <CategorySliderSkeleton count={6} />
        ) : categoryCards.length === 0 ? (
          <p className="nx-muted" style={{ textAlign: 'center', padding: '18px 0' }}>
            No categories available in database yet.
          </p>
        ) : (
          <div className="nx-category-slider-wrapper">
            <div
              className="nx-category-slider-track"
              ref={categorySliderRef}
              onMouseDown={handleCategoryMouseDown}
              onMouseLeave={handleCategoryMouseLeave}
              onMouseUp={handleCategoryMouseUp}
              onMouseMove={handleCategoryMouseMove}
            >
              {categoryCards.map(({ category, image }) => {
                const catImgKey = `cat-${category.id}-${image}`
                const isCatLoaded = Boolean(loadedImages[catImgKey])
                return (
                  <div
                    key={category.id}
                    className="nx-category-card"
                    onClick={() => {
                      if (!hasDraggedCategory) {
                        onSelectCategory(category)
                      }
                    }}
                  >
                    <div
                      className={`nx-category-media${!isCatLoaded ? ' nx-media-shimmer-active' : ''}`}
                    >
                      <img
                        ref={(el) => {
                          if (el?.complete && !isCatLoaded) {
                            markImageLoaded(catImgKey)
                          }
                        }}
                        src={image}
                        alt={category.name}
                        loading="lazy"
                        draggable={false}
                        onLoad={() => markImageLoaded(catImgKey)}
                        onError={(e) => {
                          markImageLoaded(catImgKey)
                          e.currentTarget.src = NO_IMAGE_PLACEHOLDER
                        }}
                      />
                    </div>
                    <div className="nx-category-label-wrap">
                      <span className="nx-category-underline-name">
                        {category.name.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* OUR PRODUCTS SECTION (Live API Catalog) */}
      <section className="nx-container nx-our-products-section">
        <h2 className="nx-our-products-title">{t('Our Products')}</h2>

        {catalogLoading ? (
          <ProductGridSkeleton count={OUR_PRODUCTS_PER_PAGE} gridClassName="nx-our-products-grid" />
        ) : catalogError && visibleOurProducts.length === 0 ? (
          <div className="nx-empty-card">
            <AlertCircle size={36} />
            <h3>Unable to connect to catalog API</h3>
            <p>{catalogError}</p>
            {onReloadCatalog && (
              <button
                type="button"
                className="nx-btn nx-btn-dark"
                onClick={onReloadCatalog}
              >
                Retry Connection
              </button>
            )}
          </div>
        ) : visibleOurProducts.length === 0 ? (
          <div className="nx-empty-card">
            <Package size={36} />
            <h3>No products in catalog yet</h3>
            <p>Add active products via the Admin Dashboard or API to display them here.</p>
          </div>
        ) : (
          <>
            <div className="nx-our-products-grid">
              {visibleOurProducts.map((item, idx) => {
                const targetProd = item.realProduct
                const basePrice = Number(targetProd?.base_price ?? item.base_price ?? 0)
                const salePrice =
                  item.sale_price !== undefined ? Number(item.sale_price) : null
                const hasDiscount = salePrice !== null && basePrice > salePrice
                const displayPrice = Number(hasDiscount ? salePrice : item.price)
                const originalPrice = hasDiscount ? basePrice : null
                const discountPercent =
                  hasDiscount && basePrice > 0
                    ? Math.round(((basePrice - salePrice) / basePrice) * 100)
                    : 0
                const coverImage = targetProd
                  ? getProductPrimaryImage(targetProd, idx)
                  : item.image
                const wishlistId = targetProd?.id ?? item.catalogId
                const isWishlisted = wishlist.some(
                  (savedId) => String(savedId) === String(wishlistId),
                )
                const prodImgKey = `prod-${item.key}-${coverImage}`
                const isProdLoaded = Boolean(loadedImages[prodImgKey])

                return (
                  <div key={item.key} className="nx-op-card">
                    <div
                      className={`nx-op-media-box${!isProdLoaded ? ' nx-media-shimmer-active' : ''}`}
                      onClick={() => {
                        if (targetProd) {
                          onOpenProductDetails(
                            targetProd,
                            hasDiscount ? { basePrice, salePrice: displayPrice } : null,
                          )
                        }
                      }}
                    >
                      <img
                        ref={(el) => {
                          if (el?.complete && !isProdLoaded) {
                            markImageLoaded(prodImgKey)
                          }
                        }}
                        src={coverImage}
                        alt={item.name}
                        className="nx-op-image"
                        loading="lazy"
                        onLoad={() => markImageLoaded(prodImgKey)}
                        onError={(e) => {
                          markImageLoaded(prodImgKey)
                          e.currentTarget.src = NO_IMAGE_PLACEHOLDER
                        }}
                      />

                      {hasDiscount && (
                        <span className="nx-op-discount-badge-left">-{discountPercent}%</span>
                      )}

                      <span className="nx-op-price-badge">
                        {hasDiscount && originalPrice && (
                          <span className="nx-op-original-price">
                            {formatPrice(originalPrice)}
                          </span>
                        )}
                        <span className="nx-op-current-price">{formatPrice(displayPrice)}</span>
                      </span>

                      <div className="nx-op-view-popup">
                        <span className="nx-op-view-pill">View</span>
                      </div>
                    </div>

                    <div className="nx-op-info">
                      <div className="nx-op-title-row">
                        <h3
                          className="nx-op-name"
                          title={item.name}
                          onClick={() => {
                            if (targetProd) {
                              onOpenProductDetails(
                                targetProd,
                                hasDiscount ? { basePrice, salePrice: displayPrice } : null,
                              )
                            }
                          }}
                        >
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          className={`nx-op-heart-btn ${isWishlisted ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleWishlist(wishlistId, item.name)
                          }}
                          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
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

                      <button
                        type="button"
                        className="nx-op-add-btn"
                        onClick={() => onAddOurProductToCart(item)}
                      >
                        {t('ADD TO CART')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* OUR PRODUCTS Pagination */}
            {showOurProductsPagination && totalOurProductsPages > 1 && (
              <div className="nx-pagination" style={{ marginTop: '36px' }}>
                <button
                  type="button"
                  disabled={ourProductsPage <= 1}
                  onClick={() => {
                    setOurProductsPage((p) => Math.max(1, p - 1))
                    const section = document.querySelector('.nx-our-products-section')
                    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                >
                  <ChevronLeft size={16} /> {t('Previous')}
                </button>
                {Array.from({ length: totalOurProductsPages }).map((_, idx) => (
                  <button
                    key={idx + 1}
                    type="button"
                    className={ourProductsPage === idx + 1 ? 'active' : ''}
                    onClick={() => {
                      setOurProductsPage(idx + 1)
                      const section = document.querySelector('.nx-our-products-section')
                      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={ourProductsPage >= totalOurProductsPages}
                  onClick={() => {
                    setOurProductsPage((p) => Math.min(totalOurProductsPages, p + 1))
                    const section = document.querySelector('.nx-our-products-section')
                    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                >
                  {t('Next')} <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default HomePage
