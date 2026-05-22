import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
          {
            // Primary - Steel gradient
            'bg-primary text-primary-foreground hover:bg-primary-dim shadow-sm':
              variant === 'primary',
            // Secondary - Surface container highest
            'bg-surface-container-highest text-foreground hover:bg-surface-container-high':
              variant === 'secondary',
            // Tertiary - Text only with hover underline
            'text-primary hover:text-primary-dim hover:underline underline-offset-4':
              variant === 'tertiary',
            // Ghost
            'hover:bg-surface-container-low': variant === 'ghost',
            // Destructive
            'bg-destructive text-destructive-foreground hover:opacity-90':
              variant === 'destructive',
            // Sizes
            'h-10 px-5 py-2': size === 'default',
            'h-9 rounded-md px-4': size === 'sm',
            'h-12 rounded-lg px-8 text-lg': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
