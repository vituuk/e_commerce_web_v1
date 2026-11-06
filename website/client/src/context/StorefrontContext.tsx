import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { calculateShippingFee } from '@/constants/storefront'
import {
  useAddresses,
  useAddCartItem,
  useAuthLogout,
  useAuthMe,
  useCancelMyOrder,
  useCart,
  useCatalog,
  useCheckoutOrder,
  useClearCart,
  useDeleteAddress,
  useDeleteReview,
  useDownloadOrderInvoice,
  useMyOrders,
  useMyPayments,
  useRemoveCartItem,
  useSaveAddress,
  useSaveOwnProfile,
  useSetDefaultAddress,
  useUpdateCartItem,
  useVerifyPayment,
  useWishlist,
} from '@/hooks'
import type { ReviewedProductEntry } from '@/pages'
import { EMPTY_CART, extractErrorMessage, getOwnProfile } from '@/services'
import {
  AUTH_UNAUTHORIZED_EVENT,
  closeAbaPopupInPlace,
  getPathSlug,
  getProductPrimaryImage,
  getProductSlug,
  getUserFromToken,
  openAbaPaywayKhqrPopup,
  playOrderSuccessSound,
  playPaymentSuccessSound,
} from '@/utils'
import type { Address, AddressFormPayload } from '@/types/address'
import type { AuthUser, UserProfileForm } from '@/types/auth'
import type { Cart } from '@/types/cart'
import type { Category } from '@/types/category'
import type {
  AccountTab,
  AvailabilityFilter,
  NavigateOptions,
  NavHighlightKey,
  PriceRangePreset,
  SortOption,
  StorefrontPage,
  ToastMessage,
  ToastType,
} from '@/types/navigation'
import type { Order } from '@/types/order'
import type {
  CheckoutPaymentMethod,
  CreditCardFormState,
  PaymentRecord,
} from '@/types/payment'
import type {
  EnrichedOurProductItem,
  Product,
  ProductVariant,
  SelectedDetailPricing,
} from '@/types/product'

export interface StorefrontContextValue {
  // Navigation & Toast
  activePage: StorefrontPage
  setActivePage: React.Dispatch<React.SetStateAction<StorefrontPage>>
  previousPage: StorefrontPage
  activeNavHighlight: NavHighlightKey
  accountTab: AccountTab
  setAccountTab: React.Dispatch<React.SetStateAction<AccountTab>>
  toast: ToastMessage | null
  setToast: React.Dispatch<React.SetStateAction<ToastMessage | null>>
  showToast: (message: string, type?: ToastType) => void
  navigateToPage: (page: StorefrontPage, options?: NavigateOptions) => void
  openProductDetails: (
    product: Product,
    customPricing?: SelectedDetailPricing | null,
  ) => void
  handleBackFromProduct: () => void
  navigateHeaderCategory: (navKey: string) => void
  handleSelectCategory: (cat: Category) => void
  goToAccountTab: (tabName: AccountTab) => void

  // Auth & Profile
  user: AuthUser | null
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>
  authModalMode: 'login' | 'register' | null
  setAuthModalMode: React.Dispatch<React.SetStateAction<'login' | 'register' | null>>
  hasExistingProfile: boolean
  setHasExistingProfile: React.Dispatch<React.SetStateAction<boolean>>
  profileForm: UserProfileForm
  setProfileForm: React.Dispatch<React.SetStateAction<UserProfileForm>>
  savingProfile: boolean
  handleSaveProfile: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
  handleLogout: () => void
  handleAuthSuccess: (userData: AuthUser | null, token?: string) => void

  // Catalog & Shop Filters
  categories: Category[]
  products: Product[]
  catalogLoading: boolean
  catalogError: string | null
  handleReloadCatalog: () => Promise<void>
  brokenImages: Record<string | number, boolean>
  setBrokenImages: React.Dispatch<React.SetStateAction<Record<string | number, boolean>>>
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

  // Product Detail & Wishlist
  activeProduct: Product | null
  selectedDetailPricing: SelectedDetailPricing | null
  isWishlistOpen: boolean
  setIsWishlistOpen: React.Dispatch<React.SetStateAction<boolean>>
  wishlist: (number | string)[]
  wishlistProducts: Product[]
  handleToggleWishlist: (prodId: number | string, prodName?: string) => void
  clearWishlist: () => void
  resolvePrimaryImage: (prod?: Product | null, fallbackIdx?: number | string) => string

