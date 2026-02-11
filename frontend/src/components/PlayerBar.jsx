import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function parseLyrics(lyrics) {
  if (typeof lyrics !== 'string' || !lyrics.trim()) return []

  const results = []
  const lines = lyrics.split(/\r?\n/)
  const timeTag = /\[(\d{2}):(\d{2})(?:\.(\d{1,2}))?\]/g

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line){
      continue;
    }
    let match
    const times = []
    while ((match = timeTag.exec(line)) !== null) {
      const minutes = Number(match[1])
      const seconds = Number(match[2])
      const fraction = match[3] ? Number(match[3].padEnd(2, '0')) : 0
      if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || !Number.isFinite(fraction)){
        continue;
      }
      const time = minutes * 60 + seconds + fraction / 100
      times.push(time)
    }

    const text = line.replace(timeTag, '').trim()
    if (!times.length){
      continue;
    }

    for (const time of times) {
      results.push({ time, text })
    }
  }

  results.sort((a, b) => a.time - b.time)
  return results;
}

function findActiveIndex(lines, currentTimeSeconds) {
  if (!Array.isArray(lines) || lines.length === 0){
    return -1;
  }
  const t = Number(currentTimeSeconds)
  if (!Number.isFinite(t)){
    return -1;
  }

  let low = 0
  let high = lines.length - 1
  let ans = -1

  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lines[mid].time <= t) {
      ans = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return ans;
}

