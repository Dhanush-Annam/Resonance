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
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    )
    const data = await res.json()
    setTracks(data)
  }

  useEffect(() => {
    fetchTracks()
  }, [])

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tracks.map(track => (
          <ArtistTrackCard
            key={track._id}
            track={track}
            onUpdated={fetchTracks}
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
