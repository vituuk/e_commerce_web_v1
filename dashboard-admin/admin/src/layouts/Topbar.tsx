import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CreditCard,
  Menu,
  RefreshCw,
  ShoppingBag,
  Star,
} from 'lucide-react'
import { useI18n } from '@/assets/i18n'
import { Delete } from '@/components/Delete'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { UserDropdown } from '@/components/UserDropdown'
import { orderApi, paymentApi, productApi, reviewApi, variantApi } from '@/api'

export interface TopbarProps {
  active: string
  onOpenSidebar: () => void
  onNotify: (message: string) => void
  onSelect?: (label: string) => void
}

interface NotificationItem {
  id: string
  title: string
  detail: string
  time: string
  timestamp: number
  unread: boolean
  tone: 'green' | 'blue' | 'orange' | 'violet'
  targetResource: string
  icon: 'order' | 'payment' | 'stock' | 'review'
}

const READ_STORAGE_KEY = 'commerceos_admin_notif_read'
const CLEARED_STORAGE_KEY = 'commerceos_admin_notif_cleared'

function getStoredSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function saveStoredSet(key: string, set: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify([...set]))
  } catch {
    // ignore storage quota errors
  }
}

function formatRelativeTime(dateInput?: string | null): string {
  if (!dateInput) return 'Just now'
  const d = new Date(dateInput)
  const ts = d.getTime()
  if (Number.isNaN(ts)) return 'Recent'
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay}d ago`
  return d.toISOString().slice(0, 10)
}

export function Topbar({ active, onOpenSidebar, onNotify, onSelect }: TopbarProps) {
  const { t } = useI18n()
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => n.unread).length

  const fetchLiveNotifications = useCallback(async () => {
    setLoadingNotifs(true)
    try {
      const readSet = getStoredSet(READ_STORAGE_KEY)
      const clearedSet = getStoredSet(CLEARED_STORAGE_KEY)

      const [ordersRes, paymentsRes, productsRes] = await Promise.all([
        orderApi.listAll({ limit: 5 }).catch(() => null),
        paymentApi.listAll({ limit: 5 }).catch(() => null),
        productApi.list({ limit: 15 }).catch(() => null),
      ])

      const liveItems: NotificationItem[] = []

      // 1. Recent Orders
      ;(ordersRes?.data || []).forEach(
        (o: {
          id: number
          order_number: string
          total?: number | string
          status?: string
          createdAt?: string
          updatedAt?: string
          user?: { firstName?: string; lastName?: string; email?: string }
        }) => {
          const id = `ord-${o.id}-${o.status || 'pending'}`
          if (clearedSet.has(id)) return
          const customer =
            `${o.user?.firstName || ''} ${o.user?.lastName || ''}`.trim() ||
            o.user?.email ||
            'Customer'
          const dateStr = o.updatedAt || o.createdAt
          const ts = dateStr ? new Date(dateStr).getTime() : Date.now()
          liveItems.push({
            id,
            title: `Order #${o.order_number}`,
            detail: `${customer} • $${Number(o.total || 0).toFixed(2)} (${o.status || 'pending'})`,
            time: formatRelativeTime(dateStr),
            timestamp: Number.isNaN(ts) ? Date.now() : ts,
            unread: !readSet.has(id),
            tone: 'green',
            targetResource: 'Orders',
            icon: 'order',
          })
        },
      )

      // 2. Recent Payments
      ;(paymentsRes?.data || []).forEach(
        (p: {
          id: number
          amount?: number | string
          method?: string
          status?: string
          paidAt?: string | null
          createdAt?: string
          order?: { order_number?: string }
        }) => {
          const id = `pay-${p.id}-${p.status || 'pending'}`
          if (clearedSet.has(id)) return
          const dateStr = p.paidAt || p.createdAt
          const ts = dateStr ? new Date(dateStr).getTime() : Date.now() - 1000
          const orderRef = p.order?.order_number ? ` (${p.order.order_number})` : ''
          liveItems.push({
            id,
            title:
              p.status === 'success'
                ? `Payment succeeded${orderRef}`
                : `Payment ${p.status || 'pending'}${orderRef}`,
            detail: `$${Number(p.amount || 0).toFixed(2)} via ${p.method || 'abapay_khqr'}`,
            time: formatRelativeTime(dateStr),
            timestamp: Number.isNaN(ts) ? Date.now() - 1000 : ts,
            unread: !readSet.has(id),
            tone: 'blue',
            targetResource: 'Payments',
            icon: 'payment',
          })
        },
      )

      // 3. Low Stock Variants & Recent Product Reviews
      const products = Array.isArray(productsRes?.data) ? productsRes.data.slice(0, 6) : []
      await Promise.all(
        products.map(async (p: { id: number; name: string }) => {
          const [vRes, rRes] = await Promise.all([
            variantApi.listByProduct(p.id).catch(() => null),
            reviewApi.listByProduct(p.id, { limit: 2 }).catch(() => null),
          ])

          const variants = Array.isArray(vRes?.variants) ? vRes.variants : []
          variants.forEach(
            (v: {
              id: number
              sku: string
              stock_qty?: number
              is_active?: boolean
              updatedAt?: string
            }) => {
              const stock = Number(v.stock_qty ?? 0)
              if (v.is_active !== false && stock <= 10) {
                const id = `stk-${v.id}-${stock}`
                if (clearedSet.has(id)) return
                const ts = v.updatedAt ? new Date(v.updatedAt).getTime() : Date.now() - 2000
                liveItems.push({
                  id,
                  title: `Low stock alert: ${v.sku}`,
                  detail: `${p.name} has only ${stock} units left`,
                  time: formatRelativeTime(v.updatedAt),
                  timestamp: Number.isNaN(ts) ? Date.now() - 2000 : ts,
                  unread: !readSet.has(id),
                  tone: 'orange',
                  targetResource: 'Product variants',
                  icon: 'stock',
                })
              }
            },
          )

          const reviews = Array.isArray(rRes?.reviews) ? rRes.reviews : []
          reviews.forEach(
            (r: {
              id: number
              rating?: number
              comment?: string
              createdAt?: string
              user?: { firstName?: string; lastName?: string }
            }) => {
              const id = `rev-${r.id}`
              if (clearedSet.has(id)) return
              const reviewer =
                `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim() || 'Customer'
              const stars = '★'.repeat(Math.min(5, Math.max(1, Number(r.rating || 5))))
              const ts = r.createdAt ? new Date(r.createdAt).getTime() : Date.now() - 3000
              liveItems.push({
                id,
                title: `New ${r.rating || 5}-star review`,
                detail: `${reviewer} reviewed ${p.name} (${stars})`,
                time: formatRelativeTime(r.createdAt),
                timestamp: Number.isNaN(ts) ? Date.now() - 3000 : ts,
                unread: !readSet.has(id),
                tone: 'violet',
                targetResource: 'Reviews',
                icon: 'review',
              })
            },
          )
        }),
      )

      liveItems.sort((a, b) => b.timestamp - a.timestamp)
      setNotifications(liveItems.slice(0, 12))
    } finally {
      setLoadingNotifs(false)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    void fetchLiveNotifications()
  }, [active, fetchLiveNotifications])

  const markAllRead = () => {
    const readSet = getStoredSet(READ_STORAGE_KEY)
    notifications.forEach((n) => readSet.add(n.id))
    saveStoredSet(READ_STORAGE_KEY, readSet)
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })))
  }

  const clearAllNotifications = () => {
    const clearedSet = getStoredSet(CLEARED_STORAGE_KEY)
    notifications.forEach((n) => clearedSet.add(n.id))
    saveStoredSet(CLEARED_STORAGE_KEY, clearedSet)
    setNotifications([])
  }

  const renderNotifIcon = (type: NotificationItem['icon']) => {
    switch (type) {
      case 'order':
        return <ShoppingBag />
      case 'payment':
        return <CreditCard />
      case 'stock':
        return <AlertTriangle />
      case 'review':
        return <Star />
    }
  }

  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={onOpenSidebar} aria-label="Open navigation">
        <Menu />
      </button>
      <div className="breadcrumbs">
        <span>{t('Workspace')}</span>
        <span>/</span>
        <strong>{t(active)}</strong>
      </div>
      <div className="topbar-actions">
        <LanguageSwitcher onNotify={onNotify} onOpen={() => setNotifOpen(false)} />

        <ThemeToggle onNotify={onNotify} />

        <div className="notif-switcher" ref={notifRef}>
          <button
            type="button"
            className={`icon-button notification ${notifOpen ? 'active' : ''}`}
            aria-label={t('Notifications')}
            aria-expanded={notifOpen}
            onClick={() => {
              const nextOpen = !notifOpen
              setNotifOpen(nextOpen)
              if (nextOpen) {
                void fetchLiveNotifications()
              }
            }}
          >
            <Bell />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          {notifOpen && (
            <div className="notif-dropdown" role="dialog" aria-label={t('Notifications')}>
              <div className="notif-dropdown-header">
                <div className="notif-header-title">
                  <strong>{t('Notifications')}</strong>
                  {unreadCount > 0 && (
                    <span className="notif-count-pill">
                      {unreadCount} {t('new')}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="notif-action-link"
                    onClick={() => void fetchLiveNotifications()}
                    title="Refresh notifications"
                  >
                    <RefreshCw style={{ width: 13, height: 13 }} />
                  </button>
                  {unreadCount > 0 && (
                    <button type="button" className="notif-action-link" onClick={markAllRead}>
                      <CheckCheck />
                      <span>{t('Mark all as read')}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="notif-dropdown-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">
                    {loadingNotifs ? 'Syncing notifications...' : t('No notifications')}
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`notif-item ${item.unread ? 'unread' : ''}`}
                      onClick={() => {
                        const readSet = getStoredSet(READ_STORAGE_KEY)
                        readSet.add(item.id)
                        saveStoredSet(READ_STORAGE_KEY, readSet)
                        setNotifications((prev) =>
                          prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n)),
                        )
                        setNotifOpen(false)
                        if (onSelect) {
                          onSelect(item.targetResource)
                        }
                        onNotify(item.title)
                      }}
                    >
                      <div className={`stat-icon ${item.tone} notif-item-icon`}>
                        {renderNotifIcon(item.icon)}
                      </div>
                      <div className="notif-item-body">
                        <div className="notif-item-top">
                          <strong>{item.title}</strong>
                          <span className="notif-item-time">{item.time}</span>
                        </div>
                        <p>{item.detail}</p>
                      </div>
                      {item.unread && <span className="notif-unread-dot" />}
                    </button>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="notif-dropdown-footer">
                  <Delete
                    variant="menu"
                    label="Clear all"
                    className="notif-clear-btn"
                    onClick={clearAllNotifications}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <UserDropdown active={active} onNotify={onNotify} onSelect={onSelect} />
      </div>
    </header>
  )
}

export default Topbar
