import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
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
  const currentTrack = currentIndex !== null ? queue[currentIndex] : null

  const handlePlay = async (tracks, index) => {
    setQueue(tracks)
    setCurrentIndex(index)

    const track = tracks[index]
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
  }, [token])

  // UI
  const location = useLocation()
  const hideSidebarRoutes = ['/login', '/register']
  const hideSidebar = hideSidebarRoutes.includes(location.pathname)

  return (
    <div className="h-screen flex flex-col bg-black">
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
              />
            }
          />

          <Route
            path="/search"
            element={
              <Search
                onPlay={handlePlay}
                currentTrack={currentTrack}
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
        <PlayerBar
          currentTrack={currentTrack}
          onNext={playNext}
          onPrev={playPrev}
          likedTrackIds={likedTracks.map(i => i._id)}
          onToggleLike={toggleLike}
          playlists={playlists}
          onAddToPlaylist={addTrackToPlaylist}
        />)}
    </div>
  )
}

export default App
