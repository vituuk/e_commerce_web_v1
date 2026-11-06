import * as React from 'react'
import { cn } from '@/lib/utils'

export function Input({
  className,
  type = 'text',
  ...props
}: React.ComponentProps<'input'>) {
  return <input type={type} className={cn('crud-input', className)} {...props} />
}

export default Input

