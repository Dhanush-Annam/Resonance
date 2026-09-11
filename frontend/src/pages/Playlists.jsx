import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ListMusic, Trash2, ChevronLeft, X, Play, Pause, Music } from 'lucide-react'
import { cloudinaryCoverSrcSet, cloudinaryCoverUrl } from '../utils/cloudinary'

export default function Playlists({ onPlay, currentTrack, isPlaying = false, onPlaylistChanged }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

    if (!confirm('Delete this playlist permanently?')) return

    try {
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

      navigate('/library')
    } catch (err) {
      console.error(err)
      setError('Failed to delete playlist')
    }
  }

  return (
    <div className="flex-1 bg-zinc-950 text-white p-4 sm:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ListMusic className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate max-w-sm sm:max-w-md">
              {playlist?.name || 'Playlist'}
            </h1>
            <p className="text-xs text-zinc-400">
              {trackList.length} {trackList.length === 1 ? 'track' : 'tracks'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={deletePlaylist}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium disabled:opacity-40 transition"
            disabled={!playlist || loading}
            title="Delete playlist"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>

          <button
            onClick={() => navigate('/library')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Library</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 animate-pulse">
              <div className="w-full aspect-square bg-zinc-800 rounded-lg mb-3" />
              <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
              <div className="h-3 bg-zinc-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm">
          {error}
        </div>
      ) : trackList.length === 0 ? (
        <div className="py-20 text-center max-w-sm mx-auto">
          <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
            <Music className="w-6 h-6 text-zinc-500" />
          </div>
          <p className="text-sm font-semibold text-zinc-300 mb-1">Playlist is empty</p>
          <p className="text-xs text-zinc-500">
            Browse tracks on Home or Search and use the &ldquo;+&rdquo; button on the player to add songs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {trackList.map((track, index) => {
            const isCurrentlyActive = currentTrack?._id === track._id
            const isPlayingThis = isCurrentlyActive && isPlaying
            return (
              <div
                key={track._id}
                onClick={() => onPlay(trackList, index)}
                className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-300 border ${
                  isCurrentlyActive
                    ? 'bg-zinc-800/90 border-emerald-500/40 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                    : 'bg-zinc-900/60 hover:bg-zinc-800/70 border-zinc-800/60 hover:border-zinc-700/80 shadow-md hover:shadow-xl'
                }`}
              >
                {/* Artwork */}
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-3 shadow-inner">
                  <img
                    src={cloudinaryCoverUrl(track.coverUrl || '/no-image.jpg', { w: 800 })}
                    srcSet={cloudinaryCoverSrcSet(track.coverUrl || '/no-image.jpg', [
                      { w: 400 },
                      { w: 800 },
                      { w: 1200 },
                    ])}
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    alt={track.title ? `${track.title} cover` : 'Track cover'}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                    decoding="async"
                    loading="lazy"
                  />

                  {/* Play/Pause hover button */}
                  <div className="absolute right-2.5 bottom-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onPlay(trackList, index)
                      }}
                      className={`w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xl shadow-black/60 transition-all duration-300 transform ${
                        isCurrentlyActive
                          ? 'opacity-100 translate-y-0 scale-100'
                          : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105'
                      }`}
                    >
                      {isPlayingThis ? (
                        <Pause className="w-5 h-5 fill-black" />
                      ) : (
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Remove Track Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeTrack(track._id)
                    }}
                    title="Remove from playlist"
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 hover:bg-rose-600/90 text-zinc-300 hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Metadata */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <p
                      className={`font-semibold text-sm truncate ${
                        isPlayingThis ? 'text-emerald-400' : 'text-zinc-100 group-hover:text-white'
                      }`}
                    >
                      {track.title}
                    </p>
                    {isPlayingThis && (
                      <span className="flex items-center gap-0.5 shrink-0">
                        <span className="w-1 h-3 bg-emerald-400 animate-pulse rounded-full" />
                        <span className="w-1 h-4 bg-emerald-400 animate-pulse delay-75 rounded-full" />
                        <span className="w-1 h-2 bg-emerald-400 animate-pulse delay-150 rounded-full" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 truncate">
                    {track.artist?.username || 'Unknown Artist'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