export default function PlayerBar({
  currentTrack,
  onNext,
  onPrev,
  likedTrackIds = [],
  onToggleLike,
  playlists = [],
  onAddToPlaylist,
}) {
  const navigate = useNavigate()
  const audioRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const isLiked =  currentTrack && likedTrackIds.includes(currentTrack._id)

  const playablePlaylists = useMemo(() => {
    return Array.isArray(playlists) ? playlists : []
  }, [playlists])

  const [selectedPlaylistId, setSelectedPlaylistId] = useState('')
  const [adding, setAdding] = useState(false)
  const [addStatus, setAddStatus] = useState('')
  const [showPlaylistPopover, setShowPlaylistPopover] = useState(false)

  const [showLyricsPopover, setShowLyricsPopover] = useState(false)
  const [lyricsLoading, setLyricsLoading] = useState(false)
  const [lyricsError, setLyricsError] = useState('')
  const [lyricsData, setLyricsData] = useState(null)

  useEffect(() => {
    if (!selectedPlaylistId && playablePlaylists.length > 0) {
      setSelectedPlaylistId(playablePlaylists[0]._id)
    }
  }, [playablePlaylists, selectedPlaylistId])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }


  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [currentTrack])

  useEffect(() => {
    setAddStatus('')
  }, [currentTrack?._id])

  useEffect(() => {
    setLyricsError('')
    setLyricsData(null)
  }, [currentTrack?._id])

  useEffect(() => {
    if (!showLyricsPopover){
      return;
    }
    if (!currentTrack?.title){
      return;
    }

    const controller = new AbortController()
    let active = true

    const fetchLyrics = async () => {
      try {
        setLyricsLoading(true)
        setLyricsError('')

        const params = new URLSearchParams({
          track_name: currentTrack.title,
        })

        if (Number.isFinite(duration) && duration > 0) {
          params.set('duration', String(Math.round(duration)))
        }

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/lyrics?${params.toString()}`,
          { signal: controller.signal }
        )

        if (!res.ok) {
          const message = res.status === 404 ? 'Lyrics not found' : 'Failed to load lyrics'
          throw new Error(message)
        }

        const data = await res.json()
        if (!active){
          return;
        }
        setLyricsData(data)
      }
      catch (err) {
        if (!active){
          return;
        }
        if (err?.name === 'AbortError'){
          return;
        }
        setLyricsError(err?.message || 'Failed to load lyrics')
      }
      finally {
        if (active){
          setLyricsLoading(false);
        }
      }
    }

    fetchLyrics()
    return () => {
      active = false
      controller.abort()
    }
  }, [showLyricsPopover, currentTrack?.title, duration])

  const syncedLines = useMemo(() => {
    return parseLyrics(lyricsData?.syncedLyrics)
  }, [lyricsData?.syncedLyrics])

  const activeLyricIndex = useMemo(() => {
    return findActiveIndex(syncedLines, currentTime)
  }, [syncedLines, currentTime])

  if (!currentTrack) {
    return (
      <div className="h-20 bg-zinc-900 border-t border-zinc-800 flex items-center justify-center text-gray-400">
        Select a track to play
      </div>
    )
  }

  return (
    <div className="relative h-20 bg-zinc-900 border-t border-zinc-800 flex items-center px-4">

      {/* LEFT: Track Info */}
      <div className="flex items-center gap-4 w-1/3">
        <img
          src={currentTrack.coverUrl || '/placeholder.png'}
          className="h-14 w-14 rounded object-cover"
        />
        <div>
          <p className="text-white text-sm font-semibold">
            {currentTrack.title}
          </p>
          <p className="text-xs text-gray-400">
            {currentTrack.artist?.username || 'Unknown Artist'}
          </p>
        </div>
        <div>
          {currentTrack && (
          <button
            onClick={() => onToggleLike(currentTrack)}
            className="ml-3 text-xl"
            title={isLiked ? 'Unlike' : 'Like'}
          >
          {isLiked ? '❤️' : '🤍'}
          </button>
          )}
        </div>
      </div>

      {/* CENTER: Controls */}
      <div className="flex flex-col items-center w-1/3">
        <div className="flex items-center gap-4 mb-1">
          <button 
            className="text-gray-400 hover:text-white"
            onClick={onPrev}
            >
            ⏮
          </button>

          <button
            className=" text-black rounded-full h-8 w-8 flex items-center justify-center"
            onClick={togglePlay}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button 
            className="text-gray-400 hover:text-white"
            onClick={onNext}
            >
            ⏭
            </button>
        </div>

        <div className="flex items-center gap-2 w-full">
          <span className="text-xs text-gray-400">
            {formatTime(currentTime)}
          </span>

          <input
            type="range"
            value={progress}
            onChange={(e) => {
              const time = (e.target.value / 100) * duration
              audioRef.current.currentTime = time
              setCurrentTime(time)
            }}
            className="w-full"
          />
          <span className="text-xs text-gray-400">
            {formatTime(duration)}
          </span>

        </div>
      </div>

      {/* RIGHT: Volume */}
      <div className="flex items-center justify-end gap-3 w-1/3">
        <button
          onClick={() => {
            setShowLyricsPopover((v) => !v)
            setShowPlaylistPopover(false)
          }}
          className="h-9 px-3 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-sm"
          title="Lyrics"
        >
          Lyrics
        </button>

        {typeof onAddToPlaylist === 'function' && (
          <button
            onClick={() => setShowPlaylistPopover((v) => !v)}
            className="h-9 w-9 rounded bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center"
            title="Add to playlist"
          >
            +
          </button>
        )}

        <span className="text-gray-400">🔊</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          className="w-24"
        />
      </div>

      {/* Add-to-playlist popover */}
      {showPlaylistPopover && typeof onAddToPlaylist === 'function' && (
        <div className="absolute right-4 bottom-24 w-72 bg-zinc-900 border border-zinc-800 rounded p-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">Add to playlist</p>
            <button
              onClick={() => setShowPlaylistPopover(false)}
              className="text-xs text-gray-400 hover:text-white"
              title="Close"
            >
              ✕
            </button>
          </div>

          {playablePlaylists.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">No playlists yet.</p>
              <button
                onClick={() => {
                  setShowPlaylistPopover(false)
                  navigate('/library/playlists/new')
                }}
                className="w-full px-3 py-2 rounded bg-zinc-200 text-black hover:bg-white text-sm"
              >
                Create new playlist
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <select
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                className="w-full bg-zinc-800 text-white text-sm rounded px-2 py-2 outline-none"
              >
                {playablePlaylists.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (!selectedPlaylistId || !currentTrack?._id) return

                    try {
                      setAdding(true)
                      setAddStatus('')
                      const result = await onAddToPlaylist(
                        selectedPlaylistId,
                        currentTrack._id,
                      )
                      if (result?.ok) {
                        setAddStatus('Added')
                        setShowPlaylistPopover(false)
                      } else {
                        setAddStatus(result?.message || 'Failed')
                      }
                    }
                    finally {
                      setAdding(false)
                    }
                  }}
                  disabled={adding}
                  className="flex-1 px-3 py-2 rounded bg-zinc-200 text-black hover:bg-white text-sm disabled:opacity-60"
                >
                  {adding ? 'Adding…' : 'Add'}
                </button>
                <button
                  onClick={() => {
                    setShowPlaylistPopover(false)
                    navigate('/library/playlists/new')
                  }}
                  className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-sm"
                >
                  New
                </button>
              </div>

              {addStatus && (
                <p className="text-xs text-gray-400">{addStatus}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lyrics popover */}
      {showLyricsPopover && (
        <div className="absolute right-4 bottom-24 w-96 bg-zinc-900 border border-zinc-800 rounded p-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">Lyrics</p>
            <button
              onClick={() => setShowLyricsPopover(false)}
              className="text-xs text-gray-400 hover:text-white"
              title="Close"
            >
              ✕
            </button>
          </div>

          {lyricsLoading && (
            <p className="text-sm text-gray-400">Loading…</p>
          )}

          {!lyricsLoading && lyricsError && (
            <p className="text-sm text-gray-400">{lyricsError}</p>
          )}

          {!lyricsLoading && !lyricsError && lyricsData && (
            <div className="max-h-72 overflow-y-auto space-y-1">
              {syncedLines.length > 0 ? (
                syncedLines.map((l, idx) => (
                  <p
                    key={`${l.time}-${idx}`}
                    className={
                      idx === activeLyricIndex
                        ? 'text-sm text-white font-semibold'
                        : 'text-sm text-gray-400'
                    }
                  >
                    {l.text || '…'}
                  </p>
                ))
              ) : (
                (lyricsData?.plainLyrics || '')
                  .split(/\r?\n/)
                  .filter(Boolean)
                  .map((line, idx) => (
                    <p key={idx} className="text-sm text-gray-400">
                      {line}
                    </p>
                  ))
              )}
            </div>
          )}
        </div>
      )}

      {/* AUDIO */}
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        onTimeUpdate={() => {
          const current = audioRef.current.currentTime
          const dur = audioRef.current.duration || 0

          setCurrentTime(current)
          setDuration(dur)
          setProgress(dur ? (current / dur) * 100 : 0)
        }}
        onEnded={() => {
          setIsPlaying(false)
          onNext?.()
          }
        }
        autoPlay
      />

    </div>
  )
}
