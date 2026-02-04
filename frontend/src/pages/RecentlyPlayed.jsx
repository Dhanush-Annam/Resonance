export default function RecentlyPlayed({ tracks = [], onPlay, currentTrack }) {

    const trackList = tracks.map(r => r.track)

    return (
        <div className="flex-1 bg-black text-white p-6 overflow-y-auto">
            <h1 className="text-2xl font-bold mb-6">
                🕒 Recently Played
            </h1>

            {trackList.length === 0 ? (
                <p className="text-gray-400">No recently played songs.</p>
            ) : (
                <div className="space-y-2">
                    {trackList.map((track, index) => (
                        <div
                            key={track._id}
                            onClick={() => onPlay(trackList, index)}
                            className={`p-3 rounded cursor-pointer hover:bg-zinc-800 ${currentTrack?._id === track._id
                                    ? 'bg-zinc-800'
                                    : 'bg-zinc-900'
                                }`}
                        >
                            <p className="font-medium">{track.title}</p>
                            <p className="text-sm text-gray-400">
                                {track.artist?.username || 'Unknown Artist'}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
