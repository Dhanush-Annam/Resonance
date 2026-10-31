import { forwardRef } from 'react'

/**
 * Resonance Design System — Button Primitive (<Button />)
 *
 * Conforms to DESIGN.md Section 4.1 & 2.5:
 * - Primary ('primary'): Solid off-white #f5f2eb with #101114 dark text, rounded-sm (4px)
 * - Secondary ('secondary'): #181a1f surface, 1px border #262932, #f5f2eb text
 * - Danger ('danger'): bg-status-rejected-bg text-status-rejected-fg border-status-rejected-bd
 * - Ghost ('ghost'): Transparent surface with text-text-secondary hover:text-text-primary
 * - Mandatory focus-visible ring: ring-2 ring-border-focus ring-offset-2 ring-offset-canvas-base
 */
const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost'
    size = 'md', // 'sm' | 'md' | 'lg'
    type = 'button',
    disabled = false,
    isLoading = false,
    className = '',
    leftIcon,
    rightIcon,
    ...props
  },
  ref
) {
  const baseStyles =
    'inline-flex items-center justify-center font-sans font-medium rounded-sm select-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-base disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none'

  const variants = {
    primary:
      'bg-[#f5f2eb] text-[#101114] hover:bg-[#e2dfd7] active:scale-[0.98] shadow-sm',
    secondary:
      'bg-surface-raised border border-border-rule text-text-primary hover:bg-surface-hover hover:border-border-control active:scale-[0.98]',
    danger:
      'bg-status-rejected-bg text-status-rejected-fg border border-status-rejected-bd hover:bg-status-rejected-fg/20 active:scale-[0.98]',
    ghost:
      'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover active:scale-[0.98]',
  }

  const sizes = {
    sm: 'px-2.5 py-1 text-xs gap-1.5 min-h-[32px]',
    md: 'px-3.5 py-1.5 text-xs sm:text-sm gap-2 min-h-[36px]',
    lg: 'px-4 py-2 text-sm sm:text-base gap-2.5 min-h-[44px]',
  }

  const variantClass = variants[variant] || variants.primary
  const sizeClass = sizes[size] || sizes.md

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? 'true' : undefined}
      className={`${baseStyles} ${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {isLoading ? (
        <>
          <span
            className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"
            aria-hidden="true"
          />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0" aria-hidden="true">{rightIcon}</span>}
        </>
      )}
    </button>
  )
})

export default Button
