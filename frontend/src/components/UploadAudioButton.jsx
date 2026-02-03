import { useState } from 'react'

export default function UploadAudioButton({ track, onUploaded }) {
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
    formData.append('audio', file)

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tracks/${track._id}/audio`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          },
          body: formData,
        }
      )

      if (!res.ok) {
        const text = await res.text()
        console.error(text)
        setError('Audio upload failed')
        return
      }

      // ✅ SUCCESS
      setSuccess(true)
      setError('')
      onUploaded && onUploaded() // 🔥 refresh parent state

    } catch (err) {
      console.error(err)
      setError('Audio upload failed')
    } finally {
      setUploading(false)
    }
  }

  // Approved → locked
  if (track.status === 'approved') {
    return (
      <p className="text-sm text-gray-400 mt-2">
        ✔ Audio uploaded • 🔒 Locked
      </p>
    )
  }

  return (
    <div className="mt-2">
      {success && (
        <p className="text-sm text-green-400 mb-1">
          ✔ Audio uploaded successfully
        </p>
      )}

      {error && (
        <p className="text-sm text-red-400 mb-1">
          {error}
        </p>
      )}

      <label className="cursor-pointer text-sm bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded inline-block">
        {uploading
          ? 'Uploading...'
          : track.audioUrl
          ? 'Re-upload Audio'
          : 'Upload Audio'}
        <input
          type="file"
          accept="audio/*"
          hidden
          disabled={uploading}
          onChange={handleUpload}
        />
      </label>
    </div>
  )
}


