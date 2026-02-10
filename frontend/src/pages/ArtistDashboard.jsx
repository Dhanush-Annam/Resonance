import { useEffect, useState } from 'react'
import ArtistTrackCard from '../components/ArtistTrackCard'
import CreateTrackModal from '../components/CreateTrackModal'

export default function ArtistDashboard() {
  const [tracks, setTracks] = useState([])
  const [showModal, setShowModal] = useState(false)

  const fetchTracks = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/tracks/my`,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        },
      }
    )
    const data = await res.json()
    setTracks(data)
  }

  useEffect(() => {
    fetchTracks()
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this track?')) return

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

      setTracks(prev => prev.filter(track => track._id !== id))
    } else {
      alert('Delete failed')
    }
  }


  return (
    <div className="flex-1 bg-zinc-900 text-white p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🎤 Your Tracks</h1>

        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded"
        >
          + Create Track
        </button>
      </div>

      {tracks.length === 0 && (
        <p className="text-gray-400">No tracks yet</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tracks.map(track => (
          <ArtistTrackCard
            key={track._id}
            track={track}
            onUpdated={fetchTracks}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {showModal && (
        <CreateTrackModal
          onClose={() => setShowModal(false)}
          onCreated={fetchTracks}
        />
      )}
    </div>
  )
}
