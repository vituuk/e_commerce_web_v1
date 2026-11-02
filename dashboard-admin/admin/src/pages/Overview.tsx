import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Eye,
  FileText,
  MoreHorizontal,
  ShoppingCart,
  Users,
} from 'lucide-react'
import {
  type ActivityFeedItem,
  type ChartBarPoint,
  orderPipeline,
  overviewStats,
  type PopularProductItem,
  resourceData,
  type RevenueRangeData,
} from '@/constants'
import { StatusBadge } from '@/components/StatusBadge'
import { CrudDialog } from '@/components/CrudDialog'
import { Edit } from '@/components/Edit'
import { Delete } from '@/components/Delete'
import { Close } from '@/components/Close'
import { TotalVisitorsChart } from '@/components/TotalVisitorsChart'
import { asterLinenFront } from '@/assets/img'
import { useI18n } from '@/assets/i18n'
import {
  authApi,
  deleteResourceRow,
  extractErrorMessage,
  fetchResourceRows,
  orderApi,
  parseId,
  parseMoney,
  paymentApi,
  productApi,
  productImageApi,
  resolveImageUrl,
  reviewApi,
  updateResourceRow,
  variantApi,
} from '@/api'

export interface DashboardProps {
  notify: (message: string) => void
  onSelect?: (resource: string) => void
}

const POPULAR_COLUMNS = [
  'ID',
  'Product name',
  'SKU',
  'Category',
  'Price',
  'Rating',
  'Status',
  'Units sold',
  'Revenue',
]

