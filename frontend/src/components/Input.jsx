import { forwardRef, useId } from 'react'

/**
 * Resonance Design System — Form Control Primitive (<Input />)
 *
 * Conforms to DESIGN.md Section 4.2:
 * - Background: #181a1f (bg-surface-raised)
 * - Border: 1px #687084 (border-border-control, mathematically verified >= 3:1)
 * - Radius: 4px (rounded-sm)
 * - Text: #f5f2eb (text-text-primary), placeholder: #7e8594 (placeholder:text-text-tertiary)
 * - Focus: border-border-focus (#f5f2eb) with ring-1
 * - Label: text-[11px] font-mono tracking-wider text-text-secondary uppercase
 * - Accessible error messaging via aria-invalid and aria-describedby
 */
const Input = forwardRef(function Input(
  {
    id,
    label,
    error,
    helperText,
    type = 'text',
    disabled = false,
    leftIcon,
    rightIcon,
    className = '',
    containerClassName = '',
    ...props
  },
  ref
) {
  const generatedId = useId()
  const inputId = id || generatedId
  const errorId = error ? `${inputId}-error` : undefined
  const helperId = helperText ? `${inputId}-helper` : undefined
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`flex flex-col space-y-1.5 w-full ${containerClassName}`.trim()}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] font-mono font-medium tracking-wider text-text-secondary uppercase select-none"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {leftIcon && (
          <span
            className="absolute left-3 text-text-tertiary pointer-events-none flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={`w-full px-3 py-1.5 rounded-sm bg-surface-raised text-xs sm:text-sm text-text-primary placeholder:text-text-tertiary font-sans transition duration-150 border disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none ${
            leftIcon ? 'pl-9' : ''
          } ${rightIcon ? 'pr-9' : ''} ${
            error
              ? 'border-status-rejected-fg focus-visible:border-status-rejected-fg focus-visible:ring-1 focus-visible:ring-status-rejected-fg/40'
              : 'border-border-control focus-visible:border-border-focus focus-visible:ring-1 focus-visible:ring-border-focus'
          } ${className}`.trim()}
          {...props}
        />

        {rightIcon && (
          <span
            className="absolute right-3 text-text-tertiary flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        )}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-xs text-status-rejected-fg font-sans mt-0.5">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-text-tertiary font-sans mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  )
})

export default Input
