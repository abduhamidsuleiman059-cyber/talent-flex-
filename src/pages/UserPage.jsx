import { useState, useEffect } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { useVideos } from '../context/VideoContext'
import VideoCard from '../components/VideoCard'
import Avatar from '../components/Avatar'
import TileGlyph from '../components/TileGlyph'
import { avatarGradient } from '../utils/avatar'
import { displayName } from '../utils/displayName'
import { getFilterCss } from '../utils/videoFilters'
import '../styles/explore.css'
import '../styles/profile-cover.css'
import '../styles/userpage.css'

const ME = '@wewe'

function safeDecode(value) {
  try {
    return decodeURIComponent(value || '')
  } catch {
    return value || ''
  }
}

function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K'
  return String(n)
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
      <path d="M12 21s-6.7-4.3-9.5-8.2C.6 9.9 1.4 6.4 4.3 4.9c2.4-1.3 5-.6 6.7 1.4 1.7-2 4.3-2.7 6.7-1.4 2.9 1.5 3.7 5 1.8 7.9C18.7 16.7 12 21 12 21z" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2z" />
    </svg>
  )
}

function UserPage() {
  const navigate = useNavigate()
  const params = useParams()
  const name = safeDecode(params.name)

  const { videos, likedIds, followedUsers, toggleFollow } = useVideos()
  const [selectedId, setSelectedId] = useState(null)

  const userVideos = videos.filter(v => v.username === name && v.status === 'approved')
  const following = followedUsers.includes(name)
  const totalLikes = userVideos.reduce(
    (sum, v) => sum + v.likes + (likedIds.includes(v.id) ? 1 : 0),
    0
  )
  const selected = userVideos.find(v => v.id === selectedId) || null

  // Funga video kwa kubonyeza Esc
  useEffect(() => {
    if (!selected) return
    const onKey = (e) => {
      if (e.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  // Ukurasa wako mwenyewe ni Profile
  if (name === ME) return <Navigate to="/profile" replace />

  const title = displayName(name)

  return (
    <>
      <div className="pf-wrapper">
        <div
          className="pf-cover"
          style={{ backgroundImage: avatarGradient(name) }}
        >
          <button
            className="pf-round-btn up-back"
            onClick={() => navigate(-1)}
            aria-label="Rudi"
          >
            <BackIcon />
          </button>
        </div>

        <div className="pf-head">
          <div className="pf-avatar-wrap">
            <Avatar username={name} size={96} className="pf-avatar-ring" />
          </div>

          <div className="pf-stats">
            <div className="pf-stat">
              <b>{userVideos.length}</b>
              <span>Video</span>
            </div>
            <div className="pf-stat">
              <b>{formatCount(totalLikes)}</b>
              <span>Likes</span>
            </div>
          </div>
        </div>

        <div className="pf-info">
          <h2 className="pf-name">{title}</h2>
          <span className="pf-handle">{name}</span>
        </div>

        <div className="up-actions">
          <button
            className={following ? 'up-btn ghost' : 'up-btn primary'}
            onClick={() => toggleFollow(name)}
          >
            {following ? 'Unamfuata' : 'Fuata'}
          </button>
          <button
            className="up-btn ghost"
            onClick={() => navigate(`/messages/${encodeURIComponent(name)}`)}
          >
            <ChatIcon />
            Ujumbe
          </button>
        </div>

        <div className="pf-body">
          <h3 className="up-heading">Video ({userVideos.length})</h3>

          {userVideos.length === 0 ? (
            <p className="up-empty">Hajapakia video bado.</p>
          ) : (
            <div className="explore-grid">
              {userVideos.map(video => (
                <button
                  key={video.id}
                  className="explore-tile"
                  style={{ background: video.gradient || '#222' }}
                  onClick={() => setSelectedId(video.id)}
                  aria-label={`Fungua video ya ${title}`}
                >
                  {video.cover ? (
                    <img
                      className="explore-thumb"
                      src={video.cover}
                      alt=""
                      draggable={false}
                    />
                  ) : video.videoUrl ? (
                    <video
                      className="explore-thumb"
                      src={`${video.videoUrl}#t=${video.trimStart || 0.1}`}
                      muted
                      playsInline
                      preload="metadata"
                      style={video.filter ? { filter: getFilterCss(video.filter) } : undefined}
                    />
                  ) : (
                    <span className="explore-glyph">
                      <TileGlyph category={video.category} />
                    </span>
                  )}

                  <span className="explore-tile-shade" />

                  <span className="explore-tile-info">
                    <span className="explore-tile-user">{title}</span>
                    <span className="explore-tile-likes">
                      <HeartIcon />
                      {formatCount(video.likes + (likedIds.includes(video.id) ? 1 : 0))}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="explore-viewer">
          <button
            className="explore-back"
            onClick={() => setSelectedId(null)}
            aria-label="Funga video"
          >
            <BackIcon />
          </button>
          <div className="explore-viewer-card">
            <VideoCard video={selected} />
          </div>
        </div>
      )}
    </>
  )
}

export default UserPage