  // Cart, Addresses, Orders & Payments
  cart: Cart
  cartSubtotal: number
  shippingEstimate: number
  checkoutTotalEstimate: number
  addresses: Address[]
  selectedAddressId: number | string | null
  setSelectedAddressId: React.Dispatch<React.SetStateAction<number | string | null>>
  showCheckoutNewAddr: boolean
  setShowCheckoutNewAddr: React.Dispatch<React.SetStateAction<boolean>>
  editingAddress: Address | null
  setEditingAddress: React.Dispatch<React.SetStateAction<Address | null>>
  addressForm: AddressFormPayload
  setAddressForm: React.Dispatch<React.SetStateAction<AddressFormPayload>>
  savingAddress: boolean
  handleSaveAddress: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
  handleSetDefaultAddress: (id: number | string) => Promise<void>
  handleRemoveAddress: (id: number | string) => Promise<void>
  orders: Order[]
  orderStatusFilter: string
  setOrderStatusFilter: React.Dispatch<React.SetStateAction<string>>
  handleCancelOrder: (orderId: number | string) => Promise<void>
  handleDownloadInvoice: (orderId: number | string, orderNumber?: string) => Promise<void>
  payments: PaymentRecord[]
  handleVerifyPayment: (tranId: string) => Promise<void>
  myReviewedProducts: ReviewedProductEntry[]
  handleDeleteReview: (productId: number | string, reviewId: number | string) => Promise<void>
  checkoutPaymentMethod: CheckoutPaymentMethod
  setCheckoutPaymentMethod: React.Dispatch<React.SetStateAction<CheckoutPaymentMethod>>
  creditCardForm: CreditCardFormState
  setCreditCardForm: React.Dispatch<React.SetStateAction<CreditCardFormState>>
  promoCode: string
  setPromoCode: React.Dispatch<React.SetStateAction<string>>
  discountAmount: number
  handleApplyPromo: (e: React.FormEvent<HTMLFormElement>) => void
  placingOrder: boolean
  handlePlaceOrder: () => Promise<void>
  confirmedOrder: Order | null
  setConfirmedOrder: React.Dispatch<React.SetStateAction<Order | null>>
  paywayModalOrder: Order | null
  setPaywayModalOrder: React.Dispatch<React.SetStateAction<Order | null>>
  openingPayway: boolean
  handleOpenPaywayModal: (order: Order, paymentOption?: string) => Promise<void>
  handlePaymentUpdated: () => void
  handleAddToCart: (
    variantObj: ProductVariant | null,
    qty?: number,
    productObj?: Product | null,
  ) => Promise<void>
  handleOurProductAddToCart: (item: EnrichedOurProductItem | Product) => Promise<void>
  handleUpdateCartQty: (
    itemId: number | string,
    newQty: number,
    maxStock?: number,
  ) => Promise<void>
  handleRemoveCartItem: (itemId: number | string) => Promise<void>
  handleAddWishlistToCart: (prod: Product) => void
  handleAddAllWishlistToCart: () => Promise<void>
}

export const StorefrontContext = createContext<StorefrontContextValue | null>(null)

