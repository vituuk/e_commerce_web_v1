import React from 'react'
import type { NavHighlightKey, StorefrontPage } from '@/types/navigation'

export interface MobileBottomNavProps {
  activePage: StorefrontPage
  activeNavHighlight: NavHighlightKey
  onNavigateHeaderCategory: (navKey: string) => void
}

export function MobileBottomNav({
  activePage,
  activeNavHighlight,
  onNavigateHeaderCategory,
}: MobileBottomNavProps) {
  return (
    <nav className="nx-mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="nx-mobile-bottom-nav-inner">
        {[
          { key: 'home', label: 'Home' },
          { key: 'shop', label: 'Shop' },
          { key: 'new-arrivals', label: 'New Arrivals' },
          { key: 'men', label: 'Men' },
          { key: 'women', label: 'Women' },
        ].map((item) => {
          const isActive =
            activeNavHighlight === item.key &&
            (activePage === 'home' || activePage === 'shop')
          return (
            <button
              key={item.key}
              type="button"
              className={`nx-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => onNavigateHeaderCategory(item.key)}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileBottomNav
