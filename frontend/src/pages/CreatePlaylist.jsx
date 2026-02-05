import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CreatePlaylist({ onCreated }) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Playlist name is required')
      return
    }

    const token = sessionStorage.getItem('token')
    if (!token) {
      setError('You must be logged in')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.message || 'Failed to create playlist')
        return
      }

      if (typeof onCreated === 'function') {
        await onCreated()
      }

      navigate('/library')
    } catch (err) {
      console.error(err)
      setError('Failed to create playlist')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 bg-black text-white p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">➕ Create Playlist</h1>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded bg-zinc-900 text-white outline-none focus:ring-2 focus:ring-zinc-700"
            placeholder="My Playlist"
            maxLength={100}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded bg-zinc-200 text-black hover:bg-white disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/library')}
            className="px-4 py-2 rounded bg-zinc-900 text-white hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