export function StorefrontProvider({ children }: { children: ReactNode }) {
  // Parse initial route from browser URL
  const initialRoute = useMemo<{ page: StorefrontPage; slug: string }>(() => {
    if (typeof window === 'undefined') return { page: 'home', slug: '' }
    const path = window.location.pathname
    if (path.startsWith('/product/')) {
      return { page: 'product', slug: getPathSlug(path) }
    }
    if (path === '/shop') return { page: 'shop', slug: '' }
    if (path === '/cart') return { page: 'cart', slug: '' }
    if (path === '/checkout') return { page: 'checkout', slug: '' }
    if (path.startsWith('/checkout/success') || path.startsWith('/checkout/cancel')) {
      return { page: 'account', slug: '' }
    }
    if (path === '/account') return { page: 'account', slug: '' }
    return { page: 'home', slug: '' }
  }, [])

  // ==================== NAVIGATION & TOAST STATE ====================
  const [activePage, setActivePage] = useState<StorefrontPage>(initialRoute.page)
  const [previousPage, setPreviousPage] = useState<StorefrontPage>('shop')
  const [activeNavHighlight, setActiveNavHighlight] = useState<NavHighlightKey>(
    initialRoute.page === 'product' ? 'shop' : initialRoute.page,
  )
  const [accountTab, setAccountTab] = useState<AccountTab>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname
      if (p.startsWith('/checkout/success') || p.startsWith('/checkout/cancel')) {
        return 'orders'
      }
    }
    return 'profile'
  })
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev))
    }, 4000)
  }, [])

  // ==================== 1. AUTH & PROFILE ====================
  const { data: authMeData } = useAuthMe()
  const [user, setUser] = useState<AuthUser | null>(() => getUserFromToken())
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null)
  const logoutSession = useAuthLogout()

  useEffect(() => {
    if (authMeData) {
      const liveAvatar =
        authMeData.avatar ||
        (authMeData as unknown as { profile?: { avatar?: string } })?.profile?.avatar ||
        null
      const cleanAvatar =
        liveAvatar && String(liveAvatar).includes('@') && !String(liveAvatar).includes('/')
          ? null
          : liveAvatar
      setUser((prev) => ({
        ...authMeData,
        avatar: cleanAvatar ?? prev?.avatar ?? null,
      }))
    } else if (authMeData === null && !getUserFromToken()) {
      setUser(null)
    }
  }, [authMeData])

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null)
      showToast('Your session has expired. Please sign in again.', 'info')
    }
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [showToast])

  const [hasExistingProfile, setHasExistingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<UserProfileForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    date_of_birth: '',
    avatar: '',
    bio: '',
    newPassword: '',
  })
  const saveOwnProfileMutation = useSaveOwnProfile()

  // ==================== 2. CATALOG & SHOP FILTERS ====================
  const {
    data: catalogData,
    isLoading: catalogInitialLoading,
    isFetching: catalogFetching,
    isError: isCatalogError,
    error: catalogErrorObj,
    refetch: reloadCatalog,
  } = useCatalog()
  const categories = catalogData?.categories || []
  const products = catalogData?.products || []
  const [initialSkeletonHold, setInitialSkeletonHold] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setInitialSkeletonHold(false)
    }, 800)
    return () => window.clearTimeout(timer)
  }, [])

  const handleReloadCatalog = async () => {
    setInitialSkeletonHold(true)
    try {
      await reloadCatalog()
    } finally {
      window.setTimeout(() => {
        setInitialSkeletonHold(false)
      }, 800)
    }
  }

  const catalogLoading =
    initialSkeletonHold ||
    catalogInitialLoading ||
    (catalogFetching && categories.length === 0 && products.length === 0)
  const catalogError = isCatalogError
    ? extractErrorMessage(catalogErrorObj, 'Unable to load catalog from API')
    : null
  const [brokenImages, setBrokenImages] = useState<Record<string | number, boolean>>({})

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | string>('all')
  const [selectedSize, setSelectedSize] = useState('all')
  const [selectedColor, setSelectedColor] = useState('all')
  const [priceRange, setPriceRange] = useState<PriceRangePreset>('all')
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | null>(null)
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | null>(null)
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // ==================== 3. PRODUCT DETAILS & WISHLIST ====================
  const [selectedProductId, setSelectedProductId] = useState<number | string | null>(null)
  const [selectedDetailPricing, setSelectedDetailPricing] =
    useState<SelectedDetailPricing | null>(null)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)

  const { wishlist, wishlistProducts, toggleWishlist, clearWishlist } = useWishlist(
    products,
    user,
    showToast,
  )

  const handleToggleWishlist = (prodId: number | string, prodName?: string) => {
    if (!user) {
      showToast('Please sign in or register to add items to your favorites', 'info')
      setAuthModalMode('login')
      return
    }
    toggleWishlist(prodId, prodName)
  }

  useEffect(() => {
    if (!products.length) return
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
    if (currentPath.startsWith('/product/')) {
      const routeSlug = getPathSlug(currentPath)
      const matched = products.find(
        (p) =>
          getProductSlug(p) === routeSlug ||
          String(p.slug) === routeSlug ||
          String(p.key) === routeSlug ||
          String(p.id) === routeSlug ||
          String(p.name).toLowerCase() === routeSlug.toLowerCase(),
      )
      if (matched) {
        setSelectedProductId(matched.id)
        setActivePage('product')
        setActiveNavHighlight('shop')
      } else if (!selectedProductId) {
        setSelectedProductId(products[0].id)
      }
    } else if (!selectedProductId) {
      setSelectedProductId(products[0].id)
    }
  }, [products])

  useEffect(() => {
    if (!isWishlistOpen && !mobileFiltersOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsWishlistOpen(false)
        setMobileFiltersOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    const origOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = origOverflow
    }
  }, [isWishlistOpen, mobileFiltersOpen])

  const activeProduct = useMemo<Product | null>(() => {
    return (
      products.find((p) => String(p.id) === String(selectedProductId)) || products[0] || null
    )
  }, [products, selectedProductId])

  useEffect(() => {
    if (activePage === 'product' && activeProduct) {
      const slug = getProductSlug(activeProduct)
      if (slug) {
        const targetUrl = `/product/${slug}`
        if (typeof window !== 'undefined' && window.location.pathname !== targetUrl) {
          window.history.replaceState(
            { fromApp: true, page: 'product', productId: activeProduct.id, slug },
            '',
            targetUrl,
          )
        }
      }
    }
  }, [activePage, activeProduct])

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return
      const path = window.location.pathname
      if (path.startsWith('/product/')) {
        const slug = getPathSlug(path)
        if (slug && products.length > 0) {
          const matched = products.find(
            (p) =>
              getProductSlug(p) === slug ||
              String(p.slug) === slug ||
              String(p.key) === slug ||
              String(p.id) === slug ||
              String(p.name).toLowerCase() === slug.toLowerCase(),
          )
          if (matched) {
            setSelectedProductId(matched.id)
          }
        }
        setActivePage('product')
        setActiveNavHighlight('shop')
      } else if (path === '/shop') {
        setActivePage('shop')
        setActiveNavHighlight('shop')
      } else if (path === '/cart') {
        setActivePage('cart')
        setActiveNavHighlight('cart')
      } else if (path === '/checkout') {
        setActivePage('checkout')
      } else if (path === '/account') {
        setActivePage('account')
        setActiveNavHighlight('account')
      } else {
        setActivePage('home')
        setActiveNavHighlight('home')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [products])

  // ==================== 4. CART, ADDRESSES, ORDERS & PAYMENTS ====================
  const isAuthenticated = Boolean(user)
  const { data: cartData, refetch: refetchCart } = useCart(true)
  const cart = cartData || EMPTY_CART

  const addCartItemMutation = useAddCartItem()
  const updateCartItemMutation = useUpdateCartItem()
  const removeCartItemMutation = useRemoveCartItem()
  const clearCartMutation = useClearCart()

  const { data: addressesData, refetch: refetchAddresses } = useAddresses(isAuthenticated)
  const addresses = isAuthenticated && addressesData ? addressesData : []
  const saveAddressMutation = useSaveAddress()
  const setDefaultAddressMutation = useSetDefaultAddress()
  const deleteAddressMutation = useDeleteAddress()

  const [selectedAddressId, setSelectedAddressId] = useState<number | string | null>(null)
  const [showCheckoutNewAddr, setShowCheckoutNewAddr] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addressForm, setAddressForm] = useState<AddressFormPayload>({
    receiver_name: '',
    phone: '',
    street: '',
    city: '',
    status: true,
  })

  useEffect(() => {
    if (!user?.id) {
      setProfileForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        date_of_birth: '',
        avatar: '',
        bio: '',
        newPassword: '',
      })
      setHasExistingProfile(false)
      setAddressForm({
        receiver_name: '',
        phone: '',
        street: '',
        city: '',
        status: true,
      })
      setEditingAddress(null)
      return
    }

    const userInitialAvatar =
      user.avatar &&
      !(String(user.avatar).includes('@') && !String(user.avatar).includes('/')) &&
      (user.avatar.startsWith('/') ||
        user.avatar.startsWith('http://') ||
        user.avatar.startsWith('https://') ||
        user.avatar.startsWith('blob:') ||
        user.avatar.startsWith('data:'))
        ? user.avatar
        : ''

    setProfileForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: '',
      date_of_birth: '',
      avatar: userInitialAvatar,
      bio: '',
      newPassword: '',
    })
    setHasExistingProfile(false)

    getOwnProfile()
      .then((data) => {
        if (data) {
          const prof = data.profile
          setHasExistingProfile(Boolean(prof))
          const rawAvatar =
            prof?.avatar ||
            (data as unknown as { avatar?: string })?.avatar ||
            ''
          const cleanAvatar =
            rawAvatar &&
            !(String(rawAvatar).includes('@') && !String(rawAvatar).includes('/')) &&
            (rawAvatar.startsWith('/') ||
              rawAvatar.startsWith('http://') ||
              rawAvatar.startsWith('https://') ||
              rawAvatar.startsWith('blob:') ||
              rawAvatar.startsWith('data:'))
              ? rawAvatar
              : ''
          const rawPhone = prof?.phone
          const cleanPhone =
            rawPhone !== null &&
            rawPhone !== undefined &&
            !String(rawPhone).includes('@')
              ? String(rawPhone).trim()
              : ''

          setProfileForm({
            firstName: data.firstName || user.firstName || '',
            lastName: data.lastName || user.lastName || '',
            email: data.email || user.email || '',
            phone: cleanPhone,
            date_of_birth: prof?.date_of_birth
              ? String(prof.date_of_birth).slice(0, 10)
              : '',
            avatar: cleanAvatar,
            bio: prof?.bio ? String(prof.bio) : '',
            newPassword: '',
          })
          if (cleanAvatar) {
            setUser((prev) => (prev ? { ...prev, avatar: cleanAvatar } : prev))
          } else {
            setUser((prev) => (prev ? { ...prev, avatar: null } : prev))
          }
        } else {
          setHasExistingProfile(false)
        }
      })
      .catch(() => {
        setHasExistingProfile(false)
      })
  }, [user?.id])

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.status === true) || addresses[0]
      if (def) setSelectedAddressId(def.id)
    }
  }, [addresses, selectedAddressId])

  const [orderStatusFilter, setOrderStatusFilter] = useState('')
  const { data: ordersData, refetch: refetchOrders } = useMyOrders(
    orderStatusFilter,
    isAuthenticated,
  )
  const checkoutOrderMutation = useCheckoutOrder()
  const cancelOrderMutation = useCancelMyOrder()
  const downloadInvoiceMutation = useDownloadOrderInvoice()

  const { data: paymentsData, refetch: refetchPayments } = useMyPayments(isAuthenticated)
  const payments = isAuthenticated && paymentsData ? paymentsData : []
  const orders = useMemo<Order[]>(() => {
    const rawOrders = isAuthenticated && ordersData ? ordersData : []
    return rawOrders.map((ord) => {
      const hasPaidPayment = payments.some(
        (p) =>
          String(p.orderId ?? p.order_id) === String(ord.id) &&
          String(p.status).toLowerCase() === 'success',
      )
      if (hasPaidPayment && ord.payment_status !== 'paid') {
        return { ...ord, payment_status: 'paid' }
      }
      return ord
    })
  }, [isAuthenticated, ordersData, payments])
  const verifyPaymentMutation = useVerifyPayment()
  const deleteReviewMutation = useDeleteReview()

  const [checkoutPaymentMethod, setCheckoutPaymentMethod] =
    useState<CheckoutPaymentMethod>('')
  const [creditCardForm, setCreditCardForm] = useState<CreditCardFormState>({
    number: '',
    name: '',
    exp: '',
    cvv: '',
  })
  const [promoCode, setPromoCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.sessionStorage.getItem('stylehive_confirmed_order')
      return raw ? (JSON.parse(raw) as Order) : null
    } catch {
      return null
    }
  })
  const [paywayModalOrder, setPaywayModalOrder] = useState<Order | null>(null)
  const [openingPayway, setOpeningPayway] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (confirmedOrder) {
        window.sessionStorage.setItem(
          'stylehive_confirmed_order',
          JSON.stringify(confirmedOrder),
        )
      } else {
        window.sessionStorage.removeItem('stylehive_confirmed_order')
      }
    } catch {
      // ignore storage quota errors
    }
  }, [confirmedOrder])

  const handledPaywayRedirectRef = useRef(false)
  useEffect(() => {
    if (typeof window === 'undefined' || handledPaywayRedirectRef.current) return
    const path = window.location.pathname
    const params = new URLSearchParams(window.location.search)
    const tranId = params.get('tranId') || params.get('tran_id')

    if (tranId && (path === '/checkout' || path.startsWith('/checkout/success'))) {
      if (typeof window !== 'undefined' && window.self !== window.top) {
        try {
          window.parent?.postMessage({ type: 'ABA_PAYWAY_SUCCESS', tranId }, '*')
        } catch {
          // ignore
        }
        return
      }

      handledPaywayRedirectRef.current = true
      window.history.replaceState({ fromApp: true, page: 'home' }, '', '/')
      closeAbaPopupInPlace()
      setConfirmedOrder(null)
      setPaywayModalOrder(null)
      try {
        window.sessionStorage.removeItem('stylehive_confirmed_order')
      } catch {
        // ignore
      }
      setActivePage('home')
      setActiveNavHighlight('home')

      verifyPaymentMutation
        .mutateAsync(tranId)
        .then((verified) => {
          if (verified?.status === 'success') {
            playPaymentSuccessSound()
            showToast('Payment approved! Order is now marked as PAID.', 'success')
            void refetchOrders()
            void refetchPayments()
            void refetchCart()
          } else {
            showToast(`Payment status: ${verified?.status || 'pending'}`, 'info')
          }
        })
        .catch((err) => {
          showToast(extractErrorMessage(err, 'Unable to verify payment'), 'error')
        })
    } else if (path.startsWith('/checkout/cancel')) {
      if (typeof window !== 'undefined' && window.self !== window.top) {
        try {
          window.parent?.postMessage({ type: 'ABA_PAYWAY_CANCEL' }, '*')
        } catch {
          // ignore
        }
        return
      }
      handledPaywayRedirectRef.current = true
      window.history.replaceState({ fromApp: true, page: 'checkout' }, '', '/checkout')
      closeAbaPopupInPlace()
      showToast('Payment cancelled. You can pay anytime from this page or Order History.', 'info')
    }
  }, [isAuthenticated, refetchOrders, refetchPayments, showToast, verifyPaymentMutation])

  const cartSubtotal = Number(cart?.total_price || 0)
  const shippingEstimate = calculateShippingFee(cartSubtotal)
  const checkoutTotalEstimate = Math.max(
    0,
    Number((cartSubtotal + shippingEstimate - discountAmount).toFixed(2)),
  )

  const myReviewedProducts = useMemo<ReviewedProductEntry[]>(() => {
    if (!user) return []
    const results: ReviewedProductEntry[] = []
    products.forEach((p) => {
      ;(p.reviewsList || []).forEach((rev) => {
        if (
          Number(rev.userId || rev.user?.id) === Number(user.id) ||
          rev.user?.firstName === user.firstName
        ) {
          results.push({ product: p, review: rev })
        }
      })
    })
    return results
  }, [products, user])

  const resolvePrimaryImage = useCallback(
    (prod?: Product | null, fallbackIdx: number | string = 0) => {
      const enrichedProd =
        prod && (!prod.images || prod.images.length === 0) && prod.id
          ? products.find((p) => String(p.id) === String(prod.id)) || prod
          : prod
      return getProductPrimaryImage(enrichedProd, fallbackIdx, brokenImages)
    },
    [brokenImages, products],
  )

  // ==================== NAVIGATION HANDLERS ====================
  const navigateToPage = (page: StorefrontPage, options: NavigateOptions = {}) => {
    const {
      product = null,
      pushHistory = true,
      replaceHistory = false,
      navHighlight = null,
      noScroll = false,
    } = options

    if (activePage !== page && activePage !== 'product') {
      setPreviousPage(activePage)
    }

    setActivePage(page)
    if (navHighlight) {
      setActiveNavHighlight(navHighlight)
    } else if (
      page === 'home' ||
      page === 'shop' ||
      page === 'cart' ||
      page === 'account'
    ) {
      setActiveNavHighlight(page)
    }

    let url = '/'
    if (page === 'shop') url = '/shop'
    else if (page === 'cart') url = '/cart'
    else if (page === 'checkout') url = '/checkout'
    else if (page === 'account') url = '/account'
    else if (page === 'product') {
      const prod = product || activeProduct
      const slug = getProductSlug(prod)
      url = slug ? `/product/${slug}` : '/shop'
    }

    if (typeof window !== 'undefined') {
      if (pushHistory) {
        if (window.location.pathname !== url) {
          window.history.pushState(
            { fromApp: true, page, productId: product?.id },
            '',
            url,
          )
        }
      } else if (replaceHistory) {
        if (window.location.pathname !== url) {
          window.history.replaceState(
            { fromApp: true, page, productId: product?.id },
            '',
            url,
          )
        }
      }

      if (!noScroll) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  const openProductDetails = (
    product: Product,
    customPricing: SelectedDetailPricing | null = null,
  ) => {
    if (activePage !== 'product') {
      setPreviousPage(activePage)
    }
    setSelectedProductId(product.id)
    setSelectedDetailPricing(customPricing)
    setActivePage('product')
    setActiveNavHighlight('shop')
    const slug = getProductSlug(product)
    const targetUrl = slug ? `/product/${slug}` : `/product/${product.id}`
    if (typeof window !== 'undefined' && window.location.pathname !== targetUrl) {
      window.history.pushState(
        { fromApp: true, page: 'product', productId: product.id, slug },
        '',
        targetUrl,
      )
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBackFromProduct = () => {
    if (typeof window !== 'undefined' && window.history.state?.fromApp) {
      window.history.back()
    } else {
      navigateToPage(previousPage || 'shop')
    }
  }

  const navigateHeaderCategory = (navKey: string) => {
    setActiveNavHighlight(navKey)
    if (navKey === 'home') {
      navigateToPage('home', { navHighlight: 'home' })
      return
    }
    setSelectedSize('all')
    setSelectedColor('all')
    setPriceRange('all')
    setAppliedMinPrice(null)
    setAppliedMaxPrice(null)
    if (navKey === 'shop') {
      setSelectedCategory('all')
      setAvailabilityFilter('all')
      setSortBy('newest')
    } else if (navKey === 'new-arrivals') {
      const cat = categories.find(
        (c) => c.slug === 'new-arrivals' || c.name.toLowerCase().includes('new'),
      )
      setSelectedCategory(cat ? cat.id : 'all')
      setAvailabilityFilter('all')
      setSortBy('newest')
    } else if (navKey === 'men') {
      const cat = categories.find(
        (c) => c.slug === 'men' || c.name.toLowerCase() === 'men',
      )
      setSelectedCategory(cat ? cat.id : 'men')
      setAvailabilityFilter('all')
    } else if (navKey === 'women') {
      const cat = categories.find(
        (c) => c.slug === 'women' || c.name.toLowerCase() === 'women',
      )
      setSelectedCategory(cat ? cat.id : 'women')
      setAvailabilityFilter('all')
    } else if (navKey === 'sale') {
      setSelectedCategory('all')
      setAvailabilityFilter('on_sale')
    }
    navigateToPage('shop', { navHighlight: navKey })
  }

  const handleSelectCategory = (cat: Category) => {
    setActiveNavHighlight('shop')
    setSelectedCategory(cat.id)
    setSelectedSize('all')
    setSelectedColor('all')
    setPriceRange('all')
    setAppliedMinPrice(null)
    setAppliedMaxPrice(null)
    setAvailabilityFilter('all')
    setSortBy('newest')
    setSearchQuery('')
    navigateToPage('shop', { navHighlight: 'shop' })
  }

  const goToAccountTab = (tabName: AccountTab) => {
    if (!user) {
      showToast('Please sign in or create an account first', 'info')
      setAuthModalMode('login')
      return
    }
    setAccountTab(tabName)
    navigateToPage('account', { navHighlight: 'account' })
  }

  // ==================== DOMAIN ACTION HANDLERS ====================
  const handleAddToCart = async (
    variantObj: ProductVariant | null,
    qty = 1,
    productObj: Product | null = activeProduct,
  ) => {
    if (!variantObj || !variantObj.id) {
      showToast('Important: Please select an available product variant first', 'error')
      return
    }
    if (Number(variantObj.stock_qty || 0) < qty) {
      showToast('Selected variant does not have enough stock available', 'error')
      return
    }
    try {
      await addCartItemMutation.mutateAsync({
        variantId: variantObj.id,
        quantity: Number(qty),
        variant: variantObj,
        product: productObj || activeProduct || undefined,
      })
      showToast(
        `Added ${productObj?.name || 'Product'} (${
          [variantObj.color, variantObj.size].filter(Boolean).join(' / ') ||
          variantObj.sku ||
          'Default'
        }) to cart`,
        'success',
      )
    } catch (err: unknown) {
      showToast(extractErrorMessage(err, 'Could not add item to cart'), 'error')
    }
  }

  const handleOurProductAddToCart = async (item: EnrichedOurProductItem | Product) => {
    const showcase = item as EnrichedOurProductItem
    const targetProd =
      showcase.realProduct ||
      ('variants' in item && item.variants ? (item as Product) : null) ||
      products.find(
        (p) =>
          String(p.id) === String(showcase.catalogId ?? (item as Product).id) ||
          p.name?.toLowerCase() === item.name.toLowerCase(),
      )

    if (targetProd && targetProd.variants && targetProd.variants.length > 0) {
      const inStock =
        targetProd.variants.find((v) => Number(v.stock_qty || 0) > 0) ||
        targetProd.variants[0]
      await handleAddToCart(inStock, 1, targetProd)
      return
    }

    if (targetProd) {
      openProductDetails(targetProd)
      showToast('This product currently has no active variants in stock', 'info')
      return
    }

    showToast('Product is not yet available in the database catalog', 'info')
  }

  const handleUpdateCartQty = async (
    itemId: number | string,
    newQty: number,
    maxStock?: number,
  ) => {
    if (newQty < 1) return
    if (maxStock !== undefined && newQty > maxStock) {
      showToast(`Only ${maxStock} units available in stock for this variant`, 'error')
      return
    }
    try {
      await updateCartItemMutation.mutateAsync({
        itemId,
        payload: { quantity: newQty },
      })
    } catch (err: unknown) {
      showToast(extractErrorMessage(err, 'Unable to update quantity'), 'error')
    }
  }

  const handleRemoveCartItem = async (itemId: number | string) => {
    try {
      await removeCartItemMutation.mutateAsync(itemId)
      showToast('Removed item from shopping cart', 'info')
    } catch (err: unknown) {
      showToast(extractErrorMessage(err, 'Unable to remove item'), 'error')
    }
  }

  const handleAddWishlistToCart = (prod: Product) => {
    const vars = prod.variants || []
    const inStockVariant = vars.find((v) => Number(v.stock_qty || 0) > 0) || vars[0]
    if (!inStockVariant || !inStockVariant.id) {
      showToast('This item has no selectable stock currently', 'error')
      return
    }
    void handleAddToCart(inStockVariant, 1, prod)
  }

  const handleAddAllWishlistToCart = async () => {
    if (!user) {
      showToast('Please sign in or register to add items to your cart', 'info')
      setAuthModalMode('login')
      return
    }
    const inStockItems = wishlistProducts.filter((p) => {
      const vars = p.variants || []
      return vars.some((v) => Number(v.stock_qty || 0) > 0)
    })

    if (inStockItems.length === 0) {
      showToast('No in-stock items in wishlist to add', 'info')
      return
    }

    let addedCount = 0
    for (const prod of inStockItems) {
      const vars = prod.variants || []
      const v = vars.find((item) => Number(item.stock_qty || 0) > 0) || vars[0]
      if (v?.id) {
        try {
          await addCartItemMutation.mutateAsync({ variantId: v.id, quantity: 1 })
          addedCount++
        } catch {}
      }
    }

    if (addedCount > 0) {
      await refetchCart()
      showToast(
        `Added ${addedCount} wishlist item${addedCount > 1 ? 's' : ''} to your cart`,
        'success',
      )
    } else {
      showToast('Could not add items to cart', 'error')
    }
  }

  const handleApplyPromo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const code = promoCode.trim().toUpperCase()
    const subtotal = Number(cart?.total_price || 0)
    if (code === 'SAVE10' || code === 'WELCOME10') {
      const disc = Number((subtotal * 0.1).toFixed(2))
      setDiscountAmount(disc)
      showToast(`Applied 10% discount (-$${disc.toFixed(2)})`, 'success')
    } else if (code === 'VITUSMOS') {
      const disc = Math.min(20, subtotal)
      setDiscountAmount(disc)
      showToast('Applied $20.00 studio discount', 'success')
    } else {
      setDiscountAmount(0)
      showToast(code ? 'Invalid promo code' : 'Please enter a promo code', 'info')
    }
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      setAuthModalMode('login')
      return
    }
    if (!cart?.items?.length) {
      showToast('Your shopping cart is empty', 'error')
      return
    }
    if (!selectedAddressId) {
      showToast('Step 1: Please select or add a delivery address', 'error')
      return
    }

    if (!checkoutPaymentMethod) {
      showToast(
        'Step 4: Please select a payment method (Credit card or PayWay KHQR)',
        'error',
      )
      return
    }

    const outOfStockItem = cart.items.find(
      (i) =>
        i.variant?.stock_qty !== undefined &&
        Number(i.variant.stock_qty) < Number(i.quantity),
    )
    if (outOfStockItem) {
      showToast(
        `Insufficient stock for ${outOfStockItem.variant?.product?.name || 'item'}`,
        'error',
      )
      return
    }

    try {
      const orderItems = cart.items.map((i) => ({
        variantId: Number(i.variantId || i.variant?.id),
        quantity: Number(i.quantity || 1),
      }))
      const createdOrder = await checkoutOrderMutation.mutateAsync({
        addressId: selectedAddressId,
        discount: discountAmount,
        shipping_fee: shippingEstimate,
        items: orderItems,
      })
      setConfirmedOrder(createdOrder)
      setPromoCode('')
      setDiscountAmount(0)
      await clearCartMutation.mutateAsync()
      showToast(
        `Order ${createdOrder?.order_number || ''} placed successfully!`,
        'success',
      )
      playOrderSuccessSound()
    } catch (err: unknown) {
      showToast(extractErrorMessage(err, 'Failed to place order'), 'error')
    }
  }

  const handleSaveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      if (editingAddress) {
        await saveAddressMutation.mutateAsync({
          id: editingAddress.id,
          payload: addressForm,
        })
        showToast('Delivery address updated', 'success')
      } else {
        const created = await saveAddressMutation.mutateAsync({
          payload: addressForm,
        })
        if (created?.id) setSelectedAddressId(created.id)
        showToast('New delivery address saved', 'success')
      }
      setEditingAddress(null)
      setShowCheckoutNewAddr(false)
      setAddressForm({
        receiver_name: '',
        phone: '',
        street: '',
        city: '',
        status: true,
      })
      await refetchAddresses()
    } catch (err: unknown) {
      showToast(extractErrorMessage(err, 'Could not save address'), 'error')
    }
  }

  const handleSetDefaultAddress = async (id: number | string) => {
    try {
      await setDefaultAddressMutation.mutateAsync(id)
      showToast('Default address updated', 'success')
    } catch (err: unknown) {
      showToast(extractErrorMessage(err, 'Unable to set default address'), 'error')
    }
  }

  const handleRemoveAddress = async (id: number | string) => {
    try {
      await deleteAddressMutation.mutateAsync(id)
      showToast('Address removed', 'info')
    } catch (err: unknown) {
      showToast(extractErrorMessage(err, 'Unable to remove address'), 'error')
    }
  }

  const handleCancelOrder = async (orderId: number | string) => {
    try {
      await cancelOrderMutation.mutateAsync(orderId)
      showToast('Order cancelled and stock restored', 'info')
    } catch (err: unknown) {
      showToast(extractErrorMessage(err, 'Unable to cancel order'), 'error')
    }
  }

  const handleDownloadInvoice = async (orderId: number | string, orderNumber?: string) => {
    try {
      await downloadInvoiceMutation.mutateAsync({ orderId, orderNumber })
      showToast(`Downloaded invoice for ${orderNumber || `#${orderId}`}`, 'success')
    } catch (err: unknown) {
      showToast(extractErrorMessage(err, 'Unable to download invoice'), 'error')
    }
  }

  const handleVerifyPayment = async (tranId: string) => {
    try {
      const verified = await verifyPaymentMutation.mutateAsync(tranId)
      if (verified?.status === 'success') {
        showToast('Payment verified & order marked as PAID!', 'success')
        playPaymentSuccessSound()
      } else {
        showToast(`Payment status: ${verified?.status || 'pending'}`, 'info')
      }
    } catch (err: unknown) {
      showToast(extractErrorMessage(err, 'Unable to verify payment'), 'error')
    }
  }

  const handleDeleteReview = async (productId: number | string, reviewId: number | string) => {
    try {
      await deleteReviewMutation.mutateAsync({ productId, reviewId })
      showToast('Review deleted', 'info')
    } catch (err: unknown) {
      showToast(extractErrorMessage(err, 'Unable to delete review'), 'error')
    }
  }

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const requestedPasswordChange = Boolean(profileForm.newPassword.trim())
      const saved = await saveOwnProfileMutation.mutateAsync({
        hasExistingProfile,
        payload: profileForm,
      })
      setHasExistingProfile(true)
      if (saved) {
        const prof = saved.profile
        const candidateAvatar =
          prof?.avatar !== undefined && prof?.avatar !== null ? prof.avatar : profileForm.avatar
        const finalAvatar =
          candidateAvatar &&
          String(candidateAvatar).includes('@') &&
          !String(candidateAvatar).includes('/')
            ? ''
            : candidateAvatar
        setUser((prev) =>
          prev
            ? {
                ...prev,
                firstName: saved.firstName || profileForm.firstName,
                lastName: saved.lastName || profileForm.lastName,
                fullName: `${saved.firstName || profileForm.firstName} ${
                  saved.lastName || profileForm.lastName
                }`.trim(),
                avatar: finalAvatar || null,
              }
            : prev,
        )
        const rawProfPhone =
          prof?.phone !== null && prof?.phone !== undefined
            ? String(prof.phone)
            : profileForm.phone
            ? String(profileForm.phone)
            : ''
        const cleanProfPhone =
          rawProfPhone && !rawProfPhone.includes('@') ? rawProfPhone.trim() : ''

        setProfileForm({
          firstName: saved.firstName || profileForm.firstName,
          lastName: saved.lastName || profileForm.lastName,
          email: saved.email || profileForm.email,
          phone: cleanProfPhone,
          date_of_birth: prof?.date_of_birth
            ? String(prof.date_of_birth).slice(0, 10)
            : profileForm.date_of_birth
            ? String(profileForm.date_of_birth).slice(0, 10)
            : '',
          avatar: finalAvatar || '',
          bio: prof?.bio || profileForm.bio || '',
          newPassword: '',
        })
      } else {
        setProfileForm((prev) => ({ ...prev, newPassword: '' }))
      }
      if (requestedPasswordChange) {
        showToast('Profile saved. Note: password changes require administrator assistance.', 'info')
      } else {
        showToast('Profile & account settings saved', 'success')
      }
    } catch (err: unknown) {
      showToast(extractErrorMessage(err, 'Unable to update profile'), 'error')
    }
  }

  const handleLogout = () => {
    logoutSession()
    setUser(null)
    setProfileForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      date_of_birth: '',
      avatar: '',
      bio: '',
      newPassword: '',
    })
    setHasExistingProfile(false)
    setAddressForm({
      receiver_name: '',
      phone: '',
      street: '',
      city: '',
      status: true,
    })
    setEditingAddress(null)
    setSelectedAddressId(null)
    setConfirmedOrder(null)
    setActivePage('home')
    showToast('Signed out of your customer account', 'info')
  }

  const handleAuthSuccess = (userData: AuthUser | null) => {
    setUser(userData)
    setAuthModalMode(null)
    setProfileForm({
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      email: userData?.email || '',
      phone: '',
      date_of_birth: '',
      avatar:
        userData?.avatar &&
        !(String(userData.avatar).includes('@') && !String(userData.avatar).includes('/'))
          ? userData.avatar
          : '',
      bio: '',
      newPassword: '',
    })
    setHasExistingProfile(false)
    setAddressForm({
      receiver_name: '',
      phone: '',
      street: '',
      city: '',
      status: true,
    })
    setEditingAddress(null)
    setSelectedAddressId(null)
    void refetchCart()
    void refetchAddresses()
    void refetchOrders()
    void refetchPayments()
  }

  const handlePaymentUpdated = useCallback(() => {
    void refetchOrders()
    void refetchPayments()
    setConfirmedOrder((prev) =>
      prev ? { ...prev, status: 'paid', payment_status: 'paid' } : null,
    )
  }, [refetchOrders, refetchPayments])

  const handleOpenPaywayModal = useCallback(
    async (order: Order, paymentOption?: string) => {
      if (!order?.id || openingPayway) return
      setOpeningPayway(true)
      try {
        const resolvedOption =
          paymentOption || (checkoutPaymentMethod === 'cards' ? 'cards' : 'abapay_khqr')
        await openAbaPaywayKhqrPopup({
          order,
          paymentOption: resolvedOption,
          onPaymentSuccess: () => {
            closeAbaPopupInPlace()
            setConfirmedOrder(null)
            setPaywayModalOrder(null)
            try {
              window.sessionStorage.removeItem('stylehive_confirmed_order')
            } catch {
              // ignore
            }
            navigateToPage('home')
          },
          onPaymentUpdated: () => {
            void refetchOrders()
            void refetchPayments()
            void refetchCart()
          },
          showToast,
        })
      } finally {
        setOpeningPayway(false)
      }
    },
    [checkoutPaymentMethod, navigateToPage, openingPayway, refetchCart, refetchOrders, refetchPayments, showToast],
  )

  const contextValue: StorefrontContextValue = {
    activePage,
    setActivePage,
    previousPage,
    activeNavHighlight,
    accountTab,
    setAccountTab,
    toast,
    setToast,
    showToast,
    navigateToPage,
    openProductDetails,
    handleBackFromProduct,
    navigateHeaderCategory,
    handleSelectCategory,
    goToAccountTab,
    user,
    setUser,
    authModalMode,
    setAuthModalMode,
    hasExistingProfile,
    setHasExistingProfile,
    profileForm,
    setProfileForm,
    savingProfile: saveOwnProfileMutation.isPending,
    handleSaveProfile,
    handleLogout,
    handleAuthSuccess,
    categories,
    products,
    catalogLoading,
    catalogError,
    handleReloadCatalog,
    brokenImages,
    setBrokenImages,
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
    activeProduct,
    selectedDetailPricing,
    isWishlistOpen,
    setIsWishlistOpen,
    wishlist,
    wishlistProducts,
    handleToggleWishlist,
    clearWishlist,
    resolvePrimaryImage,
    cart,
    cartSubtotal,
    shippingEstimate,
    checkoutTotalEstimate,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    showCheckoutNewAddr,
    setShowCheckoutNewAddr,
    editingAddress,
    setEditingAddress,
    addressForm,
    setAddressForm,
    savingAddress: saveAddressMutation.isPending,
    handleSaveAddress,
    handleSetDefaultAddress,
    handleRemoveAddress,
    orders,
    orderStatusFilter,
    setOrderStatusFilter,
    handleCancelOrder,
    handleDownloadInvoice,
    payments,
    handleVerifyPayment,
    myReviewedProducts,
    handleDeleteReview,
    checkoutPaymentMethod,
    setCheckoutPaymentMethod,
    creditCardForm,
    setCreditCardForm,
    promoCode,
    setPromoCode,
    discountAmount,
    handleApplyPromo,
    placingOrder: checkoutOrderMutation.isPending,
    handlePlaceOrder,
    confirmedOrder,
    setConfirmedOrder,
    paywayModalOrder,
    setPaywayModalOrder,
    openingPayway,
    handleOpenPaywayModal,
    handlePaymentUpdated,
    handleAddToCart,
    handleOurProductAddToCart,
    handleUpdateCartQty,
    handleRemoveCartItem,
    handleAddWishlistToCart,
    handleAddAllWishlistToCart,
  }

  return (
    <StorefrontContext.Provider value={contextValue}>
      {children}
    </StorefrontContext.Provider>
  )
}

export function useStorefront(): StorefrontContextValue {
  const ctx = useContext(StorefrontContext)
  if (!ctx) {
    throw new Error('useStorefront must be used within a StorefrontProvider')
  }
  return ctx
}
