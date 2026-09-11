import UploadAudioButton from './UploadAudioButton'
import UploadCoverButton from './UploadCoverButton'
import { cloudinaryCoverUrl } from '../utils/cloudinary'

export default function ArtistTrackCard({ track, onUpdated, onDelete }) {
  const statusColors = {
    pending: 'bg-yellow-500',
    approved: 'bg-green-600',
    rejected: 'bg-red-600',
  }

  return (
    <div className="bg-zinc-800 p-4 rounded-lg">
      {/* COVER */}
      <div className="mb-3">
        {track.coverUrl ? (
          <img
            src={cloudinaryCoverUrl(track.coverUrl, { w: 400, h: 400 })}
            alt="Cover"
            className="w-full h-40 object-cover rounded"
          />
        ) : (
          <div className="w-full h-40 bg-zinc-700 rounded flex items-center justify-center text-gray-400 text-sm">
            No cover
          </div>
        )}
      </div>

      {/* INFO */}
      <h3 className="font-semibold text-lg">{track.title}</h3>
      <p className="text-sm text-gray-400">{track.genre}</p>

      <span
        className={`inline-block text-xs px-2 py-1 rounded mt-2 ${statusColors[track.status]}`}
      >
        {track.status.toUpperCase()}

      </span>
      {track.status === 'rejected' && (
        <p className="text-red-400 text-sm mt-1">
          Rejected: {track.rejectionReason || 'No reason provided'}
        </p>
      )}



      {/* ACTIONS */}
      <div className="mt-4 space-y-2">
        <UploadCoverButton
          track={track}
          onUploaded={onUpdated}
        />

        <UploadAudioButton
          track={track}
          onUploaded={onUpdated}
        />
      </div>

      {track.status !== 'approved' && (
        <button
          onClick={() => onDelete(track._id)}
          className="text-xs text-red-400 hover:text-red-300 mt-2"
        >
          🗑 Delete Track
        </button>
      )}

      {track.status === 'approved' && (
        <p className="text-xs text-gray-500 mt-2">
          🔒 Approved tracks cannot be deleted
        </p>
      )}

    </div>
  )
}
