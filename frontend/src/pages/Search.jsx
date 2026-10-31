import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, Music } from 'lucide-react'
import TrackList from '../components/TrackList'
import Pagination from '../components/Pagination'

const LIMIT = 10
const DEBOUNCE_MS = 300

/**
 * Resonance Design System — Listener Search Surface (<Search />)
 *
 * Conforms to DESIGN.md Section 5.3 & 6.1:
 * - Unified Search Architecture: Immediate local typing response with 300ms debounced URL synchronization.
 * - History Preservation: Uses { replace: true } on URL updates to prevent history thrashing.
 * - Results Presentation: Leverages unified <TrackList /> container.
 * - Typography & Tokens: Editorial headings, 3:1 verified control borders, and quiet empty states.
 */
export default function Search({ onPlay, currentTrack, isPlaying = false }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [inputVal, setInputVal] = useState(query)
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const debounceTimerRef = useRef(null)

  // Sync internal input value when URL parameter changes externally
  useEffect(() => {
    setInputVal(query)
    setPage(1)
  }, [query])

  // Fetch search results whenever query or page changes
  useEffect(() => {
    if (!query.trim()) {
      setTracks([])
      setTotalPages(1)
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
      } catch {
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

  // Handle immediate input with debounced URL replacement (DESIGN.md Section 5.3)
  const handleInputChange = (e) => {
    const val = e.target.value
    setInputVal(val)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      if (val.trim()) {
        setSearchParams({ q: val.trim() }, { replace: true })
      } else {
        setSearchParams({}, { replace: true })
      }
    }, DEBOUNCE_MS)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    if (inputVal.trim()) {
      setSearchParams({ q: inputVal.trim() }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  return (
    <div className="flex-1 bg-canvas-base text-text-primary p-4 sm:p-6 overflow-y-auto">
      {/* Primary Search Input Box */}
      <div className="max-w-2xl mb-6">
        <form onSubmit={handleSearchSubmit} className="relative">
          <SearchIcon className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by track title, artist, or genre…"
            value={inputVal}
            onChange={handleInputChange}
            aria-label="Search tracks"
            className="w-full pl-10 pr-4 py-2.5 rounded-sm bg-surface-raised border border-border-control text-sm text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:border-border-focus focus-visible:ring-1 focus-visible:ring-border-focus transition shadow-sm"
          />
        </form>
      </div>

      {/* Query Status Heading */}
      {query ? (
        <div className="mb-4">
          <h1 className="font-serif text-lg sm:text-xl font-normal text-text-primary">
            Search results for &ldquo;<span className="text-accent-text">{query}</span>&rdquo;
          </h1>
          <p className="text-xs text-text-tertiary font-mono tabular-nums mt-0.5">
            {tracks.length} {tracks.length === 1 ? 'recording' : 'recordings'} found
          </p>
        </div>
      ) : null}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
          {[...Array(LIMIT)].map((_, i) => (
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

      {/* Empty States */}
      {!loading && !query && (
        <div className="py-20 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-surface-raised border border-border-rule flex items-center justify-center mx-auto mb-3 text-text-tertiary">
            <SearchIcon className="w-5 h-5 text-accent-text" />
          </div>
          <h2 className="font-serif text-lg text-text-primary font-normal mb-1">
            Search Resonance Archives
          </h2>
          <p className="text-xs text-text-tertiary font-sans">
            Discover master audio releases, emerging artist catalogs, and curated collections.
          </p>
        </div>
      )}

      {!loading && query && tracks.length === 0 && (
        <div className="py-20 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-surface-raised border border-border-rule flex items-center justify-center mx-auto mb-3 text-text-tertiary">
            <Music className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-base text-text-primary font-normal mb-1">
            No releases match your query
          </h2>
          <p className="text-xs text-text-tertiary font-sans">
            Verify spelling or try searching by title, artist, or genre tag.
          </p>
        </div>
      )}

      {/* Results Presentation via TrackList */}
      {!loading && tracks.length > 0 && (
        <>
          <TrackList
            tracks={tracks}
            onPlay={onPlay}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
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
