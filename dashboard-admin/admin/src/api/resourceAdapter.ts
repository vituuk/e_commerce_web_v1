import {
  addressApi,
  API_BASE_URL,
  authApi,
  cartApi,
  categoryApi,
  dataUrlToFile,
  getStoredUser,
  orderApi,
  paymentApi,
  productApi,
  productImageApi,
  resolveImageUrl,
  reviewApi,
  roleApi,
  userRoleApi,
  variantApi,
} from './client'

export function parseId(raw?: string): number {
  if (!raw) return 0
  const parenMatch = String(raw).match(/\(#(\d+)\)/)
  if (parenMatch) return Number(parenMatch[1])
  const hashMatch = String(raw).match(/#(\d+)/)
  if (hashMatch) return Number(hashMatch[1])
  const numMatch = String(raw).match(/(\d+)/)
  return numMatch ? Number(numMatch[1]) : 0
}

export function parseMoney(raw?: string): number {
  if (!raw) return 0
  const cleaned = String(raw).replace(/[^0-9.-]+/g, '')
  const val = parseFloat(cleaned)
  return Number.isFinite(val) ? val : 0
}

export function parseActive(raw?: string): boolean {
  if (!raw) return true
  const lower = String(raw).trim().toLowerCase()
  if (['inactive', 'false', 'no', '0', 'disabled'].includes(lower)) return false
  return true
}

export function parseYesNo(raw?: string): boolean {
  if (!raw) return false
  const lower = String(raw).trim().toLowerCase()
  return ['yes', 'true', '1', 'default', 'primary', 'active'].includes(lower)
}

export function slugify(text: string): string {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function fmtDate(val?: string | null): string {
  if (!val) return '—'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return String(val)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

export function capitalize(s?: string): string {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function cleanCell(raw?: string): string {
  const s = (raw ?? '').trim()
  return s === '—' ? '' : s
}

function normalizeStoredMediaUrl(raw?: string): string {
  const cleaned = cleanCell(raw)
  if (!cleaned) return ''
  if (API_BASE_URL && cleaned.startsWith(`${API_BASE_URL}/uploads/`)) {
    return cleaned.slice(API_BASE_URL.length)
  }
  return cleaned
}

async function resolveProductIdFromText(raw?: string): Promise<number> {
  const direct = parseId(raw)
  if (direct > 0) return direct
  const { data: products } = await productApi.list({ limit: 100 })
  if (raw) {
    const found = products.find(
      (p: { id: number; name?: string; slug?: string }) =>
        p.name?.toLowerCase() === raw.trim().toLowerCase() ||
        p.slug?.toLowerCase() === raw.trim().toLowerCase(),
    )
    if (found) return Number(found.id)
  }
  return products[0]?.id ? Number(products[0].id) : 1
}

async function resolveVariantIdFromText(raw?: string): Promise<number> {
  const direct = parseId(raw)
  if (direct > 0) return direct
  const { data: products } = await productApi.list({ limit: 100 })
  for (const p of products) {
    try {
      const res = await variantApi.listByProduct(p.id)
      const variants = Array.isArray(res?.variants) ? res.variants : []
      if (raw) {
        const found = variants.find(
          (v: { id: number; sku?: string }) =>
            v.sku?.toLowerCase() === raw.trim().toLowerCase(),
        )
        if (found) return Number(found.id)
      }
      if (variants[0]?.id) return Number(variants[0].id)
    } catch {
      // ignore
    }
  }
  return 1
}

async function resolveCategoryIdFromText(raw?: string): Promise<number | null> {
  const direct = parseId(raw)
  if (direct > 0) return direct
  if (!raw || raw.toLowerCase().includes('uncategorized') || raw.toLowerCase().includes('none')) {
    return null
  }
  const { data: categories } = await categoryApi.list({ limit: 100 })
  const found = categories.find(
    (c: { id: number; name?: string; slug?: string }) =>
      c.name?.toLowerCase() === raw.trim().toLowerCase() ||
      c.slug?.toLowerCase() === raw.trim().toLowerCase(),
  )
  return found ? Number(found.id) : categories[0]?.id ? Number(categories[0].id) : null
}

export interface ResourcePaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface ResourceQueryParams {
  page?: number
  limit?: number
  q?: string
  status?: string
  categoryId?: number | string
}

export interface PaginatedResourceResult {
  rows: string[][]
  pagination: ResourcePaginationMeta
  serverFiltered: boolean
}

function buildFallbackPagination(
  total: number,
  page = 1,
  limit = 10,
): ResourcePaginationMeta {
  const total_pages = Math.max(Math.ceil(total / limit), 1)
  const safePage = Math.min(Math.max(page, 1), total_pages)
  return {
    page: safePage,
    limit,
    total,
    total_pages,
    has_next: safePage < total_pages,
    has_prev: safePage > 1,
  }
}

export async function fetchPaginatedResourceRows(
  resourceKey: string,
  params?: ResourceQueryParams,
): Promise<PaginatedResourceResult | null> {
  const page = Math.max(1, params?.page ?? 1)
  const limit = Math.max(1, params?.limit ?? 10)
  const q = params?.q?.trim() || undefined
  const statusLower = (params?.status || '').trim().toLowerCase()
  const is_active =
    statusLower === 'active' ? true : statusLower === 'inactive' ? false : undefined

  if (resourceKey === 'Categories') {
    const { data, pagination } = await categoryApi.list({
      page,
      limit,
      q,
      is_active,
    })
    const rows = data.map((c: { id: number; name: string; slug: string; is_active: boolean }) => [
      `#${c.id}`,
      c.name,
      c.slug,
      'None (Root)',
      c.is_active ? 'Active' : 'Inactive',
    ])
    return {
      rows,
      pagination: pagination ?? buildFallbackPagination(rows.length, page, limit),
      serverFiltered: true,
    }
  }

  if (resourceKey === 'Products') {
    const categoryId =
      params?.categoryId !== undefined && String(params.categoryId).trim() !== ''
        ? params.categoryId
        : undefined
    const { data, pagination } = await productApi.list({
      page,
      limit,
      q,
      categoryId,
      is_active,
    })
    const rows = data.map(
      (p: {
        id: number
        name: string
        category?: { id: number; name: string }
        categoryId?: number
        slug: string
        description?: string
        base_price?: number | string
        is_active?: boolean
        createdAt?: string
        updatedAt?: string
      }) => [
        `#${p.id}`,
        p.name,
        p.category
          ? `${p.category.name} (#${p.category.id})`
          : p.categoryId
            ? `Category (#${p.categoryId})`
            : 'Uncategorized',
        p.slug,
        p.description || '—',
        `$${Number(p.base_price || 0).toFixed(2)}`,
        p.is_active ? 'Active' : 'Inactive',
        fmtDate(p.createdAt),
        fmtDate(p.updatedAt),
      ],
    )
    return {
      rows,
      pagination: pagination ?? buildFallbackPagination(rows.length, page, limit),
      serverFiltered: true,
    }
  }

  const allRows = await fetchResourceRows(resourceKey)
  if (!allRows) return null
  return {
    rows: allRows,
    pagination: buildFallbackPagination(allRows.length, 1, limit),
    serverFiltered: false,
  }
}

// ==================== FETCH ROWS FOR ANY RESOURCE KEY ====================
export async function fetchResourceRows(resourceKey: string): Promise<string[][] | null> {
  switch (resourceKey) {
    case 'Categories': {
      const { data } = await categoryApi.list({ limit: 100 })
      return data.map((c: { id: number; name: string; slug: string; is_active: boolean }) => [
        `#${c.id}`,
        c.name,
        c.slug,
        'None (Root)',
        c.is_active ? 'Active' : 'Inactive',
      ])
    }

    case 'Products': {
      const { data } = await productApi.list({ limit: 100 })
      return data.map(
        (p: {
          id: number
          name: string
          category?: { id: number; name: string }
          categoryId?: number
          slug: string
          description?: string
          base_price?: number | string
          is_active?: boolean
          createdAt?: string
          updatedAt?: string
        }) => [
          `#${p.id}`,
          p.name,
          p.category
            ? `${p.category.name} (#${p.category.id})`
            : p.categoryId
              ? `Category (#${p.categoryId})`
              : 'Uncategorized',
          p.slug,
          p.description || '—',
          `$${Number(p.base_price || 0).toFixed(2)}`,
          p.is_active ? 'Active' : 'Inactive',
          fmtDate(p.createdAt),
          fmtDate(p.updatedAt),
        ],
      )
    }

    case 'Product variants': {
      const { data: products } = await productApi.list({ limit: 100 })
      const allRows: string[][] = []
      await Promise.all(
        products.map(async (p: { id: number; name: string; base_price?: number | string }) => {
          try {
            const res = await variantApi.listByProduct(p.id)
            const variants = Array.isArray(res?.variants) ? res.variants : []
            variants.forEach(
              (v: {
                id: number
                sku: string
                color?: string
                size?: string
                price?: number | string | null
                final_price?: number | string
                stock_qty?: number
                is_active?: boolean
              }) => {
                const stock = Number(v.stock_qty ?? 0)
                const statusLabel = !v.is_active
                  ? 'Inactive'
                  : stock <= 10
                    ? 'Low stock'
                    : 'Active'
                allRows.push([
                  `#${v.id}`,
                  v.sku,
                  `${p.name} (#${p.id})`,
                  v.color || '—',
                  v.size || '—',
                  `$${Number(v.final_price ?? v.price ?? p.base_price ?? 0).toFixed(2)}`,
                  String(stock),
                  statusLabel,
                ])
              },
            )
          } catch {
            // ignore single product variant error
          }
        }),
      )
      return allRows.sort((a, b) => parseId(a[0]) - parseId(b[0]))
    }

    case 'Product images': {
      const { data: products } = await productApi.list({ limit: 100 })
      const allRows: string[][] = []
      await Promise.all(
        products.map(async (p: { id: number; name: string }) => {
          try {
            const res = await productImageApi.listByProduct(p.id)
            const images = Array.isArray(res?.images) ? res.images : []
            images.forEach((img: { id: number; url: string; is_primary?: boolean }) => {
              allRows.push([
                `#${img.id}`,
                `${p.name} (#${p.id})`,
                resolveImageUrl(img.url),
                img.is_primary ? 'Yes' : 'No',
              ])
            })
          } catch {
            // ignore
          }
        }),
      )
      return allRows.sort((a, b) => parseId(a[0]) - parseId(b[0]))
    }

    case 'Orders': {
      const res = await orderApi.listAll({ limit: 100 })
      const orders: Array<{
        id: number
        order_number: string
        userId?: number
        addressId?: number
        user?: { id: number; firstName?: string; lastName?: string; email?: string }
        shipping_street?: string
        shipping_city?: string
        sub_total?: number | string
        discount?: number | string
        shipping_fee?: number | string
        total?: number | string
        status?: string
        createdAt?: string
        updatedAt?: string
      }> = res.data || []
      return orders.map((o) => {
        const userName = o.user
          ? `${o.user.firstName || ''} ${o.user.lastName || ''}`.trim() || o.user.email || `User`
          : `User #${o.userId ?? ''}`
        const userLabel = o.user ? `${userName} (#${o.user.id})` : userName
        const addrLabel = [o.shipping_street, o.shipping_city].filter(Boolean).join(', ')
        return [
          `#${o.id}`,
          o.order_number,
          userLabel,
          addrLabel ? `${addrLabel}${o.addressId ? ` (#${o.addressId})` : ''}` : `Address #${o.addressId || 1}`,
          `$${Number(o.sub_total || 0).toFixed(2)}`,
          `$${Number(o.discount || 0).toFixed(2)}`,
          `$${Number(o.shipping_fee || 0).toFixed(2)}`,
          `$${Number(o.total || 0).toFixed(2)}`,
          capitalize(o.status || 'pending'),
          fmtDate(o.createdAt),
          fmtDate(o.updatedAt),
        ]
      })
    }

    case 'Order items': {
      const res = await orderApi.listAll({ limit: 100 })
      const orders: Array<{
        id: number
        order_number: string
        items?: Array<{
          id: number
          variantId?: number
          sku?: string
          product_name?: string
          unit_price?: number | string
          quantity?: number
          amount?: number | string
        }>
      }> = res.data || []
      const rows: string[][] = []
      orders.forEach((o) => {
        ;(o.items || []).forEach((oi) => {
          rows.push([
            `#${oi.id}`,
            `${o.order_number} (#${o.id})`,
            `${oi.sku || 'SKU'} (#${oi.variantId || 0})`,
            oi.product_name || 'Product',
            `$${Number(oi.unit_price || 0).toFixed(2)}`,
            String(oi.quantity ?? 1),
            `$${Number(oi.amount || 0).toFixed(2)}`,
          ])
        })
      })
      return rows
    }

    case 'Users':
    case 'Customers': {
      const users = await authApi.listUsers()
      return users.map(
        (u: {
          id: number
          firstName?: string
          lastName?: string
          email?: string
          status?: boolean
          createdAt?: string
          updatedAt?: string
        }) => [
          `#${u.id}`,
          u.firstName || '—',
          u.lastName || '—',
          u.email || '—',
          '$2b$10$••••••••••••••••••••••',
          u.status === false ? 'Inactive' : 'Active',
          fmtDate(u.createdAt),
          fmtDate(u.updatedAt),
        ],
      )
    }

    case 'User profiles': {
      const users = await authApi.listUsers()
      const rows: string[][] = []
      await Promise.all(
        users.map(
          async (u: {
            id: number
            firstName?: string
            lastName?: string
            email?: string
            createdAt?: string
            updatedAt?: string
          }) => {
            try {
              const detail = await authApi.getUserProfileById(u.id)
              const prof = detail?.profile
              if (prof) {
                const dobStr = prof.date_of_birth
                  ? String(prof.date_of_birth).slice(0, 10)
                  : '—'
                const phoneStr =
                  prof.phone !== undefined && prof.phone !== null && String(prof.phone).trim() !== ''
                    ? String(prof.phone)
                    : '—'
                rows.push([
                  `#${u.id}`,
                  `${u.firstName || ''} ${u.lastName || ''} (#${u.id})`.trim(),
                  resolveImageUrl(prof.avatar),
                  prof.bio || '—',
                  dobStr,
                  phoneStr,
                  fmtDate(prof.createdAt || u.createdAt),
                  fmtDate(prof.updatedAt || u.updatedAt),
                ])
              }
            } catch {
              // ignore if user has no profile yet
            }
          },
        ),
      )
      return rows.sort((a, b) => parseId(a[0]) - parseId(b[0]))
    }

    case 'Roles':
    case 'Roles & access': {
      const { data } = await roleApi.list({ limit: 100 })
      return data.map((r: { id: number; name: string; code: string; status?: boolean }) => [
        `#${r.id}`,
        r.name,
        r.code,
        r.status === false ? 'Inactive' : 'Active',
      ])
    }

    case 'User roles': {
      const users = await authApi.listUsers()
      const rows: string[][] = []
      let rowCounter = 1
      users.forEach(
        (u: {
          id: number
          firstName?: string
          lastName?: string
          email?: string
          Roles?: Array<{ code: string; name: string }>
        }) => {
          const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'User'
          ;(u.Roles || []).forEach((r) => {
            rows.push([
              `#${rowCounter++}`,
              `${fullName} (#${u.id})`,
              `${r.name || r.code} (${r.code})`,
            ])
          })
        },
      )
      return rows
    }

    case 'Addresses': {
      const { data } = await addressApi.list({ limit: 100 })
      return data.map(
        (a: {
          id: number
          userId: number
          user?: { id: number; firstName?: string; lastName?: string; email?: string }
          receiver_name: string
          phone: string
          street: string
          city: string
          status?: boolean
          createdAt?: string
        }) => {
          const userLabel = a.user
            ? `${`${a.user.firstName || ''} ${a.user.lastName || ''}`.trim() || a.user.email || 'User'} (#${a.user.id})`
            : `User (#${a.userId})`
          return [
            `#${a.id}`,
            userLabel,
            a.receiver_name,
            String(a.phone ?? ''),
            a.street,
            a.city,
            a.status ? 'Yes' : 'No',
            fmtDate(a.createdAt),
          ]
        },
      )
    }

    case 'Payments': {
      const res = await paymentApi.listAll({ limit: 100 })
      const payments: Array<{
        id: number
        orderId?: number
        order?: { id: number; order_number: string }
        method?: string
        amount?: number | string
        status?: string
        paidAt?: string | null
        createdAt?: string
      }> = res.data || []
      return payments.map((p) => [
        `#${p.id}`,
        p.order ? `${p.order.order_number} (#${p.order.id})` : `Order (#${p.orderId || 0})`,
        p.method || 'abapay_khqr',
        `$${Number(p.amount || 0).toFixed(2)}`,
        p.status === 'success' ? 'Succeeded' : capitalize(p.status || 'pending'),
        p.paidAt ? fmtDate(p.paidAt) : '—',
        fmtDate(p.createdAt),
      ])
    }

    case 'Reviews': {
      const { data: products } = await productApi.list({ limit: 100 })
      const rows: string[][] = []
      await Promise.all(
        products.map(async (p: { id: number; name: string }) => {
          try {
            const res = await reviewApi.listByProduct(p.id, { limit: 100 })
            const reviews = Array.isArray(res?.reviews) ? res.reviews : []
            reviews.forEach(
              (r: {
                id: number
                userId?: number
                user?: { id: number; firstName?: string; lastName?: string }
                rating: number
                comment?: string
                createdAt?: string
              }) => {
                const ratingNum = Math.min(5, Math.max(1, Number(r.rating || 5)))
                const stars = `${'★'.repeat(ratingNum)}${'☆'.repeat(5 - ratingNum)} (${ratingNum})`
                const userName = r.user
                  ? `${r.user.firstName || ''} ${r.user.lastName || ''} (#${r.user.id})`.trim()
                  : `User (#${r.userId || 1})`
                rows.push([
                  `#${r.id}`,
                  userName,
                  `${p.name} (#${p.id})`,
                  stars,
                  r.comment || '—',
                  fmtDate(r.createdAt),
                ])
              },
            )
          } catch {
            // ignore
          }
        }),
      )
      return rows.sort((a, b) => parseId(b[0]) - parseId(a[0]))
    }

    case 'Carts': {
      try {
        const carts = await cartApi.listAll()
        if (carts.length > 0) {
          return carts.map(
            (c: {
              id: number
              userId: number
              user?: { id: number; firstName?: string; lastName?: string; email?: string }
              updatedAt?: string
            }) => {
              const userLabel = c.user
                ? `${`${c.user.firstName || ''} ${c.user.lastName || ''}`.trim() || c.user.email || 'User'} (#${c.user.id})`
                : `User (#${c.userId})`
              return [`#${c.id}`, userLabel, fmtDate(c.updatedAt || new Date().toISOString())]
            },
          )
        }
      } catch {
        // fallback to getCart
      }
      const cart = await cartApi.getCart()
      if (!cart) return []
      return [[`#${cart.id}`, `User (#${cart.userId})`, fmtDate(new Date().toISOString())]]
    }

    case 'Cart items': {
      try {
        const carts = await cartApi.listAll()
        const rows: string[][] = []
        carts.forEach(
          (c: {
            id: number
            userId: number
            user?: { firstName?: string; lastName?: string; email?: string }
            items?: Array<{
              id: number
              variantId: number
              quantity: number
              variant?: { id: number; sku: string }
            }>
          }) => {
            const ownerName = c.user
              ? `${c.user.firstName || ''} ${c.user.lastName || ''}`.trim() || c.user.email || `User #${c.userId}`
              : `User #${c.userId}`
            ;(c.items || []).forEach((item) => {
              rows.push([
                `#${item.id}`,
                `Cart #${c.id} (${ownerName})`,
                `${item.variant?.sku || 'SKU'} (#${item.variant?.id || item.variantId})`,
                String(item.quantity),
              ])
            })
          },
        )
        return rows
      } catch {
        const cart = await cartApi.getCart()
        if (!cart || !Array.isArray(cart.items)) return []
        return cart.items.map(
          (item: {
            id: number
            variantId: number
            quantity: number
            variant?: { id: number; sku: string }
          }) => [
            `#${item.id}`,
            `Cart #${cart.id} (User #${cart.userId})`,
            `${item.variant?.sku || 'SKU'} (#${item.variant?.id || item.variantId})`,
            String(item.quantity),
          ],
        )
      }
    }

    default:
      return null
  }
}

// ==================== CREATE RECORD VIA BACKEND API ====================
export async function createResourceRow(resourceKey: string, values: string[]): Promise<void> {
  switch (resourceKey) {
    case 'Categories': {
      const name = cleanCell(values[1])
      const slug = cleanCell(values[2])
      const is_active = parseActive(values[4])
      await categoryApi.create({ name, slug, is_active })
      return
    }

    case 'Products': {
      const name = cleanCell(values[1])
      const categoryId = await resolveCategoryIdFromText(values[2])
      const slug = cleanCell(values[3])
      const description = cleanCell(values[4])
      const base_price = parseMoney(values[5])
      const is_active = parseActive(values[6])
      await productApi.create({ categoryId, name, slug, description, base_price, is_active })
      return
    }

    case 'Product variants': {
      const sku = cleanCell(values[1])
      const productId = await resolveProductIdFromText(values[2])
      const color = cleanCell(values[3]) || null
      const size = cleanCell(values[4]) || null
      const price = values[5] ? parseMoney(values[5]) : null
      const stock_qty = parseInt(values[6] || '0', 10) || 0
      const is_active = parseActive(values[7])
      await variantApi.create(productId, { sku, color, size, price, stock_qty, is_active })
      return
    }

    case 'Product images': {
      const productId = await resolveProductIdFromText(values[1])
      const rawImg = cleanCell(values[2])
      const is_primary = parseYesNo(values[3])
      const file = rawImg.startsWith('data:') ? dataUrlToFile(rawImg, 'product.png') : undefined
      if (!file && !rawImg) {
        throw new Error('Please upload an image file or provide an image URL')
      }
      await productImageApi.create(productId, {
        image: file || undefined,
        url: !file ? rawImg : undefined,
        is_primary,
      })
      return
    }

    case 'Orders': {
      const userId = parseId(values[2]) || undefined
      const addressId = parseId(values[3]) || undefined
      const order_number = cleanCell(values[1]) || undefined
      const sub_total = parseMoney(values[4])
      const discount = parseMoney(values[5])
      const shipping_fee = parseMoney(values[6])
      const total =
        sub_total > 0 || discount > 0 || shipping_fee > 0
          ? Math.max(0, Number((sub_total - discount + shipping_fee).toFixed(2)))
          : parseMoney(values[7])
      const status = cleanCell(values[8]) || 'pending'
      await orderApi.createAdminOrder({
        userId,
        addressId,
        order_number,
        sub_total,
        discount,
        shipping_fee,
        total,
        status,
      })
      return
    }

    case 'Order items': {
      const orderId = parseId(values[1]) || undefined
      const variantId = parseId(values[2]) || undefined
      const skuMatch = cleanCell(values[2]).split(/\s*\(#/)[0]?.trim()
      const product_name = cleanCell(values[3]) || undefined
      const unit_price = parseMoney(values[4])
      const quantity = parseInt(values[5] || '1', 10) || 1
      const amount = parseMoney(values[6]) || unit_price * quantity
      await orderApi.createOrderItem({
        orderId,
        variantId,
        sku: skuMatch || undefined,
        product_name,
        unit_price,
        quantity,
        amount,
      })
      return
    }

    case 'Users':
    case 'Customers': {
      const firstName = cleanCell(values[1])
      const lastName = cleanCell(values[2])
      const email = cleanCell(values[3])
      const rawPass = cleanCell(values[4])
      const password =
        rawPass && !rawPass.startsWith('$2b$') && !rawPass.includes('•') ? rawPass : ''
      const status = parseActive(values[5])
      await authApi.registerUser({ firstName, lastName, email, password, status })
      return
    }

    case 'User profiles': {
      const userId = parseId(values[1]) || getStoredUser()?.id || 1
      let avatar = cleanCell(values[2])
      if (avatar.startsWith('data:')) {
        const file = dataUrlToFile(avatar, 'avatar.png')
        if (file) {
          avatar = await authApi.uploadAvatar(file)
        }
      }
      await authApi.createUserProfileById(userId, {
        avatar: avatar || undefined,
        bio: cleanCell(values[3]),
        date_of_birth: cleanCell(values[4]) || undefined,
        phone: cleanCell(values[5]) || undefined,
      })
      return
    }

    case 'Roles':
    case 'Roles & access': {
      const name = cleanCell(values[1])
      const code = cleanCell(values[2])
      const status = parseActive(values[3])
      await roleApi.create({ name, code, status })
      return
    }

    case 'User roles': {
      const userId = parseId(values[1])
      const roleMatch = values[2]?.match(/\(([^)]+)\)/)
      const roleCode = roleMatch ? roleMatch[1].trim() : cleanCell(values[2])
      if (!userId || !roleCode) throw new Error('Valid User ID and Role code are required')
      await userRoleApi.addRoles(userId, [roleCode])
      return
    }

    case 'Addresses': {
      const userId = parseId(values[1]) || undefined
      await addressApi.create({
        userId,
        receiver_name: cleanCell(values[2]),
        phone: cleanCell(values[3]),
        street: cleanCell(values[4]),
        city: cleanCell(values[5]),
        status: parseYesNo(values[6]),
      })
      return
    }

    case 'Payments': {
      const orderId = parseId(values[1]) || undefined
      const method = cleanCell(values[2])
      const amount = parseMoney(values[3])
      const status = cleanCell(values[4]) || 'pending'
      await paymentApi.createAdminPayment({ orderId, method, amount, status })
      return
    }

    case 'Reviews': {
      const userId = parseId(values[1]) || undefined
      const productId = await resolveProductIdFromText(values[2])
      const ratingMatch = values[3]?.match(/(\d+)/)
      const rating = ratingMatch ? Math.min(5, Math.max(1, Number(ratingMatch[1]))) : 5
      const comment = cleanCell(values[4])
      await reviewApi.create(productId, { userId, rating, comment })
      return
    }

    case 'Carts': {
      const userId = parseId(values[1]) || getStoredUser()?.id || 1
      await cartApi.createCart(userId)
      return
    }

    case 'Cart items': {
      const cartId = parseId(values[1]) || undefined
      const variantId = await resolveVariantIdFromText(values[2])
      const quantity = parseInt(values[3] || '1', 10) || 1
      await cartApi.addItem({ variantId, quantity, cartId })
      return
    }
  }
}

// ==================== UPDATE RECORD VIA BACKEND API ====================
export async function updateResourceRow(
  resourceKey: string,
  values: string[],
  oldRow?: string[],
): Promise<void> {
  const id = parseId(oldRow?.[0] || values[0])

  switch (resourceKey) {
    case 'Categories': {
      await categoryApi.update(id, {
        name: cleanCell(values[1]),
        slug: cleanCell(values[2]),
        is_active: parseActive(values[4]),
      })
      return
    }

    case 'Products': {
      const categoryId = await resolveCategoryIdFromText(
        values[2] !== undefined ? values[2] : oldRow?.[2],
      )
      await productApi.update(id, {
        name: cleanCell(values[1]),
        categoryId,
        slug: cleanCell(values[3]),
        description: cleanCell(values[4]),
        base_price: parseMoney(values[5]),
        is_active: parseActive(values[6]),
      })
      return
    }

    case 'Product variants': {
      const productId = await resolveProductIdFromText(oldRow?.[2] || values[2])
      await variantApi.update(productId, id, {
        sku: cleanCell(values[1]),
        color: cleanCell(values[3]) || null,
        size: cleanCell(values[4]) || null,
        price: parseMoney(values[5]),
        stock_qty: parseInt(values[6] || '0', 10) || 0,
        is_active: parseActive(values[7]),
      })
      return
    }

    case 'Product images': {
      const oldProductId = await resolveProductIdFromText(oldRow?.[1] || values[1])
      const nextProductText = cleanCell(values[1])
      const targetProductId = nextProductText
        ? await resolveProductIdFromText(nextProductText)
        : oldProductId
      const rawImg = cleanCell(values[2])
      const file = rawImg.startsWith('data:') ? dataUrlToFile(rawImg, 'product.png') : undefined
      const normalizedUrl = normalizeStoredMediaUrl(rawImg)
      const is_primary = parseYesNo(values[3])
      await productImageApi.update(oldProductId, id, {
        productId: targetProductId,
        image: file || undefined,
        url: !file && normalizedUrl && rawImg !== cleanCell(oldRow?.[2]) ? normalizedUrl : undefined,
        is_primary,
      })
      return
    }

    case 'Orders': {
      const sub_total = parseMoney(values[4])
      const discount = parseMoney(values[5])
      const shipping_fee = parseMoney(values[6])
      const total =
        sub_total > 0 || discount > 0 || shipping_fee > 0
          ? Math.max(0, Number((sub_total - discount + shipping_fee).toFixed(2)))
          : parseMoney(values[7])

      let addressId: number | undefined
      let shipping_street: string | undefined
      let shipping_city: string | undefined
      if (values[3] !== oldRow?.[3]) {
        const parsedAddrId = parseId(values[3])
        if (parsedAddrId > 0) addressId = parsedAddrId
        const addrText = cleanCell(values[3])
          .replace(/\s*\(#\d+\)\s*$/, '')
          .replace(/^Address\s*#\d+$/i, '')
          .trim()
        if (addrText) {
          const parts = addrText.split(',').map((s) => s.trim()).filter(Boolean)
          if (parts[0]) shipping_street = parts[0]
          if (parts.length > 1) shipping_city = parts.slice(1).join(', ')
        }
      }

      await orderApi.updateAdminOrder(id, {
        addressId,
        shipping_street,
        shipping_city,
        sub_total,
        discount,
        shipping_fee,
        total,
        status: cleanCell(values[8]) || 'pending',
      })
      return
    }

    case 'Order items': {
      const skuMatch = cleanCell(values[2]).split(/\s*\(#/)[0]?.trim()
      const unit_price = parseMoney(values[4])
      const quantity = parseInt(values[5] || '1', 10) || 1
      const explicitAmountChanged = oldRow?.[6] !== undefined && values[6] !== oldRow[6]
      const amount = explicitAmountChanged
        ? parseMoney(values[6]) || Number((unit_price * quantity).toFixed(2))
        : Number((unit_price * quantity).toFixed(2))
      await orderApi.updateOrderItem(id, {
        sku: skuMatch || undefined,
        product_name: cleanCell(values[3]) || undefined,
        unit_price,
        quantity,
        amount,
      })
      return
    }

    case 'Users':
    case 'Customers': {
      const rawPass = cleanCell(values[4])
      const password =
        rawPass && !rawPass.startsWith('$2b$') && !rawPass.includes('•') ? rawPass : undefined
      await authApi.updateUser(id, {
        firstName: cleanCell(values[1]),
        lastName: cleanCell(values[2]),
        email: cleanCell(values[3]),
        password,
        status: parseActive(values[5]),
      })
      return
    }

    case 'User profiles': {
      const userId = parseId(oldRow?.[1] || values[1]) || id || getStoredUser()?.id || 1
      let avatar = normalizeStoredMediaUrl(values[2])
      if (avatar.startsWith('data:')) {
        const file = dataUrlToFile(avatar, 'avatar.png')
        if (file) {
          avatar = await authApi.uploadAvatar(file)
        }
      }
      let firstName: string | undefined
      let lastName: string | undefined
      if (values[1] !== oldRow?.[1]) {
        const namePart = cleanCell(values[1]).replace(/\s*\(#\d+\)\s*$/, '').trim()
        if (namePart) {
          const tokens = namePart.split(/\s+/)
          firstName = tokens[0]
          lastName = tokens.slice(1).join(' ')
        }
      }
      await authApi.updateUserProfileById(userId, {
        firstName,
        lastName,
        avatar: avatar || undefined,
        bio: cleanCell(values[3]),
        date_of_birth: cleanCell(values[4]),
        phone: cleanCell(values[5]),
      })
      return
    }

    case 'Roles':
    case 'Roles & access': {
      await roleApi.update(id, {
        name: cleanCell(values[1]),
        code: cleanCell(values[2]),
        status: parseActive(values[3]),
      })
      return
    }

    case 'User roles': {
      const userId = parseId(oldRow?.[1] || values[1])
      const roleMatch = values[2]?.match(/\(([^)]+)\)/)
      const roleCode = roleMatch ? roleMatch[1].trim() : cleanCell(values[2])
      const oldRoleMatch = oldRow?.[2]?.match(/\(([^)]+)\)/)
      const oldRoleCode = oldRoleMatch ? oldRoleMatch[1].trim() : cleanCell(oldRow?.[2])
      await userRoleApi.addRoles(userId, [roleCode])
      if (oldRoleCode && oldRoleCode !== roleCode) {
        await userRoleApi.removeRole(userId, oldRoleCode).catch(() => null)
      }
      return
    }

    case 'Addresses': {
      await addressApi.update(id, {
        receiver_name: cleanCell(values[2]),
        phone: cleanCell(values[3]),
        street: cleanCell(values[4]),
        city: cleanCell(values[5]),
        status: parseYesNo(values[6]),
      })
      return
    }

    case 'Payments': {
      await paymentApi.updateAdminPayment(id, {
        method: cleanCell(values[2]) || undefined,
        amount: parseMoney(values[3]),
        status: cleanCell(values[4]) || undefined,
      })
      return
    }

    case 'Reviews': {
      const productId = await resolveProductIdFromText(oldRow?.[2] || values[2])
      const ratingMatch = values[3]?.match(/(\d+)/)
      const rating = ratingMatch ? Math.min(5, Math.max(1, Number(ratingMatch[1]))) : 5
      await reviewApi.update(productId, id, {
        rating,
        comment: cleanCell(values[4]),
      })
      return
    }

    case 'Carts': {
      const userId = parseId(values[1] || oldRow?.[1]) || undefined
      await cartApi.updateCart(id, { userId })
      return
    }

    case 'Cart items': {
      const quantity = parseInt(values[3] || '1', 10) || 1
      const variantId =
        values[2] !== oldRow?.[2] ? await resolveVariantIdFromText(values[2]) : undefined
      await cartApi.updateItem(id, { quantity, variantId })
      return
    }
  }
}

// ==================== DELETE RECORD VIA BACKEND API ====================
export async function deleteResourceRow(resourceKey: string, row: string[]): Promise<void> {
  const id = parseId(row[0])

  switch (resourceKey) {
    case 'Categories':
      await categoryApi.remove(id)
      return

    case 'Products':
      await productApi.remove(id)
      return

    case 'Product variants': {
      const productId = await resolveProductIdFromText(row[2])
      await variantApi.remove(productId, id)
      return
    }

    case 'Product images': {
      const productId = await resolveProductIdFromText(row[1])
      await productImageApi.remove(productId, id)
      return
    }

    case 'Orders': {
      await orderApi.removeAdminOrder(id)
      return
    }

    case 'Order items': {
      await orderApi.removeOrderItem(id)
      return
    }

    case 'Users':
    case 'Customers': {
      await authApi.removeUser(id)
      return
    }

    case 'User profiles': {
      const userId = parseId(row[1]) || id
      await authApi.removeUserProfileById(userId)
      return
    }

    case 'Roles':
    case 'Roles & access':
      await roleApi.remove(id)
      return

    case 'User roles': {
      const userId = parseId(row[1])
      const roleMatch = row[2]?.match(/\(([^)]+)\)/)
      const code = roleMatch ? roleMatch[1].trim() : cleanCell(row[2])
      await userRoleApi.removeRole(userId, code)
      return
    }

    case 'Addresses':
      await addressApi.remove(id)
      return

    case 'Payments':
      await paymentApi.removeAdminPayment(id)
      return

    case 'Reviews': {
      const productId = await resolveProductIdFromText(row[2])
      await reviewApi.remove(productId, id)
      return
    }

    case 'Carts':
      await cartApi.deleteCart(id).catch(() => cartApi.clearCart())
      return

    case 'Cart items':
      await cartApi.removeItem(id)
      return
  }
}
