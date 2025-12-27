import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import TrackCard from '../components/TrackCard'

export default function Search({ onPlay, currentTrack }) {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setTracks([])
      return
    }

    const fetchResults = async () => {
      setLoading(true)

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tracks/search?q=${encodeURIComponent(query)}`
      )
      const data = await res.json()
      setTracks(Array.isArray(data.results) ? data.results : [])
      setLoading(false)
    }

    fetchResults()
  }, [query])

  return (
    <div className="flex-1 bg-zinc-900 text-white p-6 overflow-y-auto">
      <h1 className="text-xl font-semibold mb-4">
        Search results for “{query}”
      </h1>

      {loading && <p className="text-gray-400">Searching...</p>}

      {!loading && tracks.length === 0 && (
        <p className="text-gray-400">No results found</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tracks.map(track => (
          <TrackCard
            key={track._id}
            track={track}
            onPlay={onPlay}
            currentTrack={currentTrack}
          />
        ))}
      </div>
    </div>
  )
}
