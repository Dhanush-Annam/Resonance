import { useState } from 'react'
import Sidebar from './components/Sidebar'
import PlayerBar from './components/PlayerBar'
import Home from './pages/Home'

function App() {
  const [currentTrack, setCurrentTrack] = useState(null)

  return (
    <div className="h-screen flex flex-col bg-black">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Home onPlay={setCurrentTrack} />
      </div>

      <PlayerBar currentTrack={currentTrack} />
    </div>
  )
}

export default App
