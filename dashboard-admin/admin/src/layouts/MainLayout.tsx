import React from 'react'

export interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return <main className="main-public-shell">{children}</main>
}

export default MainLayout

