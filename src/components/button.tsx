import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const VARIANTS = {
  default: 'bg-primary text-primary-foreground hover:opacity-90',
  outline: 'border bg-surface hover:bg-muted',
  ghost: 'hover:bg-muted',
}
const SIZES = { default: 'h-11 px-4', sm: 'h-9 px-3' }

export function Button({
  className,
  variant = 'default',
  size = 'default',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANTS; size?: keyof typeof SIZES }) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  )
}
