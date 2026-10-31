import { useState, useRef, useEffect } from 'react'
import { Music, Image, AlertCircle, CheckCircle2, RefreshCw, X, ArrowRight, ShieldAlert } from 'lucide-react'
import Modal from './Modal'
import Input from './Input'
import Button from './Button'
import {
  getUnresolvedSubmission,
  setUnresolvedSubmission,
  clearUnresolvedSubmission,
  formatUnresolvedAge,
} from '../utils/unresolvedSubmissions'

/**
 * Resonance Design System — Release Ingestion Sheet (<CreateTrackModal />)
 *
 * Conforms to DESIGN.md Section 6.2 & Phase 6 Hardened Ingestion Architecture:
 * - 3-Step Ingestion Workflow: Release Details, Audio Master, Cover Artwork
 * - Focus-trapped, accessible dialog using <Modal /> primitive
 * - State machine retaining trackId across partial failures (no duplicate records)
 * - Three-tier failure classification with bounded reconciliation on ambiguous outcomes
 * - Explicit "Submission Status Unknown" state: blocks new metadata creation while unresolved
 * - Bounded polling verification for remote audio and cover upload state
 * - Clears unresolved protection strictly when positive server identity is confirmed
 */
export default function CreateTrackModal({ onClose, onCreated }) {
  // Form Inputs
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null)

  // Track & Ingestion State Machine
  const [trackId, setTrackId] = useState(null)
  const [activeStep, setActiveStep] = useState('idle') // 'idle' | 'creating_metadata' | 'uploading_audio' | 'uploading_cover' | 'complete' | 'reconciling' | 'unresolved' | 'error'
  const [stepStatuses, setStepStatuses] = useState({
    metadata: 'unstarted', // 'unstarted' | 'in_progress' | 'succeeded' | 'failed'
    audio: 'unstarted',
    cover: 'unstarted',
  })
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [unresolvedTimestamp, setUnresolvedTimestamp] = useState(null)

  // Request timestamp ref for reconciliation
  const postDispatchedAtRef = useRef(0)
  const abortControllerRef = useRef(null)

  // On mount: restore unresolved submission if present in persistent client storage
  useEffect(() => {
    const unresolved = getUnresolvedSubmission()
    if (unresolved && !trackId) {
      setTitle(unresolved.title)
      setGenre(unresolved.genre)
      postDispatchedAtRef.current = unresolved.dispatchedAt
      setUnresolvedTimestamp(unresolved.timestamp)
      setActiveStep('unresolved')
    }
  }, [trackId])

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl)
      }
    }
  }, [coverPreviewUrl])

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      abortControllerRef.current?.abort()
    }
  }, [])

  // Handle Cover File Selection & Preview
  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Cover file must be an image (JPEG, PNG, or WebP).')
      return
    }

    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl)
    }

    setCoverFile(file)
    setCoverPreviewUrl(URL.createObjectURL(file))
    setErrorMessage('')
  }

  // Handle Audio File Selection
  const handleAudioSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('audio/') && !/\.(mp3|wav|flac|m4a|aac|ogg)$/i.test(file.name)) {
      setErrorMessage('Audio file must be a supported audio recording format.')
      return
    }

    setAudioFile(file)
    setErrorMessage('')
  }

  // Bounded Polling Verification against GET /api/tracks/my
  const reconcileMetadataOutcome = async () => {
    setActiveStep('reconciling')
    setErrorMessage('')

    const token = sessionStorage.getItem('token')
    const pollDelays = [500, 2000, 3500]

    for (let i = 0; i < pollDelays.length; i++) {
      await new Promise((r) => setTimeout(r, pollDelays[i]))

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tracks/my`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.ok) {
          const tracks = await res.json()
          if (Array.isArray(tracks)) {
            // Find records matching exact title & genre created after the dispatch timestamp
            const candidateMatches = tracks.filter((t) => {
              const matchesTitle = t.title?.trim().toLowerCase() === title.trim().toLowerCase()
              const matchesGenre = t.genre?.trim().toLowerCase() === genre.trim().toLowerCase()
              const createdAtTime = new Date(t.createdAt).getTime()
              const isAfterDispatch = createdAtTime >= postDispatchedAtRef.current - 5000 // 5s clock skew buffer
              const isWithinWindow = createdAtTime <= postDispatchedAtRef.current + 180000 // 3-minute creation window
              const assetsEmpty = !t.audioUrl && !t.coverUrl
              return matchesTitle && matchesGenre && isAfterDispatch && isWithinWindow && assetsEmpty
            })

            // Strict high-confidence match: exactly 1 new record
            if (candidateMatches.length === 1) {
              const matched = candidateMatches[0]
              clearUnresolvedSubmission()
              setTrackId(matched._id)
              setStepStatuses((prev) => ({ ...prev, metadata: 'succeeded' }))
              if (matched.audioUrl) {
                setStepStatuses((prev) => ({ ...prev, audio: 'succeeded' }))
              }
              if (matched.coverUrl) {
                setStepStatuses((prev) => ({ ...prev, cover: 'succeeded' }))
              }

              // Advance to next uncompleted step
              if (!matched.audioUrl && audioFile) {
                await uploadAudioStep(matched._id)
              } else if (!matched.coverUrl && coverFile) {
                await uploadCoverStep(matched._id)
              } else {
                setActiveStep('complete')
                onCreated?.()
              }
              return
            }
          }
        }
      } catch (err) {
        console.warn('Reconciliation poll error:', err)
      }
    }

    // Outcome could not be established with high confidence: persist unresolved state
    setUnresolvedSubmission({ title, genre, dispatchedAt: postDispatchedAtRef.current })
    setUnresolvedTimestamp(Date.now())
    setActiveStep('unresolved')
  }

  // Bounded Polling for Remote Asset Verification
  const verifyRemoteState = async (targetId, field) => {
    const token = sessionStorage.getItem('token')
    const pollDelays = [500, 1500, 2500]
    let completedCheck = false

    for (let i = 0; i < pollDelays.length; i++) {
      await new Promise((r) => setTimeout(r, pollDelays[i]))
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tracks/my`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          completedCheck = true
          const tracks = await res.json()
          const found = Array.isArray(tracks) ? tracks.find((t) => t._id === targetId) : null
          if (found?.[field]) {
            return { verified: true, attached: true }
          }
        }
      } catch (err) {
        console.warn('Asset verification poll error:', err)
      }
    }

    if (completedCheck) {
      return { verified: true, attached: false }
    }
    return { verified: false, attached: false }
  }

  // Upload Audio Step
  const uploadAudioStep = async (targetId) => {
    if (!audioFile) {
      setStepStatuses((prev) => ({ ...prev, audio: 'skipped' }))
      if (coverFile) {
        await uploadCoverStep(targetId)
      } else {
        setActiveStep('complete')
        onCreated?.()
      }
      return
    }

    setActiveStep('uploading_audio')
    setStepStatuses((prev) => ({ ...prev, audio: 'in_progress' }))
    setErrorMessage('')

    const formData = new FormData()
    formData.append('audio', audioFile)

    const token = sessionStorage.getItem('token')

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tracks/${targetId}/audio`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      )

      if (res.status >= 400 && res.status < 500) {
        const data = await res.json().catch(() => null)
        setStepStatuses((prev) => ({ ...prev, audio: 'failed' }))
        setActiveStep('error')
        setErrorMessage(data?.message || 'Audio upload rejected by server.')
        return
      }

      if (res.status >= 500) {
        const { verified, attached } = await verifyRemoteState(targetId, 'audioUrl')
        if (attached) {
          setStepStatuses((prev) => ({ ...prev, audio: 'succeeded' }))
          if (coverFile) {
            await uploadCoverStep(targetId)
          } else {
            setActiveStep('complete')
            onCreated?.()
          }
          return
        }
        setStepStatuses((prev) => ({ ...prev, audio: 'failed' }))
        setActiveStep('error')
        if (verified) {
          setErrorMessage('Server error during audio upload. Remote check verified asset is absent; safe to retry.')
        } else {
          setErrorMessage('Remote audio status remains uncertain. Please re-verify archive status before retrying.')
        }
        return
      }

      // Succeeded
      setStepStatuses((prev) => ({ ...prev, audio: 'succeeded' }))
      if (coverFile) {
        await uploadCoverStep(targetId)
      } else {
        setActiveStep('complete')
        onCreated?.()
      }
    } catch (err) {
      console.warn('Audio upload network exception:', err)
      const { verified, attached } = await verifyRemoteState(targetId, 'audioUrl')
      if (attached) {
        setStepStatuses((prev) => ({ ...prev, audio: 'succeeded' }))
        if (coverFile) {
          await uploadCoverStep(targetId)
        } else {
          setActiveStep('complete')
          onCreated?.()
        }
      } else {
        setStepStatuses((prev) => ({ ...prev, audio: 'failed' }))
        setActiveStep('error')
        if (verified) {
          setErrorMessage('Network interruption during audio upload. Remote check verified asset is absent; safe to retry.')
        } else {
          setErrorMessage('Remote audio status remains uncertain. Please check network connection before retrying.')
        }
      }
    }
  }

  // Upload Cover Step
  const uploadCoverStep = async (targetId) => {
    if (!coverFile) {
      setStepStatuses((prev) => ({ ...prev, cover: 'skipped' }))
      setActiveStep('complete')
      onCreated?.()
      return
    }

    setActiveStep('uploading_cover')
    setStepStatuses((prev) => ({ ...prev, cover: 'in_progress' }))
    setErrorMessage('')

    const formData = new FormData()
    formData.append('cover', coverFile)

    const token = sessionStorage.getItem('token')

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tracks/${targetId}/cover`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      )

      if (res.status >= 400 && res.status < 500) {
        const data = await res.json().catch(() => null)
        setStepStatuses((prev) => ({ ...prev, cover: 'failed' }))
        setActiveStep('error')
        setErrorMessage(data?.message || 'Artwork upload rejected by server.')
        return
      }

      if (res.status >= 500) {
        const { verified, attached } = await verifyRemoteState(targetId, 'coverUrl')
        if (attached) {
          setStepStatuses((prev) => ({ ...prev, cover: 'succeeded' }))
          setActiveStep('complete')
          onCreated?.()
          return
        }
        setStepStatuses((prev) => ({ ...prev, cover: 'failed' }))
        setActiveStep('error')
        if (verified) {
          setErrorMessage('Server error during cover artwork upload. Remote check verified asset is absent; safe to retry.')
        } else {
          setErrorMessage('Remote artwork status remains uncertain. Please re-verify archive status before retrying.')
        }
        return
      }

      // Succeeded
      setStepStatuses((prev) => ({ ...prev, cover: 'succeeded' }))
      setActiveStep('complete')
      onCreated?.()
    } catch (err) {
      console.warn('Cover upload network exception:', err)
      const { verified, attached } = await verifyRemoteState(targetId, 'coverUrl')
      if (attached) {
        setStepStatuses((prev) => ({ ...prev, cover: 'succeeded' }))
        setActiveStep('complete')
        onCreated?.()
      } else {
        setStepStatuses((prev) => ({ ...prev, cover: 'failed' }))
        setActiveStep('error')
        if (verified) {
          setErrorMessage('Network interruption during artwork upload. Remote check verified asset is absent; safe to retry.')
        } else {
          setErrorMessage('Remote artwork status remains uncertain. Please check connection before retrying.')
        }
      }
    }
  }

  // Primary Submission Trigger
  const handlePrimarySubmit = async (e) => {
    e?.preventDefault()

    // If metadata already succeeded, route straight to audio or cover retry
    if (trackId && stepStatuses.metadata === 'succeeded') {
      if (stepStatuses.audio === 'failed' || (audioFile && stepStatuses.audio === 'unstarted')) {
        await uploadAudioStep(trackId)
      } else if (stepStatuses.cover === 'failed' || (coverFile && stepStatuses.cover === 'unstarted')) {
        await uploadCoverStep(trackId)
      }
      return
    }

    // Client-side Validation (Tier 1)
    const errors = {}
    if (!title.trim()) errors.title = 'Release title is required.'
    if (!genre.trim()) errors.genre = 'Musical genre is required.'
    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) return

    setActiveStep('creating_metadata')
    setStepStatuses((prev) => ({ ...prev, metadata: 'in_progress' }))
    setErrorMessage('')
    postDispatchedAtRef.current = Date.now()

    const token = sessionStorage.getItem('token')

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: title.trim(), genre: genre.trim() }),
      })

      // Tier 2: Deterministic Server Rejection (HTTP 4xx)
      if (res.status >= 400 && res.status < 500) {
        const data = await res.json().catch(() => null)
        setStepStatuses((prev) => ({ ...prev, metadata: 'failed' }))
        setActiveStep('error')
        setErrorMessage(data?.message || data?.errors?.[0]?.msg || 'Metadata rejected by server.')
        return
      }

      // Tier 3: Ambiguous Server Error (HTTP 5xx)
      if (res.status >= 500) {
        await reconcileMetadataOutcome()
        return
      }

      // Success
      const data = await res.json()
      clearUnresolvedSubmission()
      const newTrackId = data.track?._id || data._id
      setTrackId(newTrackId)
      setStepStatuses((prev) => ({ ...prev, metadata: 'succeeded' }))

      // Inform parent so catalog refresh can begin
      onCreated?.()

      // Automatically chain audio upload if selected
      if (audioFile) {
        await uploadAudioStep(newTrackId)
      } else if (coverFile) {
        await uploadCoverStep(newTrackId)
      } else {
        setActiveStep('complete')
      }
    } catch (err) {
      // Tier 3: Network Interruption / Drop
      console.warn('Metadata POST network exception:', err)
      await reconcileMetadataOutcome()
    }
  }

  // Handle Close with In-flight / Incomplete Safeguards
  const handleModalClose = () => {
    if (trackId) {
      onCreated?.()
    }
    onClose()
  }

  const isFormLocked = Boolean(
    (trackId && stepStatuses.metadata === 'succeeded') || activeStep === 'unresolved'
  )
  const isProcessing =
    activeStep === 'creating_metadata' ||
    activeStep === 'uploading_audio' ||
    activeStep === 'uploading_cover' ||
    activeStep === 'reconciling'

  return (
    <Modal
      isOpen={true}
      onClose={handleModalClose}
      title="Ingest Release to Catalog"
      description="Register master metadata, upload lossless recording, and attach album artwork."
      cancelText={null}
    >
      <form onSubmit={handlePrimarySubmit} className="space-y-5">
        {/* Step Progress Tracker */}
        <div className="flex items-center justify-between border-b border-border-rule pb-3 text-xs font-mono select-none">
          {/* Step 1: Metadata */}
          <div className="flex items-center gap-1.5">
            {stepStatuses.metadata === 'succeeded' ? (
              <CheckCircle2 className="w-4 h-4 text-status-approved-fg" />
            ) : stepStatuses.metadata === 'failed' ? (
              <AlertCircle className="w-4 h-4 text-status-rejected-fg" />
            ) : stepStatuses.metadata === 'in_progress' ? (
              <RefreshCw className="w-4 h-4 text-text-primary animate-spin" />
            ) : (
              <span className="w-4 h-4 rounded-full border border-border-control flex items-center justify-center text-[10px]">
                1
              </span>
            )}
            <span
              className={
                stepStatuses.metadata === 'succeeded'
                  ? 'text-status-approved-fg'
                  : 'text-text-primary'
              }
            >
              Details
            </span>
          </div>

          <ArrowRight className="w-3 h-3 text-text-tertiary" />

          {/* Step 2: Audio */}
          <div className="flex items-center gap-1.5">
            {stepStatuses.audio === 'succeeded' ? (
              <CheckCircle2 className="w-4 h-4 text-status-approved-fg" />
            ) : stepStatuses.audio === 'failed' ? (
              <AlertCircle className="w-4 h-4 text-status-rejected-fg" />
            ) : stepStatuses.audio === 'in_progress' ? (
              <RefreshCw className="w-4 h-4 text-text-primary animate-spin" />
            ) : (
              <span className="w-4 h-4 rounded-full border border-border-control flex items-center justify-center text-[10px]">
                2
              </span>
            )}
            <span
              className={
                stepStatuses.audio === 'succeeded'
                  ? 'text-status-approved-fg'
                  : 'text-text-secondary'
              }
            >
              Audio Master
            </span>
          </div>

          <ArrowRight className="w-3 h-3 text-text-tertiary" />

          {/* Step 3: Artwork */}
          <div className="flex items-center gap-1.5">
            {stepStatuses.cover === 'succeeded' ? (
              <CheckCircle2 className="w-4 h-4 text-status-approved-fg" />
            ) : stepStatuses.cover === 'failed' ? (
              <AlertCircle className="w-4 h-4 text-status-rejected-fg" />
            ) : stepStatuses.cover === 'in_progress' ? (
              <RefreshCw className="w-4 h-4 text-text-primary animate-spin" />
            ) : (
              <span className="w-4 h-4 rounded-full border border-border-control flex items-center justify-center text-[10px]">
                3
              </span>
            )}
            <span
              className={
                stepStatuses.cover === 'succeeded'
                  ? 'text-status-approved-fg'
                  : 'text-text-secondary'
              }
            >
              Artwork
            </span>
          </div>
        </div>

        {/* Global Error Notice */}
        {errorMessage && activeStep !== 'unresolved' && (
          <div
            role="alert"
            className="flex items-start gap-2 p-2.5 rounded-sm bg-status-rejected-bg border border-status-rejected-bd text-status-rejected-fg text-xs font-sans"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium">Ingestion Notice</p>
              <p className="text-text-secondary mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Unresolved Outcome Banner: Blocks duplicate metadata creation */}
        {activeStep === 'unresolved' && (
          <div
            role="alert"
            className="p-3.5 rounded-sm bg-surface-raised border border-status-pending-bd space-y-2.5 text-xs font-sans"
          >
            <div className="flex items-center gap-2 text-status-pending-fg font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                Submission Status Unknown — Verification Required
                {unresolvedTimestamp ? ` (${formatUnresolvedAge(unresolvedTimestamp)})` : ''}
              </span>
            </div>
            <p className="text-text-secondary leading-relaxed">
              A previous metadata creation request encountered an unconfirmed network or server
              outcome. To prevent duplicate catalog records, a new release cannot be submitted
              until this submission is verified.
            </p>
            <p className="text-text-tertiary text-[11px] leading-relaxed">
              A delayed request may still complete on the server. Definitive duplicate elimination
              under network partitions requires backend idempotency support. Checking the catalog
              does not mutate server state.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={reconcileMetadataOutcome}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Re-verify Archive Status
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleModalClose}
              >
                Review Artist Studio
              </Button>
            </div>
          </div>
        )}

        {/* Form Fields: Step 1 Details */}
        <div className="space-y-3">
          <Input
            label="Release Title"
            placeholder="e.g. Blue in Green"
            value={title}
            disabled={isFormLocked || isProcessing}
            onChange={(e) => setTitle(e.target.value)}
            error={fieldErrors.title}
            helperText={
              activeStep === 'unresolved'
                ? 'Locked: Verification required before creating or modifying metadata.'
                : isFormLocked
                ? 'Metadata registered in archive.'
                : undefined
            }
          />

          <Input
            label="Musical Genre / Classification"
            placeholder="e.g. Modal Jazz / Ambient"
            value={genre}
            disabled={isFormLocked || isProcessing}
            onChange={(e) => setGenre(e.target.value)}
            error={fieldErrors.genre}
          />
        </div>

        {/* Step 2: Audio Master Recording Selector */}
        <div className="space-y-1.5 border-t border-border-rule pt-3">
          <label className="text-[11px] font-mono font-medium tracking-wider text-text-secondary uppercase select-none block">
            Master Audio File
          </label>
          <div className="flex items-center gap-3">
            <label
              className={`flex-1 min-w-0 flex items-center justify-between p-2.5 rounded-sm bg-surface-raised border border-border-control cursor-pointer hover:border-border-focus transition-colors ${
                isProcessing ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                <Music className="w-4 h-4 text-text-tertiary shrink-0" />
                <span
                  className="text-xs font-sans text-text-primary truncate"
                  title={audioFile ? audioFile.name : undefined}
                >
                  {audioFile ? audioFile.name : 'Select master recording (WAV, MP3, FLAC)...'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-text-tertiary uppercase shrink-0 ml-2">
                Browse
              </span>
              <input
                type="file"
                accept="audio/*"
                tabIndex={-1}
                disabled={isProcessing}
                onChange={handleAudioSelect}
                className="hidden"
              />
            </label>
            {audioFile && (
              <button
                type="button"
                onClick={() => setAudioFile(null)}
                disabled={isProcessing}
                aria-label="Remove selected audio"
                className="p-2 text-text-tertiary hover:text-text-primary rounded-sm transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Step 3: Cover Artwork Selector with 1:1 Live Preview */}
        <div className="space-y-1.5 border-t border-border-rule pt-3">
          <label className="text-[11px] font-mono font-medium tracking-wider text-text-secondary uppercase select-none block">
            Cover Artwork (1:1 Aspect Ratio)
          </label>
          <div className="flex items-start gap-4">
            {/* 1:1 Preview Box */}
            <div className="w-20 h-20 shrink-0 rounded-md border border-border-rule bg-canvas-subtle overflow-hidden flex items-center justify-center">
              {coverPreviewUrl ? (
                <img
                  src={coverPreviewUrl}
                  alt="Artwork Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center font-mono text-[9px] text-text-tertiary uppercase p-1">
                  1:1 Monogram
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <label
                className={`flex items-center justify-between p-2 rounded-sm bg-surface-raised border border-border-control cursor-pointer hover:border-border-focus transition-colors ${
                  isProcessing ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                  <Image className="w-4 h-4 text-text-tertiary shrink-0" />
                  <span
                    className="text-xs font-sans text-text-primary truncate"
                    title={coverFile ? coverFile.name : undefined}
                  >
                    {coverFile ? coverFile.name : 'Choose album artwork image...'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-text-tertiary uppercase shrink-0 ml-2">
                  Browse
                </span>
                <input
                  type="file"
                  accept="image/*"
                  tabIndex={-1}
                  disabled={isProcessing}
                  onChange={handleCoverSelect}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-text-tertiary font-sans">
                Square JPEG, PNG, or WebP recommended.
              </p>
            </div>
          </div>
        </div>

        {/* Completion Message */}
        {activeStep === 'complete' && (
          <div
            role="status"
            className="flex items-center gap-2 p-3 rounded-sm bg-status-approved-bg border border-status-approved-bd text-status-approved-fg text-xs font-sans"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Release successfully recorded in catalog and submitted for curation.</span>
          </div>
        )}

        {/* Modal Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-rule">
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={isProcessing}
            onClick={handleModalClose}
          >
            {activeStep === 'complete' ? 'Close' : 'Cancel'}
          </Button>

          {activeStep !== 'complete' && activeStep !== 'unresolved' && (
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isProcessing}
            >
              {activeStep === 'creating_metadata'
                ? 'Registering Metadata...'
                : activeStep === 'uploading_audio'
                ? 'Uploading Audio Master...'
                : activeStep === 'uploading_cover'
                ? 'Attaching Artwork...'
                : stepStatuses.audio === 'failed'
                ? 'Retry Audio Upload'
                : stepStatuses.cover === 'failed'
                ? 'Retry Cover Upload'
                : 'Submit Release'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}
