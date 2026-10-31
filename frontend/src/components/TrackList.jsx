import TrackCard from './TrackCard'
import TrackRow from './TrackRow'

/**
 * Resonance Design System — Unified Dual-Mode Track Container (<TrackList />)
 *
 * Conforms to DESIGN.md Section 4.3 & Semantic WAI-ARIA Table Standards:
 * - layout="grid" (default): Responsive artwork card grid using <TrackCard />
 * - layout="table": Archival editorial ledger table using <TrackRow />
 *
 * Table Structure (4 Columns):
 *   1. Title (role="columnheader", aria-colindex="1"): Combines # index/play button, cover thumbnail, and title (plus artist on mobile)
 *   2. Artist (role="columnheader", aria-colindex="2", hidden sm:block): Artist name ledger column
 *   3. Genre (role="columnheader", aria-colindex="3", hidden md:block): Genre metadata tag
 *   4. Time (role="columnheader", aria-colindex="4"): Duration timestamp and optional admin action
 */
export default function TrackList({
  tracks = [],
  onPlay,
  currentTrack,
  isPlaying = false,
  onDelete,
  role,
  canDelete = role === 'admin',
  deleteActionLabel = role === 'admin' ? 'Delete' : 'Remove',
  layout = 'grid',
}) {
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return null
  }

  if (layout === 'table') {
    return (
      <div className="w-full select-none" role="table" aria-label="Track list" aria-colcount={4}>
        {/* Table Column Headers */}
        <div
          role="row"
          className="flex items-center justify-between px-3 py-2 sm:px-4 text-[11px] font-mono uppercase tracking-wider text-text-tertiary border-b border-border-rule"
        >
          <div role="columnheader" aria-colindex={1} className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pr-3">
            <span className="w-7 text-center shrink-0">#</span>
            <span className="w-10 shrink-0" aria-hidden="true" />
            <span className="truncate">Title</span>
          </div>

          <div role="columnheader" aria-colindex={2} className="hidden sm:block w-44 md:w-52 lg:w-64 truncate pr-4">
            <span>Artist</span>
          </div>

          <div role="columnheader" aria-colindex={3} className="hidden md:block w-28 lg:w-36 truncate pr-4">
            <span>Genre</span>
          </div>

          <div
            role="columnheader"
            aria-colindex={4}
            className={`flex items-center gap-2 sm:gap-4 shrink-0 justify-end ${
              canDelete && onDelete ? 'w-20 sm:w-24' : 'w-16'
            }`}
          >
            <span>Time</span>
            {canDelete && onDelete && <span className="w-6 shrink-0" aria-hidden="true" />}
          </div>
        </div>

        {/* Table Rows Body */}
        <div role="rowgroup">
          {tracks.map((track, index) => (
            <TrackRow
              key={track._id || index}
              track={track}
              index={index}
              onPlay={() => onPlay(tracks, index)}
              isActive={currentTrack?._id === track._id}
              isPlaying={currentTrack?._id === track._id && isPlaying}
              onDelete={onDelete}
              role={role}
              canDelete={canDelete}
              deleteActionLabel={deleteActionLabel}
              priority={index === 0}
            />
          ))}
        </div>
      </div>
    )
  }

  // Default Grid Layout (Preserves 100% backward compatibility with all current page callers)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 p-4 md:p-6">
      {tracks.map((track, index) => (
        <TrackCard
          key={track._id || index}
          track={track}
          onPlay={() => onPlay(tracks, index)}
          isActive={currentTrack?._id === track._id}
          isPlaying={currentTrack?._id === track._id && isPlaying}
          onDelete={onDelete}
          role={role}
          canDelete={canDelete}
          deleteActionLabel={deleteActionLabel}
          priority={index === 0}
        />
      ))}
    </div>
  )
}
