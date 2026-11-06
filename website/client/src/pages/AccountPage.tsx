import React, { useEffect, useRef, useState } from 'react'
import {
  Camera,
  CreditCard,
  Edit3,
  FileText,
  LogOut,
  MapPin,
  Package,
  RefreshCw,
  Star,
  Trash2,
  UploadCloud,
  User,
} from 'lucide-react'
import { extractErrorMessage, resolveImageUrl } from '@/api/client'
import { saveOwnProfile, uploadOwnAvatar } from '@/services'
import { formatPrice } from '@/utils/currency'
import { useI18n } from '@/assets/i18n'
import type { Address, AddressFormPayload } from '@/types/address'
import type { AuthUser, UserProfileForm } from '@/types/auth'
import type { AccountTab, ToastType } from '@/types/navigation'
import type { Order } from '@/types/order'
import type { PaymentRecord } from '@/types/payment'
import type { Product, ProductReview } from '@/types/product'

export interface ReviewedProductEntry {
  product: Product
  review: ProductReview
}

export interface AccountPageProps {
  user: AuthUser | null
  accountTab: AccountTab
  setAccountTab: React.Dispatch<React.SetStateAction<AccountTab>>
  profileForm: UserProfileForm
  setProfileForm: React.Dispatch<React.SetStateAction<UserProfileForm>>
  hasExistingProfile?: boolean
  onAvatarUpdated?: (newAvatarUrl: string | null) => void
  savingProfile: boolean
  onSaveProfile: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>
  addresses: Address[]
  editingAddress: Address | null
  setEditingAddress: React.Dispatch<React.SetStateAction<Address | null>>
  addressForm: AddressFormPayload
  setAddressForm: React.Dispatch<React.SetStateAction<AddressFormPayload>>
  savingAddress: boolean
  onSaveAddress: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>
  onSetDefaultAddress: (id: number | string) => Promise<void>
  onRemoveAddress: (id: number | string) => Promise<void>
  orders: Order[]
  orderStatusFilter: string
  onFilterOrders: (status: string) => void
  onCancelOrder: (orderId: number | string) => Promise<void>
  onDownloadInvoice?: (orderId: number | string, orderNumber?: string) => Promise<void>
  onOpenPaywayModal: (order: Order) => void
  payments: PaymentRecord[]
  onVerifyPayment: (tranId: string) => Promise<void>
  myReviewedProducts: ReviewedProductEntry[]
  onOpenProductDetails: (product: Product) => void
  onDeleteReview: (productId: number | string, reviewId: number | string) => Promise<void>
  onNavigateShop: () => void
  onOpenAuthModal: () => void
  onLogout: () => void
  showToast: (message: string, type?: ToastType) => void
}

export function AccountPage({
  user,
  accountTab,
  setAccountTab,
  profileForm,
  setProfileForm,
  hasExistingProfile = false,
  onAvatarUpdated,
  savingProfile,
  onSaveProfile,
  addresses,
  editingAddress,
  setEditingAddress,
  addressForm,
  setAddressForm,
  savingAddress,
  onSaveAddress,
  onSetDefaultAddress,
  onRemoveAddress,
  orders,
  orderStatusFilter,
  onFilterOrders,
  onCancelOrder,
  onDownloadInvoice,
  onOpenPaywayModal,
  payments,
  onVerifyPayment,
  myReviewedProducts,
  onOpenProductDetails,
  onDeleteReview,
  onNavigateShop,
  onOpenAuthModal,
  onLogout,
  showToast,
}: AccountPageProps) {
  const { t } = useI18n()
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showManualUrl, setShowManualUrl] = useState(false)
  const [sidebarImgFailed, setSidebarImgFailed] = useState(false)
  const [previewImgFailed, setPreviewImgFailed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Reset image error states when avatar URL changes
  useEffect(() => {
    setSidebarImgFailed(false)
    setPreviewImgFailed(false)
  }, [profileForm.avatar, user?.avatar])

  // Guard against browser/Chrome password manager autofilling an email into the phone field
  useEffect(() => {
    if (String(profileForm.phone || '').includes('@')) {
      setProfileForm((prev) => ({ ...prev, phone: '' }))
    }
  }, [profileForm.phone, setProfileForm])

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      showToast(t('Please select an image file (JPG, PNG, WebP, or GIF).'), 'error')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast(t('Image size must be 5MB or smaller.'), 'error')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Set immediate instant local preview
    const localBlob = URL.createObjectURL(file)
    setProfileForm((prev) => ({ ...prev, avatar: localBlob }))
    setSidebarImgFailed(false)
    setPreviewImgFailed(false)

    setUploadingAvatar(true)
    try {
      const uploadedUrl = await uploadOwnAvatar(file)
      if (uploadedUrl) {
        setProfileForm((prev) => ({ ...prev, avatar: uploadedUrl }))
        onAvatarUpdated?.(uploadedUrl)
        try {
          await saveOwnProfile({ avatar: uploadedUrl }, hasExistingProfile)
        } catch {
          // ignore auto-save fallback
        }
        showToast(t('Profile picture updated successfully!'), 'success')
      }
    } catch (err: unknown) {
      showToast(extractErrorMessage(err, t('Failed to upload avatar')), 'error')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="nx-container nx-page-account">
      <div className="nx-page-banner">
        <div>
          <h1>{t('My Customer Account')}</h1>
          <p>
            {t(
              'Manage your profile information, saved delivery addresses, order history, payment status, and product reviews.',
            )}
          </p>
        </div>
      </div>

      {!user ? (
        <div className="nx-empty-card">
          <User size={40} />
          <h3>{t('Sign in to access My Account')}</h3>
          <p>{t('Manage your profile, addresses, orders, payments, and reviews.')}</p>
          <button type="button" className="nx-btn nx-btn-dark" onClick={onOpenAuthModal}>
            {t('Sign In / Register')}
          </button>
        </div>
      ) : (
        <div className="nx-account-layout">
          {/* Left Sidebar Navigation */}
          <aside className="nx-account-sidebar">
            <div className="nx-account-user-box">
              <div className="nx-account-avatar-lg">
                {(profileForm.avatar || user.avatar) &&
                !sidebarImgFailed &&
                resolveImageUrl(profileForm.avatar || user.avatar) ? (
                  <img
                    src={resolveImageUrl(profileForm.avatar || user.avatar)!}
                    alt={user.firstName || 'User'}
                    referrerPolicy="no-referrer"
                    onError={() => setSidebarImgFailed(true)}
                  />
                ) : (
                  (user.firstName?.[0] || user.email?.[0] || 'C').toUpperCase()
                )}
              </div>
              <div>
                <strong>
                  {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                </strong>
                <span>{user.email}</span>
                <div className="nx-role-badges">
                  {/* {(user.roles || ['user']).map((r) => (
                    <code key={r}>role: {r}</code>
                  ))} */}
                </div>
              </div>
            </div>

            <nav className="nx-account-nav">
              <button
                type="button"
                className={accountTab === 'profile' ? 'active' : ''}
                onClick={() => setAccountTab('profile')}
              >
                <User size={16} />
                <span>{t('Profile & Password')}</span>
              </button>
              <button
                type="button"
                className={accountTab === 'addresses' ? 'active' : ''}
                onClick={() => setAccountTab('addresses')}
              >
                <MapPin size={16} />
                <span>
                  {t('Saved Delivery Addresses')} ({addresses.length})
                </span>
              </button>
              <button
                type="button"
                className={accountTab === 'orders' ? 'active' : ''}
                onClick={() => setAccountTab('orders')}
              >
                <Package size={16} />
                <span>
                  {t('Order History & Details')} ({orders.length})
                </span>
              </button>
              <button
                type="button"
                className={accountTab === 'payments' ? 'active' : ''}
                onClick={() => setAccountTab('payments')}
              >
                <CreditCard size={16} />
                <span>
                  {t('Payment Status (tab)')} ({payments.length})
                </span>
              </button>
              <button
                type="button"
                className={accountTab === 'reviews' ? 'active' : ''}
                onClick={() => setAccountTab('reviews')}
              >
                <Star size={16} />
                <span>
                  {t('Products Reviewed')} ({myReviewedProducts.length})
                </span>
              </button>
              <button type="button" className="logout" onClick={onLogout}>
                <LogOut size={16} />
                <span>{t('Logout')}</span>
              </button>
            </nav>
          </aside>

          {/* Right Account Content Area */}
          <div className="nx-account-main">
            {/* TAB 1: Profile information & password changes */}
            {accountTab === 'profile' && (
              <div className="nx-account-panel">
                <h2>{t('Profile Information & Account Settings')}</h2>
                <p className="nx-muted">
                  {t('Update your personal details, avatar, phone number, and password.')}
                </p>

                <form className="nx-account-form" onSubmit={onSaveProfile} autoComplete="off">
                  {/* Browser autofill trap to prevent saved passwords/emails from hijacking phone number */}
                  <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
                    <input type="text" name="chrome_fake_user_trap" tabIndex={-1} autoComplete="username" />
                    <input type="password" name="chrome_fake_pass_trap" tabIndex={-1} autoComplete="current-password" />
                  </div>

                  <div className="nx-form-row-2">
                    <div className="nx-form-field">
                      <label>{t('First Name')}</label>
                      <input
                        type="text"
                        placeholder={t('Enter your first name')}
                        value={profileForm.firstName}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, firstName: e.target.value })
                        }
                      />
                    </div>
                    <div className="nx-form-field">
                      <label>{t('Last Name')}</label>
                      <input
                        type="text"
                        placeholder={t('Enter your last name')}
                        value={profileForm.lastName}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, lastName: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="nx-form-row-2">
                    <div className="nx-form-field">
                      <label>{t('Email Address')}</label>
                      <input type="email" value={profileForm.email} disabled />
                    </div>
                    <div className="nx-form-field">
                      <label>{t('Phone Number')}</label>
                      <input
                        type="tel"
                        name="customer_phone_field"
                        id="customer_phone_field"
                        autoComplete="off"
                        placeholder={t('Enter phone number (e.g. +855 12 345 678)')}
                        value={String(profileForm.phone || '').includes('@') ? '' : (profileForm.phone ?? '')}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val.includes('@')) return
                          setProfileForm({ ...profileForm, phone: val })
                        }}
                      />
                      {String(profileForm.phone || '').includes('@') && (
                        <span style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                          {t('Phone number cannot be an email address.')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="nx-form-row-2">
                    <div className="nx-form-field">
                      <label>{t('Date of Birth')}</label>
                      <input
                        type="date"
                        value={profileForm.date_of_birth}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            date_of_birth: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="nx-form-field">
                      <label>{t('Profile Picture / Avatar')}</label>
                      <div className="nx-avatar-upload-box">
                        <div
                          className="nx-avatar-upload-preview"
                          onClick={() => fileInputRef.current?.click()}
                          title={t('Click to upload image')}
                        >
                          {profileForm.avatar &&
                          !previewImgFailed &&
                          resolveImageUrl(profileForm.avatar) ? (
                            <img
                              src={resolveImageUrl(profileForm.avatar)!}
                              alt="Avatar Preview"
                              className="nx-avatar-preview-img"
                              referrerPolicy="no-referrer"
                              onError={() => setPreviewImgFailed(true)}
                            />
                          ) : (
                            <div className="nx-avatar-preview-placeholder">
                              <User size={26} />
                            </div>
                          )}
                          <div className="nx-avatar-upload-badge" title={t('Upload Image')}>
                            <Camera size={12} />
                          </div>
                        </div>

                        <div className="nx-avatar-upload-actions">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            style={{ display: 'none' }}
                            onChange={(e) => void handleAvatarFileSelect(e)}
                          />
                          <div className="nx-avatar-btn-row">
                            <button
                              type="button"
                              className="nx-btn nx-btn-outline nx-btn-sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingAvatar}
                            >
                              {uploadingAvatar ? (
                                <RefreshCw size={13} className="nx-spin" />
                              ) : (
                                <UploadCloud size={14} />
                              )}
                              <span>
                                {uploadingAvatar
                                  ? t('Uploading...')
                                  : profileForm.avatar
                                  ? t('Change Photo')
                                  : t('Upload Photo')}
                              </span>
                            </button>
                            {profileForm.avatar && (
                              <button
                                type="button"
                                className="nx-btn nx-btn-outline nx-btn-sm danger"
                                onClick={async () => {
                                  setProfileForm((prev) => ({ ...prev, avatar: '' }))
                                  setSidebarImgFailed(false)
                                  setPreviewImgFailed(false)
                                  onAvatarUpdated?.(null)
                                  try {
                                    await saveOwnProfile({ avatar: null }, hasExistingProfile)
                                  } catch {
                                    // ignore fallback
                                  }
                                  showToast(t('Profile picture removed'), 'info')
                                }}
                                disabled={uploadingAvatar}
                                title={t('Remove avatar')}
                              >
                                <Trash2 size={13} /> <span>{t('Remove')}</span>
                              </button>
                            )}
                          </div>
                          <span className="nx-avatar-hint">
                            {t('JPG, PNG, WebP or GIF (max 5MB)')}
                          </span>
                        </div>
                      </div>

                      <div className="nx-avatar-url-toggle">
                        <button
                          type="button"
                          className="nx-link-btn"
                          onClick={() => setShowManualUrl(!showManualUrl)}
                        >
                          {showManualUrl ? t('Hide Image URL') : t('Or enter Image URL manually')}
                        </button>
                        {showManualUrl && (
                          <input
                            type="text"
                            placeholder="https://... or /uploads/..."
                            value={profileForm.avatar}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, avatar: e.target.value })
                            }
                            className="nx-avatar-url-input"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="nx-form-field">
                    <label>{t('Customer Bio / Style Notes')}</label>
                    <textarea
                      rows={3}
                      placeholder={t('Preferred sizes, style notes...')}
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    />
                  </div>

                  <div className="nx-form-field">
                    <label>{t('Change Password (optional)')}</label>
                    <input
                      type="password"
                      name="customer_new_password_no_autofill"
                      autoComplete="new-password"
                      placeholder={t('Enter new password to update')}
                      value={profileForm.newPassword}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, newPassword: e.target.value })
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    className="nx-btn nx-btn-dark"
                    disabled={savingProfile || uploadingAvatar}
                  >
                    {uploadingAvatar
                      ? t('Uploading...')
                      : savingProfile
                      ? t('Saving Changes...')
                      : t('Save Profile & Settings')}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: Saved Delivery Addresses */}
            {accountTab === 'addresses' && (
              <div className="nx-account-panel">
                <h2>{t('Saved Delivery Addresses')}</h2>
                <p className="nx-muted">
                  {t(
                    'Manage your shipping destinations and set your default address for faster checkout.',
                  )}
                </p>

                <form
                  className="nx-account-form"
                  onSubmit={onSaveAddress}
                  style={{ marginBottom: '24px' }}
                >
                  <h4>{editingAddress ? t('Edit Delivery Address') : t('Add New Address')}</h4>

                  <div className="nx-form-row-2">
                    <div className="nx-form-field">
                      <label>{t('Receiver Name')}</label>
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
                      <label>{t('Phone')}</label>
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
                      <label>{t('Street Address')}</label>
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
                  <div className="nx-form-actions">
                    <button
                      type="submit"
                      className="nx-btn nx-btn-dark"
                      disabled={savingAddress}
                    >
                      {savingAddress
                        ? t('Saving...')
                        : editingAddress
                        ? t('Update Address')
                        : t('Save Address')}
                    </button>
                    {editingAddress && (
                      <button
                        type="button"
                        className="nx-btn nx-btn-outline"
                        onClick={() => {
                          setEditingAddress(null)
                          setAddressForm({
                            receiver_name: '',
                            phone: '',
                            street: '',
                            city: '',
                            status: true,
                          })
                        }}
                      >
                        {t('Cancel')}
                      </button>
                    )}
                  </div>
                </form>

                <div className="nx-address-select-grid">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="nx-address-option">
                      <div className="nx-address-option-top">
                        <strong>{addr.receiver_name}</strong>
                        {addr.status && <span className="nx-default-pill">{t('Default')}</span>}
                      </div>
                      <p>{addr.phone}</p>
                      <p>
                        {addr.street}, {addr.city}
                      </p>
                      <div className="nx-review-actions" style={{ marginTop: '10px' }}>
                        {!addr.status && (
                          <button
                            type="button"
                            onClick={() => void onSetDefaultAddress(addr.id)}
                          >
                            {t('Set Default')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddress(addr)
                            setAddressForm({
                              receiver_name: addr.receiver_name || '',
                              phone: addr.phone || '',
                              street: addr.street || '',
                              city: addr.city || '',
                              status: Boolean(addr.status),
                            })
                          }}
                        >
                          <Edit3 size={13} /> {t('Edit')}
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => void onRemoveAddress(addr.id)}
                        >
                          <Trash2 size={13} /> {t('Delete')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Order History & Order Details */}
            {accountTab === 'orders' && (
              <div className="nx-account-panel">
                <div className="nx-panel-head-row">
                  <div>
                    <h2>{t('Order History & Order Details')}</h2>
                    <p className="nx-muted">
                      {t('Track your orders, purchased items, and delivery status.')}
                    </p>
                  </div>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => onFilterOrders(e.target.value)}
                  >
                    <option value="">{t('All Statuses')}</option>
                    <option value="pending">{t('Pending')}</option>
                    <option value="paid">{t('Paid')}</option>
                    <option value="shipped">{t('Shipped')}</option>
                    <option value="delivered">{t('Delivered')}</option>
                    <option value="cancelled">{t('Cancelled')}</option>
                  </select>
                </div>

                {orders.length === 0 ? (
                  <div className="nx-empty-card">
                    <Package size={32} />
                    <h4>{t('No orders placed yet')}</h4>
                    <p>{t('Orders you place at Checkout will appear here with full item details.')}</p>
                  </div>
                ) : (
                  <div className="nx-orders-stack">
                    {orders.map((ord) => (
                      <div key={ord.id} className="nx-order-card">
                        <div className="nx-order-card-head">
                          <div>
                            <strong>{ord.order_number || `${t('Order:')} #${ord.id}`}</strong>
                            <span className="nx-review-date">
                              {ord.createdAt ? new Date(ord.createdAt).toLocaleString() : ''}
                            </span>
                          </div>
                          <div className="nx-order-badges">
                            <span className={`nx-status-badge ${ord.status}`}>
                              {t('Order:')} {t(ord.status ? ord.status.charAt(0).toUpperCase() + ord.status.slice(1) : '') || ord.status}
                            </span>
                            <span className={`nx-status-badge ${ord.payment_status}`}>
                              {t('Payment:')} {t(ord.payment_status ? ord.payment_status.charAt(0).toUpperCase() + ord.payment_status.slice(1) : '') || ord.payment_status}
                            </span>
                          </div>
                        </div>

                        <div className="nx-table-responsive">
                          <table className="nx-erd-matrix-table">
                            <thead>
                              <tr>
                                <th>{t('Product Name (order_items)')}</th>
                                <th>{t('SKU')}</th>
                                <th>{t('Price')}</th>
                                <th>{t('Qty')}</th>
                                <th>{t('Total')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(ord.items || []).map((oi) => (
                                <tr key={oi.id}>
                                  <td>
                                    {oi.product_name}
                                    {(oi.color || oi.size) && (
                                      <span className="nx-review-date">
                                        {' '}
                                        ({[oi.color, oi.size].filter(Boolean).join(' / ')})
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <code>{oi.sku || '—'}</code>
                                  </td>
                                  <td>{formatPrice(oi.unit_price ?? oi.price)}</td>
                                  <td>{oi.quantity}</td>
                                  <td>
                                    <strong>{formatPrice(oi.amount ?? oi.total)}</strong>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="nx-order-card-foot">
                          <div className="nx-order-totals">
                            <span>{t('Subtotal:')} {formatPrice(ord.sub_total ?? ord.subtotal)}</span>
                            <span>{t('Shipping:')} {formatPrice(ord.shipping_fee ?? 0)}</span>
                            <span>{t('Discount:')} -{formatPrice(ord.discount ?? 0)}</span>
                            <strong>{t('Total:')} {formatPrice(ord.total)}</strong>
                          </div>
                          <div className="nx-order-actions">
                            {ord.status !== 'cancelled' && onDownloadInvoice && (
                              <button
                                type="button"
                                className="nx-btn nx-btn-outline nx-btn-sm"
                                onClick={() => void onDownloadInvoice(ord.id, ord.order_number)}
                              >
                                <FileText size={14} /> {t('Invoice (.docx)')}
                              </button>
                            )}
                            {ord.status === 'pending' && ord.payment_status !== 'paid' && (
                              <button
                                type="button"
                                className="nx-btn nx-btn-dark nx-btn-sm"
                                onClick={() => onOpenPaywayModal(ord)}
                              >
                                <CreditCard size={14} /> {t('Pay Now')}
                              </button>
                            )}
                            {ord.status === 'pending' && (
                              <button
                                type="button"
                                className="nx-btn nx-btn-outline nx-btn-sm"
                                onClick={() => void onCancelOrder(ord.id)}
                              >
                                {t('Cancel Order')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Payment Status & Order Status */}
            {accountTab === 'payments' && (
              <div className="nx-account-panel">
                <h2>{t('Payment Status & Transaction History')}</h2>
                <p className="nx-muted">
                  {t('View your payment records and verify transaction statuses.')}
                </p>

                {payments.length === 0 ? (
                  <div className="nx-empty-card">
                    <CreditCard size={32} />
                    <h4>{t('No payment records yet')}</h4>
                    <p>{t('Payments initiated at Checkout appear here with live verification.')}</p>
                  </div>
                ) : (
                  <div className="nx-table-responsive">
                    <table className="nx-erd-matrix-table">
                      <thead>
                        <tr>
                          <th>{t('Transaction ID')}</th>
                          <th>{t('Order ID')}</th>
                          <th>{t('Method')}</th>
                          <th>{t('Amount')}</th>
                          <th>{t('Status')}</th>
                          <th>{t('Action')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((pay) => {
                          const tranId = pay.paywayTranId || pay.payway_tran_id
                          return (
                            <tr key={pay.id}>
                              <td>
                                <code>{tranId || `PAY-${pay.id}`}</code>
                              </td>
                              <td>
                                {pay.order?.order_number || `#${pay.orderId || pay.order_id}`}
                              </td>
                              <td>{pay.method || pay.payment_option || pay.provider || 'abapay_khqr'}</td>
                              <td>
                                <strong>{formatPrice(pay.amount)}</strong>
                              </td>
                              <td>
                                <span className={`nx-status-badge ${pay.status}`}>
                                  {pay.status}
                                </span>
                              </td>
                              <td>
                                {pay.status !== 'success' && tranId && (
                                  <button
                                    type="button"
                                    className="nx-table-jump-btn"
                                    onClick={() => void onVerifyPayment(tranId)}
                                  >
                                    {t('Verify Now')}
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: Products Reviewed by Customer */}
            {accountTab === 'reviews' && (
              <div className="nx-account-panel">
                <h2>{t('Products Reviewed by You')}</h2>
                <p className="nx-muted">
                  {t('View and manage the ratings and reviews you have shared.')}
                </p>

                {myReviewedProducts.length === 0 ? (
                  <div className="nx-empty-card">
                    <Star size={32} />
                    <h4>{t("You haven't reviewed any clothing items yet")}</h4>
                    <p>{t('Open any product details page to rate and review your purchase.')}</p>
                    <button type="button" className="nx-btn nx-btn-dark" onClick={onNavigateShop}>
                      {t('Browse Products to Review')}
                    </button>
                  </div>
                ) : (
                  <div className="nx-reviews-list">
                    {myReviewedProducts.map(({ product, review }) => (
                      <div key={review.id} className="nx-review-card">
                        <div className="nx-review-head">
                          <strong
                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => onOpenProductDetails(product)}
                          >
                            {product.name}
                          </strong>
                          <div className="nx-stars">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star
                                key={n}
                                size={14}
                                fill={n <= Number(review.rating) ? '#f59e0b' : 'none'}
                                color="#f59e0b"
                              />
                            ))}
                          </div>
                        </div>
                        <p className="nx-review-comment">{review.comment}</p>
                        <div className="nx-review-actions">
                          <button type="button" onClick={() => onOpenProductDetails(product)}>
                            {t('View Product →')}
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => void onDeleteReview(product.id, review.id)}
                          >
                            <Trash2 size={13} /> {t('Delete Review')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountPage

