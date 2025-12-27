import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminCreateTrack() {
  const [trackId, setTrackId] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  const createTrack = async (e) => {
    e.preventDefault()

    const title = e.target.title.value
    const genre = e.target.genre.value
    const token = localStorage.getItem('token')

    if (!title || !genre) {
      alert('Title and genre are required')
      return
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tracks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, genre }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create track')
      }

      setTrackId(data._id)
    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Admin Add Track</h1>

      <form onSubmit={createTrack} className="space-y-4">
        <input
          name="title"
          placeholder="Title"
          className="w-full p-2 bg-zinc-800"
        />
        <input
          name="genre"
          placeholder="Genre"
          className="w-full p-2 bg-zinc-800"
        />
        <button className="bg-green-600 px-4 py-2 rounded">
          Create
        </button>
      </form>

      {trackId && (
        <p className="mt-4 text-green-400">
          Track created. Upload cover & audio from Admin Dashboard.
        </p>
      )}
    </div>
  )
}
