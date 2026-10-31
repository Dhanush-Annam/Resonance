import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ListMusic, Trash2, ChevronLeft, Music } from 'lucide-react'
import TrackList from '../components/TrackList'
import Button from '../components/Button'
import Modal from '../components/Modal'

/**
 * Resonance Design System — Custom Playlist Detail Surface (<Playlists />)
 *
 * Conforms to DESIGN.md Section 6.1:
 * - Eliminates duplicated track card implementation in favor of reusable <TrackList />.
 * - Replaces browser native confirm() with accessible Phase 3 <Modal /> primitive.
 * - Reusable Button primitives for actions and navigation.
 * - Typography in Instrument Serif with JetBrains Mono tabular counts.
 */
export default function Playlists({ onPlay, currentTrack, isPlaying = false, onPlaylistChanged }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const trackList = useMemo(() => {
    if (!playlist?.tracks) return []
    return Array.isArray(playlist.tracks) ? playlist.tracks : []
  }, [playlist])

  useEffect(() => {
    const fetchPlaylist = async () => {
      const token = sessionStorage.getItem('token')
      if (!token) {
        setError('You must be logged in')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/playlists/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        const data = await res.json().catch(() => null)

        if (!res.ok) {
          setError(data?.message || 'Failed to load playlist')
          setPlaylist(null)
          return
        }

        setPlaylist(data)
      } catch (err) {
        console.error(err)
        setError('Failed to load playlist')
        setPlaylist(null)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchPlaylist()
    }
  }, [id])

  const removeTrack = async (trackId) => {
    const token = sessionStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/playlists/${id}/tracks/${trackId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.message || 'Failed to remove track')
        return
      }

      setPlaylist((prev) => {
        if (!prev) return prev
        const nextTracks = Array.isArray(prev.tracks)
          ? prev.tracks.filter((t) => t._id !== trackId)
          : []
        return { ...prev, tracks: nextTracks }
      })

      if (typeof onPlaylistChanged === 'function') {
        onPlaylistChanged()
      }
    } catch (err) {
      console.error(err)
      setError('Failed to remove track')
    }
  }

  const deletePlaylist = async () => {
    const token = sessionStorage.getItem('token')
    if (!token) return

    try {
      setIsDeleting(true)
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/playlists/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.message || 'Failed to delete playlist')
        return
      }

      if (typeof onPlaylistChanged === 'function') {
        onPlaylistChanged()
      }

      setShowDeleteModal(false)
      navigate('/library')
    } catch (err) {
      console.error(err)
      setError('Failed to delete playlist')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex-1 bg-canvas-base text-text-primary p-4 sm:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-surface-elevated border border-border-rule flex items-center justify-center text-accent-text shrink-0">
            <ListMusic className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1
              className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight truncate max-w-sm sm:max-w-md"
              title={playlist?.name || 'Playlist'}
            >
              {playlist?.name || 'Playlist'}
            </h1>
            <p className="text-xs font-mono tabular-nums text-text-tertiary mt-0.5">
              {trackList.length} {trackList.length === 1 ? 'track' : 'tracks'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            disabled={!playlist || loading}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete Playlist
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/library')}
            leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
          >
            Library
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
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
      ) : error ? (
        <div className="p-4 rounded-md bg-status-rejected-bg border border-status-rejected-bd text-status-rejected-fg text-xs sm:text-sm font-sans">
          {error}
        </div>
      ) : trackList.length === 0 ? (
        <div className="py-20 text-center max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-full bg-surface-raised border border-border-rule flex items-center justify-center mx-auto mb-3 text-text-tertiary">
            <Music className="w-5 h-5 text-text-tertiary" />
          </div>
          <h2 className="font-serif text-base text-text-primary font-normal mb-1">
            Playlist is empty
          </h2>
          <p className="text-xs text-text-tertiary font-sans">
            Browse releases across Home or Search and tap the &ldquo;+&rdquo; button on the player bar to add songs to this mix.
          </p>
        </div>
      ) : (
        <TrackList
          tracks={trackList}
          onPlay={onPlay}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onDelete={removeTrack}
          canDelete={true}
          deleteActionLabel="Remove"
        />
      )}

      {/* Accessible Confirmation Modal (Replaces browser-native confirm()) */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Playlist"
        description={`Are you sure you want to permanently delete "${playlist?.name || 'this playlist'}"? This action cannot be undone.`}
        confirmText="Delete Playlist"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={deletePlaylist}
      />
    </div>
  )
}
