export function getProductSlug(
  product?: {
    id?: number | string
    name?: string
    slug?: string
    key?: string
  } | null,
): string {
  if (!product) return ''
  if (product.slug) return String(product.slug).trim()
  if (product.key) return String(product.key).trim()
  return String(product.name || `product-${product.id || ''}`)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getPathSlug(path?: string | null): string {
  if (!path || !path.startsWith('/product/')) return ''
  return decodeURIComponent(path.replace(/^\/product\//, '').replace(/\/$/, '')).trim()
}

