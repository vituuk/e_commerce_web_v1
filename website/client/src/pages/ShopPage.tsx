import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Filter,
  Package,
  Search,
  X,
} from 'lucide-react'
import {
  CategorySidebarSkeleton,
  ColorFilterSkeleton,
  ProductGridSkeleton,
  SizeFilterSkeleton,
} from '@/components/CatalogSkeletons'
import { ProductCard } from '@/components/ProductCard'
import { ITEMS_PER_PAGE } from '@/constants/storefront'
import { getColorHex } from '@/constants/studioAssets'
import { formatPrice } from '@/utils/currency'
import { useI18n } from '@/assets/i18n'
import type { Category } from '@/types/category'
import type {
  AvailabilityFilter,
  PriceRangePreset,
  SortOption,
} from '@/types/navigation'
import type { Product } from '@/types/product'

export interface ShopPageProps {
  categories: Category[]
  products: Product[]
  catalogLoading?: boolean
  catalogError?: string | null
  onReloadCatalog?: () => void
  searchQuery: string
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  selectedCategory: number | string
  setSelectedCategory: React.Dispatch<React.SetStateAction<number | string>>
  selectedSize: string
  setSelectedSize: React.Dispatch<React.SetStateAction<string>>
  selectedColor: string
  setSelectedColor: React.Dispatch<React.SetStateAction<string>>
  priceRange: PriceRangePreset
  setPriceRange: React.Dispatch<React.SetStateAction<PriceRangePreset>>
  appliedMinPrice: number | null
  setAppliedMinPrice: React.Dispatch<React.SetStateAction<number | null>>
  appliedMaxPrice: number | null
  setAppliedMaxPrice: React.Dispatch<React.SetStateAction<number | null>>
  availabilityFilter: AvailabilityFilter
  setAvailabilityFilter: React.Dispatch<React.SetStateAction<AvailabilityFilter>>
  sortBy: SortOption
  setSortBy: React.Dispatch<React.SetStateAction<SortOption>>
  mobileFiltersOpen: boolean
  setMobileFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>
  brokenImages: Record<string | number, boolean>
  setBrokenImages: React.Dispatch<React.SetStateAction<Record<string | number, boolean>>>
  wishlist: Array<number | string>
  onToggleWishlist: (prodId: number | string, prodName?: string) => void
  onOpenProductDetails: (product: Product) => void
  onAddProductToCart: (product: Product) => void
  getProductPrimaryImage: (prod?: Product | null, fallbackIdx?: number | string) => string
}

export function getProductDisplayPrice(prod: Product): number {
  const variants = prod.variants || []
  const preferredVariant = variants.find((v) => Number(v.stock_qty || 0) > 0) || variants[0]
  const vPrice =
    preferredVariant?.final_price !== undefined && preferredVariant?.final_price !== null
      ? Number(preferredVariant.final_price)
      : preferredVariant?.price !== undefined && preferredVariant?.price !== null
      ? Number(preferredVariant.price)
      : null
  const basePrice = Number(prod.base_price ?? vPrice ?? 0)
  const explicitSalePrice =
    prod.sale_price !== null && prod.sale_price !== undefined ? Number(prod.sale_price) : null
  const salePrice =
    explicitSalePrice !== null && explicitSalePrice < basePrice
      ? explicitSalePrice
      : vPrice !== null && basePrice > 0 && vPrice < basePrice
      ? vPrice
      : null
  const hasDiscount = salePrice !== null && basePrice > salePrice
  if (hasDiscount && salePrice !== null) return salePrice
  return vPrice ?? (basePrice > 0 ? basePrice : Number(prod.price || 0))
}

