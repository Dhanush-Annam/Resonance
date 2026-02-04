import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import TrackCard from '../components/TrackCard'
import Pagination from '../components/Pagination'

export default function Search({ onPlay, currentTrack }) {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const LIMIT = 4

  useEffect(() => {
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

      try{

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tracks/search`+
        `?q=${encodeURIComponent(query)}`+
        `&page=${page}`+
        `&limit=${LIMIT}`
      )
      const data = await res.json()
      if(!cancelled){
      setTracks(Array.isArray(data.results) ? data.results : [])
      setTotalPages(data.totalPages || 1)
      }
    }
    catch(err) {
      if(!cancelled){
        setTracks([])
        setTotalPages(1)
      }
    }
    finally {
      if(!cancelled){
        setLoading(false)
      }
    }
    }
    fetchResults()
    return () => {
      cancelled=true;
    }
  }, [query , page])

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

      <Pagination
        page={page}
        totalPages={totalPages}
        onPrev={()=> setPage(p=>p-1)}
        onNext={()=> setPage(p=>p+1)}
      />
    </div>
  )
}
