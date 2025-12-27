import { useEffect, useState } from 'react'
// import Header from '../components/Header'
import TrackList from '../components/TrackList'
import Pagination from '../components/Pagination'

const LIMIT = 6

export default function Home({ onPlay, currentTrack }) {
  const [tracks, setTracks] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const role = localStorage.getItem('role')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const handleAdminDelete = async (id) => {
    if (!confirm('Admin: Delete this track permanently?')) return

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/tracks/${id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    )

    if (res.ok) {
      setTracks(prev => prev.filter(track => track._id !== id))
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)

      const endpoint = searchTerm
        ? `/api/tracks/search?q=${encodeURIComponent(searchTerm)}&page=${page}&limit=${LIMIT}`
        : `/api/tracks/public?page=${page}&limit=${LIMIT}`

      fetch(`${import.meta.env.VITE_API_URL}${endpoint}`)
        .then(res => res.json())
        .then(data => {
          if (searchTerm) {
            setTracks(data.results)
            setTotalPages(data.totalPages)
          } else {
            setTracks(data)
            setTotalPages(1)
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }, 1000) // 1 second debounce

    return () => clearTimeout(timer)
  }, [searchTerm, page])

  useEffect(() => {
    setPage(1)
  }, [searchTerm])

  return (
    <div className="flex-1 bg-zinc-900 text-white overflow-y-auto">
      {/* <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      /> */}

      {loading && (
        <p className="text-gray-400 p-4">Searching...</p>
      )}

      {!loading && tracks.length === 0 && (
        <p className="text-gray-400 p-4">
          No tracks found
        </p>
      )}

      <TrackList
        tracks={tracks}
        onPlay={onPlay}
        currentTrack={currentTrack}
        onDelete={handleAdminDelete}
        role={role}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage(p => Math.max(1, p - 1))}
        onNext={() => setPage(p => Math.min(totalPages, p + 1))}
      />

    </div>
  )
}
