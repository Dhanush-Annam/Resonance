import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const [tracks, setTracks] = useState([])

  const fetchPending = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/tracks/pending`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
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
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    )
    fetchPending()
  }

  const reject = async (id) => {
    await fetch(
      `${import.meta.env.VITE_API_URL}/api/tracks/${id}/reject`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    )
    fetchPending()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pending Tracks</h1>

      <div className="grid grid-cols-2 gap-4">
        {tracks.map(t => (
          <div key={t._id} className="bg-zinc-800 p-4 rounded">
            {t.coverUrl && (
              <img src={t.coverUrl} className="h-40 w-full object-cover rounded" />
            )}

            <h3 className="mt-2 font-semibold">{t.title}</h3>
            <p className="text-sm text-gray-400">{t.genre}</p>

            {t.audioUrl && (
              <audio controls className="w-full mt-2">
                <source src={t.audioUrl} />
              </audio>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => approve(t._id)}
                className="bg-green-600 px-3 py-1 rounded"
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
