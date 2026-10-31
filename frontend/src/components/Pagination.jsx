import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Resonance Design System — Pagination Control (<Pagination />)
 *
 * Conforms to DESIGN.md Section 2 & 4:
 * - Surface: bg-surface-raised border border-border-rule
 * - Text: JetBrains Mono text-xs text-text-tertiary with tabular-nums
 * - Controls: Accessible buttons with visible focus rings
 */
export default function Pagination({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null

  return (
    <nav
      aria-label="Pagination Navigation"
      className="flex items-center justify-center gap-3 py-8 select-none"
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={page === 1}
        aria-label="Previous Page"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-surface-raised border border-border-rule hover:border-border-control text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:pointer-events-none transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span className="font-sans">Previous</span>
      </button>

      <span className="text-xs font-mono tabular-nums text-text-tertiary px-2">
        Page <span className="text-text-primary font-medium">{page}</span> of{' '}
        <span className="text-text-primary font-medium">{totalPages}</span>
      </span>

      <button
        type="button"
        onClick={onNext}
        disabled={page === totalPages}
        aria-label="Next Page"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-surface-raised border border-border-rule hover:border-border-control text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:pointer-events-none transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus"
      >
        <span className="font-sans">Next</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </nav>
  )
}