export function PopularProducts({
  notify,
  onSelect,
}: {
  notify?: (message: string) => void
  onSelect?: (resource: string) => void
}) {
  const { t } = useI18n()
  const [items, setItems] = useState<PopularProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [menu, setMenu] = useState<number | null>(null)
  const [dialog, setDialog] = useState<{
    mode: 'view' | 'edit'
    index: number
    row: string[]
  } | null>(null)
  const [previewImage, setPreviewImage] = useState<{ src: string; title?: string } | null>(null)

  const loadPopularProducts = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: products }, report] = await Promise.all([
        productApi.list({ limit: 20 }),
        orderApi.getReport().catch(() => null),
      ])
      if (!products || products.length === 0) {
        setItems([])
        return
      }

      const topMap = new Map<string, { quantity: number; revenue: number }>()
      let totalReportRev = 0
      if (report?.top_products && Array.isArray(report.top_products)) {
        report.top_products.forEach((tp: { product_name: string; quantity: number; revenue: number }) => {
          topMap.set(tp.product_name.toLowerCase(), {
            quantity: Number(tp.quantity || 0),
            revenue: Number(tp.revenue || 0),
          })
          totalReportRev += Number(tp.revenue || 0)
        })
      }

      const mapped = await Promise.all(
        products.slice(0, 8).map(
          async (p: {
            id: number
            name: string
            slug: string
            base_price?: number | string
            is_active?: boolean
            category?: { name: string }
          }) => {
            let primaryImg = asterLinenFront
            let firstSku = '—'
            let totalStock = 0
            let ratingLabel = '—'
            try {
              const [imgRes, varRes, revRes] = await Promise.all([
                productImageApi.listByProduct(p.id).catch(() => null),
                variantApi.listByProduct(p.id).catch(() => null),
                reviewApi.listByProduct(p.id, { limit: 1 }).catch(() => null),
              ])
              if (imgRes?.images?.length) {
                const pri = imgRes.images.find((i: { is_primary?: boolean }) => i.is_primary) || imgRes.images[0]
                if (pri?.url) primaryImg = resolveImageUrl(pri.url)
              }
              if (varRes?.variants?.length) {
                firstSku = varRes.variants[0].sku || firstSku
                totalStock = varRes.variants.reduce(
                  (sum: number, v: { stock_qty?: number }) => sum + Number(v.stock_qty || 0),
                  0,
                )
              }
              if (revRes && Number(revRes.total_reviews) > 0) {
                ratingLabel = `★ ${Number(revRes.average_rating || 0).toFixed(1)}`
              }
            } catch {
              // ignore individual enrichment errors
            }
            const soldStats = topMap.get(p.name.toLowerCase())
            const unitsSold = soldStats ? soldStats.quantity : 0
            const priceNum = Number(p.base_price || 0)
            const revNum = soldStats ? soldStats.revenue : 0
            const sharePct =
              totalReportRev > 0
                ? Math.min(100, Math.round((revNum / totalReportRev) * 100))
                : 0

            return {
              item: {
                id: `#${p.id}`,
                product: p.name,
                sku: firstSku,
                category: p.category?.name || 'Uncategorized',
                price: `$${priceNum.toFixed(2)}`,
                rating: ratingLabel,
                status: !p.is_active ? 'Inactive' : totalStock <= 10 ? 'Low stock' : 'In stock',
                units: String(unitsSold),
                revenue: `$${revNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                share: sharePct,
                image: primaryImg,
              } satisfies PopularProductItem,
              revNum,
            }
          },
        ),
      )

      mapped.sort((a, b) => b.revNum - a.revNum)
      setItems(mapped.map((m) => m.item))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPopularProducts()
  }, [loadPopularProducts])

  const toRow = (item: PopularProductItem) => [
    item.id,
    item.product,
    item.sku,
    item.category,
    item.price,
    item.rating,
    item.status,
    item.units,
    item.revenue,
  ]

  const handleSaveProduct = async (values: string[]) => {
    const prodId = parseId(values[0] || dialog?.row[0])
    try {
      if (prodId) {
        const categoryChanged = values[3] !== dialog?.row[3]
        const parsedCatId = parseId(values[3])
        await productApi.update(prodId, {
          name: values[1]?.trim(),
          ...(categoryChanged ? { categoryId: parsedCatId > 0 ? parsedCatId : null } : {}),
          base_price: parseMoney(values[4]),
          is_active: !values[6]?.toLowerCase().includes('inactive'),
        })
      }
      await loadPopularProducts()
      notify?.(`${values[1] || 'Product'} updated on server`)
      setDialog(null)
    } catch (err) {
      notify?.(extractErrorMessage(err, 'Failed to update product'))
    }
  }

  const handleDeleteProduct = async (index: number) => {
    const target = items[index]
    const prodId = parseId(target?.id)
    try {
      if (prodId) {
        await productApi.remove(prodId)
      }
      setItems((prev) => prev.filter((_, idx) => idx !== index))
      notify?.(`${target?.product ?? 'Product'} deleted`)
    } catch (err) {
      notify?.(extractErrorMessage(err, 'Failed to delete product'))
    }
  }

  return (
    <article className="panel popular-products">
      {previewImage && (
        <div
          className="crud-backdrop image-popup-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewImage(null)
          }}
        >
          <section
            className="image-popup-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={previewImage.title || 'Image preview'}
          >
            <div className="image-popup-header">
              <strong>{previewImage.title || t('Image')}</strong>
              <Close variant="icon" onClick={() => setPreviewImage(null)} aria-label="Close image preview" />
            </div>
            <div className="image-popup-body">
              <img
                src={previewImage.src}
                alt={previewImage.title || 'Preview'}
                className="image-popup-img"
              />
            </div>
            <div className="image-popup-footer">
              <Close onClick={() => setPreviewImage(null)} />
            </div>
          </section>
        </div>
      )}
      {dialog && (
        <CrudDialog
          mode={dialog.mode}
          label="product"
          columns={POPULAR_COLUMNS}
          row={dialog.row}
          onClose={() => setDialog(null)}
          onModeChange={(nextMode) => {
            if (nextMode === 'view' || nextMode === 'edit') {
              setDialog((prev) => (prev ? { ...prev, mode: nextMode } : prev))
            }
          }}
          onSave={(values) => {
            void handleSaveProduct(values)
          }}
          onDelete={() => {
            void handleDeleteProduct(dialog.index)
            setDialog(null)
          }}
        />
      )}
      <div className="panel-heading">
        <div>
          <h2>{t('Popular products')}</h2>
          <p>{t('Best sellers by revenue this month across products & variants')}</p>
        </div>
        <button
          className="text-button"
          onClick={() => {
            if (onSelect) onSelect('Products')
            else notify?.('Opening Products catalog')
          }}
        >
          {t('View all')} <ArrowUpRight />
        </button>
      </div>
      <div className="table-wrap" style={{ marginTop: '14px' }}>
        <table>
          <thead>
            <tr>
              <th>{t('Product')}</th>
              <th>{t('SKU')}</th>
              <th>{t('Category')}</th>
              <th>{t('Price')}</th>
              <th>{t('Rating')}</th>
              <th>{t('Stock')}</th>
              <th>{t('Units sold')}</th>
              <th>{t('Revenue share')}</th>
              <th style={{ textAlign: 'right' }}>{t('Revenue')}</th>
              <th>{t('Action')}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty-results">
                  {loading ? 'Loading products from API...' : 'No products found in database.'}
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={item.image}
                        alt={item.product}
                        className="table-image-thumb"
                        onClick={() => setPreviewImage({ src: item.image, title: item.product })}
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = asterLinenFront
                        }}
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          objectFit: 'cover',
                          border: '1px solid #dce6ec',
                          background: '#f4f8fa',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <strong style={{ display: 'block', color: '#172638' }}>{item.product}</strong>
                        <small style={{ color: '#8a95a1', fontSize: '11px' }}>{item.id}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="view-code-pill" style={{ fontSize: '11px' }}>
                      {item.sku}
                    </span>
                  </td>
                  <td>{item.category}</td>
                  <td>
                    <strong style={{ color: '#172638' }}>{item.price}</strong>
                  </td>
                  <td style={{ color: '#d69e2e', fontWeight: 700 }}>{item.rating}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    <strong>{item.units}</strong>
                  </td>
                  <td style={{ minWidth: '130px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '7px',
                          background: '#edf2f5',
                          borderRadius: '999px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${item.share}%`,
                            height: '100%',
                            background: '#247f75',
                            borderRadius: '999px',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '11px', color: '#7c8793', minWidth: '30px' }}>
                        {item.share}%
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <strong style={{ color: '#197b6e', fontSize: '14px' }}>{item.revenue}</strong>
                  </td>
                  <td className="row-actions">
                    <button
                      className="row-view"
                      aria-label={`View ${item.product}`}
                      onClick={() => setDialog({ mode: 'view', index, row: toRow(item) })}
                    >
                      <Eye />
                    </button>
                    <div className="row-menu-wrap">
                      <button
                        className="row-menu"
                        aria-label={`More options for ${item.product}`}
                        onClick={() => setMenu(menu === index ? null : index)}
                      >
                        <MoreHorizontal />
                      </button>
                      {menu === index && (
                        <div className="row-popover">
                          <Edit
                            variant="menu"
                            onClick={() => {
                              setDialog({ mode: 'edit', index, row: toRow(item) })
                              setMenu(null)
                            }}
                          />
                          <Delete
                            variant="menu"
                            onClick={() => {
                              void handleDeleteProduct(index)
                              setMenu(null)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  )
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function fmtShortDate(d: Date): string {
  return `${SHORT_MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`
}

function getRangeQueryDates(range: string): { from: string; to: string; fromDate: Date; toDate: Date } {
  const toDate = new Date()
  let fromDate: Date
  if (range === 'Last 7 days') {
    fromDate = new Date(toDate.getTime() - 6 * 24 * 60 * 60 * 1000)
  } else if (range === 'This year') {
    fromDate = new Date(toDate.getFullYear(), 0, 1)
  } else {
    fromDate = new Date(toDate.getTime() - 29 * 24 * 60 * 60 * 1000)
  }
  return {
    from: toIsoDate(fromDate),
    to: toIsoDate(toDate),
    fromDate,
    toDate,
  }
}

function fmtAxisMoney(val: number): string {
  if (val <= 0) return '$0'
  if (val >= 1000) {
    const k = val / 1000
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`
  }
  return `$${Math.round(val)}`
}

function buildLiveRevenueSeries(
  range: string,
  reportRes: {
    revenue?: number
    total_orders?: number
    daily?: Array<{ date: string; orders: number; revenue: number }>
  },
): RevenueRangeData {
  const dailyList = Array.isArray(reportRes.daily) ? reportRes.daily : []
  const dailyMap = new Map<string, { orders: number; revenue: number }>()
  dailyList.forEach((d) => {
    dailyMap.set(String(d.date).slice(0, 10), {
      orders: Number(d.orders || 0),
      revenue: Number(d.revenue || 0),
    })
  })

  const { toDate } = getRangeQueryDates(range)
  const rawBuckets: Array<{ label: string; revenue: number; orders: number }> = []

  if (range === 'Last 7 days') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(toDate.getTime() - i * 24 * 60 * 60 * 1000)
      const key = toIsoDate(d)
      const hit = dailyMap.get(key)
      rawBuckets.push({
        label: fmtShortDate(d),
        revenue: hit ? hit.revenue : 0,
        orders: hit ? hit.orders : 0,
      })
    }
  } else if (range === 'This year') {
    const year = toDate.getFullYear()
    const currentMonth = toDate.getMonth()
    const endMonth = Math.max(currentMonth, 5)
    for (let m = 0; m <= endMonth; m++) {
      const prefix = `${year}-${String(m + 1).padStart(2, '0')}`
      let rev = 0
      let ord = 0
      dailyList.forEach((d) => {
        if (String(d.date).startsWith(prefix)) {
          rev += Number(d.revenue || 0)
          ord += Number(d.orders || 0)
        }
      })
      rawBuckets.push({
        label: `${SHORT_MONTHS[m]} ${year}`,
        revenue: rev,
        orders: ord,
      })
    }
  } else {
    // Last 30 days: 15 two-day intervals ending today
    for (let i = 14; i >= 0; i--) {
      const dEnd = new Date(toDate.getTime() - i * 2 * 24 * 60 * 60 * 1000)
      const dStart = new Date(dEnd.getTime() - 24 * 60 * 60 * 1000)
      const k1 = toIsoDate(dStart)
      const k2 = toIsoDate(dEnd)
      const h1 = dailyMap.get(k1)
      const h2 = dailyMap.get(k2)
      rawBuckets.push({
        label: fmtShortDate(dEnd),
        revenue: (h1?.revenue || 0) + (h2?.revenue || 0),
        orders: (h1?.orders || 0) + (h2?.orders || 0),
      })
    }
  }

  const maxRev = Math.max(...rawBuckets.map((b) => b.revenue), 0)
  const niceMax =
    maxRev <= 0
      ? 1000
      : maxRev <= 400
        ? Math.ceil(maxRev / 100) * 100
        : maxRev <= 2000
          ? Math.ceil(maxRev / 400) * 400
          : Math.ceil(maxRev / 1000) * 1000
  const maxOrd = Math.max(...rawBuckets.map((b) => b.orders), 4)

  const points: ChartBarPoint[] = rawBuckets.map((b) => ({
    date: b.label,
    revenueBar: b.revenue > 0 ? Math.min(100, Math.max(10, Math.round((b.revenue / niceMax) * 100))) : 3,
    orderBar: b.orders > 0 ? Math.min(92, Math.max(10, Math.round((b.orders / maxOrd) * 85))) : 3,
    revenueLabel: `$${b.revenue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    ordersCount: b.orders,
  }))

  const yAxis = [
    fmtAxisMoney(niceMax),
    fmtAxisMoney(niceMax * 0.75),
    fmtAxisMoney(niceMax * 0.5),
    fmtAxisMoney(niceMax * 0.25),
    '$0',
  ]

  const xAxis =
    range === 'Last 7 days'
      ? rawBuckets.map((b) => b.label)
      : rawBuckets
          .filter((_, idx) => idx === 0 || idx === rawBuckets.length - 1 || idx % 3 === 0)
          .map((b) => b.label.split(' ').slice(0, 2).join(' '))

  return {
    summaryRevenue: `$${Number(reportRes.revenue || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    summaryOrders: `${reportRes.total_orders || 0} orders`,
    yAxis,
    xAxis,
    points,
  }
}

function calcPctChange(current: number, previous: number): { label: string; isDown: boolean } {
  if (previous <= 0) {
    if (current <= 0) return { label: '0.0%', isDown: false }
    return { label: '+100.0%', isDown: false }
  }
  const pct = ((current - previous) / previous) * 100
  return {
    label: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`,
    isDown: pct < 0,
  }
}

export function Overview({ notify, onSelect }: DashboardProps) {
  const { t } = useI18n()
  const [range, setRange] = useState<string>('Last 30 days')
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const ordersData = resourceData['Orders']
  const [orderRows, setOrderRows] = useState<string[][]>([])
  const [variantRows, setVariantRows] = useState<string[][]>([])
  const [statsCards, setStatsCards] = useState(overviewStats)
  const [pipelineItems, setPipelineItems] = useState(orderPipeline)
  const [activityItems, setActivityItems] = useState<ActivityFeedItem[]>([])
  const [liveSeries, setLiveSeries] = useState<RevenueRangeData>(() =>
    buildLiveRevenueSeries('Last 30 days', { revenue: 0, total_orders: 0, daily: [] }),
  )
  const [liveReportSummary, setLiveReportSummary] = useState<{
    revenue: string
    orders: string
  } | null>(null)
  const [syncing, setSyncing] = useState(true)
  const [orderMenu, setOrderMenu] = useState<number | null>(null)
  const [orderDialog, setOrderDialog] = useState<{
    mode: 'view' | 'edit'
    row: string[]
    rowIndex: number
  } | null>(null)

  const syncDashboardData = useCallback(
    async (silent = true, activeRange = range) => {
      setSyncing(true)
      try {
        const rangeQuery = getRangeQueryDates(activeRange)
        const spanMs = Math.max(
          24 * 60 * 60 * 1000,
          rangeQuery.toDate.getTime() - rangeQuery.fromDate.getTime() + 24 * 60 * 60 * 1000,
        )
        const prevToDate = new Date(rangeQuery.fromDate.getTime() - 24 * 60 * 60 * 1000)
        const prevFromDate = new Date(prevToDate.getTime() - spanMs + 24 * 60 * 60 * 1000)

        const [ordersRes, variantsRes, productsRes, usersRes, reportRes, prevReportRes, paymentsRes] =
          await Promise.all([
            fetchResourceRows('Orders').catch(() => null),
            fetchResourceRows('Product variants').catch(() => null),
            productApi.list({ limit: 100 }).catch(() => null),
            authApi.listUsers().catch(() => null),
            orderApi.getReport({ from: rangeQuery.from, to: rangeQuery.to }).catch(() => null),
            orderApi
              .getReport({ from: toIsoDate(prevFromDate), to: toIsoDate(prevToDate) })
              .catch(() => null),
            paymentApi.listAll({ limit: 5 }).catch(() => null),
          ])

        if (ordersRes) {
          setOrderRows(ordersRes)
        }
        if (variantsRes) {
          setVariantRows(variantsRes)
        }

        const nextActivities: ActivityFeedItem[] = []
        ;(ordersRes || []).slice(0, 3).forEach((row) => {
          nextActivities.push({
            id: `act-ord-${row[0]}`,
            title: `Order #${row[1]}`,
            detail: `${row[2]} • ${row[7]} (${row[8]})`,
            time: row[9] || 'Recent',
            Icon: ShoppingCart,
            tone: 'violet',
            targetResource: 'Orders',
          })
        })
        ;(paymentsRes?.data || []).slice(0, 2).forEach(
          (p: {
            id: number
            amount?: number | string
            method?: string
            status?: string
            createdAt?: string
          }) => {
            nextActivities.push({
              id: `act-pay-${p.id}`,
              title: p.status === 'success' ? `Payment #${p.id} succeeded` : `Payment #${p.id} (${p.status || 'pending'})`,
              detail: `${p.method || 'abapay_khqr'} • $${Number(p.amount || 0).toFixed(2)}`,
              time: p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : 'Recent',
              Icon: CreditCard,
              tone: 'green',
              targetResource: 'Payments',
            })
          },
        )
        if (Array.isArray(usersRes) && usersRes.length > 0) {
          const latestUser = usersRes[usersRes.length - 1] as {
            id: number
            firstName?: string
            lastName?: string
            email?: string
            createdAt?: string
          }
          const uName =
            `${latestUser.firstName || ''} ${latestUser.lastName || ''}`.trim() ||
            latestUser.email ||
            'User'
          nextActivities.push({
            id: `act-usr-${latestUser.id}`,
            title: 'Customer account active',
            detail: `${uName} • ${latestUser.email || ''}`,
            time: latestUser.createdAt ? new Date(latestUser.createdAt).toISOString().slice(0, 10) : 'Recent',
            Icon: Users,
            tone: 'blue',
            targetResource: 'Users',
          })
        }
        ;(variantsRes || [])
          .filter((r) => Number(r[6]) <= 10)
          .slice(0, 1)
          .forEach((v) => {
            nextActivities.push({
              id: `act-stk-${v[0]}`,
              title: `Low stock alert: ${v[1]}`,
              detail: `${v[2]} • Only ${v[6]} units left`,
              time: 'Inventory',
              Icon: AlertTriangle,
              tone: 'orange',
              targetResource: 'Product variants',
            })
          })
        if (ordersRes || paymentsRes || usersRes || variantsRes) {
          setActivityItems(nextActivities.slice(0, 6))
        }

        if (reportRes || productsRes || usersRes) {
          const revDelta = calcPctChange(
            Number(reportRes?.revenue || 0),
            Number(prevReportRes?.revenue || 0),
          )
          const ordDelta = calcPctChange(
            Number(reportRes?.total_orders || 0),
            Number(prevReportRes?.total_orders || 0),
          )
          const aovDelta = calcPctChange(
            Number(reportRes?.average_order_value || 0),
            Number(prevReportRes?.average_order_value || 0),
          )
          let usrDelta = { label: '0.0%', isDown: false }
          if (Array.isArray(usersRes)) {
            const curFromTs = rangeQuery.fromDate.getTime()
            const prevFromTs = prevFromDate.getTime()
            let curUsers = 0
            let prevUsers = 0
            usersRes.forEach((u: { createdAt?: string }) => {
              const ts = u.createdAt ? new Date(u.createdAt).getTime() : NaN
              if (!Number.isNaN(ts)) {
                if (ts >= curFromTs) curUsers += 1
                else if (ts >= prevFromTs && ts < curFromTs) prevUsers += 1
              }
            })
            usrDelta = calcPctChange(curUsers, prevUsers)
          }

          setStatsCards((prev) =>
            prev.map((card) => {
              if (card.targetResource === 'Payments' && reportRes?.revenue !== undefined) {
                return {
                  ...card,
                  value: `$${Number(reportRes.revenue).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                  change: revDelta.label,
                  isDown: revDelta.isDown,
                }
              }
              if (card.targetResource === 'Orders' && reportRes?.total_orders !== undefined) {
                return {
                  ...card,
                  value: String(reportRes.total_orders),
                  change: ordDelta.label,
                  isDown: ordDelta.isDown,
                }
              }
              if (card.targetResource === 'Products' && productsRes?.data) {
                return {
                  ...card,
                  value: String(productsRes.pagination?.total ?? productsRes.data.length),
                }
              }
              if (card.targetResource === 'Users' && Array.isArray(usersRes)) {
                return {
                  ...card,
                  value: String(usersRes.length),
                  change: usrDelta.label,
                  isDown: usrDelta.isDown,
                }
              }
              if (
                card.targetResource === 'Order items' &&
                reportRes?.average_order_value !== undefined
              ) {
                return {
                  ...card,
                  value: `$${Number(reportRes.average_order_value).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                  change: aovDelta.label,
                  isDown: aovDelta.isDown,
                }
              }
              return card
            }),
          )
        }

        if (reportRes) {
          setLiveSeries(buildLiveRevenueSeries(activeRange, reportRes))
          setLiveReportSummary({
            revenue: `$${Number(reportRes.revenue || 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            orders: `${reportRes.total_orders || 0} orders`,
          })

          if (reportRes.by_status) {
            const rawTotal = Number(reportRes.total_orders || 0)
            const bs = reportRes.by_status as Record<string, number>
            const paidCount = Number(bs.paid || 0) + Number(bs.delivered || 0)
            const shippedCount = Number(bs.shipped || 0)
            const pendingCount = Number(bs.pending || 0)
            setPipelineItems([
              {
                status: 'Paid',
                count: paidCount,
                percentage: rawTotal > 0 ? Math.round((paidCount / rawTotal) * 100) : 0,
                amount: `$${Number(reportRes.revenue || 0).toFixed(2)}`,
              },
              {
                status: 'Shipped',
                count: shippedCount,
                percentage: rawTotal > 0 ? Math.round((shippedCount / rawTotal) * 100) : 0,
                amount: `${shippedCount} orders`,
              },
              {
                status: 'Processing',
                count: pendingCount,
                percentage: rawTotal > 0 ? Math.round((pendingCount / rawTotal) * 100) : 0,
                amount: `${pendingCount} pending`,
              },
            ])
          }
        } else {
          setLiveSeries(buildLiveRevenueSeries(activeRange, { revenue: 0, total_orders: 0, daily: [] }))
        }
        if (!silent) {
          notify('Dashboard synced with backend API')
        }
      } catch (err) {
        if (!silent) {
          notify(extractErrorMessage(err, 'Failed to sync dashboard metrics'))
        }
      } finally {
        setSyncing(false)
      }
    },
    [notify, range],
  )

  useEffect(() => {
    void syncDashboardData(true, range)
  }, [syncDashboardData, range])

  const currentSeries = liveSeries
  const lowStockRows = variantRows.filter((r) => Number(r[6]) <= 20)

  const handleSaveOrder = async (values: string[]) => {
    if (!orderDialog) return
    try {
      await updateResourceRow('Orders', values, orderDialog.row)
      notify(`Order ${values[1] || values[0]} status updated on server`)
      await syncDashboardData(true)
      setOrderDialog(null)
    } catch (err) {
      notify(`API error: ${extractErrorMessage(err, 'Failed to update order')}`)
    }
  }

  const handleDeleteOrder = async (targetRow: string[]) => {
    try {
      await deleteResourceRow('Orders', targetRow)
      notify(`${targetRow[1] || targetRow[0] || 'Order'} deleted from server`)
      await syncDashboardData(true)
    } catch (err) {
      notify(`API error: ${extractErrorMessage(err, 'Failed to delete order')}`)
    }
  }

  return (
    <div className="feature-view">
      {orderDialog && ordersData && (
        <CrudDialog
          mode={orderDialog.mode}
          label="order"
          columns={ordersData.columns}
          row={orderDialog.row}
          onClose={() => setOrderDialog(null)}
          onModeChange={(nextMode) => {
            if (nextMode === 'view' || nextMode === 'edit') {
              setOrderDialog((prev) => (prev ? { ...prev, mode: nextMode } : prev))
            }
          }}
          onSave={(values) => {
            void handleSaveOrder(values)
          }}
          onDelete={() => {
            void handleDeleteOrder(orderDialog.row)
            setOrderDialog(null)
          }}
        />
      )}

      {/* Top KPI Cards */}
      <div className="stats-grid">
        {statsCards.map(({ label, value, Icon, tone, change, isDown, targetResource }) => (
          <article
            className="stat-card"
            key={label}
            onClick={() => {
              if (targetResource && onSelect) onSelect(targetResource)
            }}
            style={{ cursor: targetResource && onSelect ? 'pointer' : 'default' }}
          >
            <div className="stat-top">
              <span>{t(label)}</span>
              <div className={`stat-icon ${tone}`}>
                <Icon />
              </div>
            </div>
            <strong>{value}</strong>
            <div className={`stat-change ${isDown ? 'down' : 'up'}`}>
              {isDown ? <ArrowDownRight /> : <ArrowUpRight />} {change} <span>{t('vs last month')}</span>
            </div>
          </article>
        ))}
      </div>

      {/* Revenue Overview Chart + Recent Activity */}
      <div className="dashboard-grid">
        <TotalVisitorsChart
          range={range}
          onRangeChange={(nextRange) => {
            setRange(nextRange)
            void syncDashboardData(true, nextRange)
            notify(`Showing ${nextRange.toLowerCase()}`)
          }}
          currentSeries={currentSeries}
          liveReportSummary={liveReportSummary}
          hoveredBar={hoveredBar}
          onHoverBar={setHoveredBar}
          syncing={syncing}
          onSync={() => void syncDashboardData(false, range)}
          onExportExcel={() => {
            const rq = getRangeQueryDates(range)
            void orderApi
              .exportReportExcel({ from: rq.from, to: rq.to })
              .then(() => notify('Downloaded order-report.xlsx'))
              .catch((e) =>
                notify(extractErrorMessage(e, 'Admin sign-in required for Excel report')),
              )
          }}
        />

        <article className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>{t('Recent activity')}</h2>
              <p>{t('Live events across orders, payments, users & inventory')}</p>
            </div>
            <button
              className="text-button"
              onClick={() => {
                if (onSelect) onSelect('Orders')
                else notify('Showing all recent activity')
              }}
            >
              {t('View orders')} <ArrowUpRight />
            </button>
          </div>
          <div className="activity-list">
            {activityItems.length === 0 ? (
              <div className="empty-results">
                {syncing ? 'Loading live activity from API...' : 'No recent activity recorded yet.'}
              </div>
            ) : (
              activityItems.map(({ id, title, detail, time, Icon, tone, targetResource }) => (
                <button
                  className="activity-row"
                  key={id}
                  onClick={() => {
                    if (onSelect) {
                      onSelect(targetResource)
                      notify(`Opened ${targetResource}`)
                    } else {
                      notify(`${title} selected`)
                    }
                  }}
                >
                  <div className={`stat-icon ${tone}`} style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                    <Icon style={{ width: '15px', height: '15px' }} />
                  </div>
                  <div>
                    <strong>{title}</strong>
                    <small>{detail}</small>
                  </div>
                  <span style={{ fontSize: '11px', color: '#949ea8', whiteSpace: 'nowrap' }}>{time}</span>
                </button>
              ))
            )}
          </div>
        </article>
      </div>

      {/* Lower Grid: Recent Orders Table + Order Fulfillment & Low Stock Alerts */}
      <div className="lower-grid">
        <article className="panel">
          <div className="panel-heading" style={{ marginBottom: '14px' }}>
            <div>
              <h2>{t('Recent orders')}</h2>
              <p>{t('Latest customer orders from the orders & payments tables')}</p>
            </div>
            <button
              className="text-button"
              onClick={() => {
                if (onSelect) onSelect('Orders')
                else notify('Opening Orders table')
              }}
            >
              {t('All orders')} <ArrowUpRight />
            </button>
          </div>
          <div className="table-wrap">
            <table style={{ minWidth: '520px' }}>
              <thead>
                <tr>
                  <th>{t('User')}</th>
                  <th>{t('Total')}</th>
                  <th>{t('Status')}</th>
                  <th>{t('Order date')}</th>
                  <th>{t('Action')}</th>
                </tr>
              </thead>
              <tbody>
                {orderRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-results">
                      {syncing ? 'Loading orders from API...' : 'No orders found in database.'}
                    </td>
                  </tr>
                ) : (
                  orderRows.slice(0, 6).map((row, index) => (
                    <tr key={row[0]}>
                      <td>
                        <div className="order-user-stack">
                          <strong>
                            {(row[2] || '').replace(/\s*\(#\d+\)$/, '').trim() || row[2] || '—'}
                          </strong>
                          <small>{(row[1] || row[0] || '').replace(/^#/, '')}</small>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#172638' }}>{row[7]}</strong>
                      </td>
                      <td>
                        <StatusBadge status={row[8]} />
                      </td>
                      <td>{row[9]}</td>
                      <td className="row-actions">
                        <button
                          className="row-view"
                          aria-label={`View ${row[1]}`}
                          onClick={() => setOrderDialog({ mode: 'view', row, rowIndex: index })}
                        >
                          <Eye />
                        </button>
                        <div className="row-menu-wrap">
                          <button
                            className="row-menu"
                            aria-label={`More options for ${row[1]}`}
                            onClick={() => setOrderMenu(orderMenu === index ? null : index)}
                          >
                            <MoreHorizontal />
                          </button>
                          {orderMenu === index && (
                            <div className="row-popover">
                              <button
                                type="button"
                                onClick={() => {
                                  const id = parseId(row[0])
                                  if (id) {
                                    void orderApi
                                      .downloadInvoice(id)
                                      .then(() => notify(`Downloaded invoice for ${row[1]}`))
                                      .catch((e) => notify(extractErrorMessage(e)))
                                  }
                                  setOrderMenu(null)
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: 0,
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  textAlign: 'left',
                                }}
                              >
                                <FileText style={{ width: 14, height: 14 }} />
                                <span>Invoice (.docx)</span>
                              </button>
                              <Edit
                                variant="menu"
                                onClick={() => {
                                  setOrderDialog({ mode: 'edit', row, rowIndex: index })
                                  setOrderMenu(null)
                                }}
                              />
                              <Delete
                                variant="menu"
                                onClick={() => {
                                  void handleDeleteOrder(row)
                                  setOrderMenu(null)
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div className="panel-heading" style={{ marginBottom: '14px' }}>
              <div>
                <h2>{t('Order status breakdown')}</h2>
                <p>{t('Fulfillment pipeline across total orders')}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pipelineItems.map((item) => (
                <div key={item.status} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusBadge status={item.status} />
                      <span style={{ color: '#657180' }}>{item.count} {t('orders')}</span>
                    </div>
                    <strong style={{ color: '#172638' }}>
                      {item.amount} ({item.percentage}%)
                    </strong>
                  </div>
                  <div
                    className="progress-track"
                    style={{
                      width: '100%',
                      height: '6px',
                      background: '#edf2f5',
                      borderRadius: '999px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${item.percentage}%`,
                        height: '100%',
                        background:
                          item.status === 'Paid'
                            ? '#247f75'
                            : item.status === 'Shipped'
                              ? '#2b6cb0'
                              : '#d69e2e',
                        borderRadius: '999px',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="low-stock-divider" style={{ borderTop: '1px solid #edf0f3', paddingTop: '16px' }}>
            <div className="panel-heading" style={{ marginBottom: '10px' }}>
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle style={{ width: '15px', color: '#d69e2e' }} />
                  {t('Low stock variants')}
                </h2>
                <p>{t('SKUs from product_variants needing restock')}</p>
              </div>
              <button
                className="text-button"
                onClick={() => {
                  if (onSelect) onSelect('Product variants')
                }}
              >
                {t('Manage stock')} <ArrowUpRight />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lowStockRows.length === 0 ? (
                <div className="empty-results" style={{ padding: '12px' }}>
                  {syncing ? 'Checking variant stock...' : 'No low-stock variants right now.'}
                </div>
              ) : (
                lowStockRows.map((variant) => (
                  <div
                    key={variant[0]}
                    className="low-stock-item"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '9px 12px',
                      background: '#fffaf0',
                      border: '1px solid #feebc8',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#172638', display: 'block' }}>{variant[2]}</strong>
                      <span style={{ color: '#7c8793', fontSize: '11px' }}>
                        SKU: {variant[1]} • {variant[3]}
                      </span>
                    </div>
                    <span className="status status-low-stock">
                      <span className="status-dot" />
                      {variant[6]} {t('left')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
