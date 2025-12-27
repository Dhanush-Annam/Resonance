import { useState } from 'react'

export default function CreateTrackModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    await fetch(
      `${import.meta.env.VITE_API_URL}/api/tracks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ title, genre }),
      }
    )

    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 p-6 rounded-lg w-96"
      >
        <h2 className="text-xl mb-4">Create Track</h2>

        <input
          placeholder="Title"
          className="w-full mb-3 p-2 bg-zinc-800 rounded"
          onChange={e => setTitle(e.target.value)}
        />

        <input
          placeholder="Genre"
          className="w-full mb-4 p-2 bg-zinc-800 rounded"
          onChange={e => setGenre(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="bg-green-600 px-4 py-2 rounded">
            Create
          </button>
        </div>
      </form>
    </div>
  )
}
