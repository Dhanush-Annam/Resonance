import { Trash2, AlertCircle, Lock, Music } from 'lucide-react'
import UploadAudioButton from './UploadAudioButton'
import UploadCoverButton from './UploadCoverButton'
import Button from './Button'
import { cloudinaryCoverUrl } from '../utils/cloudinary'

/**
 * Resonance Design System — Artist Catalog Track Card (<ArtistTrackCard />)
 *
 * Conforms to DESIGN.md Section 6.2 & Phase 6 Specifications:
 * - 1:1 square artwork container (aspect-square) with Cloudinary delivery
 * - Archival typographic monogram fallback when artwork is absent (zero vinyl skeuomorphism)
 * - Mathematically verified status badge tokens (Pending: 10.43:1, Approved: 9.05:1, Rejected: 6.29:1)
 * - Clear editorial deaccession notice on rejected releases guiding artists to delete and resubmit
 * - Approved master lockouts preventing deletion or asset tampering
 */
export default function ArtistTrackCard({ track, onUpdated, onDelete }) {
  const isApproved = track.status === 'approved'
  const isRejected = track.status === 'rejected'

  // Monogram letter for artwork placeholder
  const monogramChar = track.title ? track.title.trim()[0].toUpperCase() : 'R'

  return (
    <article className="bg-surface-raised border border-border-rule rounded-md p-4 flex flex-col justify-between transition-colors hover:border-border-control select-none">
      <div>
        {/* 1:1 Square Artwork Container */}
        <div className="relative aspect-square w-full rounded-md bg-canvas-subtle border border-border-subtle overflow-hidden mb-3.5 flex items-center justify-center">
          {track.coverUrl ? (
            <img
              src={cloudinaryCoverUrl(track.coverUrl, { w: 400, h: 400 })}
              alt={`${track.title} release artwork`}
              loading="lazy"
              className="w-full h-full object-cover transition duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <span className="font-serif text-4xl text-text-secondary select-none">
                {monogramChar}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-text-tertiary mt-2">
                No Artwork Recorded
              </span>
            </div>
          )}

          {/* Audio presence watermark icon */}
          {track.audioUrl && (
            <span
              title="Master recording attached"
              className="absolute top-2 right-2 p-1.5 rounded-xs bg-canvas-base/80 backdrop-blur-sm border border-border-rule text-text-secondary"
            >
              <Music className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          )}
        </div>

        {/* Release Metadata */}
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-sans font-semibold text-sm sm:text-base text-text-primary truncate">
              {track.title}
            </h3>

            {/* Status Badge */}
            <span
              className={`shrink-0 text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-xs border font-medium ${
                isApproved
                  ? 'bg-status-approved-bg text-status-approved-fg border-status-approved-bd'
                  : isRejected
                  ? 'bg-status-rejected-bg text-status-rejected-fg border-status-rejected-bd'
                  : 'bg-status-pending-bg text-status-pending-fg border-status-pending-bd'
              }`}
            >
              {track.status}
            </span>
          </div>

          <p className="text-xs font-mono text-text-tertiary uppercase tracking-wider">
            {track.genre}
          </p>
        </div>

        {/* Editorial Deaccession Notice for Rejected Releases */}
        {isRejected && (
          <div
            role="alert"
            className="mt-3.5 p-3 rounded-sm bg-status-rejected-bg border border-status-rejected-bd text-xs font-sans space-y-2 text-status-rejected-fg"
          >
            <div className="flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="font-mono text-[11px] uppercase tracking-wider">
                Editorial Rejection Notice
              </span>
            </div>

            <p className="text-text-primary text-xs">
              <span className="font-medium">Curatorial Feedback:</span>{' '}
              {track.rejectionReason || 'No curatorial notes provided.'}
            </p>

            <p className="text-text-secondary text-[11px] leading-relaxed">
              This release has been deaccessioned and cannot be resubmitted by replacing assets. To
              submit a corrected version, permanently delete this record and ingest a new release.
            </p>
          </div>
        )}
      </div>

      {/* Asset Controls & Actions */}
      <div className="mt-4 pt-3 border-t border-border-rule space-y-2.5">
        {/* Upload Buttons (Active for Pending & Rejected Releases) */}
        {!isApproved ? (
          <div className="space-y-2">
            <UploadCoverButton track={track} onUploaded={onUpdated} />
            <UploadAudioButton track={track} onUploaded={onUpdated} />
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 rounded-xs bg-surface-elevated/50 border border-border-subtle text-xs text-text-tertiary">
            <Lock className="w-3.5 h-3.5 text-text-secondary shrink-0" />
            <span className="text-[11px] font-sans">
              Archived master release • Locked
            </span>
          </div>
        )}

        {/* Deletion Control */}
        {!isApproved ? (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => onDelete(track)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            aria-label={`Permanently delete ${track.title}`}
            className="w-full text-xs mt-1"
          >
            Permanently Delete Release
          </Button>
        ) : (
          <p className="text-[11px] font-sans text-text-tertiary text-center pt-0.5">
            Approved recordings cannot be deleted
          </p>
        )}
      </div>
    </article>
  )
}
