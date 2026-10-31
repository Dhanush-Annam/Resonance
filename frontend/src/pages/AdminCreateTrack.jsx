import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Music, Image, AlertCircle, CheckCircle2, ArrowLeft, RefreshCw, X } from 'lucide-react'
import Input from '../components/Input'
import Button from '../components/Button'

/**
 * Resonance Design System — Admin Direct Ingestion (<AdminCreateTrack />)
 *
 * Conforms to Approved Phase 6 Two-Phase Approval Pipeline:
 * - Creates metadata via POST /api/tracks (status: 'pending') ensuring zero public exposure
 * - Sequentially attaches master audio recording via POST /api/tracks/:id/audio
 * - Sequentially attaches cover artwork via POST /api/tracks/:id/cover
 * - Explicit cover failure decision gate: Retry artwork independently or publish with monogram
 * - Executes final PUT /api/tracks/:id/approve ONLY after audio master is verified
 * - Zero native browser alerts; clean editorial typography
 */
export default function AdminCreateTrack() {
  const navigate = useNavigate()

  // Form Inputs
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null)

  // Ingestion Pipeline State
  const [createdTrackId, setCreatedTrackId] = useState(null)
  const [audioUploaded, setAudioUploaded] = useState(false)
  const [coverUploaded, setCoverUploaded] = useState(false)
  const [coverFailed, setCoverFailed] = useState(false)
  const [coverErrorMessage, setCoverErrorMessage] = useState('')

  // Processing & Errors
  const isApprovingRef = useRef(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl)
      }
    }
  }, [coverPreviewUrl])

  // Handle Cover File Selection
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
    setCoverFailed(false)
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

  // Primary Ingestion Handler
  const handleIngestRelease = async (e) => {
    e?.preventDefault()

    // Client-side Validation
    const errors = {}
    if (!title.trim()) errors.title = 'Release title is required.'
    if (!genre.trim()) errors.genre = 'Musical genre is required.'
    if (!audioFile && !audioUploaded) {
      errors.audio = 'Master audio recording is required to publish an approved release.'
    }
    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) return

    setIsProcessing(true)
    setErrorMessage('')

    const token = sessionStorage.getItem('token')
    let currentTrackId = createdTrackId

    try {
      // Phase 1: Create Track in Status 'pending' (ensuring zero public exposure)
      if (!currentTrackId) {
        setStatusMessage('Creating archival record (pending)...')
        const createRes = await fetch(`${import.meta.env.VITE_API_URL}/api/tracks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: title.trim(), genre: genre.trim() }),
        })

        if (!createRes.ok) {
          const errData = await createRes.json().catch(() => null)
          throw new Error(errData?.message || 'Failed to initialize catalog record.')
        }

        const data = await createRes.json()
        currentTrackId = data.track?._id || data._id
        setCreatedTrackId(currentTrackId)
      }

      // Phase 2: Upload Audio Master
      if (!audioUploaded && audioFile) {
        setStatusMessage('Uploading master audio recording...')
        const audioForm = new FormData()
        audioForm.append('audio', audioFile)

        const audioRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/tracks/${currentTrackId}/audio`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: audioForm,
          }
        )

        if (!audioRes.ok) {
          const errData = await audioRes.json().catch(() => null)
          throw new Error(
            errData?.message ||
              'Audio master upload failed. Release remains pending and unlisted from public streaming.'
          )
        }

        setAudioUploaded(true)
      }

      // Phase 3: Upload Cover Artwork
      if (!coverUploaded && coverFile) {
        setStatusMessage('Attaching album artwork...')
        const coverForm = new FormData()
        coverForm.append('cover', coverFile)

        const coverRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/tracks/${currentTrackId}/cover`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: coverForm,
          }
        )

        if (!coverRes.ok) {
          // Artwork failed: halt automatic approval and present decision gate
          setCoverFailed(true)
          setCoverErrorMessage('Artwork upload rejected by server.')
          setIsProcessing(false)
          setStatusMessage('')
          return
        }

        setCoverUploaded(true)
      }

      // Phase 4: Final Curatorial Approval (Audio Verified)
      await approveAndFinalize(currentTrackId, token)
    } catch (err) {
      console.error('Ingestion failed:', err)
      setErrorMessage(err.message || 'Ingestion failed.')
      setIsProcessing(false)
      setStatusMessage('')
    }
  }

  // Execute Final Approval
  const approveAndFinalize = async (targetId, token) => {
    if (isApprovingRef.current) return
    isApprovingRef.current = true

    setStatusMessage('Publishing verified release to archive catalog...')

    try {
      const approveRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tracks/${targetId}/approve`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!approveRes.ok) {
        const errData = await approveRes.json().catch(() => null)
        throw new Error(errData?.message || 'Final approval failed on server.')
      }

      // Success: Redirect to Curatorial Desk
      navigate('/admin')
    } catch (err) {
      isApprovingRef.current = false
      throw err
    }
  }

  // Independent Cover Retry (Strictly targets POST /api/tracks/:id/cover without repeating previous steps)
  const handleRetryCover = async () => {
    if (!createdTrackId || !coverFile) return

    setIsProcessing(true)
    setCoverErrorMessage('')
    setStatusMessage('Retrying artwork upload...')

    const token = sessionStorage.getItem('token')
    const coverForm = new FormData()
    coverForm.append('cover', coverFile)

    try {
      const coverRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tracks/${createdTrackId}/cover`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: coverForm,
        }
      )

      if (!coverRes.ok) {
        const errData = await coverRes.json().catch(() => null)
        throw new Error(errData?.message || 'Artwork upload failed again.')
      }

      setCoverUploaded(true)
      setCoverFailed(false)

      // Artwork succeeded: finalize approval
      await approveAndFinalize(createdTrackId, token)
    } catch (err) {
      console.error('Artwork retry error:', err)
      setCoverErrorMessage(err.message || 'Artwork upload retry failed.')
      setIsProcessing(false)
      setStatusMessage('')
    }
  }

  // Explicit Admin Opt-In: Publish with Monogram Fallback
  const handlePublishWithoutArtwork = async () => {
    if (!createdTrackId || !audioUploaded) return

    setIsProcessing(true)
    setErrorMessage('')
    const token = sessionStorage.getItem('token')

    try {
      await approveAndFinalize(createdTrackId, token)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to publish release.')
      setIsProcessing(false)
      setStatusMessage('')
    }
  }

  return (
    <main className="flex-1 bg-canvas-base text-text-primary p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
        {/* Navigation & Header */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Curatorial Desk</span>
          </button>

          <header className="border-b border-border-rule pb-6 select-none space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-widest text-text-tertiary">
              Direct Archival Ingestion
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl text-text-primary tracking-tight">
              Ingest & Publish Release
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary max-w-xl">
              Directly publish an archival master recording into the public catalog using the
              verified Two-Phase approval pipeline.
            </p>
          </header>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2 p-3 rounded-sm bg-status-rejected-bg border border-status-rejected-bd text-status-rejected-fg text-xs font-sans"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Ingestion Notice</p>
              <p className="text-text-secondary mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* In-Flight Status Progress */}
        {statusMessage && (
          <div
            role="status"
            className="flex items-center gap-2 p-3 rounded-sm bg-surface-raised border border-border-control text-text-primary text-xs font-mono"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-text-secondary" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Cover Artwork Failure Decision Gate */}
        {coverFailed && (
          <div
            role="alert"
            className="p-4 rounded-sm bg-surface-raised border border-status-pending-bd space-y-3 text-xs font-sans"
          >
            <div className="flex items-center gap-2 text-status-pending-fg font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Cover Artwork Failed — Direct Publishing Decision Gate</span>
            </div>

            <p className="text-text-secondary leading-relaxed">
              Master audio recording verified and attached. Cover artwork upload failed:{' '}
              <strong className="text-text-primary">{coverErrorMessage}</strong>.
            </p>

            <p className="text-text-tertiary text-[11px] leading-relaxed">
              In accordance with archive rules, releases may be published without artwork (displaying
              the editorial typographic monogram fallback), or you may retry attaching the artwork.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleRetryCover}
                isLoading={isProcessing}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry Artwork Upload
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handlePublishWithoutArtwork}
                disabled={isProcessing}
              >
                Publish With Monogram Fallback
              </Button>
            </div>
          </div>
        )}

        {/* Ingestion Form */}
        <form onSubmit={handleIngestRelease} className="space-y-6">
          {/* Metadata Section */}
          <div className="space-y-4">
            <h2 className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
              1. Release Details
            </h2>

            <Input
              label="Release Title"
              placeholder="e.g. In a Silent Way"
              value={title}
              disabled={Boolean(createdTrackId) || isProcessing}
              onChange={(e) => setTitle(e.target.value)}
              error={fieldErrors.title}
            />

            <Input
              label="Musical Genre / Archival Category"
              placeholder="e.g. Modal Jazz / Electronic Fusion"
              value={genre}
              disabled={Boolean(createdTrackId) || isProcessing}
              onChange={(e) => setGenre(e.target.value)}
              error={fieldErrors.genre}
            />
          </div>

          {/* Master Audio Section */}
          <div className="space-y-3 border-t border-border-rule pt-5">
            <h2 className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
              2. Master Recording
            </h2>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-medium tracking-wider text-text-secondary uppercase select-none block">
                Audio Master File (Required)
              </label>

              <div className="flex items-center gap-3">
                <label
                  className={`flex-1 flex items-center justify-between p-2.5 rounded-sm bg-surface-raised border border-border-control cursor-pointer hover:border-border-focus transition-colors ${
                    isProcessing || audioUploaded ? 'pointer-events-none opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Music className="w-4 h-4 text-text-tertiary shrink-0" />
                    <span className="text-xs font-sans text-text-primary truncate">
                      {audioFile
                        ? audioFile.name
                        : audioUploaded
                        ? 'Master recording verified and attached'
                        : 'Select master recording (WAV, MP3, FLAC)...'}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-text-tertiary uppercase shrink-0 ml-2">
                    {audioUploaded ? 'Verified' : 'Browse'}
                  </span>

                  <input
                    type="file"
                    accept="audio/*"
                    tabIndex={-1}
                    disabled={isProcessing || audioUploaded}
                    onChange={handleAudioSelect}
                    className="hidden"
                  />
                </label>

                {audioFile && !audioUploaded && (
                  <button
                    type="button"
                    onClick={() => setAudioFile(null)}
                    disabled={isProcessing}
                    aria-label="Remove audio"
                    className="p-2 text-text-tertiary hover:text-text-primary rounded-sm transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {fieldErrors.audio && (
                <p className="text-xs text-status-rejected-fg font-sans mt-0.5">
                  {fieldErrors.audio}
                </p>
              )}
            </div>
          </div>

          {/* Cover Artwork Section */}
          <div className="space-y-3 border-t border-border-rule pt-5">
            <h2 className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
              3. Album Artwork (Optional)
            </h2>

            <div className="flex items-start gap-4">
              {/* 1:1 Preview Box */}
              <div className="w-20 h-20 shrink-0 rounded-md border border-border-rule bg-canvas-subtle overflow-hidden flex items-center justify-center">
                {coverPreviewUrl ? (
                  <img
                    src={coverPreviewUrl}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center font-mono text-[9px] text-text-tertiary uppercase p-1">
                    Typographic Monogram
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <label
                  className={`flex items-center justify-between p-2 rounded-sm bg-surface-raised border border-border-control cursor-pointer hover:border-border-focus transition-colors ${
                    isProcessing || coverUploaded ? 'pointer-events-none opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Image className="w-4 h-4 text-text-tertiary shrink-0" />
                    <span className="text-xs font-sans text-text-primary truncate">
                      {coverFile
                        ? coverFile.name
                        : coverUploaded
                        ? 'Cover artwork attached'
                        : 'Choose album artwork image...'}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-text-tertiary uppercase shrink-0 ml-2">
                    {coverUploaded ? 'Attached' : 'Browse'}
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    tabIndex={-1}
                    disabled={isProcessing || coverUploaded}
                    onChange={handleCoverSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-text-tertiary font-sans">
                  Square 1:1 ratio. If omitted, the release will render the editorial typographic
                  monogram fallback.
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-border-rule flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={isProcessing}
              onClick={() => navigate('/admin')}
            >
              Cancel
            </Button>

            {!coverFailed && (
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isProcessing}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Publish Master Release
              </Button>
            )}
          </div>
        </form>
      </div>
    </main>
  )
}
