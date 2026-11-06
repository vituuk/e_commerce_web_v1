import { useEffect, useState } from 'react'
import { Database } from 'lucide-react'
import { navigation, management } from '@/constants'
import { useI18n } from '@/assets/i18n'
import { Close } from '@/components/Close'
import { orderApi } from '@/api'

export interface AppSidebarProps {
  active: string
  sidebarOpen: boolean
  onSelect: (label: string) => void
  onClose: () => void
  onNotify?: (message: string) => void
}

export function AppSidebar({
  active,
  sidebarOpen,
  onSelect,
  onClose,
}: AppSidebarProps) {
  const { t } = useI18n()
  const [liveOrdersCount, setLiveOrdersCount] = useState<string | null>(null)

  useEffect(() => {
    orderApi
      .listAll({ limit: 1 })
      .then((res) => {
        const total = res.pagination?.total ?? res.data?.length
        if (typeof total === 'number') {
          setLiveOrdersCount(String(total))
        }
      })
      .catch(() => {
        // keep default badge
      })
  }, [active])

  return (
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="brand-row">
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
          onClick={() => onSelect('Dashboard')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect('Dashboard')
            }
          }}
        >
          <div className="brand-mark">
            <Database />
          </div>
          <span className="brand-name">
            Commerce<span>OS</span>
          </span>
        </div>
        <Close
          variant="icon"
          className="mobile-close"
          onClick={onClose}
          aria-label="Close navigation"
        />
      </div>

      <div className="sidebar-scroll">
        <nav className="nav-section" aria-label="Main navigation">
          <p className="nav-label">{t('Workspace')}</p>
          {navigation.map(({ label, icon: Icon, iconSrc, count }) => {
            const displayCount = label === 'Orders' && liveOrdersCount !== null ? liveOrdersCount : count
            return (
              <button
                key={label}
                className={`nav-item ${active === label ? 'active' : ''}`}
                onClick={() => onSelect(label)}
              >
                {iconSrc ? <img src={iconSrc} alt="" className="nav-icon-img" /> : <Icon />}
                <span>{t(label)}</span>
                {displayCount && <em>{displayCount}</em>}
              </button>
            )
          })}
        </nav>

        <nav className="nav-section" aria-label="Management navigation">
          <p className="nav-label">{t('Management')}</p>
          {management.map(({ label, icon: Icon, iconSrc }) => (
            <button
              key={label}
              className={`nav-item ${active === label ? 'active' : ''}`}
              onClick={() => onSelect(label)}
            >
              {iconSrc ? <img src={iconSrc} alt="" className="nav-icon-img" /> : <Icon />}
              <span>{t(label)}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export { AppSidebar as Sidebar }
export type { AppSidebarProps as SidebarProps }
export default AppSidebar

