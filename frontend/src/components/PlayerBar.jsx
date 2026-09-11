import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Volume2,
  VolumeX,
  Plus,
  Mic2,
  X,
  Music2,
} from 'lucide-react'
import { cloudinaryCoverUrl } from '../utils/cloudinary'

function parseLyrics(lyrics) {
  if (typeof lyrics !== 'string' || !lyrics.trim()) return []

  const results = []
  const lines = lyrics.split(/\r?\n/)
  const timeTag = /\[(\d{2}):(\d{2})(?:\.(\d{1,2}))?\]/g

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line) {
      continue
    }
    let match
    const times = []
    while ((match = timeTag.exec(line)) !== null) {
      const minutes = Number(match[1])
      const seconds = Number(match[2])
      const fraction = match[3] ? Number(match[3].padEnd(2, '0')) : 0
      if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || !Number.isFinite(fraction)) {
        continue
      }
      const time = minutes * 60 + seconds + fraction / 100
      times.push(time)
    }

    const text = line.replace(timeTag, '').trim()
    if (!times.length) {
      continue
    }

    for (const time of times) {
      results.push({ time, text })
    }
  }

  results.sort((a, b) => a.time - b.time)
  return results
}

function findActiveIndex(lines, currentTimeSeconds) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return -1
  }
  const t = Number(currentTimeSeconds)
  if (!Number.isFinite(t)) {
    return -1
  }

  let low = 0
  let high = lines.length - 1
  let ans = -1

  while (low <= high) {
    const mid = (low + high) >> 1
    if (lines[mid].time <= t) {
      ans = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return ans
}

export default function PlayerBar({
  currentTrack,
  isPlaying = false,
  onTogglePlay,
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
  const [prevVolume, setPrevVolume] = useState(0.8)
  const [currentTime, setCurrentTime] = useState(0)
  const isLiked = currentTrack && likedTrackIds.includes(currentTrack._id)

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

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return

    if (isPlaying) {
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play prevented:', err)
        })
      }
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, currentTrack])

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume)
      setVolume(0)
      if (audioRef.current) audioRef.current.volume = 0
    } else {
      const restored = prevVolume || 0.8
      setVolume(restored)
      if (audioRef.current) audioRef.current.volume = restored
    }
  }

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }


  useEffect(() => {
    setAddStatus('')
  }, [currentTrack?._id])

  useEffect(() => {
    setLyricsError('')
    setLyricsData(null)
  }, [currentTrack?._id])

  useEffect(() => {
    if (!showLyricsPopover) return
    if (!currentTrack?.title) return

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
        if (!active) return
        setLyricsData(data)
      } catch (err) {
        if (!active) return
        if (err?.name === 'AbortError') return
        setLyricsError(err?.message || 'Failed to load lyrics')
      } finally {
        if (active) {
          setLyricsLoading(false)
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
      <div className="h-20 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 flex items-center justify-center text-zinc-500 text-xs sm:text-sm font-medium">
        <Music2 className="w-4 h-4 mr-2 text-zinc-600 animate-pulse" />
        Select a track to start listening
      </div>
    )
  }

  return (
    <div className="relative h-20 sm:h-22 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 flex items-center justify-between px-3 sm:px-6 select-none z-30">
      {/* LEFT: Track Metadata & Artwork */}
      <div className="flex items-center gap-3 w-1/3 min-w-0">
        <img
          src={cloudinaryCoverUrl(currentTrack.coverUrl || '/placeholder.png', { w: 200, h: 200 })}
          alt={currentTrack.title}
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-md object-cover shrink-0 shadow-md border border-zinc-800"
        />
        <div className="min-w-0 pr-1">
          <p className="text-white text-xs sm:text-sm font-semibold truncate hover:underline cursor-pointer">
            {currentTrack.title}
          </p>
          <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
            {currentTrack.artist?.username || 'Unknown Artist'}
          </p>
        </div>

        {/* Favorite / Like Button */}
        <button
          onClick={() => onToggleLike(currentTrack)}
          className="p-1 text-zinc-400 hover:text-white transition shrink-0 ml-1"
          title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
        >
          <Heart
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform active:scale-125 ${
              isLiked ? 'fill-emerald-500 text-emerald-500' : 'hover:scale-110'
            }`}
          />
        </button>
      </div>

      {/* CENTER: Player Controls & Seekbar */}
      <div className="flex flex-col items-center w-full max-w-xl px-2 sm:px-4">
        {/* Buttons */}
        <div className="flex items-center gap-4 sm:gap-6 mb-1">
          <button
            className="text-zinc-400 hover:text-white transition disabled:opacity-30 p-1"
            onClick={onPrev}
            title="Previous Track"
          >
            <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </button>

          <button
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black" />
            ) : (
              <Play className="w-4 h-4 fill-black ml-0.5" />
            )}
          </button>

          <button
            className="text-zinc-400 hover:text-white transition disabled:opacity-30 p-1"
            onClick={onNext}
            title="Next Track"
          >
            <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </button>
        </div>

        {/* Seekbar and Timers */}
        <div className="flex items-center gap-2 w-full">
          <span className="text-[10px] sm:text-xs text-zinc-400 w-8 text-right font-mono">
            {formatTime(currentTime)}
          </span>

          <input
            type="range"
            min="0"
            max="100"
            value={progress || 0}
            onChange={(e) => {
              const time = (Number(e.target.value) / 100) * duration
              if (audioRef.current) {
                audioRef.current.currentTime = time
              }
              setCurrentTime(time)
            }}
            className="w-full h-1"
            title="Seek"
          />

          <span className="text-[10px] sm:text-xs text-zinc-400 w-8 font-mono">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* RIGHT: Actions (Lyrics, Add to Playlist, Volume) */}
      <div className="flex items-center justify-end gap-2 sm:gap-3 w-1/3 min-w-0">
        <button
          onClick={() => {
            setShowLyricsPopover((v) => !v)
            setShowPlaylistPopover(false)
          }}
          className={`h-8 px-2.5 sm:px-3 rounded-full border text-xs font-medium flex items-center gap-1.5 transition ${
            showLyricsPopover
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white'
          }`}
          title="Toggle Lyrics"
        >
          <Mic2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Lyrics</span>
        </button>

        {typeof onAddToPlaylist === 'function' && (
          <button
            onClick={() => {
              setShowPlaylistPopover((v) => !v)
              setShowLyricsPopover(false)
            }}
            className={`h-8 w-8 rounded-full border flex items-center justify-center transition ${
              showPlaylistPopover
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white'
            }`}
            title="Add to Playlist"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        {/* Volume controls (hidden on small mobile to avoid layout collision) */}
        <div className="hidden md:flex items-center gap-2 pl-2">
          <button
            onClick={toggleMute}
            className="text-zinc-400 hover:text-white transition p-1"
            title={volume === 0 ? 'Unmute' : 'Mute'}
          >
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-zinc-400" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => {
              const val = Number(e.target.value)
              setVolume(val)
              if (audioRef.current) {
                audioRef.current.volume = val
              }
            }}
            className="w-20 lg:w-24 h-1"
            title="Volume"
          />
        </div>
      </div>

      {/* Add-to-playlist Popover */}
      {showPlaylistPopover && typeof onAddToPlaylist === 'function' && (
        <div className="absolute right-4 bottom-24 w-80 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/80 shadow-2xl rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> Add to Playlist
            </p>
            <button
              onClick={() => setShowPlaylistPopover(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {playablePlaylists.length === 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400">You haven&apos;t created any playlists yet.</p>
              <button
                onClick={() => {
                  setShowPlaylistPopover(false)
                  navigate('/library/playlists/new')
                }}
                className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition"
              >
                Create new playlist
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <select
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-emerald-500 transition"
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
                        setAddStatus('Added successfully!')
                        setTimeout(() => setShowPlaylistPopover(false), 800)
                      } else {
                        setAddStatus(result?.message || 'Failed')
                      }
                    } finally {
                      setAdding(false)
                    }
                  }}
                  disabled={adding}
                  className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs disabled:opacity-60 transition"
                >
                  {adding ? 'Adding…' : 'Add to Playlist'}
                </button>
                <button
                  onClick={() => {
                    setShowPlaylistPopover(false)
                    navigate('/library/playlists/new')
                  }}
                  className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs border border-zinc-700 transition"
                >
                  New
                </button>
              </div>

              {addStatus && (
                <p className="text-xs text-emerald-400 text-center font-medium">{addStatus}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lyrics Popover */}
      {showLyricsPopover && (
        <div className="absolute right-4 bottom-24 w-80 sm:w-96 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/80 shadow-2xl rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-emerald-400" />
              <span>{currentTrack.title} — Lyrics</span>
            </p>
            <button
              onClick={() => setShowLyricsPopover(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {lyricsLoading && (
            <div className="py-8 text-center text-xs text-zinc-400 animate-pulse">
              Finding synced lyrics…
            </div>
          )}

          {!lyricsLoading && lyricsError && (
            <div className="py-8 text-center text-xs text-zinc-500">
              {lyricsError}
            </div>
          )}

          {!lyricsLoading && !lyricsError && lyricsData && (
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1 text-center select-text">
              {syncedLines.length > 0 ? (
                syncedLines.map((l, idx) => (
                  <p
                    key={`${l.time}-${idx}`}
                    className={`text-xs sm:text-sm transition-all duration-200 ${
                      idx === activeLyricIndex
                        ? 'font-bold scale-105 text-emerald-400 py-1'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {l.text || '…'}
                  </p>
                ))
              ) : (
                (lyricsData?.plainLyrics || '')
                  .split(/\r?\n/)
                  .filter(Boolean)
                  .map((line, idx) => (
                    <p key={idx} className="text-xs sm:text-sm text-zinc-400 py-0.5">
                      {line}
                    </p>
                  ))
              )}
            </div>
          )}
        </div>
      )}

      {/* HTML5 Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        onTimeUpdate={() => {
          if (!audioRef.current) return
          const current = audioRef.current.currentTime
          const dur = audioRef.current.duration || 0

          setCurrentTime(current)
          setDuration(dur)
          setProgress(dur ? (current / dur) * 100 : 0)
        }}
        onEnded={() => {
          onNext?.()
        }}
      />
    </div>
  )
}
