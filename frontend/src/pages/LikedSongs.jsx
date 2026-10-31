import { useNavigate } from 'react-router-dom'
import { Heart, ChevronLeft } from 'lucide-react'
import TrackList from '../components/TrackList'
import Button from '../components/Button'

/**
 * Resonance Design System — Liked Songs Surface (<LikedSongs />)
 *
 * Conforms to DESIGN.md Section 6.1:
 * - Uses unified <TrackList /> container for saved favorite recordings.
 * - Header with Instrument Serif title and JetBrains Mono tabular counts.
 * - Reusable Button primitive for library back-navigation.
 */
export default function LikedSongs({
  likedTracks = [],
  onPlay,
  currentTrack,
  isPlaying = false,
}) {
  const navigate = useNavigate()

  return (
    <div className="flex-1 bg-canvas-base text-text-primary p-4 sm:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-accent-brand/10 border border-accent-brand/20 flex items-center justify-center text-accent-text shrink-0">
            <Heart className="w-5 h-5 fill-accent-brand text-accent-brand" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight">
              Liked Songs
            </h1>
            <p className="text-xs font-mono tabular-nums text-text-tertiary mt-0.5">
              {likedTracks.length} {likedTracks.length === 1 ? 'saved recording' : 'saved recordings'}
            </p>
          </div>
        </div>

        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/library')}
            leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
          >
            Back to Library
          </Button>
        </div>
      </div>

      {/* Content */}
      {likedTracks.length === 0 ? (
        <div className="py-20 text-center max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-full bg-surface-raised border border-border-rule flex items-center justify-center mx-auto mb-3 text-text-tertiary">
            <Heart className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-base text-text-primary font-normal mb-1">
            No liked songs yet
          </h2>
          <p className="text-xs text-text-tertiary font-sans">
            Songs you favorite by tapping the heart icon in the player or track rows will appear here.
          </p>
        </div>
      ) : (
        <TrackList
          tracks={likedTracks}
          onPlay={onPlay}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
        />
      )}
    </div>
  )
}
