import { useState, useRef } from 'react'
import { Image, Check, AlertCircle } from 'lucide-react'
import Button from './Button'

/**
 * Resonance Design System — Upload Cover Button (<UploadCoverButton />)
 *
 * Conforms to DESIGN.md Section 4.1 & Phase 6 Specifications:
 * - Uses <Button /> primitive with keyboard accessibility
 * - Zero native browser alerts; contained status banners
 * - Three-tier failure classification with bounded polling reconciliation on ambiguous outcomes
 * - Does not enable retry until remote state has been verified across bounded polls
 * - Locks permanently when track.status === 'approved'
 */
export default function UploadCoverButton({ track, onUploaded, className = '' }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Trigger hidden file input
  const handleButtonClick = () => {
    if (uploading || isVerifying || track.status === 'approved') return
    setErrorMessage('')
    setSuccessMessage('')
    fileInputRef.current?.click()
  }

  // Bounded Polling Verification against GET /api/tracks/my
  const verifyRemoteCoverState = async (trackId, token) => {
    const pollDelays = [500, 1500, 2500]
    let completedAtLeastOneSuccessfulCheck = false

    for (let i = 0; i < pollDelays.length; i++) {
      await new Promise((r) => setTimeout(r, pollDelays[i]))
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tracks/my`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.ok) {
          completedAtLeastOneSuccessfulCheck = true
          const tracks = await res.json()
          const remoteTrack = Array.isArray(tracks) ? tracks.find((t) => t._id === trackId) : null
          if (remoteTrack?.coverUrl) {
            return { verified: true, attached: true }
          }
        }
      } catch (pollErr) {
        console.warn('Cover verification poll error:', pollErr)
      }
    }

    if (completedAtLeastOneSuccessfulCheck) {
      return { verified: true, attached: false }
    }
    return { verified: false, attached: false }
  }

  // Handle Cover Image Ingestion
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    // Tier 1: Client-Side Validation
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Selected file must be a valid image (JPEG, PNG, WebP).')
      return
    }

    setUploading(true)
    setErrorMessage('')
    setSuccessMessage('')

    const formData = new FormData()
    formData.append('cover', file)

    const token = sessionStorage.getItem('token')

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tracks/${track._id}/cover`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      )

      // Tier 2: Deterministic Server Rejection (HTTP 4xx)
      if (res.status >= 400 && res.status < 500) {
        const errorData = await res.json().catch(() => null)
        setErrorMessage(errorData?.message || 'Artwork upload rejected by server.')
        return
      }

      // Tier 3: Ambiguous Server Error (HTTP 5xx)
      if (res.status >= 500) {
        setIsVerifying(true)
        const { verified, attached } = await verifyRemoteCoverState(track._id, token)
        setIsVerifying(false)

        if (attached) {
          setSuccessMessage('Artwork verified and attached.')
          onUploaded?.()
          return
        }

        if (verified) {
          setErrorMessage('Server error during artwork upload. Asset absent in archive; safe to retry.')
        } else {
          setErrorMessage('Remote artwork state remains uncertain. Please re-verify archive status before retrying.')
        }
        return
      }

      // Success (HTTP 2xx)
      setSuccessMessage('Cover artwork attached successfully.')
      onUploaded?.()
    } catch (err) {
      // Tier 3: Ambiguous Network Disconnect / Abort
      console.warn('Cover upload network exception:', err)
      setIsVerifying(true)
      const { verified, attached } = await verifyRemoteCoverState(track._id, token)
      setIsVerifying(false)

      if (attached) {
        setSuccessMessage('Artwork verified and attached.')
        onUploaded?.()
      } else if (verified) {
        setErrorMessage('Network interruption during artwork upload. Asset absent in archive; safe to retry.')
      } else {
        setErrorMessage('Remote artwork state remains uncertain. Please check connection and refresh catalog.')
      }
    } finally {
      setUploading(false)
      setIsVerifying(false)
    }
  }

  // Locked State for Approved Tracks
  if (track.status === 'approved') {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-text-tertiary select-none ${className}`}>
        <span className="font-mono text-[10px] uppercase tracking-wider text-status-approved-fg">
          Artwork Attached
        </span>
        <span>•</span>
        <span className="text-[11px] font-sans">Locked</span>
      </div>
    )
  }

  const hasCover = Boolean(track.coverUrl)

  return (
    <div className={`space-y-1.5 ${className}`.trim()}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        tabIndex={-1}
        className="hidden"
        disabled={uploading || isVerifying}
        onChange={handleFileChange}
      />

      <Button
        type="button"
        variant="secondary"
        size="sm"
        isLoading={uploading || isVerifying}
        leftIcon={<Image className="w-3.5 h-3.5 text-text-secondary" />}
        onClick={handleButtonClick}
        className="w-full text-xs"
      >
        {isVerifying
          ? 'Verifying Artwork...'
          : uploading
          ? 'Attaching Artwork...'
          : hasCover
          ? 'Replace Cover Artwork'
          : 'Upload Cover Artwork'}
      </Button>

      {/* Contained Non-Native Status Banners */}
      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-1.5 p-1.5 rounded-xs bg-status-approved-bg border border-status-approved-bd text-status-approved-fg text-xs font-sans"
        >
          <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-1.5 p-1.5 rounded-xs bg-status-rejected-bg border border-status-rejected-bd text-status-rejected-fg text-xs font-sans"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}
