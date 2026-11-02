import React from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export interface DashboardLayoutProps {
  active: string
  sidebarOpen: boolean
  toast: string
  onSelect: (label: string) => void
  onToggleSidebar: (open: boolean) => void
  onNotify: (message: string) => void
  children: React.ReactNode
}

export function DashboardLayout({
  active,
  sidebarOpen,
  toast,
  onSelect,
  onToggleSidebar,
  onNotify,
  children,
}: DashboardLayoutProps) {
  return (
    <main className="app-shell">
      <Sidebar
        active={active}
        sidebarOpen={sidebarOpen}
        onSelect={onSelect}
        onClose={() => onToggleSidebar(false)}
        onNotify={onNotify}
      />
      <section className="content-area">
        <Topbar
          active={active}
          onOpenSidebar={() => onToggleSidebar(true)}
          onNotify={onNotify}
          onSelect={onSelect}
        />
        <section className="page-content">{children}</section>
      </section>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </main>
  )
}

export default DashboardLayout

