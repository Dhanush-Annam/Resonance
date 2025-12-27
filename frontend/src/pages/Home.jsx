import { useEffect, useState } from 'react'
import Header from '../components/Header'
import TrackList from '../components/TrackList'

export default function Home({ onPlay }) {
  const [tracks, setTracks] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)

      const endpoint = searchTerm
        ? `/api/tracks/search?q=${encodeURIComponent(searchTerm)}`
        : `/api/tracks/public`

      fetch(`${import.meta.env.VITE_API_URL}${endpoint}`)
        .then(res => res.json())
        .then(data => {
          setTracks(data.results ?? data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }, 1000) // 1 second debounce

    return () => clearTimeout(timer)
  }, [searchTerm])

  return (
    <div className="flex-1 bg-zinc-900 text-white overflow-y-auto">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {loading && (
        <p className="text-gray-400 p-4">Searching...</p>
      )}

      {!loading && tracks.length === 0 && (
        <p className="text-gray-400 p-4">
          No tracks found
        </p>
      )}

      <TrackList tracks={tracks} onPlay={onPlay} />
    </div>
  )
}
