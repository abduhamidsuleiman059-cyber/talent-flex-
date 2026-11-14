import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useVideos } from '../context/VideoContext'
import { getPendingFile, setPendingFile } from '../utils/pendingFile'
import { FILTERS, getFilterCss } from '../utils/videoFilters'
import '../styles/upload-editor.css'

// Muda wa juu wa video (sekunde): dakika 30
const MAX_SECONDS = 30 * 60
// Video iliyopunguzwa isiwe fupi kuliko sekunde 1
const MIN_CLIP = 1
const TAGS = ['#TalentFlex', '#Kipaji', '#Tanzania']

function fmt(sec) {
  const total = Math.max(0, Math.round(sec))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function PlayIcon({ size = 30 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <polygon points="7 4 20 12 7 20 7 4" />
    </svg>
  )
}

function ScissorsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z" />
      <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />
    </svg>
  )
}

function SoundIcon({ on }) {
  return on ? (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 5a10 10 0 0 1 0 14" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  )
}

function Upload() {
  const navigate = useNavigate()
  const location = useLocation()
  const { publishVideo } = useVideos()

  const [file, setFile] = useState(null)
  const [url, setUrl] = useState(null)
  const [duration, setDuration] = useState(0)
  const [loadError, setLoadError] = useState('')

  // edit | details | done
  const [step, setStep] = useState('edit')
  // trim | filter
  const [tab, setTab] = useState('trim')
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [filterId, setFilterId] = useState('none')
  const [caption, setCaption] = useState('')
  const [allowComments, setAllowComments] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [savedOk, setSavedOk] = useState(true)

  const pickerRef = useRef(null)
  const videoRef = useRef(null)
  const thumbRef = useRef(null)
  const publishedUrlRef = useRef(null)

  // Pokea video iliyochaguliwa kwenye navbar (kila unapobonyeza +)
  useEffect(() => {
    const pending = getPendingFile()
    if (pending) setFile(pending)
  }, [location.key])

  // Soma video mpya na weka hali ya kuanzia
  useEffect(() => {
    if (!file) return

    let cancelled = false
    const objectUrl = URL.createObjectURL(file)
    const probe = document.createElement('video')
    probe.preload = 'metadata'

    setLoadError('')
    setUrl(null)
    setStep('edit')
    setTab('trim')
    setFilterId('none')
    setCaption('')
    setAllowComments(true)
    setPlaying(false)
    setSavedOk(true)

    probe.onloadedmetadata = () => {
      if (cancelled) return
      const d = probe.duration
      if (!Number.isFinite(d) || d <= 0) {
        setLoadError('Imeshindwa kusoma video hii. Jaribu faili nyingine.')
        return
      }
      if (d > MAX_SECONDS) {
        setLoadError(
          `Video ni ndefu sana (${fmt(d)}). Muda wa juu ni dakika ${MAX_SECONDS / 60}.`
        )
        return
      }
      setDuration(d)
      setTrimStart(0)
      setTrimEnd(d)
      setUrl(objectUrl)
    }

    probe.onerror = () => {
      if (!cancelled) {
        setLoadError('Imeshindwa kusoma video hii. Jaribu faili nyingine.')
      }
    }

    probe.src = objectUrl

    return () => {
      cancelled = true
      probe.removeAttribute('src')
      // Video iliyochapishwa inaendelea kutumia link hii kwenye Feed
      if (publishedUrlRef.current !== objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [file])

  // Sauti ya kicheza cha kuhariri
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [muted])

  const clipLength = Math.max(0, trimEnd - trimStart)
  const minGap = Math.min(MIN_CLIP, duration)
  const sliderStep = duration > 120 ? 1 : 0.1
  const filterCss = getFilterCss(filterId)
  const filterLabel = (FILTERS.find(f => f.id === filterId) || FILTERS[0]).label

  const discard = () => {
    setPendingFile(null)
    navigate('/')
  }

  const handleLocalPick = (e) => {
    const picked = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!picked) return
    setPendingFile(null)
    setFile(picked)
  }

  const openPicker = () => {
    if (pickerRef.current) pickerRef.current.click()
  }

  // ===== Kicheza cha kuhariri =====

  const tryPlay = () => {
    const el = videoRef.current
    if (!el) return
    el.muted = muted
    el.play().catch(() => {
      // Kivinjari kimekataa sauti: cheza bila sauti
      el.muted = true
      setMuted(true)
      el.play().catch(() => {})
    })
  }

  const togglePlay = () => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) {
      el.play().catch(() => {})
    } else {
      el.pause()
    }
  }

  const keepInRange = (el) => {
    if (!el || !trimEnd) return
    if (el.currentTime >= trimEnd - 0.05 || el.currentTime < trimStart - 0.3) {
      el.currentTime = trimStart
    }
  }

  const seekPreview = (t) => {
    const el = videoRef.current
    if (el) el.currentTime = t
  }

  // ===== Kupunguza =====

  const setStart = (value) => {
    const v = Math.max(0, Math.min(value, trimEnd - minGap))
    setTrimStart(v)
    seekPreview(v)
  }

  const setEnd = (value) => {
    const v = Math.min(duration, Math.max(value, trimStart + minGap))
    setTrimEnd(v)
    seekPreview(Math.max(trimStart, v - 1.5))
  }

  // ===== Kuchapisha =====

  const addTag = (tag) => {
    setCaption(prev => {
      if (prev.includes(tag)) return prev
      const next = prev.trim() ? `${prev.trim()} ${tag}` : tag
      return next.slice(0, 300)
    })
  }

  const handlePublish = async () => {
    if (publishing || !url) return
    setPublishing(true)
    publishedUrlRef.current = url
    setPendingFile(null)

    const saved = await publishVideo({
      username: '@wewe',
      caption: caption.trim(),
      videoUrl: url,
      likes: 0,
      comments: 0,
      duration,
      trimStart: trimStart > 0.05 ? trimStart : 0,
      trimEnd: trimEnd < duration - 0.05 ? trimEnd : 0,
      filter: filterId,
      allowComments
    })

    setSavedOk(saved)
    setPublishing(false)
    setStep('done')
  }

  // ===== Skrini =====

  let content

  if (!file) {
    content = (
      <>
        <div className="ed-top">
          <button className="ed-icon-btn" onClick={discard} aria-label="Rudi">
            <CloseIcon />
          </button>
          <h2 className="ed-title">Video mpya</h2>
          <span className="ed-top-space" />
        </div>
        <div className="ed-center">
          <button className="ed-pick-btn" onClick={openPicker} aria-label="Chagua video">
            <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
          </button>
          <h2>Chagua video</h2>
          <p>Gusa kuchagua video kutoka kwenye simu yako.</p>
        </div>
      </>
    )
  } else if (loadError) {
    content = (
      <>
        <div className="ed-top">
          <button className="ed-icon-btn" onClick={discard} aria-label="Funga">
            <CloseIcon />
          </button>
          <h2 className="ed-title">Video mpya</h2>
          <span className="ed-top-space" />
        </div>
        <div className="ed-center">
          <h2>Video haikubaliki</h2>
          <p className="ed-error">{loadError}</p>
          <div className="ed-actions">
            <button className="ed-primary" onClick={openPicker}>
              Chagua nyingine
            </button>
          </div>
        </div>
      </>
    )
  } else if (!url) {
    content = (
      <div className="ed-center">
        <div className="ed-spinner" />
        <p>Inasoma video...</p>
      </div>
    )
  } else if (step === 'done') {
    content = (
      <div className="ed-center">
        <div className="ed-success-icon">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2>Video imechapishwa!</h2>
        <p>Iko kwenye Feed sasa na inaonekana kwa wengine.</p>

        {!savedOk && (
          <p className="ed-warning">
            Video imechapishwa, lakini kifaa kimeshindwa kuihifadhi kabisa (huenda ni kubwa sana
            au nafasi imejaa). Itapotea ukirefresh ukurasa.
          </p>
        )}

        <div className="ed-actions">
          <button className="ed-primary" onClick={() => navigate('/')}>
            Tazama Feed
          </button>
          <button className="ed-ghost" onClick={openPicker}>
            Pakia nyingine
          </button>
        </div>
      </div>
    )
  } else if (step === 'details') {
    content = (
      <>
        <div className="ed-top">
          <button
            className="ed-icon-btn"
            onClick={() => setStep('edit')}
            aria-label="Rudi kuhariri"
            disabled={publishing}
          >
            <BackIcon />
          </button>
          <h2 className="ed-title">Maelezo</h2>
          <span className="ed-top-space" />
        </div>

        <div className="ed-details">
          <div className="ed-desc-row">
            <video
              ref={thumbRef}
              className="ed-thumb"
              src={url}
              muted
              autoPlay
              loop
              playsInline
              style={{ filter: filterCss }}
              onLoadedMetadata={() => {
                if (thumbRef.current) thumbRef.current.currentTime = trimStart
              }}
              onTimeUpdate={() => {
                const el = thumbRef.current
                if (!el) return
                if (el.currentTime >= trimEnd - 0.05 || el.currentTime < trimStart - 0.3) {
                  el.currentTime = trimStart
                }
              }}
            />

            <textarea
              className="ed-textarea"
              placeholder="Andika kuhusu video yako... #hashtag"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={300}
            />
          </div>
          <span className="ed-count">{caption.length}/300</span>

          <div className="ed-tags">
            {TAGS.map(tag => (
              <button key={tag} type="button" className="ed-tag" onClick={() => addTag(tag)}>
                {tag}
              </button>
            ))}
          </div>

          <div className="ed-card">
            <div className="ed-row">
              <span>Ruhusu maoni</span>
              <button
                type="button"
                className={allowComments ? 'ed-switch on' : 'ed-switch'}
                onClick={() => setAllowComments(v => !v)}
                role="switch"
                aria-checked={allowComments}
                aria-label="Ruhusu maoni"
              />
            </div>
            <div className="ed-row">
              <span>Muda wa video</span>
              <span className="ed-row-value">{fmt(clipLength)}</span>
            </div>
            <div className="ed-row">
              <span>Filta</span>
              <span className="ed-row-value">{filterLabel}</span>
            </div>
          </div>
        </div>

        <div className="ed-footer">
          <button
            className="ed-ghost"
            onClick={() => setStep('edit')}
            disabled={publishing}
          >
            Rudi
          </button>
          <button className="ed-primary" onClick={handlePublish} disabled={publishing}>
            {publishing ? 'Inachapisha...' : 'Chapisha'}
          </button>
        </div>
      </>
    )
  } else {
    content = (
      <>
        <div className="ed-top">
          <button className="ed-icon-btn" onClick={discard} aria-label="Funga">
            <CloseIcon />
          </button>
          <h2 className="ed-title">Hariri</h2>
          <span className="ed-top-space" />
        </div>

        <div className="ed-stage">
          <video
            ref={videoRef}
            className="ed-video"
            src={url}
            playsInline
            loop
            style={{ filter: filterCss }}
            onLoadedMetadata={() => seekPreview(trimStart)}
            onLoadedData={tryPlay}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => keepInRange(e.currentTarget)}
            onClick={togglePlay}
          />

          {!playing && (
            <span className="ed-play">
              <PlayIcon />
            </span>
          )}

          <button
            className="ed-mute"
            onClick={() => setMuted(m => !m)}
            aria-label={muted ? 'Washa sauti' : 'Zima sauti'}
          >
            <SoundIcon on={!muted} />
          </button>
        </div>

        <div className="ed-panel">
          <div className="ed-tabs">
            <button
              className={tab === 'trim' ? 'ed-tab active' : 'ed-tab'}
              onClick={() => setTab('trim')}
            >
              <ScissorsIcon />
              Punguza
            </button>
            <button
              className={tab === 'filter' ? 'ed-tab active' : 'ed-tab'}
              onClick={() => setTab('filter')}
            >
              <SparkIcon />
              Filta
            </button>
          </div>

          {tab === 'trim' && (
            <>
              <div className="ed-trim-info">
                <span>Muda mpya wa video</span>
                <b>
                  {fmt(clipLength)} / {fmt(duration)}
                </b>
              </div>

              <div className="ed-timeline">
                <span
                  style={{
                    left: `${(trimStart / duration) * 100}%`,
                    width: `${(clipLength / duration) * 100}%`
                  }}
                />
              </div>

              <div className="ed-trim-row">
                <span className="ed-trim-label">Mwanzo</span>
                <button className="ed-nudge" onClick={() => setStart(trimStart - 1)} aria-label="Rudisha sekunde 1">
                  −
                </button>
                <input
                  type="range"
                  className="ed-range"
                  min="0"
                  max={duration}
                  step={sliderStep}
                  value={trimStart}
                  onChange={(e) => setStart(Number(e.target.value))}
                />
                <button className="ed-nudge" onClick={() => setStart(trimStart + 1)} aria-label="Songa sekunde 1">
                  +
                </button>
                <b className="ed-time">{fmt(trimStart)}</b>
              </div>

              <div className="ed-trim-row">
                <span className="ed-trim-label">Mwisho</span>
                <button className="ed-nudge" onClick={() => setEnd(trimEnd - 1)} aria-label="Rudisha sekunde 1">
                  −
                </button>
                <input
                  type="range"
                  className="ed-range"
                  min="0"
                  max={duration}
                  step={sliderStep}
                  value={trimEnd}
                  onChange={(e) => setEnd(Number(e.target.value))}
                />
                <button className="ed-nudge" onClick={() => setEnd(trimEnd + 1)} aria-label="Songa sekunde 1">
                  +
                </button>
                <b className="ed-time">{fmt(trimEnd)}</b>
              </div>
            </>
          )}

          {tab === 'filter' && (
            <div className="ed-filters">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  className={filterId === f.id ? 'ed-filter active' : 'ed-filter'}
                  onClick={() => setFilterId(f.id)}
                >
                  <span className="ed-filter-swatch" style={{ filter: f.css }} />
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          )}

          <button className="ed-primary" onClick={() => setStep('details')}>
            Endelea
          </button>
        </div>
      </>
    )
  }

  return (
    <div className="ed-root">
      {content}
      <input
        ref={pickerRef}
        type="file"
        accept="video/*"
        hidden
        onChange={handleLocalPick}
      />
    </div>
  )
}

export default Upload