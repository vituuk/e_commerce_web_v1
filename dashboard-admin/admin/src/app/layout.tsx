import React from 'react'
import './globals.css'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="antialiased">
      {children}
    </div>
  )
}
