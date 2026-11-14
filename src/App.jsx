import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { VideoProvider } from './context/VideoContext'
import { ChatProvider } from './context/ChatContext'
import Feed from './pages/Feed'
import Explore from './pages/Explore'
import Friends from './pages/Friends'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Upload from './pages/Upload'
import Admin from './pages/Admin'
import Navbar from './components/Navbar'
import Splash from './components/Splash'

const SPLASH_MS = 2500
const FADE_MS = 500

function App() {
  // show -> fade -> done
  const [phase, setPhase] = useState('show')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fade'), SPLASH_MS)
    const t2 = setTimeout(() => setPhase('done'), SPLASH_MS + FADE_MS)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  return (
    <VideoProvider>
      <ChatProvider>
        {/* App inapakia wakati splash inafifia, ili video zisicheze nyuma yake */}
        {phase !== 'show' && (
          <HashRouter>
            <div className="app-container">
              <Routes>
                <Route path="/" element={<Feed />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/messages/:user" element={<Chat />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
              <Navbar />
            </div>
          </HashRouter>
        )}

        {phase !== 'done' && <Splash fading={phase === 'fade'} />}
      </ChatProvider>
    </VideoProvider>
  )
}

export default App