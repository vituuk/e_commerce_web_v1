import React from 'react'

const SIDEBAR_CAT_WIDTHS = ['76%', '62%', '70%', '54%', '66%', '48%']

export interface CategorySliderSkeletonProps {
  count?: number
}

export function CategorySliderSkeleton({ count = 6 }: CategorySliderSkeletonProps) {
  return (
    <div className="nx-category-slider-wrapper" aria-busy="true" aria-label="Loading categories">
      <div className="nx-category-slider-track nx-skeleton-category-track">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="nx-category-card nx-skeleton-card" aria-hidden="true">
            <div className="nx-skeleton-category-media nx-skeleton-box" />
            <div className="nx-skeleton-bars">
              <div className="nx-skeleton-bar-1 nx-skeleton-shimmer" />
              <div className="nx-skeleton-bar-2 nx-skeleton-shimmer" />
              <div className="nx-skeleton-bar-3 nx-skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export interface ProductCardSkeletonProps {
  titleWidth?: string
}

export function ProductCardSkeleton(_props?: ProductCardSkeletonProps) {
  return (
    <article className="nx-op-card nx-skeleton-card" aria-hidden="true">
      <div className="nx-skeleton-product-media nx-skeleton-box" />
      <div className="nx-skeleton-bars">
        <div className="nx-skeleton-bar-1 nx-skeleton-shimmer" />
        <div className="nx-skeleton-bar-2 nx-skeleton-shimmer" />
        <div className="nx-skeleton-bar-3 nx-skeleton-shimmer" />
      </div>
    </article>
  )
}

export interface ProductGridSkeletonProps {
  count?: number
  gridClassName?: string
}

export function ProductGridSkeleton({
  count = 10,
  gridClassName = 'nx-our-products-grid',
}: ProductGridSkeletonProps) {
  return (
    <div className={gridClassName} aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  )
}

export interface CategorySidebarSkeletonProps {
  count?: number
}

export function CategorySidebarSkeleton({ count = 6 }: CategorySidebarSkeletonProps) {
  return (
    <div
      className="nx-filter-list"
      style={{ marginTop: '12px' }}
      aria-busy="true"
      aria-label="Loading categories"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="nx-skeleton-filter-row" aria-hidden="true">
          <span
            className="nx-skeleton-filter-name nx-skeleton-shimmer"
            style={{ width: SIDEBAR_CAT_WIDTHS[idx % SIDEBAR_CAT_WIDTHS.length] }}
          />
          <span className="nx-skeleton-filter-count nx-skeleton-shimmer" />
        </div>
      ))}
    </div>
  )
}

export function ColorFilterSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="nx-filter-color-grid" aria-busy="true" aria-hidden="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="nx-filter-color-item nx-skeleton-card">
          <span className="nx-skeleton-color-circle nx-skeleton-box" />
          <span className="nx-skeleton-color-label nx-skeleton-shimmer" />
        </div>
      ))}
    </div>
  )
}

export function SizeFilterSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="nx-filter-size-group" aria-busy="true" aria-hidden="true">
      <div className="nx-filter-size-grid">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="nx-skeleton-size-tile nx-skeleton-shimmer" />
        ))}
      </div>
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading product details">
      <div className="nx-product-detail-layout">
        <div className="nx-detail-gallery">
          <div className="nx-detail-gallery-container">
            <div
              className="nx-detail-back-btn nx-skeleton-shimmer nx-skeleton-card"
              style={{ border: 'none' }}
            />
            <div className="nx-detail-thumbs">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="nx-thumb-btn nx-skeleton-box nx-skeleton-card" />
              ))}
            </div>
            <div className="nx-detail-main-img-wrap nx-skeleton-box nx-skeleton-card" />
          </div>
        </div>

        <div className="nx-skeleton-detail-info">
          <div
            className="nx-skeleton-line nx-skeleton-shimmer"
            style={{ width: '100%', height: '16px' }}
          />
          <div
            className="nx-skeleton-line nx-skeleton-shimmer"
            style={{ width: '78%', height: '24px' }}
          />
          <div
            className="nx-skeleton-line nx-skeleton-shimmer"
            style={{ width: '46%', height: '22px' }}
          />
          <div style={{ marginTop: '12px' }}>
            <div
              className="nx-skeleton-line nx-skeleton-shimmer"
              style={{ width: '90px', height: '13px', marginBottom: '10px' }}
            />
            <div className="nx-skeleton-swatch-row">
              {Array.from({ length: 4 }).map((_, idx) => (
                <span key={idx} className="nx-skeleton-swatch-circle nx-skeleton-box" />
              ))}
            </div>
          </div>
          <div style={{ marginTop: '8px' }}>
            <div
              className="nx-skeleton-line nx-skeleton-shimmer"
              style={{ width: '80px', height: '13px', marginBottom: '10px' }}
            />
            <div className="nx-skeleton-detail-sizes">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="nx-skeleton-size-tile nx-skeleton-shimmer" />
              ))}
            </div>
          </div>
          <div className="nx-skeleton-detail-cta nx-skeleton-box" />
        </div>
      </div>

      <section className="nx-section">
        <div className="nx-section-header">
          <div>
            <div
              className="nx-skeleton-line nx-skeleton-shimmer"
              style={{ width: '120px', height: '12px', marginBottom: '8px' }}
            />
            <div
              className="nx-skeleton-line nx-skeleton-shimmer"
              style={{ width: '190px', height: '22px' }}
            />
          </div>
        </div>
        <ProductGridSkeleton count={5} gridClassName="nx-product-grid-4" />
      </section>
    </div>
  )
}
