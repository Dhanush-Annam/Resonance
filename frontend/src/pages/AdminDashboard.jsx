import { useEffect, useState } from 'react'
import UploadCoverButton from '../components/UploadCoverButton'
import UploadAudioButton from '../components/UploadAudioButton'

export default function AdminDashboard() {
  const [tracks, setTracks] = useState([])

  const fetchPending = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/tracks/pending`,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        },
      }
    )
    setTracks(await res.json())
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const approve = async (id) => {
    await fetch(
      `${import.meta.env.VITE_API_URL}/api/tracks/${id}/approve`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        },
      }
    )
    fetchPending()
  }

  const reject = async (id) => {
    const reason = prompt('Enter rejection reason (optional):')

    await fetch(
      `${import.meta.env.VITE_API_URL}/api/tracks/${id}/reject`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      }
    )

    fetchPending()
  }

  return (
    <div className="p-6">
      {tracks.length === 0 && (
        <p className="text-gray-400 mt-4">
          No pending tracks 🎉
        </p>
      )}

      <h1 className="text-2xl font-bold mb-4">Pending Tracks</h1>

      <div className="grid grid-cols-2 gap-4">
        {tracks.map((t) => (
          <div key={t._id} className="bg-zinc-800 p-4 rounded">
            {/* COVER */}
            {t.coverUrl ? (
              <img
                key={t._id + t.coverUrl}
                src={t.coverUrl}
                className="h-40 w-full object-cover rounded"
              />
            ) : (
              <UploadCoverButton track={t} onUploaded={fetchPending} />
            )}

            <h3 className="mt-2 font-semibold">{t.title}</h3>
            <p className="text-sm text-gray-400">{t.genre}</p>

            {/* AUDIO */}
            {t.audioUrl ? (
              <audio
                key={t._id + t.audioUrl}
                controls
                className="w-full mt-2"
              >
                <source src={t.audioUrl} />
              </audio>
            ) : (
              <UploadAudioButton track={t} onUploaded={fetchPending} />
            )}


            {/* ACTIONS */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => approve(t._id)}
                disabled={!t.audioUrl}
                className={`px-3 py-1 rounded ${t.audioUrl
                  ? 'bg-green-600'
                  : 'bg-gray-600 cursor-not-allowed'
                  }`}
              >
                Approve
              </button>

              <button
                onClick={() => reject(t._id)}
                className="bg-red-600 px-3 py-1 rounded"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
