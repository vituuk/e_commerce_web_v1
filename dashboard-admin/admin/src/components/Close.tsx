import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '@/assets/i18n'

export interface CloseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  variant?: 'button' | 'icon'
  children?: ReactNode
}

export function Close({
  label = 'Close',
  variant = 'button',
  className,
  children,
  type = 'button',
  ...props
}: CloseProps) {
  const { t } = useI18n()

  if (variant === 'icon') {
    return (
      <button
        type={type}
        className={className ?? 'crud-close-button'}
        aria-label={props['aria-label'] ?? t(label)}
        {...props}
      >
        {children ?? <X />}
      </button>
    )
  }

  return (
    <button
      type={type}
      className={className ?? 'filter-button view-action-btn'}
      {...props}
    >
      {children ?? t(label)}
    </button>
  )
}

export default Close

