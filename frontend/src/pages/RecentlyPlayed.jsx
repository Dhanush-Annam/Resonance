import { useNavigate } from 'react-router-dom'
import { Clock, ChevronLeft, Music } from 'lucide-react'
import TrackList from '../components/TrackList'
import Button from '../components/Button'

/**
 * Resonance Design System — Recently Played Surface (<RecentlyPlayed />)
 *
 * Conforms to DESIGN.md Section 6.1:
 * - Uses unified <TrackList /> container for playback history.
 * - Header in Instrument Serif with JetBrains Mono tabular metadata.
 * - Reusable Button primitive for library navigation.
 */
export default function RecentlyPlayed({
  tracks = [],
  onPlay,
  currentTrack,
  isPlaying = false,
}) {
  const navigate = useNavigate()
  const trackList = tracks.map((r) => r.track).filter(Boolean)

  return (
    <div className="flex-1 bg-canvas-base text-text-primary p-4 sm:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-surface-elevated border border-border-rule flex items-center justify-center text-text-secondary shrink-0">
            <Clock className="w-5 h-5 text-text-secondary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight">
              Recently Played
            </h1>
            <p className="text-xs font-mono tabular-nums text-text-tertiary mt-0.5">
              {trackList.length} {trackList.length === 1 ? 'session recording' : 'session recordings'}
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
      {trackList.length === 0 ? (
        <div className="py-20 text-center max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-full bg-surface-raised border border-border-rule flex items-center justify-center mx-auto mb-3 text-text-tertiary">
            <Music className="w-5 h-5 text-text-tertiary" />
          </div>
          <h2 className="font-serif text-base text-text-primary font-normal mb-1">
            No recently played songs
          </h2>
          <p className="text-xs text-text-tertiary font-sans">
            Start listening to master recordings across the catalog to view your session history here.
          </p>
        </div>
      ) : (
        <TrackList
          tracks={trackList}
          onPlay={onPlay}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
        />
      )}
    </div>
  )
}
