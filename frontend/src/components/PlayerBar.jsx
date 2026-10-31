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
import Button from './Button'

/**
 * Responsive viewport hook tracking the >=768px desktop breakpoint.
 */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(min-width: 768px)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(min-width: 768px)')
    const onChange = (e) => setIsDesktop(e.matches)

    if (mql.addEventListener) {
      mql.addEventListener('change', onChange)
    } else {
      mql.addListener(onChange)
    }

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', onChange)
      } else {
        mql.removeListener(onChange)
      }
    }
  }, [])

  return isDesktop
}

/**
 * Parses timestamped LRC lyrics into sorted time-coded objects.
 * Preserves the mature binary-search compatible contract from DESIGN.md Section 5.1.
 */
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

/**
 * Binary search to find the active lyric line index for a given timestamp.
 */
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

/**
 * Formats seconds into standard m:ss audio display string.
 */
function formatTime(time) {
  if (!Number.isFinite(time) || time < 0) return '0:00'
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Resonance Design System — Persistent Audio Player Bar (<PlayerBar />)
 *
 * Conforms to DESIGN.md Section 4, 5, and Phase 4 Architecture:
 * - Scrubber Drag Decoupling: pointer drag tracks visually without audio thrashing; commits on release.
 * - Pointer Safety: Pointer capture and pointercancel ensure dragging never gets stuck.
 * - Responsive Breakpoint Duality:
 *     * Desktop (>=768px): Anchored non-modal popover (aria-modal="false", un-trapped focus, catalog interactivity).
 *     * Mobile (<768px): Modal bottom drawer (aria-modal="true", focus trap, background interaction barrier).
 * - Sizing: Docked h-16 on mobile (above bottom nav), h-20 on tablet/desktop.
 * - Timers: JetBrains Mono text-xs text-text-tertiary with tabular-nums.
 * - Controls: 36px off-white circular play button, SkipBack, SkipForward, Liked button.
 * - Audio Continuity: HTML5 <audio> ref management fully preserved; zero stream interruptions.
 */
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
  const isDesktop = useIsDesktop()

  const audioRef = useRef(null)
  const lyricsContainerRef = useRef(null)
  const activeLyricRef = useRef(null)
  const lyricsTriggerRef = useRef(null)
  const lyricsCloseButtonRef = useRef(null)
  const lyricsDialogRef = useRef(null)
  const wasLyricsOpenRef = useRef(false)
  const hadLyricsFocusRef = useRef(false)

  // Scrubber & Audio state
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)

  // Volume state
  const [volume, setVolume] = useState(0.8)
  const [prevVolume, setPrevVolume] = useState(0.8)

  // Playlist popover state
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('')
  const [adding, setAdding] = useState(false)
  const [addStatus, setAddStatus] = useState('')
  const [showPlaylistPopover, setShowPlaylistPopover] = useState(false)

  // Lyrics popover state
  const [showLyricsPopover, setShowLyricsPopover] = useState(false)
  const [lyricsLoading, setLyricsLoading] = useState(false)
  const [lyricsError, setLyricsError] = useState('')
  const [lyricsData, setLyricsData] = useState(null)

  // User scrolling detection for lyrics
  const isUserScrollingRef = useRef(false)
  const userScrollTimeoutRef = useRef(null)

  const isLiked = currentTrack && likedTrackIds.includes(currentTrack._id)

  const playablePlaylists = useMemo(() => {
    return Array.isArray(playlists) ? playlists : []
  }, [playlists])

  // Sync selected playlist
  useEffect(() => {
    if (!selectedPlaylistId && playablePlaylists.length > 0) {
      setSelectedPlaylistId(playablePlaylists[0]._id)
    }
  }, [playablePlaylists, selectedPlaylistId])

  // Audio play/pause sync
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

  // Reset statuses on track switch
  useEffect(() => {
    setAddStatus('')
    setLyricsError('')
    setLyricsData(null)
  }, [currentTrack?._id])

  // Mobile modal scroll lock & focus containment across breakpoint transitions
  useEffect(() => {
    if (!showLyricsPopover) return

    if (!isDesktop) {
      // Mobile modal: lock body scroll
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      // Ensure focus is pulled inside modal dialog if currently outside
      if (!lyricsDialogRef.current?.contains(document.activeElement)) {
        lyricsCloseButtonRef.current?.focus()
      }

      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [showLyricsPopover, isDesktop])

  // Initial focus and focus restoration for lyrics interface
  useEffect(() => {
    if (showLyricsPopover) {
      wasLyricsOpenRef.current = true
      const timer = setTimeout(() => {
        lyricsCloseButtonRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    } else if (wasLyricsOpenRef.current) {
      wasLyricsOpenRef.current = false
      // Restore focus to trigger if focus was inside popover OR on mobile modal
      if (hadLyricsFocusRef.current || !isDesktop) {
        lyricsTriggerRef.current?.focus()
      }
      hadLyricsFocusRef.current = false
    }
  }, [showLyricsPopover, isDesktop])

  // Global Escape key listener for open popovers
  useEffect(() => {
    if (!showLyricsPopover && !showPlaylistPopover) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showLyricsPopover) {
          hadLyricsFocusRef.current = !!lyricsDialogRef.current?.contains(document.activeElement)
          setShowLyricsPopover(false)
        }
        setShowPlaylistPopover(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showLyricsPopover, showPlaylistPopover])

  // Fetch lyrics when lyrics popover opens
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

  // Track manual lyrics container scrolling
  const handleLyricsContainerScroll = () => {
    isUserScrollingRef.current = true
    if (userScrollTimeoutRef.current) clearTimeout(userScrollTimeoutRef.current)
    userScrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false
    }, 3000)
  }

  // Autoscroll lyrics container to active line (only if user is not actively scrolling)
  useEffect(() => {
    if (showLyricsPopover && activeLyricRef.current && !isUserScrollingRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [activeLyricIndex, showLyricsPopover])

  // Volume toggling
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

  // Scrubber drag decoupling handlers (DESIGN.md Section 5.2)
  const handleSeekStart = (e) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch { /* Pointer capture not supported — safe to ignore */ }
    setIsDragging(true)
    setDragTime(currentTime)
  }

  const handleSeekChange = (e) => {
    const nextPercent = parseFloat(e.target.value)
    const effectiveDuration =
      Number.isFinite(duration) && duration > 0
        ? duration
        : (audioRef.current?.duration || 0)
    const nextTime = (nextPercent / 100) * effectiveDuration

    if (isDragging) {
      // Visual feedback only during drag; do not modify audio.currentTime
      if (Number.isFinite(nextTime)) {
        setDragTime(nextTime)
      }
      setProgress(nextPercent)
    } else {
      // Direct keyboard (Arrow keys) or programmatic change; commit immediately
      if (audioRef.current && Number.isFinite(nextTime)) {
        audioRef.current.currentTime = nextTime
      }
      if (Number.isFinite(nextTime)) {
        setCurrentTime(nextTime)
      }
      setProgress(nextPercent)
    }
  }

  const handleSeekCommit = (e) => {
    if (!isDragging) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch { /* Pointer release not supported — safe to ignore */ }
    setIsDragging(false)

    const nextPercent = parseFloat(e.target.value)
    const effectiveDuration =
      Number.isFinite(duration) && duration > 0
        ? duration
        : (audioRef.current?.duration || 0)
    const nextTime = (nextPercent / 100) * effectiveDuration
    if (audioRef.current && Number.isFinite(nextTime)) {
      audioRef.current.currentTime = nextTime
    }
    if (Number.isFinite(nextTime)) {
      setCurrentTime(nextTime)
    }
  }

  const handleSeekCancel = (e) => {
    if (!isDragging) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch { /* Pointer release not supported — safe to ignore */ }
    setIsDragging(false)
    if (audioRef.current && duration > 0) {
      setProgress((audioRef.current.currentTime / duration) * 100)
    }
  }

  const handleCloseLyrics = () => {
    hadLyricsFocusRef.current = !!lyricsDialogRef.current?.contains(document.activeElement)
    setShowLyricsPopover(false)
  }

  const handleLyricsDialogKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      hadLyricsFocusRef.current = true
      setShowLyricsPopover(false)
      return
    }

    // Modal focus trap ONLY on mobile (<768px). Desktop allows natural tabbing between popover and catalog.
    if (!isDesktop && e.key === 'Tab') {
      const dialog = lyricsDialogRef.current
      if (!dialog) return
      const focusable = dialog.querySelectorAll('button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const displayTime = isDragging ? dragTime : currentTime

  // Empty state: no track selected
  if (!currentTrack) {
    return (
      <div className="h-16 md:h-20 bg-surface-raised/95 backdrop-blur-xl border-t border-border-rule flex items-center justify-center text-text-tertiary text-xs sm:text-sm font-sans select-none z-30 transition-all">
        <Music2 className="w-4 h-4 mr-2 text-text-tertiary opacity-60" />
        <span>Select a track to start listening</span>
      </div>
    )
  }

  return (
    <div className="relative h-16 md:h-20 bg-surface-raised/95 backdrop-blur-xl border-t border-border-rule flex items-center justify-between px-3 sm:px-6 select-none z-30 transition-all">
      {/* LEFT: Track Metadata & Artwork */}
      <div className="flex items-center gap-2.5 sm:gap-3 w-1/3 min-w-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden bg-surface-elevated border border-border-rule shrink-0 shadow-sm relative">
          <img
            src={cloudinaryCoverUrl(currentTrack.coverUrl || '/placeholder.png', {
              w: 200,
              h: 200,
            })}
            alt={currentTrack.title ? `${currentTrack.title} cover` : 'Current track cover'}
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="min-w-0 pr-1">
          <p
            className="text-text-primary text-xs sm:text-sm font-medium truncate font-sans hover:underline cursor-pointer"
            title={currentTrack.title}
          >
            {currentTrack.title}
          </p>
          <p
            className="text-[11px] sm:text-xs text-text-secondary truncate font-sans"
            title={currentTrack.artist?.username || 'Unknown Artist'}
          >
            {currentTrack.artist?.username || 'Unknown Artist'}
          </p>
        </div>

        {/* Favorite / Like Button */}
        <button
          type="button"
          onClick={() => onToggleLike(currentTrack)}
          className="p-1 sm:p-1.5 text-text-secondary hover:text-text-primary transition shrink-0 ml-0.5 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus"
          title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
          aria-label={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
        >
          <Heart
            className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform active:scale-125 ${
              isLiked
                ? 'fill-accent-brand text-accent-brand'
                : 'text-text-tertiary hover:text-text-primary hover:scale-105'
            }`}
          />
        </button>
      </div>

      {/* CENTER: Player Controls & Decoupled Scrubber */}
      <div className="flex flex-col items-center w-full max-w-xl px-2 sm:px-4">
        {/* Playback Action Buttons */}
        <div className="flex items-center gap-3 sm:gap-5 mb-0.5 sm:mb-1">
          <button
            type="button"
            className="text-text-secondary hover:text-text-primary transition disabled:opacity-30 p-1 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus"
            onClick={onPrev}
            title="Previous Track"
            aria-label="Previous Track"
          >
            <SkipBack className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current" />
          </button>

          {/* 36px Circular Off-White Play Button */}
          <button
            type="button"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#f5f2eb] hover:bg-[#e2dfd7] text-[#101114] flex items-center justify-center shadow-md shadow-black/60 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-[#101114]" />
            ) : (
              <Play className="w-4 h-4 fill-[#101114] ml-0.5" />
            )}
          </button>

          <button
            type="button"
            className="text-text-secondary hover:text-text-primary transition disabled:opacity-30 p-1 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus"
            onClick={onNext}
            title="Next Track"
            aria-label="Next Track"
          >
            <SkipForward className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current" />
          </button>
        </div>

        {/* Seekbar and Timers with Tabular Numbers */}
        <div className="flex items-center gap-2 sm:gap-2.5 w-full">
          <span className="text-[10px] sm:text-xs text-text-tertiary w-8 sm:w-9 text-right font-mono tabular-nums shrink-0 select-none">
            {formatTime(displayTime)}
          </span>

          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress || 0}
            onPointerDown={handleSeekStart}
            onChange={handleSeekChange}
            onPointerUp={handleSeekCommit}
            onPointerCancel={handleSeekCancel}
            aria-label="Seek track position"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={Math.round(progress)}
            aria-valuetext={`${formatTime(displayTime)} of ${formatTime(duration)}`}
            className="w-full h-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus"
            title="Seek"
          />

          <span className="text-[10px] sm:text-xs text-text-tertiary w-8 sm:w-9 font-mono tabular-nums shrink-0 select-none">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* RIGHT: Actions (Lyrics, Add to Playlist, Volume) */}
      <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 w-1/3 min-w-0">
        <button
          ref={lyricsTriggerRef}
          type="button"
          onClick={() => {
            if (showLyricsPopover) {
              handleCloseLyrics()
            } else {
              setShowLyricsPopover(true)
              setShowPlaylistPopover(false)
            }
          }}
          aria-expanded={showLyricsPopover}
          aria-haspopup="dialog"
          aria-label="Toggle Synchronized Lyrics"
          className={`h-7 sm:h-8 px-2 sm:px-3 rounded-full border text-xs font-medium flex items-center gap-1.5 transition select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus ${
            showLyricsPopover
              ? 'bg-surface-elevated border-border-focus text-text-primary ring-1 ring-border-focus/30'
              : 'bg-surface-raised border-border-rule hover:border-border-control text-text-secondary hover:text-text-primary hover:bg-surface-hover'
          }`}
          title="Toggle Lyrics"
        >
          <Mic2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-sans">Lyrics</span>
        </button>

        {typeof onAddToPlaylist === 'function' && (
          <button
            type="button"
            onClick={() => {
              setShowPlaylistPopover((v) => !v)
              setShowLyricsPopover(false)
            }}
            aria-expanded={showPlaylistPopover}
            aria-label="Add track to playlist"
            className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full border flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus ${
              showPlaylistPopover
                ? 'bg-surface-elevated border-border-focus text-text-primary ring-1 ring-border-focus/30'
                : 'bg-surface-raised border-border-rule hover:border-border-control text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
            title="Add to Playlist"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        {/* Volume controls (hidden on mobile to preserve layout integrity) */}
        <div className="hidden md:flex items-center gap-2 pl-2">
          <button
            type="button"
            onClick={toggleMute}
            className="text-text-secondary hover:text-text-primary transition p-1 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus"
            title={volume === 0 ? 'Unmute' : 'Mute'}
            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
          >
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-status-rejected-fg" />
            ) : (
              <Volume2 className="w-4 h-4 text-text-secondary" />
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
            aria-label="Volume slider"
            aria-valuemin="0"
            aria-valuemax="1"
            aria-valuenow={volume}
            className="w-18 lg:w-22 h-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus"
            title="Volume"
          />
        </div>
      </div>

      {/* Add-to-playlist Popover Sheet */}
      {showPlaylistPopover && typeof onAddToPlaylist === 'function' && (
        <div
          role="dialog"
          aria-label="Add to Playlist"
          className="absolute right-3 sm:right-6 bottom-18 sm:bottom-24 w-72 sm:w-80 bg-surface-elevated/95 backdrop-blur-xl border border-border-rule shadow-level-3 rounded-lg p-4 animate-in fade-in zoom-in-95 duration-150 z-40"
        >
          <div className="flex items-center justify-between mb-3 border-b border-border-subtle pb-2">
            <p className="text-sm font-medium text-text-primary flex items-center gap-2 font-sans">
              <Plus className="w-4 h-4 text-accent-text" /> Add to Playlist
            </p>
            <button
              type="button"
              onClick={() => setShowPlaylistPopover(false)}
              className="text-text-secondary hover:text-text-primary p-1 rounded-sm hover:bg-surface-hover transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus"
              title="Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {playablePlaylists.length === 0 ? (
            <div className="space-y-3 font-sans">
              <p className="text-xs text-text-secondary">
                You haven&apos;t created any playlists yet.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowPlaylistPopover(false)
                  navigate('/library/playlists/new')
                }}
                className="w-full"
              >
                Create new playlist
              </Button>
            </div>
          ) : (
            <div className="space-y-3 font-sans">
              <select
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                className="w-full bg-surface-raised border border-border-control text-text-primary text-xs rounded-sm px-3 py-2 outline-none focus:border-border-focus transition font-sans"
              >
                {playablePlaylists.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
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
                        setAddStatus(result?.message || 'Failed to add')
                      }
                    } finally {
                      setAdding(false)
                    }
                  }}
                  disabled={adding}
                  isLoading={adding}
                  className="flex-1"
                >
                  Add to Playlist
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowPlaylistPopover(false)
                    navigate('/library/playlists/new')
                  }}
                >
                  New
                </Button>
              </div>

              {addStatus && (
                <p
                  className={`text-xs text-center font-medium font-sans ${
                    addStatus.includes('success')
                      ? 'text-status-approved-fg'
                      : 'text-status-rejected-fg'
                  }`}
                >
                  {addStatus}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile Modal Backdrop (dimmed barrier preventing background interaction on mobile) */}
      {showLyricsPopover && !isDesktop && (
        <div
          role="presentation"
          onClick={handleCloseLyrics}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Lyrics Drawer (Mobile Modal) / Popover Sheet (Desktop Non-Modal) */}
      {showLyricsPopover && (
        <div
          ref={lyricsDialogRef}
          role="dialog"
          aria-modal={!isDesktop ? 'true' : 'false'}
          aria-labelledby="lyrics-dialog-title"
          aria-describedby="lyrics-dialog-description"
          onKeyDown={handleLyricsDialogKeyDown}
          className="fixed inset-x-3 bottom-18 md:inset-auto md:absolute md:right-4 md:bottom-24 w-auto md:w-88 lg:w-96 max-h-[70vh] md:max-h-96 bg-surface-elevated/95 backdrop-blur-xl border border-border-rule shadow-level-3 rounded-lg p-4 animate-in fade-in zoom-in-95 duration-150 z-50 md:z-40 flex flex-col"
        >
          <div className="flex items-start justify-between mb-3 border-b border-border-subtle pb-2 shrink-0">
            <div className="min-w-0 pr-2">
              <h2
                id="lyrics-dialog-title"
                className="text-sm font-serif font-medium text-text-primary flex items-center gap-2 truncate"
              >
                <Mic2 className="w-4 h-4 text-accent-text shrink-0" />
                <span className="truncate">{currentTrack.title} — Lyrics</span>
              </h2>
              <p id="lyrics-dialog-description" className="sr-only">
                Synchronized lyrics for {currentTrack.title} by{' '}
                {currentTrack.artist?.username || 'Unknown Artist'}
              </p>
            </div>
            <button
              ref={lyricsCloseButtonRef}
              type="button"
              onClick={handleCloseLyrics}
              className="text-text-secondary hover:text-text-primary p-1 rounded-sm hover:bg-surface-hover transition shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus"
              title="Close Lyrics"
              aria-label="Close Lyrics"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {lyricsLoading && (
            <div className="py-12 text-center text-xs text-text-tertiary font-sans animate-pulse">
              Retrieving synchronized lyrics…
            </div>
          )}

          {!lyricsLoading && lyricsError && (
            <div className="py-12 text-center text-xs text-text-tertiary font-sans">
              {lyricsError}
            </div>
          )}

          {!lyricsLoading && !lyricsError && lyricsData && (
            <div
              ref={lyricsContainerRef}
              onScroll={handleLyricsContainerScroll}
              className="flex-1 overflow-y-auto space-y-2 pr-1 text-center select-text scroll-smooth"
            >
              {syncedLines.length > 0 ? (
                syncedLines.map((l, idx) => (
                  <p
                    key={`${l.time}-${idx}`}
                    ref={idx === activeLyricIndex ? activeLyricRef : null}
                    className={`transition-all duration-200 ${
                      idx === activeLyricIndex
                        ? 'font-serif font-bold text-base sm:text-lg text-text-primary py-1.5 scale-102'
                        : 'font-sans text-xs sm:text-sm text-text-tertiary hover:text-text-secondary py-0.5'
                    }`}
                  >
                    {l.text || '…'}
                  </p>
                ))
              ) : lyricsData?.plainLyrics ? (
                lyricsData.plainLyrics
                  .split(/\r?\n/)
                  .filter(Boolean)
                  .map((line, idx) => (
                    <p key={idx} className="font-sans text-xs sm:text-sm text-text-secondary py-1">
                      {line}
                    </p>
                  ))
              ) : (
                <div className="py-12 text-center text-xs text-text-tertiary font-sans">
                  No lyrics available for this track
                </div>
              )}
            </div>
          )}

          {!lyricsLoading && !lyricsError && !lyricsData && (
            <div className="py-12 text-center text-xs text-text-tertiary font-sans">
              No lyrics available for this track
            </div>
          )}
        </div>
      )}

      {/* HTML5 Audio Element — Fully Preserved Architecture */}
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        onLoadedMetadata={() => {
          if (!audioRef.current) return
          const dur = audioRef.current.duration || 0
          setDuration(dur)
        }}
        onTimeUpdate={() => {
          if (!audioRef.current || isDragging) return
          const current = audioRef.current.currentTime
          const dur = audioRef.current.duration || 0

          setCurrentTime(current)
          setDuration(dur)
          setProgress(dur > 0 ? (current / dur) * 100 : 0)
        }}
        onEnded={() => {
          onNext?.()
        }}
      />
    </div>
  )
}
