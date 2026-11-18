import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVideos } from '../context/VideoContext'
import CameraCapture from '../components/CameraCapture'
import { WhatsAppIcon, TelegramIcon, FacebookIcon, XIcon } from '../components/SocialIcons'
import { FILTERS, getFilterCss } from '../utils/videoFilters'
import { frameDataUrl, captureFrame, cropToDataUrl } from '../utils/imageTools'
import '../styles/upload-editor.css'
import '../styles/upload-cover.css'
import '../styles/upload-tiktok.css'

// Muda wa juu wa video (sekunde): dakika 30
const MAX_SECONDS = 30 * 60
// Video iliyopunguzwa isiwe fupi kuliko sekunde 1
const MIN_CLIP = 1
const TAGS = ['#TalentFlex', '#Kipaji', '#Tanzania', '#BongoTalent', '#Muziki', '#Mpira']

const SHARE_APPS = [
  { id: 'whatsapp', label: 'WhatsApp', Icon: WhatsAppIcon },
  { id: 'telegram', label: 'Telegram', Icon: TelegramIcon },
  { id: 'facebook', label: 'Facebook', Icon: FacebookIcon },
  { id: 'x', label: 'X', Icon: XIcon }
]

function shareUrl(appId, text, link) {
  const t = encodeURIComponent(text)
  const l = encodeURIComponent(link)
  switch (appId) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(`${text}\n${link}`)}`
    case 'telegram':
      return `https://t.me/share/url?url=${l}&text=${t}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${l}`
    default:
      return `https://twitter.com/intent/tweet?text=${t}&url=${l}`
  }
}

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

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={open ? 'ud-chevron open' : 'ud-chevron'}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function Upload() {
  const navigate = useNavigate()
  const { publishVideo } = useVideos()

  const [file, setFile] = useState(null)
  const [url, setUrl] = useState(null)
  const [duration, setDuration] = useState(0)
  const [durationFixed, setDurationFixed] = useState(false)
  const [loadError, setLoadError] = useState('')

  // edit | details | cover | done
  const [step, setStep] = useState('edit')
  // trim | filter
  const [tab, setTab] = useState('trim')
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [filterId, setFilterId] = useState('none')
  const [caption, setCaption] = useState('')
  const [showTags, setShowTags] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareApps, setShareApps] = useState([])
  const [preview, setPreview] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [savedOk, setSavedOk] = useState(true)
  const [cover, setCover] = useState('')
  const [coverTouched, setCoverTouched] = useState(false)
  const [coverTime, setCoverTime] = useState(0)
  const [coverError, setCoverError] = useState('')

  const pickerRef = useRef(null)
  const coverImgRef = useRef(null)
  const captionRef = useRef(null)
  const videoRef = useRef(null)
  const coverVideoRef = useRef(null)
  const publishedUrlRef = useRef(null)

  const clipLength = Math.max(0, trimEnd - trimStart)
  const minGap = Math.min(MIN_CLIP, duration)
  const sliderStep = duration > 120 ? 1 : 0.1
  const filterCss = getFilterCss(filterId)

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
    setShowTags(false)
    setShareOpen(false)
    setShareApps([])
    setPreview(false)
    setPlaying(false)
    setSavedOk(true)
    setCover('')
    setCoverTouched(false)
    setCoverError('')
    setDurationFixed(false)

    probe.onloadedmetadata = () => {
      if (cancelled) return

      let d = probe.duration
      let fixed = false

      // Video zilizorekodiwa kwa webm mara nyingi hazina muda kwenye metadata
      if (!Number.isFinite(d) || d <= 0) {
        const known = Number(file.tfDuration)
        if (Number.isFinite(known) && known > 0) {
          d = known
          fixed = true
        } else {
          setLoadError('Imeshindwa kusoma video hii. Jaribu faili nyingine.')
          return
        }
      }

      if (d > MAX_SECONDS) {
        setLoadError(
          `Video ni ndefu sana (${fmt(d)}). Muda wa juu ni dakika ${MAX_SECONDS / 60}.`
        )
        return
      }

      setDuration(d)
      setDurationFixed(fixed)
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

  // Jalada la moja kwa moja: fremu ya kwanza ya sehemu iliyochaguliwa (kama hujachagua lako)
  useEffect(() => {
    if (step !== 'details' || !url || coverTouched) return

    let cancelled = false
    const time = Math.min(trimStart + 0.3, Math.max(trimStart, trimEnd - 0.1))

    frameDataUrl(url, time, filterCss).then(data => {
      if (!cancelled && data) setCover(data)
    })

    return () => {
      cancelled = true
    }
  }, [step, url, coverTouched, trimStart, trimEnd, filterCss])

  // Rudi kwenye kamera
  const startOver = () => {
    setFile(null)
    setUrl(null)
    setLoadError('')
    setStep('edit')
  }

  const openPicker = () => {
    if (pickerRef.current) pickerRef.current.click()
  }

  const handleLocalPick = (e) => {
    const picked = e.target.files && e.target.files[0]
    e.target.value = ''
    if (picked) setFile(picked)
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

  // ===== Jalada =====

  const openCoverStep = () => {
    setCoverError('')
    setCoverTime(trimStart)
    setStep('cover')
  }

  const handleCoverSlider = (value) => {
    setCoverTime(value)
    if (coverVideoRef.current) coverVideoRef.current.currentTime = value
  }

  const confirmFrame = async () => {
    const data = await captureFrame(coverVideoRef.current, filterCss)
    if (data) {
      setCover(data)
      setCoverTouched(true)
    }
    setStep('details')
  }

  const handleCoverImage = async (e) => {
    const picked = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!picked) return

    setCoverError('')

    if (!picked.type.startsWith('image/')) {
      setCoverError('Chagua picha (JPG au PNG).')
      return
    }

    try {
      const data = await cropToDataUrl(picked, 270, 480, 0.8)
      setCover(data)
      setCoverTouched(true)
      setStep('details')
    } catch {
      setCoverError('Imeshindwa kusoma picha hii. Jaribu nyingine.')
    }
  }

  // ===== Maelezo =====

  const insertChar = (ch) => {
    setCaption(prev => {
      const spaced = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? `${prev} ` : prev
      return `${spaced}${ch}`.slice(0, 300)
    })
    if (ch === '#') setShowTags(true)
    if (captionRef.current) captionRef.current.focus()
  }

  const addTag = (tag) => {
    setCaption(prev => {
      const base = prev.replace(/#$/, '').trimEnd()
      if (base.includes(tag)) return base
      const next = base ? `${base} ${tag}` : tag
      return next.slice(0, 300)
    })
  }

  const toggleShareApp = (id) => {
    setShareApps(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // ===== Kuchapisha =====

  const handlePublish = async () => {
    if (publishing || !url) return
    setPublishing(true)
    publishedUrlRef.current = url

    const saved = await publishVideo({
      username: '@wewe',
      caption: caption.trim(),
      videoUrl: url,
      likes: 0,
      comments: 0,
      duration,
      trimStart: trimStart > 0.05 ? trimStart : 0,
      trimEnd: durationFixed || trimEnd < duration - 0.05 ? trimEnd : 0,
      filter: filterId,
      allowComments: true,
      cover
    })

    setSavedOk(saved)
    setPublishing(false)
    setStep('done')
  }

  const shareNow = (appId) => {
    const link = `${window.location.origin}${import.meta.env.BASE_URL}`
    const base = caption.trim().slice(0, 80)
    const text = base
      ? `Tazama kipaji changu kwenye TalentFlex: ${base}`
      : 'Tazama kipaji changu kwenye TalentFlex'
    window.open(shareUrl(appId, text, link), '_blank', 'noopener,noreferrer')
  }

  // ===== Skrini =====

  let content

  if (!file) {
    content = (
      <CameraCapture
        onRecorded={setFile}
        onPick={setFile}
        onClose={() => navigate('/')}
      />
    )
  } else if (loadError) {
    content = (
      <>
        <div className="ed-top">
          <button className="ed-icon-btn" onClick={startOver} aria-label="Rudi">
            <BackIcon />
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
            <button className="ed-ghost" onClick={startOver}>
              Rudi kwenye kamera
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
    const chosen = SHARE_APPS.filter(a => shareApps.includes(a.id))

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

        {chosen.length > 0 && (
          <div className="ud-share-now">
            <p className="ud-share-now-title">Shiriki sasa</p>
            <div className="ud-share-now-list">
              {chosen.map(({ id, label, Icon }) => (
                <button key={id} className="ud-share-now-btn" onClick={() => shareNow(id)}>
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="ed-actions">
          <button className="ed-primary" onClick={() => navigate('/')}>
            Tazama Feed
          </button>
          <button className="ed-ghost" onClick={startOver}>
            Pakia nyingine
          </button>
        </div>
      </div>
    )
  } else if (step === 'cover') {
    content = (
      <>
        <div className="ed-top">
          <button
            className="ed-icon-btn"
            onClick={() => setStep('details')}
            aria-label="Rudi"
          >
            <BackIcon />
          </button>
          <h2 className="ed-title">Jalada</h2>
          <span className="ed-top-space" />
        </div>

        <div className="ed-stage">
          <video
            ref={coverVideoRef}
            className="ed-video"
            src={url}
            muted
            playsInline
            preload="auto"
            style={{ filter: filterCss }}
            onLoadedMetadata={(e) => {
              e.currentTarget.currentTime = coverTime
            }}
          />
        </div>

        <div className="ed-panel">
          <div className="ed-trim-info">
            <span>Chagua fremu ya jalada</span>
            <b>{fmt(coverTime - trimStart)}</b>
          </div>

          <div className="ed-trim-row">
            <input
              type="range"
              className="ed-range"
              min={trimStart}
              max={Math.max(trimStart + 0.1, trimEnd - 0.1)}
              step={sliderStep}
              value={coverTime}
              onChange={(e) => handleCoverSlider(Number(e.target.value))}
            />
          </div>

          <button
            className="ed-ghost wide"
            onClick={() => coverImgRef.current && coverImgRef.current.click()}
          >
            Chagua picha kutoka kwenye simu
          </button>

          {coverError && <p className="ed-cover-error">{coverError}</p>}

          <button className="ed-primary" onClick={confirmFrame}>
            Tumia jalada hili
          </button>
        </div>
      </>
    )
  } else if (step === 'details') {
    const pickedApps = SHARE_APPS.filter(a => shareApps.includes(a.id))

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
          <h2 className="ed-title">Chapisha</h2>
          <button
            className="ud-preview-btn"
            onClick={() => setPreview(true)}
            disabled={publishing}
          >
            Hakiki
          </button>
        </div>

        <div className="ed-details">
          <div className="ed-desc-row">
            <button
              type="button"
              className="ed-cover-btn"
              onClick={openCoverStep}
              disabled={publishing}
              aria-label="Hariri jalada"
            >
              {cover ? (
                <img className="ed-thumb" src={cover} alt="Jalada la video" />
              ) : (
                <span className="ed-cover-loading">
                  <span className="ed-spinner" />
                </span>
              )}
              <span className="ed-cover-label">Jalada</span>
            </button>

            <textarea
              ref={captionRef}
              className="ed-textarea"
              placeholder="Andika maelezo marefu husaidia kupata watazamaji zaidi..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={300}
            />
          </div>

          <div className="ud-tools">
            <button
              type="button"
              className="ud-tool"
              onClick={() => insertChar('#')}
              aria-label="Hashtag"
            >
              #
            </button>
            <button
              type="button"
              className="ud-tool"
              onClick={() => insertChar('@')}
              aria-label="Taja mtu"
            >
              @
            </button>
            <span className="ud-count">{caption.length}/300</span>
          </div>

          {showTags && (
            <div className="ed-tags">
              {TAGS.map(tag => (
                <button key={tag} type="button" className="ed-tag" onClick={() => addTag(tag)}>
                  {tag}
                </button>
              ))}
            </div>
          )}

        <div className="ud-share">
            <button
              type="button"
              className="ud-share-row"
              onClick={() => setShareOpen(v => !v)}
            >
              <span className="ud-share-left">
                <ShareIcon />
                <span>Shiriki kwa</span>
              </span>
              <span className="ud-share-right">
                {pickedApps.length > 0 && (
                  <span className="ud-share-picked">
                    {pickedApps.map(({ id, Icon }) => (
                      <Icon key={id} size={17} />
                    ))}
                  </span>
                )}
                <ChevronIcon open={shareOpen} />
              </span>
            </button>

            {shareOpen && (
              <div className="ud-share-apps">
                {SHARE_APPS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={shareApps.includes(id) ? 'ud-app-chip on' : 'ud-app-chip'}
                    onClick={() => toggleShareApp(id)}
                  >
                    <Icon size={20} />
                    {label}
                  </button>
                ))}
              </div>
            )}
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
          <button className="ed-icon-btn" onClick={startOver} aria-label="Rudi kwenye kamera">
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

      {preview && url && step === 'details' && (
        <div className="ud-preview">
          <video
            className="ud-preview-video"
            src={url}
            autoPlay
            loop
            playsInline
            style={{ filter: filterCss }}
            onLoadedMetadata={(e) => {
              e.currentTarget.currentTime = trimStart
            }}
            onTimeUpdate={(e) => {
              const el = e.currentTarget
              if (trimEnd && (el.currentTime >= trimEnd - 0.05 || el.currentTime < trimStart - 0.3)) {
                el.currentTime = trimStart
              }
            }}
          />
          <button
            className="ud-preview-close"
            onClick={() => setPreview(false)}
            aria-label="Funga hakiki"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      <input
        ref={pickerRef}
        type="file"
        accept="video/*"
        hidden
        onChange={handleLocalPick}
      />
      <input
        ref={coverImgRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleCoverImage}
      />
    </div>
  )
}

export default Upload