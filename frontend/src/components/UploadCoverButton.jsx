import { useState } from 'react'

export default function UploadCoverButton({ track, onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setSuccess(false)
    setError('')

    const formData = new FormData()
    formData.append('cover', file)

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tracks/${track._id}/cover`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Cover upload failed')
      } else {
        setSuccess(true)
        onUploaded()
      }
    } catch {
      setError('Cover upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (track.status === 'approved') {
    return (
      <p className="text-xs text-gray-400 mt-2">
        ✔ Cover uploaded • 🔒 Locked
      </p>
    )
  }

  return (
    <div className="mt-2">
      {success && (
        <p className="text-xs text-green-400 mb-1">
          ✔ Cover uploaded
        </p>
      )}

      {error && (
        <p className="text-xs text-red-400 mb-1">
          {error}
        </p>
      )}

      <label className="cursor-pointer text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded inline-block">
        {uploading
          ? 'Uploading...'
          : track.coverUrl
          ? 'Re-upload Cover'
          : 'Upload Cover'}
        <input
          type="file"
          accept="image/*"
          hidden
          disabled={uploading}
          onChange={handleUpload}
        />
      </label>
    </div>
  )
}
