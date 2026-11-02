import { resolveImageUrl } from '@/services/lib/axios'
import type { Product } from '@/types/product'

export const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">' +
      '<rect width="600" height="750" fill="#f4f4f5"/>' +
      '<rect x="230" y="305" width="140" height="110" rx="12" fill="none" stroke="#94a3b8" stroke-width="4"/>' +
      '<circle cx="270" cy="342" r="11" fill="#94a3b8"/>' +
      '<path d="M244 398l36-38 28 28 22-20 26 30" fill="none" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<text x="300" y="452" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="500" fill="#64748b">No Product Image</text>' +
      '</svg>',
  )

export function getProductPrimaryImage(
  prod?: Product | null,
  _fallbackIdx: number | string = 0,
  brokenImages: Record<string | number, boolean> = {},
): string {
  const primaryObj = prod?.images?.find((i) => i.is_primary) || prod?.images?.[0]
  const rawUrl = primaryObj?.url || primaryObj?.image_url || prod?.image_url || prod?.image
  const key = prod?.id ?? primaryObj?.id
  if (rawUrl && (key === undefined || !brokenImages[key])) {
    const resolved = resolveImageUrl(rawUrl)
    if (resolved) return resolved
  }
  return NO_IMAGE_PLACEHOLDER
}
