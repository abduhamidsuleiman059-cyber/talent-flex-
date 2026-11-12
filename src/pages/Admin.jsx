import { useState } from 'react'
import { useVideos } from '../context/VideoContext'
import '../styles/admin.css'
import '../styles/admin-pin.css'

// Badilisha PIN hii upendavyo
const ADMIN_PIN = '808022'
const SESSION_KEY = 'talentflex-admin-ok'

function Admin() {
  const { videos, approveVideo, rejectVideo } = useVideos()

  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === 'yes'
    } catch {
      return false
    }
  })
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')

  const handleUnlock = (e) => {
    e.preventDefault()
    if (pin === ADMIN_PIN) {
      try {
        sessionStorage.setItem(SESSION_KEY, 'yes')
      } catch {
        // hakuna cha kufanya
      }
      setUnlocked(true)
      setPinError('')
    } else {
      setPinError('PIN si sahihi. Jaribu tena.')
      setPin('')
    }
  }

  const handleLock = () => {
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      // hakuna cha kufanya
    }
    setUnlocked(false)
    setPin('')
  }

  if (!unlocked) {
    return (
      <div className="pin-wrapper">
        <form className="pin-card" onSubmit={handleUnlock}>
          <div className="pin-icon">
            <svg
              viewBox="0 0 24 24"
              width="30"
              height="30"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </div>
          <h2>Eneo la Admin</h2>
          <p>Weka PIN kuendelea</p>

          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            className="pin-input"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={8}
            autoFocus
          />

          {pinError && <span className="pin-error">{pinError}</span>}

          <button type="submit" className="pin-submit" disabled={!pin}>
            Fungua
          </button>
        </form>
      </div>
    )
  }

  const pending = videos.filter(v => v.status === 'pending')

  return (
    <div className="admin-wrapper">
      <div className="admin-topbar">
        <h2>Ukaguzi wa Video ({pending.length})</h2>
        <button className="admin-lock" onClick={handleLock}>
          Toka
        </button>
      </div>

      {pending.length === 0 && (
        <p className="admin-empty">Hakuna video inayosubiri ukaguzi kwa sasa.</p>
      )}

      <div className="admin-list">
        {pending.map(video => (
          <div className="admin-card" key={video.id}>
            {video.videoUrl && (
              <video src={video.videoUrl} className="admin-preview" controls />
            )}
            <div className="admin-info">
              <span className="admin-tag">
                {video.category === 'ball' ? '⚽ Ball Skills' : '🎵 Music & Beats'}
              </span>
              <p>{video.caption}</p>
            </div>
            <div className="admin-actions">
              <button className="approve-btn" onClick={() => approveVideo(video.id)}>
                Idhinisha ✓
              </button>
              <button className="reject-btn" onClick={() => rejectVideo(video.id)}>
                Kataa ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Admin