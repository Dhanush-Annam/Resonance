import { useEffect, useState } from 'react'
import { Play, Pause, Music } from 'lucide-react'
import TrackList from '../components/TrackList'
import Pagination from '../components/Pagination'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { cloudinaryCoverUrl } from '../utils/cloudinary'

const LIMIT = 10

/**
 * Resonance Design System — Listener Home Surface (<Home />)
 *
 * Conforms to DESIGN.md Section 6.1:
 * - Featured Release: Prominent lead release in Instrument Serif typography.
 * - Replaces generic SaaS gradient banners and emerald glowing blobs.
 * - Popular Releases: Restrained catalog section utilizing unified <TrackList />.
 * - Preserves public track fetching and playback contracts.
 * - Admin deletion uses accessible <Modal /> primitive (Phase 7: replaces window.confirm).
 */
export default function Home({ onPlay, currentTrack, isPlaying = false }) {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const role = sessionStorage.getItem('role')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Admin deletion modal state
  const [deletingTrackId, setDeletingTrackId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleAdminDeleteRequest = (id) => {
    setDeletingTrackId(id)
  }

  const handleAdminDeleteConfirm = async () => {
    if (!deletingTrackId) return
    setIsDeleting(true)

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tracks/${deletingTrackId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          },
        }
      )

      if (res.ok) {
        setTracks((prev) => prev.filter((track) => track._id !== deletingTrackId))
      }
    } finally {
      setIsDeleting(false)
      setDeletingTrackId(null)
    }
  }

  const handleAdminDeleteCancel = () => {
    setDeletingTrackId(null)
  }

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    const fetchTracks = async () => {
      setLoading(true)

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/tracks/public?page=${page}&limit=${LIMIT}`,
          { signal: controller.signal }
        )
        const data = await res.json()

        if (!active) return

        if (data && Array.isArray(data.results)) {
          setTracks(data.results)
          setTotalPages(Number.isFinite(data.totalPages) ? data.totalPages : 1)
        } else if (Array.isArray(data)) {
          // Backward-compatible fallback for flat array responses
          setTracks(data)
          setTotalPages(1)
        } else {
          setTracks([])
          setTotalPages(1)
        }
      } catch {
        if (!active) return
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchTracks()
    return () => {
      active = false
      controller.abort()
    }
  }, [page])

  const featuredTrack = tracks.length > 0 ? tracks[0] : null
  const isFeaturedActive = featuredTrack && currentTrack?._id === featuredTrack._id
  const isFeaturedPlaying = isFeaturedActive && isPlaying

  return (
    <div className="flex-1 bg-canvas-base text-text-primary overflow-y-auto">
      {/* Editorial Spotlight Banner (DESIGN.md Section 6.1) */}
      <div className="px-4 sm:px-6 pt-6 pb-2">
        <section
          aria-label="Editorial Spotlight"
          className="relative rounded-lg overflow-hidden p-6 sm:p-8 bg-surface-raised border border-border-rule shadow-level-2"
        >
          {featuredTrack ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
              {/* Featured 1:1 Cover Artwork Container */}
              <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-md overflow-hidden bg-surface-elevated border border-border-rule shrink-0 shadow-sm relative">
                <img
                  src={cloudinaryCoverUrl(featuredTrack.coverUrl || '/no-image.jpg', {
                    w: 600,
                    h: 600,
                  })}
                  alt={`${featuredTrack.title} cover artwork`}
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    e.currentTarget.src = '/no-image.jpg'
                  }}
                />
              </div>

              {/* Spotlight Metadata */}
              <div className="min-w-0 flex-1">
                <span className="inline-block text-[11px] font-mono tracking-widest text-accent-text uppercase mb-2">
                  Featured Release
                </span>
                <h1
                  className="font-serif text-2xl sm:text-3xl md:text-4xl text-text-primary tracking-tight font-normal leading-tight truncate mb-1.5"
                  title={featuredTrack.title}
                >
                  {featuredTrack.title}
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary font-sans mb-3">
                  {featuredTrack.artist?.username || 'Unknown Artist'}
                  {featuredTrack.genre && (
                    <span className="text-text-tertiary"> • {featuredTrack.genre}</span>
                  )}
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => onPlay(tracks, 0)}
                    leftIcon={
                      isFeaturedPlaying ? (
                        <Pause className="w-4 h-4 fill-[#101114]" />
                      ) : (
                        <Play className="w-4 h-4 fill-[#101114] ml-0.5" />
                      )
                    }
                  >
                    {isFeaturedPlaying ? 'Pause Release' : 'Listen Now'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-xl">
              <span className="inline-block text-[11px] font-mono tracking-widest text-accent-text uppercase mb-2">
                Curated Record House
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-text-primary tracking-tight font-normal mb-2">
                Sound in Full Resonance
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary font-sans leading-relaxed">
                Independent audio master recordings, synchronized real-time lyrics, and archival catalog streaming.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Catalog Section Header */}
      <div className="px-4 sm:px-6 pt-6 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-normal text-text-primary tracking-tight">
            Popular Releases
          </h2>
          <p className="text-xs text-text-secondary font-sans mt-0.5">
            Independent soundscapes ready for your queue
          </p>
        </div>
      </div>

      {/* Loading Skeleton Placeholders */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 p-4 sm:p-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="p-3 rounded-md bg-surface-raised border border-border-rule animate-pulse"
            >
              <div className="w-full aspect-square bg-surface-elevated rounded-md mb-3" />
              <div className="h-4 bg-surface-elevated rounded w-3/4 mb-2" />
              <div className="h-3 bg-surface-elevated rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && tracks.length === 0 && (
        <div className="py-20 text-center max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-full bg-surface-raised border border-border-rule flex items-center justify-center mx-auto mb-3 text-text-tertiary">
            <Music className="w-5 h-5" />
          </div>
          <p className="font-serif text-base text-text-primary mb-1">No releases found</p>
          <p className="text-xs text-text-tertiary font-sans">
            Check back soon for new master recordings or search the archive.
          </p>
        </div>
      )}

      {/* Track Grid */}
      {!loading && tracks.length > 0 && (
        <>
          <TrackList
            tracks={tracks}
            onPlay={onPlay}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onDelete={handleAdminDeleteRequest}
            role={role}
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </>
      )}

      {/* Admin Track Deletion Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingTrackId)}
        onClose={handleAdminDeleteCancel}
        title="Permanently Delete Track"
        description="This action cannot be undone. The track will be removed from the public catalog."
        confirmText="Delete Track"
        cancelText="Cancel"
        onConfirm={handleAdminDeleteConfirm}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
