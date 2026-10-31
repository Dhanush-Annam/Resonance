import { Play, Pause, Trash2 } from 'lucide-react'
import { cloudinaryCoverSrcSet, cloudinaryCoverUrl } from '../utils/cloudinary'

/**
 * Resonance Design System — Grid Track Card (<TrackCard />)
 *
 * Conforms to DESIGN.md Section 4.3 & Accessible Component Pattern:
 * - Root element is a semantic <article> WITHOUT nested role="button" or tabIndex={0}
 * - Discrete keyboard focus targets: Play trigger and Admin deletion trigger
 * - Clicking the card surface starts playback without violating button-nesting semantics
 * - Keyboard Enter/Space on nested controls cannot accidentally trigger parent handlers
 * - 1:1 aspect-ratio container with 8px radius (rounded-md)
 * - 36px circular off-white (#f5f2eb) play button with dark (#101114) glyph
 */
export default function TrackCard({
  track,
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
  const coverSrc = cloudinaryCoverUrl(rawCoverUrl, { w: 800 })
  const coverSrcSet = cloudinaryCoverSrcSet(rawCoverUrl, [
    { w: 400 },
    { w: 800 },
    { w: 1200 },
  ])

  const isCurrentlyPlaying = isActive && isPlaying
  const artistName = track.artist?.username || 'Unknown Artist'

  const handleCardClick = (e) => {
    // Prevent card click if an interactive element (e.g. Delete button) was targeted
    if (e.target.closest('button')) return
    if (onPlay) onPlay()
  }

  const handlePlayButtonClick = (e) => {
    e.stopPropagation()
    if (onPlay) onPlay()
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    if (onDelete && track._id) onDelete(track._id)
  }

  const handleControlKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      // Isolate keydown inside nested interactive controls
      e.stopPropagation()
    }
  }

  return (
    <article
      onClick={handleCardClick}
      aria-label={`${track.title || 'Untitled Track'} by ${artistName}`}
      className={`group relative p-3 rounded-md transition-colors duration-200 border select-none cursor-pointer focus-within:border-border-control focus-within:ring-1 focus-within:ring-border-focus/40 ${
        isActive
          ? 'bg-surface-raised border-accent-brand ring-1 ring-accent-brand/40'
          : 'bg-surface-raised border-border-rule hover:border-border-control hover:bg-surface-hover'
      }`}
    >
      {/* 1:1 Aspect Ratio Cover Artwork Container (8px radius) */}
      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-surface-elevated mb-3 border border-border-rule/60">
        <img
          src={coverSrc}
          srcSet={coverSrcSet}
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          alt={track.title ? `${track.title} cover artwork` : 'Track cover artwork'}
          className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300 ease-out"
          decoding="async"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
        />

        {/* 36px Circular Off-White Play Button */}
        <div className="absolute right-2.5 bottom-2.5">
          <button
            type="button"
            onClick={handlePlayButtonClick}
            onKeyDown={handleControlKeyDown}
            aria-label={isCurrentlyPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
            className={`w-9 h-9 rounded-full bg-[#f5f2eb] hover:bg-[#e2dfd7] text-[#101114] flex items-center justify-center shadow-md shadow-black/80 transition-all duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised ${
              isActive
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0'
            }`}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-4 h-4 fill-[#101114]" />
            ) : (
              <Play className="w-4 h-4 fill-[#101114] ml-0.5" />
            )}
          </button>
        </div>

        {/* Deletion / Removal Trigger */}
        {canDelete && onDelete && (
          <button
            type="button"
            onClick={handleDeleteClick}
            onKeyDown={handleControlKeyDown}
            title={`${deleteActionLabel} track`}
            aria-label={`${deleteActionLabel} ${track.title}`}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-sm bg-canvas-base/80 hover:bg-status-rejected-bg text-text-secondary hover:text-status-rejected-fg border border-border-rule hover:border-status-rejected-bd backdrop-blur-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-150 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Track Metadata */}
      <div className="space-y-0.5 min-w-0">
        <h3
          className={`font-medium text-sm truncate font-sans ${
            isActive ? 'text-accent-text' : 'text-text-primary'
          }`}
          title={track.title}
        >
          {track.title}
        </h3>

        <p className="text-xs text-text-secondary truncate font-sans">
          {artistName}
          {track.genre && <span className="text-text-tertiary"> • </span>}
          {track.genre && <span className="text-text-tertiary">{track.genre}</span>}
        </p>
      </div>
    </article>
  )
}
