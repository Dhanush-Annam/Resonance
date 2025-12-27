export default function Pagination({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-4 py-6">
      <button
        onClick={onPrev}
        disabled={page === 1}
        className="px-4 py-2 bg-zinc-800 rounded disabled:opacity-40 hover:bg-zinc-700"
      >
        Previous
      </button>

      <span className="text-gray-400">
        Page {page} of {totalPages}
      </span>

      <button
        onClick={onNext}
        disabled={page === totalPages}
        className="px-4 py-2 bg-zinc-800 rounded disabled:opacity-40 hover:bg-zinc-700"
      >
        Next
      </button>
    </div>
  )
}
