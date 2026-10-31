import { useEffect, useRef, useId } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

/**
 * Helper to determine whether an element is currently visible and keyboard-focusable.
 * Conforms to WAI-ARIA dialog focus-trap standards by excluding:
 * - Disabled elements and fieldset[disabled] descendants
 * - Elements with tabindex="-1" or non-interactive elements
 * - Elements with hidden attribute or closest('[hidden]')
 * - Elements with aria-hidden="true" or descendants of closest('[aria-hidden="true"]')
 * - Elements with inert attribute or descendants of closest('[inert]')
 * - Elements with computed display: none, visibility: hidden, or visibility: collapse
 * - Descendants of containers with display: none or visibility: hidden/collapse
 */
function isFocusableAndVisible(el, container) {
  if (!el || el.nodeType !== 1) return false

  // Form controls disabled state (including fieldset[disabled])
  if (el.disabled || el.hasAttribute('disabled') || el.closest('fieldset[disabled]')) {
    return false
  }

  // Not keyboard-focusable
  if (el.getAttribute('tabindex') === '-1' || (el.hasAttribute('tabindex') && el.tabIndex < 0)) {
    return false
  }

  // Hidden inputs
  if (el.tagName === 'INPUT' && el.type === 'hidden') {
    return false
  }

  // Links without href
  if (el.tagName === 'A' && !el.hasAttribute('href')) {
    return false
  }

  // HTML5 hidden attribute on element or ancestor
  if (el.hidden || el.hasAttribute('hidden') || el.closest('[hidden]')) {
    return false
  }

  // ARIA hidden on element or ancestor
  if (el.getAttribute('aria-hidden') === 'true' || el.closest('[aria-hidden="true"]')) {
    return false
  }

  // Inert attribute on element or ancestor
  if (el.hasAttribute('inert') || el.closest('[inert]')) {
    return false
  }

  // Computed styles check (display, visibility)
  if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
    const style = window.getComputedStyle(el)
    if (style.display === 'none') return false
    if (style.visibility === 'hidden' || style.visibility === 'collapse') return false

    // Inspect ancestor containers up to container
    let parent = el.parentElement
    while (parent && parent !== container) {
      if (parent.hidden || parent.hasAttribute('hidden')) return false
      if (parent.getAttribute('aria-hidden') === 'true') return false
      if (parent.hasAttribute('inert')) return false

      const parentStyle = window.getComputedStyle(parent)
      if (parentStyle.display === 'none') return false
      if (parentStyle.visibility === 'hidden' || parentStyle.visibility === 'collapse') return false

      parent = parent.parentElement
    }
  }

  // Layout check (must have dimensions or client rects)
  if (!el.getClientRects().length && !el.offsetWidth && !el.offsetHeight) {
    return false
  }

  return true
}

function getFocusableElements(container) {
  if (!container) return []

  const selector = [
    'button',
    '[href]',
    'input',
    'select',
    'textarea',
    '[tabindex]',
  ].join(', ')

  const candidates = container.querySelectorAll(selector)
  return Array.from(candidates).filter((el) => isFocusableAndVisible(el, container))
}

/**
 * Resonance Design System — Accessible Modal Dialog Primitive (<Modal />)
 *
 * Conforms to DESIGN.md Section 4.5:
 * - Centered surface-elevated (#1e2027) container over #000000/80 backdrop
 * - 1px border (#262932) and 12px radius (rounded-lg)
 * - Traps Tab and Shift+Tab focus within dialog boundaries (excluding hidden elements)
 * - Escape key dismisses modal (inhibited during isLoading)
 * - Restores focus to previous active element on unmount
 * - Locks body scroll while open and restores cleanly on cleanup
 * - Stabilized effect dependencies prevent spurious scroll/focus toggles on parent re-renders
 * - Reusable primitive prepared for Phase 6 call-site migrations
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  variant = 'primary', // 'primary' | 'danger'
  isConfirmDisabled = false,
  isLoading = false,
}) {
  const dialogRef = useRef(null)
  const previousActiveElementRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const isLoadingRef = useRef(isLoading)

  useEffect(() => {
    onCloseRef.current = onClose
    isLoadingRef.current = isLoading
  }, [onClose, isLoading])

  const uniqueId = useId()
  const titleId = title ? `${uniqueId}-title` : undefined
  const descriptionId = description ? `${uniqueId}-description` : undefined

  useEffect(() => {
    if (!isOpen) return

    previousActiveElementRef.current = document.activeElement

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        if (!isLoadingRef.current) {
          onCloseRef.current?.()
        }
        return
      }

      if (e.key === 'Tab') {
        const dialog = dialogRef.current
        if (!dialog) return

        const focusable = getFocusableElements(dialog)

        if (focusable.length === 0) {
          e.preventDefault()
          if (document.activeElement !== dialog) {
            dialog.focus()
          }
          return
        }

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first || !dialog.contains(document.activeElement)) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last || !dialog.contains(document.activeElement)) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Shift initial focus to designated target or first interactive element
    const timer = setTimeout(() => {
      const dialog = dialogRef.current
      if (dialog) {
        const autoTarget = dialog.querySelector('[data-autofocus="true"]')
        if (autoTarget && isFocusableAndVisible(autoTarget, dialog)) {
          autoTarget.focus()
        } else {
          const focusable = getFocusableElements(dialog)
          if (focusable.length > 0) {
            focusable[0].focus()
          } else {
            dialog.focus()
          }
        }
      }
    }, 50)

    // Scroll lock
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer)
      document.body.style.overflow = prevOverflow

      // Focus restoration
      const prevEl = previousActiveElementRef.current
      if (prevEl && typeof prevEl.focus === 'function' && document.body.contains(prevEl)) {
        prevEl.focus()
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose()
    }
  }

  return (
    <div
      role="presentation"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-200"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-label={!titleId ? 'Modal dialog' : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-surface-elevated border border-border-rule rounded-lg shadow-level-3 p-6 text-text-primary focus-visible:outline-none relative transition-all"
      >
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0 flex-1">
            {title && (
              <h2
                id={titleId}
                className="font-serif text-xl sm:text-2xl text-text-primary tracking-normal truncate"
              >
                {title}
              </h2>
            )}
            {description && (
              <p id={descriptionId} className="text-xs sm:text-sm text-text-secondary mt-1 font-sans">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => !isLoading && onClose()}
            disabled={isLoading}
            aria-label="Close dialog"
            className="p-1 rounded-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent hover:border-border-rule transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dialog Body Content */}
        {children && (
          <div className={`${(Boolean(cancelText) || Boolean(confirmText && onConfirm)) ? 'mb-6' : ''} font-sans text-sm text-text-primary`}>
            {children}
          </div>
        )}

        {/* Action Buttons */}
        {(Boolean(cancelText) || Boolean(confirmText && onConfirm)) && (
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
            {cancelText && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
              >
                {cancelText}
              </Button>
            )}

            {confirmText && onConfirm && (
              <Button
                variant={variant === 'danger' ? 'danger' : 'primary'}
                size="sm"
                data-autofocus={variant !== 'danger'}
                onClick={onConfirm}
                disabled={isConfirmDisabled}
                isLoading={isLoading}
              >
                {confirmText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