export function ShopPage({
  categories,
  products,
  catalogLoading = false,
  catalogError = null,
  onReloadCatalog,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedSize,
  setSelectedSize,
  selectedColor,
  setSelectedColor,
  priceRange,
  setPriceRange,
  appliedMinPrice,
  setAppliedMinPrice,
  appliedMaxPrice,
  setAppliedMaxPrice,
  availabilityFilter,
  setAvailabilityFilter,
  sortBy,
  setSortBy,
  mobileFiltersOpen,
  setMobileFiltersOpen,
  brokenImages,
  setBrokenImages,
  wishlist,
  onToggleWishlist,
  onOpenProductDetails,
  onAddProductToCart,
  getProductPrimaryImage,
}: ShopPageProps) {
  const { t } = useI18n()
  const [currentPage, setCurrentPage] = useState(1)
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(true)
  const [priceFilterOpen, setPriceFilterOpen] = useState(true)
  const [sortFilterOpen, setSortFilterOpen] = useState(true)
  const [colorFilterOpen, setColorFilterOpen] = useState(true)
  const [sizeFilterOpen, setSizeFilterOpen] = useState(true)
  const [availabilityFilterOpen, setAvailabilityFilterOpen] = useState(true)
  const [colorViewMore, setColorViewMore] = useState(false)
  const [categoryViewMore, setCategoryViewMore] = useState(false)
  const [categorySwitching, setCategorySwitching] = useState(
    () => !catalogLoading && products.length > 0,
  )
  const prevFiltersRef = React.useRef({
    cat: selectedCategory,
    avail: availabilityFilter,
    size: selectedSize,
    color: selectedColor,
  })

  useEffect(() => {
    if (!categorySwitching) return
    const timer = window.setTimeout(() => {
      setCategorySwitching(false)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [categorySwitching])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, searchQuery, selectedSize, selectedColor, priceRange, availabilityFilter])

  useEffect(() => {
    const prev = prevFiltersRef.current
    const changed =
      prev.cat !== selectedCategory ||
      prev.avail !== availabilityFilter ||
      prev.size !== selectedSize ||
      prev.color !== selectedColor

    prevFiltersRef.current = {
      cat: selectedCategory,
      avail: availabilityFilter,
      size: selectedSize,
      color: selectedColor,
    }

    if (changed && !catalogLoading && products.length > 0) {
      setCategorySwitching(true)
    }
  }, [selectedCategory, availabilityFilter, selectedSize, selectedColor, catalogLoading, products.length])

  const allAvailableSizes = useMemo(() => {
    const map = new Map<string, string>()
    products.forEach((p) =>
      (p.variants || []).forEach((v) => {
        if (v.size && String(v.size).trim()) {
          const trimmed = String(v.size).trim()
          const lower = trimmed.toLowerCase()
          if (!map.has(lower)) {
            map.set(lower, trimmed)
          }
        }
      }),
    )
    const order = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
    return Array.from(map.values()).sort((a, b) => {
      const ia = order.indexOf(a.toUpperCase())
      const ib = order.indexOf(b.toUpperCase())
      if (ia !== -1 && ib !== -1) return ia - ib
      if (ia !== -1) return -1
      if (ib !== -1) return 1
      const na = Number(a)
      const nb = Number(b)
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
      return String(a).localeCompare(String(b))
    })
  }, [products])

  const { numericSizesList, standardSizesList } = useMemo(() => {
    const numeric: string[] = []
    const standard: string[] = []
    allAvailableSizes.forEach((sz) => {
      if (/^\d+(\.\d+)?$/.test(sz)) {
        numeric.push(sz)
      } else {
        standard.push(sz)
      }
    })
    return { numericSizesList: numeric, standardSizesList: standard }
  }, [allAvailableSizes])

  const filterColorsList = useMemo(() => {
    const seen = new Map<string, { name: string; hex: string }>()
    products.forEach((p) =>
      (p.variants || []).forEach((v) => {
        if (!v.color || !String(v.color).trim()) return
        const trimmed = String(v.color).trim()
        const lower = trimmed.toLowerCase()
        if (!seen.has(lower)) {
          seen.set(lower, {
            name: trimmed,
            hex: getColorHex(trimmed),
          })
        }
      }),
    )
    return Array.from(seen.values())
  }, [products])

  const visibleFilterColors = colorViewMore ? filterColorsList : filterColorsList.slice(0, 9)

  const maxPriceLimit = useMemo(() => {
    if (!products || products.length === 0) return 100
    let highest = 0
    products.forEach((p) => {
      const displayP = getProductDisplayPrice(p)
      if (displayP > highest) highest = displayP

      ;(p.variants || []).forEach((v) => {
        const vp = Number(v.final_price ?? v.price ?? 0)
        if (vp > highest) highest = vp
      })
    })

    if (highest <= 0) return 100
    // Dynamic max ceiling based on the most expensive product (rounded up to nearest $10)
    return Math.ceil(highest / 10) * 10
  }, [products])

  const currentSliderMin = appliedMinPrice !== null ? appliedMinPrice : 0
  const currentSliderMax = appliedMaxPrice !== null ? appliedMaxPrice : maxPriceLimit

  const handleSliderMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(1)
    const val = Math.min(Number(e.target.value), currentSliderMax - 5)
    setAppliedMinPrice(val <= 0 ? null : val)
    if (val <= 0 && currentSliderMax >= maxPriceLimit) {
      setPriceRange('all')
    } else {
      setPriceRange('custom')
    }
  }

  const handleSliderMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(1)
    const val = Math.max(Number(e.target.value), currentSliderMin + 5)
    setAppliedMaxPrice(val >= maxPriceLimit ? null : val)
    if (currentSliderMin <= 0 && val >= maxPriceLimit) {
      setPriceRange('all')
    } else {
      setPriceRange('custom')
    }
  }

  const handleClearPrice = () => {
    setCurrentPage(1)
    setPriceRange('all')
    setAppliedMinPrice(null)
    setAppliedMaxPrice(null)
  }

  const handleResetAllFilters = () => {
    setSelectedCategory('all')
    setSelectedSize('all')
    setSelectedColor('all')
    setPriceRange('all')
    setAppliedMinPrice(null)
    setAppliedMaxPrice(null)
    setAvailabilityFilter('all')
    setSearchQuery('')
    setSortBy('newest')
  }

  const filteredShopProducts = useMemo(() => {
    const list = products.filter((prod) => {
      if (selectedCategory !== 'all') {
        const catIdMatch = String(prod.categoryId ?? prod.category?.id) === String(selectedCategory)
        const catSlugMatch =
          prod.category?.slug?.toLowerCase() === String(selectedCategory).toLowerCase() ||
          prod.category?.name?.toLowerCase() === String(selectedCategory).toLowerCase()
        if (!catIdMatch && !catSlugMatch) return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const inName = prod.name?.toLowerCase().includes(q)
        const inDesc = prod.description?.toLowerCase().includes(q)
        const inCat = prod.category?.name?.toLowerCase().includes(q)
        const inSku = (prod.variants || []).some(
          (v) =>
            v.sku?.toLowerCase().includes(q) ||
            v.color?.toLowerCase().includes(q) ||
            v.size?.toLowerCase().includes(q),
        )
        if (!inName && !inDesc && !inCat && !inSku) return false
      }

      if (selectedSize !== 'all') {
        const targetSz = String(selectedSize).toLowerCase()
        const hasSize = (prod.variants || []).some(
          (v) => String(v.size || '').trim().toLowerCase() === targetSz,
        )
        if (!hasSize) return false
      }

      if (selectedColor !== 'all') {
        const targetCol = String(selectedColor).toLowerCase()
        const hasColor = (prod.variants || []).some(
          (v) => String(v.color || '').trim().toLowerCase() === targetCol,
        )
        if (!hasColor) return false
      }

      const effectivePrice = getProductDisplayPrice(prod)
      if (appliedMinPrice !== null && !isNaN(appliedMinPrice) && effectivePrice < appliedMinPrice) {
        return false
      }
      if (appliedMaxPrice !== null && !isNaN(appliedMaxPrice) && effectivePrice > appliedMaxPrice) {
        return false
      }

      const totalStock = (prod.variants || []).reduce(
        (sum, v) => sum + Number(v.stock_qty || 0),
        0,
      )
      if (availabilityFilter === 'in_stock' && totalStock <= 0) return false
      if (availabilityFilter === 'on_sale') {
        const baseP = Number(prod.base_price || 0)
        const hasExplicitSale = Boolean(prod.sale_price && Number(prod.sale_price) < baseP)
        const hasVariantSale = (prod.variants || []).some((v) => {
          const vPrice =
            v.final_price !== undefined
              ? Number(v.final_price)
              : v.price !== null && v.price !== undefined
              ? Number(v.price)
              : baseP
          return baseP > 0 && vPrice < baseP
        })
        if (!hasExplicitSale && !hasVariantSale && prod.category?.slug !== 'sale') return false
      }

      return true
    })

    return [...list].sort((a, b) => {
      const priceA = getProductDisplayPrice(a)
      const priceB = getProductDisplayPrice(b)
      if (sortBy === 'price_asc') return priceA - priceB
      if (sortBy === 'price_desc') return priceB - priceA
      if (sortBy === 'popularity') {
        const rDiff =
          Number(b.reviewsSummary?.average_rating || 0) -
          Number(a.reviewsSummary?.average_rating || 0)
        if (rDiff !== 0) return rDiff
        return (
          Number(b.reviewsSummary?.total_reviews || 0) -
          Number(a.reviewsSummary?.total_reviews || 0)
        )
      }
      return Number(b.id || 0) - Number(a.id || 0)
    })
  }, [
    products,
    selectedCategory,
    searchQuery,
    selectedSize,
    selectedColor,
    appliedMinPrice,
    appliedMaxPrice,
    availabilityFilter,
    sortBy,
  ])

  const totalPages = Math.max(1, Math.ceil(filteredShopProducts.length / ITEMS_PER_PAGE))
  const paginatedShopProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredShopProducts.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredShopProducts, currentPage])

  const activeCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedSize !== 'all' ? 1 : 0) +
    (selectedColor !== 'all' ? 1 : 0) +
    (priceRange !== 'all' ? 1 : 0) +
    (availabilityFilter !== 'all' ? 1 : 0) +
    (sortBy !== 'newest' ? 1 : 0)

  return (
    <div className="nx-container nx-page-shop">
      <div className="nx-page-banner">
        <div>
          <h1>Shop Collection</h1>
          <p>
            Filter by category, price, size, color, and availability. Select any product to view
            full gallery, variants, and customer reviews.
          </p>
        </div>
      </div>

      <div className="nx-shop-layout">
        {/* Mobile Backdrop for Filter Drawer */}
        {mobileFiltersOpen && (
          <div
            className="nx-shop-sidebar-backdrop"
            onClick={() => setMobileFiltersOpen(false)}
          />
        )}

        {/* Left Sidebar Filters */}
        <aside className={`nx-shop-sidebar ${mobileFiltersOpen ? 'mobile-open' : ''}`}>
          <div className="nx-filter-card">
            <div className="nx-filter-head">
              <strong>
                <Filter size={15} /> Filters
              </strong>
              <div className="nx-filter-head-actions">
                <button
                  type="button"
                  className="nx-reset-link"
                  onClick={handleResetAllFilters}
                >
                  Reset All
                </button>
                <button
                  type="button"
                  className="nx-mobile-filter-close"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Close filters"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* 1. Sort By Filter */}
            <div className="nx-filter-block">
              <button
                type="button"
                className="nx-filter-toggle-header"
                onClick={() => setSortFilterOpen(!sortFilterOpen)}
              >
                <h4>
                  SORT BY{' '}
                  {sortBy !== 'newest' && (
                    <span className="nx-filter-active-tag">
                      (
                      {sortBy === 'price_asc'
                        ? 'Low to High'
                        : sortBy === 'price_desc'
                        ? 'High to Low'
                        : sortBy === 'popularity'
                        ? 'Popularity'
                        : sortBy}
                      )
                    </span>
                  )}
                </h4>
                {sortFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {sortFilterOpen && (
                <div className="nx-filter-list" style={{ marginTop: '12px' }}>
                  {(
                    [
                      { id: 'newest', label: 'Newest' },
                      { id: 'price_asc', label: 'Price: Low to High' },
                      { id: 'price_desc', label: 'Price: High to Low' },
                      { id: 'popularity', label: 'Popularity (Review Rating)' },
                    ] as Array<{ id: SortOption; label: string }>
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`nx-filter-item ${sortBy === opt.id ? 'active' : ''}`}
                      onClick={() => setSortBy(opt.id)}
                    >
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <hr className="nx-filter-divider" />

            {/* 2. Category Filter (Live API Categories) */}
            <div className="nx-filter-block">
              <button
                type="button"
                className="nx-filter-toggle-header"
                onClick={() => setCategoryFilterOpen(!categoryFilterOpen)}
              >
                <h4>
                  Category{' '}
                  {selectedCategory !== 'all' && (
                    <span className="nx-filter-active-tag">
                      (
                      {categories.find((c) => String(c.id) === String(selectedCategory))?.name ||
                        selectedCategory}
                      )
                    </span>
                  )}
                </h4>
                {categoryFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {categoryFilterOpen &&
                (catalogLoading ? (
                  <CategorySidebarSkeleton count={6} />
                ) : (
                  <div className="nx-filter-list" style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      className={`nx-filter-item ${selectedCategory === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedCategory('all')}
                    >
                      <span>All Categories</span>
                      <span className="nx-count-badge">{products.length}</span>
                    </button>
                    {(() => {
                      const isHiddenCategorySelected =
                        !categoryViewMore &&
                        selectedCategory !== 'all' &&
                        categories
                          .slice(5)
                          .some((c) => String(c.id) === String(selectedCategory))

                      const visibleCats = categoryViewMore
                        ? categories
                        : isHiddenCategorySelected
                        ? categories
                            .slice(0, 5)
                            .concat(
                              categories.filter((c) => String(c.id) === String(selectedCategory)),
                            )
                        : categories.slice(0, 5)

                      return visibleCats.map((cat) => {
                        const count = products.filter(
                          (p) => String(p.categoryId ?? p.category?.id) === String(cat.id),
                        ).length
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            className={`nx-filter-item ${
                              String(selectedCategory) === String(cat.id) ? 'active' : ''
                            }`}
                            onClick={() =>
                              setSelectedCategory(
                                String(selectedCategory) === String(cat.id) ? 'all' : cat.id,
                              )
                            }
                          >
                            <span>{cat.name}</span>
                            <span className="nx-count-badge">{count}</span>
                          </button>
                        )
                      })
                    })()}

                    {categories.length > 5 && (
                      <button
                        type="button"
                        className="nx-filter-view-more"
                        onClick={() => setCategoryViewMore(!categoryViewMore)}
                      >
                        {categoryViewMore ? 'View Less -' : 'View More +'}
                      </button>
                    )}
                  </div>
                ))}
            </div>

            <hr className="nx-filter-divider" />

            {/* 3. Price Filter */}
            <div className="nx-filter-block">
              <button
                type="button"
                className="nx-filter-toggle-header"
                onClick={() => setPriceFilterOpen(!priceFilterOpen)}
              >
                <h4>
                  Price{' '}
                  {(appliedMinPrice !== null || appliedMaxPrice !== null) && (
                    <span className="nx-filter-active-tag">
                      (
                      {appliedMinPrice !== null && appliedMaxPrice !== null
                        ? `$${appliedMinPrice} – $${appliedMaxPrice}`
                        : appliedMinPrice !== null
                        ? `Over $${appliedMinPrice}`
                        : `Under $${appliedMaxPrice}`}
                      )
                    </span>
                  )}
                </h4>
                {priceFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {priceFilterOpen && (
                <div style={{ marginTop: '12px' }}>
                  {/* Custom Price Range Dual Slider */}
                  <div className="nx-custom-price-wrap" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                    <div className="nx-price-slider-header">
                      <span className="nx-custom-price-label">Price Range</span>
                      <span className="nx-price-slider-display">
                        ${currentSliderMin} – $
                        {currentSliderMax >= maxPriceLimit
                          ? `${maxPriceLimit}+`
                          : currentSliderMax}
                      </span>
                    </div>

                    <div className="nx-dual-slider-wrap">
                      <div className="nx-dual-slider-track-bg" />
                      <div
                        className="nx-dual-slider-track-fill"
                        style={{
                          left: `${(currentSliderMin / maxPriceLimit) * 100}%`,
                          width: `${Math.max(
                            0,
                            ((currentSliderMax - currentSliderMin) / maxPriceLimit) * 100,
                          )}%`,
                        }}
                      />
                      <input
                        type="range"
                        min="0"
                        max={maxPriceLimit}
                        step="1"
                        value={currentSliderMin}
                        onChange={handleSliderMinChange}
                        className="nx-dual-range-input nx-dual-range-input-left"
                        style={{ zIndex: currentSliderMin > maxPriceLimit * 0.5 ? 5 : 4 }}
                        aria-label="Minimum price"
                      />
                      <input
                        type="range"
                        min="0"
                        max={maxPriceLimit}
                        step="1"
                        value={currentSliderMax}
                        onChange={handleSliderMaxChange}
                        className="nx-dual-range-input nx-dual-range-input-right"
                        style={{ zIndex: currentSliderMin > maxPriceLimit * 0.5 ? 4 : 5 }}
                        aria-label="Maximum price"
                      />
                    </div>

                    <div className="nx-price-slider-limits">
                      <span>$0</span>
                      {(appliedMinPrice !== null || appliedMaxPrice !== null) && (
                        <button
                          type="button"
                          className="nx-price-slider-reset-btn"
                          onClick={handleClearPrice}
                        >
                          Reset
                        </button>
                      )}
                      <span>${maxPriceLimit}+</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <hr className="nx-filter-divider" />

            {/* 4. Color Filter (Derived Strictly from API Product Variants) */}
            <div className="nx-filter-block">
              <button
                type="button"
                className="nx-filter-toggle-header"
                onClick={() => setColorFilterOpen(!colorFilterOpen)}
              >
                <h4>
                  Color{' '}
                  {selectedColor !== 'all' && (
                    <span className="nx-filter-active-tag">({selectedColor})</span>
                  )}
                </h4>
                {colorFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {colorFilterOpen && (
                <>
                  {catalogLoading ? (
                    <ColorFilterSkeleton count={6} />
                  ) : filterColorsList.length === 0 ? (
                    <p className="nx-muted" style={{ marginTop: '10px' }}>
                      No color variants in catalog
                    </p>
                  ) : (
                    <>
                      <div className="nx-filter-color-grid">
                        {visibleFilterColors.map((c) => {
                          const isSelected =
                            Boolean(selectedColor) &&
                            selectedColor.toLowerCase() === c.name.toLowerCase()
                          return (
                            <button
                              key={c.name}
                              type="button"
                              className={`nx-filter-color-item ${isSelected ? 'active' : ''}`}
                              onClick={() => setSelectedColor(isSelected ? 'all' : c.name)}
                              title={c.name}
                            >
                              <span
                                className="nx-filter-color-circle"
                                style={{ backgroundColor: c.hex }}
                              />
                              <span className="nx-filter-color-name">{c.name}</span>
                            </button>
                          )
                        })}
                      </div>

                      {filterColorsList.length > 9 && (
                        <button
                          type="button"
                          className="nx-filter-view-more"
                          onClick={() => setColorViewMore(!colorViewMore)}
                        >
                          {colorViewMore ? 'View Less -' : 'View More +'}
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            <hr className="nx-filter-divider" />

            {/* 5. Size Filter (Derived Strictly from API Product Variants) */}
            <div className="nx-filter-block">
              <button
                type="button"
                className="nx-filter-toggle-header"
                onClick={() => setSizeFilterOpen(!sizeFilterOpen)}
              >
                <h4>
                  Size{' '}
                  {selectedSize !== 'all' && (
                    <span className="nx-filter-active-tag">({selectedSize})</span>
                  )}
                </h4>
                {sizeFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {sizeFilterOpen && (
                <>
                  {catalogLoading ? (
                    <SizeFilterSkeleton count={8} />
                  ) : allAvailableSizes.length === 0 ? (
                    <p className="nx-muted" style={{ marginTop: '10px' }}>
                      No size variants in catalog
                    </p>
                  ) : (
                    <>
                      {numericSizesList.length > 0 && (
                        <div className="nx-filter-size-group">
                          <span className="nx-filter-size-label">Numeric</span>
                          <div className="nx-filter-size-grid">
                            {numericSizesList.map((sz) => {
                              const isSelected =
                                String(selectedSize).toLowerCase() === String(sz).toLowerCase()
                              return (
                                <button
                                  key={sz}
                                  type="button"
                                  className={`nx-filter-size-tile ${isSelected ? 'active' : ''}`}
                                  onClick={() => setSelectedSize(isSelected ? 'all' : sz)}
                                >
                                  {sz}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {standardSizesList.length > 0 && (
                        <div
                          className="nx-filter-size-group"
                          style={numericSizesList.length > 0 ? { marginTop: '14px' } : undefined}
                        >
                          <span className="nx-filter-size-label">Sizes</span>
                          <div className="nx-filter-size-grid">
                            {standardSizesList.map((sz) => {
                              const isSelected =
                                String(selectedSize).toLowerCase() === String(sz).toLowerCase()
                              return (
                                <button
                                  key={sz}
                                  type="button"
                                  className={`nx-filter-size-tile ${isSelected ? 'active' : ''}`}
                                  onClick={() => setSelectedSize(isSelected ? 'all' : sz)}
                                >
                                  {sz}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            <hr className="nx-filter-divider" />

            {/* 6. Availability Filter */}
            <div className="nx-filter-block">
              <button
                type="button"
                className="nx-filter-toggle-header"
                onClick={() => setAvailabilityFilterOpen(!availabilityFilterOpen)}
              >
                <h4>
                  Availability{' '}
                  {availabilityFilter !== 'all' && (
                    <span className="nx-filter-active-tag">
                      ({availabilityFilter === 'in_stock' ? 'In Stock' : 'On Sale'})
                    </span>
                  )}
                </h4>
                {availabilityFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {availabilityFilterOpen && (
                <div className="nx-filter-list" style={{ marginTop: '12px' }}>
                  {(
                    [
                      { id: 'all', label: 'All Products' },
                      { id: 'in_stock', label: 'In Stock Only' },
                      { id: 'on_sale', label: 'On Sale' },
                    ] as Array<{ id: AvailabilityFilter; label: string }>
                  ).map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      className={`nx-filter-item ${availabilityFilter === av.id ? 'active' : ''}`}
                      onClick={() =>
                        setAvailabilityFilter(availabilityFilter === av.id ? 'all' : av.id)
                      }
                    >
                      <span>{av.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Apply / View Products Sticky Footer */}
            <div className="nx-mobile-filter-footer">
              <button
                type="button"
                className="nx-btn nx-btn-dark nx-btn-block"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Show {filteredShopProducts.length} Products
              </button>
            </div>
          </div>
        </aside>

        {/* Right Product Grid & Sorting */}
        <div className="nx-shop-content">
          <div className="nx-shop-toolbar">
            <div className="nx-shop-search-box">
              <Search size={17} className="nx-shop-search-icon" />
              <input
                type="text"
                className="nx-shop-search-input"
                placeholder={t('Search products')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="nx-shop-search-clear"
                  onClick={() => {
                    setSearchQuery('')
                    setCurrentPage(1)
                  }}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="button"
              className={`nx-mobile-filter-btn ${
                mobileFiltersOpen || activeCount > 0 ? 'has-active' : ''
              }`}
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            >
              <Filter size={16} />
              <span>{t('Filters')}</span>
              {activeCount > 0 && (
                <span className="nx-mobile-filter-badge">{activeCount}</span>
              )}
            </button>
          </div>

          {catalogLoading || categorySwitching ? (
            <ProductGridSkeleton count={ITEMS_PER_PAGE} gridClassName="nx-product-grid-3" />
          ) : catalogError && products.length === 0 ? (
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
          ) : paginatedShopProducts.length === 0 ? (
            <div className="nx-empty-card">
              <Package size={36} />
              <h3>{t('No products match your active filters')}</h3>
              <p>{t('Try resetting your size, color, price, or category filters.')}</p>
              <button
                type="button"
                className="nx-btn nx-btn-dark"
                onClick={handleResetAllFilters}
              >
                {t('Clear All Filters')}
              </button>
            </div>
          ) : (
            <>
              <div className="nx-product-grid-3">
                {paginatedShopProducts.map((prod, idx) => (
                  <ProductCard
                    key={prod.id}
                    prod={prod}
                    idx={idx}
                    onOpen={onOpenProductDetails}
                    formatPrice={formatPrice}
                    getProductPrimaryImage={getProductPrimaryImage}
                    brokenImages={brokenImages}
                    setBrokenImages={setBrokenImages}
                    onAddToCart={onAddProductToCart}
                    isWishlisted={wishlist.some(
                      (savedId) => String(savedId) === String(prod.id),
                    )}
                    onToggleWishlist={onToggleWishlist}
                  />
                ))}
              </div>

              {totalPages > 1 && filteredShopProducts.length > ITEMS_PER_PAGE && (
                <div className="nx-pagination">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={16} /> {t('Previous')}
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx + 1}
                      type="button"
                      className={currentPage === idx + 1 ? 'active' : ''}
                      onClick={() => setCurrentPage(idx + 1)}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    {t('Next')} <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShopPage
