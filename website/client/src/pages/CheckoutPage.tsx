import React from 'react'
import {
  Check,
  CheckCircle2,
  CreditCard,
  Lock,
  MapPin,
  Plus,
} from 'lucide-react'
import {
  AddressMapPicker,
  DeliveryRouteMap,
  MastercardLogo,
  PaypalLogo,
  VisaLogo,
} from '@/components'
import { formatPrice } from '@/utils/currency'
import { useI18n } from '@/assets/i18n'
import type { Address, AddressFormPayload } from '@/types/address'
import type { AuthUser } from '@/types/auth'
import type { Cart } from '@/types/cart'
import type { AccountTab, ToastType } from '@/types/navigation'
import type { Order } from '@/types/order'
import type { CheckoutPaymentMethod, CreditCardFormState } from '@/types/payment'
import type { Product } from '@/types/product'

export interface CheckoutPageProps {
  user: AuthUser | null
  cart: Cart
  addresses: Address[]
  selectedAddressId: number | string | null
  setSelectedAddressId: React.Dispatch<React.SetStateAction<number | string | null>>
  showCheckoutNewAddr: boolean
  setShowCheckoutNewAddr: React.Dispatch<React.SetStateAction<boolean>>
  addressForm: AddressFormPayload
  setAddressForm: React.Dispatch<React.SetStateAction<AddressFormPayload>>
  savingAddress: boolean
  onSaveAddress: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>
  promoCode: string
  setPromoCode: React.Dispatch<React.SetStateAction<string>>
  discountAmount: number
  onApplyPromo: (e: React.FormEvent<HTMLFormElement>) => void
  checkoutPaymentMethod: CheckoutPaymentMethod
  setCheckoutPaymentMethod: React.Dispatch<React.SetStateAction<CheckoutPaymentMethod>>
  creditCardForm: CreditCardFormState
  setCreditCardForm: React.Dispatch<React.SetStateAction<CreditCardFormState>>
  cartSubtotal: number
  shippingEstimate: number
  checkoutTotalEstimate: number
  placingOrder: boolean
  onPlaceOrder: () => void | Promise<void>
  confirmedOrder: Order | null
  setConfirmedOrder: React.Dispatch<React.SetStateAction<Order | null>>
  openingPayway?: boolean
  onOpenPaywayModal: (order: Order) => void
  onGoToAccountTab: (tab: AccountTab) => void
  onNavigateShop: () => void
  onOpenAuthModal: () => void
  showToast: (message: string, type?: ToastType) => void
  getProductPrimaryImage: (prod?: Product | null, fallbackIdx?: number | string) => string
}

export function CheckoutPage({
  user,
  cart,
  addresses,
  selectedAddressId,
  setSelectedAddressId,
  showCheckoutNewAddr,
  setShowCheckoutNewAddr,
  addressForm,
  setAddressForm,
  savingAddress,
  onSaveAddress,
  promoCode,
  setPromoCode,
  discountAmount,
  onApplyPromo,
  checkoutPaymentMethod,
  setCheckoutPaymentMethod,
  creditCardForm,
  setCreditCardForm,
  cartSubtotal,
  shippingEstimate,
  checkoutTotalEstimate,
  placingOrder,
  onPlaceOrder,
  confirmedOrder,
  setConfirmedOrder,
  openingPayway = false,
  onOpenPaywayModal,
  onGoToAccountTab,
  onNavigateShop,
  onOpenAuthModal,
  showToast,
  getProductPrimaryImage,
}: CheckoutPageProps) {
  const { t } = useI18n()
  return (
    <div className="nx-container nx-page-checkout">
      <div className="nx-page-banner">
        <div>
          <h1>{t('Checkout')}</h1>
          <p>
            {t('Complete your delivery address, review your items, and choose your payment method.')}
          </p>
        </div>
      </div>

      {confirmedOrder ? (
        /* STEP 5 CONFIRMATION VIEW */
        <div className="nx-order-confirmation-card">
          <div className="nx-confirm-badge">
            <CheckCircle2 size={32} />
          </div>
          <span className="nx-eyebrow">ORDER CONFIRMED</span>
          <h2>Thank you! Order {confirmedOrder.order_number} has been placed.</h2>
          <p>
            Your order has been recorded. Complete your payment via ABA PayWay or view your order
            details in My Account.
          </p>

          <div className="nx-confirm-meta-grid">
            <div>
              <span>Order Number</span>
              <strong>{confirmedOrder.order_number}</strong>
            </div>
            <div>
              <span>Order Status</span>
              <strong className="uppercase">{confirmedOrder.status}</strong>
            </div>
            <div>
              <span>Payment Status</span>
              <strong className="uppercase">{confirmedOrder.payment_status}</strong>
            </div>
            <div>
              <span>Authoritative Total</span>
              <strong>{formatPrice(confirmedOrder.total)}</strong>
            </div>
          </div>

          <div style={{ margin: '20px 0', textAlign: 'left' }}>
            <DeliveryRouteMap
              address={
                addresses.find((a) => String(a.id) === String(selectedAddressId)) || addresses[0]
              }
              orderNumber={confirmedOrder.order_number}
              status={confirmedOrder.status}
            />
          </div>

          <div className="nx-confirm-actions">
            {confirmedOrder.status === 'paid' || confirmedOrder.payment_status === 'paid' ? (
              <button
                type="button"
                className="nx-btn nx-btn-dark"
                disabled
                style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', cursor: 'default' }}
              >
                <CheckCircle2 size={16} />
                <span>Payment Completed (PAID)</span>
              </button>
            ) : (
              <button
                type="button"
                className="nx-btn nx-btn-dark"
                disabled={openingPayway}
                onClick={() => onOpenPaywayModal(confirmedOrder)}
              >
                <CreditCard size={16} />
                <span>
                  {openingPayway
                    ? 'Opening ABA KHQR...'
                    : checkoutPaymentMethod === 'cards'
                    ? 'Pay Now with Credit Card'
                    : checkoutPaymentMethod === 'paypal'
                    ? 'Pay Now with PayPal'
                    : 'Pay Now with PayWay KHQR'}
                </span>
              </button>
            )}
            <button
              type="button"
              className="nx-btn nx-btn-outline"
              onClick={() => onGoToAccountTab('orders')}
            >
              View in My Account Orders
            </button>
            <button
              type="button"
              className="nx-btn nx-btn-outline"
              onClick={() => {
                setConfirmedOrder(null)
                onNavigateShop()
              }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      ) : !user ? (
        <div className="nx-empty-card">
          <Lock size={36} />
          <h3>Sign in to complete checkout</h3>
          <p>Please sign in or register your customer account to place an order.</p>
          <button type="button" className="nx-btn nx-btn-dark" onClick={onOpenAuthModal}>
            Sign In / Register
          </button>
        </div>
      ) : (
        <div className="nx-checkout-layout">
          <div className="nx-checkout-steps-col">
            {/* STEP 1: Enter or select a delivery address */}
            <div className="nx-checkout-step-card">
              <div className="nx-step-header">
                <span className="nx-step-num">1</span>
                <div>
                  <h3>Enter or Select a Delivery Address</h3>
                  <span className="nx-step-sub">Table: addresses</span>
                </div>
                <button
                  type="button"
                  className="nx-btn nx-btn-outline nx-btn-sm"
                  onClick={() => setShowCheckoutNewAddr(!showCheckoutNewAddr)}
                >
                  <Plus size={14} /> {showCheckoutNewAddr ? 'Cancel' : 'New Address'}
                </button>
              </div>

              {showCheckoutNewAddr && (
                <form className="nx-inline-address-form" onSubmit={onSaveAddress}>
                  <AddressMapPicker
                    street={addressForm.street}
                    city={addressForm.city}
                    title="Pin Your Delivery Location on OpenStreetMap"
                    compact
                    onSelectLocation={({ street, city }) => {
                      setAddressForm((prev) => ({
                        ...prev,
                        street: street || prev.street,
                        city: city || prev.city,
                      }))
                      showToast(`Pinned location: ${street}, ${city}`, 'info')
                    }}
                  />

                  <div className="nx-form-row-2">
                    <div className="nx-form-field">
                      <label>Receiver Name</label>
                      <input
                        type="text"
                        required
                        placeholder={t('Enter receiver full name')}
                        value={addressForm.receiver_name}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            receiver_name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="nx-form-field">
                      <label>{t('Phone Number')}</label>
                      <input
                        type="text"
                        required
                        placeholder={t('Enter phone number (e.g. +855 12 345 678)')}
                        value={addressForm.phone}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="nx-form-row-2">
                    <div className="nx-form-field">
                      <label>{t('Street Address (Auto-filled from OpenStreetMap or type)')}</label>
                      <input
                        type="text"
                        required
                        placeholder={t('Enter house/street address')}
                        value={addressForm.street}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, street: e.target.value })
                        }
                      />
                    </div>
                    <div className="nx-form-field">
                      <label>{t('City')}</label>
                      <input
                        type="text"
                        required
                        placeholder={t('Enter city or province')}
                        value={addressForm.city}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, city: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="nx-btn nx-btn-dark nx-btn-sm"
                    disabled={savingAddress}
                  >
                    {savingAddress ? 'Saving...' : 'Save & Use Address'}
                  </button>
                </form>
              )}

              {addresses.length === 0 ? (
                <p className="nx-muted">
                  No saved addresses yet. Click &ldquo;New Address&rdquo; above to pin and save
                  your delivery destination on OpenStreetMap.
                </p>
              ) : (
                <>
                  <div className="nx-address-select-grid">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`nx-address-option ${
                          String(selectedAddressId) === String(addr.id) ? 'selected' : ''
                        }`}
                        onClick={() => setSelectedAddressId(addr.id)}
                      >
                        <div className="nx-address-option-top">
                          <strong>{addr.receiver_name}</strong>
                          {addr.status && <span className="nx-default-pill">Default</span>}
                        </div>
                        <p>{addr.phone}</p>
                        <p>
                          <MapPin
                            size={13}
                            style={{ verticalAlign: 'middle', marginRight: '4px' }}
                          />
                          {addr.street}, {addr.city}
                        </p>
                      </div>
                    ))}
                  </div>

                  {!showCheckoutNewAddr && (
                    <div style={{ marginTop: '16px' }}>
                      <DeliveryRouteMap
                        address={
                          addresses.find((a) => String(a.id) === String(selectedAddressId)) ||
                          addresses[0]
                        }
                        status="ready_to_ship"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* STEP 2: Review Selected Clothing Items */}
            <div className="nx-checkout-step-card">
              <div className="nx-step-header">
                <span className="nx-step-num">2</span>
                <div>
                  <h3>Review Selected Clothing Items</h3>
                  <span className="nx-step-sub">Items summary before payment confirmation</span>
                </div>
              </div>

              <div className="nx-checkout-luxury-list">
                {(cart?.items || []).map((item, idx) => {
                  const v = item.variant || ({} as NonNullable<typeof item.variant>)
                  const p = v.product || null
                  return (
                    <div key={item.id} className="nx-luxury-item-row">
                      <div className="nx-luxury-thumb-wrap">
                        <img
                          src={getProductPrimaryImage(p, idx)}
                          alt={p?.name || 'Item'}
                          className="nx-luxury-thumb"
                        />
                      </div>
                      <div className="nx-luxury-info">
                        <div className="nx-luxury-top">
                          <h3 className="nx-luxury-title">{p?.name || v.sku || 'Product'}</h3>
                          <span className="nx-luxury-price">{formatPrice(item.line_total)}</span>
                        </div>
                        <div className="nx-luxury-specs">
                          <div className="nx-luxury-spec-row">
                            <span className="nx-luxury-spec-label">Size:</span>
                            <span className="nx-luxury-spec-val">{v.size || '—'}</span>
                          </div>
                          <div className="nx-luxury-spec-row">
                            <span className="nx-luxury-spec-label">Color:</span>
                            <span className="nx-luxury-spec-val">{v.color || '—'}</span>
                          </div>
                          <div className="nx-luxury-spec-row">
                            <span className="nx-luxury-spec-label">Quantity:</span>
                            <span className="nx-luxury-spec-val">{item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* STEP 3: Confirm shipping fees and discounts */}
            <div className="nx-checkout-step-card">
              <div className="nx-step-header">
                <span className="nx-step-num">3</span>
                <div>
                  <h3>Confirm Shipping Fees &amp; Discounts</h3>
                  <span className="nx-step-sub">
                    Backend-verified subtotal, shipping, and discount
                  </span>
                </div>
              </div>

              <form className="nx-promo-row" onSubmit={onApplyPromo}>
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <button type="submit" className="nx-btn nx-btn-outline">
                  Apply Discount
                </button>
              </form>
            </div>

            {/* STEP 4: Select an available payment method */}
            <div className="nx-checkout-step-card">
              <div className="nx-step-header">
                <span className="nx-step-num">4</span>
                <div>
                  <h3>Select an Available Payment Method</h3>
                  <span className="nx-step-sub">Credit Card, PayPal, or PayWay KHQR</span>
                </div>
              </div>

              <div className="nx-payment-minimal-panel">
                {/* Option 1: Credit card */}
                <div
                  className={`nx-payment-item-block ${
                    checkoutPaymentMethod === 'cards' ? 'selected' : ''
                  }`}
                >
                  <div
                    className="nx-payment-item-header"
                    onClick={() => setCheckoutPaymentMethod('cards')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="nx-payment-label-wrap">
                      <span
                        className={`nx-payment-radio ${
                          checkoutPaymentMethod === 'cards' ? 'checked' : ''
                        }`}
                      >
                        <span className="nx-payment-radio-dot" />
                      </span>
                      <span>Credit card</span>
                    </div>
                    <div className="nx-payment-logos-row">
                      <VisaLogo />
                      <MastercardLogo />
                    </div>
                  </div>

                  {checkoutPaymentMethod === 'cards' && (
                    <div className="nx-card-fields-grid">
                      <input
                        type="text"
                        className="nx-card-underline-input"
                        placeholder="Card number"
                        value={creditCardForm.number}
                        maxLength={19}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 16)
                          const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ')
                          setCreditCardForm((prev) => ({ ...prev, number: formatted }))
                        }}
                      />
                      <input
                        type="text"
                        className="nx-card-underline-input"
                        placeholder="Cardholder name"
                        value={creditCardForm.name}
                        onChange={(e) =>
                          setCreditCardForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                      />
                      <input
                        type="text"
                        className="nx-card-underline-input"
                        placeholder="Expiration date (MM/YY)"
                        value={creditCardForm.exp}
                        maxLength={5}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '').slice(0, 4)
                          if (val.length >= 3) {
                            val = `${val.slice(0, 2)}/${val.slice(2)}`
                          }
                          setCreditCardForm((prev) => ({ ...prev, exp: val }))
                        }}
                      />
                      <input
                        type="text"
                        className="nx-card-underline-input"
                        placeholder="CVV"
                        value={creditCardForm.cvv}
                        maxLength={4}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                          setCreditCardForm((prev) => ({ ...prev, cvv: val }))
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Option 2: PayPal */}
                <div
                  className={`nx-payment-item-block ${
                    checkoutPaymentMethod === 'paypal' ? 'selected' : ''
                  }`}
                >
                  <div
                    className="nx-payment-item-header"
                    onClick={() => setCheckoutPaymentMethod('paypal')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="nx-payment-label-wrap">
                      <span
                        className={`nx-payment-radio ${
                          checkoutPaymentMethod === 'paypal' ? 'checked' : ''
                        }`}
                      >
                        <span className="nx-payment-radio-dot" />
                      </span>
                      <span>PayPal</span>
                    </div>
                    <div className="nx-payment-logos-row">
                      <PaypalLogo />
                    </div>
                  </div>
                </div>

                {/* Option 3: PayWay KHQR */}
                <div
                  className={`nx-payment-item-block ${
                    checkoutPaymentMethod === 'abapay_khqr' ? 'selected' : ''
                  }`}
                >
                  <div
                    className="nx-payment-item-header"
                    onClick={() => setCheckoutPaymentMethod('abapay_khqr')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="nx-payment-label-wrap">
                      <span
                        className={`nx-payment-radio ${
                          checkoutPaymentMethod === 'abapay_khqr' ? 'checked' : ''
                        }`}
                      >
                        <span className="nx-payment-radio-dot" />
                      </span>
                      <span>PayWay KHQR</span>
                    </div>
                    <div className="nx-payment-logos-row">
                      <div className="nx-payment-khqr-badge-wrap" title="PayWay KHQR">
                        <span className="nx-payway-brand-tag">PayWay</span>
                        <span className="nx-khqr-red-badge">KHQR</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 5: Place the order and show confirmation */}
          <aside className="nx-cart-summary-card">
            <div className="nx-step-header" style={{ marginBottom: '12px' }}>
              <span className="nx-step-num">5</span>
              <div>
                <h3>Place Your Order</h3>
                <span className="nx-step-sub">Creates orders &amp; order_items</span>
              </div>
            </div>

            <div className="nx-summary-rows">
              <div className="nx-summary-line">
                <span>{t('Subtotal')}</span>
                <strong>{formatPrice(cartSubtotal)}</strong>
              </div>
              <div className="nx-summary-line">
                <span>{t('Shipping')}</span>
                <strong>
                  {shippingEstimate === 0 ? (t('Free') || 'FREE') : formatPrice(shippingEstimate)}
                </strong>
              </div>
              <div className="nx-summary-line">
                <span>Discount</span>
                <strong>-{formatPrice(discountAmount)}</strong>
              </div>
              <div className="nx-summary-line total">
                <span>{t('Total')}</span>
                <strong>{formatPrice(checkoutTotalEstimate)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="nx-btn nx-btn-dark nx-btn-full"
              disabled={placingOrder || !cart?.items?.length}
              onClick={() => void onPlaceOrder()}
            >
              <Check size={16} />
              <span>
                {placingOrder
                  ? t('Placing Order...')
                  : `${t('Place Order')} (${formatPrice(checkoutTotalEstimate)})`}
              </span>
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}

export default CheckoutPage

