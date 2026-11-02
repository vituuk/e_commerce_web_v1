import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { editIcon } from '@/assets/img'
import { useI18n } from '@/assets/i18n'

export interface EditProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  variant?: 'primary' | 'menu'
  showIcon?: boolean
  children?: ReactNode
}

export function Edit({
  label = 'Edit',
  variant = 'primary',
  showIcon = true,
  className,
  children,
  type = 'button',
  ...props
}: EditProps) {
  const { t } = useI18n()
  const resolvedClass =
    className ?? (variant === 'menu' ? 'edit-action' : 'primary-button view-action-btn')

  return (
    <button type={type} className={resolvedClass} {...props}>
      {showIcon && <img src={editIcon} alt="" className="action-icon-img edit-icon-img" />}
      {children ?? t(label)}
    </button>
  )
}

export default Edit

