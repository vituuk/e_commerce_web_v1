import { useCallback, useEffect, useRef, useState } from 'react'
import { DashboardLayout } from './DashboardLayout'
import { ResourceView } from '@/components/ResourceView'
import { resourceData } from '@/constants'
import { I18nProvider } from '@/assets/i18n'
import { subscribeToast } from '@/lib/sonner'
import { authApi } from '@/api'
import {
  ADMIN_INTENDED_PATH_KEY,
  ADMIN_LAST_PATH_KEY,
  getAccessToken,
  getAdminPagePath,
  getUserFromToken,
  isAdminRole,
  normalizeAdminLabel,
  parseAdminPathname,
  removeAccessToken,
} from '@/utils'
import {
  Addresses,
  AdminProfile,
  CartItems,
  Carts,
  Category,
  Customer,
  DashboardPage,
  LoginPage,
  OrderItems,
  Orders,
  Payments,
  PosPage,
  Product,
  ProductImages,
  ProductVariants,
  Reviews,
  Roles,
  Settings,
  UserProfiles,
  UserRoles,
  Users,
} from '@/pages'

function hasValidAdminSession(): boolean {
  const token = getAccessToken()
  const user = getUserFromToken()
  return Boolean(token && user && isAdminRole(user.roles))
}

function readSessionPath(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSessionPath(key: string, value: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (value) {
      window.sessionStorage.setItem(key, value)
    } else {
      window.sessionStorage.removeItem(key)
    }
  } catch {
    // ignore storage restrictions
  }
}

function resolveInitialActiveLabel(): string {
  if (typeof window === 'undefined') return 'Dashboard'
  const parsed = parseAdminPathname(window.location.pathname)
  if (!parsed.isLogin && !parsed.isRoot && parsed.isKnownRoute) {
    return parsed.label
  }
  const savedUrl = parsed.isLogin
    ? readSessionPath(ADMIN_INTENDED_PATH_KEY) || readSessionPath(ADMIN_LAST_PATH_KEY)
    : readSessionPath(ADMIN_LAST_PATH_KEY)
  if (savedUrl) {
    const savedParsed = parseAdminPathname(savedUrl)
    if (savedParsed.isKnownRoute && !savedParsed.isLogin) {
      return savedParsed.label
    }
  }
  return 'Dashboard'
}

