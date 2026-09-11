import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, Music } from 'lucide-react'
import TrackCard from '../components/TrackCard'
import Pagination from '../components/Pagination'

export default function Search({ onPlay, currentTrack, isPlaying = false }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [inputVal, setInputVal] = useState(query)
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const LIMIT = 8

  useEffect(() => {
    setInputVal(query)
    setPage(1)
  }, [query])

  useEffect(() => {
    if (!query.trim()) {
      setTracks([])
      return
    }
    let cancelled = false

    const fetchResults = async () => {
      setLoading(true)

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/tracks/search?q=${encodeURIComponent(query)}&page=${page}&limit=${LIMIT}`
        )
        const data = await res.json()
        if (!cancelled) {
          setTracks(Array.isArray(data.results) ? data.results : [])
          setTotalPages(data.totalPages || 1)
        }
      } catch (err) {
        if (!cancelled) {
          setTracks([])
          setTotalPages(1)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchResults()
    return () => {
      cancelled = true
    }
  }, [query, page])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (inputVal.trim()) {
      setSearchParams({ q: inputVal.trim() })
    }
  }

  return (
    <div className="flex-1 bg-zinc-950 text-white p-4 sm:p-6 overflow-y-auto">
      {/* Search Input Box */}
      <div className="max-w-2xl mb-6">
        <form onSubmit={handleSearchSubmit} className="relative">
          <SearchIcon className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by track title, artist, or genre..."
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value)
              setSearchParams({ q: e.target.value })
            }}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition shadow-lg"
          />
        </form>
      </div>

      {/* Heading / State Header */}
      {query ? (
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-zinc-200">
          Search results for &ldquo;<span className="text-emerald-400">{query}</span>&rdquo;
        </h2>
      ) : null}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(LIMIT)].map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 animate-pulse">
              <div className="w-full aspect-square bg-zinc-800 rounded-lg mb-3" />
              <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
              <div className="h-3 bg-zinc-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty States */}
      {!loading && !query && (
        <div className="py-20 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4 text-zinc-400">
            <SearchIcon className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-200 mb-1">Search Resonance</h3>
          <p className="text-xs sm:text-sm text-zinc-400">
            Discover your favorite songs, emerging artists, and curated playlists.
          </p>
        </div>
      )}

      {!loading && query && tracks.length === 0 && (
        <div className="py-16 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
            <Music className="w-6 h-6 text-zinc-500" />
          </div>
          <h3 className="text-base font-semibold text-zinc-200 mb-1">No results found</h3>
          <p className="text-xs sm:text-sm text-zinc-400">
            Please make sure words are spelled correctly or try searching for a different keyword.
          </p>
        </div>
      )}

      {/* Results Grid */}
      {!loading && tracks.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {tracks.map((track, index) => (
              <TrackCard
                key={track._id}
                track={track}
                onPlay={() => onPlay(tracks, index)}
                isActive={currentTrack?._id === track._id}
                isPlaying={currentTrack?._id === track._id && isPlaying}
                priority={index === 0}
              />
            ))}
          </div>

          <div className="mt-8">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </div>
        </>
      )}
    </div>
  )
}
