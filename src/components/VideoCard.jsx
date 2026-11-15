import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useVideos } from '../context/VideoContext'
import CommentsSheet from './CommentsSheet'
import ShareSheet from './ShareSheet'
import { displayName } from '../utils/displayName'
import { getFilterCss } from '../utils/videoFilters'
import { getSound, setSound, subscribeSound } from '../utils/soundStore'
import '../styles/videocard.css'
import '../styles/videocard-video.css'
import '../styles/videocard-like.css'
import '../styles/videocard-sound.css'
import '../styles/avatar.css'
import '../styles/videocard-playpause.css'
import '../styles/videocard-name.css'
import '../styles/videocard-progress.css'

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

function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K'
  return String(n)
}

function fmtTime(sec) {
  const total = Math.max(0, Math.round(sec))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

function VideoCard({ video }) {
  const { likedIds, toggleLike, comments, followedUsers, toggleFollow } = useVideos()
  const [showComments, setShowComments] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showCheck, setShowCheck] = useState(false)
  // Ikoni ya katikati: 'play' (imesimama) | 'pause' (inaendelea, inapotea) | null
  const [indicator, setIndicator] = useState(null)
  // Upau wa maendeleo
  const [progress, setProgress] = useState(0)
  const [scrub, setScrub] = useState(null)
  const cardRef = useRef(null)
  const videoRef = useRef(null)
  const barRef = useRef(null)
  const checkTimer = useRef(null)
  const indicatorTimer = useRef(null)
  const scrubbingRef = useRef(false)
  const wasPlayingRef = useRef(false)
  const sound = useSyncExternalStore(subscribeSound, getSound)

  const name = displayName(video.username)

  const liked = likedIds.includes(video.id)
  const likeCount = video.likes + (liked ? 1 : 0)
  const commentCount = video.comments + (comments[video.id]?.length || 0)
  const commentsOff = video.allowComments === false

  const isMine = video.username === ME
  const following = followedUsers.includes(video.username)
  const showBadge = !isMine && (!following || showCheck)

  // Sehemu iliyochaguliwa ya video (kupunguza)
  const trimStart = video.trimStart || 0
  const trimEnd = video.trimEnd || 0

  // Safisha timer kadi ikiondoka
  useEffect(() => {
    return () => {
      clearTimeout(checkTimer.current)
      clearTimeout(indicatorTimer.current)
    }
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
          el.muted = !getSound()
          el.play().catch(() => {
            // Kivinjari kimekataa sauti, cheza bila sauti
            el.muted = true
            setSound(false)
            el.play().catch(() => {})
          })
        } else {
          el.pause()
          clearTimeout(indicatorTimer.current)
          setIndicator(null)
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

  // Mwanzo na mwisho wa sehemu inayochezwa
  const clipRange = (el) => {
    if (!el) return null
    const start = trimStart
    const end = trimEnd || el.duration
    if (!Number.isFinite(end) || end <= start) return null
    return { start, end }
  }

  // Anza kwenye mwanzo wa sehemu iliyochaguliwa
  const handleLoadedMetadata = () => {
    const el = videoRef.current
    if (el && trimStart > 0) el.currentTime = trimStart
    setProgress(0)
  }

  // Rudia ndani ya sehemu iliyochaguliwa na sasisha upau
  const handleTimeUpdate = () => {
    const el = videoRef.current
    if (!el) return

    if (trimEnd && el.currentTime >= trimEnd) {
      el.currentTime = trimStart
    } else if (trimStart && el.currentTime < trimStart - 0.2) {
      el.currentTime = trimStart
    }

    if (!scrubbingRef.current) {
      const range = clipRange(el)
      if (range) {
        const p = (el.currentTime - range.start) / (range.end - range.start)
        setProgress(Math.min(1, Math.max(0, p)))
      }
    }
  }

  // Gusa video: simamisha / endelea
  const togglePlay = () => {
    const el = videoRef.current
    if (!el) return
    clearTimeout(indicatorTimer.current)

    if (el.paused) {
      el.play().catch(() => {})
      setIndicator('pause')
      indicatorTimer.current = setTimeout(() => setIndicator(null), 600)
    } else {
      el.pause()
      setIndicator('play')
    }
  }

  // Kitufe cha spika: washa / zima sauti
  const toggleSound = () => {
    const el = videoRef.current
    const next = !getSound()
    setSound(next)
    if (el) {
      el.muted = !next
    }
  }

  // ===== Upau wa maendeleo: kugusa na kuburuta =====

  const applyScrub = (clientX) => {
    const el = videoRef.current
    const bar = barRef.current
    const range = clipRange(el)
    if (!el || !bar || !range) return

    const rect = bar.getBoundingClientRect()
    const p = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const total = range.end - range.start

    el.currentTime = range.start + p * total
    setProgress(p)
    setScrub({ time: p * total, total })
  }

  const handleBarDown = (e) => {
    const el = videoRef.current
    if (!el || !clipRange(el)) return
    e.stopPropagation()

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // hakuna cha kufanya
    }

    scrubbingRef.current = true
    wasPlayingRef.current = !el.paused
    el.pause()
    applyScrub(e.clientX)
  }

  const handleBarMove = (e) => {
    if (!scrubbingRef.current) return
    applyScrub(e.clientX)
  }

  const handleBarUp = (e) => {
    if (!scrubbingRef.current) return
    scrubbingRef.current = false

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // hakuna cha kufanya
    }

    setScrub(null)
    const el = videoRef.current
    if (el && wasPlayingRef.current) el.play().catch(() => {})
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
          style={video.filter ? { filter: getFilterCss(video.filter) } : undefined}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onClick={togglePlay}
        />
      )}

      {indicator && (
        <div className={`play-indicator ${indicator}`} key={indicator}>
          {indicator === 'play' ? (
            <svg viewBox="0 0 24 24" width="38" height="38" fill="currentColor">
              <polygon points="7 4 20 12 7 20 7 4" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
              <rect x="6" y="4" width="4.5" height="16" rx="1.2" />
              <rect x="13.5" y="4" width="4.5" height="16" rx="1.2" />
            </svg>
          )}
        </div>
      )}

      {scrub && (
        <div className="vp-time">
          {fmtTime(scrub.time)} <span>/ {fmtTime(scrub.total)}</span>
        </div>
      )}

      <div className="video-overlay">
        <div className="video-info">
          <h3 className="video-name">{name}</h3>
        </div>
      </div>

      {video.videoUrl && (
        <div
          className={scrub ? 'vp-wrap active' : 'vp-wrap'}
          ref={barRef}
          onPointerDown={handleBarDown}
          onPointerMove={handleBarMove}
          onPointerUp={handleBarUp}
          onPointerCancel={handleBarUp}
          role="slider"
          aria-label="Maendeleo ya video"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div className="vp-track">
            <div className="vp-fill" style={{ width: `${progress * 100}%` }}>
              <span className="vp-thumb" />
            </div>
          </div>
        </div>
      )}

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
          className={commentsOff ? 'action-btn dim' : 'action-btn'}
          onClick={() => {
            if (!commentsOff) setShowComments(true)
          }}
          aria-label={commentsOff ? 'Maoni yamezimwa' : 'Fungua maoni'}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
            <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2z"/>
          </svg>
          <span>{commentsOff ? '—' : formatCount(commentCount)}</span>
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