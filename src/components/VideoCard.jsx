import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useVideos } from '../context/VideoContext'
import CommentsSheet from './CommentsSheet'
import ShareSheet from './ShareSheet'
import '../styles/videocard.css'
import '../styles/videocard-video.css'
import '../styles/videocard-like.css'
import '../styles/videocard-sound.css'
import '../styles/avatar.css'

const ME = '@wewe'

// Rangi za avatar, kila jina linapata rangi yake ile ile kila mara
const AVATAR_COLORS = [
  'linear-gradient(135deg, #ff9a1f, #ff5e3a)',
  'linear-gradient(135deg, #22d3ee, #3b82f6)',
  'linear-gradient(135deg, #a855f7, #ec4899)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #6366f1, #8b5cf6)'
]

function avatarGradient(username) {
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function avatarLetter(username) {
  return username.replace('@', '').charAt(0).toUpperCase() || '?'
}

// Hali ya sauti inayoshirikiwa na kadi zote
let soundOn = true
const listeners = new Set()

function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return soundOn
}

function setSound(value) {
  soundOn = value
  listeners.forEach(l => l())
}

function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K'
  return String(n)
}

function VideoCard({ video }) {
  const { likedIds, toggleLike, comments, followedUsers, toggleFollow } = useVideos()
  const [showComments, setShowComments] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showCheck, setShowCheck] = useState(false)
  const cardRef = useRef(null)
  const videoRef = useRef(null)
  const checkTimer = useRef(null)
  const sound = useSyncExternalStore(subscribe, getSnapshot)

  const tagColor = video.category === 'ball' ? '#00D4AA' : '#C724F5'
  const tagLabel = video.category === 'ball' ? 'Ball Skills' : 'Music & Beats'

  const liked = likedIds.includes(video.id)
  const likeCount = video.likes + (liked ? 1 : 0)
  const commentCount = video.comments + (comments[video.id]?.length || 0)

  const isMine = video.username === ME
  const following = followedUsers.includes(video.username)
  const showBadge = !isMine && (!following || showCheck)

  // Safisha timer ya tiki kadi ikiondoka
  useEffect(() => {
    return () => clearTimeout(checkTimer.current)
  }, [])

  const handleFollow = () => {
    if (following) return
    toggleFollow(video.username)
    setShowCheck(true)
    clearTimeout(checkTimer.current)
    checkTimer.current = setTimeout(() => setShowCheck(false), 1200)
  }

  // Video ichezwe ikiwa kwenye skrini, isimame ikitoka
  useEffect(() => {
    const el = videoRef.current
    const card = cardRef.current
    if (!el || !card) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.muted = !getSnapshot()
          el.play().catch(() => {
            // Kivinjari kimekataa sauti, cheza bila sauti
            el.muted = true
            setSound(false)
            el.play().catch(() => {})
          })
        } else {
          el.pause()
        }
      },
      { threshold: 0.6 }
    )
    observer.observe(card)
    return () => observer.disconnect()
  }, [video.videoUrl])

  // Sauti ikibadilika, sasisha video hii
  useEffect(() => {
    const el = videoRef.current
    if (el) el.muted = !sound
  }, [sound])

  // Gusa video kuwasha/kuzima sauti
  const toggleSound = () => {
    const el = videoRef.current
    const next = !getSnapshot()
    setSound(next)
    if (el) {
      el.muted = !next
      if (el.paused) el.play().catch(() => {})
    }
  }

  return (
    <div
      className="video-card"
      id={`video-${video.id}`}
      ref={cardRef}
      style={{ background: video.gradient }}
    >
      {video.videoUrl && (
        <video
          ref={videoRef}
          src={video.videoUrl}
          className="video-player"
          loop
          playsInline
          preload="metadata"
          onClick={toggleSound}
        />
      )}

      <div className="video-overlay">
        <span className="video-tag" style={{ borderColor: tagColor, color: tagColor }}>
          {tagLabel}
        </span>
        <div className="video-info">
          <h3>{video.username}</h3>
          <p>{video.caption}</p>
        </div>
      </div>

      <div className="video-actions">
        <div className="avatar-wrap">
          <div
            className="avatar-circle"
            style={{ background: avatarGradient(video.username) }}
          >
            {avatarLetter(video.username)}
          </div>

          {showBadge && (
            <button
              className={following ? 'follow-badge done' : 'follow-badge'}
              onClick={handleFollow}
              aria-label={following ? 'Unamfuata' : 'Mfuate'}
            >
              {following ? (
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
            </button>
          )}
        </div>

        <button
          className={liked ? 'action-btn liked' : 'action-btn'}
          onClick={() => toggleLike(video.id)}
          aria-label="Penda video"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="30" height="30">
            <path d="M12 21s-6.7-4.3-9.5-8.2C.6 9.9 1.4 6.4 4.3 4.9c2.4-1.3 5-.6 6.7 1.4 1.7-2 4.3-2.7 6.7-1.4 2.9 1.5 3.7 5 1.8 7.9C18.7 16.7 12 21 12 21z"/>
          </svg>
          <span>{formatCount(likeCount)}</span>
        </button>

        <button
          className="action-btn"
          onClick={() => setShowComments(true)}
          aria-label="Fungua maoni"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
            <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2z"/>
          </svg>
          <span>{formatCount(commentCount)}</span>
        </button>

        <button
          className="action-btn"
          onClick={() => setShowShare(true)}
          aria-label="Shiriki video"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
            <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          <span>Share</span>
        </button>

        {video.videoUrl && (
          <button
            className={sound ? 'sound-btn' : 'sound-btn off'}
            onClick={toggleSound}
            aria-label={sound ? 'Zima sauti' : 'Washa sauti'}
          >
            {sound ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/>
                <path d="M15.5 8.5a5 5 0 0 1 0 7"/>
                <path d="M19 5a10 10 0 0 1 0 14"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/>
                <line x1="22" y1="9" x2="16" y2="15"/>
                <line x1="16" y1="9" x2="22" y2="15"/>
              </svg>
            )}
          </button>
        )}
      </div>

      {showComments && (
        <CommentsSheet video={video} onClose={() => setShowComments(false)} />
      )}

      {showShare && (
        <ShareSheet video={video} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}

export default VideoCard