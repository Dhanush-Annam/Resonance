import { Link, useNavigate } from 'react-router-dom'
import { Heart, Clock, ListMusic, Plus } from 'lucide-react'
import Button from '../components/Button'

/**
 * Resonance Design System — Listener Library Surface (<Library />)
 *
 * Conforms to DESIGN.md Section 6.1:
 * - Replaces bento gradient blocks with a clean archival catalog index.
 * - Archival Collections: Liked Master Tracks & Listening History.
 * - Custom Playlists: Tokenized catalog cards with JetBrains Mono tabular counts.
 * - Restrained typography and deliberate spacing without SaaS tropes.
 * - Keyboard Accessible: Uses semantic <Link> elements for all collections and playlist cards.
 */
export default function Library({ likedCount = 0, recentCount = 0, playlists = [] }) {
  const navigate = useNavigate()

  return (
    <div className="flex-1 bg-canvas-base text-text-primary p-4 sm:p-6 overflow-y-auto">
      {/* Library Surface Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-border-subtle">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight">
            Your Library
          </h1>
          <p className="text-xs text-text-secondary font-sans mt-0.5">
            Archival catalog collections, listening history, and custom mixes
          </p>
        </div>

        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/library/playlists/new')}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Playlist
          </Button>
        </div>
      </div>

      {/* Primary Archival Index (Liked Tracks & Listening History) */}
      <div className="mb-8">
        <h2 className="text-[11px] font-mono uppercase tracking-wider text-text-secondary font-medium mb-3">
          Archival Collections
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Liked Songs */}
          <Link
            to="/library/liked"
            className="group p-4 sm:p-5 bg-surface-raised border border-border-rule hover:border-border-control hover:bg-surface-hover rounded-md transition duration-150 shadow-sm block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-accent-brand/10 border border-accent-brand/20 flex items-center justify-center text-accent-text shrink-0">
                <Heart className="w-5 h-5 fill-accent-brand text-accent-brand" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm sm:text-base text-text-primary group-hover:text-text-primary transition-colors">
                  Liked Songs
                </p>
                <p className="text-xs font-mono tabular-nums text-text-tertiary mt-0.5">
                  {likedCount} {likedCount === 1 ? 'saved recording' : 'saved recordings'}
                </p>
              </div>
            </div>
          </Link>

          {/* Recently Played */}
          <Link
            to="/library/recent"
            className="group p-4 sm:p-5 bg-surface-raised border border-border-rule hover:border-border-control hover:bg-surface-hover rounded-md transition duration-150 shadow-sm block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-surface-elevated border border-border-rule flex items-center justify-center text-text-secondary shrink-0">
                <Clock className="w-5 h-5 text-text-secondary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm sm:text-base text-text-primary group-hover:text-text-primary transition-colors">
                  Recently Played
                </p>
                <p className="text-xs font-mono tabular-nums text-text-tertiary mt-0.5">
                  {recentCount} {recentCount === 1 ? 'session recording' : 'session recordings'}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Custom Playlists Section */}
      <div>
        <h2 className="text-[11px] font-mono uppercase tracking-wider text-text-secondary font-medium mb-3">
          Custom Playlists
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Playlist Cards */}
          {playlists.map((p) => {
            const count = p.trackCount || (Array.isArray(p.tracks) ? p.tracks.length : 0)
            return (
              <Link
                key={p._id}
                to={`/library/playlists/${p._id}`}
                className="group p-4 bg-surface-raised border border-border-rule hover:border-border-control hover:bg-surface-hover rounded-md transition duration-150 shadow-sm block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-surface-elevated border border-border-rule flex items-center justify-center text-accent-text shrink-0">
                    <ListMusic className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-text-primary truncate font-sans">
                      {p.name}
                    </p>
                    <p className="text-xs font-mono tabular-nums text-text-tertiary mt-0.5">
                      {count} {count === 1 ? 'track' : 'tracks'}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}

          {/* Inline Create Playlist Action Card */}
          <Link
            to="/library/playlists/new"
            className="group p-4 bg-surface-raised/40 border border-dashed border-border-control hover:border-border-focus hover:bg-surface-raised rounded-md transition duration-150 flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          >
            <div className="w-10 h-10 rounded-sm bg-surface-elevated border border-border-rule flex items-center justify-center text-text-tertiary group-hover:text-text-primary transition shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-text-secondary group-hover:text-text-primary transition-colors font-sans">
                Create Playlist
              </p>
              <p className="text-xs text-text-tertiary">Curate a new collection</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
