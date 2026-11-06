import React, { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { authIcon, bagIcon, hearthIcon } from '@/assets/img'
import { enFlag, khFlag } from '@/assets/logo'
import { useI18n } from '@/assets/i18n'
import { resolveImageUrl } from '@/api/client'
import type { AuthUser } from '@/types/auth'
import type {
  NavigateOptions,
  NavHighlightKey,
  StorefrontPage,
  ToastType,
} from '@/types/navigation'

export interface HeaderProps {
  activePage: StorefrontPage
  activeNavHighlight: NavHighlightKey
  searchQuery: string
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  user: AuthUser | null
  wishlistCount: number
  isWishlistOpen: boolean
  setIsWishlistOpen: React.Dispatch<React.SetStateAction<boolean>>
  cartTotalQty: number
  onNavigateHeaderCategory: (navKey: string) => void
  onNavigatePage: (page: StorefrontPage, options?: NavigateOptions) => void
  onOpenAuthModal: () => void
  showToast: (message: string, type?: ToastType) => void
}

export function Header({
  activePage,
  activeNavHighlight,
  searchQuery,
  setSearchQuery,
  user,
  wishlistCount,
  isWishlistOpen,
  setIsWishlistOpen,
  cartTotalQty,
  onNavigateHeaderCategory,
  onNavigatePage,
  onOpenAuthModal,
  showToast,
}: HeaderProps) {
  const [authSvgFailed, setAuthSvgFailed] = useState(false)
  const [bagSvgFailed, setBagSvgFailed] = useState(false)
  const [hearthSvgFailed, setHearthSvgFailed] = useState(false)
  const [headerAvatarFailed, setHeaderAvatarFailed] = useState(false)

  const { lang, setLang, t } = useI18n()

  useEffect(() => {
    setHeaderAvatarFailed(false)
  }, [user?.avatar])
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const langDropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLangMenuOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsLangMenuOpen(false)
      }
    }
    if (isLangMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLangMenuOpen])

  return (
    <header className="nx-header">
      <div className="nx-container nx-header-inner">
        <div className="nx-header-left">
          <button
            type="button"
            className="nx-brand"
            onClick={() => onNavigateHeaderCategory('home')}
          >
            <span className="nx-brand-mark">A</span>
            <div className="nx-brand-copy">
              <strong>AURA CLOTHES</strong>
              <span>Modern Clothing Store</span>
            </div>
          </button>

          <nav className="nx-nav">
            {[
              { key: 'home', label: t('Home') },
              { key: 'shop', label: t('Shop') },
              { key: 'new-arrivals', label: t('New Arrivals') },
              { key: 'men', label: t('Men') },
              { key: 'women', label: t('Women') },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={`nx-nav-link ${
                  activeNavHighlight === item.key &&
                  (activePage === 'home' || activePage === 'shop')
                    ? 'active'
                    : ''
                } ${item.key === 'sale' ? 'is-sale' : ''}`}
                onClick={() => onNavigateHeaderCategory(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="nx-header-right">
          {/* Language Selector Dropdown (Left of Search) */}
          <div className="nx-lang-dropdown-wrap" ref={langDropdownRef}>
            <button
              type="button"
              className="nx-lang-trigger-btn"
              onClick={() => setIsLangMenuOpen((prev) => !prev)}
              aria-expanded={isLangMenuOpen}
              aria-label="Select language"
            >
              <img
                src={lang === 'kh' ? khFlag : enFlag}
                alt={lang === 'kh' ? 'Khmer' : 'English'}
                style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px' }}
              />
              <span className="nx-lang-trigger-text">
                {lang === 'kh' ? 'ភាសាខ្មែរ' : 'English'}
              </span>
            </button>

            {isLangMenuOpen && (
              <div className="nx-lang-menu">
                <div className="nx-lang-menu-header">{t('Languages')}</div>
                <div className="nx-lang-menu-divider" />
                <div className="nx-lang-menu-list">
                  <button
                    type="button"
                    className={`nx-lang-option ${lang === 'en' ? 'active' : ''}`}
                    onClick={() => {
                      setLang('en')
                      setIsLangMenuOpen(false)
                      showToast('Language switched to English', 'success')
                    }}
                  >
                    <img
                      src={enFlag}
                      alt="English"
                      style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px' }}
                    />
                    <span>English</span>
                  </button>
                  <button
                    type="button"
                    className={`nx-lang-option ${lang === 'kh' ? 'active' : ''}`}
                    onClick={() => {
                      setLang('kh')
                      setIsLangMenuOpen(false)
                      showToast('ភាសាត្រូវបានប្តូរទៅជាភាសាខ្មែរ (Khmer)', 'success')
                    }}
                  >
                    <img
                      src={khFlag}
                      alt="Khmer"
                      style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px' }}
                    />
                    <span>ភាសាខ្មែរ</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <form
            className="nx-search-bar"
            onSubmit={(e) => {
              e.preventDefault()
              onNavigatePage('shop')
            }}
          >
            <Search size={15} />
            <input
              type="text"
              placeholder={t('Search clothing')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (activePage !== 'shop') {
                  onNavigatePage('shop', {
                    pushHistory: false,
                    replaceHistory: true,
                    noScroll: true,
                  })
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="nx-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <X size={13} />
              </button>
            )}
          </form>

          {user ? (
            <button
              type="button"
              className={`nx-account-btn ${activePage === 'account' ? 'active' : ''}`}
              onClick={() => onNavigatePage('account')}
            >
              <span className="nx-avatar-circle">
                {user.avatar && !headerAvatarFailed && resolveImageUrl(user.avatar) ? (
                  <img
                    src={resolveImageUrl(user.avatar)!}
                    alt={user.firstName || 'User'}
                    referrerPolicy="no-referrer"
                    onError={() => setHeaderAvatarFailed(true)}
                  />
                ) : (
                  (user.firstName?.[0] || user.email?.[0] || 'C').toUpperCase()
                )}
              </span>
              <span>{user.firstName || t('My Account')}</span>
            </button>
          ) : (
            <button
              type="button"
              className="nx-account-btn nx-account-icon-only"
              onClick={onOpenAuthModal}
              title={t('Sign In / Register')}
              aria-label={t('Sign In / Register')}
            >
              {!authSvgFailed ? (
                <img
                  src={authIcon}
                  alt="Sign In"
                  className="nx-auth-icon"
                  onError={() => setAuthSvgFailed(true)}
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="nx-auth-icon"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </button>
          )}

          {/* Wishlist / Heart Icon near Bag Icon */}
          <button
            type="button"
            className={`nx-heart-btn ${isWishlistOpen ? 'active' : ''}`}
            onClick={() => setIsWishlistOpen((prev) => !prev)}
            title={t('Wishlist')}
            aria-label={t('Wishlist')}
          >
            {!hearthSvgFailed ? (
              <img
                src={hearthIcon}
                alt="Wishlist"
                className="nx-heart-icon"
                onError={() => setHearthSvgFailed(true)}
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0f172a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="nx-heart-icon"
              >
                <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
              </svg>
            )}
            {wishlistCount > 0 && (
              <span className="nx-cart-badge-dot nx-heart-badge-dot">{wishlistCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`nx-cart-btn ${activePage === 'cart' ? 'active' : ''}`}
            onClick={() => onNavigatePage('cart')}
            title={t('Cart')}
            aria-label={t('Cart')}
          >
            {!bagSvgFailed ? (
              <img
                src={bagIcon}
                alt="Cart"
                className="nx-cart-icon"
                onError={() => setBagSvgFailed(true)}
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0f172a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="nx-cart-icon"
              >
                <path d="M2.048 18.566A2 2 0 0 0 4 21h16a2 2 0 0 0 1.952-2.434l-2-9A2 2 0 0 0 18 8H6a2 2 0 0 0-1.952 1.566z" />
                <path d="M8 11V6a4 4 0 0 1 8 0v5" />
              </svg>
            )}
            {cartTotalQty > 0 && <span className="nx-cart-badge-dot">{cartTotalQty}</span>}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
