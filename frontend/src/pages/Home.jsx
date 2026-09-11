import { useEffect, useState } from 'react'
import { Sparkles, Music } from 'lucide-react'
import TrackList from '../components/TrackList'
import Pagination from '../components/Pagination'

const LIMIT = 10
const SEARCH_DEBOUNCE_MS = 300

export default function Home({ onPlay, currentTrack, isPlaying = false }) {
  const [tracks, setTracks] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const role = sessionStorage.getItem('role')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const handleAdminDelete = async (id) => {
    if (!confirm('Admin: Delete this track permanently?')) return

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/tracks/${id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        },
      }
    )

    if (res.ok) {
      setTracks((prev) => prev.filter((track) => track._id !== id))
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    const fetchTracks = async () => {
      setLoading(true)

      const endpoint = searchTerm
        ? `/api/tracks/search?q=${encodeURIComponent(searchTerm)}&page=${page}&limit=${LIMIT}`
        : `/api/tracks/public?page=${page}&limit=${LIMIT}`

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
          signal: controller.signal,
        })
        const data = await res.json()

        if (!active) return

        if (searchTerm) {
          setTracks(Array.isArray(data?.results) ? data.results : [])
          setTotalPages(Number.isFinite(data?.totalPages) ? data.totalPages : 1)
        } else {
          setTracks(Array.isArray(data) ? data : [])
          setTotalPages(1)
        }
      } catch (err) {
        if (!active) return
      } finally {
        if (active) setLoading(false)
      }
    }

    if (!searchTerm) {
      fetchTracks()
      return () => {
        active = false
        controller.abort()
      }
    }

    const timer = setTimeout(fetchTracks, SEARCH_DEBOUNCE_MS)
    return () => {
      active = false
      clearTimeout(timer)
      controller.abort()
    }
  }, [searchTerm, page])

  useEffect(() => {
    setPage(1)
  }, [searchTerm])

  return (
    <div className="flex-1 bg-zinc-950 text-white overflow-y-auto">
      {/* Hero Welcome Banner */}
      <div className="px-4 sm:px-6 pt-6 pb-2">
        <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8 bg-linear-to-r from-emerald-950/40 via-zinc-900 to-zinc-900/60 border border-zinc-800/80 shadow-2xl">
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Curated Streaming
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              Sound in Full Resonance
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Explore lossless tracks, synchronized real-time lyrics, and seamless cloud playback.
            </p>
          </div>
          {/* Subtle Ambient Glow */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      </div>

      {/* Track Section Title */}
      <div className="px-4 sm:px-6 pt-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Popular Releases
          </h2>
          <p className="text-xs text-zinc-400">Trending soundscapes ready for your queue</p>
        </div>
      </div>

      {/* Loading Skeleton Placeholders */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 p-4 sm:p-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 animate-pulse"
            >
              <div className="w-full aspect-square bg-zinc-800 rounded-lg mb-3" />
              <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
              <div className="h-3 bg-zinc-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && tracks.length === 0 && (
        <div className="py-20 text-center max-w-sm mx-auto">
          <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
            <Music className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-zinc-300 mb-1">No tracks found</p>
          <p className="text-xs text-zinc-500">Check back later for new releases or try searching.</p>
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
            onDelete={handleAdminDelete}
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
    </div>
  )
}
