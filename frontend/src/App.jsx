import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import PlayerBar from './components/PlayerBar'
import Home from './pages/Home'
import Search from './pages/Search'
import Library from './pages/Library'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  const [currentTrack, setCurrentTrack] = useState(null)

  return (
    <div className="h-screen flex flex-col bg-black">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <Routes>
          <Route
            path="/"
            element={
              <Home
                onPlay={setCurrentTrack}
                currentTrack={currentTrack}
              />
            }
          />
          <Route
            path="/search"
            element={
              <Search
                onPlay={setCurrentTrack}
                currentTrack={currentTrack}
              />
            }
          />
          <Route path="/library" element={<Library />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>

      <PlayerBar currentTrack={currentTrack} />
    </div>
  )
}

export default App
