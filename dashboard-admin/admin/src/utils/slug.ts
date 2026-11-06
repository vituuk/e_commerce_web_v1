export type AdminDialogAction = 'view' | 'edit' | 'add' | null

export interface ParsedAdminRoute {
  label: string
  baseSlug: string
  itemSlug: string
  action: AdminDialogAction
  isLogin: boolean
  isRoot: boolean
  isKnownRoute: boolean
}

const CANONICAL_LABEL_TO_SLUG: Record<string, string> = {
  Dashboard: 'dashboard',
  Orders: 'orders',
  'Order items': 'order-items',
  Products: 'products',
  'Product variants': 'product-variants',
  'Product images': 'product-images',
  Categories: 'categories',
  Carts: 'carts',
  'Cart items': 'cart-items',
  Users: 'users',
  'User profiles': 'user-profiles',
  Roles: 'roles',
  'User roles': 'user-roles',
  Addresses: 'addresses',
  Payments: 'payments',
  Reviews: 'reviews',
  Customers: 'customers',
  Settings: 'settings',
  'Edit Profile': 'profile',
  POS: 'pos',
}

const LABEL_ALIASES: Record<string, string> = {
  overview: 'Dashboard',
  dashboard: 'Dashboard',
  'admin profile': 'Edit Profile',
  'edit profile': 'Edit Profile',
  profile: 'Edit Profile',
  'roles & access': 'Roles',
}

export const ADMIN_LAST_PATH_KEY = 'commerceos_admin_last_path'
export const ADMIN_INTENDED_PATH_KEY = 'commerceos_admin_intended_path'

const SLUG_TO_LABEL: Record<string, string> = {
  '': 'Dashboard',
  dashboard: 'Dashboard',
  overview: 'Dashboard',
  orders: 'Orders',
  order: 'Orders',
  'order-items': 'Order items',
  order_items: 'Order items',
  orderitems: 'Order items',
  products: 'Products',
  product: 'Products',
  'product-variants': 'Product variants',
  product_variants: 'Product variants',
  productvariants: 'Product variants',
  'product-images': 'Product images',
  product_images: 'Product images',
  productimages: 'Product images',
  categories: 'Categories',
  category: 'Categories',
  carts: 'Carts',
  cart: 'Carts',
  'cart-items': 'Cart items',
  cart_items: 'Cart items',
  cartitems: 'Cart items',
  users: 'Users',
  user: 'Users',
  'user-profiles': 'User profiles',
  user_profiles: 'User profiles',
  userprofiles: 'User profiles',
  roles: 'Roles',
  role: 'Roles',
  'user-roles': 'User roles',
  user_roles: 'User roles',
  userroles: 'User roles',
  addresses: 'Addresses',
  address: 'Addresses',
  payments: 'Payments',
  payment: 'Payments',
  reviews: 'Reviews',
  review: 'Reviews',
  customers: 'Customers',
  customer: 'Customers',
  settings: 'Settings',
  setting: 'Settings',
  profile: 'Edit Profile',
  'edit-profile': 'Edit Profile',
  'admin-profile': 'Edit Profile',
  pos: 'POS',
}

export function toUrlSlug(value?: string | number | null): string {
  if (value === undefined || value === null) return ''
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/^#+/, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateLiveSlug(text?: string | number | null): string {
  if (text === undefined || text === null) return ''
  return String(text)
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
}

export function normalizeAdminLabel(label?: string | null): string {
  const raw = String(label || '').trim()
  if (!raw) return 'Dashboard'
  const lower = raw.toLowerCase()
  if (LABEL_ALIASES[lower]) return LABEL_ALIASES[lower]
  const exact = Object.keys(CANONICAL_LABEL_TO_SLUG).find((k) => k.toLowerCase() === lower)
  if (exact) return exact
  const bySlug = SLUG_TO_LABEL[toUrlSlug(raw)]
  return bySlug || raw
}

export function getAdminPageSlug(label?: string | null): string {
  const normalized = normalizeAdminLabel(label)
  return CANONICAL_LABEL_TO_SLUG[normalized] || toUrlSlug(normalized) || 'dashboard'
}

export function getAdminPagePath(label?: string | null): string {
  return `/${getAdminPageSlug(label)}`
}

