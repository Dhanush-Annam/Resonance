import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, NavLink } from 'react-router-dom'
import { Home as HomeIcon, Search as SearchIcon, Library as LibraryIcon } from 'lucide-react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import PlayerBar from './components/PlayerBar'
import Home from './pages/Home'
import Search from './pages/Search'
import Library from './pages/Library'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import ArtistDashboard from './pages/ArtistDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminCreateTrack from './pages/AdminCreateTrack'
import LikedSongs from './pages/LikedSongs'
import RecentlyPlayed from './pages/RecentlyPlayed'
import CreatePlaylist from './pages/CreatePlaylist'
import Playlists from './pages/Playlists'

function App() {

  // PLAYER STATE
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const currentTrack = currentIndex !== null ? queue[currentIndex] : null

  const handlePlay = async (tracks, index) => {
    const track = tracks[index]

    // If user clicked the track that is ALREADY loaded, toggle play/pause
    if (currentTrack && track && currentTrack._id === track._id) {
      setIsPlaying(prev => !prev)
      return
    }

    setQueue(tracks)
    setCurrentIndex(index)
    setIsPlaying(true)
    const token = sessionStorage.getItem('token')
    if (!track?._id || !token) return

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/recent/${track._id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!res.ok) return

      await fetchRecentlyPlayed()
    }
    catch (err) {
      console.error('Failed to update recently played', err)
    }
  }

  const playNext = () => {
    setCurrentIndex(prev => {
      if (prev === null) { return prev; }
      if (prev + 1 < queue.length) { return prev + 1; }
      return prev;
    })
  }

  const playPrev = () => {
    setCurrentIndex(prev => {
      if (prev === null) { return prev; }
      if (prev - 1 >= 0) { return prev - 1; }
      return prev;
    })
  }

  // LIKES STATE
  const [likedTracks, setLikedTracks] = useState([])
  const token = sessionStorage.getItem('token');

  // PLAYLISTS STATE
  const [playlists, setPlaylists] = useState([])

  const fetchPlaylists = async () => {
    if (!token) {
      setPlaylists([])
      return
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/playlists`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) return

      const data = await res.json()
      setPlaylists(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load playlists', err)
    }
  }

  const addTrackToPlaylist = async (playlistId, trackId) => {
    if (!playlistId || !trackId || !token) return { ok: false }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/playlists/${playlistId}/tracks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ trackId }),
        },
      )

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        return { ok: false, message: data?.message || 'Failed to add track' }
      }

      // Keep Library playlist counts reasonably fresh
      fetchPlaylists()

      return { ok: true }
    } catch (err) {
      console.error('Failed to add track to playlist', err)
      return { ok: false, message: 'Failed to add track' }
    }
  }

  // LOAD LIKES
  useEffect(() => {
    if (!token) {
      setLikedTracks([])
      return
    }

    const fetchLikedSongs = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/library/likes`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        if (!res.ok) return
        const data = await res.json()
        setLikedTracks(data)
      } catch (err) {
        console.error('Failed to load liked songs', err)
      }
    }
    fetchLikedSongs()
  }, [token])

  useEffect(() => {
    fetchPlaylists()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // TOGGLE LIKE
  const toggleLike = async (track) => {
    if (!track?._id || !token) return

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/library/likes/${track._id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!res.ok) return
      const { liked } = await res.json()
      setLikedTracks(prev => {
        if (liked) {
          const alreadyLiked = prev.some(t => t._id === track._id)
          if (alreadyLiked) return prev
          return [track, ...prev]
        }
        else {
          return prev.filter(t => t._id !== track._id)
        }
      })
    }
    catch (err) {
      console.error('Toggle like failed', err)
    }
  }

  // RECENTLY PLAYED
  const [recentlyPlayed, setRecentlyPlayed] = useState([])

  const fetchRecentlyPlayed = async () => {
    if (!token) return

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/recent`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!res.ok) return

      const data = await res.json()
      setRecentlyPlayed(data)
    } catch (err) {
      console.error('Failed to fetch recently played', err)
    }
  }

  useEffect(() => {
    fetchRecentlyPlayed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // UI
  const location = useLocation()
  const hideSidebarRoutes = ['/login', '/register']
  const hideSidebar = hideSidebarRoutes.includes(location.pathname)

  return (
    <div className="h-screen flex flex-col bg-canvas-base text-text-primary">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {!hideSidebar && <Sidebar />}

        <Routes>
          {/* Public */}
          <Route
            path="/"
            element={
              <Home
                onPlay={handlePlay}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
              />
            }
          />

          <Route
            path="/search"
            element={
              <Search
                onPlay={handlePlay}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
              />
            }
          />

          {/* USER , ARTIST , ADMIN */}

          <Route element={<ProtectedRoute roles={['user', 'artist', 'admin']} />}>
            <Route
              path="/library"
              element={
                <Library
                  likedCount={likedTracks.length}
                  recentCount={recentlyPlayed.length}
                  playlists={playlists}
                />
              }
            />

            <Route
              path="/library/playlists/new"
              element={<CreatePlaylist onCreated={fetchPlaylists} />}
            />

            <Route
              path="/library/playlists/:id"
              element={
                <Playlists
                  onPlay={handlePlay}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onPlaylistChanged={fetchPlaylists}
                />
              }
            />
            <Route
              path="/library/liked"
              element={
                <LikedSongs
                  likedTracks={likedTracks}
                  onPlay={handlePlay}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                />
              }
            />
            <Route
              path="/library/recent"
              element={
                <RecentlyPlayed
                  tracks={recentlyPlayed}
                  onPlay={handlePlay}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                />
              }
            />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Artist protected */}
          <Route element={<ProtectedRoute roles={['artist']} />}>
            <Route path="/artist" element={<ArtistDashboard />} />
          </Route>


          {/* Admin (nested & protected) */}
          <Route
            element={<ProtectedRoute roles={['admin']} />}
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/create" element={<AdminCreateTrack />} />
          </Route>
        </Routes>
      </div>

      {!hideSidebar && (
        <>
          <PlayerBar
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(p => !p)}
            onNext={playNext}
            onPrev={playPrev}
            likedTrackIds={likedTracks.map(i => i._id)}
            onToggleLike={toggleLike}
            playlists={playlists}
            onAddToPlaylist={addTrackToPlaylist}
          />

          {/* Mobile Bottom Navigation Bar */}
          <nav
            aria-label="Mobile Navigation"
            className="md:hidden h-14 bg-surface-raised/95 backdrop-blur-xl border-t border-border-rule flex items-center justify-around px-4 select-none z-20"
          >
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus ${
                  isActive
                    ? 'text-text-primary font-medium'
                    : 'text-text-secondary hover:text-text-primary'
                }`
              }
            >
              <HomeIcon className="w-5 h-5" />
              <span className="text-[11px] font-sans tracking-tight">Home</span>
            </NavLink>

            <NavLink
              to="/search"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus ${
                  isActive
                    ? 'text-text-primary font-medium'
                    : 'text-text-secondary hover:text-text-primary'
                }`
              }
            >
              <SearchIcon className="w-5 h-5" />
              <span className="text-[11px] font-sans tracking-tight">Search</span>
            </NavLink>

            <NavLink
              to="/library"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus ${
                  isActive
                    ? 'text-text-primary font-medium'
                    : 'text-text-secondary hover:text-text-primary'
                }`
              }
            >
              <LibraryIcon className="w-5 h-5" />
              <span className="text-[11px] font-sans tracking-tight">Library</span>
            </NavLink>
          </nav>
        </>
      )}
      <SpeedInsights />
      <Analytics />
    </div>
  )
}

export default App
