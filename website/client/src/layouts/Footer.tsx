import React from 'react'
import { useI18n } from '@/assets/i18n'
import type { AccountTab, StorefrontPage } from '@/types/navigation'

export interface FooterProps {
  onNavigatePage: (page: StorefrontPage) => void
  onGoToAccountTab: (tab: AccountTab) => void
}

export function Footer({ onNavigatePage, onGoToAccountTab }: FooterProps) {
  const { t } = useI18n()
  return (
    <footer className="nx-footer">
      <div className="nx-container nx-footer-grid">
        <div>
          <div className="nx-brand" style={{ marginBottom: '12px' }}>
            <span className="nx-brand-mark">A</span>
            <div className="nx-brand-copy">
              <strong style={{ color: '#fff' }}>AURA CLOTHING</strong>
              <span>Modern Clothing Store</span>
            </div>
          </div>
          <p className="nx-footer-desc">
            Elevated everyday clothing crafted from organic cotton, European linen, and Merino
            wool.
          </p>
        </div>

        <div>
          <h4>{t('Shop')}</h4>
          <button type="button" onClick={() => onNavigatePage('home')}>
            {t('Home')}
          </button>
          <button type="button" onClick={() => onNavigatePage('shop')}>
            {t('Shop Collection')}
          </button>
          <button type="button" onClick={() => onNavigatePage('product')}>
            {t('View Details')}
          </button>
        </div>

        <div>
          <h4>{t('Cart')}</h4>
          <button type="button" onClick={() => onNavigatePage('cart')}>
            {t('Your Shopping Cart')}
          </button>
          <button type="button" onClick={() => onNavigatePage('checkout')}>
            {t('Checkout')}
          </button>
          <button type="button" onClick={() => onGoToAccountTab('profile')}>
            {t('My Account')}
          </button>
        </div>

        <div>
          <h4>{t('My Account')}</h4>
          <button type="button" onClick={() => onGoToAccountTab('orders')}>
            {t('Order History')}
          </button>
          <button type="button" onClick={() => onGoToAccountTab('addresses')}>
            {t('Delivery Addresses')}
          </button>
          <button type="button" onClick={() => onGoToAccountTab('profile')}>
            {t('Profile Settings')}
          </button>
        </div>
      </div>
    </footer>
  )
}

export default Footer