export function parseAdminPathname(pathname?: string | null): ParsedAdminRoute {
  const cleaned = String(pathname || '/').split('?')[0].split('#')[0]
  const segments = cleaned
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)
    .map((seg) => {
      try {
        return decodeURIComponent(seg)
      } catch {
        return seg
      }
    })

  const firstLower = (segments[0] || '').toLowerCase().trim()
  if (firstLower === 'login' || firstLower === 'signin') {
    return {
      label: 'Dashboard',
      baseSlug: 'dashboard',
      itemSlug: '',
      action: null,
      isLogin: true,
      isRoot: false,
      isKnownRoute: true,
    }
  }

  const isRoot = firstLower === ''
  const matchedLabel =
    SLUG_TO_LABEL[firstLower] || SLUG_TO_LABEL[toUrlSlug(firstLower)] || undefined
  const isKnownRoute = isRoot || Boolean(matchedLabel)
  const resolvedLabel = matchedLabel || 'Dashboard'
  const baseSlug = getAdminPageSlug(resolvedLabel)

  const second = (segments[1] || '').trim()
  const secondLower = second.toLowerCase()
  const thirdLower = (segments[2] || '').toLowerCase().trim()

  if (!second) {
    return {
      label: resolvedLabel,
      baseSlug,
      itemSlug: '',
      action: null,
      isLogin: false,
      isRoot,
      isKnownRoute,
    }
  }

  if (secondLower === 'new' || secondLower === 'add' || secondLower === 'create') {
    return {
      label: resolvedLabel,
      baseSlug,
      itemSlug: '',
      action: 'add',
      isLogin: false,
      isRoot: false,
      isKnownRoute,
    }
  }

  return {
    label: resolvedLabel,
    baseSlug,
    itemSlug: toUrlSlug(second) || secondLower,
    action: thirdLower === 'edit' ? 'edit' : 'view',
    isLogin: false,
    isRoot: false,
    isKnownRoute,
  }
}

function cleanCellValue(val?: string): string {
  const str = String(val ?? '').trim()
  return str === '—' || str === '-' ? '' : str
}

export function getRecordSlug(columns: string[], row: string[]): string {
  const lowerCols = columns.map((c) => c.toLowerCase().trim())
  const rawId = cleanCellValue(row[0]).replace(/^#+/, '')

  const slugIdx = lowerCols.indexOf('slug')
  if (slugIdx !== -1) {
    const slugVal = toUrlSlug(cleanCellValue(row[slugIdx]))
    if (slugVal) return slugVal
  }

  const orderIdx = lowerCols.indexOf('order #')
  if (orderIdx !== -1 && lowerCols[0] === 'id' && lowerCols.includes('total')) {
    const orderNum = toUrlSlug(cleanCellValue(row[orderIdx]))
    if (orderNum) return orderNum
  }

  const skuIdx = lowerCols.indexOf('sku')
  if (skuIdx !== -1) {
    const skuVal = toUrlSlug(cleanCellValue(row[skuIdx]))
    if (skuVal) return skuVal
  }

  const codeIdx = lowerCols.indexOf('code')
  if (codeIdx !== -1) {
    const codeVal = toUrlSlug(cleanCellValue(row[codeIdx]))
    if (codeVal) return codeVal
  }

  const firstIdx = lowerCols.indexOf('first name')
  const lastIdx = lowerCols.indexOf('last name')
  if (firstIdx !== -1 || lastIdx !== -1) {
    const full = toUrlSlug(
      `${firstIdx !== -1 ? cleanCellValue(row[firstIdx]) : ''} ${
        lastIdx !== -1 ? cleanCellValue(row[lastIdx]) : ''
      }`,
    )
    if (full && rawId) return `${full}-${rawId}`
    if (full) return full
  }

  const nameColIdx = lowerCols.findIndex(
    (c) =>
      c === 'product name' ||
      c === 'category name' ||
      c === 'role name' ||
      c === 'recipient name',
  )
  if (nameColIdx !== -1) {
    const nameSlug = toUrlSlug(cleanCellValue(row[nameColIdx]))
    if (nameSlug && rawId && slugIdx === -1) return `${nameSlug}-${rawId}`
    if (nameSlug) return nameSlug
  }

  if (rawId) return toUrlSlug(rawId) || rawId
  return toUrlSlug(cleanCellValue(row[1])) || 'item'
}

export function doesRowMatchSlug(columns: string[], row: string[], targetSlug: string): boolean {
  const cleanTarget = toUrlSlug(targetSlug)
  if (!cleanTarget) return false

  if (getRecordSlug(columns, row) === cleanTarget) return true

  const rawId = cleanCellValue(row[0]).replace(/^#+/, '')
  if (rawId && toUrlSlug(rawId) === cleanTarget) return true

  const lowerCols = columns.map((c) => c.toLowerCase().trim())
  const slugIdx = lowerCols.indexOf('slug')
  if (slugIdx !== -1 && toUrlSlug(cleanCellValue(row[slugIdx])) === cleanTarget) return true

  const nameIdx = lowerCols.findIndex(
    (c) => c === 'product name' || c === 'category name' || c === 'order #' || c === 'sku',
  )
  if (nameIdx !== -1 && toUrlSlug(cleanCellValue(row[nameIdx])) === cleanTarget) return true

  return false
}

export function buildAdminResourcePath(
  resourceKey: string,
  action: AdminDialogAction,
  columns?: string[],
  row?: string[],
): string {
  const basePath = getAdminPagePath(resourceKey)
  if (!action) return basePath
  if (action === 'add') return `${basePath}/new`
  if (columns && row) {
    const recordSlug = getRecordSlug(columns, row)
    if (recordSlug) {
      return action === 'edit' ? `${basePath}/${recordSlug}/edit` : `${basePath}/${recordSlug}`
    }
  }
  return basePath
}

