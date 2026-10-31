import { Play, Pause, Trash2 } from 'lucide-react'
import { cloudinaryCoverUrl } from '../utils/cloudinary'

/**
 * Resonance Design System — Editorial Table Row Primitive (<TrackRow />)
 *
 * Conforms to DESIGN.md Section 4.3 & Accessible Table Semantics:
 * - Structural boundary: 1px bottom border #1c1e24 (border-border-subtle)
 * - Hover state: Background lifts cleanly to #181a1f (bg-surface-raised)
 * - 4-Column Table Structure matching TrackList header:
 *     Cell 1 (aria-colindex="1"): Index / Play trigger swap + Cover + Title (with stacked Artist on mobile)
 *     Cell 2 (aria-colindex="2", hidden sm:block): Artist name
 *     Cell 3 (aria-colindex="3", hidden md:block): Genre tag
 *     Cell 4 (aria-colindex="4"): Duration timestamp + optional admin delete action
 * - Duration: JetBrains Mono 12px #7e8594 with tabular-nums
 * - Semantic role="row" with role="cell" containers; isolated keyboard event propagation
 */
function formatDuration(val) {
  if (typeof val === 'string' && val.includes(':')) return val
  const num = typeof val === 'number' ? val : parseFloat(val)
  if (isNaN(num) || num <= 0) return '--:--'
  const m = Math.floor(num / 60)
  const s = Math.floor(num % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function TrackRow({
  track,
  index = 0,
  onPlay,
  isActive = false,
  isPlaying = false,
  onDelete,
  role,
  canDelete = role === 'admin',
  deleteActionLabel = role === 'admin' ? 'Delete' : 'Remove',
  priority = false,
}) {
  const rawCoverUrl = track.coverUrl || '/no-image.jpg'
  const coverSrc = cloudinaryCoverUrl(rawCoverUrl, { w: 100 })
  const isCurrentlyPlaying = isActive && isPlaying
  const formattedIndex = String(index + 1).padStart(2, '0')
  const artistName = track.artist?.username || 'Unknown Artist'

  const handleRowClick = (e) => {
    // If click originated from a button, let the button handler handle it
    if (e.target.closest('button')) return
    if (onPlay) onPlay()
  }

  const handlePlayToggle = (e) => {
    e.stopPropagation()
    if (onPlay) onPlay()
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (onDelete && track._id) onDelete(track._id)
  }

  const handleControlKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation()
    }
  }

  return (
    <div
      onClick={handleRowClick}
      role="row"
      aria-label={`${track.title || 'Untitled Track'} by ${artistName}`}
      className={`group flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 border-b border-border-subtle cursor-pointer select-none transition-colors duration-150 focus-within:bg-surface-raised ${
        isActive ? 'bg-surface-raised/80' : 'hover:bg-surface-raised'
      }`}
    >
      {/* Primary Cell: Index / Play Trigger + Cover Artwork + Title & Artist */}
      <div
        role="cell"
        aria-colindex={1}
        className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pr-3"
      >
        {/* Index / Play Swap Column (Fixed 28px) */}
        <div className="w-7 shrink-0 flex items-center justify-center font-mono text-[11px] text-text-tertiary">
          {/* Default Index Number: Hidden on hover, active, or focus-within */}
          <span
            className={`transition-opacity duration-150 ${
              isActive || isCurrentlyPlaying
                ? 'hidden'
                : 'group-hover:hidden group-focus-within:hidden'
            }`}
          >
            {formattedIndex}
          </span>

          {/* Interactive Play/Pause Trigger */}
          <button
            type="button"
            onClick={handlePlayToggle}
            onKeyDown={handleControlKeyDown}
            aria-label={isCurrentlyPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
            className={`w-6 h-6 rounded-sm flex items-center justify-center text-text-primary hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus ${
              isActive || isCurrentlyPlaying
                ? 'flex'
                : 'hidden group-hover:flex group-focus-within:flex'
            }`}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current text-accent-text" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current text-text-primary ml-0.5" />
            )}
          </button>
        </div>

        {/* Artwork Thumbnail (40x40px, rounded-sm) */}
        <div className="w-10 h-10 rounded-sm overflow-hidden bg-surface-elevated border border-border-rule shrink-0 relative">
          <img
            src={coverSrc}
            alt={track.title ? `${track.title} thumbnail` : 'Track thumbnail'}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Title & Artist (Stacked on mobile, Title column on desktop) */}
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm truncate font-medium ${
              isActive ? 'text-accent-text' : 'text-text-primary'
            }`}
            title={track.title}
          >
            {track.title}
          </p>
          <p className="text-xs text-text-secondary truncate mt-0.5 sm:hidden font-sans">
            {artistName}
          </p>
        </div>
      </div>

      {/* Middle Desktop Cell: Artist */}
      <div
        role="cell"
        aria-colindex={2}
        className="hidden sm:block w-44 md:w-52 lg:w-64 truncate text-xs text-text-secondary pr-4 font-sans"
      >
        <span className="truncate hover:text-text-primary transition-colors">
          {artistName}
        </span>
      </div>

      {/* Middle Desktop Cell: Genre */}
      <div
        role="cell"
        aria-colindex={3}
        className="hidden md:block w-28 lg:w-36 truncate text-xs text-text-tertiary pr-4 font-sans"
      >
        {track.genre ? (
          <span className="px-1.5 py-0.5 rounded-xs bg-surface-hover text-text-tertiary text-[11px] font-sans">
            {track.genre}
          </span>
        ) : (
          <span className="text-text-tertiary/40">—</span>
        )}
      </div>

      {/* Right Cell: Duration & Deletion / Removal Action */}
      <div
        role="cell"
        aria-colindex={4}
        className={`flex items-center gap-2 sm:gap-4 shrink-0 justify-end ${
          canDelete && onDelete ? 'w-20 sm:w-24' : 'w-16'
        }`}
      >
        <span className="font-mono text-xs text-text-tertiary tabular-nums">
          {formatDuration(track.duration)}
        </span>

        {/* Deletion / Removal Action */}
        {canDelete && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            onKeyDown={handleControlKeyDown}
            title={`${deleteActionLabel} track`}
            aria-label={`${deleteActionLabel} ${track.title}`}
            className="w-6 h-6 flex items-center justify-center rounded-sm text-text-tertiary hover:text-status-rejected-fg hover:bg-status-rejected-bg border border-transparent hover:border-status-rejected-bd opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
