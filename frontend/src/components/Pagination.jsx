import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-3 py-8 select-none">
      <button
        onClick={onPrev}
        disabled={page === 1}
        className="flex items-center gap-1 px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-medium text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Previous</span>
      </button>

      <span className="text-xs text-zinc-500 font-medium px-2">
        Page <span className="text-zinc-200 font-semibold">{page}</span> of{' '}
        <span className="text-zinc-200 font-semibold">{totalPages}</span>
      </span>

      <button
        onClick={onNext}
        disabled={page === totalPages}
        className="flex items-center gap-1 px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-medium text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition"
      >
        <span>Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
