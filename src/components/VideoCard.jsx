import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useVideos } from '../context/VideoContext'
import CommentsSheet from './CommentsSheet'
import ShareSheet from './ShareSheet'
import Avatar from './Avatar'
import OverlayLayer from './OverlayLayer'
import FollowButton from './FollowButton'
import { displayName } from '../utils/displayName'
import { getFilterCss } from '../utils/videoFilters'
import { getSound, setSound, subscribeSound } from '../utils/soundStore'
import { useMusicSync } from '../utils/useMusicSync'
import '../styles/videocard.css'
import '../styles/videocard-video.css'
import '../styles/videocard-like.css'
import '../styles/videocard-sound.css'
import '../styles/avatar.css'
import '../styles/videocard-playpause.css'
import '../styles/videocard-name.css'
import '../styles/videocard-progress.css'
import '../styles/videocard-extras.css'

const ME = '@wewe'
// Gusa mara mbili ndani ya muda huu (milisekunde) = penda video
const DOUBLE_TAP_MS = 300

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

// Maelezo yenye hashtag za bluu
function CaptionText({ text }) {
  const parts = text.split(/(#[\p{L}\p{N}_]+)/u)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="cap-tag">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

function VideoCard({ video }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { likedIds, toggleLike, comments } = useVideos()
  const [showComments, setShowComments] = useState(false)
  const [showShare, setShowShare] = useState(false)
  // Ikoni ya katikati: 'play' (imesimama) | 'pause' (inaendelea, inapotea) | null
  const [indicator, setIndicator] = useState(null)
  // Upau wa maendeleo
  const [progress, setProgress] = useState(0)
  const [scrub, setScrub] = useState(null)
  // Jalada, maelezo na mioyo ya kugusa mara mbili
  const [started, setStarted] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [hearts, setHearts] = useState([])

  const cardRef = useRef(null)
  const videoRef = useRef(null)
  const audioRef = useRef(null)
  const barRef = useRef(null)
  const indicatorTimer = useRef(null)
  const tapTimer = useRef(null)
  const lastTapRef = useRef(0)
  const scrubbingRef = useRef(false)
  const wasPlayingRef = useRef(false)
  const sound = useSyncExternalStore(subscribeSound, getSound)

  const name = displayName(video.username)
  const caption = (video.caption || '').trim()

  const liked = likedIds.includes(video.id)
  const likeCount = video.likes + (liked ? 1 : 0)
  const commentCount = video.comments + (comments[video.id]?.length || 0)
  const commentsOff = video.allowComments === false

  const isMine = video.username === ME

  // Sehemu iliyochaguliwa ya video (kupunguza)
  const trimStart = video.trimStart || 0
  const trimEnd = video.trimEnd || 0

  // Muziki na maandishi/stika vilivyowekwa wakati wa kuhariri
  const hasMusic = Boolean(video.musicUrl && video.videoUrl)
  const musicVol = video.musicVol ?? 1
  const videoVol = video.videoVol ?? 1
  const overlays = video.overlays || []

  useMusicSync(videoRef, audioRef, hasMusic, trimStart)

  // Sauti ya video na muziki
  useEffect(() => {
    const v = videoRef.current
    const a = audioRef.current
    if (v) v.volume = hasMusic ? videoVol : 1
    if (a) a.volume = musicVol
  }, [hasMusic, videoVol, musicVol])

  // Muziki unafuata hali ya sauti ya app
  useEffect(() => {
    const a = audioRef.current
    if (a) a.muted = !sound
  }, [sound, hasMusic])

  // Safisha timer kadi ikiondoka
  useEffect(() => {
    return () => {
      clearTimeout(indicatorTimer.current)
      clearTimeout(tapTimer.current)
    }
  }, [])

  // Fungua ukurasa wa mtumiaji (au Profile yako mwenyewe)
  const goUser = () => {
    const target = isMine ? '/profile' : `/user/${encodeURIComponent(video.username)}`
    let current = location.pathname
    try {
      current = decodeURIComponent(current)
    } catch {
      // tumia ilivyo
    }
    if (current === decodeURIComponent(target)) return
    navigate(target)
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

  // Simamisha / endelea
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

  // Moyo mkubwa mahali ulipogusa, na penda video
  const likeFromTap = (e) => {
    const card = cardRef.current
    if (!card) return

    const rect = card.getBoundingClientRect()
    const heart = {
      id: Date.now() + Math.random(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      rot: Math.round(Math.random() * 30 - 15)
    }

    setHearts(prev => [...prev, heart])
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== heart.id))
    }, 900)

    if (!liked) toggleLike(video.id)
  }

  // Gusa mara moja = simamisha/endelea, mara mbili = penda
  const handleVideoTap = (e) => {
    const now = Date.now()

    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      lastTapRef.current = 0
      clearTimeout(tapTimer.current)
      likeFromTap(e)
      return
    }

    lastTapRef.current = now
    clearTimeout(tapTimer.current)
    tapTimer.current = setTimeout(() => {
      lastTapRef.current = 0
      togglePlay()
    }, DOUBLE_TAP_MS)
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
          onPlaying={() => setStarted(true)}
          onClick={handleVideoTap}
        />
      )}

      {video.videoUrl && video.cover && (
        <img
          className={started ? 'video-cover hidden' : 'video-cover'}
          src={video.cover}
          alt=""
          draggable={false}
        />
      )}

      {overlays.length > 0 && <OverlayLayer overlays={overlays} />}

      {hasMusic && <audio ref={audioRef} src={video.musicUrl} loop preload="auto" />}

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

      {hearts.map(h => (
        <div
          key={h.id}
          className="tap-heart"
          style={{ left: h.x, top: h.y, '--rot': `${h.rot}deg` }}
        >
          <svg viewBox="0 0 24 24" width="96" height="96" fill="currentColor">
            <path d="M12 21s-6.7-4.3-9.5-8.2C.6 9.9 1.4 6.4 4.3 4.9c2.4-1.3 5-.6 6.7 1.4 1.7-2 4.3-2.7 6.7-1.4 2.9 1.5 3.7 5 1.8 7.9C18.7 16.7 12 21 12 21z" />
          </svg>
        </div>
      ))}

      {scrub && (
        <div className="vp-time">
          {fmtTime(scrub.time)} <span>/ {fmtTime(scrub.total)}</span>
        </div>
      )}

      <div className="video-overlay">
        <div className="video-info">
          <div className="video-namerow">
            <button className="video-name-btn" onClick={goUser}>
              <span className="video-name">{name}</span>
            </button>

            {!isMine && <FollowButton username={video.username} size="sm" />}
          </div>

          {caption && (
            <div className={expanded ? 'video-caption open' : 'video-caption'}>
              {expanded && (
                <p className="video-caption-text">
                  <CaptionText text={caption} />
                </p>
              )}
              <button className="video-more" onClick={() => setExpanded(v => !v)}>
                {expanded ? 'less' : 'more'}
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          )}
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
          aria-label="Progress"
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
          <button
            className="avatar-hit"
            onClick={goUser}
            aria-label={`Open ${name}`}
          >
            <Avatar username={video.username} size={48} />
          </button>
        </div>

        <button
          className={liked ? 'action-btn liked' : 'action-btn'}
          onClick={() => toggleLike(video.id)}
          aria-label="Like"
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
          aria-label={commentsOff ? 'Comments off' : 'Comments'}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
            <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2z"/>
          </svg>
          <span>{commentsOff ? '—' : formatCount(commentCount)}</span>
        </button>

        <button
          className="action-btn"
          onClick={() => setShowShare(true)}
          aria-label="Share"
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
            aria-label={sound ? 'Mute' : 'Unmute'}
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