export function Dashboard() {
  const [active, setActive] = useState<string>(() => resolveInitialActiveLabel())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() =>
    hasValidAdminSession(),
  )
  const intendedPathRef = useRef<string | null>(
    (() => {
      if (typeof window === 'undefined') return null
      const parsed = parseAdminPathname(window.location.pathname)
      if (!parsed.isLogin && !parsed.isRoot && parsed.isKnownRoute) {
        return `${window.location.pathname}${window.location.search}`
      }
      return readSessionPath(ADMIN_INTENDED_PATH_KEY)
    })(),
  )

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  useEffect(() => {
    return subscribeToast((message) => {
      notify(message)
    })
  }, [])

  useEffect(() => {
    const syncAuth = () => {
      setIsAdminAuthenticated(hasValidAdminSession())
    }
    window.addEventListener('commerceos-auth-change', syncAuth)
    window.addEventListener('storage', syncAuth)
    window.addEventListener('focus', syncAuth)
    document.addEventListener('visibilitychange', syncAuth)

    // Periodically check whether the 2-hour admin cookie is still active
    const cookieCheckTimer = window.setInterval(syncAuth, 15000)

    if (hasValidAdminSession()) {
      authApi
        .me()
        .then((u) => {
          if (!u || !isAdminRole(u.roles)) {
            removeAccessToken()
            setIsAdminAuthenticated(false)
          } else {
            setIsAdminAuthenticated(true)
          }
        })
        .catch(() => {
          setIsAdminAuthenticated(hasValidAdminSession())
        })
    }

    return () => {
      window.clearInterval(cookieCheckTimer)
      window.removeEventListener('commerceos-auth-change', syncAuth)
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener('focus', syncAuth)
      window.removeEventListener('visibilitychange', syncAuth)
    }
  }, [])

  const select = useCallback((label: string) => {
    const normalized = normalizeAdminLabel(label)
    setActive(normalized)
    setSidebarOpen(false)
    if (typeof window !== 'undefined') {
      const targetPath = getAdminPagePath(normalized)
      writeSessionPath(ADMIN_LAST_PATH_KEY, targetPath)
      if (window.location.pathname !== targetPath || window.location.search) {
        window.history.pushState(
          { fromAdminApp: true, page: normalized },
          '',
          targetPath,
        )
        window.dispatchEvent(new CustomEvent('commerceos-route-change'))
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const currentPath = window.location.pathname
    const currentSearch = window.location.search
    const parsedCurrent = parseAdminPathname(currentPath)

    if (!isAdminAuthenticated) {
      if (!parsedCurrent.isLogin && !parsedCurrent.isRoot && parsedCurrent.isKnownRoute) {
        const fullTarget = `${currentPath}${currentSearch}`
        intendedPathRef.current = fullTarget
        writeSessionPath(ADMIN_INTENDED_PATH_KEY, fullTarget)
      }
      if (currentPath !== '/login') {
        window.history.replaceState({ fromAdminApp: true, page: 'Login' }, '', '/login')
      }
      document.title = 'Sign In — CommerceOS Admin'
      return
    }

    if (parsedCurrent.isRoot || parsedCurrent.isLogin) {
      const savedTarget =
        intendedPathRef.current ||
        readSessionPath(ADMIN_INTENDED_PATH_KEY) ||
        readSessionPath(ADMIN_LAST_PATH_KEY)
      intendedPathRef.current = null
      writeSessionPath(ADMIN_INTENDED_PATH_KEY, null)

      const fallbackUrl = savedTarget || getAdminPagePath(active)
      const [fallbackPathname, fallbackQuery = ''] = fallbackUrl.split('?')
      const restored = parseAdminPathname(fallbackPathname)
      const targetLabel =
        restored.isKnownRoute && !restored.isLogin ? restored.label : 'Dashboard'
      const normalizedPath =
        restored.action && restored.isKnownRoute
          ? fallbackPathname
          : getAdminPagePath(targetLabel)
      const finalUrl = fallbackQuery ? `${normalizedPath}?${fallbackQuery}` : normalizedPath

      writeSessionPath(ADMIN_LAST_PATH_KEY, finalUrl)
      if (active !== targetLabel) {
        setActive(targetLabel)
      }
      if (`${currentPath}${currentSearch}` !== finalUrl) {
        window.history.replaceState(
          { fromAdminApp: true, page: targetLabel },
          '',
          finalUrl,
        )
      }
      document.title = `${targetLabel} — CommerceOS Admin`
      return
    }

    if (!parsedCurrent.isKnownRoute) {
      const dashPath = getAdminPagePath('Dashboard')
      writeSessionPath(ADMIN_LAST_PATH_KEY, dashPath)
      if (active !== 'Dashboard') {
        setActive('Dashboard')
      }
      window.history.replaceState({ fromAdminApp: true, page: 'Dashboard' }, '', dashPath)
      document.title = 'Dashboard — CommerceOS Admin'
      return
    }

    // URL pathname is a known admin route (e.g. /products, /orders, /products/slug):
    // always keep the current page on refresh/HMR instead of overwriting with Dashboard
    if (active !== parsedCurrent.label) {
      setActive(parsedCurrent.label)
    }

    const canonicalBase = getAdminPagePath(parsedCurrent.label)
    if (!parsedCurrent.action && currentPath !== canonicalBase) {
      const normalizedFull = `${canonicalBase}${currentSearch}`
      window.history.replaceState(
        { fromAdminApp: true, page: parsedCurrent.label },
        '',
        normalizedFull,
      )
      writeSessionPath(ADMIN_LAST_PATH_KEY, normalizedFull)
    } else {
      writeSessionPath(ADMIN_LAST_PATH_KEY, `${currentPath}${currentSearch}`)
    }

    document.title = `${parsedCurrent.label} — CommerceOS Admin`
  }, [active, isAdminAuthenticated])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handlePopState = () => {
      if (!hasValidAdminSession()) {
        setIsAdminAuthenticated(false)
        return
      }
      const parsed = parseAdminPathname(window.location.pathname)
      if (parsed.isLogin) {
        const dashPath = getAdminPagePath('Dashboard')
        writeSessionPath(ADMIN_LAST_PATH_KEY, dashPath)
        window.history.replaceState({ fromAdminApp: true, page: 'Dashboard' }, '', dashPath)
        setActive('Dashboard')
        return
      }
      const targetLabel = parsed.isKnownRoute ? parsed.label : 'Dashboard'
      writeSessionPath(
        ADMIN_LAST_PATH_KEY,
        `${window.location.pathname}${window.location.search}`,
      )
      setActive(targetLabel)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const renderContent = () => {
    switch (active) {
      case 'Overview':
      case 'Dashboard':
        return <DashboardPage notify={notify} onSelect={select} />
      case 'Orders':
        return <Orders notify={notify} />
      case 'Order items':
        return <OrderItems notify={notify} />
      case 'Products':
        return <Product notify={notify} />
      case 'Product variants':
        return <ProductVariants notify={notify} />
      case 'Product images':
        return <ProductImages notify={notify} />
      case 'Categories':
        return <Category notify={notify} />
      case 'Carts':
        return <Carts notify={notify} />
      case 'Cart items':
        return <CartItems notify={notify} />
      case 'Users':
        return <Users notify={notify} />
      case 'User profiles':
        return <UserProfiles notify={notify} />
      case 'Edit Profile':
      case 'Admin profile':
        return <AdminProfile notify={notify} onSelect={select} />
      case 'Roles':
        return <Roles notify={notify} />
      case 'User roles':
        return <UserRoles notify={notify} />
      case 'Addresses':
        return <Addresses notify={notify} />
      case 'Payments':
        return <Payments notify={notify} />
      case 'Reviews':
        return <Reviews notify={notify} />
      case 'Customers':
        return <Customer notify={notify} />
      case 'Settings':
        return <Settings notify={notify} />
      case 'POS':
        return <PosPage notify={notify} />
      default:
        if (resourceData[active]) {
          return (
            <ResourceView
              resourceKey={active}
              title={active}
              notify={notify}
            />
          )
        }
        return <DashboardPage notify={notify} onSelect={select} />
    }
  }

  return (
    <I18nProvider>
      {!isAdminAuthenticated ? (
        <LoginPage
          notify={notify}
          onLogin={() => {
            setIsAdminAuthenticated(hasValidAdminSession())
          }}
        />
      ) : (
        <DashboardLayout
          active={active}
          sidebarOpen={sidebarOpen}
          toast={toast}
          onSelect={select}
          onToggleSidebar={setSidebarOpen}
          onNotify={notify}
        >
          {renderContent()}
        </DashboardLayout>
      )}
    </I18nProvider>
  )
}

export default Dashboard
