import { AlertTriangle } from 'lucide-react'
import { Cancel } from '@/components/Cancel'
import { Close } from '@/components/Close'
import { useI18n } from '@/assets/i18n'

export interface ConfirmDeleteProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  confirmDelete: () => void
  title?: string
  message?: string
}

export function ConfirmDelete({
  isOpen,
  setIsOpen,
  confirmDelete,
  title = 'Confirm Delete',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
}: ConfirmDeleteProps) {
  const { t } = useI18n()

  if (!isOpen) return null

  return (
    <div
      className="crud-backdrop delete-confirm-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false)
      }}
    >
      <section className="delete-confirm-dialog" role="alertdialog" aria-modal="true">
        <div className="delete-confirm-header">
          <div className="delete-confirm-icon">
            <AlertTriangle />
          </div>
          <div className="delete-confirm-text">
            <h3>{t(title)}</h3>
            <p>{t(message)}</p>
          </div>
          <Close variant="icon" onClick={() => setIsOpen(false)} />
        </div>
        <div className="delete-confirm-actions">
          <Cancel onClick={() => setIsOpen(false)} />
          <button
            type="button"
            className="danger-button delete-confirm-btn"
            onClick={() => {
              confirmDelete()
              setIsOpen(false)
            }}
          >
            <span>{t('Delete')}</span>
          </button>
        </div>
      </section>
    </div>
  )
}

export default ConfirmDelete

