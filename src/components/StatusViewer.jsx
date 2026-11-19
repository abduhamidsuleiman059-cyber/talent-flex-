import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useStatuses,
  markViewed,
  toggleStatusLike,
  addStatusComment,
  deleteStatus,
  getStatusVideoUrl,
  getStatusMusicUrl,
  TEXT_BACKGROUNDS
} from '../utils/statusStore'
import { authorInfo, myHandle } from '../utils/statusAuthor'
import { getFilterCss } from '../utils/videoFilters'
import { useMusicSync } from '../utils/useMusicSync'
import Avatar from './Avatar'
import OverlayLayer from './OverlayLayer'
import '../styles/story.css'
import '../styles/story-edit.css'

const PHOTO_MS = 5000

function timeAgo(ts) {
  const sec = Math.floor((Date.now() - ts) / 1000)
  if (sec < 60) return 'sasa hivi'
  const min = Math.floor(sec / 60)
  if (min < 60) return `dk ${min}`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `saa ${hr}`
  return `siku ${Math.floor(hr / 24)}`
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function HeartIcon({ filled, size = 22 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s-6.7-4.3-9.5-8.2C.6 9.9 1.4 6.4 4.3 4.9c2.4-1.3 5-.6 6.7 1.4 1.7-2 4.3-2.7 6.7-1.4 2.9 1.5 3.7 5 1.8 7.9C18.7 16.7 12 21 12 21z" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2z" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor">
      <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
    </svg>
  )
}

function StatusViewer({ handle, onClose }) {
  const all = useStatuses()
  const me = myHandle()
  const isMine = handle === me
  const info = authorInfo(handle)

  const list = useMemo(
    () =>
      all
        .filter(i => i.author === handle && i.expiresAt > Date.now())
        .sort((a, b) => a.createdAt - b.createdAt),
    [all, handle]
  )

  const [index, setIndex] = useState(() => {
    if (isMine) return 0
    const firstUnseen = list.findIndex(i => !i.views.some(v => v.u === me))
    return firstUnseen === -1 ? 0 : firstUnseen
  })
  const [paused, setPaused] = useState(false)
  // null | 'views' | 'comments'
  const [sheet, setSheet] = useState(null)
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState('')
  const [toast, setToast] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [musicUrl, setMusicUrl] = useState('')

  const fillRef = useRef(null)
  const videoRef = useRef(null)
  const audioRef = useRef(null)
  const downRef = useRef(0)
  const toastTimer = useRef(null)
  const nextRef = useRef(() => {})
  const pausedRef = useRef(false)

  const item = list[index] || null
  const isVideo = Boolean(item && item.type === 'video')
  const edit = item && item.edit ? item.edit : null
  const trimStart = edit ? edit.trimStart || 0 : 0
  const trimEnd = edit ? edit.trimEnd || 0 : 0
  const stopped = paused || sheet !== null || focused
  pausedRef.current = stopped

  const goNext = () => {
    if (index < list.length - 1) setIndex(index + 1)
    else onClose()
  }

  const goPrev = () => {
    setIndex(Math.max(0, index - 1))
  }

  nextRef.current = goNext

  // Muziki unaenda sambamba na video
  const hasMusic = Boolean(edit && edit.hasMusic && musicUrl && videoUrl)
  useMusicSync(videoRef, audioRef, hasMusic, trimStart, item ? item.id : 0)

  // Sauti ya video na muziki
  useEffect(() => {
    const v = videoRef.current
    const a = audioRef.current
    if (v) v.volume = edit && edit.hasMusic ? edit.videoVol ?? 1 : 1
    if (a) a.volume = edit ? edit.musicVol ?? 1 : 1
  }, [edit, videoUrl, musicUrl])

  // Orodha ikibadilika (mfano ukifuta status)
  useEffect(() => {
    if (list.length === 0) {
      onClose()
      return
    }
    if (index > list.length - 1) setIndex(list.length - 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length])

  // Esc inafunga
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Safisha timer ya ujumbe
  useEffect(() => {
    return () => clearTimeout(toastTimer.current)
  }, [])

  // Rekodi kuwa umetazama
  useEffect(() => {
    if (item && !isMine) markViewed(item.id, me)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item && item.id, isMine])

  // Pakia video na muziki wa status
  useEffect(() => {
    setVideoUrl('')
    setMusicUrl('')
    if (!item || item.type !== 'video') return

    let cancelled = false
    getStatusVideoUrl(item.id).then(u => {
      if (!cancelled) setVideoUrl(u)
    })

    if (item.edit && item.edit.hasMusic) {
      getStatusMusicUrl(item.id).then(u => {
        if (!cancelled) setMusicUrl(u)
      })
    }

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item && item.id])

  // Picha na maandishi: kipima muda cha sekunde 5
  useEffect(() => {
    if (!item || isVideo) return

    let raf = 0
    let last = performance.now()
    let elapsed = 0
    if (fillRef.current) fillRef.current.style.width = '0%'

    const tick = (now) => {
      const dt = now - last
      last = now

      if (!pausedRef.current) {
        elapsed += dt
        if (fillRef.current) {
          fillRef.current.style.width = `${Math.min(100, (elapsed / PHOTO_MS) * 100)}%`
        }
        if (elapsed >= PHOTO_MS) {
          nextRef.current()
          return
        }
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item && item.id, isVideo])

  // Video: simamisha au endelea
  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    if (stopped) {
      v.pause()
    } else {
      v.play().catch(() => {
        v.muted = true
        v.play().catch(() => {})
      })
    }
  }, [stopped, videoUrl])

  if (!item) return null

  const liked = item.likes.includes(me)
  const views = [...item.views].sort((a, b) => b.t - a.t)
  const comments = [...item.comments].sort((a, b) => a.t - b.t)

  const showToast = (message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 1800)
  }

  const handleDown = () => {
    downRef.current = Date.now()
    setPaused(true)
  }

  const handleUp = (e) => {
    setPaused(false)
    const held = Date.now() - downRef.current
    if (held < 250) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      if (x < rect.width * 0.3) goPrev()
      else goNext()
    }
  }

  const sendComment = (e) => {
    e.preventDefault()
    const clean = text.trim()
    if (!clean) return
    addStatusComment(item.id, me, clean)
    setText('')
    setFocused(false)
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur()
    showToast('Maoni yametumwa')
  }

  const handleDelete = () => {
    const ok = window.confirm('Futa status hii? Hatua hii haiwezi kurudishwa.')
    if (!ok) return
    deleteStatus(item.id)
  }

  const handleVideoTime = (e) => {
    const v = e.currentTarget
    const end = trimEnd || v.duration

    if (!Number.isFinite(end) || end <= trimStart) return

    if (fillRef.current) {
      const p = ((v.currentTime - trimStart) / (end - trimStart)) * 100
      fillRef.current.style.width = `${Math.min(100, Math.max(0, p))}%`
    }

    if (edit && v.currentTime >= end - 0.05) nextRef.current()
  }

  let content = null
  if (item.type === 'photo') {
    content = <img className="sv-photo" src={item.image} alt="" draggable={false} />
  } else if (item.type === 'text') {
    content = (
      <div className="sv-text" style={{ background: TEXT_BACKGROUNDS[item.bg] || TEXT_BACKGROUNDS[0] }}>
        <p>{item.text}</p>
      </div>
    )
  } else if (videoUrl) {
    content = (
      <video
        ref={videoRef}
        className={edit ? 'sv-video cover' : 'sv-video'}
        src={videoUrl}
        playsInline
        autoPlay
        style={edit && edit.filter ? { filter: getFilterCss(edit.filter) } : undefined}
        onLoadedMetadata={(e) => {
          if (trimStart > 0) e.currentTarget.currentTime = trimStart
        }}
        onTimeUpdate={handleVideoTime}
        onEnded={() => nextRef.current()}
      />
    )
  }

  return (
    <div className="sv-root">
      <div
        className="sv-stage"
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerCancel={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      >
        {content}

        {edit && edit.overlays && edit.overlays.length > 0 && (
          <OverlayLayer overlays={edit.overlays} />
        )}

        {edit && edit.hasMusic && musicUrl && (
          <audio ref={audioRef} src={musicUrl} loop preload="auto" />
        )}
      </div>

      <div className="sv-top">
        <div className="sv-segs">
          {list.map((it, i) => (
            <div className="sv-seg" key={it.id}>
              <div
                className="sv-fill"
                ref={i === index ? fillRef : null}
                style={
                  i < index ? { width: '100%' } : i > index ? { width: '0%' } : undefined
                }
              />
            </div>
          ))}
        </div>

        <div className="sv-author">
          <Avatar username={handle} src={info.avatar} label={info.name} size={36} />
          <div className="sv-author-text">
            <span className="sv-name">{isMine ? 'Status yako' : info.name}</span>
            <span className="sv-time">{timeAgo(item.createdAt)}</span>
          </div>

          {isMine && (
            <button className="sv-icon-btn" onClick={handleDelete} aria-label="Futa status">
              <TrashIcon />
            </button>
          )}
          <button className="sv-icon-btn" onClick={onClose} aria-label="Funga">
            <CloseIcon />
          </button>
        </div>
      </div>

      {item.caption && item.type !== 'text' && (
        <div className="sv-caption">{item.caption}</div>
      )}

      <div className="sv-bottom">
        {isMine ? (
          <div className="sv-stats">
            <button className="sv-stat" onClick={() => setSheet('views')}>
              <EyeIcon />
              {item.views.length}
            </button>
            <button className="sv-stat" onClick={() => setSheet('views')}>
              <HeartIcon filled size={20} />
              {item.likes.length}
            </button>
            <button className="sv-stat" onClick={() => setSheet('comments')}>
              <CommentIcon />
              {item.comments.length}
            </button>
          </div>
        ) : (
          <form className="sv-reply" onSubmit={sendComment}>
            <input
              className="sv-input"
              type="text"
              placeholder="Andika maoni..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              maxLength={200}
            />
            <button
              type="submit"
              className="sv-send"
              disabled={!text.trim()}
              aria-label="Tuma maoni"
            >
              <SendIcon />
            </button>
            <button
              type="button"
              className={liked ? 'sv-heart liked' : 'sv-heart'}
              onClick={() => toggleStatusLike(item.id, me)}
              aria-label="Penda status"
            >
              <HeartIcon filled={liked} />
            </button>
          </form>
        )}
      </div>

      {sheet && (
        <div className="sv-sheet-backdrop" onClick={() => setSheet(null)}>
          <div className="sv-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sv-sheet-head">
              <div className="sv-tabs">
                <button
                  className={sheet === 'views' ? 'sv-tab active' : 'sv-tab'}
                  onClick={() => setSheet('views')}
                >
                  Watazamaji ({views.length})
                </button>
                <button
                  className={sheet === 'comments' ? 'sv-tab active' : 'sv-tab'}
                  onClick={() => setSheet('comments')}
                >
                  Maoni ({comments.length})
                </button>
              </div>
              <button className="sv-icon-btn" onClick={() => setSheet(null)} aria-label="Funga">
                <CloseIcon />
              </button>
            </div>

            <div className="sv-sheet-list">
              {sheet === 'views' &&
                (views.length === 0 ? (
                  <p className="sv-empty">Hakuna aliyetazama bado.</p>
                ) : (
                  views.map(v => {
                    const who = authorInfo(v.u)
                    return (
                      <div className="sv-row" key={v.u}>
                        <Avatar username={v.u} src={who.avatar} label={who.name} size={40} />
                        <span className="sv-row-main">
                          <span className="sv-row-name">{who.name}</span>
                          <span className="sv-row-sub">{timeAgo(v.t)}</span>
                        </span>
                        {item.likes.includes(v.u) && (
                          <span className="sv-row-heart">
                            <HeartIcon filled size={20} />
                          </span>
                        )}
                      </div>
                    )
                  })
                ))}

              {sheet === 'comments' &&
                (comments.length === 0 ? (
                  <p className="sv-empty">Hakuna maoni bado.</p>
                ) : (
                  comments.map(c => {
                    const who = authorInfo(c.u)
                    return (
                      <div className="sv-row" key={c.id}>
                        <Avatar username={c.u} src={who.avatar} label={who.name} size={40} />
                        <span className="sv-row-main">
                          <span className="sv-row-name">
                            {who.name} <span className="sv-row-sub">· {timeAgo(c.t)}</span>
                          </span>
                          <span className="sv-row-text">{c.text}</span>
                        </span>
                      </div>
                    )
                  })
                ))}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="sv-toast">{toast}</div>}
    </div>
  )
}

export default StatusViewer