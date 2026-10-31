import { useEffect, useState } from 'react'
import { Plus, Disc3, Clock, CheckCircle2, AlertCircle, RefreshCw, ShieldAlert, Check } from 'lucide-react'
import ArtistTrackCard from '../components/ArtistTrackCard'
import CreateTrackModal from '../components/CreateTrackModal'
import Modal from '../components/Modal'
import Button from '../components/Button'
import {
  getUnresolvedSubmission,
  clearUnresolvedSubmission,
  dismissUnresolvedBanner,
  formatUnresolvedAge,
} from '../utils/unresolvedSubmissions'

/**
 * Resonance Design System — Artist Studio Surface (<ArtistDashboard />)
 *
 * Conforms to DESIGN.md Section 6.2 & Phase 6 Specifications:
 * - Editorial headline in Instrument Serif with honest telemetry (zero fake metrics)
 * - Accessible Phase 3 <Modal /> primitive replacing native window.confirm() and alert()
 * - Responsive catalog grid across mobile, tablet, and desktop viewports
 * - Archival empty state and non-blocking in-flight deletion feedback
 */
export default function ArtistDashboard() {
  const [tracks, setTracks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deletingTrack, setDeletingTrack] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Persistent Unresolved Submission State
  const [unresolvedSubmission, setUnresolvedSubmission] = useState(() => getUnresolvedSubmission())
  const [isVerifyingUnresolved, setIsVerifyingUnresolved] = useState(false)
  const [unresolvedNotice, setUnresolvedNotice] = useState('')

  const fetchTracks = async () => {
    const token = sessionStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tracks/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error('Failed to fetch tracks')
      const data = await res.json()
      setTracks(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load artist tracks:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTracks()
    setUnresolvedSubmission(getUnresolvedSubmission())
  }, [])

  // Non-mutating verification of unresolved submission against GET /api/tracks/my
  const handleVerifyUnresolved = async () => {
    if (!unresolvedSubmission) return

    setIsVerifyingUnresolved(true)
    setUnresolvedNotice('')

    const token = sessionStorage.getItem('token')
    if (!token) {
      setIsVerifyingUnresolved(false)
      return
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tracks/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        const tracksList = Array.isArray(data) ? data : []
        setTracks(tracksList)

        // Check if matching record exists
        const matched = tracksList.find((t) => {
          const matchesTitle =
            t.title?.trim().toLowerCase() === unresolvedSubmission.title.toLowerCase()
          const matchesGenre =
            t.genre?.trim().toLowerCase() === unresolvedSubmission.genre.toLowerCase()
          const createdAtTime = new Date(t.createdAt).getTime()
          const isAfterDispatch =
            createdAtTime >= (unresolvedSubmission.dispatchedAt || 0) - 5000
          return matchesTitle && matchesGenre && isAfterDispatch
        })

        if (matched) {
          clearUnresolvedSubmission()
          setUnresolvedSubmission(null)
          setUnresolvedNotice(
            `Confirmed: "${matched.title}" is recorded in your catalog. You can now attach audio and cover artwork.`
          )
        } else {
          setUnresolvedNotice(
            'Archive verification check complete. No matching record detected yet. If the request was delayed, it may still appear; check again later or resume the submission sheet.'
          )
        }
      } else {
        setUnresolvedNotice('Archive check could not be completed at this time.')
      }
    } catch {
      setUnresolvedNotice('Network check interrupted. Please verify connection and try again.')
    } finally {
      setIsVerifyingUnresolved(false)
    }
  }

  const handleDismissUnresolved = () => {
    dismissUnresolvedBanner()
    setUnresolvedSubmission(getUnresolvedSubmission())
    setUnresolvedNotice('')
  }

  // Confirm Permanent Deletion of Non-Approved Track
  const handleConfirmDelete = async () => {
    if (!deletingTrack) return

    setIsDeleting(true)
    setDeleteError('')

    const token = sessionStorage.getItem('token')

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tracks/${deletingTrack._id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.message || 'Deletion failed on server.')
      }

      // Optimistically remove from state
      setTracks((prev) => prev.filter((t) => t._id !== deletingTrack._id))
      setDeletingTrack(null)
    } catch (err) {
      console.error('Delete track error:', err)
      setDeleteError(err.message || 'Unable to delete track. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Real Telemetry (Zero Fake Vanity Metrics)
  const totalReleases = tracks.length
  const pendingCount = tracks.filter((t) => t.status === 'pending').length
  const approvedCount = tracks.filter((t) => t.status === 'approved').length
  const rejectedCount = tracks.filter((t) => t.status === 'rejected').length

  return (
    <main className="flex-1 bg-canvas-base text-text-primary p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Editorial Header & Ingestion Action */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-rule pb-6 select-none">
          <div className="space-y-1.5">
            <p className="text-[11px] font-mono uppercase tracking-widest text-text-tertiary">
              Studio Ledger
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl text-text-primary tracking-tight">
              Artist Studio
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary max-w-xl">
              Manage your release catalog, track curation review statuses, and ingest new master
              recordings into the Resonance archive.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={fetchTracks}
              disabled={isLoading}
              className="text-xs"
            >
              Refresh
            </Button>

            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
              className="text-xs sm:text-sm"
            >
              New Release
            </Button>
          </div>
        </header>

        {/* Persistent Unresolved Submission Alert Banner */}
        {unresolvedSubmission && !unresolvedSubmission.bannerDismissed && (
          <div
            role="alert"
            className="p-4 rounded-sm bg-surface-raised border border-status-pending-bd space-y-3 text-xs font-sans select-none"
          >
            <div className="flex items-center gap-2 text-status-pending-fg font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                Unconfirmed Submission in Progress: &quot;{unresolvedSubmission.title}&quot;{' '}
                ({formatUnresolvedAge(unresolvedSubmission.timestamp)})
              </span>
            </div>

            <p className="text-text-secondary leading-relaxed">
              A recent metadata creation request encountered an unconfirmed network or server
              outcome. To avoid creating duplicate records, do not submit a duplicate. You may
              re-verify your catalog or resume the submission sheet.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleVerifyUnresolved}
                isLoading={isVerifyingUnresolved}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Re-verify Archive Status
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowCreateModal(true)}
              >
                Resume Ingestion Sheet
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDismissUnresolved}
                className="text-text-tertiary hover:text-status-rejected-fg"
              >
                Dismiss Notice
              </Button>
            </div>
          </div>
        )}

        {/* Compact Persistent Indicator When Banner is Dismissed */}
        {unresolvedSubmission && unresolvedSubmission.bannerDismissed && (
          <div
            role="status"
            className="flex items-center justify-between p-2.5 rounded-sm bg-surface-raised border border-status-pending-bd text-xs font-sans text-text-secondary select-none"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-status-pending-fg shrink-0" />
              <span>
                Unconfirmed Submission Active:{' '}
                <strong className="text-text-primary">&quot;{unresolvedSubmission.title}&quot;</strong>{' '}
                ({formatUnresolvedAge(unresolvedSubmission.timestamp)})
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleVerifyUnresolved}
                disabled={isVerifyingUnresolved}
                className="text-status-pending-fg underline hover:text-text-primary font-mono text-[11px] uppercase tracking-wider"
              >
                {isVerifyingUnresolved ? 'Checking Archive...' : 'Re-verify'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="text-text-primary underline hover:text-text-secondary font-mono text-[11px] uppercase tracking-wider"
              >
                View Details
              </button>
            </div>
          </div>
        )}

        {/* Verification Status Feedback Notice */}
        {unresolvedNotice && (
          <div
            role="status"
            className="flex items-center gap-2 p-3 rounded-sm bg-surface-raised border border-border-control text-text-primary text-xs font-sans"
          >
            <Check className="w-4 h-4 text-status-approved-fg shrink-0" />
            <span>{unresolvedNotice}</span>
          </div>
        )}

        {/* Honest Catalog Telemetry Strip */}
        <section
          aria-label="Catalog Overview"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 select-none"
        >
          {/* Total Releases */}
          <div className="bg-surface-raised border border-border-rule rounded-sm p-3 sm:p-4 space-y-1">
            <div className="flex items-center gap-2 text-text-tertiary">
              <Disc3 className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="font-mono text-[11px] uppercase tracking-wider">
                Total Releases
              </span>
            </div>
            <p className="font-mono text-xl sm:text-2xl font-semibold tabular-nums text-text-primary">
              {totalReleases}
            </p>
          </div>

          {/* In Curation Review */}
          <div className="bg-surface-raised border border-border-rule rounded-sm p-3 sm:p-4 space-y-1">
            <div className="flex items-center gap-2 text-status-pending-fg">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="font-mono text-[11px] uppercase tracking-wider">
                In Review
              </span>
            </div>
            <p className="font-mono text-xl sm:text-2xl font-semibold tabular-nums text-status-pending-fg">
              {pendingCount}
            </p>
          </div>

          {/* Archived & Approved */}
          <div className="bg-surface-raised border border-border-rule rounded-sm p-3 sm:p-4 space-y-1">
            <div className="flex items-center gap-2 text-status-approved-fg">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="font-mono text-[11px] uppercase tracking-wider">
                Catalog Active
              </span>
            </div>
            <p className="font-mono text-xl sm:text-2xl font-semibold tabular-nums text-status-approved-fg">
              {approvedCount}
            </p>
          </div>

          {/* Deaccessioned / Action Required */}
          <div className="bg-surface-raised border border-border-rule rounded-sm p-3 sm:p-4 space-y-1">
            <div className="flex items-center gap-2 text-status-rejected-fg">
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="font-mono text-[11px] uppercase tracking-wider">
                Action Required
              </span>
            </div>
            <p className="font-mono text-xl sm:text-2xl font-semibold tabular-nums text-status-rejected-fg">
              {rejectedCount}
            </p>
          </div>
        </section>

        {/* Catalog List / Grid */}
        <section aria-label="Releases Catalog">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-text-tertiary space-y-3">
              <div className="w-6 h-6 border-2 border-text-tertiary border-t-text-primary rounded-full animate-spin" />
              <p className="font-mono text-xs uppercase tracking-wider">
                Reading Studio Ledger...
              </p>
            </div>
          ) : tracks.length === 0 ? (
            <div className="border border-border-rule rounded-md bg-surface-raised/40 p-8 sm:p-12 text-center space-y-3 select-none">
              <p className="font-serif text-2xl text-text-secondary">
                Catalog Inactive
              </p>
              <p className="font-sans text-xs sm:text-sm text-text-tertiary max-w-md mx-auto">
                No releases recorded in your studio ledger. Ingest your first master recording to
                begin curatorial review and distribution.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowCreateModal(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Ingest First Release
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {tracks.map((track) => (
                <ArtistTrackCard
                  key={track._id}
                  track={track}
                  onUpdated={fetchTracks}
                  onDelete={(t) => {
                    setDeleteError('')
                    setDeletingTrack(t)
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Release Ingestion Modal Sheet */}
        {showCreateModal && (
          <CreateTrackModal
            onClose={() => setShowCreateModal(false)}
            onCreated={fetchTracks}
          />
        )}

        {/* Accessible Deletion Confirmation Modal Dialog */}
        <Modal
          isOpen={Boolean(deletingTrack)}
          onClose={() => {
            if (!isDeleting) {
              setDeletingTrack(null)
              setDeleteError('')
            }
          }}
          title="Permanently Delete Release?"
          variant="danger"
          confirmText="Permanently Delete"
          cancelText="Keep Release"
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
        >
          <div className="space-y-3 text-sm text-text-secondary">
            <p>
              Are you sure you want to permanently delete{' '}
              <strong className="text-text-primary">
                "{deletingTrack?.title}"
              </strong>
              ?
            </p>
            <p className="text-xs text-text-tertiary leading-relaxed">
              This action permanently purges the release record and all attached master recordings
              and cover artwork. This action is irreversible.
            </p>

            {deleteError && (
              <div
                role="alert"
                className="flex items-center gap-2 p-2.5 rounded-xs bg-status-rejected-bg border border-status-rejected-bd text-status-rejected-fg text-xs"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </main>
  )
}
