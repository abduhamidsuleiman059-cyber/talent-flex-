import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { addStatus, STATUS_TTL_MS, TEXT_BACKGROUNDS } from '../utils/statusStore'
import { myHandle } from '../utils/statusAuthor'
import { resizeImageToDataUrl, readVideoDuration } from '../utils/statusMedia'
import '../styles/story.css'

// Muda wa juu wa video ya status (sekunde)
const MAX_VIDEO_S = 30
// Ukubwa wa juu wa video ya status
const MAX_VIDEO_MB = 80

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

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  )
}

function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="9" cy="9" r="1.8" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  )
}

function TextIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  )
}

function StatusCreate() {
  const navigate = useNavigate()

  // choose | media | text
  const [step, setStep] = useState('choose')
  const [media, setMedia] = useState(null)
  const [caption, setCaption] = useState('')
  const [text, setText] = useState('')
  const [bg, setBg] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const camPhotoRef = useRef(null)
  const camVideoRef = useRef(null)
  const galleryRef = useRef(null)

  // Futa link ya video ya awali media ikibadilika au ukiondoka
  useEffect(() => {
    return () => {
      if (media && media.url) URL.revokeObjectURL(media.url)
    }
  }, [media])

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return

    setError('')
    setBusy(true)

    try {
      if (file.type.startsWith('image/')) {
        const dataUrl = await resizeImageToDataUrl(file, 900, 0.76)
        setMedia({ kind: 'photo', dataUrl })
        setStep('media')
      } else if (file.type.startsWith('video/')) {
        if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
          setError(`Video ni kubwa mno. Ukubwa wa juu ni MB ${MAX_VIDEO_MB}.`)
        } else {
          const duration = await readVideoDuration(file)
          if (duration > MAX_VIDEO_S) {
            setError(
              `Video ni ndefu (sekunde ${Math.round(duration)}). Status ya video isizidi sekunde ${MAX_VIDEO_S}.`
            )
          } else {
            setMedia({ kind: 'video', file, url: URL.createObjectURL(file), duration })
            setStep('media')
          }
        }
      } else {
        setError('Chagua picha au video.')
      }
    } catch {
      setError('Imeshindwa kusoma faili hili. Jaribu lingine.')
    }

    setBusy(false)
  }

  const backToChoose = () => {
    setStep('choose')
    setMedia(null)
    setCaption('')
    setError('')
  }

  const publish = async () => {
    if (busy) return
    setError('')

    const now = Date.now()
    const base = {
      id: `s${now}${Math.random().toString(36).slice(2, 6)}`,
      author: myHandle(),
      caption: caption.trim(),
      createdAt: now,
      expiresAt: now + STATUS_TTL_MS,
      views: [],
      likes: [],
      comments: []
    }

    let item
    let blob = null

    if (step === 'text') {
      if (!text.trim()) {
        setError('Andika maandishi kwanza.')
        return
      }
      item = { ...base, caption: '', type: 'text', text: text.trim(), bg }
    } else if (media && media.kind === 'photo') {
      item = { ...base, type: 'photo', image: media.dataUrl }
    } else if (media && media.kind === 'video') {
      item = { ...base, type: 'video', duration: media.duration }
      blob = media.file
    } else {
      return
    }

    setBusy(true)
    const ok = await addStatus(item, blob)
    setBusy(false)

    if (ok) {
      navigate('/messages')
    } else {
      setError('Imeshindwa kuhifadhi status. Nafasi ya kivinjari inaweza kuwa imejaa.')
    }
  }

  return (
    <div className="sc-root">
      {step === 'choose' && (
        <>
          <div className="sc-top">
            <button className="sc-icon-btn" onClick={() => navigate('/messages')} aria-label="Funga">
              <CloseIcon />
            </button>
            <h2 className="sc-title">Status mpya</h2>
            <span className="sc-space" />
          </div>

          <div className="sc-choose">
            <button className="sc-card" onClick={() => camPhotoRef.current && camPhotoRef.current.click()}>
              <CameraIcon />
              Piga picha
            </button>
            <button className="sc-card" onClick={() => camVideoRef.current && camVideoRef.current.click()}>
              <VideoIcon />
              Rekodi video
            </button>
            <button className="sc-card" onClick={() => galleryRef.current && galleryRef.current.click()}>
              <GalleryIcon />
              Kutoka kwenye simu
            </button>
            <button className="sc-card" onClick={() => setStep('text')}>
              <TextIcon />
              Maandishi
            </button>
          </div>

          {busy && <p className="sc-loading">Inasoma faili...</p>}
          {error && <p className="sc-error">{error}</p>}

          <input
            ref={camPhotoRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={handleFile}
          />
          <input
            ref={camVideoRef}
            type="file"
            accept="video/*"
            capture="environment"
            hidden
            onChange={handleFile}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={handleFile}
          />
        </>
      )}

      {step === 'media' && media && (
        <>
          <div className="sc-top">
            <button className="sc-icon-btn" onClick={backToChoose} aria-label="Rudi">
              <BackIcon />
            </button>
            <h2 className="sc-title">Status</h2>
            <span className="sc-space" />
          </div>

          <div className="sc-preview">
            {media.kind === 'photo' ? (
              <img src={media.dataUrl} alt="" />
            ) : (
              <video src={media.url} autoPlay loop muted playsInline />
            )}
          </div>

          {error && <p className="sc-error">{error}</p>}

          <div className="sc-bar">
            <input
              className="sc-input"
              type="text"
              placeholder="Ongeza maelezo..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={120}
            />
            <button className="sc-post" onClick={publish} disabled={busy}>
              {busy ? 'Subiri...' : 'Chapisha'}
            </button>
          </div>
        </>
      )}

      {step === 'text' && (
        <>
          <div className="sc-top">
            <button className="sc-icon-btn" onClick={backToChoose} aria-label="Rudi">
              <BackIcon />
            </button>
            <h2 className="sc-title">Maandishi</h2>
            <span className="sc-space" />
          </div>

          <div
            className="sc-text-stage"
            style={{ background: TEXT_BACKGROUNDS[bg] }}
          >
            <textarea
              className="sc-textarea"
              placeholder="Andika kitu..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={200}
              rows={5}
              autoFocus
            />
          </div>

          <div className="sc-swatches">
            {TEXT_BACKGROUNDS.map((gradient, i) => (
              <button
                key={gradient}
                className={bg === i ? 'sc-swatch active' : 'sc-swatch'}
                style={{ background: gradient }}
                onClick={() => setBg(i)}
                aria-label={`Rangi ${i + 1}`}
              />
            ))}
          </div>

          {error && <p className="sc-error">{error}</p>}

          <div className="sc-bar">
            <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
              {text.length}/200
            </span>
            <button className="sc-post" onClick={publish} disabled={busy}>
              {busy ? 'Subiri...' : 'Chapisha'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default StatusCreate