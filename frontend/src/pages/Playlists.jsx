import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function Playlists({ onPlay, currentTrack, onPlaylistChanged }) {
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
      }
      catch (err) {
        console.error(err)
        setError('Failed to load playlist')
        setPlaylist(null)
      }
      finally {
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

    if (!confirm('Delete this playlist?')) return

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
    <div className="flex-1 bg-black text-white p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {playlist?.name ? `🎵 ${playlist.name}` : 'Playlist'}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={deletePlaylist}
            className="px-3 py-2 rounded bg-red-600 hover:bg-red-500"
            disabled={!playlist || loading}
            title="Delete playlist"
          >
            Delete
          </button>
          <button
            onClick={() => navigate('/library')}
            className="px-3 py-2 rounded bg-zinc-900 hover:bg-zinc-800"
          >
            Back
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : trackList.length === 0 ? (
        <p className="text-gray-400">No songs in this playlist yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trackList.map((track, index) => (
            <div
              key={track._id}
              onClick={() => onPlay(trackList, index)}
              className={`p-4 rounded cursor-pointer hover:bg-zinc-800 ${
                currentTrack?._id === track._id ? 'bg-zinc-800' : 'bg-zinc-900'
              }`}
            >
              <img
                src={track.coverUrl || '/no-image.jpg'}
                className="w-full h-44 object-cover rounded mb-3"
              />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{track.title}</p>
                  <p className="text-sm text-gray-400 truncate">
                    {track.artist?.username || 'Unknown Artist'}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeTrack(track._id)
                  }}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-2 py-1 rounded"
                  title="Remove from playlist"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
