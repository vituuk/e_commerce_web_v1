import { useState, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { deleteIcon } from '@/assets/img'
import { useI18n } from '@/assets/i18n'
import { Cancel } from '@/components/Cancel'
import { Close } from '@/components/Close'

export interface DeleteProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  variant?: 'danger' | 'menu'
  showIcon?: boolean
  confirm?: boolean
  confirmTitle?: string
  confirmMessage?: string
  children?: ReactNode
}

export function Delete({
  label = 'Delete',
  variant = 'danger',
  showIcon = true,
  confirm = true,
  confirmTitle = 'Confirm Delete',
  confirmMessage = 'Are you sure you want to delete this record? This action cannot be undone.',
  className,
  children,
  type = 'button',
  onClick,
  ...props
}: DeleteProps) {
  const { t } = useI18n()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const resolvedClass =
    className ?? (variant === 'menu' ? 'delete-action' : 'danger-button')

  const handleTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (confirm) {
      setConfirmOpen(true)
    } else {
      onClick?.(event)
    }
  }

  const handleConfirmDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setConfirmOpen(false)
    onClick?.(event)
  }

  return (
    <>
      <button type={type} className={resolvedClass} onClick={handleTriggerClick} {...props}>
        {showIcon && <img src={deleteIcon} alt="" className="action-icon-img delete-icon-img" />}
        {children ?? t(label)}
      </button>

      {confirmOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="crud-backdrop delete-confirm-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              event.stopPropagation()
              if (event.target === event.currentTarget) setConfirmOpen(false)
            }}
          >
            <section
              className="delete-confirm-dialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-confirm-title"
              style={{ borderRadius: '2px' }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="delete-confirm-header">
                <div className="delete-confirm-icon" style={{ borderRadius: '2px' }}>
                  <img src={deleteIcon} alt="" className="action-icon-img delete-icon-img" />
                </div>
                <Close
                  variant="icon"
                  onClick={() => setConfirmOpen(false)}
                  aria-label="Close confirmation"
                  style={{ borderRadius: '2px' }}
                />
              </div>

              <div className="delete-confirm-body">
                <h3 id="delete-confirm-title">{t(confirmTitle)}</h3>
                <p>{t(confirmMessage)}</p>
              </div>

              <div className="delete-confirm-actions">
                <Cancel onClick={() => setConfirmOpen(false)} style={{ borderRadius: '2px' }} />
                <button
                  type="button"
                  className="danger-confirm-button"
                  style={{ borderRadius: '2px' }}
                  onClick={handleConfirmDelete}
                >
                  <img
                    src={deleteIcon}
                    alt=""
                    className="action-icon-img delete-confirm-btn-icon"
                  />
                  {t(label)}
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )}
    </>
  )
}

export default Delete

