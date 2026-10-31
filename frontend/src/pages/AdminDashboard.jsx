import { useEffect, useState } from 'react'
import { ShieldCheck, Check, X, AlertCircle, RefreshCw, Music, Image as ImageIcon, User, Mail } from 'lucide-react'
import AuditionPlayer from '../components/AuditionPlayer'
import Modal from '../components/Modal'
import Button from '../components/Button'
import { cloudinaryCoverUrl } from '../utils/cloudinary'

/**
 * Resonance Design System — Curatorial Desk (<AdminDashboard />)
 *
 * Conforms to DESIGN.md Section 6.3 & Phase 6 Specifications:
 * - Editorial canvas in deep archival charcoal (#101114) with Instrument Serif typography
 * - Responsive 3-column curatorial grid replacing rigid 2-column layout
 * - Integrated <AuditionPlayer /> with single-track mutual exclusivity
 * - Accessible Modal sheet replacing native window.prompt() for rejection feedback
 * - Disables approval if master audio is absent with explicit feedback
 * - Zero skeuomorphism; honest queue metrics
 */
export default function AdminDashboard() {
  const [tracks, setTracks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeAuditionId, setActiveAuditionId] = useState(null)

  // Rejection Modal State
  const [rejectingTrack, setRejectingTrack] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false)
  const [rejectionError, setRejectionError] = useState('')

  // Approval In-Flight State
  const [approvingTrackId, setApprovingTrackId] = useState(null)
  const [actionError, setActionError] = useState('')

  const fetchPending = async () => {
    const token = sessionStorage.getItem('token')
    if (!token) return

    setIsLoading(true)
    setActionError('')

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tracks/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error('Failed to fetch pending submissions')
      }

      const data = await res.json()
      setTracks(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Pending tracks fetch error:', err)
      setActionError('Failed to load pending submissions from archive.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  // Approve Track Submission
  const handleApprove = async (trackId) => {
    setApprovingTrackId(trackId)
    setActionError('')

    const token = sessionStorage.getItem('token')

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tracks/${trackId}/approve`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.message || 'Approval rejected by server.')
      }

      // Optimistic removal from queue
      setTracks((prev) => prev.filter((t) => t._id !== trackId))
      if (activeAuditionId === trackId) {
        setActiveAuditionId(null)
      }
    } catch (err) {
      console.error('Track approval failed:', err)
      setActionError(err.message || 'Approval failed.')
    } finally {
      setApprovingTrackId(null)
    }
  }

  // Open Rejection Dialog
  const handleOpenRejectModal = (track) => {
    setRejectingTrack(track)
    setRejectionReason('')
    setRejectionError('')
  }

  // Submit Rejection Feedback
  const handleConfirmReject = async () => {
    if (!rejectingTrack) return

    setIsSubmittingRejection(true)
    setRejectionError('')

    const token = sessionStorage.getItem('token')
    const trimmedReason = rejectionReason.trim()

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tracks/${rejectingTrack._id}/reject`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: trimmedReason || 'Submission guidelines not met.' }),
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.message || 'Rejection failed on server.')
      }

      // Optimistic removal from queue
      setTracks((prev) => prev.filter((t) => t._id !== rejectingTrack._id))
      if (activeAuditionId === rejectingTrack._id) {
        setActiveAuditionId(null)
      }
      setRejectingTrack(null)
    } catch (err) {
      console.error('Track rejection failed:', err)
      setRejectionError(err.message || 'Failed to submit rejection feedback.')
    } finally {
      setIsSubmittingRejection(false)
    }
  }

  return (
    <main className="flex-1 bg-canvas-base text-text-primary p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Curatorial Header */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-rule pb-6 select-none">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-text-tertiary">
                Archival Oversight
              </span>
              <span className="text-border-rule">•</span>
              <span className="font-mono text-[11px] text-status-pending-fg uppercase">
                {tracks.length} Awaiting Audition
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-text-primary tracking-tight">
              Curatorial Desk
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary max-w-xl">
              Audition incoming artist submissions, review master recording fidelity, and curate the
              Resonance public catalog.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={fetchPending}
              disabled={isLoading}
              className="text-xs"
            >
              Refresh Queue
            </Button>
          </div>
        </header>

        {/* Global Action Error Alert */}
        {actionError && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 rounded-sm bg-status-rejected-bg border border-status-rejected-bd text-status-rejected-fg text-xs font-sans"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Curatorial Queue Grid */}
        <section aria-label="Curatorial Review Queue">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-text-tertiary space-y-3">
              <div className="w-6 h-6 border-2 border-text-tertiary border-t-text-primary rounded-full animate-spin" />
              <p className="font-mono text-xs uppercase tracking-wider">
                Auditioning incoming masters...
              </p>
            </div>
          ) : tracks.length === 0 ? (
            <div className="border border-border-rule rounded-md bg-surface-raised/30 p-10 sm:p-16 text-center space-y-3 select-none">
              <div className="w-10 h-10 rounded-sm bg-surface-elevated border border-border-rule flex items-center justify-center mx-auto text-status-approved-fg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="font-serif text-2xl text-text-primary">
                Archive In Equilibrium
              </p>
              <p className="font-sans text-xs sm:text-sm text-text-tertiary max-w-md mx-auto">
                All incoming artist master recordings have been auditioned and curated. New releases
                will appear here for curatorial review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {tracks.map((track) => {
                const hasAudio = Boolean(track.audioUrl)
                const hasCover = Boolean(track.coverUrl)
                const artistName = track.artist?.username || 'Unknown Artist'
                const artistEmail = track.artist?.email || ''
                const isApproving = approvingTrackId === track._id
                const monogramChar = track.title ? track.title.trim()[0].toUpperCase() : 'R'

                return (
                  <article
                    key={track._id}
                    className="bg-surface-raised border border-border-rule rounded-md p-4 sm:p-5 flex flex-col justify-between transition-colors hover:border-border-control select-none space-y-4"
                  >
                    <div className="space-y-4">
                      {/* Top Row: 1:1 Artwork & Primary Metadata */}
                      <div className="flex gap-4">
                        {/* 1:1 Artwork */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-md border border-border-rule bg-canvas-subtle overflow-hidden flex items-center justify-center">
                          {hasCover ? (
                            <img
                              src={cloudinaryCoverUrl(track.coverUrl, { w: 400, h: 400 })}
                              alt={`${track.title} artwork`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center p-2">
                              <span className="font-serif text-2xl text-text-secondary">
                                {monogramChar}
                              </span>
                              <span className="font-mono text-[8px] uppercase tracking-wider text-text-tertiary mt-1">
                                No Artwork
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Title & Creator */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-status-pending-fg px-1.5 py-0.5 rounded-xs bg-status-pending-bg border border-status-pending-bd inline-block">
                            Pending Review
                          </span>

                          <h3 className="font-sans font-semibold text-sm sm:text-base text-text-primary truncate pt-0.5">
                            {track.title}
                          </h3>

                          <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider">
                            {track.genre}
                          </p>

                          {/* Artist Identity */}
                          <div className="pt-1 flex flex-col text-xs text-text-secondary space-y-0.5">
                            <div className="flex items-center gap-1.5 truncate">
                              <User className="w-3 h-3 text-text-tertiary shrink-0" />
                              <span className="truncate">{artistName}</span>
                            </div>
                            {artistEmail && (
                              <div className="flex items-center gap-1.5 truncate text-[11px] text-text-tertiary">
                                <Mail className="w-3 h-3 shrink-0" />
                                <span className="truncate">{artistEmail}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Attachment Status Telemetry */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono select-none">
                        <div
                          className={`flex items-center gap-1.5 p-1.5 rounded-xs border min-w-0 ${
                            hasAudio
                              ? 'bg-status-approved-bg/50 border-status-approved-bd/50 text-status-approved-fg'
                              : 'bg-status-rejected-bg/50 border-status-rejected-bd/50 text-status-rejected-fg'
                          }`}
                        >
                          <Music className="w-3.5 h-3.5 shrink-0" />
                          <span
                            className="truncate"
                            title={hasAudio ? 'Master Audio Attached' : 'Missing Audio'}
                          >
                            {hasAudio ? 'Audio Attached' : 'Missing Audio'}
                          </span>
                        </div>

                        <div
                          className={`flex items-center gap-1.5 p-1.5 rounded-xs border min-w-0 ${
                            hasCover
                              ? 'bg-status-approved-bg/50 border-status-approved-bd/50 text-status-approved-fg'
                              : 'bg-surface-elevated border-border-rule text-text-tertiary'
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                          <span
                            className="truncate"
                            title={hasCover ? 'Artwork Attached' : 'Monogram Fallback'}
                          >
                            {hasCover ? 'Artwork Attached' : 'No Artwork'}
                          </span>
                        </div>
                      </div>

                      {/* Custom Audition Audio Strip */}
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary mb-1.5">
                          Audition Master Stream
                        </p>
                        {hasAudio ? (
                          <AuditionPlayer
                            trackId={track._id}
                            audioUrl={track.audioUrl}
                            isActive={activeAuditionId === track._id}
                            onPlay={() => setActiveAuditionId(track._id)}
                            onPause={() => {
                              if (activeAuditionId === track._id) {
                                setActiveAuditionId(null)
                              }
                            }}
                          />
                        ) : (
                          <div className="p-3 rounded-sm bg-surface-elevated border border-border-rule text-xs text-text-tertiary text-center font-sans">
                            No master recording attached to audition.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Curatorial Actions Bar */}
                    <div className="pt-3 border-t border-border-rule flex items-center gap-2.5">
                      {/* Approve Button */}
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={!hasAudio || isApproving}
                        isLoading={isApproving}
                        onClick={() => handleApprove(track._id)}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                        className="flex-1 text-xs"
                      >
                        {hasAudio ? 'Approve Release' : 'Audio Required'}
                      </Button>

                      {/* Reject Button */}
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleOpenRejectModal(track)}
                        leftIcon={<X className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        Reject
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {/* Accessible Editorial Rejection Modal Sheet */}
        <Modal
          isOpen={Boolean(rejectingTrack)}
          onClose={() => {
            if (!isSubmittingRejection) {
              setRejectingTrack(null)
              setRejectionError('')
            }
          }}
          title="Editorial Rejection Feedback"
          description="Provide archival feedback explaining why this submission does not meet release standards."
          variant="danger"
          confirmText="Confirm Rejection"
          cancelText="Cancel"
          onConfirm={handleConfirmReject}
          isLoading={isSubmittingRejection}
        >
          <div className="space-y-4">
            <div className="p-2.5 rounded-sm bg-surface-raised border border-border-rule space-y-1 text-xs">
              <p className="text-text-secondary">
                <span className="font-mono text-text-tertiary uppercase tracking-wider text-[10px]">
                  Release:
                </span>{' '}
                <strong className="text-text-primary">{rejectingTrack?.title}</strong>
              </p>
              <p className="text-text-secondary">
                <span className="font-mono text-text-tertiary uppercase tracking-wider text-[10px]">
                  Artist:
                </span>{' '}
                <span className="text-text-primary">
                  {rejectingTrack?.artist?.username || 'Unknown'} (
                  {rejectingTrack?.artist?.email || 'No email'})
                </span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="rejection-reason"
                className="text-[11px] font-mono uppercase tracking-wider text-text-secondary select-none block"
              >
                Curatorial Reason & Guidelines Feedback
              </label>
              <textarea
                id="rejection-reason"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete master recording, unplayable audio format, artwork aspect ratio incorrect, or title metadata inaccurate..."
                className="w-full p-2.5 rounded-sm bg-surface-raised border border-border-control text-xs sm:text-sm text-text-primary placeholder:text-text-tertiary font-sans focus-visible:outline-none focus-visible:border-border-focus focus-visible:ring-1 focus-visible:ring-border-focus resize-none"
              />
              <p className="text-[11px] text-text-tertiary font-sans">
                This reason will be provided to the artist on their studio dashboard.
              </p>
            </div>

            {rejectionError && (
              <div
                role="alert"
                className="flex items-center gap-2 p-2.5 rounded-xs bg-status-rejected-bg border border-status-rejected-bd text-status-rejected-fg text-xs"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{rejectionError}</span>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </main>
  )
}
