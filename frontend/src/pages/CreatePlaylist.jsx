import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListMusic, ChevronLeft } from 'lucide-react'
import Input from '../components/Input'
import Button from '../components/Button'

/**
 * Resonance Design System — Create Playlist Surface (<CreatePlaylist />)
 *
 * Conforms to DESIGN.md Section 4 & 6.1:
 * - Uses shared Input and Button primitives.
 * - Instrument Serif editorial heading without decorative emoji tropes.
 * - Contained surface card with mathematically verified 3:1 control boundaries.
 */
export default function CreatePlaylist({ onCreated }) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

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
    <div className="flex-1 bg-canvas-base text-text-primary p-4 sm:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-surface-elevated border border-border-rule flex items-center justify-center text-accent-text shrink-0">
            <ListMusic className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight">
              Create Playlist
            </h1>
            <p className="text-xs text-text-secondary font-sans mt-0.5">
              Curate a custom release collection for your personal library
            </p>
          </div>
        </div>

        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/library')}
            leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
          >
            Library
          </Button>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-md bg-surface-raised border border-border-rule rounded-lg p-5 sm:p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Playlist Title"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError('')
            }}
            placeholder="e.g. Midnight Archival Mix"
            maxLength={100}
            error={error}
            autoFocus
          />

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => navigate('/library')}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting}
              isLoading={submitting}
            >
              Create Playlist
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
