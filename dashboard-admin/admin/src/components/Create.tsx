import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { editIcon } from '@/assets/img'
import { useI18n } from '@/assets/i18n'

export interface CreateProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  icon?: 'plus' | 'pencil' | 'none'
  children?: ReactNode
}

export function Create({
  label = 'Create',
  icon = 'plus',
  className = 'primary-button',
  children,
  type = 'button',
  ...props
}: CreateProps) {
  const { t } = useI18n()

  return (
    <button type={type} className={className} {...props}>
      {icon === 'plus' ? <Plus /> : icon === 'pencil' ? <img src={editIcon} alt="" className="action-icon-img edit-icon-img" /> : null}
      {children ?? t(label)}
    </button>
  )
}

export default Create

