import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Product } from '@/types/product'
import type { ToastType } from '@/types/navigation'
import type { AuthUser } from '@/types/auth'

export function getWishlistStorageKey(user?: AuthUser | null): string {
  if (user && user.id) {
    return `aura_wishlist_user_${user.id}`
  }
  return 'aura_wishlist_guest'
}

function loadWishlistFromStorage(key: string): Array<number | string> {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(key)
    return saved ? (JSON.parse(saved) as Array<number | string>) : []
  } catch {
    return []
  }
}

export function useWishlist(
  products: Product[],
  user?: AuthUser | null,
  showToast?: (message: string, type?: ToastType) => void,
) {
  const currentKey = useMemo(() => getWishlistStorageKey(user), [user?.id])

  const [wishlist, setWishlist] = useState<Array<number | string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        // Clean up legacy non-user-scoped wishlist
        localStorage.removeItem('aura_wishlist')
      } catch {}
    }
    if (!user) return []
    return loadWishlistFromStorage(currentKey)
  })

  // Whenever user changes (login, logout, new user registered),
  // immediately reload the wishlist strictly for that user
  useEffect(() => {
    if (!user) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('aura_wishlist')
          localStorage.removeItem('aura_wishlist_guest')
        } catch {}
      }
      setWishlist([])
      return
    }
    setWishlist(loadWishlistFromStorage(currentKey))
  }, [currentKey, user])

  const wishlistProducts = useMemo<Product[]>(() => {
    if (!wishlist || wishlist.length === 0 || products.length === 0) return []
    return products.filter((p) =>
      wishlist.some((savedId) => String(savedId) === String(p.id)),
    )
  }, [products, wishlist])

  const toggleWishlist = useCallback(
    (prodId: number | string, prodName?: string) => {
      setWishlist((prev) => {
        const exists = prev.some((id) => String(id) === String(prodId))
        const updated = exists
          ? prev.filter((id) => String(id) !== String(prodId))
          : [...prev, prodId]
        try {
          localStorage.setItem(currentKey, JSON.stringify(updated))
        } catch {
          // ignore
        }
        showToast?.(
          exists
            ? `Removed ${prodName || 'item'} from wishlist`
            : `Added ${prodName || 'item'} to wishlist`,
          exists ? 'info' : 'success',
        )
        return updated
      })
    },
    [currentKey, showToast],
  )

  const clearWishlist = useCallback(() => {
    setWishlist([])
    try {
      localStorage.removeItem(currentKey)
    } catch {
      // ignore
    }
    showToast?.('Wishlist cleared', 'info')
  }, [currentKey, showToast])

  return {
    wishlist,
    setWishlist,
    wishlistProducts,
    toggleWishlist,
    clearWishlist,
  }
}
