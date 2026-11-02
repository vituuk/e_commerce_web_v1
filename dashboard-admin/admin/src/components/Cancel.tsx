import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useI18n } from '@/assets/i18n'

export interface CancelProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  children?: ReactNode
}

export function Cancel({
  label = 'Cancel',
  className = 'filter-button',
  children,
  type = 'button',
  ...props
}: CancelProps) {
  const { t } = useI18n()

  return (
    <button type={type} className={className} {...props}>
      {children ?? t(label)}
    </button>
  )
}

export default Cancel

