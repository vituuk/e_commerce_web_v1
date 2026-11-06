import * as React from 'react'
import { Close } from '@/components/Close'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: DialogProps) {
  if (!open) return null

  return (
    <div
      className="crud-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false)
      }}
    >
      <section className="crud-dialog" role="dialog" aria-modal="true">
        {(title || description) && (
          <div className="crud-dialog-header">
            <div className="crud-header-main">
              <div>
                {title && <h2>{title}</h2>}
                {description && <p className="crud-header-sub">{description}</p>}
              </div>
            </div>
            <Close variant="icon" onClick={() => onOpenChange(false)} />
          </div>
        )}
        {children}
      </section>
    </div>
  )
}

export default Dialog

