import * as React from 'react'
import { cn } from '@/lib/utils'

export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<'select'>) {
  return (
    <select className={cn('filter-select', className)} {...props}>
      {children}
    </select>
  )
}

export default Select

